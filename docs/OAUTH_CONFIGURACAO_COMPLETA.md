# 🔐 Configuração Completa de OAuth - Google e Apple

## 📋 Status da Implementação

### ✅ O que já está implementado:

1. **Frontend:**
   - ✅ Serviços de autenticação social (`socialAuthService.ts`)
   - ✅ Context para gerenciar autenticação (`SocialAuthContext.tsx`)
   - ✅ Integração com AuthContext (`AuthContext.tsx`)
   - ✅ Botões de login ativados na tela de Login
   - ✅ Tratamento de erros e loading states

2. **Backend:**
   - ✅ Middleware de autenticação que funciona com tokens do Supabase (incluindo OAuth)
   - ✅ Não precisa de endpoints específicos - usa Supabase Auth diretamente

3. **Credenciais:**
   - ✅ Arquivos de credenciais existem na pasta `ids/`:
     - iOS: `client_225354640415-hj201o4upab8ok547kuof5o3on9t84pd.apps.googleusercontent.com.plist`
     - Android: `client_secret_225354640415-i4jt50qe2gge4d0h3r1n4dudg408oqul.apps.googleusercontent.com.json`
     - Web: `client_secret_225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com.json`

### ⚠️ O que falta configurar:

## 🔧 Configurações Necessárias

### 1. Atualizar `app.json` com Credenciais Reais

O arquivo `app.json` ainda tem placeholders. Você precisa substituir pelos valores reais:

**Client IDs encontrados nos arquivos:**
- **iOS Client ID**: `225354640415-hj201o4upab8ok547kuof5o3on9t84pd.apps.googleusercontent.com`
- **Android Client ID**: `225354640415-i4jt50qe2gge4d0h3r1n4dudg408oqul.apps.googleusercontent.com`
- **Web Client ID**: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
- **Web Client Secret**: `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` (encontrado no arquivo JSON)

**Atualizar em `frontend/Monity/app.json`:**
```json
"googleOAuth": {
  "iosClientId": "225354640415-hj201o4upab8ok547kuof5o3on9t84pd.apps.googleusercontent.com",
  "androidClientId": "225354640415-i4jt50qe2gge4d0h3r1n4dudg408oqul.apps.googleusercontent.com",
  "webClientId": "225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com",
  "webClientSecret": "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"
}
```

### 2. Configurar Google OAuth no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto Monity
3. Vá em **Authentication** > **Providers**
4. Clique em **Google**
5. **Ative o provider Google**
6. Configure:
   - **Client ID (for OAuth)**: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: `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`
7. Clique em **Save**

### 3. Configurar URLs de Redirect no Supabase

1. No Supabase Dashboard, vá em **Authentication** > **URL Configuration**
2. Em **Redirect URLs**, adicione:
   ```
   monity://auth/callback
   exp://192.168.18.41:8081/--/auth/callback
   https://auth.expo.io/@fabinnm/Monity
   ```
3. Clique em **Save**

### 4. Configurar URLs de Redirect no Google Cloud Console ⚠️ CRÍTICO

Este é o passo mais importante! O erro `redirect_uri_mismatch` ocorre quando as URLs não estão autorizadas.

1. Acesse: https://console.cloud.google.com
2. Selecione o projeto: **projeto-montiy**
3. Vá em **APIs & Services** > **Credentials**
4. Clique no **Web Client ID**: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
5. Em **Authorized redirect URIs**, adicione **TODAS** estas URLs (uma por uma):
   ```
   https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
   https://auth.expo.io/@fabinnm/Monity
   exp://192.168.18.41:8081/--/auth/callback
   exp://localhost:8081/--/auth/callback
   monity://auth/callback
   ```
6. Clique em **Save**
7. **Aguarde 3-5 minutos** para as mudanças serem propagadas

**⚠️ IMPORTANTE**: A URL `https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback` é a mais crítica! Esta é a URL que o Supabase usa para receber o callback do Google.

### 5. Configurar Apple Sign In no Supabase Dashboard

