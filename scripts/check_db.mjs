import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT 1 AS ok');
    console.log('DB check result:', res.rows);
  } catch (err) {
    console.error('DB check failed:', err);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
}

main();
