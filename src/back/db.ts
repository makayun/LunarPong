import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// Типизированная переменная для подключения к БД
let db: Database | null = null;

export async function initDB(): Promise<void> {
	const dbPath = process.env.DATABASE_PATH;
	if (!dbPath) {
		throw new Error('DATABASE_PATH is not defined in environment variables');
	}

	db = await open({
		filename: dbPath,
		driver: sqlite3.Database,
	});
}

export function getDB(): Database {
	if (!db) {
		throw new Error('Database not initialized. Call initDB() first.');
	}
	return db;
}
// import Database from 'better-sqlite3';

// const db = new Database(process.env.DATABASE_PATH);

// // Create users table if not exists
// db.prepare(`
//   CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     email TEXT UNIQUE,
//     password TEXT
//   )
// `).run();

// export default db;
