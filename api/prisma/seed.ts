import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@town.com' },
    update: {},
    create: {
      email: 'admin@town.com',
      name: 'Admin User',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user@town.com' },
    update: {},
    create: {
      email: 'user@town.com',
      name: 'Regular User',
    },
  });

  // Create sample posts
  await prisma.post.upsert({
    where: { id: 'sample-post-1' },
    update: {},
    create: {
      id: 'sample-post-1',
      title: 'Welcome to Town',
      content: 'This is the first post in our Town application.',
      published: true,
      authorId: user1.id,
    },
  });

  await prisma.post.upsert({
    where: { id: 'sample-post-2' },
    update: {},
    create: {
      id: 'sample-post-2',
      title: 'Getting Started',
      content: 'Learn how to use the Town platform effectively.',
      published: false,
      authorId: user2.id,
    },
  });

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
