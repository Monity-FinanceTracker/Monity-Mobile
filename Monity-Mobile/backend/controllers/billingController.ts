import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";
import { 
  createStripeCustomer,
  stripe,
  STRIPE_CONFIG,
  isStripeEnabled,
  getStripeSubscription
} from "../config/stripe";
import type { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export default class BillingController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  private _ensureStripeAvailable() {
    if (!stripe) {
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
    }
  }

  // Obter ou criar customer ID no Stripe
  async getOrCreateStripeCustomerId(userId: string, email: string): Promise<string> {
    this._ensureStripeAvailable();
    
    // 1. Buscar customer ID existente no banco de dados
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      throw new Error("User profile not found.");
    }

    // 2. Se já existe um customer ID, retornar
    if (profile.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // 3. Criar novo cliente no Stripe
    const customer = await stripe!.customers.create({
      email,
      metadata: { supabase_user_id: userId },
    });

    // 4. Salvar o customer ID no banco de dados
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);

    return customer.id;
  }

  // Criar sessão de checkout
  createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
    const { priceId } = req.body;
    const user = req.user;

    if (!user || !user.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      this._ensureStripeAvailable();

      // 1. Obter ou criar customer ID
      const customerId = await this.getOrCreateStripeCustomerId(
        user.id,
        user.email
      );

      // 2. Usar priceId do body ou o padrão configurado
      const finalPriceId = priceId || STRIPE_CONFIG.PREMIUM_PRICE_ID;

      if (!finalPriceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      // 3. Criar sessão de checkout
      const session = await stripe!.checkout.sessions.create({
        payment_method_types: ["card"],
        billing_address_collection: "auto",
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.CLIENT_URL || 'https://yourapp.com'}/subscription?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || 'https://yourapp.com'}/subscription?canceled=true`,
        customer: customerId,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      logger.info("Checkout session created", {
        sessionId: session.id,
        userId: user.id,
        customerId
      });

      res.json({ url: session.url });
    } catch (error) {
      logger.error("Error creating checkout session", { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create checkout session' });
    }
  };

  // Criar sessão do portal de faturamento
  createBillingPortalSession = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    try {
      this._ensureStripeAvailable();

      // Obter customer ID
      const customerId = await this.getOrCreateStripeCustomerId(
        user.id,
        user.email
      );

      // Criar sessão do portal
      const session = await stripe!.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.CLIENT_URL || 'https://yourapp.com'}/subscription`,
      });

      logger.info("Billing portal session created", {
        sessionId: session.id,
        userId: user.id,
        customerId
      });

      res.json({ url: session.url });
    } catch (error) {
      logger.error("Error creating billing portal session", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create portal session' });
    }
  };

  // Manipular webhook do Stripe
  handleWebhook = async (req: Request, res: Response) => {
    if (!isStripeEnabled) {
      logger.warn("Stripe webhook received but Stripe is not configured");
      return res.status(503).json({ error: "Payment system is not available" });
    }

    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = STRIPE_CONFIG.WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      logger.error("Missing Stripe signature or webhook secret");
      return res.status(400).send("Webhook signature verification failed");
    }

    let event;

    try {
      // Validar assinatura do webhook
      event = stripe!.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed", {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    logger.info("Processing webhook event", {
      type: event.type,
      id: event.id
    });

    // Processar diferentes tipos de eventos
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.handleSubscriptionChange(event.data.object);
          break;

        case "customer.subscription.deleted":
        case "invoice.payment_failed":
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        default:
          logger.info("Unhandled webhook event type", { 
            type: event.type,
            id: event.id 
          });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error("Error processing webhook event", {
        type: event.type,
        id: event.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: "Webhook processing failed" });
    }
  };

  // Handler para checkout completo
  private async handleCheckoutSessionCompleted(checkoutSession: any) {
    const { metadata: { supabase_user_id } = {}, subscription } = checkoutSession;

    logger.info("Processing checkout.session.completed", {
      sessionId: checkoutSession.id,
      userId: supabase_user_id,
      subscriptionId: subscription
    });

    if (subscription && supabase_user_id) {
      // Atualizar assinatura do usuário
      await this.handleSubscriptionChangeInternal(supabase_user_id, subscription);
    }
  }

  // Handler para mudanças na assinatura
  private async handleSubscriptionChange(subscriptionObject: any) {
    const customerId = subscriptionObject.customer;

    logger.info("Processing subscription change", {
      subscriptionId: subscriptionObject.id,
      customerId,
      status: subscriptionObject.status
    });

    // Buscar usuário pelo customer ID
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await this.handleSubscriptionChangeInternal(profile.id, subscriptionObject.id);
    } else {
      logger.warn("User not found for subscription", {
        customerId,
        subscriptionId: subscriptionObject.id
      });
    }
  }

  // Método interno para atualizar assinatura
  private async handleSubscriptionChangeInternal(userId: string, subscriptionId: string) {
    try {
      // Recuperar assinatura do Stripe
      const subscription = await getStripeSubscription(subscriptionId);

      // Determinar tier e status
      const newStatus = subscription.status;
      const newTier = (newStatus === "active" || newStatus === "trialing") 
        ? "premium" 
        : "free";

      // Extrair price ID
      const priceId = subscription.items.data[0]?.price?.id || null;

      // Calcular período de término
      let currentPeriodEnd = null;
      if (subscription.current_period_end && typeof subscription.current_period_end === "number") {
        currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }

      // Atualizar banco de dados
      const updateData: any = {
        subscription_tier: newTier,
        stripe_subscription_id: subscription.id,
        subscription_expires_at: currentPeriodEnd,
      };

      // Adicionar campos opcionais apenas se existirem na tabela
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) {
        throw error;
      }

      logger.info("Subscription updated successfully", {
        userId,
        tier: newTier,
        status: newStatus,
        subscriptionId
      });
    } catch (error) {
      logger.error("Error updating subscription", {
        userId,
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Handler para assinatura cancelada
  private async handleSubscriptionDeleted(subscription: any) {
    const customerId = subscription.customer;

    logger.info("Processing subscription deletion", {
      subscriptionId: subscription.id,
      customerId
    });

    // Buscar usuário pelo customer ID
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      // Reverter para free tier
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "free",
          stripe_subscription_id: null,
          subscription_expires_at: null,
        })
        .eq("id", profile.id);

      logger.info("Subscription cancelled and user reverted to free", {
        userId: profile.id,
        subscriptionId: subscription.id
      });
    }
  }

  // Handler para pagamento de invoice bem-sucedido
  private async handleInvoicePaymentSucceeded(invoice: any) {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      logger.warn("Invoice payment succeeded but no subscription found", {
        invoiceId: invoice.id
      });
      return;
    }

    try {
      // Obter subscription do Stripe
      const subscription = await getStripeSubscription(subscriptionId);
      
      // Buscar usuário pelo customer ID
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, subscription_tier")
        .eq("stripe_customer_id", subscription.customer)
        .single();

      if (profile) {
        // Atualizar subscription no banco
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: "premium",
            subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", profile.id);

        if (!error) {
          logger.info("Subscription renewed successfully", {
            userId: profile.id,
            subscriptionId,
            periodEnd: subscription.current_period_end
          });
        }
      }
    } catch (error) {
      logger.error("Error handling invoice payment succeeded", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

