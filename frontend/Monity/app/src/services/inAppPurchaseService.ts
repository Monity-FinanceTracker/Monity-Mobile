import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { apiService } from './apiService';

// Import condicional do react-native-iap (não funciona no Expo Go)
let RNIap: any = null;
try {
  // Só importa se não estiver no Expo Go
  if (!Constants.executionEnvironment || Constants.executionEnvironment === 'standalone' || Constants.executionEnvironment === 'bare') {
    RNIap = require('react-native-iap');
  }
} catch (error) {
  console.warn('react-native-iap não disponível (normal no Expo Go):', error);
}

// Product IDs - devem corresponder aos IDs configurados nas stores
const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com_monity_premium_monthly', // ID configurado nas stores
};

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

class InAppPurchaseService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized: boolean = false;
  private availableProducts: any[] = [];

  /**
   * Verifica se o serviço está disponível
   */
  private isAvailable(): boolean {
    if (!RNIap) {
      console.warn('⚠️ react-native-iap não está disponível. É necessário um build nativo (não funciona no Expo Go).');
      return false;
    }
    return true;
  }

  /**
   * Inicializa a conexão com as stores
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      if (this.isInitialized) {
        return true;
      }

      // Conectar com a store
      await RNIap.initConnection();
      
      // Configurar listeners para atualizações de compra
      this.setupPurchaseListeners();
      
      this.isInitialized = true;
      console.log('✅ In-App Purchase service initialized');
      return true;
    } catch (error: any) {
      console.error('❌ Error initializing In-App Purchase service:', error);
      Alert.alert(
        'Erro no Serviço de Pagamento',
        'Não foi possível inicializar o serviço de pagamentos. Por favor, tente novamente mais tarde.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Configura listeners para eventos de compra
   */
  private setupPurchaseListeners() {
    if (!RNIap) {
      return;
    }

    // Listener para atualizações de compra (sucesso)
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: any) => {
        console.log('📦 Purchase updated:', purchase);
        await this.handlePurchase(purchase);
      }
    );

    // Listener para erros de compra
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: any) => {
        console.error('❌ Purchase error:', error);
        this.handlePurchaseError(error);
      }
    );
  }

  /**
   * Busca assinaturas disponíveis nas stores
   */
  async getAvailableProducts(): Promise<any[]> {
    try {
      if (!this.isAvailable()) {
        return [];
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const productIds = Object.values(PRODUCT_IDS).filter(Boolean) as string[];

      if (productIds.length === 0) {
        console.warn('⚠️ No product IDs configured');
        return [];
      }

      // Para assinaturas, usar getSubscriptions ao invés de getProducts
      const products = await RNIap.getSubscriptions(productIds);
      this.availableProducts = products;

      console.log('📦 Available subscriptions:', products);
      return products;
    } catch (error: any) {
      console.error('❌ Error fetching subscriptions:', error);
      Alert.alert(
        'Erro ao Carregar Planos',
        'Não foi possível carregar os planos de assinatura. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
      return [];
    }
  }

  /**
   * Obtém informações do produto premium
   */
  async getPremiumProduct(): Promise<any | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const products = await this.getAvailableProducts();
    const premiumId = PRODUCT_IDS.PREMIUM_MONTHLY;
    
    return products.find((p: any) => p.productId === premiumId) || null;
  }

  /**
   * Inicia o processo de compra
   */
  async purchasePremium(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Falha ao inicializar serviço de pagamento',
          };
        }
      }

      const productId = PRODUCT_IDS.PREMIUM_MONTHLY;
      
      if (!productId) {
        return {
          success: false,
          error: 'Produto não configurado para esta plataforma',
        };
      }

      // Verificar se o produto está disponível
      const product = await this.getPremiumProduct();
      if (!product) {
        return {
          success: false,
          error: 'Produto não encontrado na store. Verifique a configuração.',
        };
      }

      console.log('🛒 Iniciando compra da assinatura:', productId);

      // Iniciar o fluxo de compra de assinatura
      await RNIap.requestSubscription({
        sku: productId,
      });

      // O resultado será processado pelo listener purchaseUpdatedListener
      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Error purchasing premium:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar compra',
      };
    }
  }

  /**
   * Processa uma compra concluída
   */
  private async handlePurchase(purchase: any) {
    try {
      console.log('🔄 Processing purchase:', purchase);

      // Validar a compra no backend
      const validationResult = await this.validatePurchase(purchase);

      if (validationResult.success) {
        // Finalizar a transação na store
        if (purchase.transactionReceipt && RNIap) {
          try {
            await RNIap.finishTransaction({
              purchase,
              isConsumable: false, // Assinaturas não são consumíveis
            });
          } catch (finishError) {
            console.error('❌ Error finishing transaction:', finishError);
            // Transaction was validated successfully, just log the finish error
            // Don't show alert to user since the purchase was successful
          }
        }

        Alert.alert(
          'Sucesso!',
          'Assinatura premium ativada com sucesso!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erro',
          validationResult.error || 'Falha ao validar compra',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error handling purchase:', error);
      Alert.alert('Erro', 'Falha ao processar compra');
    }
  }

  /**
   * Valida a compra no backend
   */
  private async validatePurchase(purchase: any): Promise<PurchaseResult> {
    try {
      // Preparar dados para validação
      const purchaseData = {
        platform: Platform.OS,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        purchaseToken: (purchase as any).purchaseToken, // Android
        originalTransactionIdentifierIOS: (purchase as any).originalTransactionIdentifierIOS, // iOS
      };

      // Enviar para o backend validar
      const response = await apiService.validateInAppPurchase(purchaseData);

      if (response.success) {
        return {
          success: true,
          transactionId: purchase.transactionId,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Falha na validação',
        };
      }
    } catch (error: any) {
      console.error('❌ Error validating purchase:', error);
      return {
        success: false,
        error: error.message || 'Erro ao validar compra',
      };
    }
  }

  /**
   * Trata erros de compra
   */
  private handlePurchaseError(error: any) {
    let errorMessage = 'Erro ao processar compra';

    switch (error.code) {
      case 'E_USER_CANCELLED':
        errorMessage = 'Compra cancelada pelo usuário';
        break;
      case 'E_NETWORK_ERROR':
        errorMessage = 'Erro de conexão. Verifique sua internet.';
        break;
      case 'E_SERVICE_ERROR':
        errorMessage = 'Erro no serviço da store. Tente novamente.';
        break;
      case 'E_ITEM_UNAVAILABLE':
        errorMessage = 'Produto não disponível';
        break;
      default:
        errorMessage = error.message || 'Erro desconhecido';
    }

    Alert.alert('Erro na Compra', errorMessage);
  }

  /**
   * Restaura compras anteriores
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'Serviço de pagamento não disponível. É necessário um build nativo.',
        };
      }

      console.log('🔄 Restoring purchases...');
      
      const purchases = await RNIap.getAvailablePurchases();
      
      if (purchases.length === 0) {
        return {
          success: false,
          error: 'Nenhuma compra anterior encontrada',
        };
      }

      // Processar cada compra restaurada
      for (const purchase of purchases) {
        if (purchase.productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
          await this.handlePurchase(purchase);
        }
      }

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Error restoring purchases:', error);
      return {
        success: false,
        error: error.message || 'Erro ao restaurar compras',
      };
    }
  }

  /**
   * Verifica se o usuário tem uma assinatura ativa
   */
  async checkActiveSubscription(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchases = await RNIap.getAvailablePurchases();
      const premiumPurchase = purchases.find(
        (p: any) => p.productId === PRODUCT_IDS.PREMIUM_MONTHLY
      );

      return !!premiumPurchase;
    } catch (error) {
      console.error('❌ Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Limpa recursos e desconecta da store
   */
  async cleanup() {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      if (this.isInitialized && RNIap) {
        await RNIap.endConnection();
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('❌ Error cleaning up In-App Purchase service:', error);
    }
  }
}

// Exportar instância singleton
export const inAppPurchaseService = new InAppPurchaseService();
export default inAppPurchaseService;

