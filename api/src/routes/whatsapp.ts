import { Router } from 'express';
import { validateInput } from '../middleware/error.js';
import { schemas } from '../schemas/validation.js';
import { env } from '../lib/env.js';
import { 
  verifyWebhook, 
  handleIncomingMessage, 
  testMessage 
} from '../controllers/whatsapp.js';

const router = Router();

/**
 * GET /webhook/whatsapp - Verificación del webhook (Meta)
 * Este endpoint se usa para verificar el webhook con Meta
 */
router.get('/', validateInput(schemas.whatsapp.verify), verifyWebhook);

/**
 * POST /webhook/whatsapp - Recibir mensajes de WhatsApp
 * Este endpoint recibe los mensajes tanto de Twilio como de Meta
 * Rate limiting aplicado en index.ts
 */
router.post('/', validateInput(schemas.whatsapp.webhook), handleIncomingMessage);

/**
 * POST /webhook/whatsapp/test - Testing manual (solo desarrollo)
 * Permite probar el procesamiento de mensajes sin usar WhatsApp real
 */
if (env.NODE_ENV === 'development') {
  router.post('/test', testMessage);
}

export default router;
