# backend/Dockerfile
FROM node:18-slim

WORKDIR /app

# Requisitos para Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Solo manifiestos + prisma para cachear dependencias
COPY package*.json ./
COPY prisma ./prisma

# Intenta npm ci; si el lock está desfasado, cae a npm install
# --include=dev garantiza que instalen devDependencies (nodemon, prisma)
RUN npm ci --include=dev --no-audit --no-fund || npm install --include=dev --no-audit --no-fund

# Genera Prisma Client en build (por si no montas en caliente)
RUN npx prisma generate

# Resto del código
COPY . .

EXPOSE 4000

# En producción usaría `node index.js`; en dev lo sobreescribe el compose
CMD ["sh","-c","npx prisma migrate deploy || true; node index.js"]
