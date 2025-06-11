import { CreateGround,
		CreateSphere,
		CreateCapsule,
		CreateBox } 			from "@babylonjs/core/Meshes/Builders";
import { Scene }				from "@babylonjs/core/scene";
import { Vector3 }				from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera }		from "@babylonjs/core/Cameras/arcRotateCamera";
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



export class PongBaseScene extends Scene {
	public camera: ArcRotateCamera;
	public pongMeshes: MeshesDict;
	public state: GameState;

	constructor (inEngine: AbstractEngine) {
		super(inEngine);
		this.state = "init";

		this.pongMeshes = {
			ground: this.pongGround(),
			ball: this.pongBall(),
			paddleLeft: this.pongPaddle("paddleLeft"),
			paddleRight: this.pongPaddle("paddleRight"),
			edgeLeft: this.pongEdge("edgeLeft"),
			edgeRight: this.pongEdge("edgeRight"),
			edgeTop: this.pongEdge("edgeTop"),
			edgeBottom: this.pongEdge("edgeBottom")
		}

		this.pongMeshes.ball.position.y = 5;
		this.pongMeshes.paddleLeft.position.set(-PADDLE_POS_X, 0.3, 0);
		this.pongMeshes.paddleRight.position.set(PADDLE_POS_X, 0.3, 0);
		this.pongMeshes.edgeTop.position.z = -TB_EDGES_POS_Z;
		this.pongMeshes.edgeBottom.position.z = TB_EDGES_POS_Z;
		this.pongMeshes.edgeLeft.position.x = -LR_EDGES_POS_X;
		this.pongMeshes.edgeRight.position.x = LR_EDGES_POS_X;

		this.camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 5, 0, Vector3.Zero(), this);
		this.camera.zoomOnFactor = 1;
		this.camera.zoomOn([this.pongMeshes.ground, this.pongMeshes.edgeLeft, this.pongMeshes.edgeRight]);
	}

	private pongGround() : MeshesDict["ground"] {
		return CreateGround(
				"ground" as MeshName,
				{ width: GROUND_WIDTH, height: GROUND_HEIGHT },
				this);
	}

	private pongBall() : MeshesDict["ball"] {
		return CreateSphere(
				"ball" as MeshName,
				{ diameter: 1, segments: 32},
				this);
	}

	private pongPaddle(inName: MeshName) : MeshesDict["paddleLeft"] | MeshesDict["paddleRight"] {
		return CreateCapsule(
				inName,
				{ radius: PADDLE_RADIUS,
				height: 3,
				capSubdivisions: 6,
				subdivisions: 6,
				tessellation: 36,
				orientation: Vector3.Forward() },
				this);
	}

	private pongEdge(inName: MeshName) {
		const isHorizontal: boolean = inName === "edgeTop" || inName === "edgeBottom";

		const inWidth: number = isHorizontal ? GROUND_WIDTH : EDGE_HEIGHT;
		const inHeight = EDGE_HEIGHT;
		const inDepth: number = isHorizontal ? EDGE_HEIGHT : GROUND_HEIGHT + EDGE_HEIGHT * 2;

		return CreateBox(inName, {
				width: inWidth,
				height: inHeight,
				depth: inDepth },
				this);
	}
}
