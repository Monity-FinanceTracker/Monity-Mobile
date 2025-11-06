# Como Ver os Logs no Expo Go

## 📱 No Terminal (Principal)

1. **Abra o terminal** onde você executou `npm start` ou `expo start`
2. **Os logs aparecem automaticamente** quando você usa o app
3. Procure por mensagens como:
   - `🔐 Iniciando login com Google`
   - `📥 URL de retorno completa:`
   - `🔑 Código encontrado:`
   - `✅ Sessão criada com sucesso`

## 🌐 No Expo DevTools (Navegador)

1. Abra no navegador: `http://localhost:19001` ou `http://localhost:19002`
2. Clique na aba **"Logs"**
3. Você verá todos os logs do app

## 📱 No Próprio App (iOS)

1. **Agite o dispositivo** (shake gesture)
2. Ou faça **gesto de três dedos para baixo**
3. Toque em **"Debug Remote JS"** ou **"Show Element Inspector"**
4. Os logs aparecerão no console do navegador

## 💡 Dica

Se você não está vendo os logs no terminal:
1. Certifique-se de que o terminal está visível
2. Role para cima no terminal para ver logs anteriores
3. Limpe o terminal com `Ctrl + L` (Linux/Mac) ou `cls` (Windows)

## 🔍 Logs que Você Deve Ver Durante o Login

Quando você tentar fazer login com Google, você deve ver algo assim:

```
🔐 Iniciando login com Google
📱 Plataforma: ios
🔗 Redirect URL (app - exp://): monity://auth/callback
🔗 Redirect URL (usada - HTTPS): monity://auth/callback
🌐 Abrindo navegador para autenticação...
📱 Resultado da autenticação: success
📥 URL de retorno completa: monity://auth/callback?code=...
🔑 Código encontrado: SIM
🔄 Trocando código por sessão...
✅ Sessão criada com sucesso
```

## ⚠️ Se Não Estiver Vendo Logs

1. Verifique se o terminal está aberto
2. Verifique se o Expo está rodando (`npm start`)
3. Tente limpar o cache: `expo start -c`
4. Reinicie o Expo Go app








