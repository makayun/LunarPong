import { AmmoJSPlugin }		from "@babylonjs/core/Physics/Plugins/ammoJSPlugin";
import { PhysicsImpostor }	from "@babylonjs/core/Physics/physicsImpostor";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { NullEngine }		from "@babylonjs/core/Engines/nullEngine";
import Ammo					from "ammojs-typed";
import "@babylonjs/core/Physics/physicsEngineComponent"

import { PongBaseScene }	from "./PongBaseScene";
import { generateGuid }		from "../helpers/helpers";
import type { User, Game, GUID } from "../defines/types";
import { WebSocket } from "@fastify/websocket";
import { Mesh } from "@babylonjs/core";

export class PongBackEngine extends NullEngine {
	override scenes: PongBackScene[] = [];

	public removePlayerBySocket(socket: WebSocket) {
		this.scenes.forEach(scene => {
			scene.players = scene.players.filter(player => player.gameSocket !== socket);
		});
	}

	public removeEmptyScenes() {
		this.scenes = this.scenes.filter(scene => {
			if (scene.players.length === 0) {
				scene.dispose();
				return false;
			}
			return true;
		})
	}
}

export class PongBackScene extends PongBaseScene implements Game {
	public id: GUID = generateGuid();
	public players: User[] = [];

	async enablePongPhysics(): Promise<void> {
		const ammo = await Ammo();
		const physics = new AmmoJSPlugin(true, ammo);
		this.enablePhysics(new Vector3(0, -9.81, 0), physics);

		this.pongMeshes.ball.physicsImpostor = new PhysicsImpostor(
			this.pongMeshes.ball,
			PhysicsImpostor.SphereImpostor,
			{ mass: 2, restitution: 1 },
			this
		);

		this.createBoxImpostor(this.pongMeshes.ground);
		this.createBoxImpostor(this.pongMeshes.edgeBottom);
		this.createBoxImpostor(this.pongMeshes.edgeTop);
		this.createBoxImpostor(this.pongMeshes.edgeLeft);
		this.createBoxImpostor(this.pongMeshes.edgeRight);

		// this.createCapsuleImpostor(this.pongMeshes.paddleLeft);
		// this.createCapsuleImpostor(this.pongMeshes.paddleRight);

		this.pongMeshes.ball.physicsImpostor.applyForce(new Vector3(1000, 0, 0), this.pongMeshes.ball.absolutePosition);
	}

	private createBoxImpostor(inMesh: Mesh) : void {
		inMesh.physicsImpostor = new PhysicsImpostor(
			inMesh,
			PhysicsImpostor.BoxImpostor,
			{ mass: 0, restitution: 1 },
			this
		)
	}

	// private createCapsuleImpostor(inMesh: Mesh) : void {
	// 	inMesh.physicsImpostor = new PhysicsImpostor(
	// 		inMesh,
	// 		PhysicsImpostor.CapsuleImpostor,
	// 		{ mass: 0, restitution: 1 },
	// 		this
	// 	)
	// }
}

