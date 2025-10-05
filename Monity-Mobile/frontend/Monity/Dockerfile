# Use Node.js 18 LTS como base
FROM node:18-alpine

# Instalar Expo CLI globalmente
RUN npm install -g @expo/cli

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta padrão do Expo
EXPOSE 8081

# Comando para iniciar a aplicação
CMD ["npm", "start"]
