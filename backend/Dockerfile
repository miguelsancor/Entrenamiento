# backend/Dockerfile
FROM node:18-slim

WORKDIR /app

# Requisitos para Prisma (OpenSSL)
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Copiamos solo manifest y prisma para cachear deps
COPY package*.json ./
COPY prisma ./prisma

# 👉 Usa npm ci solo si el lock está bien. Ya lo arreglaste arriba.
RUN npm ci --no-audit --no-fund

# Genera Prisma Client en build
RUN npx prisma generate

# Copiamos el resto del código
COPY . .

EXPOSE 4000
# Aplica migraciones y arranca (para SQLite es safe)
CMD ["sh","-c","npx prisma migrate deploy || true; node index.js"]
