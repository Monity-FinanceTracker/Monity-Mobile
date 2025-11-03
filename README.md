# 💰 Monity - Gestão Financeira Pessoal

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React Native](https://img.shields.io/badge/react--native-0.81.5-blue.svg)

Monity é um aplicativo mobile completo para gestão financeira pessoal, desenvolvido com React Native (Expo) e Node.js/Express. O aplicativo oferece controle total sobre suas finanças, com recursos de IA para categorização automática, projeções financeiras e muito mais.

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Desenvolvimento](#-desenvolvimento)
- [Build e Deploy](#-build-e-deploy)
- [API](#-api)
- [Documentação Adicional](#-documentação-adicional)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## ✨ Características

### 💳 Gestão Financeira
- ✅ **Transações**: Registro completo de receitas e despesas
- ✅ **Categorias**: Sistema flexível de categorias personalizáveis
- ✅ **Saldo**: Acompanhamento em tempo real do saldo e histórico
- ✅ **Metas de Economia**: Definição e acompanhamento de objetivos financeiros
- ✅ **Projeções Financeiras**: Análise preditiva baseada em padrões de gastos

### 🤖 Inteligência Artificial
- ✅ **Categorização Automática**: IA sugere categorias para transações
- ✅ **Chat com IA**: Assistente financeiro personalizado (Gemini AI)
- ✅ **Análise de Padrões**: Identificação automática de hábitos financeiros
- ✅ **Recomendações**: Sugestões personalizadas para melhorar saúde financeira

### 👥 Social e Colaboração
- ✅ **Grupos**: Criação de grupos para divisão de despesas
- ✅ **Convites**: Sistema de convites para grupos
- ✅ **Perfis**: Gerenciamento de perfil de usuário

### 💎 Assinatura Premium
- ✅ **Planos**: Sistema de assinatura com Stripe
- ✅ **Recursos Premium**: IA avançada, relatórios detalhados, exportação de dados
- ✅ **Pagamento Mobile**: Integração completa com Stripe React Native

### 📊 Analytics e Relatórios
- ✅ **Dashboard**: Visão geral das finanças
- ✅ **Histórico**: Análise de transações por período
- ✅ **Saúde Financeira**: Métricas e indicadores de saúde financeira
- ✅ **Exportação**: Exportação de dados em CSV/PDF

## 🛠 Tecnologias

### Backend
- **Node.js** com **TypeScript**
- **Express.js** - Framework web
- **Supabase** - Banco de dados PostgreSQL e autenticação
- **Stripe** - Processamento de pagamentos
- **Redis** - Cache e rate limiting
- **Google Gemini AI** - Inteligência artificial
- **Joi** - Validação de dados
- **Morgan** - Logging HTTP

### Frontend
- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Expo Router** - Navegação baseada em arquivos
- **NativeWind** - Tailwind CSS para React Native
- **AsyncStorage** - Armazenamento local
- **React Context API** - Gerenciamento de estado
- **Stripe React Native** - Integração de pagamentos
- **Expo Auth Session** - Autenticação social

## 📁 Estrutura do Projeto

```
Monity-Mobile/
├── backend/                    # Backend Node.js/Express
│   ├── config/                 # Configurações (Supabase, Stripe, etc.)
│   ├── controllers/            # Controllers das rotas
│   ├── middleware/             # Middlewares (auth, rate limiting, etc.)
│   ├── models/                 # Modelos de dados
│   ├── routes/                 # Definição de rotas
│   ├── services/               # Lógica de negócio
│   ├── utils/                  # Utilitários
│   ├── migrations/             # Migrações SQL
│   ├── server.ts               # Ponto de entrada do servidor
│   └── package.json
│
├── frontend/
│   └── Monity/                 # App React Native
│       ├── app/                # Expo Router (rotas)
│       │   ├── src/
│       │   │   ├── components/ # Componentes reutilizáveis
│       │   │   ├── pages/      # Páginas/Telas
│       │   │   ├── context/    # Context providers
│       │   │   ├── services/   # Serviços (API, etc.)
│       │   │   └── utils/      # Utilitários
│       │   └── index.tsx       # Ponto de entrada
│       ├── assets/             # Imagens, fontes, etc.
│       ├── app.json            # Configuração Expo
│       └── package.json
│
├── docs/                       # Documentação adicional
│   ├── ANDROID_BUILD_FIXES.md
│   ├── BACKEND_FIXED.md
│   ├── COMO_GERAR_APK.md
│   ├── DEPLOY_RAILWAY_GUIA.md
│   ├── GEMINI_SETUP.md
│   ├── PAYMENT_SETUP_GUIDE.md
│   ├── PRODUCTION_CONFIG.md
│   ├── STRIPE_IMPLEMENTATION.md
│   └── ... (outros guias)
│
└── README.md                   # Este arquivo
```

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** >= 18.0.0
- **npm** ou **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Git**
- **Conta no Supabase** (para banco de dados)
- **Conta no Expo** (para builds e deploy)
- **Conta no Stripe** (opcional, para pagamentos)
- **Chave da API Gemini** (opcional, para IA)

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd Monity-Mobile
```

### 2. Instale as dependências do Backend

```bash
cd backend
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../frontend/Monity
npm install
```

## ⚙️ Configuração

### Backend

1. **Crie um arquivo `.env` na pasta `backend/`:**

```bash
cd backend
cp env-template.txt .env
```

2. **Configure as variáveis de ambiente:**

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Stripe (opcional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Redis (opcional, para cache)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
```

### Frontend

1. **Configure o `app.json`:**

Edite `frontend/Monity/app.json` e configure:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3000/api/v1",
      "supabaseUrl": "your_supabase_url",
      "supabaseAnonKey": "your_supabase_anon_key",
      "geminiApiKey": "your_gemini_api_key",
      "stripePublishableKey": "your_stripe_publishable_key"
    }
  }
}
```

**Para desenvolvimento local:**
- Use seu IP local (ex: `http://192.168.1.100:3000/api/v1`)
- Encontre seu IP com: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)

