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

import { HighlightLayer, Mesh } from "@babylonjs/core";


import { PongBaseScene } from "./PongBaseScene";
import type { GUID, MeshName, PlayerSide } from "../defines/types";

// import { ReflectionProbe } from "@babylonjs/core/Probes";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR";
// import { Constants } from "@babylonjs/core/Engines";
// import { Texture } from "@babylonjs/core/Materials/Textures/texture";
// import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
// import { GridMaterial } from "@babylonjs/materials";
import { Color3 } from "@babylonjs/core/Maths";
// const grassTextureUrl: string = "/assets/grass.jpg";

import { GLOW_MAX, GLOW_MIN } from "../defines/constants";

export class PongFrontScene extends PongBaseScene {
	public id?: GUID;
	public side?: PlayerSide;
	public socket: WebSocket = new WebSocket(`wss://${window.location.host}/ws-page`);

	private hl = new HighlightLayer("hl", this);

	private advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("ui1", true, this);
	private scoreLeft = createScoreBlock(this.advancedTexture, "left");
	private scoreRight = createScoreBlock(this.advancedTexture, "right");

	constructor (inEngine: Engine) {
		super(inEngine);

		var helper = this.createDefaultEnvironment({ createSkybox: false });
		helper?.setMainColor(Color3.Black());

		const light = new HemisphericLight("light", new Vector3(0, 1, 0), this);
		light.intensity = 0.8;
		light.groundColor = Color3.Magenta();

		const metalBlack = new PBRMaterial("metalBlack", this);
		metalBlack.albedoColor = Color3.Black();
		metalBlack.roughness = 0.5;
		metalBlack.metallic = 0.3;
		this.pongMeshes.ground.material = metalBlack;
		this.pongMeshes.edgeBottom.material = metalBlack;
		this.pongMeshes.edgeTop.material = metalBlack;
		this.pongMeshes.edgeLeft.material = metalBlack;
		this.pongMeshes.edgeRight.material = metalBlack;

		const metalWhite = metalBlack.clone("metalBlack");
		metalWhite.albedoColor = Color3.White();
		this.pongMeshes.ball.material = metalWhite;
		this.pongMeshes.paddleLeft.material = metalWhite;
		this.pongMeshes.paddleRight.material = metalWhite;

		const purple = Color3.FromInts(178, 50, 250);
		const green = Color3.FromInts(77, 230, 47);
		const white = Color3.White()
		this.hl.blurHorizontalSize = 0.5;
		this.hl.blurVerticalSize = 0.5;

		this.hl.addMesh(this.pongMeshes.edgeLeft, purple);
		this.hl.addMesh(this.pongMeshes.edgeTop, purple);
		this.hl.addMesh(this.pongMeshes.edgeRight, green);
		this.hl.addMesh(this.pongMeshes.edgeBottom, green);

		this.hl.addMesh(this.pongMeshes.ball, white);
		this.hl.addMesh(this.pongMeshes.paddleLeft, white);
		this.hl.addMesh(this.pongMeshes.paddleRight, white);

		const back = this.getMeshByName("BackgroundPlane");
		if (back)
			this.hl.addMesh(back as Mesh, white);

		this.meshes.forEach(mesh => {
			if (mesh.name as MeshName !== "ground" && this.hl.hasMesh(mesh))
				this.hl.setEffectIntensity(mesh, GLOW_MIN);
		})
	}

	sendPlayerInput(_socket: WebSocket) {};

	updateScore(newScore: [number, number]) {
		this.score = newScore;

		this.scoreLeft.text = this.score[0].toString();
		this.scoreRight.text = this.score[1].toString();
	}

	animateHighlightIntensity(meshName: MeshName, duration = 500) {
		let time = 0;
		const mesh = this.getMeshByName(meshName);
		const ball = this.pongMeshes.ball;

		if (mesh) {
			const observer = this.onBeforeRenderObservable.add(() => {
				const engine = this.getEngine();
				const dt = engine.getDeltaTime();
				time += dt;
				const progress = time / duration;

				if (progress < 0.5) {
					const t = progress * 2;
					const intensity = GLOW_MIN + (GLOW_MAX - GLOW_MIN) * t;
					this.hl.setEffectIntensity(mesh, intensity);
					this.hl.setEffectIntensity(ball, intensity);
				} else if (progress < 1.0) {
					const t = (progress - 0.5) * 2;
					const intensity = GLOW_MAX - (GLOW_MAX - GLOW_MIN) * t;
					this.hl.setEffectIntensity(mesh, intensity);
					this.hl.setEffectIntensity(ball, intensity);
				} else {
					this.hl.setEffectIntensity(mesh, GLOW_MIN);
					this.hl.setEffectIntensity(ball, GLOW_MIN);
					this.onBeforeRenderObservable.remove(observer);
				}
			});
		}
	}
}

function createScoreBlock(ui: AdvancedDynamicTexture, side: PlayerSide) : TextBlock {
	const rectangle = new Rectangle("score" + side);
	rectangle.width = 0.2;
	rectangle.height = "60px";
	rectangle.cornerRadius = 20;
	rectangle.thickness = 3;
	rectangle.color = "White";
	rectangle.background = "rgb(57,61,71)";

	const padding = 14;

	if (side === "left") {
		rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		rectangle.paddingLeft = padding;
	}
	else {
		rectangle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		rectangle.paddingRight = padding;
	}

	rectangle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
	rectangle.paddingTop = padding;
	const scoreText = new TextBlock("scoreText" + side, "0");
	rectangle.addControl(scoreText);

	ui.addControl(rectangle);

	return scoreText;
}



