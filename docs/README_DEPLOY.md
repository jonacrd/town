# 🚀 Guía de Deploy - Town Marketplace

Esta guía detalla cómo desplegar la aplicación Town en producción usando Vercel para el frontend y Railway/Render para la API.

## 📋 Resumen de Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Vercel        │◄──►│  Railway/Render  │◄──►│   PostgreSQL    │
│   (Frontend)    │    │     (API)        │    │   (Database)    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   CDN Assets    │    │  WhatsApp APIs   │
│   (Static)      │    │ (Twilio/Meta)    │
└─────────────────┘    └──────────────────┘
```

## 🗂️ Estructura del Proyecto

```
town/
├── web/          # Frontend Astro + React (Vercel)
├── api/          # Backend Node.js + Express (Railway/Render)
├── docs/         # Documentación
└── README.md     # Documentación principal
```

---

## 🌐 Deploy del Frontend (Web)

### 1. Preparación Local

```bash
cd web
npm install
npm run build  # Verificar que el build funciona
```

### 2. Configuración de Vercel

#### 2.1 Crear Proyecto en Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Conectar repositorio GitHub
3. Seleccionar el directorio `web/` como root
4. Framework: **Astro** (detectado automáticamente)

#### 2.2 Variables de Entorno
En Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Variables públicas (disponibles en el cliente)
PUBLIC_API_BASE_URL=https://api-town.onrailway.app
PUBLIC_APP_BASE_URL=https://town.vercel.app

# Variables de build
NODE_ENV=production
```

#### 2.3 Configuración de Build
Vercel detectará automáticamente la configuración desde `astro.config.mjs`:

```bash
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3. Deploy

```bash
# Deploy automático via GitHub
git push origin main

# O deploy manual
npx vercel --prod
```

### 4. Verificación
- ✅ Sitio accesible en `https://town.vercel.app`
- ✅ PWA manifest funcional
- ✅ Service Worker registrado
- ✅ Assets cargando correctamente

---

## 🔧 Deploy de la API (Backend)

### 1. Preparación de la Base de Datos

