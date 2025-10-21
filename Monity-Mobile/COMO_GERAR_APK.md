# 📱 Como Gerar APK do Projeto Monity

Este guia te mostrará todas as opções disponíveis para gerar e compartilhar o APK do seu aplicativo Monity.

## 🎯 Opções Disponíveis

### **Opção 1: Expo Build Service (Mais Fácil) ⭐**

#### Passo 1: Criar Conta Expo

1. Acesse: https://expo.dev/signup
2. Crie uma conta gratuita (pode usar Google, GitHub ou email)
3. Confirme o email se necessário

#### Passo 2: Login no Terminal

```bash
cd frontend/Monity
npx expo login
```

- Digite seu email e senha da conta Expo

#### Passo 3: Gerar APK de Preview

```bash
npx eas build --platform android --profile preview
```

#### Passo 4: Acompanhar o Build

- O comando vai mostrar um link para acompanhar o progresso
- Normalmente leva 5-10 minutos
- Você receberá um link para baixar o APK quando terminar

---

### **Opção 2: Expo Go (Para Testes Rápidos)**

#### Passo 1: Instalar Expo Go

- Baixe no Google Play Store: "Expo Go"

#### Passo 2: Gerar Código QR

```bash
cd frontend/Monity
npx expo start
```

#### Passo 3: Testar no Expo Go

- Escaneie o QR code com o app Expo Go
- O app funcionará como preview (mas não é um APK instalável)

---

### **Opção 3: Build Local (Avançado)**

#### Passo 1: Instalar Android Studio

1. Download: https://developer.android.com/studio
2. Instalar SDK Android
3. Configurar variáveis de ambiente:
   - `ANDROID_HOME`: caminho do SDK
   - Adicionar `tools` e `platform-tools` ao PATH

#### Passo 2: Configurar Projeto

```bash
cd frontend/Monity
npx expo prebuild --platform android
```

#### Passo 3: Gerar APK

```bash
cd android
./gradlew assembleDebug
```

---

## 📤 Como Compartilhar o APK

### **Método 1: Google Drive**

1. Faça upload do APK para o Google Drive
2. Configure como "Qualquer pessoa com o link pode ver"
3. Compartilhe o link

### **Método 2: WhatsApp Web/Telegram**

1. Envie o APK diretamente pelo WhatsApp Web ou Telegram
2. Recipientes podem baixar diretamente

### **Método 3: GitHub Release**

1. Crie um release no GitHub
2. Anexe o APK como arquivo
3. Compartilhe o link do release

### **Método 4: Servidor Temporário**

1. Use serviços como:
   - WeTransfer (wetransfer.com)
   - SendAnywhere (send-anywhere.com)
   - Firefox Send

---

## 🚨 PROBLEMA CRÍTICO - IP LOCAL

### **Configurações Atuais do Seu Projeto**

- **Nome**: Monity
- **Versão**: 1.0.0
- **API URL**: `http://192.168.0.7:3000/api/v1` ⚠️ **PROBLEMA!**
- **Backend**: Configurado para rodar na rede local

### 🚨 **O Problema:**

`192.168.0.7` é um **IP LOCAL** da sua rede WiFi. Significa:

- ✅ **Funciona na sua casa**: Quando você testa localmente
- ❌ **NÃO funciona fora**: Quando outras pessoas usam o APK
- ❌ **NÃO funciona em outros lugares**: Mesmo você em outro WiFi

### ✅ **Soluções Imediatas:**

#### **Opção A: ngrok (Rápido para Testes)**

```bash
# Instalar ngrok
npm install -g ngrok

# Expor seu backend local
cd backend
npm run dev

# Em outro terminal
ngrok http 3000
```

**Resultado**: Vai gerar uma URL pública como `https://abc123.ngrok.io`
**Problema**: URL muda a cada reiniciar o ngrok

#### **Opção B: Deploy Gratuito (Recomendado)**

**1. Railway (Mais Fácil):**

- Site: railway.app
- Gratuito: 500 horas/mês
- URL permanente: `https://seu-app.railway.app`

**2. Render:**

- Site: render.com
- Gratuito com sleep após inatividade
- URL permanente: `https://seu-app.onrender.com`

**3. Heroku:**

- Site: heroku.com
- Gratuito com limitações (sleep após 30min)
- URL permanente: `https://seu-app.herokuapp.com`

#### **Opção C: VPS Barato (~$5/mês)**

- **DigitalOcean**: digitalocean.com
- **Linode**: linode.com
- **Contabo**: contabo.com
- URL permanente: `https://seu-dominio.com`

---

## ⚠️ Outras Considerações Importantes

### **Problemas Comuns e Soluções**

#### ❌ Erro: "Invalid credentials"

- Solução: Verifique se está logado com `npx expo whoami`

#### ❌ Erro: "Build failed"

- Solução: Verifique se todas as dependências estão instaladas

