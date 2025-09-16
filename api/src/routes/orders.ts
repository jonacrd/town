import { Router } from 'express';
import { validateInput } from '../middleware/error.js';
import { schemas } from '../schemas/validation.js';
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orders.js';

const router = Router();

// GET /orders - Listar pedidos con filtros
router.get('/', validateInput(schemas.order.list), getOrders);

// POST /orders - Crear pedido
router.post('/', validateInput(schemas.order.create), createOrder);

// GET /orders/:id - Obtener pedido por ID
router.get('/:id', validateInput(schemas.order.get), getOrderById);

// PATCH /orders/:id - Actualizar estado del pedido
router.patch('/:id', validateInput(schemas.order.update), updateOrderStatus);

export default router;
