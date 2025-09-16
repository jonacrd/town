import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitOptions {
  windowMs: number;    // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests por ventana
  message?: string;    // Mensaje de error personalizado
  skipSuccessfulRequests?: boolean; // No contar requests exitosos
  skipFailedRequests?: boolean;     // No contar requests fallidos
}

// Store en memoria para rate limiting (en producción usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpieza periódica del store
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Limpiar cada minuto

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Obtener IP del cliente (considerando proxies)
    const clientIP = getClientIP(req);
    const key = `${clientIP}:${req.route?.path || req.path}`;
    const now = Date.now();

    // Obtener o crear entrada para esta IP
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Nueva ventana de tiempo
      entry = {
        count: 0,
        resetTime: now + windowMs,
        firstRequest: now
      };
      rateLimitStore.set(key, entry);
    }

    // Incrementar contador
    entry.count++;

    // Calcular headers de rate limit
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetTime / 1000);

    // Agregar headers de rate limit
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
      'X-RateLimit-Window': Math.ceil(windowMs / 1000).toString()
    });

    // Verificar si excede el límite
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.warn({
        clientIP,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        count: entry.count,
        limit: maxRequests,
        retryAfter
      }, 'Rate limit exceeded');

      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: message,
        data: {
          limit: maxRequests,
          remaining: 0,
          resetTime: resetTime,
          retryAfter: retryAfter
        }
      });
    }

    // Middleware para contar solo después de la respuesta
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.json;
      res.json = function(body: any) {
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 400;
        const isFailed = statusCode >= 400;

        // Decrementar si debemos skipear este tipo de request
        if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && isFailed)) {
          entry!.count--;
        }

        return originalSend.call(this, body);
      };
    }

    next();
  };
}

// Obtener IP real del cliente considerando proxies
function getClientIP(req: Request): string {
  const forwarded = req.get('X-Forwarded-For');
  const realIP = req.get('X-Real-IP');
  const clientIP = req.get('X-Client-IP');
  
  if (forwarded) {
    // X-Forwarded-For puede contener múltiples IPs separadas por coma
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) return realIP;
  if (clientIP) return clientIP;
  
  return req.socket.remoteAddress || 'unknown';
}

// Rate limiters predefinidos
export const webhookRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,          // 100 requests por 15 min
  message: 'Too many webhook requests. Please wait before trying again.',
  skipSuccessfulRequests: false
});

export const broadcastRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos  
  maxRequests: 50,          // 50 broadcasts por 15 min (más restrictivo)
  message: 'Too many broadcast requests. Please wait before trying again.',
  skipFailedRequests: true  // No contar requests fallidos
});

export const generalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 1000,        // 1000 requests por 15 min para API general
  message: 'Too many API requests. Please wait before trying again.'
});

// Rate limiter más estricto para endpoints sensibles
export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutos
  maxRequests: 10,          // Solo 10 requests por 5 min
  message: 'Rate limit exceeded for sensitive endpoint. Please wait before trying again.'
});

// Helper para limpiar manualmente el store (útil para tests)
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

// Helper para obtener estadísticas del rate limiter
export function getRateLimitStats(): {
  totalEntries: number;
  entries: Array<{
    key: string;
    count: number;
    resetTime: number;
    remaining: number;
  }>;
} {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
    key,
    count: entry.count,
    resetTime: entry.resetTime,
    remaining: Math.max(0, entry.resetTime - now)
  }));

  return {
    totalEntries: rateLimitStore.size,
    entries
  };
}
