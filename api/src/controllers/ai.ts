import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

interface FeedRequest {
  userId: string;
  query: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  category: string;
  country: string;
}

// Función para llamar a OpenAI (mock o real)
async function generateAIResponse(query: string, products: Product[]): Promise<string> {
  const aiProvider = process.env.AI_PROVIDER || 'mock';
  
  if (aiProvider === 'mock' || !process.env.AI_OPENAI_API_KEY) {
    // Respuesta mock basada en la consulta
    const mockResponses = {
      'barato': `¡Perfecto! He encontrado los productos más económicos para ti. Aquí tienes opciones que cuidan tu presupuesto sin sacrificar calidad.`,
      'comida': `¡Excelente elección! He seleccionado una variedad de productos alimenticios frescos y de calidad para satisfacer tus necesidades.`,
      'ropa': `¡Genial! He encontrado las mejores opciones de vestimenta que combinan estilo, comodidad y buen precio.`,
      'popular': `¡Buena elección! Estos son los productos más populares y mejor valorados por nuestra comunidad.`,
      'default': `¡Hola! He encontrado productos que podrían interesarte basándome en tu búsqueda. Echa un vistazo a estas opciones seleccionadas especialmente para ti.`
    };
    
    const lowerQuery = query.toLowerCase();
    let response = mockResponses.default;
    
    for (const [keyword, mockResponse] of Object.entries(mockResponses)) {
      if (keyword !== 'default' && lowerQuery.includes(keyword)) {
        response = mockResponse;
        break;
      }
    }
    
    return `MOCK IA: ${response}`;
  }
  
  // TODO: Implementar llamada real a OpenAI
  try {
    // Aquí iría la llamada a OpenAI con los facts de los productos
    const facts = products.map(p => 
      `${p.title}: ${p.description}, Precio: $${(p.priceCents / 100).toLocaleString()}, Stock: ${p.stock}, Categoría: ${p.category}`
    ).join('\n');
    
    // Por ahora devolvemos mock hasta implementar OpenAI
    return `IA: Basándome en tu consulta "${query}", he seleccionado estos productos que mejor se adaptan a lo que buscas.`;
    
  } catch (error) {
    logger.error(error, 'Error calling OpenAI');
    return `He encontrado algunos productos que podrían interesarte basándome en tu búsqueda.`;
  }
}

// Función para buscar productos basándose en la query
async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  const lowerQuery = query.toLowerCase();
  
  // Determinar criterios de búsqueda y ordenamiento
  let orderBy: any = { createdAt: 'desc' }; // Por defecto, más recientes
  let where: any = {
    active: true,
    stock: { gt: 0 }
  };
  
  // Búsqueda por texto en título o descripción
  if (query.trim()) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } }
    ];
  }
  
  // Modificar ordenamiento basado en keywords
  if (lowerQuery.includes('barato') || lowerQuery.includes('económico') || lowerQuery.includes('precio')) {
    orderBy = { priceCents: 'asc' };
  } else if (lowerQuery.includes('popular') || lowerQuery.includes('vendido') || lowerQuery.includes('mejor')) {
    // Simular popularidad con un join a OrderItem (productos más vendidos)
    // Por ahora usaremos orden aleatorio para simular popularidad
    orderBy = { createdAt: 'desc' };
  } else if (lowerQuery.includes('nuevo') || lowerQuery.includes('reciente')) {
    orderBy = { createdAt: 'desc' };
  }
  
  // Filtrar por categoría si se menciona
  const categories = ['abarrotes', 'charcuteria', 'ropa', 'fast-food'];
  for (const category of categories) {
    if (lowerQuery.includes(category)) {
      where.category = category;
      break;
    }
  }
  
  // Filtrar por país si se menciona
  if (lowerQuery.includes('chile') || lowerQuery.includes('chileno')) {
    where.country = 'Chile';
  } else if (lowerQuery.includes('venezuela') || lowerQuery.includes('venezolano')) {
    where.country = 'Venezuela';
  }
  
  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      seller: {
        include: {
          user: {
            select: { name: true, phone: true }
          }
        }
      }
    }
  });
  
  return products.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    priceCents: p.priceCents,
    stock: p.stock,
    imageUrl: p.imageUrl || '',
    category: p.category || '',
    country: p.country || ''
  }));
}

// POST /ai/feed - Feed de IA con recomendaciones
export const aiFeed = async (req: Request, res: Response) => {
  try {
    const { userId, query }: FeedRequest = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Si no hay query, mostrar productos destacados
    const searchQuery = query?.trim() || 'destacados';
    
    // Buscar productos
    const products = await searchProducts(searchQuery, 12);
    
    // Generar respuesta de IA
    const aiAnswer = await generateAIResponse(searchQuery, products);
    
    logger.info({ 
      userId, 
      query: searchQuery, 
      productsFound: products.length 
    }, 'AI feed request processed');

    res.json({
      success: true,
      data: {
        answer: aiAnswer,
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: Math.floor(p.priceCents / 100), // Convertir a pesos
          priceCents: p.priceCents,
          stock: p.stock,
          imageUrl: p.imageUrl,
          category: p.category,
          country: p.country
        }))
      }
    });

  } catch (error) {
    logger.error(error, 'Error in AI feed');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
