import { HemisphericLight }	from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight }	from "@babylonjs/core/Lights/directionalLight";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { ShadowGenerator }	from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Engine }		from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

import * as GUI from "@babylonjs/gui";

import { PongBaseScene } from "./PongBaseScene";
import { GUID, InitGameSuccess, PlayerSide } from "../defines/types";
// import { ReflectionProbe } from "@babylonjs/core/Probes";
// import { PBRMaterial } from "@babylonjs/core/Materials/PBR";
// import { Constants } from "@babylonjs/core/Engines";
// import { Texture } from "@babylonjs/core/Materials/Textures/texture";
// import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
// import { GridMaterial } from "@babylonjs/materials";
// import { Color3 } from "@babylonjs/core/Maths";
// const grassTextureUrl: string = "/assets/grass.jpg";

export class PongFrontScene extends PongBaseScene {
	public light1: HemisphericLight;
	public light2: DirectionalLight;
	public shadows: ShadowGenerator;
	public id: GUID;
	public side: PlayerSide;
	public socket: WebSocket;

	private advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1", true, this);
	public scoreLeft = createScoreBlock(this.advancedTexture, "left");
	public scoreRight = createScoreBlock(this.advancedTexture, "right");

	constructor (inEngine: Engine, opts: InitGameSuccess, inSocket: WebSocket) {
		super(inEngine);

		this.id = opts.gameId;
		this.side = opts.playerSide;
		this.socket = inSocket;

		this.light1 = new HemisphericLight("light", new Vector3(0, 1, 0), this);
		this.light1.intensity = 0.5;

		this.light2 = new DirectionalLight("light2", Vector3.Zero(), this);
		this.light2.position = new Vector3(10, 30, 10);
		this.light2.intensity = 0.5;

		this.shadows = new ShadowGenerator(512, this.light2);
		this.shadows.useBlurExponentialShadowMap = true;
		this.shadows.blurScale = 2;
		this.shadows.setDarkness(0.2);
		this.shadows.getShadowMap()?.renderList?.push(
			this.pongMeshes.ball,
			this.pongMeshes.paddleLeft,
			this.pongMeshes.paddleRight
		);
	}

	sendPlayerInput(_socket: WebSocket) {};

	updateScore(newScore: [number, number]) {
		this.score = newScore;

		this.scoreLeft.text = this.score[0].toString();
		this.scoreRight.text = this.score[1].toString();
	}
}


function createScoreBlock(ui: GUI.AdvancedDynamicTexture, side: PlayerSide) : GUI.TextBlock {
	const rectangle = new GUI.Rectangle("score" + side);
	rectangle.width = 0.2;
	rectangle.height = 0.2;
	rectangle.cornerRadius = 20;
	rectangle.thickness = 3;
	rectangle.color = "rgb(57,61,71)";
	rectangle.background = "rgb(77, 234, 255)";

	rectangle.horizontalAlignment = side === "left"
		? GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
		: GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;

	rectangle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

	const scoreText = new GUI.TextBlock("scoreText" + side, "0");
	rectangle.addControl(scoreText);

	ui.addControl(rectangle);

	return scoreText;
}

