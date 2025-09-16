import { Router } from 'express';
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
router.get('/webhook/whatsapp', verifyWebhook);

/**
 * POST /webhook/whatsapp - Recibir mensajes de WhatsApp
 * Este endpoint recibe los mensajes tanto de Twilio como de Meta
 */
router.post('/webhook/whatsapp', handleIncomingMessage);

/**
 * POST /webhook/whatsapp/test - Testing manual (solo desarrollo)
 * Permite probar el procesamiento de mensajes sin usar WhatsApp real
 */
router.post('/webhook/whatsapp/test', testMessage);

export default router;
