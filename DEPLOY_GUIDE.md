# 🚀 Guía de Deploy a Vercel - Town

## 📋 Preparación Completada

✅ **Vercel.json eliminado** (para evitar conflictos)
✅ **Astro config actualizado** con adaptador de Vercel
✅ **API funcionando** con datos mock
✅ **Frontend funcionando** con login y productos

## 🌐 Estrategia de Deploy

### **Opción 1: Deploy Separado (Recomendado)**

#### **1. API en Railway/Render**
- **API**: Despliega en Railway o Render
- **Frontend**: Despliega en Vercel
- **Ventaja**: Mejor para APIs con base de datos

#### **2. Frontend en Vercel**
- Solo el frontend web
- Configurar `PUBLIC_API_BASE_URL` para apuntar a la API

### **Opción 2: Todo en Vercel (Más Simple)**
- API como Vercel Functions
- Frontend como sitio estático
- **Limitación**: Vercel Functions tienen timeout de 10s

---

## 🚀 Deploy Opción 1 (Recomendado)

### **Paso 1: Deploy API en Railway**

1. **Crear cuenta en [Railway.app](https://railway.app)**

2. **Conectar GitHub**:
   - New Project → Deploy from GitHub repo
   - Selecciona tu repositorio `town`
   - Root Directory: `/api`

3. **Variables de entorno en Railway**:
   ```env
   NODE_ENV=production
   PORT=4000
   ALLOW_ORIGIN=https://tu-app.vercel.app
   ```

4. **Railway detectará automáticamente**:
   - `package.json` en `/api`
   - Comando de build: `npm run build`
   - Comando de start: `npm start`

5. **Obtener URL de la API**:
   - Railway te dará una URL como: `https://town-api-production.up.railway.app`

### **Paso 2: Deploy Frontend en Vercel**

1. **Crear cuenta en [Vercel.com](https://vercel.com)**

2. **Conectar GitHub**:
   - New Project → Import Git Repository
   - Selecciona tu repositorio `town`
   - Root Directory: `/web`

3. **Configurar variables de entorno en Vercel**:
   ```env
   PUBLIC_API_BASE_URL=https://tu-api-railway.up.railway.app
   ```

4. **Deploy automático**:
   - Vercel detectará Astro automáticamente
   - Build command: `npm run build`
   - Output directory: `dist`

---

## 🚀 Deploy Opción 2 (Todo en Vercel)

### **Paso 1: Preparar API como Vercel Functions**

1. **Crear carpeta API en web**:
   ```bash
   mkdir web/api
   ```

2. **Mover lógica de API**:
   - Convertir `api/server-simple.js` en funciones serverless
   - Cada endpoint = una función

3. **Variables de entorno en Vercel**:
   ```env
   NODE_ENV=production
   ```

### **Paso 2: Deploy a Vercel**

1. **Root Directory**: `/web`
2. **Build Command**: `npm run build`
3. **Vercel detectará automáticamente** el proyecto Astro

---

## 🔧 Preparación para Deploy

### **1. Commit y Push a GitHub**

```bash
cd C:\Users\jonac\town
git add .
git commit -m "🚀 Ready for Vercel deployment

- Remove vercel.json (prefer auto-config)
- Fix astro.config.mjs for Vercel adapter
- API working with mock data
- Frontend working with auth and products
- All endpoints functional"

git push origin master
```

### **2. Verificar que todo funciona localmente**

```bash
# API
cd api
npm run build
npm start

# Frontend
cd web
npm run build
npm run preview
```

---

## 🌍 URLs Finales

### **Opción 1 (Separado)**
- **API**: `https://town-api.up.railway.app`
- **Frontend**: `https://town.vercel.app`

### **Opción 2 (Todo Vercel)**
- **Todo**: `https://town.vercel.app`
- **API**: `https://town.vercel.app/api/*`

---

## ⚡ Deploy Rápido (Recomendado)

### **Opción Más Simple - Solo Frontend en Vercel**

Si quieres empezar rápido, puedes deployar solo el frontend con la API mock:

1. **Ve a [vercel.com](https://vercel.com)**
2. **Import Git Repository**
3. **Root Directory**: `/web`
4. **Environment Variables**: (ninguna necesaria para mock)
5. **Deploy**

La app funcionará completamente con datos de prueba.

---

## 🎯 Próximos Pasos

1. **¿Cuál opción prefieres?**
   - Opción 1: API separada (más profesional)
   - Opción 2: Todo en Vercel (más simple)

2. **Hacer commit y push**

3. **Configurar deploy**

**¿Con cuál opción quieres empezar?** 🚀
