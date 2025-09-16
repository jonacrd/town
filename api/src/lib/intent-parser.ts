import { logger } from './logger.js';

// Tipos para las intenciones
export type Intent = 
  | 'PRICE' 
  | 'STOCK' 
  | 'PAYMENT' 
  | 'DELIVERY' 
  | 'MENU' 
  | 'HELP' 
  | 'PRODUCT_SEARCH'
  | 'GREETING'
  | 'UNKNOWN';

export interface ParsedMessage {
  intent: Intent;
  keywords: string[];
  originalText: string;
  normalizedText: string;
  confidence: number;
}

// Patrones regex para cada intención
const INTENT_PATTERNS: Record<Exclude<Intent, 'UNKNOWN' | 'PRODUCT_SEARCH'>, RegExp[]> = {
  PRICE: [
    /\b(precio|cuánto|cuanto|cuesta|vale|valor|\$|pesos?|cop)\b/i,
    /\b(qué.*precio|cuál.*precio|precio.*de)\b/i,
  ],
  STOCK: [
    /\b(stock|queda|quedan|disponible|disponibles|hay|tienen)\b/i,
    /\b(cuánto.*queda|cuanto.*queda|qué.*hay|que.*hay)\b/i,
  ],
  PAYMENT: [
    /\b(pago|pagos?|pagar|transfer|transferencia|efectivo|cash|dinero)\b/i,
    /\b(cómo.*pago|como.*pago|formas.*pago|métodos.*pago)\b/i,
  ],
  DELIVERY: [
    /\b(delivery|envío|envio|entrega|domicilio|llevar|traer)\b/i,
    /\b(cuánto.*envío|cuanto.*envio|costo.*envío|precio.*envío)\b/i,
  ],
  MENU: [
    /\b(menú|menu|carta|catálogo|catalogo|categoría|categoria|categorias|productos?)\b/i,
    /\b(qué.*tienen|que.*tienen|qué.*venden|que.*venden|mostrar.*todo)\b/i,
  ],
  HELP: [
    /\b(ayuda|help|auxilio|asistencia|soporte)\b/i,
    /\b(cómo.*funciona|como.*funciona|qué.*puedo|que.*puedo)\b/i,
  ],
  GREETING: [
    /\b(hola|buenas?|buenos?|saludos?|hey|hi|hello)\b/i,
    /\b(buenos.*días|buenas.*tardes|buenas.*noches|buen.*día)\b/i,
  ],
};

// Palabras comunes a filtrar (stop words)
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'en', 'con', 'por', 'para', 'a', 'al',
  'y', 'o', 'pero', 'si', 'no', 'que', 'qué', 'como', 'cómo',
  'es', 'son', 'está', 'están', 'hay', 'tiene', 'tienen',
  'me', 'te', 'se', 'nos', 'les', 'le', 'lo', 'la',
  'quiero', 'quiere', 'queremos', 'quieren',
  'busco', 'busca', 'buscamos', 'buscan',
]);

/**
 * Extrae keywords del texto eliminando stop words y normalizando
 */
function extractKeywords(text: string): string[] {
  const normalizedText = text
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, ' ') // Remover puntuación pero mantener acentos
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalizedText.split(' ');
  
  // Filtrar stop words y palabras muy cortas
  const keywords = words
    .filter(word => word.length >= 2)
    .filter(word => !STOP_WORDS.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remover números puros

  // Combinar palabras adyacentes para frases de 2-3 palabras
  const phrases: string[] = [];
  for (let i = 0; i < keywords.length - 1; i++) {
    if (keywords[i].length >= 3 && keywords[i + 1].length >= 3) {
      phrases.push(`${keywords[i]} ${keywords[i + 1]}`);
    }
    if (i < keywords.length - 2 && keywords[i].length >= 3) {
      phrases.push(`${keywords[i]} ${keywords[i + 1]} ${keywords[i + 2]}`);
    }
  }

  // Retornar keywords únicos + frases, ordenados por longitud (más específicos primero)
  const allKeywords = [...new Set([...phrases, ...keywords])];
  return allKeywords.sort((a, b) => b.length - a.length);
}

/**
 * Detecta la intención principal del mensaje
 */
function detectIntent(text: string): { intent: Intent; confidence: number } {
  const normalizedText = text.toLowerCase();
  
  // Verificar cada patrón de intención
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        // Calcular confianza basada en la longitud del match vs texto total
        const confidence = Math.min(0.9, matches[0].length / normalizedText.length + 0.3);
        return { intent: intent as Intent, confidence };
      }
    }
  }

  // Si no se encuentra intención específica, verificar si hay keywords de productos
  const keywords = extractKeywords(text);
  if (keywords.length > 0) {
    return { intent: 'PRODUCT_SEARCH', confidence: 0.6 };
  }

  return { intent: 'UNKNOWN', confidence: 0.1 };
}

