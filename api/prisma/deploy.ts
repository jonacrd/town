#!/usr/bin/env tsx
/**
 * Script de deploy para Prisma
 * Ejecuta migraciones y seed en producción
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger.js';

const prisma = new PrismaClient();

async function deployDatabase() {
  try {
    logger.info('🚀 Starting database deployment...');

    // Verificar conexión a la base de datos
    logger.info('📡 Testing database connection...');
    await prisma.$connect();
    logger.info('✅ Database connection successful');

    // Verificar si la base de datos ya tiene datos
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    
    logger.info(`📊 Current database state: ${userCount} users, ${productCount} products`);

    // Solo ejecutar seed si la base de datos está vacía
    if (userCount === 0 && productCount === 0) {
      logger.info('🌱 Database is empty, running seed...');
      
      // Importar y ejecutar seed
      const { main: runSeed } = await import('./seed.js');
      await runSeed();
      
      logger.info('✅ Seed completed successfully');
    } else {
      logger.info('⏭️  Database already has data, skipping seed');
    }

    logger.info('🎉 Database deployment completed successfully');

  } catch (error) {
    logger.error('❌ Database deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deployDatabase();
}

export { deployDatabase };