#### Opción A: Railway PostgreSQL
1. Ir a [railway.app](https://railway.app)
2. New Project → PostgreSQL
3. Copiar `DATABASE_URL` de las variables de entorno

#### Opción B: Render PostgreSQL
1. Ir a [render.com](https://render.com)
2. New → PostgreSQL
3. Copiar `Internal Database URL`

#### Opción C: Supabase (Alternativa)
1. Ir a [supabase.com](https://supabase.com)
2. New Project → Copiar connection string

### 2. Deploy en Railway

#### 2.1 Crear Servicio
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway new
railway link
```

#### 2.2 Variables de Entorno
```bash
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set DATABASE_URL="postgresql://..."
railway variables set ALLOW_ORIGIN="https://town.vercel.app"
railway variables set LOG_LEVEL=info

# WhatsApp - Twilio
railway variables set WHATSAPP_PROVIDER=twilio
railway variables set TWILIO_ACCOUNT_SID=your_account_sid
railway variables set TWILIO_AUTH_TOKEN=your_auth_token
railway variables set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# O WhatsApp - Meta
railway variables set WHATSAPP_PROVIDER=meta
railway variables set META_VERIFY_TOKEN=your_verify_token
railway variables set META_PHONE_NUMBER_ID=your_phone_number_id
railway variables set META_ACCESS_TOKEN=your_access_token

railway variables set APP_BASE_URL=https://town.vercel.app
```

#### 2.3 Deploy
```bash
railway up
```

### 3. Deploy en Render

#### 3.1 Crear Web Service
1. Ir a [render.com](https://render.com)
2. New → Web Service
3. Conectar repositorio GitHub
4. Root Directory: `api/`

#### 3.2 Configuración
```bash
Name: town-api
Environment: Docker
Dockerfile Path: ./Dockerfile
Branch: main
```

#### 3.3 Variables de Entorno
En Render Dashboard → Environment:

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
ALLOW_ORIGIN=https://town.vercel.app
LOG_LEVEL=info
WHATSAPP_PROVIDER=twilio
# ... resto de variables WhatsApp
```

### 4. Migraciones de Base de Datos

```bash
# Conectar a la base de datos
cd api

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run deploy:migrate

# Ejecutar seed (datos iniciales)
npm run deploy:seed
```

### 5. Verificación de la API

```bash
# Health check
curl https://api-town.onrailway.app/health

# Respuesta esperada:
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": { "status": "connected", "latency": 45 },
      "whatsapp": { "provider": "twilio", "configured": true }
    }
  }
}
```

---

## 🔗 Configuración de Dominios

### 1. Frontend (Vercel)
```bash
# Dominio personalizado (opcional)
# En Vercel Dashboard → Domains
town.tudominio.com → town.vercel.app
```

### 2. API (Railway/Render)
```bash
# Railway: Dominio automático
https://api-town.onrailway.app

# Render: Dominio automático  
https://town-api.onrender.com

# Dominio personalizado (opcional)
api.tudominio.com → servicio
```

---

## 📱 Configuración de WhatsApp

### Opción A: Twilio (Recomendado para desarrollo)

#### 1. Configurar Sandbox
1. Ir a [Twilio Console](https://console.twilio.com)
2. Messaging → Try it out → Send a WhatsApp message
3. Seguir instrucciones para unirse al sandbox

#### 2. Configurar Webhook
```bash
Webhook URL: https://api-town.onrailway.app/webhook/whatsapp
HTTP Method: POST
```

#### 3. Variables de Entorno
```bash
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Opción B: Meta WhatsApp Business API

#### 1. Configurar Aplicación
1. Ir a [Meta for Developers](https://developers.facebook.com)
2. Crear nueva aplicación → Business
3. Agregar producto WhatsApp Business

#### 2. Configurar Webhook
```bash
Callback URL: https://api-town.onrailway.app/webhook/whatsapp
Verify Token: tu_token_secreto
Webhook Fields: messages
```

#### 3. Variables de Entorno
```bash
WHATSAPP_PROVIDER=meta
META_VERIFY_TOKEN=tu_token_secreto
META_PHONE_NUMBER_ID=123456789
META_ACCESS_TOKEN=EAAxxxxx
```

---

## 🧪 Testing del Deploy

### 1. Test Automatizado
```bash
# Desde el directorio raíz
npm run test:deploy
```

### 2. Test Manual

#### Frontend
```bash
# Verificar PWA
1. Abrir https://town.vercel.app
2. Verificar que aparece banner de instalación
3. Probar funcionalidad offline
4. Verificar responsive design

# Verificar API Connection
1. Ir a página de productos
2. Verificar que cargan desde la API
3. Probar crear producto (página seller)
4. Verificar que funciona el carrito
```

#### API
```bash
# Health Check
curl https://api-town.onrailway.app/health

# Test Products
curl https://api-town.onrailway.app/api/products

# Test CORS
curl -H "Origin: https://town.vercel.app" \
     https://api-town.onrailway.app/api/products

# Test Rate Limiting
for i in {1..10}; do
  curl https://api-town.onrailway.app/api/products
done
```

#### WhatsApp (Twilio Sandbox)
```bash
# Enviar mensaje de prueba al número del sandbox
# Mensaje: "menu"
# Respuesta esperada: Lista de productos disponibles
```

---

## 📊 Monitoreo y Logs

### 1. Vercel Analytics
```bash
# Activar en Vercel Dashboard
Analytics → Enable

# Métricas disponibles:
- Page views
- Unique visitors  
- Core Web Vitals
- Performance scores
```

### 2. Railway/Render Logs
```bash
# Railway
railway logs

# Render
# Ver logs en Dashboard → Logs tab
```

### 3. Health Monitoring
```bash
# Configurar alertas (UptimeRobot, Pingdom, etc.)
GET https://api-town.onrailway.app/health
Intervalo: 5 minutos
Timeout: 30 segundos
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de CORS
```bash
# Síntoma: Requests bloqueados en el navegador
# Solución: Verificar ALLOW_ORIGIN en la API
railway variables set ALLOW_ORIGIN="https://town.vercel.app"
```

#### 2. Error de Base de Datos
```bash
# Síntoma: Health check falla
# Solución: Verificar DATABASE_URL y conexión
railway run npx prisma db push
```

#### 3. Build Falla en Vercel
```bash
# Síntoma: Deploy falla en build step
# Solución: Verificar dependencias y tipos
cd web && npm run type-check
```

#### 4. WhatsApp No Responde
```bash
# Síntoma: Bot no responde a mensajes
# Solución: Verificar webhook y variables
curl -X POST https://api-town.onrailway.app/webhook/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"Body": "test", "From": "whatsapp:+1234567890"}'
```

### Logs Útiles

#### API Logs
```bash
# Railway
railway logs --tail

# Render  
# Dashboard → Service → Logs

# Buscar errores:
grep -i error
grep -i "rate limit"
grep -i "cors"
```

#### Base de Datos
```bash
# Conectar directamente
railway run npx prisma studio

# Verificar datos
railway run npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log(await prisma.product.count());
"
```

---

## 🚀 Optimizaciones Post-Deploy

### 1. Performance
- ✅ CDN configurado (Vercel automático)
- ✅ Compresión gzip/brotli activada
- ✅ Assets cacheados con headers correctos
- ✅ Database connection pooling
- ✅ Rate limiting configurado

### 2. SEO
- ✅ Meta tags configurados
- ✅ Sitemap generado
- ✅ robots.txt configurado
- ✅ Structured data (Schema.org)

### 3. Security
- ✅ HTTPS forzado
- ✅ Security headers configurados
- ✅ Rate limiting activo
- ✅ Input validation con Zod
- ✅ CORS configurado correctamente

### 4. Monitoring
- ✅ Health checks configurados
- ✅ Error tracking (Sentry opcional)
- ✅ Performance monitoring
- ✅ Database monitoring

---

## 📞 Soporte

### Recursos Útiles
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Astro Docs](https://docs.astro.build)
- [Prisma Docs](https://www.prisma.io/docs)

### Comandos de Debug
```bash
# Verificar configuración
cd api && npm run debug:config

# Test health check local
cd api && npm run health-check

# Verificar migraciones
cd api && npx prisma migrate status

# Reset completo (CUIDADO: borra datos)
cd api && npm run db:reset
```

---

## ✅ Checklist de Deploy

### Pre-Deploy
- [ ] Tests pasan localmente
- [ ] Build funciona sin errores
- [ ] Variables de entorno configuradas
- [ ] Base de datos creada
- [ ] Dominios configurados

### Deploy
- [ ] Frontend deployado en Vercel
- [ ] API deployada en Railway/Render
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado
- [ ] Health check pasa

### Post-Deploy
- [ ] CORS funcionando
- [ ] WhatsApp configurado
- [ ] Rate limiting activo
- [ ] Monitoreo configurado
- [ ] Logs funcionando

### Testing
- [ ] Frontend carga correctamente
- [ ] API responde en todos los endpoints
- [ ] Base de datos conectada
- [ ] WhatsApp responde
- [ ] PWA funciona offline

¡Deploy completado! 🎉

Tu aplicación Town está ahora en producción y lista para usuarios reales.
