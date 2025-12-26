import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database file in project root
const dbPath = path.join(__dirname, '..', '..', 'pastebin.db');
const db = new Database(dbPath);

console.log('📁 Using SQLite database at:', dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS pastes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'plaintext',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1,
    password TEXT,
    burn_after_read INTEGER NOT NULL DEFAULT 0,
    burned INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS paste_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paste_id TEXT NOT NULL,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    ip_address TEXT,
    country TEXT,
    country_code TEXT,
    region TEXT,
    region_code TEXT,
    city TEXT,
    zip TEXT,
    latitude REAL,
    longitude REAL,
    timezone TEXT,
    isp TEXT,
    org TEXT,
    asn TEXT,
    FOREIGN KEY (paste_id) REFERENCES pastes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_paste_views_paste_id ON paste_views(paste_id);
  CREATE INDEX IF NOT EXISTS idx_paste_views_viewed_at ON paste_views(viewed_at);
  CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes(created_at);
  CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
`);

// PostgreSQL-compatible wrapper
const pool = {
    async query(text, params = []) {
        try {
            // Convert PostgreSQL queries to SQLite
            let sqliteQuery = text
                .replace(/\$(\d+)/g, '?') // Replace $1, $2 with ?
                .replace(/RETURNING \*/g, '') // Remove RETURNING
                .replace(/NOW\(\)/g, "datetime('now')") // Replace NOW()
                .replace(/SERIAL/g, 'INTEGER') // Replace SERIAL
                .replace(/BOOLEAN/g, 'INTEGER'); // Replace BOOLEAN

            // Check if it's a SELECT query
            if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = db.prepare(sqliteQuery);
                const rows = stmt.all(...params);
                return { rows };
            }
            // INSERT/UPDATE/DELETE
            else {
                const stmt = db.prepare(sqliteQuery);
                const info = stmt.run(...params);

                // For INSERT with RETURNING, manually get the inserted row
                if (text.includes('RETURNING')) {
                    if (text.includes('INSERT INTO pastes')) {
                        const row = db.prepare('SELECT * FROM pastes WHERE id = ?').get(params[0]);
                        return { rows: [row] };
                    } else if (text.includes('INSERT INTO paste_views')) {
                        const row = db.prepare('SELECT * FROM paste_views WHERE id = ?').get(info.lastInsertRowid);
                        return { rows: [row] };
                    }
                }

                return { rows: [], rowCount: info.changes };
            }
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },

    async connect() {
        return {
            query: pool.query,
            release: () => { }
        };
    },

    on(event, callback) {
        if (event === 'connect') {
            setTimeout(() => callback(), 0);
        }
    }
};

console.log('✅ SQLite database initialized');

export default pool;
