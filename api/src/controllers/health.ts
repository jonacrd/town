import type { Request, Response } from 'express';
import { performHealthCheck, type HealthStatus } from '../../scripts/health-check.js';
import { logger } from '../lib/logger.js';
import type { ApiResponse } from '../types/index.js';

export const healthCheck = async (
  req: Request,
  res: Response<ApiResponse<HealthStatus>>
) => {
  const startTime = Date.now();
  
  try {
    const healthStatus = await performHealthCheck();
    const duration = Date.now() - startTime;
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    logger.info(`Health check endpoint completed in ${duration}ms - Status: ${healthStatus.status}`);

    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus,
      ...(healthStatus.status === 'unhealthy' && { 
        error: 'One or more services are unhealthy' 
      }),
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Health check endpoint failed in ${duration}ms:`, error);

    res.status(503).json({
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'unknown',
        services: {
          database: { status: 'disconnected' },
          whatsapp: { provider: 'unknown', configured: false }
        },
        metrics: {
          uptime: Math.round(process.uptime()),
          memory: {
            used: 0,
            total: 0,
            percentage: 0
          }
        }
      } as HealthStatus,
    });
  }
};
