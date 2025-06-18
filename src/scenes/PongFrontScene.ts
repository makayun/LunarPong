import { HemisphericLight }	from "@babylonjs/core/Lights/hemisphericLight";
// import { DirectionalLight }	from "@babylonjs/core/Lights/directionalLight";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
// import { ShadowGenerator }	from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Engine }		from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

// import * as GUI from "@babylonjs/gui";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

import { Color3, HighlightLayer, Mesh } from "@babylonjs/core";


import { PongBaseScene } from "./PongBaseScene";
import { GUID, InitGameSuccess, MeshName, PlayerSide } from "../defines/types";

// import { ReflectionProbe } from "@babylonjs/core/Probes";
// import { PBRMaterial } from "@babylonjs/core/Materials/PBR";
// import { Constants } from "@babylonjs/core/Engines";
// import { Texture } from "@babylonjs/core/Materials/Textures/texture";
// import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
// import { GridMaterial } from "@babylonjs/materials";
// import { Color3 } from "@babylonjs/core/Maths";
// const grassTextureUrl: string = "/assets/grass.jpg";

export class PongFrontScene extends PongBaseScene {
	private light1: HemisphericLight;
	// private light2: DirectionalLight;
	// private shadows: ShadowGenerator;
	public id: GUID;
	public side: PlayerSide;
	public socket: WebSocket;

	private hl = new HighlightLayer("hl", this);

	private advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("ui1", true, this);
	private scoreLeft = createScoreBlock(this.advancedTexture, "left");
	private scoreRight = createScoreBlock(this.advancedTexture, "right");

	constructor (inEngine: Engine, opts: InitGameSuccess, inSocket: WebSocket) {
		super(inEngine);

		var helper = this.createDefaultEnvironment();
		helper?.setMainColor(Color3.Black());

		this.id = opts.gameId;
		this.side = opts.playerSide;
		this.socket = inSocket;

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === "ScoreUpdate" && Array.isArray(data.score)) {
				this.updateScore(data.score);
			} else {
				console.warn("Wrong WS message:", data);
			}
		};

		this.light1 = new HemisphericLight("light", new Vector3(0, 1, 0), this);
		this.light1.intensity = 0.5;

		// this.light2 = new DirectionalLight("light2", Vector3.Zero(), this);
		// this.light2.position = new Vector3(10, 30, 10);
		// this.light2.intensity = 0.5;

		// this.shadows = new ShadowGenerator(512, this.light2);
		// this.shadows.useBlurExponentialShadowMap = true;
		// this.shadows.blurScale = 2;
		// this.shadows.setDarkness(0.2);
		// this.shadows.getShadowMap()?.renderList?.push(
		// 	this.pongMeshes.ball,
		// 	this.pongMeshes.paddleLeft,
		// 	this.pongMeshes.paddleRight
		// );

		this.hl.blurHorizontalSize = 0.5;
		this.hl.blurVerticalSize = 0.5;
		this.meshes.forEach(mesh => {
			if (mesh.name !== "ground") {
				this.hl.addMesh(mesh as Mesh, Color3.Random());
				this.hl.setEffectIntensity(mesh, 0);
			}
		})
		// this.hl.addMesh(this.pongMeshes.ball, Color3.Random());
		// this.hl.setEffectIntensity(this.pongMeshes.ball, 0);
	}

	sendPlayerInput(_socket: WebSocket) {};

	updateScore(newScore: [number, number]) {
		this.score = newScore;

		this.scoreLeft.text = this.score[0].toString();
		this.scoreRight.text = this.score[1].toString();
	}

	animateHighlightIntensity(meshName: MeshName, duration = 500) {
		let time = 0;
		const max = 1.0;
		const mesh = this.getMeshByName(meshName);
		const ball = this.pongMeshes.ball;

		if (mesh) {
			const observer = this.onBeforeRenderObservable.add(() => {
				const engine = this.getEngine();
				const dt = engine.getDeltaTime();
				time += dt;
				const progress = time / duration;

				if (progress < 0.5) {
					this.hl.setEffectIntensity(mesh, max * (progress * 2));
					this.hl.setEffectIntensity(ball, max * (progress * 2));
				} else if (progress < 1.0) {
					this.hl.setEffectIntensity(mesh, max * (2 - progress * 2));
					this.hl.setEffectIntensity(ball, max * (2 - progress * 2));
				} else {
					this.hl.setEffectIntensity(mesh, 0);
					this.onBeforeRenderObservable.remove(observer);
				}
			});
		}
	}
}



function createScoreBlock(ui: AdvancedDynamicTexture, side: PlayerSide) : TextBlock {
	const rectangle = new Rectangle("score" + side);
	rectangle.width = 0.2;
	rectangle.height = 0.2;
	rectangle.cornerRadius = 20;
	rectangle.thickness = 3;
	rectangle.color = "White";
	rectangle.background = "rgb(57,61,71)";

	const sidePadding = 14;

	if (side === "left") {
		rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		rectangle.paddingLeft = sidePadding;
	}
	else {
		rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		rectangle.paddingRight = sidePadding;
	}

	rectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
	rectangle.paddingTop = 50;
	const scoreText = new TextBlock("scoreText" + side, "0");
	rectangle.addControl(scoreText);

	ui.addControl(rectangle);

	return scoreText;
}

