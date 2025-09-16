import { Router } from 'express';
import { healthCheck } from '../controllers/health.js';

const router = Router();

// GET /health
router.get('/', healthCheck);

export default router;
