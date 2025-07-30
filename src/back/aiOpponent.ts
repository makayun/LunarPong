import {
  GROUND_HEIGHT,
  EDGE_HEIGHT,
  PADDLE_STEP,
  PADDLE_MIN_Z,
  PADDLE_MAX_Z,
  UP,
  DOWN,
  STOP
} from "../defines/constants";

import type { MeshPositions, PlayerInput, Game } from "../defines/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

interface AIOpponentConfig {
  paddleSpeed: number;
  updateInterval: number;
}

export class AIOpponent {
  private game: Game;
  private config: AIOpponentConfig;
  private lastUpdate: number = 0;
  private ballVelocity: Vector3 = new Vector3(0, 0, 0);
  private lastBallPosition: Vector3 | null = null;

  constructor(game: Game) {
    this.game = game;
    this.config = {
      paddleSpeed: PADDLE_STEP, /* 👿 */
      updateInterval: 1000, /* 👿 */
    };
  }


  update(positions: MeshPositions, currentTime: number): PlayerInput | null {
    if (currentTime - this.lastUpdate < this.config.updateInterval) {
      return null;
    }
    this.lastUpdate = currentTime;

    const paddleZ = positions.paddleRight.z;
    const ballPos = positions.ball;

    // if (ballPos.y > 5) {
    if (ballPos.y > 3) {
      this.lastBallPosition = null;
      if (paddleZ > 0.1) return this.createInput(UP);
      if (paddleZ < -0.1) return this.createInput(DOWN);
      return null;
    }

    if (this.lastBallPosition) {
      const deltaTime = this.config.updateInterval / 1000;
      this.ballVelocity = ballPos
        .subtract(this.lastBallPosition)
        .scale(1.2 / deltaTime);
    } else {
      this.ballVelocity = new Vector3(5, 0, ballPos.z - paddleZ);
    }
    this.lastBallPosition = ballPos.clone();

    if (this.ballVelocity.x < 0) {
      // const doorstep = 0.1 + 0.4 * Math.abs(paddleZ) / (GROUND_HEIGHT / 2);
      const doorstep = Math.max(0.05, 0.3 / (1 + Math.abs(this.ballVelocity.z)));
      // const doorstep = Math.max(0.08, 0.2 / (1 + Math.abs(this.ballVelocity.z)));

      if (paddleZ > 0 + doorstep) return this.createInput(UP);
      if (paddleZ < 0 - doorstep) return this.createInput(DOWN);
      return null;
    }

    const predictedZ = this.oracleOfDelphi(positions);
    // const doorstep = 0.4;
    const doorstep = Math.max(0.05, 0.3 / (1 + Math.abs(this.ballVelocity.z)));
    // const doorstep = Math.max(0.08, 0.2 / (1 + Math.abs(this.ballVelocity.z)));

    let direction: typeof UP | typeof DOWN | typeof STOP = STOP;

    if (predictedZ < paddleZ - doorstep) direction = UP;
    else if (predictedZ > paddleZ + doorstep) direction = DOWN;

    if (direction !== STOP) {
      return this.createInput(direction);
    }
    return null;
  }


  private createInput(direction: typeof UP | typeof DOWN): PlayerInput {
    return {
      type: "PlayerInput",
      side: "right",
      gameId: this.game.id,
      direction,
    };
  }

  private oracleOfDelphi(positions: MeshPositions): number {
    const ball = positions.ball;
    const paddleX = positions.paddleRight.x;

    const distanceToPaddle = Math.abs(paddleX - ball.x);
    const closeThreshold = Math.max(0.3, 0.5 / (1 + Math.abs(this.ballVelocity.x)));
    // const closeThreshold = 0.5; /* ✨✨✨ */
    if (distanceToPaddle < closeThreshold) {
      return Math.max(PADDLE_MIN_Z, Math.min(PADDLE_MAX_Z, ball.z));
    }

    if (this.ballVelocity.x > 0) {
      const distanceToPaddle = Math.abs(paddleX - ball.x);
      const timeToRacket = distanceToPaddle / Math.max(0.001, Math.abs(this.ballVelocity.x));

      const upperBound = GROUND_HEIGHT / 2 - EDGE_HEIGHT;
      const lowerBound = -GROUND_HEIGHT / 2 + EDGE_HEIGHT;
    
      let remainingTime = timeToRacket;
      let currentBallZ = ball.z;
      let currentVelBallZ = this.ballVelocity.z;
    
      while (remainingTime > 0) {
        let timeToPaddle;
        if (currentVelBallZ > 0) {
          timeToPaddle = (upperBound - currentBallZ) / currentVelBallZ;
        } else if (currentVelBallZ < 0) {
          timeToPaddle = (lowerBound - currentBallZ) / currentVelBallZ;
        } else {
          break;
        }
      
        timeToPaddle = Math.max(0, timeToPaddle);
      
        if (timeToPaddle >= remainingTime) {
          currentBallZ += currentVelBallZ * remainingTime;
          break;
        } else {
          currentBallZ += currentVelBallZ * timeToPaddle;
          currentVelBallZ *= -1;
          remainingTime -= timeToPaddle;
        }
      }
      return Math.max(PADDLE_MIN_Z, Math.min(PADDLE_MAX_Z, currentBallZ));
    }
    return positions.paddleRight.z;
  }
}
