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

// Minimal Schema
db.exec(`
    CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        language TEXT DEFAULT 'plaintext',
        views INTEGER DEFAULT 0,
        isPublic INTEGER DEFAULT 1,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paste_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pasteId TEXT,
        ip TEXT,
        userAgent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(pasteId) REFERENCES pastes(id) ON DELETE CASCADE
    );
`);

console.log('✅ SQLite Database Ready (Minimalist)');

export default db;
