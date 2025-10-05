# Use Node.js 18 LTS como base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover devDependencies após build (otimização)
RUN npm prune --production

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["npm", "start"]
