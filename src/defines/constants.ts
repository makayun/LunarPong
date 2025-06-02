export const GROUND_WIDTH = 30;
export const GROUND_HEIGHT = 15;

export const EDGE_HEIGHT = 1;
export const LR_EDGES_POS_X = GROUND_WIDTH / 2 + EDGE_HEIGHT / 2;
export const TB_EDGES_POS_Z = GROUND_HEIGHT / 2 + EDGE_HEIGHT / 2;

export const PADDLE_RADIUS = 0.3;
export const PADDLE_POS_X = GROUND_WIDTH / 2 - PADDLE_RADIUS;
export const PADDLE_MIN_Z = -GROUND_HEIGHT / 2 + PADDLE_RADIUS * 2 + EDGE_HEIGHT;
export const PADDLE_MAX_Z = GROUND_HEIGHT / 2 - PADDLE_RADIUS * 2 - EDGE_HEIGHT;

export const FPS = 60;
export const STEP = 2;

export const UP = -1;
export const STOP = 0;
export const DOWN = 1;
