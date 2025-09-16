import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { ApiResponse } from '../types/index.js';

export const healthCheck = async (req: Request, res: Response<ApiResponse>) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      data: {
        ok: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      data: {
        ok: false,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'disconnected',
      },
    });
  }
};
