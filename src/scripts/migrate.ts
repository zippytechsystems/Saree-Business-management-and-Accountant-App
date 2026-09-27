import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    console.error('Please configure your PostgreSQL or Supabase connection string in server/.env:');
    console.error('DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DB]"');
    process.exit(1);
  }

  console.log('🔄 Connecting to PostgreSQL/Supabase database...');

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connection established.');

    const schemaPath = path.resolve(__dirname, '../../../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    console.log(`📄 Reading schema from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⚡ Executing DDL migrations and seed data...');
    await client.query(sql);

    console.log('🎉 Migration & seeding completed successfully!');
    console.log('   - projects table ready');
    console.log('   - expenses table ready');
    console.log('   - performance indexes created');
    console.log('   - automated update triggers configured');
    console.log('   - financial summary view created');
    console.log('   - seed project and records inserted');

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
