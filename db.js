const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'panchayat.db');
let db = null;
let dbReady = null;

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function initSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount TEXT NOT NULL,
      mode TEXT NOT NULL,
      date TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by)`);

  const r = database.exec('SELECT COUNT(*) as c FROM users');
  const count = r.length && r[0].values.length ? r[0].values[0][0] : 0;
  if (count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    database.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
    console.log('Default user created: admin / admin123');
    saveDb();
  }
}

function migrateFromJsonIfExists() {
  const jsonPath = path.join(__dirname, 'transactions.json');
  if (!fs.existsSync(jsonPath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(data) || data.length === 0) return;
    const d = getDB();
    const check = d.exec('SELECT COUNT(*) as c FROM transactions');
    const n = check.length && check[0].values.length ? check[0].values[0][0] : 0;
    if (n > 0) return;
    for (const row of data) {
      d.run('INSERT INTO transactions (name, amount, mode, date) VALUES (?, ?, ?, ?)', [
        row.name || '',
        row.amount || '',
        row.mode || '',
        row.date || ''
      ]);
    }
    saveDb();
    console.log('Migrated', data.length, 'transactions from transactions.json');
  } catch (e) {
    console.warn('Migration from JSON skipped:', e.message);
  }
}

async function initDb() {
  if (dbReady) return dbReady;
  dbReady = (async () => {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
      initSchema(db);
      saveDb();
    }
    migrateFromJsonIfExists();
    return db;
  })();
  return dbReady;
}

module.exports = { getDB, initDb, saveDb, initSchema, migrateFromJsonIfExists };
