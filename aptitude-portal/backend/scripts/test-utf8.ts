import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe("CREATE DATABASE aptitude_portal_utf8 WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'");
    console.log('Successfully created UTF-8 database with template0!');
  } catch (err: any) {
    console.log('Error creating UTF8 db with template0:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
