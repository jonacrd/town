import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { AppError, asyncHandler } from '../middleware/error.js';
import {
  createOrderSchema,
  ordersQuerySchema,
  type ApiResponse,
  type PaginatedResponse,
  type OrderWithDetails,
} from '../types/index.js';

// GET /orders - Listar pedidos con filtros
export const getOrders = asyncHandler(async (req: Request, res: Response<PaginatedResponse<OrderWithDetails>>) => {
  const query = ordersQuerySchema.parse(req.query);
  
  const where = {
    ...(query.status && { status: query.status }),
    ...(query.userId && { userId: query.userId }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                seller: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.ceil(total / query.limit);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages,
    },
  });
});

// POST /orders - Crear pedido
export const createOrder = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const data = createOrderSchema.parse(req.body);

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verificar que todos los productos existen y tienen stock suficiente
  const productIds = data.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      active: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found or inactive', 400);
  }

  // Validar stock y calcular total
  let totalCents = 0;
  const orderItems = [];

  for (const item of data.items) {
    const product = products.find(p => p.id === item.productId);
    
    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 400);
    }

    if (product.stock < item.qty) {
      throw new AppError(`Insufficient stock for product "${product.title}". Available: ${product.stock}, requested: ${item.qty}`, 400);
    }

    const itemTotal = product.priceCents * item.qty;
    totalCents += itemTotal;

    orderItems.push({
      productId: item.productId,
      qty: item.qty,
      priceCents: product.priceCents,
    });
  }

  // Crear pedido y actualizar stock en una transacción
  const order = await prisma.$transaction(async (tx) => {
    // Crear el pedido
    const newOrder = await tx.order.create({
      data: {
        userId: data.userId,
        payment: data.payment,
        totalCents,
        address: data.address,
        note: data.note,
        items: {
          create: orderItems,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                seller: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Actualizar stock de productos
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.qty,
          },
        },
      });
    }

    return newOrder;
  });

  logger.info({ 
    orderId: order.id, 
    userId: data.userId, 
    totalCents, 
    itemsCount: data.items.length 
  }, 'Order created');

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created successfully',
  });
});

// GET /orders/:id - Obtener pedido por ID
export const getOrderById = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              seller: {
                select: {
                  storeName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: order,
  });
});

// PATCH /orders/:id - Actualizar estado del pedido
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validar status
  const validStatuses = ['PENDING', 'PAID', 'CANCELLED', 'DELIVERED'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              seller: {
                select: {
                  storeName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  logger.info({ orderId: id, oldStatus: existingOrder.status, newStatus: status }, 'Order status updated');

  res.json({
    success: true,
    data: order,
    message: 'Order status updated successfully',
  });
});
