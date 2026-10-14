import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

async function main() {
  // Connect to postgres database
  const postgresUrl = "postgresql://postgres:password@localhost:5432/postgres?schema=public";
  const prisma = new PrismaClient({
    datasources: { db: { url: postgresUrl } },
  });

  try {
    // Terminate existing connections to aptitude_portal
    await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'aptitude_portal' AND pid <> pg_backend_pid();
    `);
    
    // Drop old WIN1252 aptitude_portal
    await prisma.$executeRawUnsafe("DROP DATABASE IF EXISTS aptitude_portal;");
    console.log("Dropped old aptitude_portal database.");

    // Drop temporary aptitude_portal_utf8 if exists
    await prisma.$executeRawUnsafe("DROP DATABASE IF EXISTS aptitude_portal_utf8;");

    // Recreate aptitude_portal with UTF8
    await prisma.$executeRawUnsafe("CREATE DATABASE aptitude_portal WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';");
    console.log("Successfully created aptitude_portal database with UTF8 encoding!");

    const dbs: any = await prisma.$queryRawUnsafe("SELECT datname, pg_encoding_to_char(encoding) as encoding FROM pg_database WHERE datname = 'aptitude_portal';");
    console.log("Verified database encoding:", dbs);
  } catch (err: any) {
    console.error("Error recreating database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
