# 🚨 Resolver Problema do IP Local

## ⚠️ Problema Identificado

Seu app está configurado com `http://192.168.0.7:3000/api/v1` que é um **IP LOCAL**.

### Por que isso é um problema?

- ✅ Funciona só na sua rede WiFi
- ❌ Não funciona quando outras pessoas baixarem o APK
- ❌ Não funciona nem em outros lugares para você

---

## 🎯 Solução Mais Rápida: ngrok

### Passo 1: Instalar ngrok

```bash
cd C:\Users\Asus\MobileMonity\Monity-Mobile
npm install -g ngrok
```

### Passo 2: Rodar seu backend

```bash
cd backend
npm run dev
```

**Mantenha esse terminal aberto**

### Passo 3: Ar outro terminal - Expor o backend

```bash
ngrok http 3000
```

### Passo 4: Copiar a URL gerada

Vai aparecer algo como:

```
https://abc123def456.ngrok.io -> http://localhost:3000
```

### Passo 5: Atualizar sua app.json

เปิดไฟล์ `frontend/Monity/app.json` และเปลี่ยน:

```json
"apiUrl": "https://abc123def456.ngrok.io/api/v1",
```

### Passo 6: Gerar APK novamente

```bash
cd frontend/Monity
npx eas build --platform android --profile preview
```

---

## 🌐 Solução Definitiva: Deploy Gratuito

### Opção A: Railway (Recomendado)

1. **Acesse**: https://railway.app
2. **Crie conta** (pode usar GitHub)
3. **New Project** > **Deploy from GitHub**
4. **Conecte seu repositório**
5. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: 3000

**Resultado**: URL como `https://monity-backend-production.up.railway.app`

### Opção B: Render

1. **Acesse**: https://render.com
2. **Crie conta**
3. **New** > **Web Service**
4. **Connect Repository**
5. **Configure**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

**Resultado**: URL como `https://monity-backend.onrender.com`

---

## 📝 Como Alterar a URL no App

### Método 1: Alterar app.json diretamente

```json
{
  "expo": {
    // ... outras configurações
    "extra": {
      "apiUrl": "https://sua-nova-url.com/api/v1",
      "supabaseUrl": "https://eeubnmpetzhjcludrjwz.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM",
      "geminiApiKey": "AIzaSyCLD8msQ9K6std1kLSymu1re81ZXc61zps"
    }
  }
}
```

### Método 2: Usar variáveis de ambiente (Melhor)

Criar `.env` na raiz do projeto:

```env
EXPO_PUBLIC_API_URL=https://sua-nova-url.com/api/v1
```

E no `apiService.ts`:

```typescript
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.7:3000/api/v1";
```

---

## 🎯 Recomendação por Prioridade

### 1. **Para Testes Rápidos**: ngrok

- Mais rápido de configurar
- Funciona imediatamente
- URL temporária (muda a cada restart)

### 2. **Para Produção**: Railway/Render

- URL permanente
- Deploy automático do GitHub
- Escalável

### 3. **Para Flexibilidade Total**: VPS

- Controle completo
- Domínio próprio
- Melhor performance (pago)

---

## ⚡ Checklist Rápido

- [ ] Identificar problema do IP local
- [ ] Escolher solução (ngrok/deploy)
- [ ] Configurar solução escolhida
- [ ] Obter nova URL pública
- [ ] Atualizar app.json com nova URL
- [ ] Gerar novo APK
- [ ] Testar APK com nova URL
- [ ] Compartilhar APK atualizado

---

## 🆘 Precisa de Ajuda?

**Problemas comuns:**

1. **ngrok não funciona**: Verifique se porta 3000 está livre
2. **Deploy falha**: Verifique se todas dependências estão no package.json
3. **App não conecta**: Confirme se a URL está certa e o backend rodando

**Continuar processo**: Volte para `COMO_GERAR_APK.md` após resolver o IP!
