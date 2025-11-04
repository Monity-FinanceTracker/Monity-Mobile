# Como Resolver o Erro 500 no Login com Google

## 🔍 Problema Identificado

Ao fazer login com Google, o app retorna erro 500 com a mensagem:
```
{"code":500,"error_code":"unexpected_failure","msg":"Unexpected failure, please check server logs for more information"}
```

E no console aparecem erros relacionados a cookies:
```
Cookie "__cf_bm" has been rejected for invalid domain. callback
Cookie "__cf_bm" has been rejected for invalid domain. favicon.ico
A resource is blocked by OpaqueResponseBlocking, please check browser console for details.
```

## 🎯 Causa Raiz Identificada

Após análise dos logs do backend, identificamos que o problema real é:

1. **Rate Limiting Muito Restritivo**: O endpoint `/auth/profile` estava usando o `authLimiter` que permite apenas 10 requisições por 15 minutos em produção. Quando o usuário faz login com Google, o app tenta buscar o perfil imediatamente, mas muitas requisições rápidas ou tentativas anteriores causam bloqueio por rate limiting (erro 429).

2. **Erros de Cookies do Navegador**: Os erros de cookies `__cf_bm` e `OpaqueResponseBlocking` são avisos do navegador relacionados ao processamento do OAuth callback, mas não são a causa principal do erro 500.

3. **Problemas de CORS/Cookies**: O método `getSessionFromUrl()` do Supabase pode causar problemas, então foi removido.

## ✅ Solução Implementada

### 1. Ajustado Rate Limiting para `/auth/profile`

**Problema**: O endpoint `/auth/profile` estava usando o `authLimiter` (10 requisições/15min), que é muito restritivo para um endpoint autenticado que é chamado frequentemente.

**Solução**: Separamos o rate limiting:
- **Endpoints públicos** (login, register, check-email): Continuam usando `authLimiter` (10 req/15min)
- **Endpoints autenticados** (profile, financial-health, etc.): Agora usam `apiLimiter` (200 req/min em produção)

Isso permite que o app busque o perfil do usuário após o login sem ser bloqueado por rate limiting.

### 2. Removido `getSessionFromUrl()`

O método `getSessionFromUrl()` foi removido pois pode causar problemas de CORS/cookies. Agora usamos apenas `exchangeCodeForSession()` que é mais direto e seguro.

### 3. Melhorado Parsing de URL

Adicionado parsing melhorado para lidar com custom schemes (`monity://`) e URLs em diferentes formatos, extraindo os parâmetros manualmente quando necessário.

### 4. Melhor Tratamento de Erros

Adicionado melhor tratamento de erros e logs para facilitar o debug.

## 📝 Mudanças no Código

### Backend: `backend/routes/auth.ts` e `backend/routes/index.ts`

**Antes:**
- Todos os endpoints em `/auth` usavam `authLimiter` (10 req/15min)
- Isso causava bloqueio quando o app tentava buscar o perfil após login

**Depois:**
- Endpoints públicos (login, register, check-email): `authLimiter` (10 req/15min)
- Endpoints autenticados (profile, etc.): `apiLimiter` (200 req/min)

### Frontend: `frontend/Monity/app/src/services/socialAuthService.ts`

**Antes:**
- Usava `getSessionFromUrl()` que podia causar problemas de CORS
- Parsing de URL limitado

**Depois:**
- Usa apenas `exchangeCodeForSession()` com o código extraído da URL
- Parsing melhorado que lida com custom schemes
- Extração manual de parâmetros quando o parsing normal falha

## 🔧 Como Funciona Agora

1. App abre browser → Supabase OAuth URL
2. Supabase redireciona → Google login
3. Google autentica → Redireciona para Supabase callback
4. Supabase processa → Redireciona para `monity://auth/callback?code=...`
5. iOS/Android intercepta `monity://` → Abre o app
6. App extrai o código da URL manualmente
7. App usa `exchangeCodeForSession()` para trocar código por sessão
8. Token é salvo e usuário é autenticado

## ⚠️ Configurações Necessárias

### Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Vá em: **Authentication** > **URL Configuration**
3. Em **Redirect URLs**, certifique-se de ter:
   ```
   monity://auth/callback
   ```

### Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Projeto: `projeto-montiy`
3. APIs & Services > Credentials
4. Web Client ID: `225354640415-7c5lgokagg6u1kvngg3egolsefes8n6e.apps.googleusercontent.com`
5. Em **Authorized redirect URIs**, certifique-se de ter:
   ```
   https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback
   ```

## 🧪 Teste

1. Feche completamente o app
2. Abra novamente
3. Tente fazer login com Google
4. Verifique os logs no console:
   - Deve aparecer: `🔄 Usando exchangeCodeForSession para trocar código por sessão...`
   - Não deve aparecer: `🔄 Tentando getSessionFromUrl...`
   - Deve aparecer: `✅ Sessão criada com sucesso`

## 🆘 Ainda Não Funciona?

Se ainda houver erro 500:

1. **Verifique os logs do servidor backend** para ver se há erros específicos
2. **Verifique se o código está sendo extraído corretamente** da URL (verifique os logs: `🔑 Código encontrado: SIM`)
3. **Verifique se o token está sendo salvo** (verifique os logs: `✅ Token salvo com sucesso`)
4. **Verifique se o erro está no `getProfile()`** após o login - pode ser um problema diferente no backend

## 📋 Checklist

- [x] Removido `getSessionFromUrl()` que causava problemas de CORS
- [x] Melhorado parsing de URL para custom schemes
- [x] Adicionado melhor tratamento de erros
- [ ] Verificado que `monity://auth/callback` está configurado no Supabase
- [ ] Verificado que callback URL do Supabase está no Google Cloud Console
- [ ] Testado login com Google após as mudanças
- [ ] Verificado logs do servidor backend se ainda houver erro 500

