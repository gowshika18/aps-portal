import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import net from 'net';

const DB_PORT = 5432;
const DB_USER = 'postgres';
const DB_PASSWORD = 'password';
const DB_NAME = 'aptitude_portal';
const DATA_DIR = path.resolve(__dirname, '../.pgdata');

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function startDatabase() {
  const inUse = await isPortInUse(DB_PORT);
  if (inUse) {
    console.log(`Port ${DB_PORT} is already active. PostgreSQL is running.`);
    return;
  }

  console.log(`Starting embedded PostgreSQL on port ${DB_PORT}...`);
  const pg = new EmbeddedPostgres({
    port: DB_PORT,
    databaseDir: DATA_DIR,
    user: DB_USER,
    password: DB_PASSWORD,
    persistent: true,
  });

  try {
    await pg.initialise();
  } catch (err: any) {
    console.log('Database already initialized or notice:', err.message);
  }

  await pg.start();
  console.log(`PostgreSQL engine successfully started on port ${DB_PORT}`);

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`Database "${DB_NAME}" created successfully.`);
  } catch (err: any) {
    console.log(`Database "${DB_NAME}" is ready.`);
  }

  console.log(`DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"`);

  // Keep process alive if run directly
  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
}

if (require.main === module) {
  startDatabase().catch((err) => {
    console.error('Error starting PostgreSQL:', err);
    process.exit(1);
  });
}

export { startDatabase };
