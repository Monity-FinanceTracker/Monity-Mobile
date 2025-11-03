# 🔧 Stripe Opcional - Configuração Flexível

## 📋 Resumo das Mudanças

O backend do Monity agora suporta **deploy sem configuração do Stripe**, permitindo que a aplicação funcione mesmo quando as funcionalidades de pagamento não estão configuradas.

## ✅ Problemas Resolvidos

### 1. **Erro de Deploy**
- ❌ **Antes**: `Error: STRIPE_SECRET_KEY não está definida nas variáveis de ambiente`
- ✅ **Agora**: Backend inicia normalmente, Stripe fica opcional

### 2. **Versão do Node.js**
- ❌ **Antes**: Node.js 18 (deprecated pelo Supabase)
- ✅ **Agora**: Node.js 20 (compatível com Supabase)

### 3. **Configuração Flexível**
- ❌ **Antes**: Stripe obrigatório para funcionar
- ✅ **Agora**: Stripe opcional, funcionalidades básicas sempre disponíveis

## 🔧 Mudanças Implementadas

### 1. **Dockerfile Atualizado**
```dockerfile
# Antes
FROM node:18-alpine AS builder
FROM node:18-alpine AS production

# Agora
FROM node:20-alpine AS builder
FROM node:20-alpine AS production
```

### 2. **config/stripe.ts - Stripe Opcional**
```typescript
// Antes: Erro se não configurado
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY não está definida');
}

// Agora: Stripe opcional
export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null;

export const isStripeEnabled = !!stripeSecretKey && !!STRIPE_CONFIG.PREMIUM_PRICE_ID && !!STRIPE_CONFIG.WEBHOOK_SECRET;
```

### 3. **Controllers com Verificação**
```typescript
// Verificação antes de usar Stripe
if (!isStripeEnabled) {
  return res.status(503).json({ 
    error: "Payment system is not available at the moment" 
  });
}
```

## 🚀 Como Funciona Agora

### **Sem Stripe Configurado**
- ✅ Backend inicia normalmente
- ✅ Todas as funcionalidades básicas funcionam
- ✅ APIs de autenticação, transações, categorias funcionam
- ❌ Funcionalidades de pagamento retornam erro 503

### **Com Stripe Configurado**
- ✅ Todas as funcionalidades disponíveis
- ✅ Pagamentos e subscriptions funcionam
- ✅ Webhooks do Stripe processados

## 📝 Variáveis de Ambiente

### **Obrigatórias** (sempre necessárias)
```bash
SUPABASE_URL=...
SUPABASE_KEY=...
ENCRYPTION_KEY=...
```

### **Opcionais** (para Stripe)
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PREMIUM_PRODUCT_ID=prod_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔍 Verificação de Status

O sistema agora verifica automaticamente se o Stripe está configurado:

```typescript
// Em qualquer controller
if (!isStripeEnabled) {
  // Retorna erro 503 - Service Unavailable
  // Frontend pode mostrar mensagem apropriada
}
```

## 📱 Impacto no Frontend

O frontend deve tratar o erro 503 das APIs de pagamento:

```typescript
// Exemplo de tratamento no frontend
try {
  const response = await apiService.createSubscription(data);
  // Processar sucesso
} catch (error) {
  if (error.status === 503) {
    // Mostrar mensagem: "Sistema de pagamento temporariamente indisponível"
  }
}
```

## 🎯 Benefícios

1. **Deploy Simplificado**: Não precisa configurar Stripe para testar
2. **Desenvolvimento**: Pode desenvolver sem configuração completa
3. **Produção Gradual**: Pode ativar Stripe quando necessário
4. **Manutenção**: Fácil identificar se Stripe está configurado
5. **Compatibilidade**: Node.js 20 resolve warnings do Supabase

## 🔄 Próximos Passos

1. **Deploy**: O backend agora deve funcionar sem Stripe
2. **Configuração**: Adicione variáveis do Stripe quando necessário
3. **Frontend**: Atualize tratamento de erros 503
4. **Testes**: Verifique funcionalidades básicas funcionando

---

**Status**: ✅ **Pronto para Deploy**
**Node.js**: 20 (compatível)
**Stripe**: Opcional
**Build**: Funcionando
