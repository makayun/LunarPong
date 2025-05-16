import type { Mesh } from "@babylonjs/core/Meshes/mesh";

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