```bash
npm install
```

#### ❌ Erro: "Cannot find module"

- Solução: Limpe o cache e reinstale

```bash
npm start -- --clear
```

#### ⚠️ API URL Local

**IMPORTANTE**: Seu app está configurado para `http://192.168.0.7:3000`. Para distribuir o APK:

1. **Teste local**: Funcionará na sua rede
2. **Distribuir**: Recipientes precisarão estar na mesma rede OU você precisa alterar a URL

---

## 🔧 Alterando URL da API (se necessário)

### Para usar produção:

1. Editar `frontend/Monity/app.json`:

```json
"extra": {
  "apiUrl": "https://seu-servidor.com/api/v1",
  // ... resto das configurações
}
```

2. Ou criar arquivo `.env`:

```
EXPO_PUBLIC_API_URL=https://seu-servidor.com/api/v1
```

---

## 🔐 Variáveis de Ambiente (evitar erro de criptografia)

Quando você rodar o app com backend protegido por criptografia, é obrigatório configurar as variáveis do backend. Sem isso, o backend lança erro de criptografia e o app falha nas requisições.

### O que o backend exige (obrigatórias)

- `ENCRYPTION_KEY`: chave hex de 64 caracteres (AES-256-GCM). Se faltar ou for inválida, o backend encerra com erro.
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: chave anônima pública do Supabase
- `SUPABASE_KEY`: chave de serviço (admin) do Supabase
- `PORT` (opcional, default 3001)

### Como gerar a ENCRYPTION_KEY (64 chars)

```bash
openssl rand -hex 32
```

Copie o valor retornado (ex.: 64 caracteres hex) e use em `ENCRYPTION_KEY`.

### Backend: criando `.env`

Crie o arquivo `backend/.env` com conteúdo semelhante:

```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_KEY=seu_service_role_key
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Inicie o backend carregando o `.env` normalmente (o projeto já usa `dotenv`):

```bash
cd backend
npm run dev
# ou
npm start
```

Se estiver fazendo deploy (Railway/Render), configure essas variáveis no painel do provedor.

### Frontend (Expo): configurando API URL via env

Para builds do Expo, prefira variáveis `EXPO_PUBLIC_...` para serem injetadas no app em tempo de build:

1) Crie `frontend/Monity/.env`:

```bash
EXPO_PUBLIC_API_URL=https://seu-backend-publico.com/api/v1
# opcionais, se quiser mover do app.json para env públicos
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=xxxxx
```

2) Garanta que o código leia de `Constants.expoConfig?.extra?.apiUrl` ou de `process.env.EXPO_PUBLIC_API_URL` (o serviço já usa `extra.apiUrl`; se usar env, ajuste o `app.json` para ler de env ou migre a leitura no código). Em builds EAS, você também pode definir secrets/vars pelo CLI/painel:

```bash
cd frontend/Monity
npx eas secret:create --name EXPO_PUBLIC_API_URL --value https://seu-backend-publico.com/api/v1
```

3) Se você mantiver `app.json` com `extra.apiUrl`, atualize para a URL pública antes do build.

### Fluxo recomendado para evitar erro de criptografia

1. Configure `backend/.env` com `ENCRYPTION_KEY` válido e credenciais do Supabase.
2. Suba o backend local ou em um host público (Railway/Render/ngrok).
3. No frontend, aponte `EXPO_PUBLIC_API_URL` (ou `extra.apiUrl`) para a URL acessível publicamente.
4. Só então gere o APK (veja Opção 1 ou 3).

---

## 🧪 Teste rápido antes do build

Antes de rodar o build, valide que o app consegue autenticar e listar dados com o backend já configurado:

```bash
cd frontend/Monity
npx expo start
```

No dispositivo (ou emulador), faça login e navegue até Transações/Categorias. Se as requisições funcionarem, o build APK também funcionará.

---

## 🎯 Recomendação Final

**Para começar rapidamente:**

1. Use a **Opção 1** (Expo Build Service)
2. Crie conta gratuita no Expo
3. Execute `npx eas build --platform android --profile preview`
4. Compartilhe via Google Drive

**Para testes internos:**

1. Use a **Opção 2** (Expo Go)
2. Muito mais rápido para testes

---

## 📋 Checklist Final

- [ ] Conta Expo criada
- [ ] Login realizado (`npx expo login`)
- [ ] Build executado (`npx eas build`)
- [ ] APK baixado do link fornecido
- [ ] APK compartilhado via Google Drive/rede social
- [ ] Testado em dispositivo Android

---

## 🆘 Precisa de Ajuda?

Se encontrar algum problema:

1. Verifique os logs detalhados
2. Confirme se todas as dependências estão instaladas
3. Teste primeiro com `npx expo start` para ver se o app roda
4. Consulte a documentação oficial: https://docs.expo.dev/build/introduction/

**Boa sorte com seu projeto Monity! 🚀**
