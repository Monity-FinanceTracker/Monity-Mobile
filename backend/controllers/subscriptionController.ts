import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";
import type { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import axios from "axios";

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
    const { planId } = req.body;

    try {
      // Validações de entrada
      if (planId !== "premium") {
        logger.warn("Invalid plan selected", { userId, planId });
        return res.status(400).json({ 
          success: false, 
          error: "Invalid plan selected" 
        });
      }

      // Verificar se o usuário já tem uma subscription ativa
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("subscription_tier")
        .eq("id", userId)
        .single();

      if (existingProfile?.subscription_tier === "premium") {
        logger.warn("User already has premium subscription", { userId });
        return res.status(400).json({ 
          success: false, 
          error: "User already has an active premium subscription" 
        });
      }

      // Simular assinatura - definir expiração para 1 mês
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Atualizar perfil do usuário no banco
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "premium",
          subscription_expires_at: expiresAt.toISOString(),
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
        periodEnd: expiresAt.toISOString()
      });

      res.json({ 
        success: true, 
        data: {
          subscription: {
            id: `sub_${Date.now()}`,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: expiresAt.toISOString(),
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
        .select("subscription_tier")
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

      // Atualizar perfil do usuário para free
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      logger.info("User subscription cancelled", { 
        userId
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

  /**
   * Valida uma compra in-app do Google Play ou App Store
   */
  async validatePurchase(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { 
      platform, 
      productId, 
      transactionId, 
      transactionReceipt, 
      purchaseToken,
      originalTransactionIdentifierIOS 
    } = req.body;

    try {
      // Validações básicas
      if (!platform || !productId) {
        return res.status(400).json({
          success: false,
          error: "Platform and productId are required"
        });
      }

      if (platform === "android" && !purchaseToken) {
        return res.status(400).json({
          success: false,
          error: "purchaseToken is required for Android"
        });
      }

      if (platform === "ios" && !transactionReceipt) {
        return res.status(400).json({
          success: false,
          error: "transactionReceipt is required for iOS"
        });
      }

      // Validar a compra na store correspondente
      let isValid = false;
      let purchaseData: any = null;

      if (platform === "android") {
        const validationResult = await this.validateGooglePlayPurchase(
          purchaseToken,
          productId
        );
        isValid = validationResult.isValid;
        purchaseData = validationResult.data;
      } else if (platform === "ios") {
        const validationResult = await this.validateAppStorePurchase(
          transactionReceipt,
          productId
        );
        isValid = validationResult.isValid;
        purchaseData = validationResult.data;
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid platform. Must be 'android' or 'ios'"
        });
      }

      if (!isValid) {
        logger.warn("Invalid purchase validation", {
          userId,
          platform,
          productId,
          transactionId
        });
        return res.status(400).json({
          success: false,
          error: "Invalid purchase. Purchase could not be verified."
        });
      }

      // Verificar se o usuário já tem uma subscription ativa
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("subscription_tier, subscription_expires_at")
        .eq("id", userId)
        .single();

      // Calcular data de expiração (1 mês a partir de agora)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Se já tem premium, apenas atualizar a data de expiração
      if (existingProfile?.subscription_tier === "premium") {
        // Atualizar apenas a data de expiração
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (updateError) {
          throw updateError;
        }

        logger.info("Premium subscription renewed", {
          userId,
          transactionId,
          expiresAt: expiresAt.toISOString()
        });
      } else {
        // Ativar premium pela primeira vez
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: "premium",
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (updateError) {
          throw updateError;
        }

        logger.info("User upgraded to premium via in-app purchase", {
          userId,
          platform,
          productId,
          transactionId,
          expiresAt: expiresAt.toISOString()
        });
      }

      res.json({
        success: true,
        data: {
          subscription: {
            id: transactionId || `sub_${Date.now()}`,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: expiresAt.toISOString(),
          },
          message: "Assinatura premium ativada com sucesso!"
        }
      });
    } catch (error) {
      logger.error("Failed to validate purchase", {
        userId,
        platform,
        productId,
        error: error as Error["message"],
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: "Failed to validate purchase"
      });
    }
  }

  /**
   * Valida uma compra do Google Play
   */
  private async validateGooglePlayPurchase(
    purchaseToken: string,
    productId: string
  ): Promise<{ isValid: boolean; data?: any }> {
    try {
      // Validação básica - verificar se o token existe
      if (!purchaseToken || purchaseToken.length < 10) {
        return { isValid: false };
      }

      // Verificar se as credenciais estão configuradas
      const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
      const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.widechain.monity';

      if (!serviceAccountJson) {
        logger.warn("Google Play Service Account JSON not configured - using basic validation");
        return { isValid: true }; // Permitir testes sem validação real
      }

      // Parse do JSON da variável de ambiente
      let credentials;
      try {
        credentials = typeof serviceAccountJson === 'string' 
          ? JSON.parse(serviceAccountJson) 
          : serviceAccountJson;
      } catch (parseError) {
        logger.error("Error parsing GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", {
          error: parseError as Error["message"]
        });
        return { isValid: false };
      }

      // Configurar autenticação usando as credenciais
      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      const androidpublisher = google.androidpublisher({
        version: 'v3',
        auth,
      });

      // Validar a compra com a API do Google Play
      const result = await androidpublisher.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      // Verificar o estado do pagamento
      // paymentState: 0 = Payment pending, 1 = Payment received, 2 = Free trial, 3 = Pending deferred upgrade/downgrade
      const isValid = result.data.paymentState === 1 || result.data.paymentState === 2;

      logger.info("Google Play purchase validation result", {
        productId,
        paymentState: result.data.paymentState,
        isValid,
        expiryTimeMillis: result.data.expiryTimeMillis,
      });

      return {
        isValid,
        data: result.data
      };
    } catch (error: any) {
      logger.error("Error validating Google Play purchase", {
        error: error?.message || error,
        stack: error?.stack
      });
      
      // Se for erro de autenticação, retornar inválido
      // Se for erro de rede/API, logar mas permitir (pode ser temporário)
      if (error?.code === 401 || error?.code === 403) {
        return { isValid: false };
      }
      
      // Para outros erros, retornar inválido por segurança
      return { isValid: false };
    }
  }

  /**
   * Valida uma compra da App Store
   */
  private async validateAppStorePurchase(
    transactionReceipt: string,
    productId: string
  ): Promise<{ isValid: boolean; data?: any }> {
    try {
      // Para validação real, você precisa validar com a App Store
      // Por enquanto, vamos fazer uma validação básica

      // Validação básica - verificar se o receipt existe
      if (!transactionReceipt || transactionReceipt.length < 10) {
        return { isValid: false };
      }

      // Em produção, você deve validar com a App Store:
      /*
      const isProduction = process.env.NODE_ENV === 'production';
      const verifyURL = isProduction
        ? 'https://buy.itunes.apple.com/verifyReceipt'
        : 'https://sandbox.itunes.apple.com/verifyReceipt';

      const sharedSecret = process.env.APP_STORE_SHARED_SECRET;

      const response = await axios.post(verifyURL, {
        'receipt-data': transactionReceipt,
        password: sharedSecret,
        'exclude-old-transactions': true,
      });

      const { status, receipt } = response.data;

      if (status !== 0) {
        return { isValid: false };
      }

      // Verificar se o produto está no receipt
      const inAppPurchases = receipt.in_app || [];
      const purchase = inAppPurchases.find(
        (p: any) => p.product_id === productId
      );

      return {
        isValid: !!purchase,
        data: purchase
      };
      */

      // Por enquanto, retornar true para permitir testes
      // REMOVER ISSO EM PRODUÇÃO e implementar validação real acima
      logger.warn("App Store purchase validation not fully implemented - using basic check");
      return { isValid: true };
    } catch (error) {
      logger.error("Error validating App Store purchase", {
        error: error as Error["message"]
      });
      return { isValid: false };
    }
  }
}

// Export is already handled by export default class
