# Usar Node.js 18 Alpine para menor tamaño
FROM node:18-alpine AS base

# Instalar dependencias necesarias para Prisma
RUN apk add --no-cache libc6-compat openssl

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 townapi

# Cambiar propietario de archivos
RUN chown -R townapi:nodejs /app
USER townapi

# Exponer puerto (Railway/Render usan PORT env var)
EXPOSE $PORT

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:$PORT/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Comando de inicio
CMD ["npm", "start"]