**Para produção:**
- Use a URL do backend deployado (ex: Railway, Heroku, etc.)

## 💻 Desenvolvimento

### Iniciar o Backend

```bash
cd backend
npm run dev
```

O backend estará rodando em `http://localhost:3000`

### Iniciar o Frontend

```bash
cd frontend/Monity
npm start
```

Ou use os comandos específicos:

```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

### Estrutura de Desenvolvimento

1. **Backend**: Desenvolvido em TypeScript, compila para `dist/`
2. **Frontend**: React Native com Expo, hot reload automático
3. **API**: Base URL configurável via `app.json`

## 🏗 Build e Deploy

### Backend (Railway)

Veja o guia completo em: [docs/DEPLOY_RAILWAY_GUIA.md](docs/DEPLOY_RAILWAY_GUIA.md)

**Resumo:**
1. Conecte seu repositório no Railway
2. Configure as variáveis de ambiente
3. Railway fará o deploy automaticamente

### Frontend (APK Android)

Veja o guia completo em: [docs/COMO_GERAR_APK.md](docs/COMO_GERAR_APK.md)

**Opções:**
1. **EAS Build (Recomendado)**: `npx eas build --platform android`
2. **Expo Build Service**: `expo build:android`
3. **Build Local**: Configurar Android Studio

### Build para Produção

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend/Monity
npx eas build --platform android --profile production
```

## 📡 API

### Base URL

- **Desenvolvimento**: `http://localhost:3000/api/v1`
- **Produção**: Configurado via variáveis de ambiente

### Endpoints Principais

#### Autenticação
- `POST /api/v1/auth/register` - Registrar usuário
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Perfil do usuário

#### Transações
- `GET /api/v1/transactions` - Listar transações
- `POST /api/v1/transactions` - Criar transação
- `PUT /api/v1/transactions/:id` - Atualizar transação
- `DELETE /api/v1/transactions/:id` - Deletar transação

