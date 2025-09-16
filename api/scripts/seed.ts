import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting custom seed...');

  try {
    // 1. Crear User CUSTOMER demo
    const customerUser = await prisma.user.create({
      data: {
        phone: '+56900000000',
        name: 'Cliente Demo',
        role: 'CUSTOMER',
      },
    });
    console.log(`✅ Created CUSTOMER user with ID: ${customerUser.id}`);

    // 2. Crear User SELLER demo
    const sellerUser = await prisma.user.create({
      data: {
        phone: '+56900000001',
        name: 'Vendedor Empanadas',
        role: 'SELLER',
      },
    });
    console.log(`✅ Created SELLER user with ID: ${sellerUser.id}`);

    // 3. Crear Seller asociado
    const seller = await prisma.seller.create({
      data: {
        userId: sellerUser.id,
        storeName: 'Súper Empanadas',
        tower: 'A',
      },
    });
    console.log(`✅ Created Seller with ID: ${seller.id} (Store: ${seller.storeName})`);

    // 4. Crear 10 productos variados de comida
    const products = [
      {
        title: 'Empanada de Pino',
        priceCents: 250000, // $2,500
        stock: 50,
        category: 'comida',
      },
      {
        title: 'Empanada de Queso',
        priceCents: 220000, // $2,200
        stock: 40,
        category: 'comida',
      },
      {
        title: 'Empanada de Pollo',
        priceCents: 280000, // $2,800
        stock: 35,
        category: 'comida',
      },
      {
        title: 'Empanada de Camarón',
        priceCents: 350000, // $3,500
        stock: 20,
        category: 'comida',
      },
      {
        title: 'Empanada Vegetariana',
        priceCents: 260000, // $2,600
        stock: 30,
        category: 'comida',
      },
      {
        title: 'Empanada de Jamón y Queso',
        priceCents: 300000, // $3,000
        stock: 25,
        category: 'comida',
      },
      {
        title: 'Empanada de Mariscos',
        priceCents: 400000, // $4,000
        stock: 15,
        category: 'comida',
      },
      {
        title: 'Empanada Dulce de Manjar',
        priceCents: 180000, // $1,800
        stock: 60,
        category: 'comida',
      },
      {
        title: 'Empanada de Champiñones',
        priceCents: 290000, // $2,900
        stock: 20,
        category: 'comida',
      },
      {
        title: 'Empanada Especial de la Casa',
        priceCents: 450000, // $4,500
        stock: 10,
        category: 'comida',
      },
    ];

    console.log('🥟 Creating empanadas...');
    const createdProducts = [];

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const product = await prisma.product.create({
        data: {
          sellerId: seller.id,
          title: productData.title,
          description: `Deliciosa ${productData.title.toLowerCase()} hecha con ingredientes frescos y masa casera.`,
          priceCents: productData.priceCents,
          stock: productData.stock,
          imageUrl: `https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=Empanada+${i + 1}`,
          category: productData.category,
          active: true,
        },
      });

      createdProducts.push(product);
      console.log(`   📦 Product ${i + 1}: ${product.title} (ID: ${product.id}) - Stock: ${product.stock}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Customer User ID: ${customerUser.id}`);
    console.log(`   👨‍💼 Seller User ID: ${sellerUser.id}`);
    console.log(`   🏪 Seller ID: ${seller.id}`);
    console.log(`   🥟 Products created: ${createdProducts.length}`);
    console.log('\n📋 Product IDs:');
    createdProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title}: ${product.id}`);
    });

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  });
