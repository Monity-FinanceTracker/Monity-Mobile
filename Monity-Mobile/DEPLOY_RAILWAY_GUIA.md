# 🚀 Guia Completo: Deploy Backend no Railway + Gerar APK

## 📋 Visão Geral

Este guia te levará do deploy do backend no Railway até a geração do APK final, resolvendo o problema do IP local (`192.168.0.7`) que impede o funcionamento do app fora da sua rede.

---

## 🎯 PARTE 1: Deploy do Backend no Railway

### Passo 1: Preparar o Projeto

1. **Verificar se está na pasta correta:**

```bash
cd C:\Users\Asus\MobileMonity\Monity-Mobile
```

2. **Verificar se o Dockerfile existe:**

```bash
dir backend\Dockerfile
```

✅ Deve mostrar o arquivo Dockerfile

### Passo 2: Criar Conta no Railway

1. **Acesse:** https://railway.app
2. **Clique em:** "Start a New Project"
3. **Escolha:** "Login with GitHub" (recomendado)
4. **Autorize** o Railway a acessar seus repositórios

### Passo 3: Conectar Repositório

1. **No Railway Dashboard:**

   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório `Monity-Mobile`

2. **Configurar Deploy:**
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

### Passo 4: Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://eeubnmpetzhjcludrjwz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM
GEMINI_API_KEY=AIzaSyCLD8msQ9K6std1kLSymu1re81ZXc61zps
CLIENT_URL=https://firstmonity.vercel.app
```

### Passo 5: Fazer Deploy

1. **Clique em:** "Deploy"
2. **Aguarde** o build (5-10 minutos)
3. **Anote a URL** gerada: `https://seu-app.railway.app`

### Passo 6: Testar o Backend

1. **Acesse:** `https://seu-app.railway.app/api/v1`
2. **Deve retornar:**

```json
{
  "message": "Monity API v1 is running",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "healthy"
}
```

---

## 🎯 PARTE 2: Atualizar Frontend para Usar Railway

### Passo 7: Atualizar Configuração do App

1. **Editar:** `frontend/Monity/app.json`

```json
{
  "expo": {
    "name": "Monity",
    "slug": "Monity",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "monity",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "apiUrl": "https://seu-app.railway.app/api/v1",
      "supabaseUrl": "https://eeubnmpetzhjcludrjwz.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldWJubXBldHpoamNsdWRyand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4MzQsImV4cCI6MjA2ODA4ODgzNH0.QZc4eJ4tLW10WIwhsu_p7TvldzodQrwJRnJ8LlzXkdM",
      "geminiApiKey": "AIzaSyCLD8msQ9K6std1kLSymu1re81ZXc61zps"
    }
  }
}
```

**⚠️ IMPORTANTE:** Substitua `https://seu-app.railway.app` pela URL real do seu deploy!

---

## 🎯 PARTE 3: Gerar APK

### Passo 8: Preparar Ambiente Expo

1. **Instalar EAS CLI:**

```bash
cd frontend/Monity
npm install -g @expo/cli eas-cli
```

2. **Login no Expo:**

```bash
npx expo login
```

- Digite email e senha da conta Expo

### Passo 9: Configurar Build

1. **Verificar configuração:** `eas.json` já está configurado ✅

2. **Testar localmente primeiro:**

```bash
npx expo start
```

- Escaneie o QR code com Expo Go
- Teste se o app conecta com o Railway

### Passo 10: Gerar APK

1. **Build de Preview (Recomendado):**

```bash
npx eas build --platform android --profile preview
```

2. **Build de Produção:**

```bash
npx eas build --platform android --profile production
```

### Passo 11: Acompanhar Build

1. **O comando mostrará um link** como: `https://expo.dev/accounts/seu-usuario/projects/Monity/builds/123456`
2. **Aguarde** 5-15 minutos
3. **Baixe o APK** quando estiver pronto

