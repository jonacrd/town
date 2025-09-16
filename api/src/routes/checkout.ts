import { Router } from 'express';
import { checkout } from '../controllers/checkout.js';

const router = Router();

// POST /checkout - Crear pedido con beneficios
router.post('/', checkout);

export default router;
