import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Use DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Creating material_interests table if it does not exist...');
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS material_interests (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL,
        recycler_id INTEGER NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (collection_id) REFERENCES collections(id),
        FOREIGN KEY (recycler_id) REFERENCES users(id)
      );
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();