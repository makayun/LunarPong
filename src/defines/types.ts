import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

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
	socket?: WebSocket
};

export type Game = {
	id: GUID,
	state: GameState,
	players: User[]
};

export type GameState =
	| "init"
	| "running"
	| "reset"
	| "over";

export type GameType =
	| "local"
	| "remote"
	| "AI";

export type PlayerInput = {
	type: "PlayerInput",
	user: User,
	game: Game,
	key: 'w' | 's' | 'ArrowUp' | 'ArrowDown'
};

export type MeshPositions = {
	type: "MeshPosition",
	game: Game,
	ball: Vector3,
	paddleLeft: Vector3,
	paddleRight: Vector3
};

export type InitMessage = {
	type: "WsInit",
	user: User
};

export type ChatMessage =
  | { type: 'register', user: User }
  | { type: 'message', to: User, content: string }
  | { type: 'block', user: User }
  | { type: 'unblock', user: User }
  | { type: 'invite', to: User; game?: GUID }
  | { type: 'notify', content: string }
  | { type: 'profile', user: User };

export type WSMessage =
	| InitMessage
	| PlayerInput
	| MeshPositions
	| ChatMessage;
