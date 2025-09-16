import { Router } from 'express';
import { aiFeed } from '../controllers/ai.js';

const router = Router();

// POST /ai/feed - Feed de IA con recomendaciones
router.post('/feed', aiFeed);

export default router;
