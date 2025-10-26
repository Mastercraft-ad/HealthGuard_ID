import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    const allUsers = await db.select().from(users);
    console.log('Users in database:', allUsers.length);
    console.log('Users:', allUsers);
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit();
  }
}

checkDatabase();