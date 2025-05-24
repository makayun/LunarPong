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

const ammoReadyPromise = Ammo();

export class PongBackEngine extends NullEngine {
	override scenes: PongBackScene[] = [];

	public removePlayerBySocket(socket: WebSocket) {
		this.scenes.forEach(scene => {
			scene.players = scene.players.filter(player => player.socket !== socket);
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
	preTasks = [ammoReadyPromise];

	public id: GUID = generateGuid();
	public players: User[] = [];

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
