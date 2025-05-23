import { AmmoJSPlugin }		from "@babylonjs/core/Physics/Plugins/ammoJSPlugin";
import { PhysicsImpostor }	from "@babylonjs/core/Physics/physicsImpostor";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import Ammo					from "ammojs-typed";
import "@babylonjs/core/Physics/physicsEngineComponent"

import { PongBaseScene }	from "./PongBaseScene";

const ammoReadyPromise = Ammo();

export class PongBackScene extends PongBaseScene {
	preTasks = [ammoReadyPromise];

	async enablePongPhysics(): Promise<void> {
		const ammo = await ammoReadyPromise;
		const physics = new AmmoJSPlugin(true, ammo);
		this.enablePhysics(new Vector3(0, -9.81, 0), physics);

		this.pongMeshes.ball.physicsImpostor = new PhysicsImpostor(
			this.pongMeshes.ball,
			PhysicsImpostor.SphereImpostor,
			{ mass: 2, restitution: 0.8 },
			this
		);

		this.pongMeshes.ground.physicsImpostor = new PhysicsImpostor(
			this.pongMeshes.ground,
			PhysicsImpostor.BoxImpostor,
			{ mass: 0, restitution: 0.6 },
			this
		);
	}
}
