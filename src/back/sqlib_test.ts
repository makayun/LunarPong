import {TournamentService } from './sqlib'
import { int } from '@babylonjs/core';

export function test_db(n: int) {

	const TrnmntSrv = new TournamentService();
	let t_id: int = -1;
	let u_id: int = -1;
	let g_id: int = -1;

	// ===== TOURNAMENT =====

	try {
		if (TrnmntSrv.clearTournament()) {
			console.debug("clearTournament()", "✅");
		} else {
			console.debug("clearTournament()", "❌");
		}
	} catch (err) {
		console.debug("clearTournament()", "❌", err);
	}

	try {
		t_id = TrnmntSrv.createTournament("Test!!!", n);
		if (t_id != -1) {
			console.debug("createTournament(\"Test!!!\", ", n, ")", t_id, "✅");
		} else {
			console.debug("createTournament(\"Test!!!\", ", n, ")", "❌");
		}
	} catch (err) {
		console.debug("createTournament(\"Test!!!\", ", n, ")", "❌", err);
	}

	try {
		if (TrnmntSrv.startTournament(t_id)) {
			console.debug("startTournament(", t_id, ")", "✅");
		} else {
			console.debug("startTournament(", t_id, ")", "❌");
		}
	} catch (err) {
		console.debug("startTournament(", t_id, ")", "❌", err);
	}

	try {
		if (TrnmntSrv.endTournament(t_id)) {
			console.debug("endTournament(", t_id, ")", "✅");
		} else {
			console.debug("endTournament(", t_id, ")", "❌");
		}
	} catch (err) {
		console.debug("endTournament(", t_id, ")", "❌", err);
	}

	// ===== USERS =====

	try {
		u_id = TrnmntSrv.addUser(t_id, 1);
		if (u_id != -1) {
			console.debug("addUser(", t_id, ", 1)", u_id, "✅");
		} else {
			console.debug("addUser(", t_id, ", 1)", "❌");
		}
	} catch (err) {
		console.debug("addUser(", t_id, ", 1)", "❌", err);
	}

	try {
		if (TrnmntSrv.updateUser(t_id, 1, n / 2)) {
			console.debug("updateUser(", t_id, ", 1, " , n / 2, ")", "✅");
		} else {
			console.debug("updateUser(", t_id, ", 1, " , n / 2, ")", "❌");
		}
	} catch (err) {
		console.debug("updateUser(", t_id, ", 1, " , n / 2, ")", "❌", err);
	}

	try {
		const arr: Array<{ user: int, position: int }> = TrnmntSrv.getUsers(t_id)
		console.debug("getUsers(", t_id, ")", "✅", arr);
	} catch (err) {
		console.debug("getUsers(", t_id, ")", "❌", err);
	}

	// ===== GAMES =====

	try {
		g_id = TrnmntSrv.createGame(0, 1, 2);
		if (g_id) {
			console.debug("createGame(0, 1, 2)", g_id, "✅", "No tournament");
		} else {
			console.debug("createGame(0, 1, 2)", "❌", "No tournament");
		}
	} catch (err) {
		console.debug("createGame(0, 1, 2)", "❌", "No tournament", err);
	}

	try {
		g_id = TrnmntSrv.createGame(t_id, 1, 2);
		if (g_id) {
			console.debug("createGame(", t_id, ", 1, 2)", g_id, "✅");
		} else {
			console.debug("createGame(", t_id, ", 1, 2)", "❌");	
		}
	} catch (err) {
		console.debug("createGame(", t_id, ", 1, 2)", "❌", err);
	}

	try {
		if (TrnmntSrv.updateGame(g_id, 1, 2)) {
			console.debug("updateGame(", g_id, ", 1, 2)", "✅");
		} else {
			console.debug("updateGame(", g_id, ", 1, 2)", "❌");
		}
	} catch (err) {
		console.debug("updateGame(", g_id, ", 1, 2)", "❌", err);
	}

	try {
		if (TrnmntSrv.updateGameScore(g_id, 1, 0)) {
			console.debug("updateGameScore(", g_id, ", 1, 0)", "✅");
		} else {
			console.debug("updateGameScore(", g_id, ", 1, 0)", "❌");
		}
	} catch (err) {
		console.debug("updateGameScore(", g_id, ", 1, 0)", "❌", err);
	}
}