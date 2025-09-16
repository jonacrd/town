import { prisma } from '../src/lib/prisma.js';

async function seedMinimal() {
  console.log('🌱 Iniciando seed mínimo...');

  try {
    // Verificar si ya hay productos
    const existingProducts = await prisma.product.count();
    if (existingProducts > 0) {
      console.log(`✅ Ya hay ${existingProducts} productos en la base de datos. Seed omitido.`);
      return;
    }

    // Crear usuario vendedor demo
    const demoUser = await prisma.user.upsert({
      where: { phone: '+56900000000' },
      update: {},
      create: {
        phone: '+56900000000',
        name: 'Vendedor Demo',
        role: 'SELLER'
      }
    });

    console.log('✅ Usuario demo creado/encontrado:', demoUser.id);

    // Crear seller demo
    const demoSeller = await prisma.seller.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        storeName: 'Tienda Demo Town',
        tower: 'A'
      }
    });

    console.log('✅ Seller demo creado/encontrado:', demoSeller.id);

    // Productos demo
    const demoProducts = [
      {
        id: 'demo_1',
        title: 'Empanadas de Pino (6 unidades)',
        description: 'Deliciosas empanadas caseras de pino, preparadas con carne, cebolla, huevo duro y aceitunas.',
        priceCents: 450000, // $4.500 CLP
        stock: 12,
        category: 'comida',
        country: 'Chile',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_2',
        title: 'Arepas Venezolanas (4 unidades)',
        description: 'Arepas tradicionales venezolanas, perfectas para rellenar con tus ingredientes favoritos.',
        priceCents: 320000, // $3.200 CLP
        stock: 8,
        category: 'comida',
        country: 'Venezuela',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_3',
        title: 'Completos Italianos (2 unidades)',
        description: 'Completos chilenos con palta, tomate y mayonesa. Un clásico irresistible.',
        priceCents: 280000, // $2.800 CLP
        stock: 15,
        category: 'fast-food',
        country: 'Chile',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_4',
        title: 'Tequeños (12 unidades)',
        description: 'Crujientes tequeños venezolanos rellenos de queso blanco, perfectos para compartir.',
        priceCents: 380000, // $3.800 CLP
        stock: 6,
        category: 'fast-food',
        country: 'Venezuela',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_5',
        title: 'Camiseta Básica Algodón',
        description: 'Camiseta cómoda de algodón 100%, disponible en varios colores.',
        priceCents: 1200000, // $12.000 CLP
        stock: 20,
        category: 'ropa',
        country: 'Chile',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_6',
        title: 'Café Colombiano Premium 250g',
        description: 'Café colombiano de origen, tostado artesanalmente para un sabor excepcional.',
        priceCents: 850000, // $8.500 CLP
        stock: 25,
        category: 'abarrotes',
        country: 'Venezuela',
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_7',
        title: 'Hamburguesa Completa',
        description: 'Hamburguesa artesanal con carne, queso, palta, tomate y papas fritas.',
        priceCents: 650000, // $6.500 CLP
        stock: 10,
        category: 'fast-food',
        country: 'Chile',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
        active: true
      },
      {
        id: 'demo_8',
        title: 'Cachapas con Queso (2 unidades)',
        description: 'Deliciosas cachapas venezolanas de maíz tierno con queso de mano.',
        priceCents: 420000, // $4.200 CLP
        stock: 7,
        category: 'comida',
        country: 'Venezuela',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
        active: true
      }
    ];

    // Crear productos demo
    for (const productData of demoProducts) {
      await prisma.product.upsert({
        where: { id: productData.id },
        update: {},
        create: {
          ...productData,
          sellerId: demoSeller.id
        }
      });
    }

    console.log(`✅ ${demoProducts.length} productos demo creados`);
    console.log('🎉 Seed mínimo completado exitosamente');

  } catch (error) {
    console.error('❌ Error en seed mínimo:', error);
    throw error;
  }
}

// Ejecutar seed y salir
seedMinimal()
  .then(() => {
    console.log('✅ Seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  });