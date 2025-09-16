# Guía de Desarrollo

## Configuración del Entorno

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0

### Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd town
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
# En /api
cp env.example .env
# Editar .env con tus configuraciones
```

4. Configurar la base de datos:
```bash
npm run db:push --workspace=api
npm run db:seed --workspace=api
```

## Scripts Disponibles

### Desarrollo
- `npm run dev` - Ejecutar web y api en modo desarrollo
- `npm run dev:web` - Solo el frontend
- `npm run dev:api` - Solo el backend

### Construcción
- `npm run build` - Construir ambos proyectos
- `npm run build:web` - Solo el frontend
- `npm run build:api` - Solo el backend

### Calidad de Código
- `npm run lint` - Ejecutar ESLint en ambos proyectos
- `npm run lint:fix` - Corregir errores de ESLint automáticamente
- `npm run format` - Formatear código con Prettier
- `npm run type-check` - Verificar tipos de TypeScript

### Base de Datos (API)
- `npm run db:generate --workspace=api` - Generar cliente Prisma
- `npm run db:push --workspace=api` - Sincronizar schema con BD
- `npm run db:migrate --workspace=api` - Ejecutar migraciones
- `npm run db:studio --workspace=api` - Abrir Prisma Studio
- `npm run db:seed --workspace=api` - Poblar BD con datos de ejemplo

## Convenciones de Código

### Commits
Usar conventional commits:
- `feat:` para nuevas características
- `fix:` para corrección de bugs
- `docs:` para documentación
- `style:` para cambios de formato
- `refactor:` para refactoring
- `test:` para pruebas
- `chore:` para tareas de mantenimiento

### Estructura de Archivos
- Usar camelCase para archivos TypeScript
- Usar kebab-case para archivos de configuración
- Componentes React en PascalCase
- Mantener estructura consistente por workspace

### TypeScript
- Usar tipos explícitos cuando sea necesario
- Evitar `any`, preferir `unknown`
- Usar interfaces para objetos complejos
- Documentar funciones públicas con JSDoc
