# 🔧 Configuração de Portas - Monity

## ⚠️ Problema Identificado

Havia conflito de portas entre o backend e frontend, ambos tentando usar a porta 3000.

## ✅ Solução Implementada

### Backend

- **Porta alterada**: `3000` → `3001`
- **Arquivo modificado**: `backend/server.ts`
- **Nova configuração**: `PORT=3001`

### Frontend

- **URL da API atualizada**: `http://192.168.0.7:3001/api/v1`
- **Arquivo modificado**: `frontend/Monity/app.json`

### CORS Atualizado

- Adicionadas portas do Expo: `19000`, `19001`
- Mantida porta original: `3000` (para compatibilidade)
- Nova porta backend: `3001`

## 🚀 Como Reiniciar os Serviços

### 1. Backend (Nova Porta 3001)

```bash
cd backend
npm run dev
```

### 2. Frontend (Expo)

```bash
cd frontend/Monity
npm start
```

## 📋 Verificação das Portas

### Portas Esperadas:

- **Backend**: `3001` (API)
- **Frontend**: `19000` (Metro bundler)
- **Frontend**: `19001` (Expo DevTools)

### Comandos para Verificar:

```bash
# Verificar porta 3001 (Backend)
netstat -ano | findstr :3001

# Verificar portas do Expo
netstat -ano | findstr :19000
netstat -ano | findstr :19001
```

## 🔍 URLs de Acesso

### Backend API

- **Local**: `http://localhost:3001/api/v1`
- **Rede**: `http://192.168.0.7:3001/api/v1`

### Frontend (Expo)

- **Metro**: `http://localhost:19000`
- **DevTools**: `http://localhost:19001`

## ⚡ Benefícios da Mudança

1. **Sem Conflitos**: Backend e frontend em portas separadas
2. **CORS Configurado**: Todas as portas necessárias liberadas
3. **Compatibilidade**: Mantém suporte a portas antigas
4. **Desenvolvimento**: Melhor experiência de desenvolvimento

## 🛠️ Troubleshooting

### Se ainda houver problemas:

1. **Verificar processos rodando**:

   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

2. **Parar todos os processos Node**:

   ```bash
   taskkill /IM node.exe /F
   ```

3. **Reiniciar serviços**:

   ```bash
   # Backend
   cd backend && npm run dev

   # Frontend (em outro terminal)
   cd frontend/Monity && npm start
   ```

### Logs Esperados:

- **Backend**: `Server running on port 3001`
- **Frontend**: `Metro waiting on exp://192.168.0.7:19000`

## 📱 Teste da Aplicação

1. Inicie o backend na porta 3001
2. Inicie o frontend com Expo
3. Teste a conexão através do app mobile
4. Verifique se as requisições estão chegando ao backend

---

**Status**: ✅ Conflito de portas resolvido
**Próximo passo**: Reiniciar os serviços nas novas portas
