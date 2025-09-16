import pino from 'pino';
import { env } from './env.js';

// Configuración del logger Pino con sanitización
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss Z',
      messageFormat: '{msg}',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Serializers personalizados para sanitizar datos sensibles
  serializers: {
    req: (req: any) => {
      return {
        method: req.method,
        url: req.url,
        headers: sanitizeHeaders(req.headers),
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res: (res: any) => {
      return {
        statusCode: res.statusCode,
        headers: sanitizeHeaders(res.getHeaders?.() || {}),
      };
    },
    err: (err: any) => {
      return {
        type: err.constructor.name,
        message: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
        ...(err.code && { code: err.code }),
        ...(err.statusCode && { statusCode: err.statusCode }),
      };
    },
  },
});

// Sanitizar headers para remover tokens y datos sensibles
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'x-refresh-token',
  ];

  const sanitized = { ...headers };

  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Sanitizar objetos para logs (remover tokens y datos sensibles)
export function sanitizeForLog(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'twilio_auth_token', 'meta_access_token', 'api_key',
    'twilio_account_sid', 'meta_phone_number_id', 'access_token',
    'auth_token', 'verify_token', 'webhook_secret'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  // Sanitizar campos sensibles
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      const value = sanitized[field];
      if (typeof value === 'string' && value.length > 0) {
        // Mostrar solo los primeros y últimos caracteres
        sanitized[field] = value.length > 8 
          ? `${value.substring(0, 3)}***${value.substring(value.length - 3)}`
          : '[REDACTED]';
      } else {
        sanitized[field] = '[REDACTED]';
      }
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

// Helper para crear child loggers con contexto
export const createChildLogger = (name: string, context?: Record<string, any>) => {
  return logger.child({ 
    module: name,
    ...(context && { context: sanitizeForLog(context) })
  });
};

// Logger específico para WhatsApp (con sanitización extra)
export const whatsappLogger = createChildLogger('whatsapp');

// Logger específico para API requests
export const apiLogger = createChildLogger('api');

// Logger específico para base de datos
export const dbLogger = createChildLogger('database');

// Helper para loggear requests HTTP de forma segura
export function logHttpRequest(req: any, additionalData?: Record<string, any>) {
  const sanitizedBody = sanitizeForLog(req.body);
  const sanitizedQuery = sanitizeForLog(req.query);
  const sanitizedHeaders = sanitizeHeaders(req.headers);

  apiLogger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    clientIP: getClientIP(req),
    headers: sanitizedHeaders,
    body: sanitizedBody,
    query: sanitizedQuery,
    ...sanitizeForLog(additionalData || {}),
  }, 'HTTP Request');
}

// Helper para loggear respuestas HTTP
export function logHttpResponse(res: any, duration?: number, additionalData?: Record<string, any>) {
  apiLogger.info({
    statusCode: res.statusCode,
    duration: duration ? `${duration}ms` : undefined,
    ...sanitizeForLog(additionalData || {}),
  }, 'HTTP Response');
}

// Helper para obtener IP del cliente
function getClientIP(req: any): string {
  const forwarded = req.get('X-Forwarded-For');
  const realIP = req.get('X-Real-IP');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) return realIP;
  return req.socket?.remoteAddress || 'unknown';
}

// Helper para loggear operaciones de base de datos
export function logDatabaseOperation(operation: string, table?: string, duration?: number, error?: any) {
  if (error) {
    dbLogger.error({
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      error: error.message,
    }, 'Database operation failed');
  } else {
    dbLogger.info({
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
    }, 'Database operation completed');
  }
}

// Helper para loggear actividad de WhatsApp de forma segura
export function logWhatsAppActivity(
  action: string, 
  phoneNumber?: string, 
  provider?: string,
  additionalData?: Record<string, any>
) {
  // Enmascarar número de teléfono para privacidad
  const maskedPhone = phoneNumber 
    ? `${phoneNumber.substring(0, 3)}***${phoneNumber.substring(phoneNumber.length - 3)}`
    : undefined;

  whatsappLogger.info({
    action,
    phoneNumber: maskedPhone,
    provider,
    ...sanitizeForLog(additionalData || {}),
  }, 'WhatsApp activity');
}
