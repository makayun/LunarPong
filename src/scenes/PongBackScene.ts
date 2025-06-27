import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import type { WebSocket } from "@fastify/websocket";
import { PongBaseScene } from "./PongBaseScene";
import { generateGuid } from "../helpers/helpers";
import type { User, Game, GUID, MeshPositions, GameState, GameOver } from "../defines/types";
import { AIOpponent } from "../back/aiOpponent";
import type { ScoreUpdate, MeshName, BallCollision } from "../defines/types";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
// import { endGameLog } from "../back/db";

export class PongBackScene extends PongBaseScene implements Game {
    public id: GUID = generateGuid();
    public players: User[] = [];
    public startTime = new Date();
    public aiOpponent?: AIOpponent;
    private ballVelocity: Vector3 = new Vector3(10, 0, -2);
    private ballSpeed: number = 18;
    private isFalling: boolean = false;
    public gameState: GameState = "init"; // state

    private fieldWidth: number;
    private fieldHeight: number;
    private paddleWidth: number;
    private paddleHeight: number;

    constructor(engine: AbstractEngine) {
        super(engine);
        const groundBounds = this.pongMeshes.ground.getBoundingInfo().boundingBox;
        this.fieldWidth = groundBounds.maximum.x - groundBounds.minimum.x;
        this.fieldHeight = groundBounds.maximum.z - groundBounds.minimum.z;
        const paddleBounds = this.pongMeshes.paddleLeft.getBoundingInfo().boundingBox;
        this.paddleWidth = paddleBounds.maximum.x - paddleBounds.minimum.x;
        this.paddleHeight = paddleBounds.maximum.z - paddleBounds.minimum.z;
    }

    enablePongPhysics(): void {
        this.pongMeshes.ball.position = new Vector3(0, 25, 0); // 💥средняя цифра - высота на старте. меняем как хотим)
        this.isFalling = true;
        this.gameState = "running"; // state
        this.onBeforeRenderObservable.add(() => {
            this.updateBall();
        });
    }

    private updateBall(): void {
        const deltaTime = this.getEngine().getDeltaTime() / 1000;

        if (this.isFalling) {
            const gravity = -9.81; // 💥можно поиграться
            const fallSpeed = gravity * deltaTime;
            this.pongMeshes.ball.position.y += fallSpeed;

            if (this.pongMeshes.ball.position.y <= 0) {
                this.pongMeshes.ball.position.y = 0;
                this.isFalling = false;

                const randomAngle = (Math.random() - 0.5) * Math.PI / 4;
                this.ballVelocity = new Vector3(
                    Math.cos(randomAngle) * this.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
                    0,
                    Math.sin(randomAngle) * this.ballSpeed
                );
            }
            return;
        }

        const moveDistance = this.ballSpeed * deltaTime;
        const moveDirection = this.ballVelocity.normalize();
        this.pongMeshes.ball.position.addInPlace(moveDirection.scale(moveDistance));

        const x = this.pongMeshes.ball.position.x;
        const fieldWidth = 12; // если поиграться этими циферками, то можно 😸
        const waveAmplitude = 2; // достичь идеальных подскакиваний мячика 😸
        const waveFrequency = Math.PI / fieldWidth;
        this.pongMeshes.ball.position.y = waveAmplitude * Math.abs(Math.sin(x * waveFrequency));


        this.handleBallCollisions();
    }

    private handleBallCollisions(): void {
    const ball = this.pongMeshes.ball;
    const ballPos: Vector3 = ball.position;

    if (Math.abs(ballPos.z) > this.fieldHeight / 2) {
        this.ballVelocity.z = -this.ballVelocity.z;
        ballPos.z = Math.sign(ballPos.z) * (this.fieldHeight / 2);
        this.sendBallCollision(ballPos.z < 0 ? "edgeTop" : "edgeBottom");
    }

    const paddleLeft = this.pongMeshes.paddleLeft;
    const paddleRight = this.pongMeshes.paddleRight;

    if (
        ballPos.x < -this.fieldWidth / 2 + this.paddleWidth &&
        Math.abs(ballPos.z - paddleLeft.position.z) < this.paddleHeight / 2
    ) {
        this.ballVelocity.x = -this.ballVelocity.x;
        ballPos.x = -this.fieldWidth / 2 + this.paddleWidth;
        this.ballVelocity.z += (ballPos.z - paddleLeft.position.z) * 0.5;
        this.sendBallCollision("paddleLeft");
    }

    if (
        ballPos.x > this.fieldWidth / 2 - this.paddleWidth &&
        Math.abs(ballPos.z - paddleRight.position.z) < this.paddleHeight / 2
    ) {
        this.ballVelocity.x = -this.ballVelocity.x;
        ballPos.x = this.fieldWidth / 2 - this.paddleWidth;
        this.ballVelocity.z += (ballPos.z - paddleRight.position.z) * 0.5;
        this.sendBallCollision("paddleRight");
    }

    if (Math.abs(ballPos.x) > this.fieldWidth / 2) {
        this.handleGoal();
    }
}

    private sendBallCollision(mesh: MeshName): void {
        const message: BallCollision = {
            type: "BallCollision",
            collidedWith: mesh,
        };

        this.players.forEach(player => {
            player.gameSocket?.send(JSON.stringify(message));
        });
    }

    private endGame(): void {
        this.gameState = "over";

        const winnerIndex = this.score[0] >= 7 ? 0 : 1;
        const message : GameOver = {
            type: "GameOver",
            winner: this.players[winnerIndex]?.id,
            finalScore: [this.score[0], this.score[1]],
        };

        this.players.forEach(player => {
            player.gameSocket?.send(JSON.stringify(message));
        });
        this.onBeforeRenderObservable.clear();
        this.players.length = 0;
    }

    private handleGoal(): void {
        if (this.pongMeshes.ball.position.x > 0) {
            this.score[0]++;
            this.sendBallCollision("edgeRight");
        } else {
            this.score[1]++;
            this.sendBallCollision("edgeLeft");
        }

        const message: ScoreUpdate = {
            type: "ScoreUpdate",
            score: [this.score[0], this.score[1]],
        };

        this.players.forEach(player => {
            player.gameSocket?.send(JSON.stringify(message));
        });

        if (this.score[0] >= 7 || this.score[1] >= 7) {
            this.endGame();
            return;
        }

        this.pongMeshes.ball.position = new Vector3(0, 15, 0); // 💥 это выоста после гола
        this.isFalling = true;
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
                console.log("Removing game:", [scene.id]);
                scene.dispose();
                return false;
            }
            return true;
        });
    }
}

export function startRenderLoop(engine: PongBackEngine) {
    engine.runRenderLoop(() => {
        engine.scenes.forEach(scene => {
            if (scene.gameState !== "running") return; // state
            scene.render();

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
        engine.removeEmptyScenes();

    });
}
