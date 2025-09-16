import { z } from 'zod';
import type { Role, OrderStatus, PaymentMethod } from '@prisma/client';

// Schemas de validación con Zod

// Product schemas
export const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().max(50).optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().max(50).optional(),
  active: z.boolean().optional(),
});

// Order schemas
export const orderItemSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  userId: z.string().cuid(),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  payment: z.enum(['CASH', 'TRANSFER']).default('CASH'),
  address: z.string().max(200).optional(),
  note: z.string().max(300).optional(),
});

// Query schemas
export const productsQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  active: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export const ordersQuerySchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'DELIVERED']).optional(),
  userId: z.string().cuid().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Product types
export interface ProductWithSeller {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  seller: {
    id: string;
    storeName: string;
    tower: string | null;
    user: {
      name: string | null;
      phone: string;
    };
  };
}

// Order types
export interface OrderWithDetails {
  id: string;
  status: OrderStatus;
  payment: PaymentMethod;
  totalCents: number;
  address: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    phone: string;
  };
  items: {
    id: string;
    qty: number;
    priceCents: number;
    product: {
      id: string;
      title: string;
      imageUrl: string | null;
      seller: {
        storeName: string;
      };
    };
  }[];
}

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ProductsQuery = z.infer<typeof productsQuerySchema>;
export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
