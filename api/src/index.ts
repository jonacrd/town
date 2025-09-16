import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './lib/env.js';
import { logger, sanitizeForLog } from './lib/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { generalApiRateLimiter, webhookRateLimiter, broadcastRateLimiter } from './middleware/rateLimiter.js';

// Importar rutas
import healthRoutes from './routes/health.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import whatsappRoutes from './routes/whatsapp.js';

// Crear aplicación Express
const app = express();

// Configurar confianza en proxies (importante para obtener IP real)
app.set('trust proxy', 1);

// Middleware global de seguridad
app.use(pinoHttp({ 
  logger,
  // Sanitizar logs de requests automáticamente
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: sanitizeForLog(req.headers),
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
})); // Logger de requests

app.use(corsMiddleware); // CORS estricto

// Rate limiting general para todas las rutas API
app.use('/api', generalApiRateLimiter);

// Parsers con límites de seguridad
app.use(express.json({ 
  limit: '1mb', // Reducido de 10mb por seguridad
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 100 // Limitar número de parámetros
}));

// Health check endpoint (sin rate limiting)
app.use('/health', healthRoutes);

// API routes con validación
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// WhatsApp webhook routes con rate limiting específico
app.use('/webhook/whatsapp', webhookRateLimiter, whatsappRoutes);

// Broadcast routes con rate limiting más estricto (si se implementa)
app.use('/api/broadcast', broadcastRateLimiter, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Broadcast functionality not implemented yet'
  });
});

// Root endpoint con información limitada
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Town API Server',
    version: '1.0.0',
    // Solo mostrar environment en desarrollo
    ...(env.NODE_ENV === 'development' && { environment: env.NODE_ENV }),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint de seguridad para verificar configuración (solo desarrollo)
if (env.NODE_ENV === 'development') {
  app.get('/debug/config', (req, res) => {
    res.json({
      success: true,
      config: sanitizeForLog({
        NODE_ENV: env.NODE_ENV,
        ALLOW_ORIGIN: env.ALLOW_ORIGIN,
        WHATSAPP_PROVIDER: env.WHATSAPP_PROVIDER,
        LOG_LEVEL: env.LOG_LEVEL,
      }),
    });
  });
}

// Middleware de manejo de errores (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    const server = app.listen(env.PORT, () => {
      logger.info({
        port: env.PORT,
        environment: env.NODE_ENV,
        allowOrigin: env.ALLOW_ORIGIN,
      }, 'Town API Server started');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

// Inicializar servidor solo si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;