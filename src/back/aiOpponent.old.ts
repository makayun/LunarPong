// import {
//   GROUND_HEIGHT,
//   EDGE_HEIGHT,
//   PADDLE_STEP,
//   PADDLE_MIN_Z,
//   PADDLE_MAX_Z,
//   UP,
//   DOWN,
//   STOP
// } from "../defines/constants";

// import type { MeshPositions, PlayerInput, Game} from "../defines/types";
// import { Vector3 } from "@babylonjs/core/Maths/math.vector";

// interface AIOpponentConfig {
//   paddleSpeed: number;
//   updateInterval: number;
// }

// export class AIOpponent {
//   private game: Game;
//   private config: AIOpponentConfig;
//   private lastUpdate: number = 0;
//   private ballVelocity: Vector3 = new Vector3(0, 0, 0);
//   private lastBallPosition: Vector3 | null = null;

//   constructor(game: Game) {
//     this.game = game;
//     this.config = {
//       paddleSpeed: PADDLE_STEP,
//       updateInterval: 1000,
//     };
//   }

//   update(positions: MeshPositions, currentTime: number): PlayerInput | null {
//     if (currentTime - this.lastUpdate < this.config.updateInterval) {
//       return null;
//     }
//     this.lastUpdate = currentTime;

//     const paddleZ = positions.paddleRight.z;
//     const ballPos = positions.ball;

//     if (ballPos.y > 5) {
//       this.lastBallPosition = null;
//       if (paddleZ > 3) return this.createInput(UP);
//       if (paddleZ < -3) return this.createInput(DOWN);
//       return null;
//     }

//     if (this.lastBallPosition) {
//       const deltaTime = this.config.updateInterval / 1000;
//       this.ballVelocity = ballPos
//         .subtract(this.lastBallPosition)
//         .scale(1.2 / deltaTime);
//     } else {
//       this.ballVelocity = new Vector3(5, 0, ballPos.z - paddleZ);
//     }
//     this.lastBallPosition = ballPos.clone();

//     if (this.ballVelocity.x < 0) {
//       const doorstep = 0.4;

//       if (paddleZ > 0 + doorstep) return this.createInput(UP);
//       if (paddleZ < 0 - doorstep) return this.createInput(DOWN);
//       return null;
//     }

//     const predictedZ = this.oracleOfDelphi(positions);
//     const doorstep = 0.4;

//     let direction: typeof UP | typeof DOWN | typeof STOP = STOP;

//     if (predictedZ < paddleZ - doorstep) direction = UP;
//     else if (predictedZ > paddleZ + doorstep) direction = DOWN;

//     if (direction !== STOP) {
//       return this.createInput(direction);
//     }
//     return null;
//   }

//   private createInput(direction: typeof UP | typeof DOWN): PlayerInput {
//     return {
//       type: "PlayerInput",
//       side: "right",
//       gameId: this.game.id,
//       direction,
//     };
//   }

//   private oracleOfDelphi(positions: MeshPositions): number {
//     const ball = positions.ball;
//     const paddleX = positions.paddleRight.x;

//   if (this.ballVelocity.x > 0) {
//     const distanceToPaddle = Math.abs(paddleX - ball.x);
//     const timeToPaddle =
//       this.ballVelocity.x !== 0
//         ? distanceToPaddle / Math.abs(this.ballVelocity.x)
//         : Infinity;
//     console.log(`[${this.lastUpdate}] Time to paddle: ${timeToPaddle}`);

//     if (timeToPaddle === Infinity || timeToPaddle <= 1) {
//       console.log(
//         `[${this.lastUpdate}] Ball close or infinite time, using current ball Y: ${ball.z}`
//       );
//       return ball.z;
//     }

//     const upperBound = GROUND_HEIGHT / 2 - EDGE_HEIGHT;
//     const lowerBound = -GROUND_HEIGHT / 2 + EDGE_HEIGHT;


//     let predictedY = ball.z + this.ballVelocity.z * timeToPaddle;

//     const fieldHeight = upperBound - lowerBound;
//     const offset = predictedY - lowerBound;

//     const bounces = Math.floor(offset / fieldHeight);
//     const remainder = ((offset % fieldHeight) + fieldHeight) % fieldHeight;

//     if (bounces % 2 === 0) {
//       predictedY = lowerBound + remainder;
//     } else {
//       predictedY = upperBound - remainder;
//     }

//     if (predictedY > PADDLE_MAX_Z) predictedY = PADDLE_MAX_Z;
//     if (predictedY < PADDLE_MIN_Z) predictedY = PADDLE_MIN_Z;

//     console.log(`[${this.lastUpdate}] Predicted Y (clamped): ${predictedY}`);
//     return predictedY;
//   }
//   return positions.paddleRight.z;
// }

// }
