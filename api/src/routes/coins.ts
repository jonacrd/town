import { Router } from 'express';
import { getCoinBalance } from '../controllers/coins.js';

const router = Router();

// GET /coins/balance?userId=xxx - Obtener balance de TownCoins
router.get('/balance', getCoinBalance);

export default router;
