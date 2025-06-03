// import { AmmoJSPlugin }		from "@babylonjs/core/Physics";
// import { PhysicsImpostor }	from "@babylonjs/core/Physics/physicsImpostor";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { NullEngine }		from "@babylonjs/core/Engines/nullEngine";
// import Ammo					from "ammojs-typed";
import "@babylonjs/core/Physics/physicsEngineComponent"

import { PongBaseScene }	from "./PongBaseScene";
import { generateGuid }		from "../helpers/helpers";
import type { User, Game, GUID } from "../defines/types";
import { WebSocket } from "@fastify/websocket";
// import { Mesh } from "@babylonjs/core";

import { HavokPlugin, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

import fs								from "node:fs";
import path								from "node:path";


const appDir: string = fs.realpathSync(process.cwd());
const havokPath = path.join(appDir, 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');
const havokWasmBuffer = fs.readFileSync(havokPath);
const havokWasm = havokWasmBuffer.buffer.slice(havokWasmBuffer.byteOffset, havokWasmBuffer.byteOffset + havokWasmBuffer.byteLength);

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
		// const ammo = await Ammo();
		// const physics = new AmmoJSPlugin(true, ammo);
		const havok = await HavokPhysics({wasmBinary: havokWasm});
		const physics = new HavokPlugin(true, havok);
		this.enablePhysics(new Vector3(0, -9.81, 0), physics);

		// new BABYLON.PhysicsAggregate(sphere, BABYLON.PhysicsShapeType.SPHERE, { mass: 1, friction: 0.2, restitution: 0.3 }, scene);

		new PhysicsAggregate(this.pongMeshes.ball, PhysicsShapeType.SPHERE, { mass: 2, restitution: 1}, this);
		new PhysicsAggregate(this.pongMeshes.ground, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);

		// this.pongMeshes.ball.physicsImpostor = new PhysicsImpostor(
		// 	this.pongMeshes.ball,
		// 	PhysicsImpostor.SphereImpostor,
		// 	{ mass: 2, restitution: 1 },
		// 	this
		// );

		// this.createBoxImpostor(this.pongMeshes.ground);
		// this.createBoxImpostor(this.pongMeshes.edgeBottom);
		// this.createBoxImpostor(this.pongMeshes.edgeTop);
		// this.createBoxImpostor(this.pongMeshes.edgeLeft);
		// this.createBoxImpostor(this.pongMeshes.edgeRight);

		// this.createCapsuleImpostor(this.pongMeshes.paddleLeft);
		// this.createCapsuleImpostor(this.pongMeshes.paddleRight);

		// this.pongMeshes.ball.physicsImpostor.applyForce(new Vector3(1000, 0, 0), this.pongMeshes.ball.absolutePosition);
	}

	// private createBoxImpostor(inMesh: Mesh) : void {
	// 	inMesh.physicsImpostor = new PhysicsImpostor(
	// 		inMesh,
	// 		PhysicsImpostor.BoxImpostor,
	// 		{ mass: 0, restitution: 1 },
	// 		this
	// 	)
	// }

	// private createCapsuleImpostor(inMesh: Mesh) : void {
	// 	inMesh.physicsImpostor = new PhysicsImpostor(
	// 		inMesh,
	// 		PhysicsImpostor.CapsuleImpostor,
	// 		{ mass: 0, restitution: 1 },
	// 		this
	// 	)
	// }
}

