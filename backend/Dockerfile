# backend/Dockerfile
FROM node:18-slim

WORKDIR /app

# Requisitos para Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Copiamos SOLO manifiestos y prisma para cachear deps
COPY package*.json ./
COPY prisma ./prisma

# Usa npm ci si hay lockfile válido; si no, usa npm install (evita EUSAGE)
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund ; \
    else \
      npm install --no-audit --no-fund ; \
    fi

# Genera Prisma Client en build (por si no montas en caliente)
RUN npx prisma generate

# Luego el resto del código
COPY . .

EXPOSE 4000

# En producción usaría esto; en dev lo sobreescribe el compose con npm run dev
CMD ["sh","-c","npx prisma migrate deploy || true; node index.js"]
