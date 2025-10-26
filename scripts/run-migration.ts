import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../server/db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running database migration...');
    
    // Read and execute the first migration
    const migration1SQL = fs.readFileSync(
      path.join(__dirname, '../migrations/0001_add_affiliated_hospital.sql'),
      'utf-8'
    );
    await db.execute(sql.raw(migration1SQL));
    console.log('Migration 1 completed');

    // Read and execute the second migration
    const migration2SQL = fs.readFileSync(
      path.join(__dirname, '../migrations/0002_add_missing_kyc_columns.sql'),
      'utf-8'
    );
    await db.execute(sql.raw(migration2SQL));
    
    console.log('Migration completed successfully!');
    
    // Verify the column exists
    const result = await db.execute(sql.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'kyc' 
      AND column_name = 'affiliated_hospital';
    `));
    
    console.log('Column verification:', result.rows.length > 0 ? 'exists' : 'missing');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit();
  }
}

runMigration();