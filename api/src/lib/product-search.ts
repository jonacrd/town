import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { env } from './env.js';

export interface ProductSearchResult {
  id: string;
  title: string;
  description?: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  seller: {
    storeName: string;
    tower?: string;
    user: {
      phone: string;
      name?: string;
    };
  };
  relevanceScore: number;
}

export interface ProductSearchOptions {
  limit?: number;
  includeOutOfStock?: boolean;
  categoryFilter?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Busca productos por keywords usando búsqueda fuzzy
 */
export async function searchProducts(
  keywords: string[],
  options: ProductSearchOptions = {}
): Promise<ProductSearchResult[]> {
  const {
    limit = 5,
    includeOutOfStock = false,
    categoryFilter,
    minPrice,
    maxPrice
  } = options;

  try {
    if (keywords.length === 0) {
      return [];
    }

    // Construir consulta de búsqueda
    const searchConditions = keywords.map(keyword => ({
      OR: [
        {
          title: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
        {
          category: {
            contains: keyword,
            mode: 'insensitive' as const,
          },
        },
      ],
    }));

    // Filtros adicionales
    const filters: any = {
      active: true,
      AND: searchConditions,
    };

    if (!includeOutOfStock) {
      filters.stock = { gt: 0 };
    }

    if (categoryFilter) {
      filters.category = {
        contains: categoryFilter,
        mode: 'insensitive',
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.priceCents = {};
      if (minPrice !== undefined) filters.priceCents.gte = minPrice;
      if (maxPrice !== undefined) filters.priceCents.lte = maxPrice;
    }

    // Ejecutar búsqueda
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        seller: {
          include: {
            user: {
              select: {
                phone: true,
                name: true,
              },
            },
          },
        },
      },
      take: limit * 2, // Tomar más para poder calcular relevancia y filtrar
      orderBy: [
        { stock: 'desc' }, // Priorizar productos con stock
        { createdAt: 'desc' }, // Más recientes primero
      ],
    });

    // Calcular relevancia y ordenar
    const productsWithRelevance = products.map(product => ({
      ...product,
      relevanceScore: calculateRelevanceScore(product, keywords),
    }));

    // Ordenar por relevancia y tomar solo los mejores
    const sortedProducts = productsWithRelevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    logger.info('Product search completed', {
      keywords: keywords.slice(0, 3), // Solo primeros 3 keywords para logs
      resultCount: sortedProducts.length,
      filters: Object.keys(filters).length,
    });

    return sortedProducts;
  } catch (error) {
    logger.error('Error searching products', {
      error: error.message,
      keywords: keywords.slice(0, 3),
    });
    return [];
  }
}

/**
 * Calcula un score de relevancia para un producto basado en keywords
 */
function calculateRelevanceScore(product: any, keywords: string[]): number {
  let score = 0;
  const title = product.title.toLowerCase();
  const description = (product.description || '').toLowerCase();
  const category = (product.category || '').toLowerCase();

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Coincidencia exacta en título (peso alto)
    if (title.includes(keywordLower)) {
      score += 10;
      
      // Bonus si está al inicio del título
      if (title.startsWith(keywordLower)) {
        score += 5;
      }
    }
    
    // Coincidencia en descripción (peso medio)
    if (description.includes(keywordLower)) {
      score += 5;
    }
    
    // Coincidencia en categoría (peso medio)
    if (category.includes(keywordLower)) {
      score += 3;
    }
  }

  // Bonus por stock disponible
  if (product.stock > 0) {
    score += 2;
  }

  // Bonus por stock alto
  if (product.stock > 10) {
    score += 1;
  }

  return score;
}

/**
 * Obtiene productos por categoría
 */
export async function getProductsByCategory(
  category: string,
  limit: number = 10
): Promise<ProductSearchResult[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        category: {
          contains: category,
          mode: 'insensitive',
        },
        stock: { gt: 0 },
      },
      include: {
        seller: {
          include: {
            user: {
              select: {
                phone: true,
                name: true,
              },
            },
          },
        },
      },
      take: limit,
      orderBy: [
        { stock: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return products.map(product => ({
      ...product,
      relevanceScore: 5, // Score base para productos por categoría
    }));
  } catch (error) {
    logger.error('Error getting products by category', {
      error: error.message,
      category,
    });
    return [];
  }
}

/**
 * Obtiene todas las categorías disponibles
 */
export async function getAvailableCategories(): Promise<string[]> {
  try {
    const categories = await prisma.product.findMany({
      where: {
        active: true,
        stock: { gt: 0 },
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories
      .map(p => p.category)
      .filter(Boolean)
      .sort();
  } catch (error) {
    logger.error('Error getting categories', { error: error.message });
    return [];
  }
}

/**
 * Formatea un producto para mostrar en WhatsApp
 */
export function formatProductForWhatsApp(product: ProductSearchResult): string {
  const price = (product.priceCents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });

  const stockText = product.stock > 0 
    ? `(stock: ${product.stock})` 
    : '(agotado)';

  const link = `${env.APP_BASE_URL}/product/${product.id}`;

  let message = `*${product.title}* - ${price} ${stockText}`;
  
  if (product.description && product.description.length < 100) {
    message += `\n${product.description}`;
  }
  
  message += `\n🔗 Ver más: ${link}`;
  
  return message;
}

/**
 * Genera respuesta completa de búsqueda para WhatsApp
 */
export async function generateSearchResponse(
  keywords: string[],
  intent: string,
  options: ProductSearchOptions = {}
): Promise<string> {
  const products = await searchProducts(keywords, { ...options, limit: 3 });
  
  if (products.length === 0) {
    const categories = await getAvailableCategories();
    const categoryList = categories.slice(0, 5).join(', ');
    
    return `🔍 No encontré productos con "${keywords.join(' ')}"

¿Te interesa alguna de estas categorías?
📋 ${categoryList}

O escribe *menú* para ver todo el catálogo.`;
  }

  let response = `🔍 Encontré ${products.length} producto${products.length > 1 ? 's' : ''}:\n\n`;
  
  products.forEach((product, index) => {
    response += `${index + 1}. ${formatProductForWhatsApp(product)}\n\n`;
  });

  // Agregar información de pago y contacto
  response += `💳 *Pagos:* Efectivo o transferencia\n`;
  response += `📱 ¿Quieres reservar alguno? ¡Solo dime cuál te interesa!`;

  return response;
}
