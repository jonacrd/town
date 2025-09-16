import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de productos chilenos y venezolanos
const productCategories = {
  'abarrotes': [
    'Arroz blanco 1kg', 'Frijoles negros 500g', 'Lentejas 500g', 'Pasta espagueti 500g',
    'Aceite vegetal 1L', 'Azúcar blanca 1kg', 'Sal marina 500g', 'Harina de trigo 1kg',
    'Avena en hojuelas 500g', 'Quinoa 500g', 'Café molido 250g', 'Té negro 20 bolsas',
    'Leche condensada 397g', 'Atún en agua 185g', 'Sardinas en aceite 125g', 'Mermelada fresa 300g'
  ],
  'charcuteria': [
    'Jamón de pavo 200g', 'Queso manchego 250g', 'Chorizo español 150g', 'Salchichón 200g',
    'Mortadela italiana 150g', 'Queso fresco 300g', 'Jamón serrano 100g', 'Tocino ahumado 200g',
    'Queso gouda 200g', 'Paté de hígado 125g', 'Salami milano 150g', 'Queso crema 200g'
  ],
  'ropa': [
    'Camiseta básica algodón', 'Jeans clásicos azules', 'Sudadera con capucha', 'Camisa formal blanca',
    'Vestido casual verano', 'Pantalón deportivo', 'Blusa manga larga', 'Short de mezclilla',
    'Falda midi negra', 'Chaqueta de cuero', 'Zapatos deportivos', 'Sandalias cómodas'
  ],
  'fast-food': [
    'Hamburguesa clásica', 'Pizza margherita', 'Hot dog completo', 'Empanada de pino',
    'Arepa reina pepiada', 'Tequeños 6 unidades', 'Cachapa con queso', 'Patacón con carne',
    'Completo italiano', 'Sopaipillas 4 unidades', 'Churros con dulce de leche', 'Alfajor de manjar'
  ]
};

const countries = ['Chile', 'Venezuela'];

// Imágenes placeholder por categoría
const placeholderImages = {
  'abarrotes': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'charcuteria': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
  'ropa': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
  'fast-food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop'
};

// Función para generar precio aleatorio por categoría
function generatePrice(category: string): number {
  const priceRanges = {
    'abarrotes': [500, 5000], // $500 - $5.000 CLP
    'charcuteria': [1000, 8000], // $1.000 - $8.000 CLP
    'ropa': [5000, 50000], // $5.000 - $50.000 CLP
    'fast-food': [1500, 6000] // $1.500 - $6.000 CLP
  };
  
  const [min, max] = priceRanges[category] || [1000, 5000];
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Función para generar stock aleatorio
function generateStock(): number {
  return Math.floor(Math.random() * 50) + 1; // 1-50 unidades
}

// Función para generar descripción
function generateDescription(title: string, category: string, country: string): string {
  const descriptions = {
    'abarrotes': `${title} de alta calidad, producto básico para tu despensa. Origen: ${country}.`,
    'charcuteria': `Delicioso ${title.toLowerCase()}, perfecto para tus comidas. Producto ${country === 'Chile' ? 'chileno' : 'venezolano'}.`,
    'ropa': `${title} de excelente calidad y diseño moderno. Estilo ${country === 'Chile' ? 'chileno' : 'venezolano'}.`,
    'fast-food': `Sabroso ${title.toLowerCase()}, preparado al estilo ${country === 'Chile' ? 'chileno' : 'venezolano'}.`
  };
  
  return descriptions[category] || `${title} - Producto de calidad de ${country}.`;
}

async function createDefaultSeller() {
  // Crear usuario vendedor por defecto
  const defaultUser = await prisma.user.upsert({
    where: { phone: '+56900000000' },
    update: {},
    create: {
      phone: '+56900000000',
      name: 'Tienda Central',
      role: 'SELLER'
    }
  });

  // Crear vendedor por defecto
  const defaultSeller = await prisma.seller.upsert({
    where: { userId: defaultUser.id },
    update: {},
    create: {
      userId: defaultUser.id,
      storeName: 'Tienda Central',
      tower: 'Torre Principal'
    }
  });

  return defaultSeller;
}

async function seedProducts() {
  console.log('🌱 Iniciando seed de productos...');

  try {
    // Crear vendedor por defecto
    const defaultSeller = await createDefaultSeller();
    console.log('✅ Vendedor por defecto creado');

    let totalProducts = 0;

    // Generar productos por categoría
    for (const [category, products] of Object.entries(productCategories)) {
      console.log(`📦 Creando productos de ${category}...`);
      
      for (const productName of products) {
        // Crear variaciones para diferentes países
        for (const country of countries) {
          // Crear múltiples variaciones del mismo producto
          const variations = Math.floor(Math.random() * 3) + 1; // 1-3 variaciones
          
          for (let i = 0; i < variations; i++) {
            const variation = i > 0 ? ` - Variedad ${i + 1}` : '';
            const title = `${productName}${variation}`;
            
            await prisma.product.create({
              data: {
                sellerId: defaultSeller.id,
                title,
                description: generateDescription(title, category, country),
                priceCents: generatePrice(category) * 100, // Convertir a centavos
                stock: generateStock(),
                category,
                country,
                imageUrl: placeholderImages[category],
                active: true
              }
            });
            
            totalProducts++;
          }
        }
      }
    }

    // Crear productos adicionales para llegar a 500
    const remainingProducts = 500 - totalProducts;
    if (remainingProducts > 0) {
      console.log(`📦 Creando ${remainingProducts} productos adicionales...`);
      
      const additionalProducts = [
        'Producto especial', 'Oferta del día', 'Artículo popular', 'Item destacado',
        'Producto premium', 'Edición limitada', 'Combo familiar', 'Pack ahorro'
      ];
      
      for (let i = 0; i < remainingProducts; i++) {
        const categories = Object.keys(productCategories);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        const baseName = additionalProducts[Math.floor(Math.random() * additionalProducts.length)];
        const title = `${baseName} ${i + 1}`;
        
        await prisma.product.create({
          data: {
            sellerId: defaultSeller.id,
            title,
            description: generateDescription(title, randomCategory, randomCountry),
            priceCents: generatePrice(randomCategory) * 100,
            stock: generateStock(),
            category: randomCategory,
            country: randomCountry,
            imageUrl: placeholderImages[randomCategory],
            active: true
          }
        });
        
        totalProducts++;
      }
    }

    console.log(`🎉 Seed completado! ${totalProducts} productos creados.`);
    
    // Mostrar estadísticas
    const stats = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true }
    });
    
    console.log('\n📊 Estadísticas por categoría:');
    stats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat._count.id} productos`);
    });

  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  }
}

async function main() {
  await seedProducts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
