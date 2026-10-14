import dotenv from 'dotenv';
import { PrismaClient, Role, TopicCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

const QUANTITATIVE_TOPICS = [
  'Number System',
  'HCF & LCM',
  'Percentages',
  'Profit & Loss',
  'Ratio & Proportion',
  'Averages',
  'Simple Interest',
  'Compound Interest',
  'Time & Work',
  'Pipes & Cisterns',
  'Time, Speed & Distance',
  'Problems on Trains',
  'Boats & Streams',
  'Mixtures & Alligation',
  'Probability',
  'Permutation & Combination',
  'Algebra',
  'Ages',
  'Data Interpretation',
  'Mensuration',
];

const LOGICAL_TOPICS = [
  'Number Series',
  'Letter Series',
  'Coding & Decoding',
  'Analogy',
  'Odd One Out',
  'Blood Relations',
  'Direction Sense',
  'Syllogism',
  'Seating Arrangement',
  'Puzzles',
  'Statement & Conclusion',
  'Data Sufficiency',
  'Venn Diagrams',
  'Logical Reasoning',
  'Clocks',
];

async function main() {
  console.log('--- Starting Seed: College Placement Aptitude Test Portal ---');

  // Rename existing 'Calendars' topic to 'Logical Reasoning' if it exists
  // (safe in-place rename preserves test attempts and foreign keys)
  const calendarsRow = await prisma.topic.findUnique({ where: { name: 'Calendars' } });
  if (calendarsRow) {
    await prisma.topic.update({
      where: { id: calendarsRow.id },
      data: { name: 'Logical Reasoning' },
    });
    // Also update its test titles
    const calTests = await prisma.test.findMany({ where: { topicId: calendarsRow.id } });
    for (const t of calTests) {
      await prisma.test.update({
        where: { id: t.id },
        data: { title: `Logical Reasoning – Test ${t.testNumber}` },
      });
    }
    console.log('Renamed topic "Calendars" → "Logical Reasoning" (preserving all FK references).');
  }

  // 1. Seed 35 Topics
  console.log('Seeding 35 Topics...');
  let displayOrder = 1;

  for (const name of QUANTITATIVE_TOPICS) {
    await prisma.topic.upsert({
      where: { name },
      update: {
        category: TopicCategory.QUANTITATIVE,
        displayOrder,
        isActive: true,
      },
      create: {
        name,
        category: TopicCategory.QUANTITATIVE,
        displayOrder,
        isActive: true,
      },
    });
    displayOrder++;
  }

  for (const name of LOGICAL_TOPICS) {
    await prisma.topic.upsert({
      where: { name },
      update: {
        category: TopicCategory.LOGICAL,
        displayOrder,
        isActive: true,
      },
      create: {
        name,
        category: TopicCategory.LOGICAL,
        displayOrder,
        isActive: true,
      },
    });
    displayOrder++;
  }
  console.log('All 35 topics seeded successfully.');

  // 2. Production Admin Account
  const staffCount = await prisma.staff.count();
  if (staffCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('PlacementCell2026!', salt);

    const adminUser = await prisma.user.create({
      data: {
        username: 'ADMIN001',
        passwordHash: adminPasswordHash,
        role: Role.STAFF,
        isActive: true,
      },
    });

    await prisma.staff.create({
      data: {
        staffId: 'ADMIN001',
        name: 'Placement Administrator',
        email: 'placement@college.edu',
        department: 'Placement & Career Development Cell',
        userId: adminUser.id,
      },
    });
    console.log('Created Production Admin Account (ADMIN001).');
  }

  console.log('--- Production Database Seed Complete ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
