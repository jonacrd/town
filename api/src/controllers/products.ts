import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { AppError, asyncHandler } from '../middleware/error.js';
import {
  createProductSchema,
  updateProductSchema,
  productsQuerySchema,
  type ApiResponse,
  type PaginatedResponse,
  type ProductWithSeller,
} from '../types/index.js';

// GET /products - Listar productos con filtros
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  // Obtener parámetros de consulta con valores por defecto
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const query = req.query.query as string;
  const category = req.query.category as string;
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
  
  const where = {
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && { category }),
    ...(active !== undefined && { active }),
  };

  const items = await prisma.product.findMany({
    where,
    include: {
      seller: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Siempre devolver 200, incluso si está vacío
  res.json(items); // aunque sea []
});

// POST /products - Crear producto (seller)
export const createProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const data = createProductSchema.parse(req.body);
  
  // TODO: Obtener sellerId del token de autenticación
  // Por ahora, usar el primer seller disponible o crear uno de prueba
  let seller = await prisma.seller.findFirst();
  
  if (!seller) {
    // Crear usuario y seller de prueba si no existe
    const testUser = await prisma.user.create({
      data: {
        phone: '+57300123456',
        name: 'Vendedor Demo',
        role: 'SELLER',
      },
    });
    
    seller = await prisma.seller.create({
      data: {
        userId: testUser.id,
        storeName: 'Tienda Demo',
        tower: 'Torre A',
      },
    });
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      sellerId: seller.id,
    },
    include: {
      seller: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  logger.info({ productId: product.id, sellerId: seller.id }, 'Product created');

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
});

// PATCH /products/:id - Actualizar producto
export const updateProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;
  const data = updateProductSchema.parse(req.body);

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      seller: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  logger.info({ productId: id, updates: Object.keys(data) }, 'Product updated');

  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  });
});

// DELETE /products/:id - Desactivar producto
export const deleteProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // Soft delete - marcar como inactivo
  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  logger.info({ productId: id }, 'Product deactivated');

  res.json({
    success: true,
    message: 'Product deactivated successfully',
  });
});

// GET /products/:id - Obtener producto por ID
export const getProductById = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      seller: {
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product,
  });
});
