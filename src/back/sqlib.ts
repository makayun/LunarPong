import type { Database as DatabaseType } from 'better-sqlite3';
import { getDB } from './db';

export interface Profile {
	user_id: number;
	games: number;
	wins: number;
	position: number;
	score: number;
}

export class TournamentService {
	private db: DatabaseType | undefined = undefined;

	constructor() {
		try {
			this.db = getDB();
		} catch (err: any) {
			console.error("TournamentService:", err);
		}
	}

	// ===== TOURNAMENT =====

	createTournament(name: string, user_count: number): number {
		if (this.db === undefined)
			return -1;
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
		if (this.db === undefined)
			return false;
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

	endTournament(id: number): boolean {
		if (this.db === undefined)
			return false;
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
		if (this.db === undefined)
			return false;
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

	addUser(tournament: number, user: number): number {
		if (this.db === undefined)
			return -1;
		try {
			const stmt = this.db.prepare(
				`INSERT INTO tournament_users (tournament, user) VALUES (?, ?)`
			);
			const result = stmt.run(tournament, user);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('addUser error:', e);
			return -1;
		}
	}

	updateUser(tournament: number, user: number, position: number): boolean {
		if (this.db === undefined)
			return false;
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

	getUsers(tournamentId: number): Array<{ user: number, position: number }> {
		if (this.db === undefined)
			return [];
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

	createGame(tournamentId: number, user1: number, user2: number): number {
		if (this.db === undefined)
			return -1;
		try {
			let result;
			const stmt = this.db.prepare(
				`INSERT INTO games (tournament, user1, user2)  VALUES (?, ?, ?)`
			);
			if (tournamentId == 0)
				result = stmt.run(null, user1, user2);
			else
				result = stmt.run(tournamentId, user1, user2);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('createGame error:', e);
			return -1;
		}
	}

	createRemoteGame(user: number): number {
		if (this.db === undefined)
			return -1;
		try {
			let result;
			const stmt = this.db.prepare(
				`INSERT INTO games (user1)  VALUES (?)`
			);
			result = stmt.run(user);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('createGame error:', e);
			return -1;
		}
	}

	addRemoteGame(game: number, user: number): number {
		if (this.db === undefined)
			return -1;
		try {
			let result;
			const stmt = this.db.prepare(
				`UPDATE games SET user2 = ? WHERE id = ?`
			);
			result = stmt.run(user, game);
			return result.lastInsertRowid as number;
		} catch (e) {
			console.error('createGame error:', e);
			return -1;
		}
	}

	updateGame(id: number, score1: number, score2: number): boolean {
		if (this.db === undefined)
			return false;
		try {
			const stmt = this.db.prepare(`UPDATE games SET score1 = ?, score2 = ? WHERE id = ?`);
			const result = stmt.run(score1, score2, id);
			return result.changes > 0;
		} catch (e) {
			console.error('updateGame error:', e);
			return false;
		}
	}

	updateGameScore(id: number, score1: number, score2: number): boolean {
		if (this.db === undefined)
			return false;
		try {
			const stmt = this.db.prepare(`UPDATE games SET score1 = score1 + ?, score2 = score2 + ? WHERE id = ?`);
			const result = stmt.run(score1, score2, id);
			return result.changes > 0;
		} catch (e) {
			console.error('updateGame error:', e);
			return false;
		}
	}

	getProfile(user_id: number): Profile | null{
		if (this.db === undefined)
			return null;
		try {
			const stmt = this.db.prepare(
				`SELECT user_id, games, wins, position, score FROM profiles WHERE user_id = ?`
			);
			const result = stmt.get(user_id);
			return result as Profile;
		} catch (e) {
			console.error('getProfile error:', e);
			return null;
		}
	}

	// endGame(id: number): boolean {
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
