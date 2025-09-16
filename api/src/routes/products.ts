import { Router } from 'express';
import { validateInput } from '../middleware/error.js';
import { schemas } from '../schemas/validation.js';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from '../controllers/products.js';

const router = Router();

// GET /products - Listar productos con filtros
router.get('/', validateInput(schemas.product.list), getProducts);

// POST /products - Crear producto (seller)
router.post('/', validateInput(schemas.product.create), createProduct);

// GET /products/:id - Obtener producto por ID
router.get('/:id', validateInput(schemas.product.get), getProductById);

// PATCH /products/:id - Actualizar producto
router.patch('/:id', validateInput(schemas.product.update), updateProduct);

// DELETE /products/:id - Desactivar producto
router.delete('/:id', validateInput(schemas.product.delete), deleteProduct);

export default router;
