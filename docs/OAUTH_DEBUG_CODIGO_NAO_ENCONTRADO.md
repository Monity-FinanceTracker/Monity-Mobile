# 🔍 Debug: Código de Autenticação Não Encontrado

## 📋 Problema

Ao tentar fazer login com Google:
1. ✅ O navegador abre corretamente
2. ✅ O usuário seleciona a conta
3. ✅ O callback retorna para o app (`authResult.type === 'success'`)
4. ❌ Mas o código de autenticação não é encontrado na URL

## 🔍 Análise do Problema

O erro ocorre porque:
- O `WebBrowser.openAuthSessionAsync` retorna `type: 'success'`
- Mas a URL de callback não contém o parâmetro `code` ou `access_token`
- Isso geralmente significa que o Supabase está redirecionando para uma URL diferente da esperada

## 🎯 Possíveis Causas

### 1. **URL de Redirect não configurada no Supabase** ⚠️ MAIS PROVÁVEL

O Supabase precisa ter a URL `monity://auth/callback` configurada em:
- **Authentication** > **URL Configuration** > **Redirect URLs**

**Solução:**
1. Acesse: https://app.supabase.com
2. Vá em **Authentication** > **URL Configuration**
3. Em **Redirect URLs**, adicione:
   ```
   monity://auth/callback
   ```
4. Clique em **Save**

### 2. **Supabase redirecionando para URL HTTPS ao invés do custom scheme**

O Supabase pode estar redirecionando para `https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback` ao invés de `monity://auth/callback`.

**Solução:**
- Verifique se o `redirectTo` está sendo passado corretamente no `signInWithOAuth`
- O código já está configurado para usar `monity://auth/callback`
- Mas pode ser necessário verificar se o Supabase está respeitando essa configuração

### 3. **URL de callback não está sendo interceptada corretamente**

O `WebBrowser.openAuthSessionAsync` pode não estar interceptando o custom scheme corretamente.

**Solução:**
- Verifique se o `scheme: "monity"` está configurado no `app.json` ✅ (já está)
- Verifique se o app está registrado para interceptar o custom scheme

### 4. **Código vindo em formato diferente**

O código pode estar vindo em um formato diferente (hash fragment vs query params).

**Solução:**
- O código já foi atualizado para verificar tanto query params quanto hash fragments
- Os logs adicionais vão mostrar exatamente o que está vindo na URL

## 🔧 Como Debugar

Com os logs adicionados, você verá:

1. **URL completa recebida:**
   ```
   📱 Auth result URL: [URL completa]
   ```

2. **Parâmetros extraídos:**
   ```
   🔍 Parâmetros extraídos: {
     hasCode: true/false,
     hasAccessToken: true/false,
     ...
   }
   ```

3. **Detalhes da URL parseada:**
   ```
   🔍 URL parseada com sucesso: {
     protocol: ...,
     host: ...,
     search: ...,
     hash: ...
   }
   ```

## ✅ Próximos Passos

1. **Teste novamente** com os logs adicionais
2. **Copie a URL completa** que aparece nos logs (`📱 Auth result URL`)
3. **Verifique:**
   - Se a URL contém `code=` ou `access_token=`
   - Se a URL está usando o custom scheme `monity://`
   - Se a URL está usando HTTPS do Supabase

4. **Com base na URL recebida:**
   - Se a URL for `monity://auth/callback?code=...` → O problema é na extração (já corrigido)
   - Se a URL for `https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback?code=...` → O Supabase não está redirecionando para o custom scheme
   - Se a URL não tiver `code` ou `access_token` → O Supabase não está gerando o código corretamente

## 🛠️ Soluções Baseadas no Resultado

### Se a URL for do Supabase (HTTPS):

O Supabase está redirecionando para sua própria URL ao invés do custom scheme. Isso pode acontecer se:

1. **A URL de redirect não está configurada no Supabase:**
   - Configure em: **Authentication** > **URL Configuration** > **Redirect URLs**
   - Adicione: `monity://auth/callback`

2. **O `redirectTo` não está sendo respeitado:**
   - Verifique se o `redirectTo` está sendo passado corretamente
   - Pode ser necessário usar uma abordagem diferente

### Se a URL não tiver código:

1. **Verifique se o Google OAuth está configurado corretamente no Supabase:**
   - Client ID e Secret estão corretos?
   - O provider Google está ativado?

2. **Verifique se as URLs de redirect estão configuradas no Google Cloud Console:**
   - A URL do Supabase callback está autorizada?
   - `https://eeubnmpetzhjcludrjwz.supabase.co/auth/v1/callback`

3. **Verifique os logs do Supabase:**
   - Pode haver erros no processo de autenticação

## 📝 Checklist de Verificação

- [ ] URL `monity://auth/callback` configurada no Supabase (Authentication > URL Configuration)
- [ ] Google OAuth configurado no Supabase (Client ID e Secret corretos)
- [ ] Provider Google ativado no Supabase
- [ ] URLs de redirect configuradas no Google Cloud Console
- [ ] `scheme: "monity"` configurado no `app.json` ✅
- [ ] Teste realizado com logs adicionais
- [ ] URL completa copiada dos logs
- [ ] Análise da URL realizada

## 🔗 Referências

- [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/auth-deep-linking)
- [Expo AuthSession Custom Schemes](https://docs.expo.dev/guides/authentication/#custom-schemes)

