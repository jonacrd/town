import { Request, Response } from 'express';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';
import { 
  getWhatsAppProvider, 
  parseIncomingMessage, 
  normalizePhoneNumber,
  type WhatsAppMessage 
} from '../lib/whatsapp.js';
import { 
  parseMessage, 
  generateContextualResponse, 
  isSpamMessage,
  type Intent 
} from '../lib/intent-parser.js';
import { 
  searchProducts, 
  getProductsByCategory, 
  getAvailableCategories,
  generateSearchResponse 
} from '../lib/product-search.js';

/**
 * Webhook verification for Meta WhatsApp API
 */
export async function verifyWebhook(req: Request, res: Response) {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('Webhook verification attempt', { 
      mode, 
      tokenProvided: !!token 
    });

    // Verificar token para Meta
    if (env.WHATSAPP_PROVIDER === 'meta') {
      if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
        logger.info('Webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        logger.warn('Webhook verification failed', { 
          expectedToken: !!env.META_VERIFY_TOKEN,
          receivedToken: !!token 
        });
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Para Twilio, no hay verificación específica en GET
    res.status(200).json({ message: 'Webhook endpoint active' });
  } catch (error) {
    logger.error('Error in webhook verification', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Procesa mensajes entrantes de WhatsApp
 */
export async function handleIncomingMessage(req: Request, res: Response) {
  try {
    logger.info('Incoming WhatsApp webhook', { 
      provider: env.WHATSAPP_PROVIDER,
      bodyKeys: Object.keys(req.body)
    });

    // Parsear mensaje según el proveedor
    const incomingMessage = parseIncomingMessage(req.body);
    
    if (!incomingMessage) {
      logger.warn('Could not parse incoming message');
      return res.status(200).json({ message: 'Message ignored' });
    }

    // Validar mensaje
    if (!incomingMessage.from || !incomingMessage.body) {
      logger.warn('Invalid message format', { 
        hasFrom: !!incomingMessage.from,
        hasBody: !!incomingMessage.body 
      });
      return res.status(200).json({ message: 'Invalid message' });
    }

    // Filtrar spam
    if (isSpamMessage(incomingMessage.body)) {
      logger.warn('Spam message detected', { 
        from: incomingMessage.from.replace(/\d(?=\d{4})/g, '*')
      });
      return res.status(200).json({ message: 'Spam filtered' });
    }

    // Normalizar número de teléfono
    const normalizedPhone = normalizePhoneNumber(incomingMessage.from);

    // Log del mensaje (sin contenido completo por privacidad)
    logger.info('Processing WhatsApp message', {
      from: normalizedPhone.replace(/\d(?=\d{4})/g, '*'),
      messageLength: incomingMessage.body.length,
      timestamp: incomingMessage.timestamp,
    });

    // Procesar mensaje en background (no bloquear respuesta del webhook)
    processMessageAsync(incomingMessage, normalizedPhone).catch(error => {
      logger.error('Error in async message processing', { 
        error: error.message,
        from: normalizedPhone.replace(/\d(?=\d{4})/g, '*')
      });
    });

    // Responder inmediatamente al webhook
    res.status(200).json({ message: 'Message received' });

  } catch (error) {
    logger.error('Error handling incoming message', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Procesa el mensaje de forma asíncrona
 */
async function processMessageAsync(message: WhatsAppMessage, phoneNumber: string) {
  try {
    // Parsear intención y keywords
    const parsedMessage = parseMessage(message.body);
    
    logger.debug('Message parsed', {
      intent: parsedMessage.intent,
      keywordCount: parsedMessage.keywords.length,
      confidence: parsedMessage.confidence,
    });

    // Generar respuesta basada en la intención
    let response: string;

    switch (parsedMessage.intent) {
      case 'GREETING':
        response = generateContextualResponse('GREETING', parsedMessage.keywords);
        break;

      case 'HELP':
        response = generateContextualResponse('HELP', parsedMessage.keywords);
        break;

      case 'MENU':
        response = await generateMenuResponse();
        break;

      case 'PAYMENT':
        response = generateContextualResponse('PAYMENT', parsedMessage.keywords);
        break;

      case 'DELIVERY':
        response = generateContextualResponse('DELIVERY', parsedMessage.keywords);
        break;

      case 'PRICE':
      case 'STOCK':
      case 'PRODUCT_SEARCH':
        response = await generateSearchResponse(
          parsedMessage.keywords, 
          parsedMessage.intent,
          { limit: 3, includeOutOfStock: parsedMessage.intent === 'STOCK' }
        );
        break;

      default:
        response = generateContextualResponse('UNKNOWN', parsedMessage.keywords);
        break;
    }

    // Enviar respuesta
    const whatsappProvider = getWhatsAppProvider();
    const result = await whatsappProvider.sendMessage(phoneNumber, response);

    if (result.success) {
      logger.info('Response sent successfully', {
        messageId: result.messageId,
        to: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        intent: parsedMessage.intent,
      });
    } else {
      logger.error('Failed to send response', {
        error: result.error,
        to: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      });
    }

  } catch (error) {
    logger.error('Error in async message processing', {
      error: error.message,
      from: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
    });

    // Intentar enviar mensaje de error genérico
    try {
      const whatsappProvider = getWhatsAppProvider();
      await whatsappProvider.sendMessage(
        phoneNumber,
        'Disculpa, hubo un problema procesando tu mensaje. Por favor intenta de nuevo en unos minutos.'
      );
    } catch (sendError) {
      logger.error('Failed to send error message', { error: sendError.message });
    }
  }
}

/**
 * Genera respuesta del menú completo
 */
async function generateMenuResponse(): Promise<string> {
  try {
    const categories = await getAvailableCategories();
    
    if (categories.length === 0) {
      return 'Lo siento, no tenemos productos disponibles en este momento. 😔\n\nPor favor intenta más tarde.';
    }

    let response = '📋 *Nuestro Menú por Categorías:*\n\n';
    
    for (const category of categories.slice(0, 6)) { // Máximo 6 categorías
      const products = await getProductsByCategory(category, 3);
      
      if (products.length > 0) {
        response += `🏷️ *${category.toUpperCase()}*\n`;
        
        products.forEach(product => {
          const price = (product.priceCents / 100).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
          });
          
          response += `• ${product.title} - ${price}`;
          if (product.stock <= 5) {
            response += ` (¡Últimas ${product.stock}!)`;
          }
          response += '\n';
        });
        
        response += '\n';
      }
    }

    response += '💬 Escribe el nombre de cualquier producto para más información.\n';
    response += '📱 ¿Te interesa algo? ¡Solo dime qué quieres pedir!';

    return response;
  } catch (error) {
    logger.error('Error generating menu response', { error: error.message });
    return 'Error al cargar el menú. Por favor intenta escribiendo el nombre de un producto específico.';
  }
}

/**
 * Endpoint para testing manual (solo en desarrollo)
 */
export async function testMessage(req: Request, res: Response) {
  if (env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { message, phone } = req.body;
    
    if (!message || !phone) {
      return res.status(400).json({ error: 'message and phone are required' });
    }

    const mockMessage: WhatsAppMessage = {
      from: phone,
      body: message,
      timestamp: new Date().toISOString(),
    };

    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Procesar mensaje
    await processMessageAsync(mockMessage, normalizedPhone);
    
    res.json({ message: 'Test message processed' });
  } catch (error) {
    logger.error('Error in test message', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}
