import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';
import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de manejo de errores
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Obtener IP del cliente para logs
  const clientIP = getClientIP(req);

  // Log del error (siempre completo para debugging)
  logger.error({
    error: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    clientIP,
    userAgent: req.get('User-Agent'),
    // Solo loggear body en desarrollo (puede contener datos sensibles)
    body: env.NODE_ENV === 'development' ? sanitizeForLog(req.body) : undefined,
    timestamp: new Date().toISOString(),
  }, 'Error occurred');

  // Manejo específico de tipos de error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    
    details = { validationErrors };
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(env.NODE_ENV === 'development' && { details }),
    });
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (err.message.includes('CORS')) {
    // Error de CORS
    statusCode = 403;
    message = 'Access denied: CORS policy violation';
  } else if (err.message.includes('Rate limit')) {
    // Error de rate limiting
    statusCode = 429;
    message = err.message;
  }

  // Preparar respuesta
  const errorResponse: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  // En desarrollo, incluir más detalles
  if (env.NODE_ENV === 'development') {
    errorResponse.details = {
      originalError: err.message,
      stack: err.stack,
      statusCode,
    };
  }

  // En producción, solo incluir ID de error para tracking
  if (env.NODE_ENV === 'production') {
    const errorId = generateErrorId();
    errorResponse.errorId = errorId;
    
    logger.error({
      errorId,
      error: err.message,
      stack: err.stack,
    }, 'Production error logged with ID');
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

// Helper para async error handling
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Obtener IP del cliente considerando proxies
function getClientIP(req: Request): string {
  const forwarded = req.get('X-Forwarded-For');
  const realIP = req.get('X-Real-IP');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) return realIP;
  return req.socket.remoteAddress || 'unknown';
}

// Generar ID único para errores en producción
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `err_${timestamp}_${random}`;
}

// Sanitizar datos sensibles para logs
function sanitizeForLog(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'twilio_auth_token', 'meta_access_token', 'api_key'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursivamente sanitizar objetos anidados
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

// Middleware para validación de entrada con Zod
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar body, query, y params según lo que esté definido en el schema
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(error); // Será manejado por errorHandler
    }
  };
};
