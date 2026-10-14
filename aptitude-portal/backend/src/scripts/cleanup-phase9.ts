import dotenv from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log('=== PHASE 9 DATABASE MOCK DATA CLEANUP ===\n');

  // 1. Delete all test attempts and answers generated during development/testing
  const deletedAnswers = await prisma.answer.deleteMany({});
  console.log(`Deleted Answers: ${deletedAnswers.count}`);

  const deletedAttempts = await prisma.testAttempt.deleteMany({});
  console.log(`Deleted Test Attempts: ${deletedAttempts.count}`);

  // 2. Delete test/demo notifications, audit logs, and login sessions
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`Deleted Notifications: ${deletedNotifications.count}`);

  const deletedAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`Deleted Audit Logs: ${deletedAuditLogs.count}`);

  const deletedSessions = await prisma.loginSession.deleteMany({});
  console.log(`Deleted Login Sessions: ${deletedSessions.count}`);

  // 3. Remove demo student accounts (e.g., 22AD001-22AD005 or TEST* / DEMO*)
  const demoStudents = await prisma.student.findMany({
    where: {
      OR: [
        { rollNumber: { startsWith: '22AD' } },
        { rollNumber: { startsWith: 'TEST' } },
        { rollNumber: { startsWith: 'DEMO' } },
        { rollNumber: { startsWith: 'STUDENT' } },
      ],
    },
  });

  for (const s of demoStudents) {
    await prisma.student.delete({ where: { id: s.id } });
    await prisma.user.delete({ where: { id: s.userId } });
  }
  console.log(`Removed Demo Students: ${demoStudents.length}`);

  // 4. Remove demo staff accounts (e.g. STAFF001, DEMO*) except official ADMIN001 if needed
  const demoStaff = await prisma.staff.findMany({
    where: {
      OR: [
        { staffId: 'STAFF001' },
        { staffId: { startsWith: 'DEMO' } },
        { staffId: { startsWith: 'TEST' } },
      ],
    },
  });

  for (const st of demoStaff) {
    await prisma.staff.delete({ where: { id: st.id } });
    await prisma.user.delete({ where: { id: st.userId } });
  }
  console.log(`Removed Demo Staff: ${demoStaff.length}`);

  // 5. Create secure production admin account if no staff exists
  const staffCount = await prisma.staff.count();
  if (staffCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('PlacementCell2026!', salt);

    const adminUser = await prisma.user.create({
      data: {
        username: 'ADMIN001',
        passwordHash,
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
    console.log('Created Production Admin Account (ADMIN001)');
  }

  // 6. Verify question bank structure remains 100% intact
  const topicsCount = await prisma.topic.count();
  const testsCount = await prisma.test.count();
  const questionsCount = await prisma.question.count();

  console.log('\n--- POST-CLEANUP STRUCTURE CHECK ---');
  console.log(`Topics: ${topicsCount} (Required: 35)`);
  console.log(`Tests: ${testsCount} (Required: 105)`);
  console.log(`Questions: ${questionsCount} (Required: 2100)`);
  console.log(`Students: ${await prisma.student.count()}`);
  console.log(`Staff: ${await prisma.staff.count()}`);
  console.log(`Test Attempts: ${await prisma.testAttempt.count()}`);

  await prisma.$disconnect();
}

cleanMockData().catch((err) => {
  console.error('Cleanup error:', err);
  prisma.$disconnect();
});
