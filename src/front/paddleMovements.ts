import { Animation }		from "@babylonjs/core/Animations";
import type { Mesh }		from "@babylonjs/core/Meshes";
import type { Scene }		from "@babylonjs/core/scene";

import { PADDLE_MIN_Z,
		PADDLE_MAX_Z,
		FPS,
		STEP }				from "../defines/constants";
import type { MeshesDict }	from "../defines/types";

function clampPaddleX(x: number): number {
	return Math.max(PADDLE_MIN_Z, Math.min(PADDLE_MAX_Z, x));
}

function animatePaddleToX(mesh: Mesh, targetX: number, duration: number = 200): void {
	const animation = new Animation(
		"paddleMove",
		"position.z",
		FPS,
		Animation.ANIMATIONTYPE_FLOAT,
		Animation.ANIMATIONLOOPMODE_CONSTANT
	);

	const x = clampPaddleX(targetX);

	const keys = [
		{ frame: 0, value: mesh.position.z },
		{ frame: FPS * (duration / 1000), value: x }
	];

	animation.setKeys(keys);
	mesh.animations = [animation];
	mesh.getScene().beginAnimation(mesh, 0, keys[keys.length - 1].frame, false);
}

export function paddleMovement(scene: Scene, meshes: MeshesDict) : void {
	window.onkeydown = (ev) => {
		if (ev.repeat) return;
		let paddle: Mesh;

		switch (ev.key) {
			case 'w':
				paddle = meshes.paddleLeft;
				scene.stopAnimation(paddle);
				animatePaddleToX(paddle, paddle.position.z + STEP);
				break;
			case 's':
				paddle = meshes.paddleLeft;
				scene.stopAnimation(paddle);
				animatePaddleToX(paddle, paddle.position.z - STEP);
				break;
			case 'ArrowUp':
				paddle = meshes.paddleRight;
				scene.stopAnimation(paddle);
				animatePaddleToX(paddle, paddle.position.z + STEP);
				break;
			case 'ArrowDown':
				paddle = meshes.paddleRight;
				scene.stopAnimation(paddle);
				animatePaddleToX(paddle, paddle.position.z - STEP);
				break;
		};
	}
}