---

## 🎯 PARTE 4: Testar e Distribuir

### Passo 12: Testar APK

1. **Instale o APK** em um dispositivo Android
2. **Teste todas as funcionalidades:**
   - Login/Registro
   - Adicionar transações
   - Visualizar dados
   - Todas as telas

### Passo 13: Distribuir APK

**Opção A: Google Drive**

1. Upload do APK para Google Drive
2. Configurar como "Qualquer pessoa com o link"
3. Compartilhar link

**Opção B: WhatsApp/Telegram**

1. Enviar APK diretamente
2. Recipientes baixam e instalam

**Opção C: GitHub Release**

1. Criar release no GitHub
2. Anexar APK
3. Compartilhar link do release

---

## 🔧 Troubleshooting

### ❌ Problema: "Cannot GET /api/v1"

**Causa:** Rota raiz `/api/v1` não estava definida

**Solução:** Adicionada rota de health check na raiz da API

**Código adicionado em `backend/routes/index.ts`:**

```typescript
// Root API route for health check
v1Router.get("/", (req: any, res: any) => {
  res.json({
    message: "Monity API v1 is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});
```

**Teste:** Acesse `https://seu-app.railway.app/api/v1` - deve retornar JSON com status

### ❌ Problema: "Cannot use import statement outside a module"

**Causa:** Node.js está tentando executar arquivo TypeScript em vez do JavaScript compilado

**Solução:** Corrigir script `start` no package.json

**package.json corrigido:**

```json
{
  "scripts": {
    "dev": "ts-node server.ts",
    "build": "tsc",
    "start": "node dist/server.js" // ← Executa arquivo compilado
  }
}
```

**Dockerfile otimizado (multi-stage):**

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]
```

### ❌ Problema: "tsc: not found" ou "Build failed"

**Causa:** TypeScript não está instalado porque está nas devDependencies

**Solução:** Dockerfile corrigido para instalar todas as dependências durante o build

**Dockerfile atualizado:**

```dockerfile
# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Compilar TypeScript
RUN npm run build

# Remover devDependencies após build (otimização)
RUN npm prune --production
```

### ❌ Problema: "Build failed" (Frontend)

**Solução:**

```bash
cd frontend/Monity
npm install
npx expo install --fix
```

### ❌ Problema: "Cannot connect to API"

**Verificar:**

1. URL do Railway está correta no `app.json`
2. Backend está rodando no Railway
3. Testar URL diretamente no navegador

### ❌ Problema: "Invalid credentials"

**Solução:**

```bash
npx expo logout
npx expo login
```

### ❌ Problema: "Docker build failed"

**Verificar:**

1. Dockerfile existe em `backend/Dockerfile`
2. package.json tem script `build` e `start`
3. Todas as dependências estão no package.json

---

## 📋 Checklist Final

### Backend Railway:

- [ ] Conta Railway criada
- [ ] Repositório conectado
- [ ] Root directory: `backend`
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] URL do Railway anotada
- [ ] API testada e funcionando

### Frontend APK:

- [ ] `app.json` atualizado com URL do Railway
- [ ] EAS CLI instalado
- [ ] Login no Expo realizado
- [ ] Build executado com sucesso
- [ ] APK baixado
- [ ] APK testado em dispositivo
- [ ] APK distribuído

---

## 🎉 Resultado Final

Após seguir todos os passos:

1. **Backend:** Rodando em `https://seu-app.railway.app`
2. **APK:** Funcionando em qualquer lugar do mundo
3. **Distribuição:** Pronto para compartilhar

**🚀 Seu app Monity agora funciona globalmente!**

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. **Railway:** Verifique logs em "Deployments" → "View Logs"
2. **Expo:** Verifique status em https://expo.dev
3. **API:** Teste endpoints diretamente no navegador
4. **APK:** Teste primeiro com Expo Go antes do build

**Boa sorte! 🎯**
