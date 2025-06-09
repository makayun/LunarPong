import fs					from "node:fs";
import path					from "node:path";
import { NullEngine }		from "@babylonjs/core/Engines/nullEngine";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin }		from "@babylonjs/core/Physics/v2";
import HavokPhysics 		from "@babylonjs/havok";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core/Physics";
import type { WebSocket } from "@fastify/websocket";
import "@babylonjs/core/Physics/physicsEngineComponent"

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
		physics.setVelocityLimits(20, 20);
		this.enablePhysics(new Vector3(0, -9.81, 0), physics);

		const scalingVec = new Vector3(1, 20, 1);
		this.pongMeshes.ground.scaling = scalingVec;
		this.pongMeshes.paddleLeft.scaling = scalingVec;
		this.pongMeshes.paddleRight.scaling = scalingVec;
		this.pongMeshes.edgeTop.scaling = scalingVec;
		this.pongMeshes.edgeBottom.scaling = scalingVec;
		this.pongMeshes.edgeLeft.scaling = scalingVec;
		this.pongMeshes.edgeRight.scaling = scalingVec;

		const ballBody = new PhysicsAggregate(this.pongMeshes.ball, PhysicsShapeType.SPHERE, { mass: 5, restitution: 1}, this).body;
		const groundBody = new PhysicsAggregate(this.pongMeshes.ground, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this).body;
		const edgeBottomBody = new PhysicsAggregate(this.pongMeshes.edgeBottom, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this).body;
		const edgeTopBody = new PhysicsAggregate(this.pongMeshes.edgeTop, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this).body;
		new PhysicsAggregate(this.pongMeshes.edgeLeft, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);
		new PhysicsAggregate(this.pongMeshes.edgeRight, PhysicsShapeType.BOX, { mass: 0, restitution: 1}, this);

		new PhysicsAggregate(this.pongMeshes.paddleLeft, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 1 }, this);
		new PhysicsAggregate(this.pongMeshes.paddleRight, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 1 }, this);

		ballBody.applyImpulse(new Vector3(50,0,-10), this.pongMeshes.ball.absolutePosition);

		ballBody.setCollisionCallbackEnabled(true);
		let ballObserver = ballBody.getCollisionObservable();

		ballObserver.add((collisionEvent) => {
			const { collidedAgainst, point } = collisionEvent;
			if (collidedAgainst === groundBody || !point)
				return;

			const velocity = ballBody.getLinearVelocity();
			let newDir = new Vector3(0, 1, 0);

			if (collidedAgainst === edgeTopBody || collidedAgainst === edgeBottomBody) {
				newDir.z = -point.z * 1.5;
				newDir.x = velocity.x - point.x;
			}
			else {
				newDir.z = velocity.z;
				newDir.x = -point.x * 1.5;
			}

			ballBody.applyImpulse(newDir, this.pongMeshes.ball.absolutePosition);
		});
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

import type { MeshPositions } from "../defines/types";

export function startRenderLoop(engine: PongBackEngine) {
	engine.runRenderLoop(() => {
		engine.scenes.forEach(scene => scene.render());

		engine.scenes.forEach(scene => {
			const posMessage: MeshPositions = {
				type: "MeshPositions",
				ball: scene.pongMeshes.ball.position,
				paddleLeft: scene.pongMeshes.paddleLeft.position,
				paddleRight: scene.pongMeshes.paddleRight.position
			};

			scene.players.forEach(player => {
				player.gameSocket?.send(JSON.stringify(posMessage));
			});
		});
	});
}
