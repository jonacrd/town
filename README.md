# 🏘️ Town - Marketplace Comunitario

**Town** es una plataforma de marketplace comunitario que conecta vecinos para comprar y vender productos localmente. Desarrollada con tecnologías modernas para ofrecer una experiencia rápida y confiable.

## 🚀 Características

- **🛒 Catálogo de Productos**: Navegación intuitiva con filtros por categoría, precio y disponibilidad
- **📱 PWA Ready**: Experiencia nativa en móviles con instalación offline
- **🤖 Feed IA**: Recomendaciones inteligentes de productos basadas en preferencias
- **💰 Sistema de Recompensas**: TownCoins por compras y actividad diaria
- **📲 Registro WhatsApp**: Autenticación simple con número de teléfono
- **🌎 Multicultural**: Soporte para productos chilenos y venezolanos
- **⚡ Performance**: Carga rápida con lazy loading y optimizaciones

## 🏗️ Arquitectura

```
town/
├── api/          # Backend API (Express + TypeScript)
├── web/          # Frontend PWA (Astro + React + Tailwind)
├── docs/         # Documentación del proyecto
└── scripts/      # Scripts de deployment
```

## 🛠️ Stack Tecnológico

### Backend (`/api`)
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos principal
- **Pino** - Logging estructurado
- **CORS** - Manejo de cross-origin requests

### Frontend (`/web`)
- **Astro** - Framework web moderno
- **React** - Componentes interactivos
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Service Worker** - Funcionalidad PWA
- **Vite** - Bundler y dev server

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 14+ (opcional, funciona con datos mock)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/town.git
cd town
```

### 2. Instalar dependencias
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del API
cd api
npm install

# Instalar dependencias del frontend
cd ../web
npm install
```

### 3. Configurar variables de entorno

**API (`/api/.env`):**
```bash
cd api
cp env.example .env
# Editar .env con tus configuraciones
```

**Web (`/web/.env`):**
```bash
cd web
cp env.example .env
# Solo necesario para producción
```

### 4. Ejecutar en desarrollo

**Terminal 1 - API:**
```bash
cd api
npm run dev
# Servidor API en http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
# App web en http://localhost:4321
```

### 5. Abrir la aplicación
- **Frontend**: http://localhost:4321
- **API Health**: http://localhost:4000/health
- **API Productos**: http://localhost:4000/api/products

## 📱 Funcionalidades Principales

### 🛍️ Catálogo de Productos
- Navegación por categorías (Comida, Ropa, Hogar, Fast-food, Abarrotes)
- Búsqueda en tiempo real
- Filtros por stock y precio
- Productos chilenos y venezolanos

### 🤖 Feed IA
- Recomendaciones personalizadas
- Búsqueda por voz: "¿Qué necesitas hoy?"
- Respuestas contextuales sobre productos

### 💰 Sistema TownCoins
- +100 coins por primera compra
- +50 coins por actividad diaria
- Historial de transacciones

### 📲 Autenticación
- Registro simple con WhatsApp
- Sin contraseñas complicadas
- Almacenamiento local del usuario

## 🔧 Scripts Disponibles

### API (`/api`)
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Producción
npm run migrate      # Migraciones Prisma
npm run generate     # Generar cliente Prisma
```

### Web (`/web`)
```bash
npm run dev          # Desarrollo con HMR
npm run build        # Build para producción
npm run preview      # Preview del build
npm run astro        # CLI de Astro
```

## 🌐 API Endpoints

### Públicos
- `GET /health` - Estado del servidor
- `GET /api/products` - Listado de productos
- `POST /auth/whatsapp` - Registro/login con WhatsApp

### Feed IA
- `POST /ai/feed` - Recomendaciones personalizadas
- `GET /coins/balance` - Balance de TownCoins

### Parámetros de Productos
```bash
GET /api/products?category=comida&query=empanada&active=true
```

## 🚀 Deploy

### Desarrollo Local
El proyecto está configurado para funcionar inmediatamente con datos mock, sin necesidad de configurar base de datos.

### Producción
1. Configurar variables de entorno de producción
2. Configurar base de datos PostgreSQL
3. Ejecutar migraciones: `npm run migrate`
4. Build: `npm run build`
5. Deploy API y Frontend por separado

### Plataformas Recomendadas
- **API**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify
- **Base de Datos**: Supabase, PlanetScale, Railway

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/town/issues)
- **Documentación**: [/docs](./docs/)
- **Email**: support@town.example.com

---

**Hecho con ❤️ para conectar comunidades locales**