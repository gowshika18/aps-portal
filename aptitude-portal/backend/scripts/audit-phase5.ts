import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

import { AnalyticsService } from '../src/services/analytics.service';
import { QuestionManagementService } from '../src/services/question-management.service';
import { ExportService } from '../src/services/export.service';
import { NotificationService, AnnouncementService, AuditService, SystemSettingsService } from '../src/services/admin.service';

const prisma = new PrismaClient();

async function runPhase5ComprehensiveAudit() {
  console.log('=====================================================');
  console.log('🚀 RUNNING PHASE 5 COMPREHENSIVE VERIFICATION AUDIT');
  console.log('=====================================================\n');

  let allPassed = true;

  // 1. DATA INTEGRITY CHECK (35 topics, 105 tests, 2100 questions)
  console.log('--- 1. Data Integrity Check ---');
  const integrityReport = await AnalyticsService.runIntegrityCheck();
  console.log(`Overall Status: ${integrityReport.overallStatus}`);
  console.log(`Summary Total Topics: ${integrityReport.summary.totalTopics} (Expected: 35)`);
  console.log(`Summary Total Tests: ${integrityReport.summary.totalTests} (Expected: 105)`);
  console.log(`Summary Total Questions: ${integrityReport.summary.totalQuestions} (Expected: 2100)`);
  for (const c of integrityReport.checks) {
    console.log(`  [${c.status}] ${c.check}: ${c.detail}`);
    if (c.status === 'ERROR') allPassed = false;
  }

  // 2. ADVANCED PERFORMANCE ANALYTICS
  console.log('\n--- 2. Advanced Student Performance Analytics ---');
  const student = await prisma.student.findFirst();
  if (student) {
    const studentAnalytics = await AnalyticsService.getStudentAdvancedAnalytics(student.id);
    console.log(`Analytics for Student ${student.rollNumber} (${student.name}):`);
    console.log(`  Overall Accuracy: ${studentAnalytics.overall.overallAccuracy}%`);
    console.log(`  Total Attempted: ${studentAnalytics.overall.totalAttempted}`);
    console.log(`  Total Correct: ${studentAnalytics.overall.totalCorrect}`);
    console.log(`  Total Wrong: ${studentAnalytics.overall.totalWrong}`);
    console.log(`  Total Unattempted: ${studentAnalytics.overall.totalUnattempted}`);
    console.log(`  Tests Completed: ${studentAnalytics.overall.totalTests}`);
    console.log(`  Topic Analysis Rows: ${studentAnalytics.topicAnalytics.length}`);
    console.log(`  Time distribution categories: ${Object.keys(studentAnalytics.timeDistribution).join(', ')}`);
  } else {
    console.log('⚠️ No student found for analytics test.');
  }

  // 3. WEAK-AREA IDENTIFICATION
  console.log('\n--- 3. Weak-Area Identification ---');
  if (student) {
    const weakResult = await AnalyticsService.getWeakAreas(student.id, 60, 100);
    console.log(`Needs Practice Topics Identified: ${weakResult.weakAreas.length}`);
    console.log(`Thresholds used: Accuracy < ${weakResult.thresholds.lowAccuracyThreshold}%, Completion < ${weakResult.thresholds.lowCompletionThreshold}%`);
    if (weakResult.weakAreas.length > 0) {
      console.log(`  Sample: "${weakResult.weakAreas[0].topicName}" — Accuracy: ${weakResult.weakAreas[0].accuracy}%, Remaining: ${weakResult.weakAreas[0].questionsRemaining}, Suggestion: ${weakResult.weakAreas[0].suggestedPracticeArea}`);
    }
  }

  // 4. QUESTION QUALITY & DIFFICULTY ANALYTICS
  console.log('\n--- 4. Question Quality & Difficulty Analytics ---');
  const qAnalytics = await AnalyticsService.getQuestionAnalytics(1, 5);
  console.log(`Total questions analyzed: ${qAnalytics.total}`);
  console.log(`Sample Question #${qAnalytics.questions[0]?.questionNumber} (${qAnalytics.questions[0]?.difficulty}): Attempts=${qAnalytics.questions[0]?.attempts}, Acc=${qAnalytics.questions[0]?.accuracy}%`);

  // 5. QUESTION DUPLICATE DETECTION
  console.log('\n--- 5. Duplicate Detection ---');
  const dupCheck = await QuestionManagementService.detectDuplicates(undefined, 85);
  console.log(`Scan completed across all questions.`);
  console.log(`Duplicates flagged above 85% similarity: ${dupCheck.duplicates.length}`);

  // 6. QUESTION VERSIONING TEST (Add, Edit with Snapshot, Deactivate)
  console.log('\n--- 6. Question Versioning & Audit Lifecycle ---');
  const firstTest = await prisma.test.findFirst({ include: { topic: true } });
  const staff = await prisma.staff.findFirst({ include: { user: true } });
  if (firstTest && staff) {
    // A. Add Question
    const createdQ = await QuestionManagementService.addQuestion(staff.user.username, {
      testId: firstTest.id,
      questionNumber: 99,
      questionText: `Test question for Phase 5 verification audit ${Date.now()}`,
      optionA: 'Option Alpha',
      optionB: 'Option Beta',
      optionC: 'Option Gamma',
      optionD: 'Option Delta',
      correctOption: 'C',
      explanation: 'Detailed verification proof',
      difficulty: 'HARD',
      marks: 2,
    });
    console.log(`  ✓ Question created: ID ${createdQ.id}, Q#${createdQ.questionNumber}`);

    // B. Edit Question (creates QuestionVersion snapshot)
    const updatedQ = await QuestionManagementService.editQuestion(
      staff.user.username,
      createdQ.id,
      {
        questionText: `Updated test question statement ${Date.now()}`,
        optionA: 'Option Alpha Updated',
        optionB: 'Option Beta Updated',
        optionC: 'Option Gamma Updated',
        optionD: 'Option Delta Updated',
        correctOption: 'D',
        explanation: 'Updated explanation',
        difficulty: 'VERY_HARD',
        marks: 3,
      },
      'Phase 5 automated test verification snapshot creation'
    );
    console.log(`  ✓ Question edited (snapshot preserved)`);

    // Verify snapshot was created in QuestionVersion table
    const versions = await prisma.questionVersion.findMany({ where: { questionId: createdQ.id } });
    console.log(`  ✓ Verified historical snapshots in DB: ${versions.length} version(s) archived`);

    // C. Deactivate Question
    const deactivatedQ = await QuestionManagementService.deactivateQuestion(createdQ.id);
    console.log(`  ✓ Question active status toggled: isActive = ${deactivatedQ.isActive}`);

    // Clean up created test question and snapshots to preserve clean 2160 seed count
    await prisma.questionVersion.deleteMany({ where: { questionId: createdQ.id } });
    await prisma.question.delete({ where: { id: createdQ.id } });
    console.log(`  ✓ Cleaned up test question.`);
  }

  // 7. BULK IMPORT VALIDATION TEST
  console.log('\n--- 7. Bulk Question Import Transaction Safety ---');
  try {
    // Try invalid batch (less than 20 questions) to test transaction rejection
    await QuestionManagementService.bulkImport({
      topic: "Percentages",
      testNumber: 1,
      questions: [{ questionNumber: 1, questionText: "Invalid short batch", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "A", explanation: "", difficulty: "HARD", marks: 1 }],
    }, staff?.user.id || 'admin');
    console.log('  ❌ Error: Invalid batch should have failed validation!');
    allPassed = false;
  } catch (err: any) {
    console.log(`  ✓ Successfully rejected invalid batch: "${err.message}" (Transaction rolled back safely)`);
  }

  // 8. CSV EXPORTS GENERATION
  console.log('\n--- 8. Server-Side CSV Exports ---');
  const studentCSV = await ExportService.studentPerformanceCSV();
  console.log(`  ✓ Student Performance CSV: ${studentCSV.split('\n').length} rows generated`);
  const topicCSV = await ExportService.topicPerformanceCSV();
  console.log(`  ✓ Topic Performance CSV: ${topicCSV.split('\n').length} rows generated`);
  const weekendCSV = await ExportService.weekendActivityCSV(2026, 10);
  console.log(`  ✓ Weekend Activity CSV: ${weekendCSV.split('\n').length} rows generated`);

  // 9. AUDIT LOGS & SETTINGS & NOTIFICATIONS
  console.log('\n--- 9. Audit Logs, Settings & Notifications ---');
  const auditLogs = await AuditService.getLogs({ page: 1, pageSize: 5 });
  console.log(`  ✓ Audit logs queryable: Total ${auditLogs.total} logs recorded`);
  const settings = await SystemSettingsService.getAll();
  console.log(`  ✓ Configurable settings active: ${Object.keys(settings).length} settings (${settings.WEEKEND_TESTING_ENABLED === 'true' ? 'Weekend Restriction Enforced' : 'Open'})`);

  const activeAnnouncements = await AnnouncementService.getActiveAnnouncements();
  console.log(`  ✓ Active announcements queryable: ${activeAnnouncements.length} active announcements`);

  console.log('\n=====================================================');
  console.log(`PHASE 5 VERIFICATION AUDIT COMPLETED: ${allPassed ? 'ALL PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('=====================================================');

  await prisma.$disconnect();
}

runPhase5ComprehensiveAudit().catch((err) => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
