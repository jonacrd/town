import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

// GET /coins/balance?userId=xxx - Obtener balance de TownCoins
export const getCoinBalance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calcular balance total sumando todas las transacciones
    const coinTransactions = await prisma.coinLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const totalBalance = coinTransactions.reduce((sum, transaction) => sum + transaction.coins, 0);

    // Obtener últimas transacciones para historial
    const recentTransactions = coinTransactions.slice(0, 10).map(transaction => ({
      id: transaction.id,
      coins: transaction.coins,
      reason: transaction.reason,
      createdAt: transaction.createdAt
    }));

    res.json({
      success: true,
      data: {
        userId,
        balance: totalBalance,
        transactions: recentTransactions
      }
    });

  } catch (error) {
    logger.error(error, 'Error getting coin balance');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Función auxiliar para otorgar monedas
export async function grantCoins(
  userId: string, 
  coins: number, 
  reason: string, 
  orderId?: string
): Promise<void> {
  await prisma.coinLedger.create({
    data: {
      userId,
      coins,
      reason,
      orderId
    }
  });
  
  logger.info({ userId, coins, reason, orderId }, 'Coins granted');
}

// Función auxiliar para verificar si es la primera compra del usuario
export async function isFirstPurchase(userId: string): Promise<boolean> {
  const orderCount = await prisma.order.count({
    where: { 
      userId,
      status: { in: ['PAID', 'DELIVERED'] }
    }
  });
  
  return orderCount === 0;
}

// Función auxiliar para verificar si ya recibió bonus diario hoy
export async function hasReceivedDailyBonus(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayBonus = await prisma.coinLedger.findFirst({
    where: {
      userId,
      reason: 'daily_bonus',
      createdAt: { gte: today }
    }
  });
  
  return todayBonus !== null;
}
