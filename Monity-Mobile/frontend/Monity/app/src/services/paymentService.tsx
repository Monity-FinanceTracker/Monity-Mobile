import React from 'react';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { apiService } from './apiService';

// Configuração do Stripe para produção
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || '';

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('STRIPE_PUBLISHABLE_KEY não está configurada');
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private stripe: any = null;

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Inicializar Stripe
  initializeStripe(stripeInstance: any) {
    this.stripe = stripeInstance;
  }

  // Getter para acessar o Stripe
  getStripe() {
    return this.stripe;
  }

  // Criar método de pagamento
  async createPaymentMethod(cardDetails: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
  }): Promise<PaymentMethod> {
    if (!this.stripe) {
      throw new Error('Stripe não foi inicializado');
    }

    const { createPaymentMethod } = this.stripe;

    const { paymentMethod, error } = await createPaymentMethod({
      paymentMethodType: 'Card',
      card: {
        number: cardDetails.number.replace(/\s/g, ''), // Remove espaços
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        cvc: cardDetails.cvc,
      },
    });

    if (error) {
      throw new Error(error.message || 'Erro ao criar método de pagamento');
    }

    return paymentMethod;
  }

  // Confirmar pagamento
  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe não foi inicializado');
    }

    const { confirmPayment } = this.stripe;

    const { paymentIntent, error } = await confirmPayment(paymentIntentId, {
      paymentMethodType: 'Card',
    });

    if (error) {
      throw new Error(error.message || 'Erro ao confirmar pagamento');
    }

    return paymentIntent;
  }

  // Processar assinatura premium
  async processPremiumSubscription(cardDetails: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
  }): Promise<{ success: boolean; message: string; subscription?: any }> {
    try {
      console.log('Iniciando criação do método de pagamento...');
      
      // Validar dados antes de enviar para o Stripe
      const validation = this.validateCardDetails(cardDetails);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // 1. Criar método de pagamento no Stripe
      const paymentMethod = await this.createPaymentMethod(cardDetails);
      console.log('Método de pagamento criado:', paymentMethod.id);

      // 2. Criar assinatura via API do backend
      console.log('Criando assinatura via API...');
      const response = await apiService.createSubscription('premium', paymentMethod.id);
      console.log('Resposta da API:', response);

      if (response.success) {
        return {
          success: true,
          message: 'Assinatura premium ativada com sucesso!',
          subscription: response.data.subscription
        };
      } else {
        throw new Error(response.error || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('Erro no processamento da assinatura:', error);
      
      // Tratar erros específicos do Stripe
      if (error instanceof Error) {
        if (error.message.includes('card_declined')) {
          return {
            success: false,
            message: 'Cartão recusado. Verifique os dados ou use outro cartão.'
          };
        } else if (error.message.includes('insufficient_funds')) {
          return {
            success: false,
            message: 'Saldo insuficiente no cartão.'
          };
        } else if (error.message.includes('expired_card')) {
          return {
            success: false,
            message: 'Cartão expirado. Use um cartão válido.'
          };
        } else if (error.message.includes('incorrect_cvc')) {
          return {
            success: false,
            message: 'CVC incorreto. Verifique o código de segurança.'
          };
        } else if (error.message.includes('invalid_number')) {
          return {
            success: false,
            message: 'Número do cartão inválido.'
          };
        } else if (error.message.includes('network')) {
          return {
            success: false,
            message: 'Erro de conexão. Verifique sua internet e tente novamente.'
          };
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido no pagamento'
      };
    }
  }

  // Validar dados do cartão
  validateCardDetails(cardDetails: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar número do cartão
    const cardNumber = cardDetails.number.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      errors.push('Número do cartão inválido');
    }

    // Validar mês de expiração
    if (!cardDetails.expiryMonth || cardDetails.expiryMonth < 1 || cardDetails.expiryMonth > 12) {
      errors.push('Mês de expiração inválido');
    }

    // Validar ano de expiração
    const currentYear = new Date().getFullYear();
    if (!cardDetails.expiryYear || cardDetails.expiryYear < currentYear) {
      errors.push('Ano de expiração inválido');
    }

    // Validar CVC
    if (!cardDetails.cvc || cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
      errors.push('CVC inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Formatar número do cartão
  formatCardNumber(number: string): string {
    const cleaned = number.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  }

  // Obter bandeira do cartão
  getCardBrand(number: string): string {
    const cleaned = number.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    
    return 'unknown';
  }
}

// Hook personalizado para usar o Stripe
export const usePaymentService = () => {
  const stripe = useStripe();
  const paymentService = PaymentService.getInstance();

  // Inicializar o serviço quando o hook for usado
  if (stripe && !paymentService.getStripe()) {
    paymentService.initializeStripe(stripe);
  }

  return paymentService;
};

// Provider do Stripe para envolver a aplicação
export const StripePaymentProvider = ({ children }: { children: React.ReactElement | React.ReactElement[] }) => {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </StripeProvider>
  );
};

export default PaymentService;
