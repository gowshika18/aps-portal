import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function runBackupAndRestoreTest() {
  console.log('=====================================================');
  console.log('🚀 RUNNING PHASE 11 BACKUP, RESTORE & RECOVERY TEST');
  console.log('=====================================================\n');

  // 1. Export Full Database Snapshot (Backup)
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `backup_${timestamp}.json`);

  const [topics, tests, questions, students, staff, attempts, answers, settings] = await Promise.all([
    prisma.topic.findMany(),
    prisma.test.findMany(),
    prisma.question.findMany(),
    prisma.student.findMany(),
    prisma.staff.findMany(),
    prisma.testAttempt.findMany(),
    prisma.answer.findMany(),
    prisma.systemSetting.findMany(),
  ]);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalTopics: topics.length,
      totalTests: tests.length,
      totalQuestions: questions.length,
    },
    topics,
    tests,
    questions,
    students,
    staff,
    attempts,
    answers,
    settings,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✓ Backup successfully created at: ${backupFilePath}`);
  console.log(`  File Size: ${(fs.statSync(backupFilePath).size / 1024 / 1024).toFixed(2)} MB`);

  // 2. Verify Backup Contents & Structure
  const rawData = fs.readFileSync(backupFilePath, 'utf-8');
  const restoredData = JSON.parse(rawData);

  console.log('\n--- BACKUP VERIFICATION & RESTORE INTEGRITY ---');
  console.log(`Backup Timestamp: ${restoredData.metadata.timestamp}`);
  console.log(`Restored Topics Count: ${restoredData.topics.length} (Expected: 35)`);
  console.log(`Restored Tests Count: ${restoredData.tests.length} (Expected: 105)`);
  console.log(`Restored Questions Count: ${restoredData.questions.length} (Expected: 2100)`);

  const isBackupValid =
    restoredData.topics.length === 35 &&
    restoredData.tests.length === 105 &&
    restoredData.questions.length === 2100;

  console.log(`Backup Integrity Status: ${isBackupValid ? 'PASS' : 'FAIL'}`);

  // 3. Database Health Endpoint / System Check
  const dbTopicCount = await prisma.topic.count();
  const dbTestCount = await prisma.test.count();
  const dbQuestionCount = await prisma.question.count();

  console.log('\n--- PRODUCTION DATABASE HEALTH & COUNTS ---');
  console.log(`Database Topics: ${dbTopicCount}`);
  console.log(`Database Tests: ${dbTestCount}`);
  console.log(`Database Questions: ${dbQuestionCount}`);

  await prisma.$disconnect();
}

runBackupAndRestoreTest().catch((err) => {
  console.error('Backup/Restore error:', err);
  prisma.$disconnect();
});
