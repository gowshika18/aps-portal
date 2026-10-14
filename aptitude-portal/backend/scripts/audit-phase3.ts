import { prisma } from '../src/utils/prisma';
import { StudentService } from '../src/services/student.service';
import { PortalConfigManager } from '../src/utils/portal.config';

async function runPhase3Audit() {
  console.log('========================================');
  console.log('STARTING PHASE 3 COMPREHENSIVE AUDIT');
  console.log('========================================\n');

  const report: Record<string, 'PASS' | 'FAIL'> = {};
  const failures: string[] = [];

  // --- 1. Audit Staff Stats & Aggregations ---
  console.log('1. Auditing Staff Aggregation Stats...');
  const stats = await StudentService.getStaffStats();
  const statsValid =
    typeof stats.totalStudents === 'number' &&
    stats.totalStudents > 0 &&
    typeof stats.activeNow === 'number' &&
    typeof stats.testsAttempted === 'number' &&
    typeof stats.averageScore === 'number' &&
    typeof stats.averageAccuracy === 'number' &&
    Array.isArray(stats.recentActivity);

  report['Staff Stats'] = statsValid ? 'PASS' : 'FAIL';
  console.log(`Staff Stats: Total ${stats.totalStudents} students, ${stats.testsAttempted} tests -> ${report['Staff Stats']}`);

  // --- 2. Audit Candidate Registry with Real Progress ---
  console.log('\n2. Auditing Candidate Registry...');
  const students = await StudentService.getAllStudentsForStaff();
  const studentsValid =
    students.length > 0 &&
    students.every(
      (s) =>
        s.rollNumber &&
        s.name &&
        s.department &&
        typeof s.overallProgress === 'number' &&
        typeof s.testsCompleted === 'number' &&
        typeof s.topicsCompleted === 'number' &&
        typeof s.questionsAttempted === 'number'
    );

  report['Candidate Registry'] = studentsValid ? 'PASS' : 'FAIL';
  console.log(`Candidate Registry: ${students.length} students loaded -> ${report['Candidate Registry']}`);

  // --- 3. Audit Single Candidate Portfolio Detail ---
  console.log('\n3. Auditing Single Student Portfolio Detail...');
  const studentDetail = await StudentService.getStudentDetailsForStaff('22AD001');
  const detailValid =
    studentDetail.student.rollNumber === '22AD001' &&
    studentDetail.topics.length === 36 &&
    studentDetail.topics.every((t) => t.tests.length === 3) &&
    typeof studentDetail.stats.overallProgress === 'number';

  report['Student Portfolio (36 Topics)'] = detailValid ? 'PASS' : 'FAIL';
  console.log(`Student Portfolio: 36 topics & 108 tests loaded -> ${report['Student Portfolio (36 Topics)']}`);

  // --- 4. Audit Batch Analytics & 36-Topic Heatmap Matrix ---
  console.log('\n4. Auditing Batch Analytics & Matrix...');
  const analytics = await StudentService.getBatchAnalytics();
  const analyticsValid =
    analytics.topicMatrix.length === 36 &&
    analytics.departmentStats.length > 0 &&
    analytics.categoryStats.quantitative.totalTopics === 20 &&
    analytics.categoryStats.logical.totalTopics === 16 &&
    analytics.scoreBuckets !== undefined;

  report['Batch Analytics & Heatmap'] = analyticsValid ? 'PASS' : 'FAIL';
  console.log(`Batch Analytics: 36 topics matrix & ${analytics.departmentStats.length} departments -> ${report['Batch Analytics & Heatmap']}`);

  // --- 5. Audit Real-Time Live Monitoring & Proctoring ---
  console.log('\n5. Auditing Real-Time Live Monitoring...');
  const liveMonitoring = await StudentService.getLiveMonitoring();
  const liveValid =
    typeof liveMonitoring.activeTestsCount === 'number' &&
    Array.isArray(liveMonitoring.activeTests) &&
    typeof liveMonitoring.onlineCount === 'number' &&
    Array.isArray(liveMonitoring.onlineStudents);

  report['Live Proctoring Telemetry'] = liveValid ? 'PASS' : 'FAIL';
  console.log(`Live Monitoring: ${liveMonitoring.activeTestsCount} active tests, ${liveMonitoring.onlineCount} online -> ${report['Live Proctoring Telemetry']}`);

  // --- 6. Audit Portal Availability & Weekend Override System ---
  console.log('\n6. Auditing Portal Control & Weekend Override...');
  // A. Check default
  const defaultStatus = PortalConfigManager.getStatus();
  const defaultValid = defaultStatus.mode === 'AUTOMATIC_WEEKEND';

  // B. Test Manual Open override
  const manualOpen = PortalConfigManager.setMode('MANUAL_OPEN', 'Test Mock Drive Open', 'Audit Script');
  const openValid = manualOpen.isOpen === true && manualOpen.mode === 'MANUAL_OPEN';

  // C. Test Manual Closed override
  const manualClosed = PortalConfigManager.setMode('MANUAL_CLOSED', 'System Maintenance', 'Audit Script');
  const closedValid = manualClosed.isOpen === false && manualClosed.mode === 'MANUAL_CLOSED';

  // D. Restore to Automatic Weekend
  const restored = PortalConfigManager.setMode('AUTOMATIC_WEEKEND', 'Weekend schedule', 'Audit Script');
  const restoredValid = restored.mode === 'AUTOMATIC_WEEKEND';

  const portalControlPass = defaultValid && openValid && closedValid && restoredValid;
  report['Portal Weekend & Override Control'] = portalControlPass ? 'PASS' : 'FAIL';
  console.log(`Portal Override Controls -> ${report['Portal Weekend & Override Control']}`);

  // --- Phase 3 Report ---
  console.log('\n========================================');
  console.log('PHASE 3 VERIFICATION REPORT');
  console.log('========================================');
  for (const [key, val] of Object.entries(report)) {
    console.log(`${key.padEnd(35)}: ${val}`);
  }
  console.log('========================================');

  const allPassed = Object.values(report).every((v) => v === 'PASS');
  if (allPassed) {
    console.log('\n>>> PHASE 3 STATUS: COMPLETE ✓ <<<\n');
  } else {
    console.error('\n>>> PHASE 3 STATUS: INCOMPLETE ✗ <<<');
    failures.forEach((f) => console.error(` - ${f}`));
    process.exit(1);
  }
}

runPhase3Audit()
  .catch((e) => {
    console.error('Phase 3 Audit run error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
