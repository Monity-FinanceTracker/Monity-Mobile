import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";
import { 
  createStripeCustomer, 
  createStripeSubscription, 
  cancelStripeSubscription,
  STRIPE_CONFIG 
} from "../config/stripe";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

export default class SubscriptionController {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getSubscriptionTier(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("subscription_tier, subscription_expires_at")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: "User profile not found" });
      }

      res.json({ 
        subscription_tier: data.subscription_tier || "free",
        subscription_expires_at: data.subscription_expires_at,
        is_premium: data.subscription_tier === "premium"
      });
    } catch (error) {
      logger.error("Failed to get subscription tier for user", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to fetch subscription tier" });
    }
  }

  async getSubscriptionPlans(req: Request, res: Response) {
    try {
      const plans = [
        {
          id: "free",
          name: "Gratuito",
          price: 0,
          currency: "BRL",
          interval: "month",
          features: [
            "Até 50 transações por mês",
            "Categorização básica",
            "Relatórios simples",
            "Suporte por email"
          ],
          limitations: [
            "Sem IA para categorização",
            "Sem projeções financeiras",
            "Sem exportação avançada",
            "Sem backup na nuvem"
          ]
        },
        {
          id: "premium",
          name: "Premium",
          price: 9.90,
          currency: "BRL",
          interval: "month",
          features: [
            "Transações ilimitadas",
            "IA para categorização automática",
            "Projeções financeiras avançadas",
            "Relatórios detalhados",
            "Exportação completa de dados",
            "Backup automático na nuvem",
            "Suporte prioritário",
            "Temas personalizados"
          ],
          popular: true
        }
      ];

      res.json({ success: true, data: plans });
    } catch (error) {
      logger.error("Failed to get subscription plans", {
        error: error as Error["message"],
      });
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  }

  async createSubscription(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { planId, paymentMethodId } = req.body;

    try {
      // Validações de entrada
      if (planId !== "premium") {
        logger.warn("Invalid plan selected", { userId, planId });
        return res.status(400).json({ 
          success: false, 
          error: "Invalid plan selected" 
        });
      }

      if (!paymentMethodId) {
        logger.warn("Payment method missing", { userId });
        return res.status(400).json({ 
          success: false, 
          error: "Payment method is required" 
        });
      }

      // Verificar se o usuário já tem uma subscription ativa
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("subscription_tier, stripe_customer_id, stripe_subscription_id")
        .eq("id", userId)
        .single();

      if (existingProfile?.subscription_tier === "premium") {
        logger.warn("User already has premium subscription", { userId });
        return res.status(400).json({ 
          success: false, 
          error: "User already has an active premium subscription" 
        });
      }

      let customerId = existingProfile?.stripe_customer_id;

      // Criar customer no Stripe se não existir
      if (!customerId) {
        logger.info("Creating new Stripe customer", { userId, email: req.user.email });
        const customer = await createStripeCustomer(req.user.email, userId);
        customerId = customer.id;
      } else {
        logger.info("Using existing Stripe customer", { userId, customerId });
      }

      // Criar subscription no Stripe
      logger.info("Creating Stripe subscription", { userId, customerId, paymentMethodId });
      const subscription = await createStripeSubscription(
        customerId,
        paymentMethodId,
        STRIPE_CONFIG.PREMIUM_PRICE_ID
      );

      // Atualizar perfil do usuário no banco
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "premium",
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateError) {
        logger.error("Failed to update user profile after subscription creation", { 
          userId, 
          error: updateError 
        });
        throw updateError;
      }

      logger.info("User upgraded to premium successfully", { 
        userId, 
        planId, 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        periodEnd: subscription.current_period_end
      });

      res.json({ 
        success: true, 
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          },
          message: "Assinatura premium ativada com sucesso!"
        }
      });
    } catch (error) {
      logger.error("Failed to create subscription", {
        userId,
        planId,
        error: error as Error["message"],
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ 
        success: false, 
        error: "Failed to create subscription" 
      });
    }
  }

  async cancelSubscription(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;

    try {
      // Obter dados da subscription do usuário
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("subscription_tier, stripe_subscription_id")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile.subscription_tier !== "premium") {
        return res.status(400).json({ 
          success: false, 
          error: "User does not have an active premium subscription" 
        });
      }

      // Cancelar subscription no Stripe se existir
      if (profile.stripe_subscription_id) {
        await cancelStripeSubscription(profile.stripe_subscription_id);
      }

      // Atualizar perfil do usuário para free
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_expires_at: null,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      logger.info("User subscription cancelled", { 
        userId, 
        stripeSubscriptionId: profile.stripe_subscription_id 
      });

      res.json({ 
        success: true, 
        data: {
          message: "Assinatura cancelada com sucesso!"
        }
      });
    } catch (error) {
      logger.error("Failed to cancel subscription", {
        userId,
        error: error as Error["message"],
      });
      res.status(500).json({ 
        success: false, 
        error: "Failed to cancel subscription" 
      });
    }
  }
}

// Export is already handled by export default class
