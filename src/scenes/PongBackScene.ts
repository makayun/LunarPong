import fs					from "node:fs";
import path					from "node:path";
import { NullEngine }		from "@babylonjs/core/Engines/nullEngine";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin }		from "@babylonjs/core/Physics/v2";
import HavokPhysics 		from "@babylonjs/havok";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core/Physics";
import "@babylonjs/core/Physics/physicsEngineComponent"
import type { WebSocket } from "@fastify/websocket";

import { PongBaseScene }	from "./PongBaseScene";
import { generateGuid }		from "../helpers/helpers";
import type { User, Game, GUID } from "../defines/types";


const appDir: string = fs.realpathSync(process.cwd());
const havokPath = path.join(appDir, 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');
const havokWasmBuffer = fs.readFileSync(havokPath);
const havokWasm = havokWasmBuffer.buffer.slice(havokWasmBuffer.byteOffset, havokWasmBuffer.byteOffset + havokWasmBuffer.byteLength);


export class PongBackScene extends PongBaseScene implements Game {
	public id: GUID = generateGuid();
	public players: User[] = [];

	async enablePongPhysics(): Promise<void> {
		const havok = await HavokPhysics({wasmBinary: havokWasm});
		const physics = new HavokPlugin(true, havok);
		this.enablePhysics(new Vector3(0, -9.81, 0), physics);

		const ballBody = new PhysicsAggregate(this.pongMeshes.ball, PhysicsShapeType.SPHERE, { mass: 2, restitution: 1}, this).body;
		new PhysicsAggregate(this.pongMeshes.ground, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);
		new PhysicsAggregate(this.pongMeshes.edgeBottom, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);
		new PhysicsAggregate(this.pongMeshes.edgeTop, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);
		new PhysicsAggregate(this.pongMeshes.edgeLeft, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);
		new PhysicsAggregate(this.pongMeshes.edgeRight, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);

		new PhysicsAggregate(this.pongMeshes.paddleLeft, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 1 }, this).body;
		new PhysicsAggregate(this.pongMeshes.paddleRight, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 1 }, this);

		ballBody.applyForce(new Vector3(1000,0,0), this.pongMeshes.ball.absolutePosition);

		// ballBody.setCollisionCallbackEnabled(true);
		// let ballObserver = ballBody.getCollisionObservable();

		// ballObserver.add((collisionEvent) => {
		// 	if (collisionEvent.collider === paddleRightBody ||
		// 		collisionEvent.collidedAgainst === paddleRightBody) {
		// 			ballBody.applyForce(new Vector3(-1000, 0, 0), this.pongMeshes.ball.absolutePosition);
		// 		}
		// })
	}
}

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
