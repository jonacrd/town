// scripts/seed-min.ts
import { prisma } from '../src/lib/prisma.js';

async function run(){
  const user = await prisma.user.upsert({
    where: { phone: '+56900000000' },
    update: {},
    create: { phone: '+56900000000', name: 'Demo', role: 'SELLER' }
  });
  
  const seller = await prisma.seller.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, storeName: 'Almacén Demo', tower: 'A' }
  });
  
  for (let i=1;i<=8;i++){
    await prisma.product.upsert({
      where:{ id:`demo${i}` },
      update:{},
      create:{
        id:`demo${i}`,
        sellerId: seller.id,
        title: `Producto Demo ${i}`,
        priceCents: 1000 * i,
        stock: 10 + i,
        category: i%2? 'comida':'hogar',
        imageUrl: null,
        active: true
      }
    });
  }
  
  console.log('✅ Seed mínimo completado - 8 productos demo creados');
}

run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
