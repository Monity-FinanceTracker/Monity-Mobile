# Sistema de Pagamento Mobile - Monity Premium

## Visão Geral

O sistema de assinatura premium do Monity está implementado com uma estrutura completa que inclui:

- ✅ Backend com endpoints de assinatura
- ✅ Frontend com interface de planos
- ✅ Botão destacado no perfil
- ✅ Sistema de verificação de premium
- 🔄 Integração com gateway de pagamento (pendente)

## Estrutura Implementada

### Backend

#### Endpoints Disponíveis:
- `GET /api/v1/subscription-tier` - Obter status da assinatura do usuário
- `GET /api/v1/subscription-tier/plans` - Listar planos disponíveis
- `POST /api/v1/subscription-tier/create` - Criar nova assinatura
- `POST /api/v1/subscription-tier/cancel` - Cancelar assinatura

#### Planos Configurados:
- **Gratuito**: R$ 0,00/mês
  - Até 50 transações por mês
  - Categorização básica
  - Relatórios simples
  - Suporte por email

- **Premium**: R$ 9,90/mês
  - Transações ilimitadas
  - IA para categorização automática
  - Projeções financeiras avançadas
  - Relatórios detalhados
  - Exportação completa de dados
  - Backup automático na nuvem
  - Suporte prioritário
  - Temas personalizados

### Frontend

#### Componentes Criados:
- `SubscriptionPlans.tsx` - Tela de planos de assinatura
- Botão premium destacado no perfil
- Status de assinatura no perfil
- Integração com AuthContext

## Configuração de Pagamento Mobile

### 1. Escolha do Gateway de Pagamento

Para aplicativos móveis, recomendo os seguintes gateways:

#### Opção 1: Stripe (Recomendado)
- **Vantagens**: Excelente para mobile, webhooks confiáveis, documentação completa
- **Desvantagens**: Taxa de 3.4% + R$ 0,39 por transação
- **Documentação**: https://stripe.com/docs/mobile

#### Opção 2: Mercado Pago
- **Vantagens**: Popular no Brasil, boa integração mobile
- **Desvantagens**: Taxa de 4.99% + R$ 0,39 por transação
- **Documentação**: https://www.mercadopago.com.br/developers

#### Opção 3: PagSeguro
- **Vantagens**: Brasileiro, boa aceitação
- **Desvantagens**: Taxa de 4.99% + R$ 0,39 por transação
- **Documentação**: https://dev.pagseguro.uol.com.br/

### 2. Implementação com Stripe (Exemplo)

#### 2.1 Instalação das Dependências

```bash
# Backend
npm install stripe

# Frontend
npm install @stripe/stripe-react-native
```

#### 2.2 Configuração do Backend

```typescript
// backend/config/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// backend/controllers/subscriptionController.ts
import { stripe } from '../config/stripe';

async createSubscription(req: AuthenticatedRequest, res: Response) {
  const userId = req.user.id;
  const { planId, paymentMethodId } = req.body;

  try {
    // Criar customer no Stripe
    const customer = await stripe.customers.create({
      email: req.user.email,
      metadata: { userId }
    });

    // Criar subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_premium_monthly' }], // ID do preço no Stripe
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    // Atualizar banco de dados
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "premium",
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    res.json({ 
      success: true, 
      data: { subscription, message: "Assinatura ativada com sucesso!" }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Falha ao criar assinatura" });
  }
}
```

#### 2.3 Configuração do Frontend

```typescript
// frontend/Monity/app/src/services/paymentService.ts
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

export const PaymentService = {
  async createPaymentMethod(cardDetails: any) {
    const { createPaymentMethod } = useStripe();
    
    const { paymentMethod, error } = await createPaymentMethod({
      paymentMethodType: 'Card',
      card: cardDetails,
    });

    if (error) throw error;
    return paymentMethod;
  },

  async confirmPayment(paymentIntentId: string) {
    const { confirmPayment } = useStripe();
    
    const { paymentIntent, error } = await confirmPayment(paymentIntentId, {
      paymentMethodType: 'Card',
    });

    if (error) throw error;
    return paymentIntent;
  }
};
```

#### 2.4 Componente de Pagamento

```typescript
// frontend/Monity/app/src/components/PaymentForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { apiService } from '../services/apiService';

export default function PaymentForm({ planId, onSuccess }: any) {
  const { createPaymentMethod } = useStripe();
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
  });

  const handlePayment = async () => {
    try {
      // Criar método de pagamento
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        card: cardDetails,
      });

      if (error) throw error;

      // Criar assinatura
      const response = await apiService.createSubscription(planId, paymentMethod.id);
      
      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar pagamento');
    }
  };

  return (
    <View className="p-4">
      <TextInput
        placeholder="Número do cartão"
        value={cardDetails.number}
        onChangeText={(text) => setCardDetails({...cardDetails, number: text})}
        className="bg-[#23263a] border border-[#31344d] rounded-xl text-white px-4 py-3 mb-4"
      />
      {/* Outros campos do cartão */}
      <Pressable
        onPress={handlePayment}
        className="bg-[#01C38D] py-4 rounded-xl"
      >
        <Text className="text-[#191E29] font-bold text-center">
          Confirmar Pagamento
        </Text>
      </Pressable>
    </View>
  );
}
```

### 3. Configuração de Webhooks

#### 3.1 Webhook para Renovação Automática

```typescript
// backend/routes/webhooks.ts
import express from 'express';
import { stripe } from '../config/stripe';

const router = express.Router();

router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      // Renovar assinatura no banco
      await renewSubscription(invoice.subscription);
      break;
    
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Cancelar assinatura no banco
      await cancelSubscription(subscription.id);
      break;
  }

  res.json({received: true});
});
```

### 4. Variáveis de Ambiente

```bash
# backend/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# frontend/Monity/app.json
{
  "expo": {
    "extra": {
      "stripePublishableKey": "pk_test_..."
    }
  }
}
```

### 5. Testes de Pagamento

#### Cartões de Teste Stripe:
- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### 6. Implementação de Segurança

#### 6.1 Validação no Backend
```typescript
// Validar webhook do Stripe
const isValidWebhook = stripe.webhooks.constructEvent(
  req.body, 
  req.headers['stripe-signature'], 
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

#### 6.2 Rate Limiting
```typescript
// Aplicar rate limiting nas rotas de pagamento
app.use('/api/v1/subscription-tier/create', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5 // máximo 5 tentativas por IP
}));
```

### 7. Monitoramento e Logs

```typescript
// Log de transações de pagamento
logger.info('Payment processed', {
  userId,
  amount,
  currency,
  paymentMethodId,
  subscriptionId
});
```

## Próximos Passos

1. **Escolher gateway de pagamento** (recomendo Stripe)
2. **Configurar conta de desenvolvedor** no gateway escolhido
3. **Implementar integração** seguindo os exemplos acima
4. **Configurar webhooks** para renovação automática
5. **Testar com cartões de teste**
6. **Implementar monitoramento** e logs
7. **Configurar ambiente de produção**

## Considerações Importantes

- **LGPD**: Implementar política de privacidade para dados de pagamento
- **PCI DSS**: Não armazenar dados de cartão, usar tokenização
- **Backup**: Implementar sistema de backup para dados de assinatura
- **Monitoramento**: Configurar alertas para falhas de pagamento
- **Suporte**: Implementar sistema de suporte para problemas de pagamento

## Custos Estimados

- **Stripe**: 3.4% + R$ 0,39 por transação
- **Mercado Pago**: 4.99% + R$ 0,39 por transação
- **PagSeguro**: 4.99% + R$ 0,39 por transação

Para R$ 9,90/mês:
- **Stripe**: ~R$ 0,73 por assinatura
- **Mercado Pago**: ~R$ 0,88 por assinatura
- **PagSeguro**: ~R$ 0,88 por assinatura
