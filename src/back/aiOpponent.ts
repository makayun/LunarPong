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

    /* Если мяч движется в сторону левого игрока, возвращаем ракетку в центр */
if (this.ballVelocity.x < 0 || this.ballVelocity.y > 5) {
  const paddleZ = positions.paddleRight.z;
  const doorstep = /*0.4;*/ 0.1 + 0.4 * Math.abs(paddleZ) / (GROUND_HEIGHT/2);
  // const doorstep = Math.max(0.01, 0.05 / (1 + Math.abs(this.ballVelocity.z)));
  // const doorstep = Math.max(0.01, 0.05 / (1 + Math.pow(Math.abs(this.ballVelocity.z), 0.5)));
  if (paddleZ > 0 + doorstep) {
    return this.createInput(UP);
  } else if (paddleZ < 0 - doorstep) {
    return this.createInput(DOWN);
  }
  return null;
}


    /* Предсказываем, где мяч пересечет линию ракетки */
    const predictedZ = this.oracleOfDelphi(positions);
    const paddleZ = positions.paddleRight.z;

    /* Логика принятия решения */
    const doorstep = 0.4; // Допустимое отклонение
    // const doorstep = Math.max(0.1, 0.3 / (1 + Math.abs(this.ballVelocity.z)));
    // const doorstep = Math.max(0.01, 0.05 / (1 + Math.abs(this.ballVelocity.z)));
    // const doorstep = Math.max(0.01, 0.05 / (1 + Math.pow(Math.abs(this.ballVelocity.z), 0.5)));

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
    /* Предсказываем, где мяч пересечет линию ракетки */

    private oracleOfDelphi(positions: MeshPositions): number {
  const ball = positions.ball;
  const paddleX = positions.paddleRight.x;

  if (this.ballVelocity.x > 0) {
    const distanceToPaddle = Math.abs(paddleX - ball.x);
    const timeToPaddle = distanceToPaddle / Math.max(0.001, Math.abs(this.ballVelocity.x));

    // Улучшенный расчет отскоков с учетом времени
    const upperBound = GROUND_HEIGHT / 2 - EDGE_HEIGHT;
    const lowerBound = -GROUND_HEIGHT / 2 + EDGE_HEIGHT;
    
    let remainingTime = timeToPaddle;
    let currentZ = ball.z;
    let currentVz = this.ballVelocity.z;
    
    while (remainingTime > 0) {
      // Рассчитываем время до следующего отскока
      let timeToPaddle;
      if (currentVz > 0) {
        timeToPaddle = (upperBound - currentZ) / currentVz;
      } else if (currentVz < 0) {
        timeToPaddle = (lowerBound - currentZ) / currentVz;
      } else {
        break; // Нет вертикального движения
      }
      
      timeToPaddle = Math.max(0, timeToPaddle);
      
      if (timeToPaddle >= remainingTime) {
        currentZ += currentVz * remainingTime;
        break;
      } else {
        currentZ += currentVz * timeToPaddle;
        currentVz *= -1; // Инвертируем скорость при отскоке
        remainingTime -= timeToPaddle;
      }
    }
    
    return Math.max(PADDLE_MIN_Z, Math.min(PADDLE_MAX_Z, currentZ));
  }
  return positions.paddleRight.z;
}

}


// 1. Проверяем, не прошло ли слишком мало времени с прошлого обновления
//    Если да — выходим

// 2. Проверяем, не появился ли мяч заново (после гола)
//    Если да — сбрасываем lastBallPosition и выходим

// 3. Если это первый шаг (нет lastBallPosition):
//    - сохраняем позицию мяча
//    - ничего не делаем пока (ждём следующего шага)

// 4. Если lastBallPosition есть:
//    - рассчитываем ballVelocity

// 5. Если мяч летит влево:
//    - двигаем ракетку к центру

// 6. Если мяч летит вправо:
//    - предсказываем по oracleOfDelphi
//    - двигаемся вверх/вниз/стоим

// 7. Сохраняем текущую позицию мяча как lastBallPosition

