import Stripe from 'stripe';

// Configuração do Stripe para produção
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// IDs dos produtos e preços do Stripe (configurados via variáveis de ambiente)
export const STRIPE_CONFIG = {
  // Produto Premium
  PREMIUM_PRODUCT_ID: process.env.STRIPE_PREMIUM_PRODUCT_ID,
  
  // Preço mensal do Premium
  PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
  
  // Webhook secret para validação
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

// Validar configuração obrigatória
if (!STRIPE_CONFIG.PREMIUM_PRICE_ID) {
  throw new Error('STRIPE_PREMIUM_PRICE_ID não está definida nas variáveis de ambiente');
}

if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET não está definida nas variáveis de ambiente');
}

// Função para criar customer no Stripe
export const createStripeCustomer = async (email: string, userId: string) => {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        source: 'mobile_app'
      }
    });
    
    return customer;
  } catch (error) {
    console.error('Erro ao criar customer no Stripe:', error);
    throw error;
  }
};

// Função para criar subscription no Stripe
export const createStripeSubscription = async (
  customerId: string, 
  paymentMethodId: string,
  priceId: string = STRIPE_CONFIG.PREMIUM_PRICE_ID
) => {
  try {
    // Anexar método de pagamento ao customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Definir como método de pagamento padrão
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Criar subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Erro ao criar subscription no Stripe:', error);
    throw error;
  }
};

// Função para cancelar subscription no Stripe
export const cancelStripeSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Erro ao cancelar subscription no Stripe:', error);
    throw error;
  }
};

// Função para obter subscription do Stripe
export const getStripeSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Erro ao obter subscription do Stripe:', error);
    throw error;
  }
};

// Função para validar webhook do Stripe
export const validateStripeWebhook = (payload: string, signature: string) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Erro ao validar webhook do Stripe:', error);
    throw error;
  }
};

export default stripe;
