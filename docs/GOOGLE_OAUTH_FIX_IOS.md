# Como Resolver o Erro redirect_uri_mismatch no iOS

## 🔍 Problema Identificado

O Supabase estava detectando a plataforma iOS e tentando usar o **iOS Client ID** (`225354640415-hj201o4upab8ok547kuof5o3on9t84pd.apps.googleusercontent.com`).

**IMPORTANTE**: O iOS Client ID é um client **nativo** e **NÃO aceita URLs de redirect**. Apenas o Web Client ID aceita URLs de redirect.

## ✅ Solução Implementada

O código agora **força o uso do Web Client ID** sempre, independente da plataforma. Isso garante que o OAuth funcione corretamente.

## ⚙️ Configuração no Google Cloud Console

### Passo 1: Configurar o Web Client ID

1. Acesse: https://console.cloud.google.com
2. Selecione o projeto: **projeto-montiy**
3. Vá em: **APIs & Services** > **Credentials**
4. Clique no **Web Client ID**: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
5. Em **Authorized redirect URIs**, adicione estas URLs:
   ```
   https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
   https://auth.expo.io/@fabinnm/Monity
   ```
6. Clique em **Save**

**Nota**: O iOS Client ID não precisa de configuração de URLs porque não é usado para OAuth via web. Ele é apenas para autenticação nativa iOS (se necessário no futuro).

### Passo 2: Aguardar Propagação

- Aguarde **3-5 minutos** para as mudanças serem propagadas no Google

### Passo 3: Testar Novamente

1. Feche completamente o app
2. Abra novamente
3. Tente fazer login com Google
4. Verifique nos logs que está usando o Web Client ID:
   ```
   ℹ️ Forçando uso do Web Client ID para OAuth: 225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com
   ```

## 📝 Por Que Isso Funciona?

O código agora **força o uso do Web Client ID** sempre, mesmo quando rodando no iOS. Isso garante que:

- O Google OAuth sempre usa o Web Client ID (que aceita URLs de redirect)
- A URL de callback do Supabase está autorizada no Web Client ID
- O iOS Client ID não é usado para OAuth via web (ele é apenas para autenticação nativa iOS, se necessário no futuro)

## ✅ Checklist

- [ ] Adicionei as URLs no Web Client ID (apenas este é necessário)
- [ ] Aguardei 3-5 minutos
- [ ] Fechei e reabri o app
- [ ] Testei novamente
- [ ] Verifiquei nos logs que está usando o Web Client ID

## 🆘 Ainda Não Funciona?

Se ainda não funcionar:

1. Verifique nos logs que o Web Client ID está sendo usado
2. Certifique-se de que as URLs estão **exatamente** como acima no Google Cloud Console
3. Verifique se salvou as mudanças no Google Cloud Console
4. Aguarde mais tempo (pode levar até 10 minutos para propagar)
