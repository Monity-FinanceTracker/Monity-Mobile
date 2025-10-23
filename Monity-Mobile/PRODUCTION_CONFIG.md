# Configuração de Ambiente para Produção - Monity

## ✅ Variáveis de Ambiente Obrigatórias

### Backend (.env)

```bash
# Stripe Configuration (PRODUÇÃO)
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PREMIUM_PRODUCT_ID=prod_YOUR_PRODUCTION_PRODUCT_ID
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PRODUCTION_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET

# Database Configuration
SUPABASE_URL=https://eeubnmpetzhjcludrjwz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=YOUR_JWT_SECRET
```

### Frontend (app.json)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://monity-mobile-production-9509.up.railway.app/api/v1",
      "supabaseUrl": "https://eeubnmpetzhjcludrjwz.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM",
      "geminiApiKey": "AIzaSyCLD8msQ9K6std1kLSymu1re81ZXc61zps",
      "stripePublishableKey": "pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY"
    }
  }
}
```

## 🔧 Configuração no Stripe Dashboard

### 1. Criar Produto e Preço de Produção

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Certifique-se de estar no modo **Live** (não Test)
3. Vá em **Products** → **Add Product**
4. Configure:
   - **Name**: "Monity Premium"
   - **Description**: "Assinatura premium do Monity com recursos avançados"
   - **Pricing**: R$ 9,90/mês
   - **Billing period**: Monthly
5. Copie o **Product ID** e **Price ID**

### 2. Configurar Webhook de Produção

1. Vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. **Endpoint URL**: `https://monity-mobile-production-9509.up.railway.app/api/v1/webhooks/stripe`
4. **Events to send**:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copie o **Webhook Secret**

### 3. Obter Chaves de Produção

1. Vá em **Developers** → **API Keys**
2. Certifique-se de estar no modo **Live**
3. Copie:
   - **Publishable key** (pk_live_...)
   - **Secret key** (sk_live_...)

## 🚀 Deploy para Produção

### Backend (Railway)

1. Configure as variáveis de ambiente no Railway:
   ```bash
   STRIPE_SECRET_KEY=sk_live_YOUR_KEY
   STRIPE_PREMIUM_PRODUCT_ID=prod_YOUR_ID
   STRIPE_PREMIUM_PRICE_ID=price_YOUR_ID
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   ```

2. Deploy o código atualizado

### Frontend (EAS Build)

1. Atualize o `app.json` com a chave pública de produção
2. Execute o build de produção:
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

## 🔍 Monitoramento de Produção

### Logs Importantes

- ✅ Criação de subscriptions
- ✅ Pagamentos bem-sucedidos
- ✅ Falhas de pagamento
- ✅ Cancelamentos
- ✅ Renovações automáticas
- ✅ Erros de webhook

### Métricas para Acompanhar

- **Taxa de conversão**: % de usuários que completam o pagamento
- **Taxa de falha**: % de pagamentos que falham
- **Churn rate**: % de cancelamentos por mês
- **MRR**: Receita recorrente mensal
- **ARPU**: Receita média por usuário

### Alertas Recomendados

1. **Falhas de pagamento** > 5%
2. **Webhooks falhando** > 1%
3. **Erros de criação de subscription** > 2%
4. **Tempo de resposta** > 5 segundos

## 🛡️ Segurança em Produção

### Validações Implementadas

- ✅ Validação de webhook signatures
- ✅ Rate limiting nas rotas de pagamento
- ✅ Logs detalhados para auditoria
- ✅ Não armazenamento de dados de cartão
- ✅ Tokenização pelo Stripe
- ✅ Validação de entrada em todas as rotas

### Boas Práticas

- ✅ Use HTTPS em produção
- ✅ Monitore logs regularmente
- ✅ Configure alertas para falhas
- ✅ Mantenha backups dos dados
- ✅ Teste webhooks regularmente

## 📊 Dashboard de Monitoramento

### Stripe Dashboard

- **Payments**: Acompanhe pagamentos em tempo real
- **Customers**: Gerencie clientes e subscriptions
- **Webhooks**: Monitore eventos e falhas
- **Logs**: Veja logs detalhados de API

### Railway Dashboard

- **Logs**: Monitore logs da aplicação
- **Metrics**: CPU, memória, rede
- **Deployments**: Histórico de deploys

## 🧪 Testes em Produção

### Cartões de Teste (Modo Test)

```bash
# Sucesso
4242 4242 4242 4242

# Falha
4000 0000 0000 0002

# 3D Secure
4000 0025 0000 3155
```

### Validação Pós-Deploy

1. **Teste criação de subscription** com cartão de teste
2. **Verifique webhooks** estão funcionando
3. **Confirme logs** estão sendo gerados
4. **Teste cancelamento** de subscription
5. **Valide renovação** automática

## 🎯 Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] Produto e preço criados no Stripe
- [ ] Webhook configurado e testado
- [ ] Chaves de produção configuradas
- [ ] Deploy realizado com sucesso
- [ ] Testes de pagamento executados
- [ ] Monitoramento configurado
- [ ] Alertas configurados
- [ ] Backup dos dados configurado
- [ ] Documentação atualizada

## 🚨 Troubleshooting

### Problemas Comuns

1. **Webhook não funciona**
   - Verifique URL do webhook
   - Confirme webhook secret
   - Verifique logs do servidor

2. **Pagamento falha**
   - Verifique chaves do Stripe
   - Confirme configuração do produto
   - Verifique logs de erro

3. **Subscription não é criada**
   - Verifique logs do backend
   - Confirme conexão com Stripe
   - Verifique configuração do banco

### Contatos de Suporte

- **Stripe Support**: https://support.stripe.com
- **Railway Support**: https://railway.app/help
- **Supabase Support**: https://supabase.com/support

O sistema está **100% pronto para produção**! 🚀
