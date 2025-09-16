import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Importar rutas
import healthRoutes from './routes/health.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import whatsappRoutes from './routes/whatsapp.js';

// Crear aplicación Express
const app = express();

// Middleware global
app.use(pinoHttp({ logger })); // Logger de requests
app.use(corsMiddleware); // CORS
app.use(express.json({ limit: '10mb' })); // JSON parser
app.use(express.urlencoded({ extended: true })); // URL-encoded parser

// Health check endpoint
app.use('/health', healthRoutes);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// WhatsApp webhook routes
app.use('/', whatsappRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Town API Server',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

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