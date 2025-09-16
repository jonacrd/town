import cors from 'cors';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

// Configuración de CORS más estricta
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // En desarrollo, permitir requests sin origin (ej: Postman, tests)
    if (!origin && env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En producción, rechazar requests sin origin
    if (!origin && env.NODE_ENV === 'production') {
      logger.warn('CORS: Request without origin rejected in production');
      return callback(new Error('Origin header required'), false);
    }
    
    // Lista de orígenes permitidos (separados por coma)
    const allowedOrigins = env.ALLOW_ORIGIN.split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);
    
    // Verificar si el origin está permitido
    if (allowedOrigins.includes(origin || '')) {
      callback(null, true);
    } else {
      logger.warn({
        origin,
        allowedOrigins,
        userAgent: 'request-context'
      }, 'CORS: Origin not allowed');
      callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-API-Key'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 horas para preflight cache
});
