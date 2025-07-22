import type { Database as DatabaseType } from 'better-sqlite3';
import { getDB } from '../back/db';

export class TournamentService {
	private db: DatabaseType;

	constructor() {
		this.db = getDB();
	}

	// ===== TOURNAMENT =====

	createTournament(name: string, user_count: number): number {
		try {
			const stmt = this.db.prepare(
				`INSERT INTO tournaments (status, name, user_count) VALUES (1, ?, ?)`
			);
			const result = stmt.run(name, user_count);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('createTournament error:', e);
			return -1;
		}
	}

	startTournament(id: number): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE tournaments SET status = 2, end_at = datetime('now') WHERE id = ?`
			);
			const result = stmt.run(id);
			return result.changes > 0;
		} catch (e) {
			console.error('updateTournament error:', e);
			return false;
		}
	}

	endTournament(id: number): boolean {
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

	addUser(tournament: number, player: number): number {
		try {
			const stmt = this.db.prepare(
				`INSERT INTO ournament_users (tournament, user) 
				 VALUES (?, ?)`
			);
			const result = stmt.run(tournament, player);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('createGame error:', e);
			return -1;
		}
	}

	updateUser(tournament: number, player: number, position: number): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE ournament_users SET position = ? WHERE tournament = ?, user = ?)`
			);
			const result = stmt.run(position, tournament, player);
			return result.changes > 0;;
		} catch (e) {
			console.error('createGame error:', e);
			return false;
		}
	}

	getUsers(tournamentId: number): Array<{ user: number, position: number }> {
		try {
			const stmt = this.db.prepare(
				`SELECT user, position FROM tournament_users WHERE tournament = ?`
			);
			return stmt.all(tournamentId) as Array<{ user: number, position: number }>;
		} catch (e) {
			console.error('getUsers error:', e);
			return [];
		}
	}

	// ===== GAMES =====

	createGame(tournamentId: number, player1: string, player2: string): number {
		try {
			const stmt = this.db.prepare(
				`INSERT INTO games (tournament_id, player1, player2, status, created_at) 
				 VALUES (?, ?, ?, 'active', datetime('now'))`
			);
			const result = stmt.run(tournamentId, player1, player2);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('createGame error:', e);
			return -1;
		}
	}

	updateGame(id: number, score1: number, score2: number): boolean {
		try {
			const stmt = this.db.prepare(`UPDATE games SET score1 = ?, score2 = ? WHERE id = ?`);
			const result = stmt.run(score1, score2, id);
			return result.changes > 0;
		} catch (e) {
			console.error('updateGame error:', e);
			return false;
		}
	}

	endGame(id: number): boolean {
		try {
			const stmt = this.db.prepare(
				`UPDATE games SET status = 'finished', ended_at = datetime('now') WHERE id = ?`
			);
			const result = stmt.run(id);
			return result.changes > 0;
		} catch (e) {
			console.error('endGame error:', e);
			return false;
		}
	}
}
