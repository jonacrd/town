# Town Monorepo

Monorepo para el proyecto Town con aplicación web (Astro + React PWA) y API (Node.js + Express + Prisma).

## 📋 Stack Tecnológico

### Web (`/web`)
- **Framework**: Astro 4.x con integración React
- **Estilos**: Tailwind CSS
- **Tipo**: PWA (Progressive Web App)
- **Lenguaje**: TypeScript

### API (`/api`)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL con Prisma ORM
- **Lenguaje**: TypeScript

### Herramientas de Desarrollo
- **Linting**: ESLint con configuración estricta
- **Formato**: Prettier
- **Tipado**: TypeScript estricto
- **Workspaces**: npm workspaces

## 🚀 Scripts Principales

### Desarrollo
```bash
# Ejecutar toda la aplicación (web + api)
npm run dev

# Solo la aplicación web
npm run dev:web

# Solo la API
npm run dev:api
```

### Build
```bash
# Build completo
npm run build

# Build individual
npm run build:web
npm run build:api
```

### Calidad de Código
```bash
# Linting
npm run lint
npm run lint:fix

# Formateo
npm run format
npm run format:check

# Verificación de tipos
npm run type-check
```

### Base de Datos (API)
```bash
# Generar cliente Prisma
npm run db:generate --workspace=api

# Push cambios al schema
npm run db:push --workspace=api

# Crear migración
npm run db:migrate --workspace=api

# Abrir Prisma Studio
npm run db:studio --workspace=api

# Ejecutar seed
npm run db:seed --workspace=api
```

## 🔧 Configuración de Entorno

### Variables de Entorno Requeridas

#### API (`/api/.env`)
```env
# Base de datos
DATABASE_URL="postgresql://username:password@localhost:5432/town_db"

# Servidor
PORT=3001
NODE_ENV=development

# CORS (opcional)
ALLOWED_ORIGINS="http://localhost:4321"
```

#### Web (`/web/.env`)
```env
# API endpoint
PUBLIC_API_URL="http://localhost:3001"

# PWA (opcional)
PUBLIC_APP_NAME="Town"
PUBLIC_APP_DESCRIPTION="Town Application"
```

## 🏗️ Arquitectura y Flujo de Datos

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│                 │ ────────────────▶│                 │
│   Web Client    │                 │   API Server    │
│  (Astro+React)  │◀──────────────── │ (Express+Node)  │
│   Port: 4321    │    JSON Data    │   Port: 3001    │
└─────────────────┘                 └─────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│   Static Files  │                 │   PostgreSQL    │
│   + Service     │                 │   Database      │
│   Worker (PWA)  │                 │  (via Prisma)   │
└─────────────────┘                 └─────────────────┘
```

### Flujo de Datos:
1. **Cliente Web**: Interfaz de usuario construida con Astro y componentes React
2. **API REST**: Servidor Express que maneja la lógica de negocio
3. **Base de Datos**: PostgreSQL con Prisma como ORM
4. **PWA**: Service Worker para funcionalidad offline

## 🛠️ Configuración Local

### Prerrequisitos
- Node.js 18+ y npm 9+
- PostgreSQL 14+
- Git

### Instalación

1. **Clonar y configurar dependencias**:
```bash
git clone <repository-url> town
cd town
npm install
```

2. **Configurar base de datos**:
```bash
# Crear base de datos PostgreSQL
createdb town_db

# Configurar variables de entorno
cp api/env.example api/.env
# Editar api/.env con tus credenciales de DB
```

3. **Inicializar Prisma**:
```bash
npm run db:generate --workspace=api
npm run db:push --workspace=api
npm run db:seed --workspace=api
```

4. **Ejecutar en desarrollo**:
```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Web
npm run dev:web

# O ambos a la vez:
npm run dev
```

### URLs de Desarrollo
- **Web**: http://localhost:4321
- **API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (cuando se ejecute)

## 📁 Estructura de Directorios

```
town/
├── web/                 # Aplicación Astro + React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── layouts/     # Layouts de Astro
│   │   ├── pages/       # Páginas de Astro
│   │   └── styles/      # Estilos globales
│   ├── public/          # Assets estáticos
│   └── package.json
├── api/                 # Servidor Express + Prisma
│   ├── src/             # Código fuente
│   ├── prisma/          # Schema y migraciones
│   └── package.json
├── docs/                # Documentación
├── .editorconfig        # Configuración del editor
├── .gitignore           # Archivos ignorados por Git
└── package.json         # Configuración del monorepo
```

## 🤝 Contribución

1. Crear rama desde `main`
2. Realizar cambios siguiendo las convenciones de código
3. Ejecutar `npm run lint` y `npm run type-check`
4. Commit con mensajes claros y atómicos
5. Crear Pull Request

## 📝 Notas Adicionales

- El proyecto usa **npm workspaces** para gestionar dependencias
- Configuración estricta de **ESLint** y **TypeScript**
- **Prettier** configurado para formateo automático
- **Astro** optimiza automáticamente para producción
- **Prisma** maneja migraciones de base de datos