#### Categorias
- `GET /api/v1/categories` - Listar categorias
- `POST /api/v1/categories` - Criar categoria
- `PUT /api/v1/categories/:id` - Atualizar categoria
- `DELETE /api/v1/categories/:id` - Deletar categoria

#### Saldo
- `GET /api/v1/balance/all` - Saldo geral
- `GET /api/v1/balance/:month/:year` - Saldo mensal
- `GET /api/v1/balance/history` - Histórico de saldo

#### IA
- `POST /api/v1/ai/suggest-category` - Sugerir categoria
- `GET /api/v1/ai/projections` - Projeções financeiras
- `GET /api/v1/ai/stats` - Estatísticas da IA

#### Assinatura
- `GET /api/v1/subscription-tier` - Status da assinatura
- `POST /api/v1/subscription-tier/create` - Criar assinatura
- `POST /api/v1/subscription-tier/cancel` - Cancelar assinatura

**Documentação completa**: Veja [.cursor/rules/api-endpoints.mdc](.cursor/rules/api-endpoints.mdc)

### Autenticação

Todas as rotas protegidas requerem um token JWT no header:

```
Authorization: Bearer <token>
```

O token é obtido através do login e armazenado no AsyncStorage do frontend.

## 📚 Documentação Adicional

Todos os guias e documentação adicional estão na pasta `docs/`:

- **[COMO_GERAR_APK.md](docs/COMO_GERAR_APK.md)** - Guia completo para gerar APK
- **[DEPLOY_RAILWAY_GUIA.md](docs/DEPLOY_RAILWAY_GUIA.md)** - Deploy do backend no Railway
- **[GEMINI_SETUP.md](docs/GEMINI_SETUP.md)** - Configuração da API Gemini
- **[PAYMENT_SETUP_GUIDE.md](docs/PAYMENT_SETUP_GUIDE.md)** - Configuração de pagamentos
- **[STRIPE_IMPLEMENTATION.md](docs/STRIPE_IMPLEMENTATION.md)** - Implementação Stripe
- **[PRODUCTION_CONFIG.md](docs/PRODUCTION_CONFIG.md)** - Configuração para produção
- **[ANDROID_BUILD_FIXES.md](docs/ANDROID_BUILD_FIXES.md)** - Correções para build Android
- **[BACKEND_FIXED.md](docs/BACKEND_FIXED.md)** - Notas sobre correções do backend

## 🐛 Troubleshooting

### Problemas Comuns

#### Backend não conecta
- Verifique se o backend está rodando na porta 3000
- Confirme que o IP no `app.json` está correto
- Verifique as variáveis de ambiente do Supabase

#### Frontend não carrega dados
- Verifique se o backend está acessível
- Confirme que o token de autenticação está sendo enviado
- Verifique os logs do backend para erros

#### Erro de build Android
- Veja [docs/ANDROID_BUILD_FIXES.md](docs/ANDROID_BUILD_FIXES.md)
- Verifique se todas as dependências estão instaladas
- Limpe o cache: `npx expo start -c`

#### Problemas com IP local
- Veja [docs/RESOLVER_PROBLEMA_IP.md](docs/RESOLVER_PROBLEMA_IP.md)
- Use o IP correto da sua máquina na rede local
- Para produção, use uma URL pública (Railway, etc.)

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- **Leonardo Stuart** – [https://github.com/leo-stuart](#) • [https://www.linkedin.com/in/leonardo-stuart-almeida-ramalho-ab799825a](#)
- **Luca G. Lodi** – [https://github.com/LucaLodii](#) • [https://www.linkedin.com/in/luca-guimarães-lodi-752981356](#)
- **Fabio Brugnara** – [https://github.com/fabiobrug](#) • [https://www.linkedin.com/in/fabio-brugnara-b32307324](#)

## 👥 Empresa

**Wide Chain & Co** 

## 🙏 Agradecimentos

- Expo por fornecer uma excelente plataforma de desenvolvimento
- Supabase por facilitar o backend
- Google Gemini por fornecer IA para o aplicativo
- Comunidade React Native

---

**Monity** - Gerencie suas finanças de forma inteligente 💰
