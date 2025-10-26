import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Configured' : 'Missing');
    
    // Test query
    const testQuery = await db.select({ count: sql`count(*)` }).from(users);
    console.log('Connection successful!');
    console.log('Users count:', testQuery[0].count);
    
    // Test table creation
    await db.select().from(users).limit(1);
    console.log('Users table exists and is accessible');
    
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
  } finally {
    process.exit();
  }
}

testDatabaseConnection();