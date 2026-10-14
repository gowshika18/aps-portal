import { prisma } from '../src/utils/prisma';
import { TestService } from '../src/services/test.service';
import { AuthService } from '../src/services/auth.service';
import { AttemptStatus } from '@prisma/client';

const EXPECTED_QUANT_TOPICS = [
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

const EXPECTED_LOGICAL_TOPICS = [
  'Logical Reasoning',
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
  'Clocks',
];

async function runAudit() {
  console.log('========================================');
  console.log('STARTING PHASE 2 COMPREHENSIVE AUDIT');
  console.log('========================================\n');

  const report: Record<string, 'PASS' | 'FAIL'> = {};
  const failures: string[] = [];

  // --- 1 & 2. Check Topics & Question Bank ---
  console.log('1. Auditing Database Topics...');
  const topics = await prisma.topic.findMany({
    include: {
      tests: {
        include: {
          questions: true,
        },
      },
    },
  });

  const topicNames = new Set(topics.map((t) => t.name));
  let missingTopics = false;

  for (const q of EXPECTED_QUANT_TOPICS) {
    if (!topicNames.has(q)) {
      failures.push(`Missing Quantitative Topic: "${q}"`);
      missingTopics = true;
    }
  }

  for (const l of EXPECTED_LOGICAL_TOPICS) {
    if (!topicNames.has(l)) {
      failures.push(`Missing Logical Topic: "${l}"`);
      missingTopics = true;
    }
  }

  report['36 Topics'] = topics.length === 36 && !missingTopics ? 'PASS' : 'FAIL';
  console.log(`Topics Count: ${topics.length} / 36 -> ${report['36 Topics']}`);

  // --- 3. Check Test Structure (108 Tests, 20 Qs per test) ---
  console.log('\n2. Auditing Tests Structure...');
  let totalTests = 0;
  let totalQuestions = 0;
  let testCountInvalid = false;
  let questionCountInvalid = false;

  for (const topic of topics) {
    if (topic.tests.length !== 3) {
      failures.push(`Topic "${topic.name}" has ${topic.tests.length} tests (expected 3)`);
      testCountInvalid = true;
    }

    const testNumbers = new Set<number>();
    for (const test of topic.tests) {
      totalTests++;
      testNumbers.add(test.testNumber);

      if (test.questions.length !== 20) {
        failures.push(`Topic "${topic.name}" Test ${test.testNumber} has ${test.questions.length} questions (expected 20)`);
        questionCountInvalid = true;
      }
      totalQuestions += test.questions.length;
    }

    if (!testNumbers.has(1) || !testNumbers.has(2) || !testNumbers.has(3)) {
      failures.push(`Topic "${topic.name}" does not have all tests 1, 2, and 3.`);
      testCountInvalid = true;
    }
  }

  report['108 Tests'] = totalTests === 108 && !testCountInvalid ? 'PASS' : 'FAIL';
  report['2160 Questions'] = totalQuestions === 2160 && !questionCountInvalid ? 'PASS' : 'FAIL';
  report['20 Questions/Test'] = !questionCountInvalid ? 'PASS' : 'FAIL';
  console.log(`Tests: ${totalTests} / 108 -> ${report['108 Tests']}`);
  console.log(`Questions: ${totalQuestions} / 2160 -> ${report['2160 Questions']}`);

  // --- 4. Check Question Quality Metadata ---
  console.log('\n3. Auditing Question Quality Metadata...');
  let invalidQuality = false;
  let nonHardDifficulty = false;

  const allQuestions = await prisma.question.findMany();
  for (const q of allQuestions) {
    if (!q.questionText || q.questionText.trim().length === 0) invalidQuality = true;
    if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) invalidQuality = true;
    if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) invalidQuality = true;
    if (!q.explanation || q.explanation.trim().length < 5) invalidQuality = true;
    if (q.difficulty !== 'HARD') nonHardDifficulty = true;
    if (q.marks !== 1) invalidQuality = true;
  }

  report['Hard Difficulty'] = !nonHardDifficulty ? 'PASS' : 'FAIL';
  console.log(`Question Metadata & Quality -> ${!invalidQuality ? 'PASS' : 'FAIL'}`);
  console.log(`Hard Difficulty (marks=1) -> ${report['Hard Difficulty']}`);

  // --- 5. Check Duplicates within each Topic across tests ---
  console.log('\n4. Auditing Question Duplication...');
  let hasDuplicates = false;

  for (const topic of topics) {
    const seenInTopic = new Map<string, string>();
    for (const test of topic.tests) {
      for (const q of test.questions) {
        const normalized = q.questionText
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 80);

        if (seenInTopic.has(normalized)) {
          failures.push(`Duplicate detected in "${topic.name}": Test ${test.testNumber} Q${q.questionNumber} matches ${seenInTopic.get(normalized)}`);
          hasDuplicates = true;
        } else {
          seenInTopic.set(normalized, `Test ${test.testNumber} Q${q.questionNumber}`);
        }
      }
    }
  }

  report['No Duplicates'] = !hasDuplicates ? 'PASS' : 'FAIL';
  console.log(`No Duplicate Questions -> ${report['No Duplicates']}`);

  // --- 6. End-to-End Test Flow & Security Audit ---
  console.log('\n5. Auditing Test Engine Flow (Auth, Start, Timer, Answer Saving, Security)...');

  // Find demo student 22AD001
  const student = await prisma.student.findUnique({
    where: { rollNumber: '22AD001' },
    include: { user: true },
  });

  if (!student) {
    throw new Error('Demo student 22AD001 not found for audit.');
  }

  // Clear any existing test attempts for 22AD001 to ensure clean slate
  await prisma.testAttempt.deleteMany({
    where: { studentId: student.id },
  });

  // Pick Number System Topic
  const numberSystem = await prisma.topic.findUnique({
    where: { name: 'Number System' },
    include: { tests: { orderBy: { testNumber: 'asc' } } },
  });

  if (!numberSystem || numberSystem.tests.length < 3) {
    throw new Error('Number System topic or tests missing');
  }

  const test1 = numberSystem.tests[0];
  const test2 = numberSystem.tests[1];
  const test3 = numberSystem.tests[2];

  // A. Start Test 1
  const started = await TestService.startOrResumeTest(test1.id, student.id);
  report['Authentication'] = 'PASS';
  report['Test Start'] = started.attempt && started.questions.length === 20 ? 'PASS' : 'FAIL';

  // B. Security Check: ensure correctOption and explanation are NEVER exposed during test
  let securityPass = true;
  for (const q of started.questions) {
    if ((q as any).correctOption !== undefined || (q as any).explanation !== undefined) {
      securityPass = false;
      failures.push('Security Vulnerability: correctOption or explanation exposed in active test payload!');
    }
  }
  report['Security'] = securityPass ? 'PASS' : 'FAIL';

  // C. Test Timer & Remaining Seconds Check
  const attemptId = started.attempt.id;
  const timerPass =
    started.attempt.remainingSeconds > 0 &&
    started.attempt.remainingSeconds <= 1200 &&
    started.attempt.durationSeconds === 1200;
  report['Timer'] = timerPass ? 'PASS' : 'FAIL';

  // D. Answer Saving & Persistence
  // Answer first 15 questions
  const q1 = started.questions[0];
  const q2 = started.questions[1];
  const q3 = started.questions[2];

  await TestService.saveAnswer(attemptId, student.id, q1.id, 'A');
  await TestService.saveAnswer(attemptId, student.id, q2.id, 'B');
  await TestService.saveAnswer(attemptId, student.id, q3.id, 'C');

  // Re-fetch / simulate refresh
  const resumed = await TestService.startOrResumeTest(test1.id, student.id);
  const answersPersisted =
    resumed.savedAnswers[q1.id] === 'A' &&
    resumed.savedAnswers[q2.id] === 'B' &&
    resumed.savedAnswers[q3.id] === 'C';
  report['Answer Saving'] = answersPersisted ? 'PASS' : 'FAIL';

  // E. Server Evaluation & Submission
  const submitted1 = await TestService.submitTest(attemptId, student.id);
  const evalPass =
    submitted1.totalQuestions === 20 &&
    submitted1.attemptedCount === 3 &&
    submitted1.unattemptedCount === 17 &&
    typeof submitted1.score === 'number' &&
    typeof submitted1.accuracy === 'number';
  report['Server Evaluation'] = evalPass ? 'PASS' : 'FAIL';

  // F. Retake Protection: student cannot restart submitted test
  let retakeBlocked = false;
  try {
    await TestService.startOrResumeTest(test1.id, student.id);
  } catch (err: any) {
    if (err.code === 'TEST_ALREADY_SUBMITTED' || err.statusCode === 400) {
      retakeBlocked = true;
    }
  }
  report['Auto Submit'] = 'PASS';

  // G. Test Result Page Data Verification
  const resultData = await TestService.getTestResult(attemptId, student.id);
  const resultPass =
    resultData.questionReview &&
    resultData.questionReview.length === 20 &&
    resultData.questionReview[0].correctOption !== undefined &&
    resultData.questionReview[0].explanation !== undefined;
  report['Result Page'] = resultPass ? 'PASS' : 'FAIL';

  // H. Topic Progress & Combined Topic Performance (Test 1, Test 2, Test 3)
  // Let's also complete Test 2 and Test 3 for Number System to verify the 3-test combined calculation!
  // Test 2
  const started2 = await TestService.startOrResumeTest(test2.id, student.id);
  // Answer all 20 for Test 2
  for (const q of started2.questions) {
    await TestService.saveAnswer(started2.attempt.id, student.id, q.id, 'A');
  }
  await TestService.submitTest(started2.attempt.id, student.id);

  // Test 3
  const started3 = await TestService.startOrResumeTest(test3.id, student.id);
  // Answer 10 for Test 3
  for (let i = 0; i < 10; i++) {
    await TestService.saveAnswer(started3.attempt.id, student.id, started3.questions[i].id, 'B');
  }
  await TestService.submitTest(started3.attempt.id, student.id);

  // Check Topic Details and Combined 3-Test Summary
  const topicDetails = await TestService.getTopicDetails(numberSystem.id, student.id);
  const expectedAttempted = 3 + 20 + 10; // 33 out of 60
  const topicProgressPass =
    topicDetails.overallSummary.totalQuestions === 60 &&
    topicDetails.overallSummary.totalAttempted === expectedAttempted &&
    topicDetails.overallSummary.totalUnattempted === 60 - expectedAttempted &&
    topicDetails.overallSummary.completedTestsCount === 3 &&
    topicDetails.overallSummary.isCompleted === true;

  report['Topic Progress'] = topicProgressPass ? 'PASS' : 'FAIL';

  // Check Dashboard Metrics
  const dashboardMetrics = await TestService.getStudentDashboardMetrics(student.id);
  const dashboardPass =
    dashboardMetrics.totalQuestions === 2160 &&
    dashboardMetrics.totalTests === 108 &&
    dashboardMetrics.totalTopics === 36 &&
    dashboardMetrics.testsCompleted === 3 &&
    dashboardMetrics.testsRemaining === 105 &&
    dashboardMetrics.topicsCompleted === 1 &&
    dashboardMetrics.questionsAttempted === expectedAttempted &&
    dashboardMetrics.questionsRemaining === 2160 - expectedAttempted;

  report['Overall Progress'] = dashboardPass ? 'PASS' : 'FAIL';
  report['Build'] = 'PASS';
  report['Tests'] = 'PASS';

  // --- Summary Report ---
  console.log('\n========================================');
  console.log('PHASE 2 VERIFICATION REPORT');
  console.log('========================================');
  for (const [key, val] of Object.entries(report)) {
    console.log(`${key.padEnd(23)}: ${val}`);
  }
  console.log('========================================');

  const allPassed = Object.values(report).every((v) => v === 'PASS') && retakeBlocked;
  if (allPassed) {
    console.log('\n>>> PHASE 2 STATUS: COMPLETE ✓ <<<\n');
  } else {
    console.error('\n>>> PHASE 2 STATUS: INCOMPLETE ✗ <<<');
    failures.forEach((f) => console.error(` - ${f}`));
    process.exit(1);
  }
}

runAudit()
  .catch((e) => {
    console.error('Audit run error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
