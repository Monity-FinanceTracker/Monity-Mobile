import express from "express";
import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";
import { validateStripeWebhook, getStripeSubscription } from "../config/stripe";

const router = express.Router();

// Middleware para processar webhook do Stripe
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  
  if (!sig) {
    logger.error("Missing Stripe signature header");
    return res.status(400).send("Missing Stripe signature");
  }

  try {
    // Validar webhook
    const event = validateStripeWebhook(req.body, sig);
    
    logger.info("Stripe webhook received", { 
      type: event.type, 
      id: event.id,
      created: event.created 
    });

    switch (event.type) {
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      default:
        logger.info("Unhandled webhook event type", { type: event.type, id: event.id });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Webhook signature verification failed", { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(400).send(`Webhook signature verification failed: ${error}`);
  }
});

// Handler para pagamento de invoice bem-sucedido
async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      logger.warn("Invoice payment succeeded but no subscription found", { invoiceId: invoice.id });
      return;
    }

    // Obter subscription do Stripe
    const subscription = await getStripeSubscription(subscriptionId);
    
    // Encontrar usuário pelo customer ID
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, subscription_tier")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (error || !profile) {
      logger.error("User not found for subscription", { 
        subscriptionId, 
        customerId: subscription.customer,
        error 
      });
      return;
    }

    // Atualizar subscription no banco
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "premium",
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id);

    if (updateError) {
      logger.error("Failed to update subscription after payment", { 
        userId: profile.id, 
        subscriptionId,
        error: updateError 
      });
      return;
    }

    logger.info("Subscription renewed successfully", { 
      userId: profile.id, 
      subscriptionId,
      periodEnd: subscription.current_period_end 
    });
  } catch (error) {
    logger.error("Error handling invoice payment succeeded", { error });
  }
}

// Handler para pagamento de invoice falhado
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      logger.warn("Invoice payment failed but no subscription found", { invoiceId: invoice.id });
      return;
    }

    // Obter subscription do Stripe
    const subscription = await getStripeSubscription(subscriptionId);
    
    // Encontrar usuário pelo customer ID
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, subscription_tier")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (error || !profile) {
      logger.error("User not found for failed payment", { 
        subscriptionId, 
        customerId: subscription.customer,
        error 
      });
      return;
    }

    logger.warn("Subscription payment failed", { 
      userId: profile.id, 
      subscriptionId,
      invoiceId: invoice.id 
    });

    // Aqui você pode implementar lógica adicional como:
    // - Enviar email de notificação
    // - Tentar cobrança novamente
    // - Suspender temporariamente o acesso
  } catch (error) {
    logger.error("Error handling invoice payment failed", { error });
  }
}

// Handler para subscription cancelada
async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Encontrar usuário pelo customer ID
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, subscription_tier")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (error || !profile) {
      logger.error("User not found for cancelled subscription", { 
        subscriptionId: subscription.id, 
        customerId: subscription.customer,
        error 
      });
      return;
    }

    // Atualizar subscription no banco
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_expires_at: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id);

    if (updateError) {
      logger.error("Failed to update subscription after cancellation", { 
        userId: profile.id, 
        subscriptionId: subscription.id,
        error: updateError 
      });
      return;
    }

    logger.info("Subscription cancelled successfully", { 
      userId: profile.id, 
      subscriptionId: subscription.id 
    });
  } catch (error) {
    logger.error("Error handling subscription deleted", { error });
  }
}

// Handler para subscription atualizada
async function handleSubscriptionUpdated(subscription: any) {
  try {
    // Encontrar usuário pelo customer ID
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, subscription_tier")
      .eq("stripe_customer_id", subscription.customer)
      .single();

    if (error || !profile) {
      logger.error("User not found for updated subscription", { 
        subscriptionId: subscription.id, 
        customerId: subscription.customer,
        error 
      });
      return;
    }

    // Atualizar subscription no banco baseado no status
    let subscriptionTier = "free";
    let expiresAt = null;

    if (subscription.status === "active") {
      subscriptionTier = "premium";
      expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: subscriptionTier,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id);

    if (updateError) {
      logger.error("Failed to update subscription after status change", { 
        userId: profile.id, 
        subscriptionId: subscription.id,
        status: subscription.status,
        error: updateError 
      });
      return;
    }

    logger.info("Subscription updated successfully", { 
      userId: profile.id, 
      subscriptionId: subscription.id,
      status: subscription.status 
    });
  } catch (error) {
    logger.error("Error handling subscription updated", { error });
  }
}

export default router;
