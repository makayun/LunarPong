import { CreateGround,
		CreateSphere,
		CreateCapsule,
		CreateBox } 			from "@babylonjs/core/Meshes/Builders";
import { Scene }				from "@babylonjs/core/scene";
import { Vector3 }				from "@babylonjs/core/Maths/math.vector";
import type { AbstractEngine }	from "@babylonjs/core/Engines/abstractEngine";

import {
	GROUND_WIDTH,
	GROUND_HEIGHT,
	PADDLE_RADIUS,
	EDGE_HEIGHT,
	PADDLE_POS_X,
	TB_EDGES_POS_Z,
	LR_EDGES_POS_X
}	from "../defines/constants";

import type {
	MeshesDict,
	MeshName,
	GameState
}	from "../defines/types";


export class PongBaseScene {
	public engine: AbstractEngine;
	public scene: Scene;
	public meshes: MeshesDict;
	public state: GameState;

	constructor (inEngine: AbstractEngine) {
		this.state = "init";
		this.engine = inEngine;
		this.scene = new Scene(this.engine);

		this.meshes = {
			ground: pongGround(this.scene),
			ball: pongBall(this.scene),
			paddleLeft: pongPaddle("paddleLeft", this.scene),
			paddleRight: pongPaddle("paddleRight", this.scene),
			edgeLeft: pongEdge("edgeLeft", this.scene),
			edgeRight: pongEdge("edgeRight", this.scene),
			edgeTop: pongEdge("edgeTop", this.scene),
			edgeBottom: pongEdge("edgeBottom", this.scene)
		}

		this.meshes.ball.position.y = 5;
		this.meshes.paddleLeft.position.set(-PADDLE_POS_X, 0.3, 0);
		this.meshes.paddleRight.position.set(PADDLE_POS_X, 0.3, 0);
		this.meshes.edgeTop.position.z = -TB_EDGES_POS_Z;
		this.meshes.edgeBottom.position.z = TB_EDGES_POS_Z;
		this.meshes.edgeLeft.position.x = -LR_EDGES_POS_X;
		this.meshes.edgeRight.position.x = LR_EDGES_POS_X;
	}
}

function pongGround(scene: Scene) : MeshesDict["ground"] {
	return CreateGround(
			"ground" as MeshName,
			{ width: GROUND_WIDTH, height: GROUND_HEIGHT },
			scene);
}

function pongBall(scene: Scene) : MeshesDict["ball"] {
	return CreateSphere(
			"ball" as MeshName,
			{ diameter: 1, segments: 32},
			scene);
}

function pongPaddle(inName: MeshName, scene: Scene) : MeshesDict["paddleLeft"] | MeshesDict["paddleRight"] {
	return CreateCapsule(
			inName,
			{ radius: PADDLE_RADIUS,
			height: 3,
			capSubdivisions: 6,
			subdivisions: 6,
			tessellation: 36,
			orientation: Vector3.Forward() },
			scene);
}

function pongEdge(inName: MeshName, scene: Scene) {
	const isHorizontal: boolean = inName === "edgeTop" || inName === "edgeBottom";

	const inWidth: number = isHorizontal ? GROUND_WIDTH : EDGE_HEIGHT;
	const inHeight = EDGE_HEIGHT;
	const inDepth: number = isHorizontal ? EDGE_HEIGHT : GROUND_HEIGHT + EDGE_HEIGHT * 2;

	return CreateBox(inName, {
			width: inWidth,
			height: inHeight,
			depth: inDepth },
			scene);
}
