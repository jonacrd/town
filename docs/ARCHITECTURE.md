# Arquitectura del Proyecto Town

## Visión General

Town es un monorepo que contiene una aplicación web moderna construida con las mejores prácticas y tecnologías actuales.

## Estructura del Proyecto

```
town/
├── web/              # Frontend (Astro + React + Tailwind)
├── api/              # Backend (Node.js + Express + Prisma)
├── docs/             # Documentación
├── package.json      # Configuración del workspace raíz
├── .eslintrc.json    # Configuración de ESLint
├── .prettierrc.json  # Configuración de Prettier
├── .editorconfig     # Configuración del editor
└── .gitignore        # Archivos ignorados por Git
```

## Stack Tecnológico

### Frontend (/web)
- **Astro**: Framework web moderno con hidratación selectiva
- **React**: Librería para componentes interactivos
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de CSS utilitario
- **PWA**: Progressive Web App capabilities

### Backend (/api)
- **Node.js**: Runtime de JavaScript
- **Express**: Framework web minimalista
- **TypeScript**: Tipado estático
- **Prisma**: ORM moderno para base de datos
- **PostgreSQL**: Base de datos relacional

### Herramientas de Desarrollo
- **ESLint**: Linter de código
- **Prettier**: Formateador de código
- **Concurrently**: Ejecución de comandos paralelos
- **tsx**: Ejecutor de TypeScript

## Flujo de Datos

```
Usuario → Frontend (Astro/React) → API (Express) → Base de Datos (PostgreSQL)
```

## Patrones de Diseño

- **Monorepo**: Gestión centralizada de dependencias y configuración
- **API-First**: Separación clara entre frontend y backend
- **TypeScript-First**: Tipado fuerte en toda la aplicación
- **Component-Based**: Arquitectura basada en componentes reutilizables
