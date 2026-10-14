import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { prisma } from './utils/prisma';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Successfully connected to the PostgreSQL database via Prisma.');

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Aptitude Test Portal Backend running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Endpoint: /api`);
      console.log(` Health Check: /api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected on SIGINT. Server shutting down.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected on SIGTERM. Server shutting down.');
  process.exit(0);
});

bootstrap();
