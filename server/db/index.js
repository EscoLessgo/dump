import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DATA FOLDER Selection:
// 1. RAILWAY_VOLUME_MOUNT_PATH if on Railway with a volume (Recommended)
// 2. ../../data (local)
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..', '..', 'data');

// Ensure folder exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Database File
const dbPath = path.join(dataDir, 'pastebin.db');
console.log(`📦 Database Path: ${dbPath}`);

// Initialize DB (Synchronous)
const db = new Database(dbPath);

// Optimizations
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- SCHEMA DEFINITION (One file to rule them all) ---
db.exec(`
    CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        language TEXT DEFAULT 'plaintext',
        views INTEGER DEFAULT 0,
        image TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        burnAfterRead INTEGER DEFAULT 0,
        isPublic INTEGER DEFAULT 1
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

console.log('✅ Database Schema Initialized');

export default db;
