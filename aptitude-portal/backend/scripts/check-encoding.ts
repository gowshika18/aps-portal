import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const result: any = await prisma.$queryRawUnsafe('SHOW server_encoding');
  console.log('server_encoding:', result);
  const clientEnc: any = await prisma.$queryRawUnsafe('SHOW client_encoding');
  console.log('client_encoding:', clientEnc);
  const dbs: any = await prisma.$queryRawUnsafe('SELECT datname, pg_encoding_to_char(encoding) as encoding FROM pg_database');
  console.log('databases:', dbs);
  await prisma.$disconnect();
}
main();
