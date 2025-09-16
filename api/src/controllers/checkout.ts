import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { grantCoins, isFirstPurchase, hasReceivedDailyBonus } from './coins.js';

interface CheckoutRequest {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  payment: 'CASH' | 'TRANSFER';
  address?: string;
  note?: string;
}

// POST /checkout - Crear pedido con beneficios de TownCoins
export const checkout = async (req: Request, res: Response) => {
  try {
    const { userId, items, payment, address, note }: CheckoutRequest = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User ID and items are required'
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

    // Verificar productos y calcular total
    let totalCents = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productId} not found`
        });
      }

      if (!product.active) {
        return res.status(400).json({
          success: false,
          error: `Product ${product.title} is not available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.title}. Available: ${product.stock}, requested: ${item.quantity}`
        });
      }

      const itemTotal = product.priceCents * item.quantity;
      totalCents += itemTotal;

      orderItems.push({
        productId: product.id,
        qty: item.quantity,
        priceCents: product.priceCents
      });
    }

    // Determinar monedas a otorgar
    let coinsGranted = 0;
    const coinReasons = [];

    // Verificar si es primera compra
    if (await isFirstPurchase(userId)) {
      coinsGranted += 100;
      coinReasons.push('first_purchase');
    }

    // Verificar bonus diario
    if (!(await hasReceivedDailyBonus(userId))) {
      coinsGranted += 50;
      coinReasons.push('daily_bonus');
    }

    // Usar transacción para garantizar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Crear el pedido
      const order = await tx.order.create({
        data: {
          userId,
          totalCents,
          coinsGranted,
          payment,
          address,
          note,
          status: 'PENDING',
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Actualizar stock de productos
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Otorgar monedas si aplica
      if (coinsGranted > 0) {
        for (const reason of coinReasons) {
          const coins = reason === 'first_purchase' ? 100 : 50;
          await tx.coinLedger.create({
            data: {
              userId,
              coins,
              reason,
              orderId: order.id
            }
          });
        }
      }

      return order;
    });

    logger.info({
      userId,
      orderId: result.id,
      totalCents,
      coinsGranted,
      itemCount: items.length
    }, 'Order created successfully');

    res.status(201).json({
      success: true,
      data: {
        orderId: result.id,
        total: Math.floor(totalCents / 100), // Convertir a pesos
        totalCents,
        coinsGranted,
        status: result.status,
        items: result.items.map(item => ({
          productId: item.productId,
          title: item.product.title,
          quantity: item.qty,
          price: Math.floor(item.priceCents / 100),
          priceCents: item.priceCents,
          subtotal: Math.floor((item.priceCents * item.qty) / 100)
        }))
      }
    });

  } catch (error) {
    logger.error(error, 'Error in checkout');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
