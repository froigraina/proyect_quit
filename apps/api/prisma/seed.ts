import { PrismaClient } from '@prisma/client';
import { defaultAchievements } from '../src/modules/shared/defaults';

const prisma = new PrismaClient();

async function main() {
  for (const achievement of defaultAchievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`Seed completed with ${defaultAchievements.length} achievements`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
