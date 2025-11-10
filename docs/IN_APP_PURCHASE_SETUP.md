# Guia Completo de Configuração - Pagamento In-App (Google Play & App Store)

Este guia detalha todos os passos necessários para configurar pagamentos in-app (assinaturas) no Monity, tanto para Android (Google Play) quanto para iOS (App Store).

---

## 📱 Índice

1. [Configuração Google Play Console (Android)](#-configuração-google-play-console-android)
2. [Configuração App Store Connect (iOS)](#-configuração-app-store-connect-ios)
3. [Configuração do Backend](#-configuração-do-backend)
4. [Configuração do Frontend](#-configuração-do-frontend)
5. [Testes](#-testes)
6. [Troubleshooting](#-troubleshooting)

---

## 🤖 Configuração Google Play Console (Android)

### 1. Criar Assinatura no Google Play Console

#### Passo 1: Acessar o Google Play Console
1. Acesse [Google Play Console](https://play.google.com/console)
2. Selecione seu app **Monity**
3. No menu lateral, vá em **Monetize com o Google Play > Produtos > Assinaturas**

#### Passo 2: Criar Nova Assinatura
1. Clique em **Criar assinatura**
2. Preencha os seguintes dados:
   - **ID do produto**: `com.monity.premium.monthly`
     - ⚠️ **IMPORTANTE**: Este ID deve corresponder exatamente ao configurado no código (`frontend/Monity/app/src/services/inAppPurchaseService.ts`)
   - **Nome**: `Monity Premium Mensal`
   - **Descrição**: `Assinatura mensal do Monity Premium com acesso a todos os recursos exclusivos`

#### Passo 3: Configurar Preço e Período
1. **Período de cobrança**: Selecione `Mensal`
2. **Preço**: Configure o preço em BRL (Real Brasileiro)
   - Exemplo: R$ 9,90
3. **Período de teste gratuito** (opcional): Configure se desejar oferecer teste gratuito
4. **Período de preço introdutório** (opcional): Configure se desejar oferecer desconto para novos assinantes

#### Passo 4: Configurar Renovação
1. **Renovação automática**: Deixe ativado
2. **Período de carência**: Configure conforme necessário (recomendado: 3 dias)
3. **Aviso de renovação**: Ative para notificar usuários antes da renovação

#### Passo 5: Salvar e Publicar
1. Revise todas as configurações
2. Clique em **Salvar**
3. Clique em **Ativar** para publicar a assinatura
   - ⚠️ **IMPORTANTE**: A assinatura precisa estar **ATIVA** mesmo durante os testes

### 2. Configurar Testadores de Licença

#### Passo 1: Adicionar Contas de Teste
1. No Google Play Console, vá em **Configurações > Teste de Licença**
2. Clique em **Criar lista de testadores**
3. Adicione os **emails Gmail** das contas que você usará para testar
   - ⚠️ **IMPORTANTE**: Use contas Gmail reais, não contas de teste
4. Salve a lista

#### Passo 2: Publicar em Faixa de Teste
1. Vá em **Versão > Faixas de teste**
2. Selecione **Faixa de teste interno** (mais rápida para iteração)
3. Faça upload do APK/AAB com o código de pagamento implementado
4. Adicione os testadores de licença à faixa de teste

#### Passo 3: Obter Link de Teste
1. Após publicar, copie o **link de inscrição** da faixa de teste
2. Compartilhe este link com os testadores
3. Os testadores devem:
   - Estar logados com a conta Gmail adicionada na lista de testadores
   - Usar o link para baixar o app
   - Usar a mesma conta Gmail no dispositivo

### 3. Configurar Service Account para Validação no Backend

#### Passo 1: Criar Service Account no Google Cloud
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione ou crie um projeto
3. Vá em **IAM & Admin > Service Accounts**
4. Clique em **Criar conta de serviço**
5. Preencha:
   - **Nome**: `monity-play-billing`
   - **Descrição**: `Service account para validação de compras Google Play`
6. Clique em **Criar e continuar**

#### Passo 2: Conceder Permissões
1. Na etapa de **Permissões**, adicione a role:
   - **Service Account User**
2. Clique em **Continuar** e depois **Concluído**

#### Passo 3: Criar e Baixar Chave JSON
1. Clique na conta de serviço criada
2. Vá na aba **Chaves**
3. Clique em **Adicionar chave > Criar nova chave**
4. Selecione **JSON**
5. Baixe o arquivo JSON (guarde em local seguro!)

#### Passo 4: Vincular Service Account ao Google Play Console
1. No Google Play Console, vá em **Configurações > Acesso à API**
2. Clique em **Criar novo projeto do Google Cloud** ou selecione um existente
3. Vá em **Configurações > Acesso à API > Vincular conta de serviço**
4. Cole o **email da service account** (encontrado no JSON baixado)
5. Clique em **Conceder acesso**
6. Selecione as permissões:
   - ✅ **Ver informações financeiras, pedidos e cancelamento de assinaturas**
   - ✅ **Gerenciar pedidos e assinaturas**
7. Clique em **Conceder acesso**

### 4. Configurar Real-Time Developer Notifications (RTDN)

#### Passo 1: Criar Endpoint de Webhook
1. No Google Play Console, vá em **Monetize com o Google Play > Configurações > Real-time developer notifications**
2. Clique em **Configurar notificações**
3. Cole a URL do seu webhook:
   ```
   https://seu-backend.com/api/v1/webhook/google-play
   ```
   - ⚠️ **IMPORTANTE**: Esta URL deve ser HTTPS e acessível publicamente
4. Clique em **Salvar**

#### Passo 2: Implementar Webhook no Backend
- O webhook receberá notificações sobre:
  - Renovações de assinatura
  - Cancelamentos
  - Problemas de pagamento
  - Períodos de carência

---

## 🍎 Configuração App Store Connect (iOS)

### 1. Criar Assinatura no App Store Connect

#### Passo 1: Acessar o App Store Connect
1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Selecione seu app **Monity**
3. Vá em **Recursos (Features) > In-App Purchases**

#### Passo 2: Criar Grupo de Assinaturas
1. Clique em **+** para criar um novo grupo
2. Preencha:
   - **ID do grupo**: `monity_premium_group`
   - **Nome de referência**: `Monity Premium`
3. Clique em **Criar**

#### Passo 3: Criar Assinatura Auto-Renovável
1. Dentro do grupo criado, clique em **+** para criar assinatura
2. Selecione **Assinatura Auto-Renovável**
3. Preencha os dados:
   - **ID do produto**: `com_monity_premium_monthly`
     - ⚠️ **IMPORTANTE**: Este ID deve corresponder exatamente ao configurado no código
   - **Nome de referência**: `Monity Premium Mensal`
   - **Descrição**: `Assinatura mensal do Monity Premium com acesso a todos os recursos exclusivos`

#### Passo 4: Configurar Preços e Disponibilidade
1. Clique em **Preços e Disponibilidade**
2. Configure o preço para **Brasil (BRL)**
   - Exemplo: R$ 9,90
3. Selecione os países onde a assinatura estará disponível
4. Clique em **Salvar**

#### Passo 5: Configurar Informações de Assinatura
1. Preencha:
   - **Nome**: `Monity Premium`
   - **Descrição**: Descrição detalhada dos benefícios
2. Adicione uma **imagem de assinatura** (se disponível)
3. Clique em **Salvar**

#### Passo 6: Configurar Ofertas Promocionais (Opcional)
1. Você pode criar:
   - **Período de teste gratuito**: Ex: 7 dias grátis
   - **Preço introdutório**: Ex: Primeiro mês por R$ 4,90
2. Configure conforme necessário

#### Passo 7: Enviar para Revisão
1. Revise todas as configurações
2. Clique em **Enviar para revisão**
3. ⚠️ **IMPORTANTE**: A assinatura precisa ser aprovada pela Apple antes de poder ser usada

### 2. Configurar Usuários Sandbox para Testes

#### Passo 1: Criar Usuário Sandbox
1. No App Store Connect, vá em **Usuários e Acesso > Sandbox > Testadores**
2. Clique em **+** para criar novo testador
3. Preencha:
   - **Email**: Use um email válido (não precisa ser real, mas deve ter formato válido)
   - **Senha**: Crie uma senha
   - **Nome**: Nome do testador
   - **País/Região**: Selecione o país
4. Clique em **Salvar**

#### Passo 2: Usar Usuário Sandbox
- Quando testar no dispositivo iOS:
  - O dispositivo deve estar conectado via Xcode
  - Ao tentar comprar, o sistema pedirá login
  - Use as credenciais do usuário Sandbox criado
  - ⚠️ **IMPORTANTE**: No ambiente Sandbox, o tempo é acelerado (1 mês = 5 minutos)

### 3. Configurar Server-to-Server Notifications

#### Passo 1: Configurar URL de Notificação
1. No App Store Connect, vá em **Recursos > In-App Purchases**
2. Clique no grupo de assinaturas
3. Vá em **Server-to-Server Notification URL**
4. Cole a URL do seu webhook:
   ```
   https://seu-backend.com/api/v1/webhook/app-store
   ```
   - ⚠️ **IMPORTANTE**: Esta URL deve ser HTTPS e acessível publicamente
5. Clique em **Salvar**

#### Passo 2: Configurar Shared Secret
1. No App Store Connect, vá em **Recursos > In-App Purchases**
2. Clique no grupo de assinaturas
3. Vá em **App-Specific Shared Secret**
4. Clique em **Gerar** ou copie o secret existente
5. ⚠️ **GUARDE ESTE SECRET**: Você precisará dele no backend

#### Passo 3: Implementar Webhook no Backend
- O webhook receberá notificações sobre:
  - Renovações de assinatura
  - Cancelamentos
  - Problemas de pagamento
  - Períodos de carência
  - Restaurações

---

## ⚙️ Configuração do Backend

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env` do backend:

```bash
# Google Play Configuration
GOOGLE_PLAY_PACKAGE_NAME=com.widechain.monity
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=./config/google-play-service-account.json
# OU use variável de ambiente com o JSON completo:
# GOOGLE_PLAY_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# App Store Configuration
APP_STORE_SHARED_SECRET=seu_shared_secret_aqui
APP_STORE_BUNDLE_ID=com.Monity

# Ambiente
NODE_ENV=production
```

### 2. Configurar Service Account do Google Play

#### Opção 1: Arquivo JSON
1. Coloque o arquivo JSON baixado em `backend/config/google-play-service-account.json`
2. Adicione ao `.gitignore`:
   ```
   config/google-play-service-account.json
   ```

#### Opção 2: Variável de Ambiente
1. Converta o JSON para uma string (remova quebras de linha)
2. Adicione ao `.env`:
   ```bash
   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

### 3. Implementar Validação Real (Opcional - Atualmente em modo básico)

O código atual está em modo de validação básica para permitir testes. Para produção, você deve:

1. **Descomentar o código de validação real** em `backend/controllers/subscriptionController.ts`
2. **Configurar as credenciais** conforme descrito acima
3. **Testar a validação** antes de ir para produção

---

## 📱 Configuração do Frontend

### 1. Atualizar Product IDs

Edite o arquivo `frontend/Monity/app/src/services/inAppPurchaseService.ts`:

```typescript
const PRODUCT_IDS = {
  PREMIUM_MONTHLY: Platform.select({
    ios: 'com.monity.premium.monthly', // ID configurado no App Store Connect
    android: 'com.monity.premium.monthly', // ID configurado no Google Play Console
  }) as string,
};
```

⚠️ **IMPORTANTE**: Os IDs devem corresponder **exatamente** aos configurados nas stores.

### 2. Configurar app.json (Expo)

O `react-native-iap` funciona automaticamente com Expo. Não é necessário adicionar plugins adicionais.

### 3. Build do App

Para testar pagamentos in-app, você precisa fazer build nativo:

```bash
# Android
eas build --platform android --profile preview

# iOS
eas build --platform ios --profile preview
```

⚠️ **IMPORTANTE**: Pagamentos in-app **NÃO funcionam** no Expo Go. Você precisa de um build nativo.

---

## 🧪 Testes

### Android (Google Play)

1. **Configurar Testadores**:
   - Adicione sua conta Gmail na lista de testadores
   - Publique o app na faixa de teste interno

2. **Instalar App de Teste**:
   - Use o link de inscrição da faixa de teste
   - Certifique-se de estar logado com a conta de testador

3. **Testar Compra**:
   - Abra o app
   - Vá em Perfil > Assinar Premium
   - Clique em "Assinar"
   - Use um **instrumento de teste** do Google Play:
     - "Instrumento de teste, aprovado sempre"
     - "Instrumento de teste, recusado sempre"
   - Complete a compra

4. **Verificar**:
   - O app deve mostrar "Premium Ativo"
   - O backend deve receber e validar a compra
   - Verifique os logs do backend

### iOS (App Store)

1. **Configurar Usuário Sandbox**:
   - Crie um usuário Sandbox no App Store Connect

2. **Instalar App de Teste**:
   - Conecte o dispositivo via Xcode
   - Instale o app através do Xcode

3. **Testar Compra**:
   - Abra o app
   - Vá em Perfil > Assinar Premium
   - Clique em "Assinar"
   - Quando pedir login, use as credenciais do usuário Sandbox
   - Complete a compra

4. **Verificar**:
   - O app deve mostrar "Premium Ativo"
   - O backend deve receber e validar a compra
   - Verifique os logs do backend

5. **Teste de Renovação**:
   - No ambiente Sandbox, renovações são aceleradas
   - Uma assinatura mensal renova a cada 5 minutos
   - Use isso para testar renovações

---

## 🔧 Troubleshooting

### Problema: "Produto não encontrado na store"

**Soluções**:
1. Verifique se o Product ID está correto no código
2. Verifique se a assinatura está **ATIVA** na store
3. Para Android: Certifique-se de que o app está publicado na faixa de teste
4. Para iOS: Certifique-se de que a assinatura foi aprovada pela Apple
5. Aguarde alguns minutos após criar/ativar a assinatura

### Problema: "Falha ao inicializar serviço de pagamento"

**Soluções**:
1. Verifique se está usando um build nativo (não Expo Go)
2. Verifique se o `react-native-iap` está instalado corretamente
3. Para Android: Verifique se o Google Play Services está atualizado
4. Para iOS: Verifique se o dispositivo está conectado via Xcode (para testes)

### Problema: Compra não é validada no backend

**Soluções**:
1. Verifique os logs do backend
2. Verifique se as variáveis de ambiente estão configuradas
3. Para Google Play: Verifique se o Service Account tem as permissões corretas
4. Para App Store: Verifique se o Shared Secret está correto
5. Verifique se o endpoint `/api/v1/subscription-tier/validate-purchase` está acessível

### Problema: "Usuário cancelou a compra"

**Soluções**:
- Isso é normal se o usuário realmente cancelou
- Para testes, use "Instrumento de teste, aprovado sempre" no Google Play
- Para iOS, complete o fluxo de compra no Sandbox

### Problema: Renovação não funciona

**Soluções**:
1. Verifique se o webhook está configurado corretamente
2. Verifique se o webhook está acessível publicamente (HTTPS)
3. Verifique os logs do webhook no backend
4. Para iOS Sandbox: Aguarde 5 minutos (tempo acelerado)

---

## 📝 Checklist Final

### Google Play Console
- [ ] Assinatura criada com ID `com.monity.premium.monthly`
- [ ] Assinatura está **ATIVA**
- [ ] Preço configurado (R$ 9,90)
- [ ] Testadores de licença adicionados
- [ ] App publicado na faixa de teste
- [ ] Service Account criado e vinculado
- [ ] RTDN configurado (opcional, mas recomendado)

### App Store Connect
- [ ] Grupo de assinaturas criado
- [ ] Assinatura criada com ID `com.monity.premium.monthly`
- [ ] Assinatura **APROVADA** pela Apple
- [ ] Preço configurado (R$ 9,90)
- [ ] Usuários Sandbox criados
- [ ] Server-to-Server Notification URL configurada
- [ ] Shared Secret gerado e salvo

### Backend
- [ ] Variáveis de ambiente configuradas
- [ ] Service Account JSON configurado (Google Play)
- [ ] Shared Secret configurado (App Store)
- [ ] Endpoint `/validate-purchase` implementado
- [ ] Webhooks implementados (opcional, mas recomendado)
- [ ] Validação real implementada (remover validação básica em produção)

### Frontend
- [ ] Product IDs atualizados no código
- [ ] `react-native-iap` instalado
- [ ] Build nativo criado (não Expo Go)
- [ ] Testado em dispositivo real

---

## 🚀 Próximos Passos

1. **Implementar validação real** no backend (remover validação básica)
2. **Implementar webhooks** para renovações automáticas
3. **Adicionar analytics** para rastrear conversões
4. **Implementar ofertas promocionais** (teste gratuito, preço introdutório)
5. **Adicionar suporte a múltiplos planos** (mensal, anual, etc.)

---

## 📚 Recursos Adicionais

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [App Store In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)
- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

---

**Última atualização**: Janeiro 2025



