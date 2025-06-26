import Sqlite = require("better-sqlite3");
import Database from 'better-sqlite3';
// const db = new Database('foobar.db', options);
// const db: Sqlite.Database = require('better-sqlite3')(process.env.DATABASE_PATH, { verbose: console.log });

let db: Sqlite.Database;

try {
	db = new Database(process.env.DATABASE_PATH!, { verbose: console.log });
	console.log("✅ Database opened successfully");
} catch (error) {
	console.error("❌ Failed to open database:", error);
	process.exit(1); // or handle accordingly
}

// import sqlite3 from 'sqlite3';
// import { open, Database } from 'sqlite';

// Типизированная переменная для подключения к БД
// let db: Database | null = null;

// export async function initDB(): Promise<void> {
// 	const dbPath = process.env.DATABASE_PATH;
// 	if (!dbPath) {
// 		throw new Error('DATABASE_PATH is not defined in environment variables');
// 	}

// 	db = await open({
// 		filename: dbPath,
// 		driver: sqlite3.Database,
// 	});
// }

export function getDB(): Sqlite.Database {
	if (!db) {
		throw new Error('Database not initialized.');
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


// *Наташа: Старт логирования игры
export async function startGameLog(player1Id: string, player2Id: string){
    const result = await db.run(
        `INSERT INTO game_logs (player1_id, player2_id, status) VALUES (?, ?, 'started')`,
        [player1Id, player2Id]
    );
    return result.lastID;
}

// *Наташа: Завершение логирования игры
export async function endGameLog(logId: number, score1: number, score2: number): Promise<void> {
    await db.run(
        `UPDATE game_logs SET ended_at = CURRENT_TIMESTAMP, score1 = ?, score2 = ?, status = 'finished' WHERE id = ?`,
        [score1, score2, logId]
    );
}