# 🔑 Onde Encontrar Cada Chave/Configuração - In-App Purchase

Este documento explica exatamente onde encontrar cada uma das chaves e configurações necessárias para o sistema de pagamento in-app.

---

## 📱 Google Play Configuration

### 1. `GOOGLE_PLAY_PACKAGE_NAME`

**Onde encontrar:**
- ✅ **Já está configurado no `app.json`**: `com.widechain.monity`
- 📍 **Localização no código**: `frontend/Monity/app.json` → `android.package`

**⚠️ ATENÇÃO**: Há uma inconsistência no documento. O package name real do Android é `com.widechain.monity` (conforme `app.json`), mas o documento menciona `com.Monity`. Use o valor do `app.json`.

**Valor correto:**
```bash
GOOGLE_PLAY_PACKAGE_NAME=com.widechain.monity
```

**Como verificar no Google Play Console:**
1. Acesse [Google Play Console](https://play.google.com/console)
2. Selecione seu app **Monity**
3. Vá em **Configuração do app > Detalhes do app**
4. O **Nome do pacote** está listado lá

---

### 2. `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH` ou `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

**O que é:** Arquivo JSON com credenciais de uma Service Account do Google Cloud, usado para validar compras no backend.

**Como criar (passo a passo):**

#### Passo 1: Criar Service Account no Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto **projeto-montiy** (ou crie um novo)
3. No menu lateral, vá em **IAM & Admin > Service Accounts**
4. Clique em **+ CREATE SERVICE ACCOUNT** (ou **Criar conta de serviço**)
5. Preencha:
   - **Service account name**: `monity-play-billing`
   - **Service account ID**: será gerado automaticamente
   - **Description**: `Service account para validação de compras Google Play`
6. Clique em **CREATE AND CONTINUE**

#### Passo 2: Conceder Permissões
1. Na etapa **Grant this service account access to project**, adicione a role:
   - **Service Account User**
2. Clique em **CONTINUE** e depois **DONE**

#### Passo 3: Criar e Baixar Chave JSON
1. Clique na service account criada (`monity-play-billing`)
2. Vá na aba **KEYS** (ou **Chaves**)
3. Clique em **ADD KEY > Create new key**
4. Selecione **JSON**
5. Clique em **CREATE**
6. O arquivo JSON será baixado automaticamente
7. ⚠️ **GUARDE ESTE ARQUIVO EM LOCAL SEGURO!** Ele contém credenciais sensíveis.

#### Passo 4: Vincular Service Account ao Google Play Console
1. Acesse [Google Play Console](https://play.google.com/console)
2. Selecione seu app **Monity**
3. Vá em **Configurações > API access**
4. Na seção **Service accounts**, clique em **Link service account**
5. Cole o **email da service account** (está no arquivo JSON, campo `client_email`)
   - Exemplo: `monity-play-billing@projeto-montiy.iam.gserviceaccount.com`
6. Clique em **Grant access**
7. Selecione as permissões:
   - ✅ **View financial data, orders, and cancellation survey responses**
   - ✅ **Manage orders and subscriptions**
8. Clique em **Invite user**

#### Passo 5: Configurar no Backend

**Opção A: Usar arquivo JSON (Recomendado para desenvolvimento)**
1. Crie a pasta `backend/config/` se não existir
2. Coloque o arquivo JSON baixado em `backend/config/google-play-service-account.json`
3. Adicione ao `.gitignore`:
   ```
   config/google-play-service-account.json
   ```
4. Configure no `.env`:
   ```bash
   GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=./config/google-play-service-account.json
   ```

**Opção B: Usar variável de ambiente (Recomendado para produção)**
1. Abra o arquivo JSON baixado
2. Converta todo o conteúdo para uma única linha (remova quebras de linha)
3. Adicione ao `.env`:
   ```bash
   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"projeto-montiy",...}'
   ```
   - ⚠️ Use aspas simples para evitar problemas com caracteres especiais

**Estrutura do arquivo JSON:**
```json
{
  "type": "service_account",
  "project_id": "projeto-montiy",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "monity-play-billing@projeto-montiy.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## 🍎 App Store Configuration

### 3. `APP_STORE_SHARED_SECRET`

**O que é:** Uma chave secreta gerada no App Store Connect, usada para validar notificações de assinatura do servidor.

**Como obter:**

#### Passo 1: Acessar App Store Connect
1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Faça login com sua conta Apple Developer
3. Selecione seu app **Monity**

#### Passo 2: Navegar até In-App Purchases
1. No menu lateral, vá em **Recursos > In-App Purchases**
2. Se você ainda não criou um grupo de assinaturas, crie um primeiro:
   - Clique em **+** ou **Criar**
   - Selecione **Grupo de assinaturas**
   - Dê um nome (ex: "Monity Premium")

#### Passo 3: Gerar App-Specific Shared Secret
1. Clique no grupo de assinaturas criado
2. Vá na seção **App-Specific Shared Secret**
3. Clique em **Gerar** (ou **Generate**)
4. ⚠️ **COPIE E GUARDE ESTE SECRET IMEDIATAMENTE!** Ele só é mostrado uma vez.
5. Se você já gerou antes e perdeu, pode gerar um novo (o anterior será invalidado)

#### Passo 4: Configurar no Backend
Adicione ao `.env`:
```bash
APP_STORE_SHARED_SECRET=seu_shared_secret_gerado_aqui
```

**Exemplo de formato:**
```
APP_STORE_SHARED_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**⚠️ IMPORTANTE:**
- Este secret é específico para cada app
- Se você tiver múltiplos apps, cada um terá seu próprio secret
- Guarde em local seguro e não compartilhe publicamente

---

### 4. `APP_STORE_BUNDLE_ID`

**Onde encontrar:**
- ✅ **Já está configurado no `app.json`**: `com.Monity`
- 📍 **Localização no código**: `frontend/Monity/app.json` → `ios.bundleIdentifier`

**Valor correto:**
```bash
APP_STORE_BUNDLE_ID=com.Monity
```

**Como verificar no App Store Connect:**
1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Selecione seu app **Monity**
3. Vá em **App Information**
4. O **Bundle ID** está listado lá

**Como verificar no Apple Developer Portal:**
1. Acesse [Apple Developer Portal](https://developer.apple.com/account)
2. Vá em **Certificates, Identifiers & Profiles**
3. Clique em **Identifiers**
4. Procure por **App IDs**
5. Encontre o Bundle ID do seu app

---

## 📋 Resumo das Configurações

### Valores já configurados no `app.json`:

| Configuração | Valor | Localização |
|-------------|-------|-------------|
| `GOOGLE_PLAY_PACKAGE_NAME` | `com.widechain.monity` | `app.json` → `android.package` |
| `APP_STORE_BUNDLE_ID` | `com.Monity` | `app.json` → `ios.bundleIdentifier` |

### Valores que você precisa criar/obter:

| Configuração | Onde obter | Status |
|-------------|------------|--------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH` | Google Cloud Console → Service Accounts | ⚠️ Precisa criar |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Mesmo que acima (alternativa) | ⚠️ Precisa criar |
| `APP_STORE_SHARED_SECRET` | App Store Connect → In-App Purchases | ⚠️ Precisa gerar |

---

## ✅ Checklist de Configuração

### Google Play:
- [ ] Service Account criada no Google Cloud Console
- [ ] Chave JSON baixada e guardada em local seguro
- [ ] Service Account vinculada ao Google Play Console
- [ ] Permissões concedidas no Google Play Console
- [ ] Arquivo JSON colocado em `backend/config/` OU variável de ambiente configurada
- [ ] `.env` configurado com `GOOGLE_PLAY_PACKAGE_NAME` e `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH` (ou `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`)

### App Store:
- [ ] Grupo de assinaturas criado no App Store Connect
- [ ] App-Specific Shared Secret gerado
- [ ] `.env` configurado com `APP_STORE_SHARED_SECRET` e `APP_STORE_BUNDLE_ID`

---

## 🔒 Segurança

⚠️ **IMPORTANTE - Boas Práticas de Segurança:**

1. **Nunca commite arquivos de credenciais no Git:**
   - Adicione `config/google-play-service-account.json` ao `.gitignore`
   - Use variáveis de ambiente em produção

2. **Use variáveis de ambiente em produção:**
   - Railway, Heroku, AWS, etc. têm sistemas de variáveis de ambiente
   - Não coloque credenciais diretamente no código

3. **Rotacione credenciais periodicamente:**
   - Gere novas chaves a cada 6-12 meses
   - Revogue chaves antigas que não estão mais em uso

4. **Limite permissões:**
   - Dê apenas as permissões necessárias à Service Account
   - Não use contas com permissões administrativas

---

## 🆘 Troubleshooting

### Erro: "Service account not linked"
- Verifique se a Service Account foi vinculada no Google Play Console
- Verifique se o email da Service Account está correto
- Aguarde alguns minutos após vincular (pode levar tempo para propagar)

### Erro: "Invalid shared secret"
- Verifique se copiou o secret completo (sem espaços)
- Verifique se não há caracteres extras
- Gere um novo secret se necessário

### Erro: "Package name mismatch"
- Verifique se o package name no `.env` corresponde ao do `app.json`
- Para Android: use `com.widechain.monity`
- Para iOS: use `com.Monity`

---

## 📚 Referências

- [Google Play Billing Library](https://developer.android.com/google/play/billing)
- [App Store Connect - In-App Purchases](https://developer.apple.com/app-store-connect/)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)

