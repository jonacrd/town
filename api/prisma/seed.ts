import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Limpiar datos existentes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios
  const users = await prisma.user.createMany({
    data: [
      {
        phone: '+57300123456',
        name: 'Juan Pérez',
        role: 'SELLER',
      },
      {
        phone: '+57301234567',
        name: 'María García',
        role: 'SELLER',
      },
      {
        phone: '+57302345678',
        name: 'Carlos López',
        role: 'CUSTOMER',
      },
      {
        phone: '+57303456789',
        name: 'Ana Rodríguez',
        role: 'CUSTOMER',
      },
    ],
  });

  // Obtener usuarios creados
  const createdUsers = await prisma.user.findMany();
  const sellerUsers = createdUsers.filter(u => u.role === 'SELLER');
  const customerUsers = createdUsers.filter(u => u.role === 'CUSTOMER');

  // Crear sellers
  const sellers = await prisma.seller.createMany({
    data: [
      {
        userId: sellerUsers[0].id,
        storeName: 'TechStore Pro',
        tower: 'Torre A',
      },
      {
        userId: sellerUsers[1].id,
        storeName: 'Fashion Boutique',
        tower: 'Torre B',
      },
    ],
  });

  const createdSellers = await prisma.seller.findMany();

  // Crear 10 productos demo
  const products = await prisma.product.createMany({
    data: [
      {
        sellerId: createdSellers[0].id,
        title: 'iPhone 14 Pro Max 256GB',
        description: 'iPhone 14 Pro Max de 256GB en excelente estado. Incluye cargador original y caja.',
        priceCents: 450000000, // $4,500,000
        stock: 3,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
        category: 'Tecnología',
      },
      {
        sellerId: createdSellers[0].id,
        title: 'MacBook Air M2 13" 512GB',
        description: 'MacBook Air con chip M2, pantalla de 13 pulgadas y 512GB de almacenamiento SSD.',
        priceCents: 520000000, // $5,200,000
        stock: 1,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop',
        category: 'Tecnología',
      },
      {
        sellerId: createdSellers[0].id,
        title: 'iPad Air 5ta Gen 256GB',
        description: 'iPad Air de 5ta generación con chip M1 y 256GB de almacenamiento.',
        priceCents: 280000000, // $2,800,000
        stock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop',
        category: 'Tecnología',
      },
      {
        sellerId: createdSellers[1].id,
        title: 'Nike Air Force 1 Blancas',
        description: 'Zapatillas Nike Air Force 1 clásicas en color blanco, talla disponible.',
        priceCents: 35000000, // $350,000
        stock: 8,
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
        category: 'Ropa',
      },
      {
        sellerId: createdSellers[1].id,
        title: 'Jeans Levi\'s 501 Original',
        description: 'Jeans Levi\'s 501 original fit, 100% algodón, disponible en varias tallas.',
        priceCents: 18000000, // $180,000
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
        category: 'Ropa',
      },
      {
        sellerId: createdSellers[0].id,
        title: 'Cafetera Espresso Delonghi',
        description: 'Cafetera espresso automática DeLonghi con molinillo integrado.',
        priceCents: 28000000, // $280,000
        stock: 0, // Agotado
        imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
        category: 'Hogar',
      },
      {
        sellerId: createdSellers[1].id,
        title: 'Bicicleta MTB Specialized',
        description: 'Bicicleta de montaña Specialized con suspensión delantera y 21 velocidades.',
        priceCents: 180000000, // $1,800,000
        stock: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
        category: 'Deportes',
      },
      {
        sellerId: createdSellers[0].id,
        title: 'Libro "El Arte de la Guerra"',
        description: 'Libro clásico de estrategia militar de Sun Tzu, edición en español.',
        priceCents: 4500000, // $45,000
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop',
        category: 'Libros',
      },
      {
        sellerId: createdSellers[1].id,
        title: 'Perfume Chanel No. 5',
        description: 'Perfume Chanel No. 5 Eau de Parfum 100ml, original y sellado.',
        priceCents: 45000000, // $450,000
        stock: 4,
        imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop',
        category: 'Belleza',
      },
      {
        sellerId: createdSellers[0].id,
        title: 'Auriculares Sony WH-1000XM4',
        description: 'Auriculares inalámbricos Sony con cancelación de ruido activa.',
        priceCents: 85000000, // $850,000
        stock: 6,
        imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop',
        category: 'Tecnología',
      },
    ],
  });

  // Crear algunos pedidos de ejemplo
  const createdProducts = await prisma.product.findMany();
  
  const orders = await prisma.order.createMany({
    data: [
      {
        userId: customerUsers[0].id,
        status: 'PENDING',
        payment: 'CASH',
        totalCents: 89500000, // $895,000
        address: 'Calle 123 #45-67, Bogotá',
        note: 'Entregar en la portería',
      },
      {
        userId: customerUsers[1].id,
        status: 'PAID',
        payment: 'TRANSFER',
        totalCents: 35000000, // $350,000
        address: 'Carrera 7 #12-34, Medellín',
      },
    ],
  });

  const createdOrders = await prisma.order.findMany();

  // Crear items de pedido
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: createdOrders[0].id,
        productId: createdProducts[3].id, // Nike Air Force
        qty: 2,
        priceCents: 35000000,
      },
      {
        orderId: createdOrders[0].id,
        productId: createdProducts[7].id, // Libro
        qty: 1,
        priceCents: 4500000,
      },
      {
        orderId: createdOrders[1].id,
        productId: createdProducts[3].id, // Nike Air Force
        qty: 1,
        priceCents: 35000000,
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${createdUsers.length} users`);
  console.log(`   - ${createdSellers.length} sellers`);
  console.log(`   - ${createdProducts.length} products`);
  console.log(`   - ${createdOrders.length} orders`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });