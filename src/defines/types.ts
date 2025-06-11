import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { WebSocket  } from "@fastify/websocket";


export type GameType =
	| "Local game"
	| "Remote game"
	| "Versus AI";

export type MeshName =
	| "ground"
	| "ball"
	| "paddleLeft"
	| "paddleRight"
	| "edgeLeft"
	| "edgeRight"
	| "edgeTop"
	| "edgeBottom";

export type MeshesDict = {
	ground: Mesh,
	ball: Mesh,
	paddleLeft: Mesh,
	paddleRight: Mesh,
	edgeLeft: Mesh,
	edgeRight: Mesh,
	edgeTop: Mesh,
	edgeBottom: Mesh
};

export type GUID = string & { __brand: "GUID" };

export type User = {
	id: GUID,
	gameId?: GUID,
	nick?: string,
	gameSocket?: WebSocket,
	chatSocket?: WebSocket,
	blocked?: Set<GUID>
};

export type PlayerSide = "left" | "right";

export interface Game {
	id: GUID;
	state: GameState;
	players: User[];
	type?: GameType;
}

export type GameState =
	| "init"
	| "running"
	| "reset"
	| "over";

//!!! EVERY WEBSOCKET MESSAGE TYPE MUST CONTAIN A 'type' FIELD !!!

export type PlayerInput = {
	type: "PlayerInput",
	gameId: GUID,
	side: PlayerSide,
	direction: -1 | 0 | 1
};

export type MeshPositions = {
	type: "MeshPositions",
	// game: Game,
	ball: Vector3,
	paddleLeft: Vector3,
	paddleRight: Vector3
};

export type InitGameRequest = {
	type: "InitGameRequest",
	gameType: GameType,
	user: User
};

export type InitGameSuccess = {
	type: "InitGameSuccess",
	gameType: GameType,
	gameId: GUID,
	gameState: GameState,
	playerSide: "left" | "right",
}

export type ChatMessage =
  | { type: 'register', user: User }
  | { type: 'message', to: User, content: string }
  | { type: 'broadcast', content: string } // 🐬 dobavila etu stroku
  | { type: 'block', user: User }
  | { type: 'unblock', user: User }
  | { type: 'invite', to: User; game?: GUID }
  | { type: 'notify', content: string }
  | { type: 'profile', user: User };

export type WSMessage =
	| PlayerInput
	| MeshPositions
	| ChatMessage
	| InitGameRequest
	| InitGameSuccess;
