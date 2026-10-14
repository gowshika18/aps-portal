require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = 'Student@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Check if 22AD001 exists
  const existing = await prisma.student.findUnique({ where: { rollNumber: '22AD001' } });
  
  if (existing) {
    // Update password
    await prisma.user.update({ where: { id: existing.userId }, data: { passwordHash: hash } });
    console.log('Updated password for 22AD001:', password);
  } else {
    // Create user + student
    const user = await prisma.user.create({
      data: {
        username: '22AD001',
        passwordHash: hash,
        role: 'STUDENT',
        isActive: true,
      }
    });
    await prisma.student.create({
      data: {
        rollNumber: '22AD001',
        name: 'Test Student',
        email: 'teststu@college.edu',
        department: 'Computer Science',
        year: 3,
        section: 'A',
        userId: user.id,
      }
    });
    console.log('Created 22AD001 with password:', password);
  }
  
  // Also verify REGTEST940926
  const regtest = await prisma.student.findFirst({ where: { rollNumber: { startsWith: 'REGTEST' } }, include: { user: true } });
  if (regtest) {
    const regHash = await bcrypt.hash(password, salt);
    await prisma.user.update({ where: { id: regtest.userId }, data: { passwordHash: regHash } });
    console.log('Updated password for', regtest.rollNumber, ':', password);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