1. No Supabase Dashboard, vá em **Authentication** > **Providers**
2. Clique em **Apple**
3. **Ative o provider Apple**
4. Configure:
   - **Services ID**: (você precisa criar no Apple Developer Console)
   - **Secret Key**: (você precisa gerar no Apple Developer Console)
   - **Team ID**: (seu Team ID da Apple)
5. Clique em **Save**

**Nota**: Para configurar Apple Sign In, você precisa:
- Ter uma conta Apple Developer (paga)
- Criar um App ID no Apple Developer Console
- Criar um Services ID
- Configurar o Bundle ID: `com.Monity`
- Gerar uma chave privada para autenticação

### 6. Verificar Configuração do App

**iOS:**
- Bundle ID: `com.Monity` ✅ (já configurado)
- Google Services File: `./ids/client_225354640415-hj201o4upab8ok547kuof5o3on9t84pd.apps.googleusercontent.com.plist` ✅ (arquivo existe)

**Android:**
- Package Name: `com.widechain.monity` ⚠️ (verificar se está correto)
- Google Services File: `./ids/client_secret_225354640415-i4jt50qe2gge4d0h3r1n4dudg408oqul.apps.googleusercontent.com.json` ✅ (arquivo existe)

**⚠️ ATENÇÃO**: O package name do Android no `app.json` é `com.widechain.monity`, mas o Bundle ID do iOS é `com.Monity`. Verifique se isso está correto no Google Cloud Console.

## 🧪 Como Testar

### Google OAuth:

1. Execute o app:
   ```bash
   cd frontend/Monity
   npm start
   ```

2. Na tela de login, clique em "Continue com Google"

3. Verifique os logs no console:
   - Deve mostrar a URL OAuth sendo gerada
   - Deve abrir o navegador para autenticação
   - Após autenticar, deve voltar para o app

4. Se der erro `redirect_uri_mismatch`:
   - Verifique os logs para ver a URL exata sendo usada
   - Adicione essa URL no Google Cloud Console
   - Aguarde alguns minutos e tente novamente

### Apple Sign In:

1. Execute o app em um dispositivo iOS real (não funciona no simulador)
2. Na tela de login, clique em "Continue com Apple"
3. Complete o fluxo de autenticação da Apple
4. O app deve fazer login automaticamente

## 🔍 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: URL de redirect não autorizada no Google Cloud Console

**Solução**:
1. Verifique os logs para ver a URL exata
2. Adicione a URL no Google Cloud Console
3. Aguarde 3-5 minutos
4. Tente novamente

### Erro: "invalid_client"

**Causa**: Client ID ou Client Secret incorretos no Supabase

**Solução**:
1. Verifique as credenciais no Supabase Dashboard
2. Certifique-se de que está usando o Web Client ID e Secret
3. Salve as mudanças

### Erro: "OAuth flow failed"

**Causa**: Provider não ativado ou configuração incorreta

**Solução**:
1. Verifique se o provider está ativado no Supabase
2. Verifique se as credenciais estão corretas
3. Verifique a conexão com a internet

### Apple Sign In não aparece

**Causa**: Apenas funciona em dispositivos iOS reais

**Solução**:
- Teste em um dispositivo iOS físico
- Verifique se o Bundle ID está correto
- Verifique se o Apple Sign In está configurado no Supabase

## ✅ Checklist Final

### Google OAuth:
- [ ] Atualizar `app.json` com credenciais reais
- [ ] Configurar Google OAuth no Supabase Dashboard
- [ ] Adicionar URLs de redirect no Supabase
- [ ] Adicionar URLs de redirect no Google Cloud Console
- [ ] Aguardar propagação das mudanças (3-5 minutos)
- [ ] Testar login com Google

### Apple Sign In:
- [ ] Configurar Apple Sign In no Supabase Dashboard
- [ ] Criar Services ID no Apple Developer Console
- [ ] Gerar chave privada no Apple Developer Console
- [ ] Configurar Bundle ID no Apple Developer Console
- [ ] Testar em dispositivo iOS real

## 📚 Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

