import { prisma } from '../src/utils/prisma';

async function checkAll() {
  const topics = await prisma.topic.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      tests: {
        orderBy: { testNumber: 'asc' },
        include: {
          questions: true,
        },
      },
    },
  });

  console.log('Total Topics in DB:', topics.length);
  let totalTests = 0;
  let totalQuestions = 0;
  const invalidTests: string[] = [];

  for (const t of topics) {
    totalTests += t.tests.length;
    if (t.tests.length !== 3) {
      invalidTests.push(`Topic ${t.name} (ID: ${t.id}) has ${t.tests.length} tests instead of 3`);
    }
    for (const test of t.tests) {
      totalQuestions += test.questions.length;
      if (test.questions.length !== 20) {
        invalidTests.push(`Test ${test.title} (ID: ${test.id}) in Topic ${t.name} has ${test.questions.length} questions instead of 20`);
      }
    }
  }

  console.log('Total Tests in DB:', totalTests);
  console.log('Total Questions in DB:', totalQuestions);
  console.log('Invalid Tests Count:', invalidTests.length);
  if (invalidTests.length > 0) {
    console.log('Errors:', invalidTests);
  }
}

checkAll().catch(console.error).finally(() => prisma.$disconnect());
