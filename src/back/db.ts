import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_PATH);

// Create users table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`).run();

export default db;
