require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({ include: { user: true } });
  
  // Test common passwords against each student
  const passwords = ['Student@123', 'Test@123', 'password', 'Password@123', 'test123', 'aptitude123', 'Pass@123', 'admin123'];
  
  for (const student of students) {
    for (const pw of passwords) {
      const match = await bcrypt.compare(pw, student.user.passwordHash);
      if (match) {
        console.log(`FOUND: ${student.rollNumber} / ${pw}`);
      }
    }
  }
  
  // Also check staff 
  const staff = await prisma.staff.findMany({ include: { user: true } });
  for (const s of staff) {
    for (const pw of ['PlacementCell2026!', 'admin123', 'Admin@123', 'password', 'Test@123']) {
      const match = await bcrypt.compare(pw, s.user.passwordHash);
      if (match) {
        console.log(`STAFF FOUND: ${s.staffId} / ${pw}`);
      }
    }
  }
  
  console.log('Password check complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
