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

import type { MeshPositions, PlayerInput, /*User,*/ Game/*, GUID*/ } from "../defines/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
// import { generateGuid } from '../helpers/helpers';

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
      paddleSpeed: PADDLE_STEP,
      updateInterval: 1000, // 👿 1000 !!!!!!!!!!!!!!!
    };
  }

  update(positions: MeshPositions, currentTime: number): PlayerInput | null {
    if (currentTime - this.lastUpdate < this.config.updateInterval) {
      return null;
    }
    this.lastUpdate = currentTime;

    if (this.lastBallPosition) {
      const deltaTime = this.config.updateInterval / 1000;
      this.ballVelocity = positions.ball
        .subtract(this.lastBallPosition)
        .scale(1.2 / deltaTime);
    } else {
      /* Для первого шага предполагаем, что мяч движется к AI */
      const paddleZ = positions.paddleRight.z;
      this.ballVelocity = new Vector3(5, 0, positions.ball.z - paddleZ);
    }
    this.lastBallPosition = positions.ball.clone();

    /* Предсказываем, где мяч пересечет линию ракетки */
    const predictedZ = this.oracleOfDelphi(positions);
    const paddleZ = positions.paddleRight.z;

    /* Логика принятия решения */
    // const threshold = 0.5; // Допустимое отклонение
    const doorstep = Math.max(0.1, 0.3 / (1 + Math.abs(this.ballVelocity.z)));

    let direction: typeof UP | typeof DOWN | typeof STOP = STOP;

    if (predictedZ < paddleZ - doorstep) direction = UP;
    else if (predictedZ > paddleZ + doorstep) direction = DOWN;

    if (direction !== STOP) {
      return {
        type: "PlayerInput",
        side: "right",
        gameId: this.game.id,
        direction,
      };
    }
    return null;
  }
    /* Предсказываем, где мяч пересечет линию ракетки */

  private oracleOfDelphi(positions: MeshPositions): number {
  const ball = positions.ball;
  const paddleX = positions.paddleRight.x;

  /* Если мяч движется в сторону AI */
  if (this.ballVelocity.x > 0) {
    const distanceToPaddle = Math.abs(paddleX - ball.x);
    const timeToPaddle = this.ballVelocity.x !== 0
        ? distanceToPaddle / /*Math.abs(*/this.ballVelocity.x/*)*/
        : Infinity;

    if (timeToPaddle === Infinity || timeToPaddle <= 1) {
      return ball.z;
    }

    /* Расчёт Y с учётом возможных отражений от верхнего и нижнего края */
    const upperBound = GROUND_HEIGHT / 2 - EDGE_HEIGHT;
    const lowerBound = -GROUND_HEIGHT / 2 + EDGE_HEIGHT;


    let predictedZ = ball.z + this.ballVelocity.z * timeToPaddle;

        /* логика отражения от границ */
    const fieldHeight = upperBound - lowerBound;
    const offset = predictedZ - lowerBound;

    const bounces = Math.floor(offset / fieldHeight);
    const remainder = offset % fieldHeight;

    if (bounces % 2 === 0) {
      predictedZ = lowerBound + remainder;
    } else {
      predictedZ = upperBound - remainder;
    }
    /* ограничиваем в пределах поля */
    if (predictedZ > PADDLE_MAX_Z) predictedZ = PADDLE_MAX_Z;
    if (predictedZ < PADDLE_MIN_Z) predictedZ = PADDLE_MIN_Z;

    return predictedZ;
  }
  return positions.paddleRight.z;
}

  usePowerUp(): PlayerInput | null {
    return null; // 💥💥💥Заглушка для power-up
  }
}

//   getUser(): User {
//     return this.user;
//   }
// }