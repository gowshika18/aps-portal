require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { student: true, staff: true } });
  console.log('TOTAL USERS:', users.length);
  for (const u of users) {
    console.log(JSON.stringify({
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      roll: u.student?.rollNumber || null,
      staffId: u.staff?.staffId || null,
      hashLen: u.passwordHash.length
    }));
  }
  
  // Now test password for any student
  const student = await prisma.student.findFirst({ include: { user: true } });
  if (student) {
    console.log('\nFirst student:', student.rollNumber, student.name);
    const match1 = await bcrypt.compare('Student@123', student.user.passwordHash);
    const match2 = await bcrypt.compare('Test@123', student.user.passwordHash);
    const match3 = await bcrypt.compare('password', student.user.passwordHash);
    const match4 = await bcrypt.compare('PlacementCell2026!', student.user.passwordHash);
    console.log('Student@123 match:', match1);
    console.log('Test@123 match:', match2);
    console.log('password match:', match3);
    console.log('PlacementCell2026! match:', match4);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
