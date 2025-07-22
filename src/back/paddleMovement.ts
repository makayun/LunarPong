import { Animation }		from "@babylonjs/core/Animations";
import type { Mesh }		from "@babylonjs/core/Meshes";

import { PADDLE_MIN_Z,
		PADDLE_MAX_Z,
		FPS }				from "../defines/constants";

function clampPaddleX(z: number): number {
	return Math.max(PADDLE_MIN_Z, Math.min(PADDLE_MAX_Z, z));
}

export function animatePaddleToX(mesh: Mesh, targetZ: number, duration: number = 200): void {
	const animation = new Animation(
		"paddleMove",
		"position.z",
		FPS,
		Animation.ANIMATIONTYPE_FLOAT,
		Animation.ANIMATIONLOOPMODE_CONSTANT
	);

	const z = clampPaddleX(targetZ);

	const keys = [
		{ frame: 0, value: mesh.position.z },
		{ frame: FPS * (duration / 1000), value: z }
	];

	animation.setKeys(keys);
	mesh.animations = [animation];
	mesh.getScene().beginAnimation(mesh, 0, keys[keys.length - 1].frame, false);
}
