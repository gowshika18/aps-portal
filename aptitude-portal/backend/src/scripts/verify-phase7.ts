import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function runValidation() {
  console.log('=== PHASE 7 SYSTEM VERIFICATION ===\n');

  // 1. Exact structure check
  const topicsCount = await prisma.topic.count();
  const testsCount = await prisma.test.count();
  const questionsCount = await prisma.question.count();

  console.log(`Topics Count: ${topicsCount} (Expected: 35)`);
  console.log(`Tests Count: ${testsCount} (Expected: 105)`);
  console.log(`Questions Count: ${questionsCount} (Expected: 2100)`);

  const topics = await prisma.topic.findMany({
    include: {
      tests: {
        include: {
          questions: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  let validTopicsCount = 0;
  let invalidQuestions = 0;
  let duplicateQuestions = 0;
  let missingQuestions = 0;
  let misclassifiedQuestions = 0;

  const topicResults: Array<{
    name: string;
    t1: number;
    t2: number;
    t3: number;
    status: 'PASS' | 'FAIL';
  }> = [];

  const seenTexts = new Set<string>();

  for (const topic of topics) {
    let t1Count = 0;
    let t2Count = 0;
    let t3Count = 0;

    for (const test of topic.tests) {
      if (test.testNumber === 1) t1Count = test.questions.length;
      if (test.testNumber === 2) t2Count = test.questions.length;
      if (test.testNumber === 3) t3Count = test.questions.length;

      for (const q of test.questions) {
        // Question quality check
        const cleanText = (q.questionText || '').trim().toLowerCase();
        if (cleanText) {
          if (seenTexts.has(cleanText)) {
            duplicateQuestions++;
          } else {
            seenTexts.add(cleanText);
          }
        } else {
          invalidQuestions++;
        }

        let isInvalid = false;
        if (!q.questionText || q.questionText.trim().length === 0) isInvalid = true;
        if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) isInvalid = true;
        if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) isInvalid = true;
        if (q.marks !== 1) isInvalid = true;
        if (!q.explanation || q.explanation.trim().length === 0) isInvalid = true;

        if (isInvalid) invalidQuestions++;

        // Misclassified check (test.topicId should equal topic.id)
        if (test.topicId !== topic.id) misclassifiedQuestions++;
      }
    }

    const isTopicPass = t1Count === 20 && t2Count === 20 && t3Count === 20;
    if (isTopicPass) validTopicsCount++;

    topicResults.push({
      name: topic.name,
      t1: t1Count,
      t2: t2Count,
      t3: t3Count,
      status: isTopicPass ? 'PASS' : 'FAIL',
    });
  }

  missingQuestions = 2100 - questionsCount;

  console.log('--- TOPIC VALIDATION ---');
  for (const tr of topicResults) {
    console.log(`${tr.name}`);
    console.log(`Test 1: ${tr.t1}/20`);
    console.log(`Test 2: ${tr.t2}/20`);
    console.log(`Test 3: ${tr.t3}/20`);
    console.log(`Status: ${tr.status}\n`);
  }

  console.log('--- FINAL QUESTION-BANK REPORT ---');
  console.log(`Total Topics: ${topicsCount}`);
  console.log(`Total Tests: ${testsCount}`);
  console.log(`Total Questions: ${questionsCount}`);
  console.log(`Valid Questions: ${questionsCount - invalidQuestions - duplicateQuestions}`);
  console.log(`Invalid Questions: ${invalidQuestions}`);
  console.log(`Duplicate Questions: ${duplicateQuestions}`);
  console.log(`Missing Questions: ${missingQuestions}`);
  console.log(`Misclassified Questions: ${misclassifiedQuestions}`);

  await prisma.$disconnect();
}

runValidation().catch((err) => {
  console.error('Validation error:', err);
  prisma.$disconnect();
});
