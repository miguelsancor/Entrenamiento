# Dockerfile (backend)
FROM node:18-slim

WORKDIR /app

# OpenSSL para Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Copiamos primero package.json para cachear la capa de deps
COPY package*.json ./
COPY prisma ./prisma

# Instala deps (incluye dev para tener prisma CLI)
RUN npm ci

# Genera Prisma Client en build (no en postinstall)
RUN npx prisma generate

# Resto del código
COPY . .

EXPOSE 4000
CMD ["node","index.js"]
