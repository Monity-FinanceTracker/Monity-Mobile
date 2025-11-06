# Como Resolver o Problema do Callback no Localhost

## 🔍 Problema

Após autenticar com Google, o app está parando no localhost e mostrando erro "Safari can't open the page because it couldn't connect to the server".

## ✅ Solução

O problema é que o Supabase precisa redirecionar de volta para o app usando o custom scheme `monity://auth/callback`.

### Passo 1: Configurar no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** > **URL Configuration**
4. Em **Redirect URLs**, adicione:
   ```
   monity://auth/callback
   ```
5. Clique em **Save**

### Passo 2: Verificar no Google Cloud Console

As "Origens JavaScript autorizadas" não são necessárias para OAuth redirect. O que importa são as **Authorized redirect URIs**.

1. Acesse: https://console.cloud.google.com
2. Projeto: `projeto-montiy`
3. APIs & Services > Credentials
4. Web Client ID: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
5. Em **Authorized redirect URIs**, certifique-se de que está:
   ```
   https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
   ```
6. Clique em **Save**

### Passo 3: Como Funciona

1. App abre browser → Supabase OAuth URL
2. Supabase redireciona → Google login
3. Google autentica → Redireciona para Supabase callback (`https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback`)
4. Supabase processa → Redireciona para `monity://auth/callback`
5. iOS/Android intercepta `monity://` → Abre o app novamente
6. App processa o callback → Faz login

## ⚠️ Importante

- O Google OAuth NÃO precisa de `monity://` nas URLs autorizadas
- O Google redireciona para o Supabase callback URL
- O Supabase redireciona para `monity://auth/callback` (que precisa estar configurado no Supabase Dashboard)
- O sistema operacional intercepta `monity://` e abre o app

## 🧪 Teste

1. Configure `monity://auth/callback` no Supabase Dashboard
2. Feche completamente o app
3. Abra novamente
4. Tente fazer login com Google
5. Após autenticar, o app deve abrir automaticamente



