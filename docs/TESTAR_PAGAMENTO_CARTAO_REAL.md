# 💳 Testar Pagamento com Cartão Real - Google Play

## ✅ Resposta Direta

**SIM, você pode testar com cartão real, mas há diferenças importantes entre ambiente de teste e produção:**

### 🧪 Em Ambiente de Teste (Faixas de Teste)
- ✅ **Pode usar cartão real**
- ✅ **NÃO será cobrado** (Google não cobra em ambiente de teste)
- ✅ O Google Play usa **"instrumentos de teste"** que simulam pagamentos
- ✅ Ideal para validar todo o fluxo antes de ir para produção

### 🚀 Em Produção
- ✅ **Pode usar cartão real**
- ⚠️ **SERÁ COBRADO** normalmente
- ⚠️ O usuário será cobrado de verdade

---

## 📋 Checklist Antes de Testar

### 1. ✅ Configurações do Backend
- [ ] `GOOGLE_PLAY_PACKAGE_NAME` configurado no `.env`
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` configurado no `.env`
- [ ] Service Account vinculada ao Google Play Console
- [ ] Permissões concedidas no Google Play Console

### 2. ✅ Configurações do Google Play Console
- [ ] Assinatura criada e **ATIVA** no Google Play Console
- [ ] Product ID: `com_monity_premium_monthly` (deve corresponder ao código)
- [ ] App publicado em uma **faixa de teste** (Interno/Fechado/Aberto)
- [ ] **Lista de testadores** configurada (Configurações > Teste de Licença)
- [ ] Sua conta Gmail adicionada na lista de testadores

### 3. ✅ Configurações do App
- [ ] Build nativo instalado (não funciona no Expo Go)
- [ ] Product ID correto no código: `com_monity_premium_monthly`
- [ ] App instalado via link da faixa de teste
- [ ] Logado com a conta Gmail que está na lista de testadores

---

## 🧪 Como Testar com Cartão Real (Sem Cobrança)

### Passo 1: Configurar Ambiente de Teste

1. **No Google Play Console:**
   - Vá em **Configurações > Teste de Licença**
   - Crie uma lista de testadores
   - Adicione seu email Gmail

2. **Publicar em Faixa de Teste:**
   - Vá em **Versão > Faixas de teste**
   - Publique na **Faixa de teste interno** (mais rápida)
   - Adicione os testadores de licença à faixa

### Passo 2: Instalar App de Teste

1. Obtenha o **link de inscrição** da faixa de teste
2. Acesse o link no dispositivo Android
3. Certifique-se de estar logado com a **conta Gmail** que está na lista de testadores
4. Instale o app

### Passo 3: Testar Compra

1. Abra o app Monity
2. Vá em **Perfil > Assinar Premium**
3. Clique em **Assinar**
4. Quando o Google Play pedir pagamento:
   - Você pode usar um **cartão real**
   - Mas o Google **NÃO vai cobrar**
   - O Google mostrará opções de **"Instrumento de teste"**:
     - ✅ **"Instrumento de teste, aprovado sempre"** - Simula compra bem-sucedida
     - ❌ **"Instrumento de teste, recusado sempre"** - Simula compra recusada
   - Ou você pode usar seu cartão real (não será cobrado)

### Passo 4: Verificar

1. **No App:**
   - Deve mostrar "Premium Ativo"
   - Recursos premium devem estar disponíveis

2. **No Backend:**
   - Verifique os logs para confirmar que a compra foi validada
   - A validação deve usar a API do Google Play

3. **No Google Play Console:**
   - Vá em **Monetize com o Google Play > Assinaturas**
   - Você verá a compra de teste listada
   - Status: "Ativa" (mas não foi cobrado)

---

## 🔍 Como Saber se Está em Ambiente de Teste

### Sinais de que está em ambiente de teste:
- ✅ O Google Play mostra opções de "Instrumento de teste"
- ✅ Não há cobrança real no cartão
- ✅ A compra aparece no Google Play Console como "Teste"
- ✅ Você está usando o app instalado via link de teste

### Sinais de que está em produção:
- ⚠️ O Google Play pede pagamento real
- ⚠️ O cartão será cobrado
- ⚠️ O app foi instalado da Google Play Store (não via link de teste)

---

## 🚀 Quando Ir para Produção

### Antes de publicar em produção:

1. **Teste tudo em ambiente de teste:**
   - [ ] Compra bem-sucedida
   - [ ] Compra recusada
   - [ ] Renovação de assinatura
   - [ ] Cancelamento
   - [ ] Restaurar compras

2. **Verifique configurações:**
   - [ ] Service Account configurada corretamente
   - [ ] Backend validando compras corretamente
   - [ ] Logs funcionando
   - [ ] Webhooks configurados (se necessário)

3. **Teste com usuários reais:**
   - [ ] Peça para alguns beta testers testarem
   - [ ] Verifique se tudo funciona para eles

### Ao publicar em produção:
- ⚠️ **CUIDADO**: Agora as compras serão reais e os usuários serão cobrados
- ⚠️ Certifique-se de que tudo está funcionando perfeitamente
- ⚠️ Monitore os logs e métricas

---

## 🐛 Troubleshooting

### Problema: "Produto não encontrado"
**Solução:**
- Verifique se o Product ID no código (`com_monity_premium_monthly`) corresponde ao do Google Play Console
- Verifique se a assinatura está **ATIVA** no Google Play Console
- Aguarde alguns minutos após criar/ativar a assinatura

### Problema: "Compra não validada no backend"
**Solução:**
- Verifique se `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` está configurado
- Verifique se a Service Account tem as permissões corretas
- Verifique os logs do backend para ver o erro específico

### Problema: "Não consigo testar, está pedindo pagamento real"
**Solução:**
- Certifique-se de estar usando o app instalado via **link de teste**
- Certifique-se de estar logado com a **conta Gmail** que está na lista de testadores
- Verifique se o app está publicado em uma **faixa de teste** (não em produção)

### Problema: "Cartão foi cobrado durante teste"
**Solução:**
- Se você estava em ambiente de teste e foi cobrado, entre em contato com o Google Play Support
- Normalmente isso não deveria acontecer em ambiente de teste
- Verifique se você não estava usando o app da produção acidentalmente

---

## 📚 Referências

- [Google Play Billing - Testes](https://developer.android.com/google/play/billing/test)
- [Google Play Console - Teste de Licença](https://support.google.com/googleplay/android-developer/answer/6062777)
- [Documentação do Monity - In-App Purchase Setup](docs/IN_APP_PURCHASE_SETUP.md)
- [Documentação do Monity - Onde Encontrar Chaves](docs/ONDE_ENCONTRAR_CHAVES_IN_APP_PURCHASE.md)

---

## ✅ Resumo

**SIM, o código está pronto para processar pagamentos reais!**

- ✅ Em **teste**: Pode usar cartão real, mas não será cobrado
- ✅ Em **produção**: Pode usar cartão real, será cobrado normalmente
- ✅ O código valida compras através da API do Google Play
- ✅ Tudo está implementado e funcionando

**Recomendação:** Teste tudo em ambiente de teste primeiro antes de ir para produção!

