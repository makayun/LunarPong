import { AmmoJSPlugin }		from "@babylonjs/core/Physics/Plugins/ammoJSPlugin";
import { PhysicsImpostor }	from "@babylonjs/core/Physics/physicsImpostor";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { NullEngine }		from "@babylonjs/core/Engines/nullEngine";
import { Vector3 }			from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin }		from "@babylonjs/core/Physics/v2";
import HavokPhysics 		from "@babylonjs/havok";
import { PhysicsAggregate, PhysicsShapeType, PhysicsBody, IPhysicsCollisionEvent } from "@babylonjs/core/Physics";
import type { WebSocket } from "@fastify/websocket";
import "@babylonjs/core/Physics/physicsEngineComponent"

import { PongBaseScene }	from "./PongBaseScene";
import { generateGuid }		from "../helpers/helpers";
import type { User, Game, GUID } from "../defines/types";
import { AIOpponent } from "../back/aiOpponent";

const appDir: string = fs.realpathSync(process.cwd());
const havokPath = path.join(appDir, 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');
const havokWasmBuffer = fs.readFileSync(havokPath);
const havokWasm = havokWasmBuffer.buffer.slice(havokWasmBuffer.byteOffset, havokWasmBuffer.byteOffset + havokWasmBuffer.byteLength);


export class PongBackScene extends PongBaseScene implements Game {
    public id: GUID = generateGuid();
    public players: User[] = [];
    public startTime = new Date();
    public aiOpponent?: AIOpponent;

    private gameInternalState = {
        scoreLeft: 0,
        scoreRight: 0,
        // isPlaying: true,
        maxScore: 2,
        lastGoalTime: null as number | null
    };

	private ballAgg: any;
    private ballBody: any; // Временные типчики 🌟🌟🌟
    private groundBody: any;
    private edgeTopBody: any;
    private edgeBottomBody: any;
    private edgeLeftBody: any;
    private edgeRightBody: any;
    private paddleLeftBody: any;
    private paddleRightBody: any;

        private lastCollisionTime: number = 0;

    async enablePongPhysics(): Promise<void> {
        const havok = await HavokPhysics({ wasmBinary: havokWasm });
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

        this.groundBody = new PhysicsAggregate(this.pongMeshes.ground, PhysicsShapeType.BOX, { mass: 0, restitution: 1 }, this).body;
        this.edgeBottomBody = new PhysicsAggregate(this.pongMeshes.edgeBottom, PhysicsShapeType.BOX, { mass: 0, restitution: 1 }, this).body;
        this.edgeTopBody = new PhysicsAggregate(this.pongMeshes.edgeTop, PhysicsShapeType.BOX, { mass: 0, restitution: 1 }, this).body;
        this.edgeLeftBody = new PhysicsAggregate(this.pongMeshes.edgeLeft, PhysicsShapeType.BOX, { mass: 0, restitution: 1 }, this).body;
        this.edgeRightBody = new PhysicsAggregate(this.pongMeshes.edgeRight, PhysicsShapeType.BOX, { mass: 0, restitution: 1 }, this).body;
        this.paddleLeftBody = new PhysicsAggregate(this.pongMeshes.paddleLeft, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 1 }, this).body;
        this.paddleRightBody = new PhysicsAggregate(this.pongMeshes.paddleRight, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 1 }, this).body;

        this.resetBall(); // Используем resetBall и для начального импульса тоже!🌟🌟🌟

    }


  private setupCollisionHandling(): void {
    this.ballBody.setCollisionCallbackEnabled(true);
    const ballObserver = this.ballBody.getCollisionObservable();

    ballObserver.add((collisionEvent: IPhysicsCollisionEvent) => {
      const collidedAgainst = collisionEvent.collidedAgainst as PhysicsBody | null;
      const point = collisionEvent.point as Vector3 | null;

      if (!point || !collidedAgainst || collidedAgainst === this.groundBody)
        return;

      const now = Date.now();
       if (now - this.lastCollisionTime < 100) return;
       this.lastCollisionTime = now;

      if (collidedAgainst === this.edgeLeftBody || collidedAgainst === this.edgeRightBody) {

        if (collidedAgainst === this.edgeLeftBody)
          this.gameInternalState.scoreRight++;
        else
          this.gameInternalState.scoreLeft++;

	// this.resetBall();

        return;
    }

    const velocity = this.ballBody.getLinearVelocity();

    if (collidedAgainst === this.edgeTopBody || collidedAgainst === this.edgeBottomBody) {
        const newDir = new Vector3(velocity.x - point.x, 1, -point.z * 1.5);
      this.ballBody.applyImpulse(newDir, this.pongMeshes.ball.absolutePosition);
      return;
    }

    if (collidedAgainst === this.paddleLeftBody || collidedAgainst === this.paddleRightBody) {
      this.handlePaddleCollision(point, velocity);
      return;
    }
  });
}


  private resetBall(): void {
	  this.ballAgg?.dispose();
    this.pongMeshes.ball.position.set(0, 3, 0);
	  this.ballAgg = new PhysicsAggregate(this.pongMeshes.ball, PhysicsShapeType.SPHERE, { mass: 1 /*5*/, restitution: 0.95/*1*/ }, this);
	  this.ballBody = this.ballAgg.body;
    this.gameInternalState.lastGoalTime = Date.now();

    this.ballBody.setLinearVelocity(Vector3.Zero());
    this.ballBody.setAngularVelocity(Vector3.Zero());

    this.ballBody.setLinearDamping(0); // 🔥 Отключаем затухание
    this.ballBody.setAngularDamping(0);

	  this.setupCollisionHandling();

        const randomX = Math.random() > 0.5 ? 50 : -50;
        const randomZ = (Math.random() - 0.5) * 20;
        const impulse = new Vector3(randomX, 0, randomZ);

        this.ballBody.applyImpulse(impulse, this.pongMeshes.ball.absolutePosition);

}


    private handlePaddleCollision(point: Vector3, velocity: Vector3): void {
        const newDir = new Vector3(-point.x * 1.5, 1, velocity.z);
        this.ballBody.applyImpulse(newDir, this.pongMeshes.ball.absolutePosition);
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
