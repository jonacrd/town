#!/usr/bin/env tsx
/**
 * Health Check Script
 * Verifica que todos los servicios estén funcionando correctamente
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger.js';
import { env } from '../src/lib/env.js';

const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    whatsapp: {
      provider: string;
      configured: boolean;
    };
  };
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

async function checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; latency?: number }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return { status: 'connected', latency };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'disconnected' };
  }
}

function checkWhatsAppConfig(): { provider: string; configured: boolean } {
  const provider = env.WHATSAPP_PROVIDER;
  let configured = false;

  if (provider === 'twilio') {
    configured = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM);
  } else if (provider === 'meta') {
    configured = !!(env.META_VERIFY_TOKEN && env.META_PHONE_NUMBER_ID && env.META_ACCESS_TOKEN);
  }

  return { provider, configured };
}

function getMemoryMetrics() {
  const used = process.memoryUsage();
  const total = used.heapTotal;
  const percentage = Math.round((used.heapUsed / total) * 100);

  return {
    used: Math.round(used.heapUsed / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage
  };
}

async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    logger.info('🏥 Starting health check...');

    // Check database
    const databaseStatus = await checkDatabase();
    
    // Check WhatsApp configuration
    const whatsappStatus = checkWhatsAppConfig();
    
    // Get system metrics
    const memoryMetrics = getMemoryMetrics();
    
    const healthStatus: HealthStatus = {
      status: databaseStatus.status === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      services: {
        database: databaseStatus,
        whatsapp: whatsappStatus
      },
      metrics: {
        uptime: Math.round(process.uptime()),
        memory: memoryMetrics
      }
    };

    const duration = Date.now() - startTime;
    
    if (healthStatus.status === 'healthy') {
      logger.info(`✅ Health check passed in ${duration}ms`);
    } else {
      logger.warn(`⚠️  Health check failed in ${duration}ms`);
    }

    return healthStatus;

  } catch (error) {
    logger.error('❌ Health check error:', error);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      services: {
        database: { status: 'disconnected' },
        whatsapp: { provider: env.WHATSAPP_PROVIDER, configured: false }
      },
      metrics: {
        uptime: Math.round(process.uptime()),
        memory: getMemoryMetrics()
      }
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar health check si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  performHealthCheck()
    .then((status) => {
      console.log(JSON.stringify(status, null, 2));
      process.exit(status.status === 'healthy' ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Health check failed:', error);
      process.exit(1);
    });
}

export { performHealthCheck, type HealthStatus };
