# Como Resolver o Erro redirect_uri_mismatch

## 🔍 Problema

O erro `Error 400: redirect_uri_mismatch` significa que a URL de redirect que está sendo usada não está autorizada no Google Cloud Console.

## ✅ Solução Passo a Passo

### Passo 1: Verificar a URL Exata nos Logs

1. **Execute o app** e tente fazer login com Google
2. **Verifique os logs** no console - você verá algo como:
   ```
   🔍 Redirect URI extraída da URL: [URL_QUE_ESTA_SENDO_USADA]
   ```
3. **Copie essa URL exata** - ela precisa ser adicionada no Google Cloud Console

### Passo 2: Adicionar a URL no Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Selecione o projeto: **projeto-montiy**
3. Vá em: **APIs & Services** > **Credentials**
4. Clique no **Web Client ID**: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
5. Em **Authorized redirect URIs**, clique em **ADD URI**
6. **Adicione TODAS estas URLs** (uma por uma):

```
https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
https://auth.expo.io/@fabinnm/Monity
exp://192.168.18.41:8081/--/auth/callback
exp://localhost:8081/--/auth/callback
monity://auth/callback
```

7. **IMPORTANTE**: Se você viu uma URL diferente nos logs, adicione essa também!
8. Clique em **SAVE**
9. **Aguarde 3-5 minutos** para as mudanças serem propagadas

### Passo 3: Verificar no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** > **URL Configuration**
4. Em **Redirect URLs**, adicione:

```
monity://auth/callback
exp://192.168.18.41:8081/--/auth/callback
https://auth.expo.io/@fabinnm/Monity
```

5. Clique em **Save**

### Passo 4: Testar Novamente

1. Feche completamente o app
2. Abra novamente
3. Tente fazer login com Google
4. Verifique os logs novamente

## 🔍 URLs Comuns que Podem Aparecer

Dependendo da plataforma e ambiente, você pode ver URLs como:

- **Expo Proxy (desenvolvimento)**: `https://auth.expo.io/@fabinnm/Monity`
- **Expo Local**: `exp://192.168.18.41:8081/--/auth/callback`
- **Custom Scheme**: `monity://auth/callback`
- **Supabase Callback**: `https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback`

**Todas elas precisam estar autorizadas no Google Cloud Console!**

## ⚠️ Checklist

- [ ] Verifiquei os logs e copiei a URL exata
- [ ] Adicionei a URL do Supabase no Google Cloud Console
- [ ] Adicionei todas as URLs do Expo no Google Cloud Console
- [ ] Adicionei as URLs no Supabase Dashboard
- [ ] Aguardei 3-5 minutos após salvar
- [ ] Fechei e reabri o app
- [ ] Testei novamente

## 🆘 Ainda Não Funciona?

Se ainda não funcionar após seguir todos os passos:

1. **Capture a URL exata** dos logs quando tentar fazer login
2. **Verifique se a URL está EXATAMENTE igual** no Google Cloud Console (sem diferenças de trailing slash, query params, etc.)
3. **Verifique se salvou** as mudanças no Google Cloud Console
4. **Aguarde mais tempo** - às vezes pode levar até 10 minutos para propagar

## 📝 Nota Importante

O Google é muito específico sobre URLs - elas precisam ser **exatamente iguais**, incluindo:
- Protocolo (http vs https)
- Domínio completo
- Caminho (path)
- Nenhuma diferença de maiúsculas/minúsculas
- Sem trailing slash extra (a menos que esteja na URL)








