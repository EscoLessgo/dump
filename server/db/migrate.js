import pool from './index.js';

const schema = `
-- Pastes table
CREATE TABLE IF NOT EXISTS pastes (
  id VARCHAR(8) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'plaintext',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  views INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  password VARCHAR(255),
  burn_after_read BOOLEAN NOT NULL DEFAULT false,
  burned BOOLEAN NOT NULL DEFAULT false
);

-- Views/Analytics table
CREATE TABLE IF NOT EXISTS paste_views (
  id SERIAL PRIMARY KEY,
  paste_id VARCHAR(8) NOT NULL REFERENCES pastes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  country VARCHAR(100),
  country_code VARCHAR(2),
  region VARCHAR(100),
  region_code VARCHAR(10),
  city VARCHAR(100),
  zip VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(100),
  isp VARCHAR(255),
  org VARCHAR(255),
  asn VARCHAR(100)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_paste_views_paste_id ON paste_views(paste_id);
CREATE INDEX IF NOT EXISTS idx_paste_views_viewed_at ON paste_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes(created_at);
CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
`;

export async function migrate() {
    let client;
    try {
        console.log('🔄 Running database migrations...');
        console.log('   Connecting to database...');

        // Add timeout for connection
        client = await Promise.race([
            pool.connect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database connection timeout after 10s')), 10000)
            )
        ]);

        console.log('   ✓ Connected to database');
        console.log('   Running schema creation...');

        await client.query(schema);

        console.log('✅ Database migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:');
        console.error('   Error:', error.message);
        if (error.code) console.error('   Code:', error.code);
        if (error.detail) console.error('   Detail:', error.detail);
        throw error;
    } finally {
        if (client) {
            client.release();
            console.log('   Database client released');
        }
    }
}

// Run migrations if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrate;
