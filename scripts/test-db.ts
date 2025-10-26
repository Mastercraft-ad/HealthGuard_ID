import { db } from '../server/db';

async function testConnection() {
  try {
    // Try to query the users table
    const result = await db.query.users.findFirst();
    console.log('Database connection successful!');
    console.log('Sample query result:', result);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();