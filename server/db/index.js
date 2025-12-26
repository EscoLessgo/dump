import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'database.sqlite'));

// Realistic Schema for Analytics
db.exec(`
    CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        language TEXT DEFAULT 'plaintext',
        views INTEGER DEFAULT 0,
        isPublic INTEGER DEFAULT 1,
        burnAfterRead INTEGER DEFAULT 0,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paste_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pasteId TEXT,
        ip TEXT,
        country TEXT,
        countryCode TEXT,
        region TEXT,
        regionName TEXT,
        city TEXT,
        zip TEXT,
        lat REAL,
        lon REAL,
        isp TEXT,
        org TEXT,
        asName TEXT,
        userAgent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(pasteId) REFERENCES pastes(id) ON DELETE CASCADE
    );
`);

// Migration: Check if new columns exist (in case DB already exists)
try {
    const tableInfo = db.prepare('PRAGMA table_info(paste_views)').all();
    const existingColumns = tableInfo.map(c => c.name.toLowerCase());

    const required = ['country', 'countrycode', 'region', 'regionname', 'city', 'zip', 'isp', 'org', 'asname'];
    required.forEach(col => {
        if (!existingColumns.includes(col)) {
            console.log(`🔧 Migrating: Adding ${col} to paste_views`);
            db.exec(`ALTER TABLE paste_views ADD COLUMN ${col} TEXT`);
        }
    });
} catch (e) {
    console.warn('Migration warning:', e.message);
}

console.log('✅ SQLite Database Ready with Analytics Support');

export default db;