/**
 * Parser principal que analiza el mensaje completo
 */
export function parseMessage(text: string): ParsedMessage {
  const normalizedText = text.toLowerCase().trim();
  const keywords = extractKeywords(text);
  const { intent, confidence } = detectIntent(text);

  const result: ParsedMessage = {
    intent,
    keywords,
    originalText: text,
    normalizedText,
    confidence,
  };

  logger.debug('Message parsed', {
    intent: result.intent,
    keywordCount: keywords.length,
    confidence: confidence,
    // No logear el texto completo por privacidad
  });

  return result;
}

/**
 * Genera respuestas contextuales basadas en la intención
 */
export function generateContextualResponse(intent: Intent, keywords: string[]): string {
  switch (intent) {
    case 'GREETING':
      return '¡Hola! 👋 Bienvenido a Town. Te puedo ayudar a encontrar productos, consultar precios, stock y más. ¿Qué buscas hoy?';
    
    case 'HELP':
      return `¡Estoy aquí para ayudarte! 🤖

Puedes preguntarme sobre:
• 💰 *Precios* - "¿Cuánto cuesta la pizza?"
• 📦 *Stock* - "¿Hay empanadas disponibles?"
• 💳 *Pagos* - "¿Cómo puedo pagar?"
• 🚚 *Entregas* - "¿Hacen delivery?"
• 📋 *Menú* - "¿Qué productos tienen?"

Solo escribe lo que buscas y te ayudo a encontrarlo.`;
    
    case 'MENU':
      return '📋 Te muestro nuestro catálogo de productos disponibles. Aquí tienes las categorías principales:';
    
    case 'PAYMENT':
      return `💳 *Métodos de pago disponibles:*

• 💵 Efectivo (al recibir)
• 💸 Transferencia bancaria
• 📱 Pago móvil

¿Hay algún producto específico que te interese? Te ayudo a hacer el pedido.`;
    
    case 'DELIVERY':
      return `🚚 *Información de entregas:*

• Delivery disponible en la zona
• Tiempo estimado: 30-45 minutos
• Costo según ubicación

¿Me das tu dirección para calcular el costo exacto?`;
    
    case 'PRICE':
      if (keywords.length > 0) {
        return `💰 Te ayudo a consultar precios. Buscando información sobre: *${keywords[0]}*...`;
      }
      return '💰 ¿De qué producto quieres saber el precio? Escribe el nombre y te doy la información.';
    
    case 'STOCK':
      if (keywords.length > 0) {
        return `📦 Consultando disponibilidad de: *${keywords[0]}*...`;
      }
      return '📦 ¿De qué producto quieres saber la disponibilidad? Escribe el nombre y verifico el stock.';
    
    case 'PRODUCT_SEARCH':
      if (keywords.length > 0) {
        return `🔍 Buscando productos relacionados con: *${keywords.slice(0, 2).join(', ')}*...`;
      }
      return '🔍 ¿Qué producto buscas? Escribe el nombre y te muestro las opciones disponibles.';
    
    default:
      return `No entendí bien tu mensaje. 🤔

Puedes preguntarme sobre:
• Precios de productos
• Stock disponible  
• Métodos de pago
• Información de delivery
• Ver el menú completo

¿En qué te puedo ayudar?`;
  }
}

/**
 * Valida si un mensaje es spam o irrelevante
 */
export function isSpamMessage(text: string): boolean {
  const normalizedText = text.toLowerCase();
  
  // Patrones de spam comunes
  const spamPatterns = [
    /\b(viagra|casino|lottery|winner|congratulations)\b/i,
    /\b(click.*here|visit.*now|limited.*time)\b/i,
    /\$\$\$|💰💰💰|🎰/,
    /(.)\1{10,}/, // Caracteres repetidos más de 10 veces
  ];
  
  // Texto muy corto o muy largo
  if (normalizedText.length < 2 || normalizedText.length > 500) {
    return true;
  }
  
  // Verificar patrones de spam
  return spamPatterns.some(pattern => pattern.test(normalizedText));
}

/**
 * Extrae números de teléfono del texto
 */
export function extractPhoneNumbers(text: string): string[] {
  const phonePattern = /(\+?[1-9]\d{1,14}|\+?[1-9]\d{0,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4})/g;
  const matches = text.match(phonePattern) || [];
  
  return matches
    .filter(match => match.replace(/\D/g, '').length >= 7) // Al menos 7 dígitos
    .map(match => match.replace(/[\s\-]/g, '')); // Limpiar espacios y guiones
}
