# Configuração do Google OAuth para Monity

Este documento descreve como configurar o login do Google OAuth no aplicativo Monity.

## 📋 Pré-requisitos

Os arquivos de credenciais do Google OAuth devem ser adicionados na pasta `ids/` (não versionados no git):

- **Android**: `client_secret_YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com.json`
- **iOS**: `client_YOUR_IOS_CLIENT_ID.apps.googleusercontent.com.plist`
- **Web**: `client_secret_YOUR_WEB_CLIENT_ID.apps.googleusercontent.com.json`

**⚠️ IMPORTANTE**: Esses arquivos contêm informações sensíveis e não devem ser commitados no git. Eles estão no `.gitignore`.

## 🔑 Credenciais Configuradas

### iOS
- **Client ID**: `YOUR_IOS_CLIENT_ID.apps.googleusercontent.com`
- **Reversed Client ID**: `com.googleusercontent.apps.YOUR_IOS_CLIENT_ID`
- **Bundle ID**: `com.Monity`

### Android
- **Client ID**: `YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com`
- **Package Name**: `com.Monity`

### Web
- **Client ID**: `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com`
- **Client Secret**: `YOUR_WEB_CLIENT_SECRET`

**⚠️ IMPORTANTE**: Substitua os valores acima pelas suas credenciais reais do Google Cloud Console.

## ⚙️ Configuração no Supabase Dashboard

**IMPORTANTE**: As credenciais do Google OAuth devem ser configuradas no Supabase Dashboard para que o login funcione corretamente.

### Passos:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto Monity
3. Vá em **Authentication** > **Providers**
4. Clique em **Google**
5. Ative o provider Google
6. Configure as seguintes informações:

#### Para Web:
- **Client ID (for OAuth)**: `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com`
- **Client Secret (for OAuth)**: `YOUR_WEB_CLIENT_SECRET`

**⚠️ IMPORTANTE**: Use suas credenciais reais do Google Cloud Console.

#### URLs de Redirect Autorizadas:

Adicione as seguintes URLs de redirect no Supabase:

```
monity://auth/callback
exp://192.168.18.41:8081/--/auth/callback
https://auth.expo.io/@fabinnm/Monity
```

**Nota**: As URLs de redirect são geradas automaticamente pelo Expo. Verifique os logs do console durante o login para ver a URL exata sendo usada.

### Configuração no Google Cloud Console

**⚠️ IMPORTANTE**: Este é o passo mais crítico! O erro `redirect_uri_mismatch` ocorre quando a URL de redirect não está autorizada.

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto `projeto-montiy`
3. Vá em **APIs & Services** > **Credentials**
4. Clique no **Web Client ID** (seu `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com`)
5. Em **Authorized redirect URIs**, adicione **EXATAMENTE** estas URLs:

```
https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
https://auth.expo.io/@fabinnm/Monity
exp://192.168.18.41:8081/--/auth/callback
```

**⚠️ CRÍTICO**: A URL `https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback` é a mais importante! Esta é a URL que o Supabase usa para receber o callback do Google.

6. Clique em **Save**
7. Aguarde alguns minutos para as mudanças serem propagadas

**Nota**: Para iOS e Android, as URLs são gerenciadas automaticamente pelo Expo, mas o Web Client ID é usado pelo Supabase para fazer o OAuth.

## 📱 Configuração no App

As credenciais já foram configuradas no `app.json`:

```json
{
  "extra": {
    "googleOAuth": {
      "iosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
      "androidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
      "webClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
      "webClientSecret": "YOUR_WEB_CLIENT_SECRET"
    }
  },
  "ios": {
    "bundleIdentifier": "com.Monity",
    "googleServicesFile": "./ids/client_YOUR_IOS_CLIENT_ID.apps.googleusercontent.com.plist"
  },
  "android": {
    "package": "com.Monity",
    "googleServicesFile": "./ids/client_secret_YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com.json"
  }
}
```

**⚠️ IMPORTANTE**: Substitua os valores acima pelas suas credenciais reais. Em produção, considere usar variáveis de ambiente do Expo (EAS Secrets) para maior segurança.

## 🧪 Testando o Login

1. Execute o aplicativo:
   ```bash
   cd frontend/Monity
   npm start
   ```

2. Na tela de login, clique no botão "Continuar com Google"

3. Verifique os logs no console para ver:
   - A URL de redirect sendo usada
   - As credenciais do Google carregadas
   - O fluxo de autenticação

## 🔍 Troubleshooting

### Erro: "redirect_uri_mismatch" ⚠️

Este é o erro mais comum! Significa que a URL de redirect não está autorizada no Google Cloud Console.

**Solução Rápida**:

1. **Acesse o Google Cloud Console**: https://console.cloud.google.com
2. **Selecione o projeto**: `projeto-montiy`
3. **Vá em**: APIs & Services > Credentials
4. **Clique no Web Client ID**: seu `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com`
5. **Em "Authorized redirect URIs"**, adicione estas URLs:

```
https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
https://auth.expo.io/@fabinnm/Monity
```

6. **Clique em "Save"**
7. **Aguarde 2-5 minutos** para as mudanças serem propagadas
8. **Tente fazer login novamente**

**Por que isso acontece?**
- O Supabase usa o Web Client ID para fazer OAuth com o Google
- O Supabase precisa que sua URL de callback (`https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback`) esteja autorizada
- Sem essa URL, o Google bloqueia o redirect e retorna o erro 400

**Verificando a URL correta**:
- Verifique os logs do console quando fizer login
- Procure por "🔗 Redirect URL" ou "🔗 Supabase Callback URL"
- A URL exata deve estar nos logs

### Erro: "invalid_client"
- Verifique se o Client ID está correto no Supabase Dashboard
- Verifique se o Client Secret está correto (apenas para Web)

### Erro: "OAuth flow failed"
- Verifique se o provider Google está ativado no Supabase Dashboard
- Verifique se as credenciais estão configuradas corretamente
- Verifique a conexão com a internet

### Login não funciona no iOS/Android
- Certifique-se de que o build foi feito após as configurações
- Para iOS: Verifique se o Bundle ID está correto
- Para Android: Verifique se o Package Name está correto

## 📚 Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

