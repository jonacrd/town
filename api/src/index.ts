import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';

const app = express();

// Logger simple
const logger = pino({ 
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' 
});
app.use(pinoHttp({ logger }));

// Middleware básico
app.use(express.json());

// CORS
const allow = (process.env.ALLOW_ORIGIN || 'http://localhost:4321,http://localhost:4322').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allow.length ? allow : true, credentials: true }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Auth endpoint
app.post('/auth/whatsapp', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'phone requerido' });
  }
  
  // Simular creación de usuario
  const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  logger.info({ phone, name, userId }, 'Usuario registrado via WhatsApp');
  
  res.json({ userId });
});

// Products endpoint - Mock data
app.get('/api/products', (req, res) => {
  const mockProducts = [
    {
      id: 'prod_1',
      title: 'Empanadas de Pino (6 unidades)',
      description: 'Deliciosas empanadas caseras de pino, preparadas con carne, cebolla, huevo duro y aceitunas.',
      priceCents: 450000, // $4.500 CLP
      stock: 12,
      category: 'comida',
      country: 'Chile',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
      active: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 'seller_1',
        storeName: 'Cocina de la Abuela',
        user: {
          name: 'María González',
          phone: '+56912345678'
        }
      }
    },
    {
      id: 'prod_2',
      title: 'Arepas Venezolanas (4 unidades)',
      description: 'Arepas tradicionales venezolanas, perfectas para rellenar con tus ingredientes favoritos.',
      priceCents: 320000, // $3.200 CLP
      stock: 8,
      category: 'comida',
      country: 'Venezuela',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
      active: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 'seller_2',
        storeName: 'Sabores de Venezuela',
        user: {
          name: 'Carlos Rodríguez',
          phone: '+56987654321'
        }
      }
    },
    {
      id: 'prod_3',
      title: 'Completos Italianos (2 unidades)',
      description: 'Completos chilenos con palta, tomate y mayonesa. Un clásico irresistible.',
      priceCents: 280000, // $2.800 CLP
      stock: 15,
      category: 'fast-food',
      country: 'Chile',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
      active: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 'seller_3',
        storeName: 'Completos Don Juan',
        user: {
          name: 'Juan Pérez',
          phone: '+56911111111'
        }
      }
    },
    {
      id: 'prod_4',
      title: 'Tequeños (12 unidades)',
      description: 'Crujientes tequeños venezolanos rellenos de queso blanco, perfectos para compartir.',
      priceCents: 380000, // $3.800 CLP
      stock: 6,
      category: 'fast-food',
      country: 'Venezuela',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
      active: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 'seller_2',
        storeName: 'Sabores de Venezuela',
        user: {
          name: 'Carlos Rodríguez',
          phone: '+56987654321'
        }
      }
    },
    {
      id: 'prod_5',
      title: 'Camiseta Básica Algodón',
      description: 'Camiseta cómoda de algodón 100%, disponible en varios colores.',
      priceCents: 1200000, // $12.000 CLP
      stock: 20,
      category: 'ropa',
      country: 'Chile',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      active: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 'seller_4',
        storeName: 'Moda Casual',
        user: {
          name: 'Ana Silva',
          phone: '+56922222222'
        }
      }
    },
    {
      id: 'prod_6',
      title: 'Café Colombiano Premium 250g',
      description: 'Café colombiano de origen, tostado artesanalmente para un sabor excepcional.',
      priceCents: 850000, // $8.500 CLP
      stock: 25,
      category: 'abarrotes',
      country: 'Venezuela',
      imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
      active: true,
      createdAt: new Date().toISOString(),
      seller: {
        id: 'seller_5',
        storeName: 'Café & Más',
        user: {
          name: 'Luis Morales',
          phone: '+56933333333'
        }
      }
    }
  ];
  
  // Filtrar por parámetros si existen
  let filteredProducts = mockProducts;
  
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(p => p.category === req.query.category);
  }
  
  if (req.query.query) {
    const searchTerm = (req.query.query as string).toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(searchTerm) || 
      p.description.toLowerCase().includes(searchTerm)
    );
  }
  
  if (req.query.active === 'true') {
    filteredProducts = filteredProducts.filter(p => p.active);
  }
  
  logger.info({ count: filteredProducts.length, filters: req.query }, 'Productos solicitados');
  
  // Siempre devolver 200, incluso si está vacío
  res.json(filteredProducts);
});

// AI Feed endpoint
app.post('/ai/feed', (req, res) => {
  const { userId, query } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId requerido' });
  }
  
  const searchQuery = query || 'productos destacados';
  
  // Respuesta mock de IA
  const aiResponses = {
    'barato': '¡Perfecto! He encontrado los productos más económicos para ti. Estas opciones cuidan tu presupuesto sin sacrificar calidad.',
    'comida': '¡Excelente elección! He seleccionado una variedad de productos alimenticios frescos y de calidad.',
    'venezolano': '¡Genial! Aquí tienes auténticos sabores venezolanos que te harán sentir como en casa.',
    'chileno': '¡Buena elección! Productos típicos chilenos con el sabor tradicional que buscas.',
    'default': '¡Hola! He encontrado productos que podrían interesarte. Echa un vistazo a estas recomendaciones especiales.'
  };
  
  const lowerQuery = searchQuery.toLowerCase();
  let aiAnswer = aiResponses.default;
  
  for (const [keyword, response] of Object.entries(aiResponses)) {
    if (keyword !== 'default' && lowerQuery.includes(keyword)) {
      aiAnswer = response;
      break;
    }
  }
  
  // Simular productos recomendados (usar los primeros 4)
  const recommendedProducts = [
    {
      id: 'prod_1',
      title: 'Empanadas de Pino (6 unidades)',
      description: 'Deliciosas empanadas caseras de pino',
      price: 4500,
      priceCents: 450000,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
      category: 'comida',
      country: 'Chile'
    },
    {
      id: 'prod_2',
      title: 'Arepas Venezolanas (4 unidades)',
      description: 'Arepas tradicionales venezolanas',
      price: 3200,
      priceCents: 320000,
      stock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
      category: 'comida',
      country: 'Venezuela'
    },
    {
      id: 'prod_3',
      title: 'Completos Italianos (2 unidades)',
      description: 'Completos chilenos con palta, tomate y mayonesa',
      price: 2800,
      priceCents: 280000,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
      category: 'fast-food',
      country: 'Chile'
    },
    {
      id: 'prod_4',
      title: 'Tequeños (12 unidades)',
      description: 'Crujientes tequeños venezolanos rellenos de queso',
      price: 3800,
      priceCents: 380000,
      stock: 6,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
      category: 'fast-food',
      country: 'Venezuela'
    }
  ];
  
  logger.info({ userId, query: searchQuery }, 'AI Feed solicitado');
  
  res.json({
    success: true,
    data: {
      answer: `MOCK IA: ${aiAnswer}`,
      products: recommendedProducts
    }
  });
});

// Coins balance endpoint
app.get('/coins/balance', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId requerido' });
  }
  
  // Mock balance
  const mockBalance = 150; // TownCoins
  
  logger.info({ userId, balance: mockBalance }, 'Balance de coins solicitado');
  
  res.json({
    success: true,
    data: {
      userId,
      balance: mockBalance,
      transactions: [
        { id: '1', coins: 100, reason: 'first_purchase', createdAt: new Date().toISOString() },
        { id: '2', coins: 50, reason: 'daily_bonus', createdAt: new Date().toISOString() }
      ]
    }
  });
});

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error(err);
  const msg = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
  res.status(err.status || 500).json({ error: msg });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => logger.info(`API listening on :${port}`));