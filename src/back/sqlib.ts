import type { Database as DatabaseType } from 'better-sqlite3';
import { getDB } from './db';
import { int } from '@babylonjs/core';

export class TournamentService {
	private db: DatabaseType;

	constructor() {
		this.db = getDB();
	}

	// ===== TOURNAMENT =====

	createTournament(name: string, user_count: int): int {
		try {
			const stmt = this.db.prepare(
				`INSERT INTO tournaments (status, name, user_count) VALUES (1, ?, ?)`
			);
			const result = stmt.run(name, user_count);
			return result.lastInsertRowid as int;
		} catch (e) {
			console.error('createTournament error:', e);
			return -1;
		}
	}

	startTournament(id: int): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE tournaments SET status = 2, end_at = datetime('now') WHERE id = ?`
			);
			const result = stmt.run(id);
			return result.changes > 0;
		} catch (e) {
			console.error('startTournament error:', e);
			return false;
		}
	}

	endTournament(id: int): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE tournaments SET status = 3, end_at = datetime('now') WHERE id = ?`
			);
			const result = stmt.run(id);
			return result.changes > 0;
		} catch (e) {
			console.error('endTournament error:', e);
			return false;
		}
	}

	clearTournament(): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE tournaments SET status = 3, end_at = datetime('now') WHERE status != 3`
			);
			stmt.run();
			return true;
		} catch (e) {
			console.error('clearTournament error:', e);
			return false;
		}
	}

	// ===== USERS =====

	addUser(tournament: int, user: int): int {
		try {
			const stmt = this.db.prepare(
				`INSERT INTO tournament_users (tournament, user) VALUES (?, ?)`
			);
			const result = stmt.run(tournament, user);
			return result.lastInsertRowid as int;
		} catch (e) {
			console.error('addUser error:', e);
			return -1;
		}
	}

	updateUser(tournament: int, user: int, position: int): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE tournament_users SET position = ? WHERE tournament = ? and user = ?`
			);
			const result = stmt.run(position, tournament, user);
			return result.changes > 0;
		} catch (e) {
			console.error('updateUser error:', e);
			return false;
		}
	}

	getUsers(tournamentId: int): Array<{ user: int, position: int }> {
		try {
			const stmt = this.db.prepare(
				`SELECT user, position FROM tournament_users WHERE tournament = ?`
			);
			return stmt.all(tournamentId) as Array<{ user: int, position: int }>;
		} catch (e) {
			console.error('getUsers error:', e);
			return [];
		}
	}

	// ===== GAMES =====

	createGame(tournamentId: int, user1: int, user2: int): int {
		try {
			let result;
			const stmt = this.db.prepare(
				`INSERT INTO games (tournament, user1, user2)  VALUES (?, ?, ?)`
			);
			if (tournamentId == 0)
				result = stmt.run(null, user1, user2);
			else
				result = stmt.run(tournamentId, user1, user2);
			return result.lastInsertRowid as int;
		} catch (e) {
			console.error('createGame error:', e);
			return -1;
		}
	}

	updateGame(id: int, score1: int, score2: int): boolean {
		try {
			const stmt = this.db.prepare(`UPDATE games SET score1 = ?, score2 = ? WHERE id = ?`);
			const result = stmt.run(score1, score2, id);
			return result.changes > 0;
		} catch (e) {
			console.error('updateGame error:', e);
			return false;
		}
	}

	updateGameScore(id: int, score1: int, score2: int): boolean {
		try {
			const stmt = this.db.prepare(`UPDATE games SET score1 = score1 + ?, score2 = score2 + ? WHERE id = ?`);
			const result = stmt.run(score1, score2, id);
			return result.changes > 0;
		} catch (e) {
			console.error('updateGame error:', e);
			return false;
		}
	}

	// endGame(id: int): boolean {
	// 	try {
	// 		const stmt = this.db.prepare(
	// 			`UPDATE games SET status = 3, end_at = datetime('now') WHERE id = ?`
	// 		);
	// 		const result = stmt.run(id);
	// 		return result.changes > 0;
	// 	} catch (e) {
	// 		console.error('endGame error:', e);
	// 		return false;
	// 	}
	// }
}
