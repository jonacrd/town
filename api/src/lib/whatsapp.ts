import { env } from './env.js';
import { logger } from './logger.js';

// Interfaces para los proveedores
export interface WhatsAppMessage {
  from: string;
  body: string;
  timestamp?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Clase base para proveedores de WhatsApp
abstract class WhatsAppProvider {
  abstract sendMessage(to: string, message: string): Promise<WhatsAppResponse>;
  abstract verifyWebhook?(signature: string, body: string): boolean;
}

// Implementación para Twilio
class TwilioProvider extends WhatsAppProvider {
  private accountSid: string;
  private authToken: string;
  private from: string;

  constructor() {
    super();
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM) {
      throw new Error('Twilio configuration is incomplete');
    }
    this.accountSid = env.TWILIO_ACCOUNT_SID;
    this.authToken = env.TWILIO_AUTH_TOKEN;
    this.from = env.TWILIO_WHATSAPP_FROM;
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.from,
            To: `whatsapp:${to}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Twilio API error', { status: response.status, error });
        return { success: false, error: `Twilio error: ${response.status}` };
      }

      const data = await response.json();
      logger.info('Message sent via Twilio', { 
        messageId: data.sid,
        to: to.replace(/\d(?=\d{4})/g, '*') // Mask phone number for logs
      });

      return { success: true, messageId: data.sid };
    } catch (error) {
      logger.error('Error sending Twilio message', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// Implementación para Meta (WhatsApp Business API)
class MetaProvider extends WhatsAppProvider {
  private phoneNumberId: string;
  private accessToken: string;
  private verifyToken: string;

  constructor() {
    super();
    if (!env.META_PHONE_NUMBER_ID || !env.META_ACCESS_TOKEN || !env.META_VERIFY_TOKEN) {
      throw new Error('Meta configuration is incomplete');
    }
    this.phoneNumberId = env.META_PHONE_NUMBER_ID;
    this.accessToken = env.META_ACCESS_TOKEN;
    this.verifyToken = env.META_VERIFY_TOKEN;
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to.replace(/^\+/, ''), // Remove + prefix for Meta API
            type: 'text',
            text: {
              body: message,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Meta API error', { status: response.status, error });
        return { success: false, error: `Meta error: ${response.status}` };
      }

      const data = await response.json();
      logger.info('Message sent via Meta', { 
        messageId: data.messages[0]?.id,
        to: to.replace(/\d(?=\d{4})/g, '*') // Mask phone number for logs
      });

      return { success: true, messageId: data.messages[0]?.id };
    } catch (error) {
      logger.error('Error sending Meta message', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  verifyWebhook(signature: string, body: string): boolean {
    // Meta webhook verification logic would go here
    // For now, we'll use a simple token verification
    return signature === this.verifyToken;
  }
}

// Factory para crear el proveedor correcto
function createWhatsAppProvider(): WhatsAppProvider {
  switch (env.WHATSAPP_PROVIDER) {
    case 'twilio':
      return new TwilioProvider();
    case 'meta':
      return new MetaProvider();
    default:
      throw new Error(`Unsupported WhatsApp provider: ${env.WHATSAPP_PROVIDER}`);
  }
}

// Instancia singleton del proveedor
let providerInstance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!providerInstance) {
    providerInstance = createWhatsAppProvider();
  }
  return providerInstance;
}

// Utilidades para parsing de mensajes
export function parseIncomingMessage(body: any): WhatsAppMessage | null {
  try {
    if (env.WHATSAPP_PROVIDER === 'twilio') {
      // Formato de Twilio
      return {
        from: body.From?.replace('whatsapp:', '') || '',
        body: body.Body || '',
        timestamp: new Date().toISOString(),
      };
    } else if (env.WHATSAPP_PROVIDER === 'meta') {
      // Formato de Meta
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      
      if (!message) return null;
      
      return {
        from: message.from || '',
        body: message.text?.body || '',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error parsing incoming WhatsApp message', { error: error.message, body });
    return null;
  }
}

// Normalizar número de teléfono
export function normalizePhoneNumber(phone: string): string {
  // Remover espacios, guiones, paréntesis
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  // Asegurar que empiece con +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}
