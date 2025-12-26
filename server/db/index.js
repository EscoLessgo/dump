import dotenv from 'dotenv';
dotenv.config();

// Use SQLite for local development, PostgreSQL for production
const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.DATABASE_URL && isProduction;

let pool;

if (usePostgres) {
    console.log('🔗 Using PostgreSQL (Production)...');
    const pg = await import('pg');
    const { Pool } = pg.default;

    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    pool.on('connect', () => {
        console.log('✅ Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
        console.error('❌ Unexpected database error:', err);
        process.exit(-1);
    });
} else {
    console.log('🔗 Using SQLite (Local Development)...');
    console.log('   No PostgreSQL setup required! 🎉');
    const sqlite = await import('./sqlite.js');
    pool = sqlite.default;
}

export default pool;
