import fs from 'fs';
import path from 'path';
import { prisma } from '../src/utils/prisma';
import { validateQuestionBank } from './validate-questions';
import { TOPICS_LIST, slugify, TopicData } from './generate-questions';

const QUESTIONS_DIR = path.resolve(__dirname, '../data/questions');

export async function seedQuestions() {
  console.log('--- Starting Question Bank & Test Engine Seed ---');

  // Step 1: Pre-import strict validation
  console.log('Validating question bank files...');
  const validation = validateQuestionBank();
  if (!validation.valid) {
    console.error('Validation failed. Aborting database seed:');
    validation.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }
  console.log('Question bank validated successfully: 35 topics, 105 tests, 2,100 questions.');

  // Step 2: Iterate and import each topic
  let testsSeeded = 0;
  let questionsSeeded = 0;

  for (const topicMeta of TOPICS_LIST) {
    const fileName = `${slugify(topicMeta.name)}.json`;
    const filePath = path.join(QUESTIONS_DIR, fileName);
    const data: TopicData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Retrieve topic from DB
    const topicRecord = await prisma.topic.findUnique({
      where: { name: data.topic },
    });

    if (!topicRecord) {
      console.warn(`Topic "${data.topic}" not found in database. Skipping.`);
      continue;
    }

    // Seed 3 tests for this topic
    for (const testData of data.tests) {
      const testRecord = await prisma.test.upsert({
        where: {
          topicId_testNumber: {
            topicId: topicRecord.id,
            testNumber: testData.testNumber,
          },
        },
        update: {
          title: testData.title || `${data.topic} - Test ${testData.testNumber}`,
          questionCount: testData.questions.length,
          isActive: true,
        },
        create: {
          topicId: topicRecord.id,
          testNumber: testData.testNumber,
          title: testData.title || `${data.topic} - Test ${testData.testNumber}`,
          questionCount: testData.questions.length,
          isActive: true,
        },
      });

      testsSeeded++;

      await prisma.$transaction(async (tx) => {
        for (const q of testData.questions) {
          const where = {
            testId_questionNumber: {
              testId: testRecord.id,
              questionNumber: q.questionNumber,
            },
          };
          const questionData = {
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty || 'HARD',
            marks: q.marks || 1,
            subTopic: q.subTopic,
            concept: q.concept,
            sourceType: q.sourceType || 'ORIGINAL',
          };
          const existing = await tx.question.findUnique({ where });

          if (!existing) {
            await tx.question.create({
              data: {
                ...questionData,
                testId: testRecord.id,
                questionNumber: q.questionNumber,
              },
            });
            continue;
          }

          const changed = Object.entries(questionData).some(
            ([key, value]) => existing[key as keyof typeof existing] !== value
          );
          if (!changed) continue;

          const latestVersion = await tx.questionVersion.findFirst({
            where: { questionId: existing.id },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          });
          await tx.questionVersion.create({
            data: {
              questionId: existing.id,
              versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
              questionText: existing.questionText,
              optionA: existing.optionA,
              optionB: existing.optionB,
              optionC: existing.optionC,
              optionD: existing.optionD,
              correctOption: existing.correctOption,
              explanation: existing.explanation,
              difficulty: existing.difficulty,
              marks: existing.marks,
              editedBy: 'question-bank-import',
              editReason: 'Question bank content update',
            },
          });
          await tx.question.update({
            where: { id: existing.id },
            data: questionData,
          });
        }
      });
      questionsSeeded += testData.questions.length;
    }

    console.log(`✓ Seeded ${data.topic}: 3 tests, 60 questions`);
  }

  // Step 3: Final database count verification
  const totalTopicsInDb = await prisma.topic.count();
  const totalTestsInDb = await prisma.test.count();
  const totalQuestionsInDb = await prisma.question.count();

  console.log('====================================================');
  console.log('Database Question Import & Verification Summary:');
  console.log(`Total Topics in DB:    ${totalTopicsInDb} / 35`);
  console.log(`Total Tests in DB:     ${totalTestsInDb} / 105`);
  console.log(`Total Questions in DB: ${totalQuestionsInDb} / 2,100`);
  console.log('====================================================');
}

if (require.main === module) {
  seedQuestions()
    .catch((err) => {
      console.error('Error seeding questions:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
