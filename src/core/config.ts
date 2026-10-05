export interface Controls {
  up: string;
  down: string;
  left: string;
  right: string;
  run: string;
}

export const CONTROLS: readonly [Controls, Controls] = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', run: 'ShiftLeft' },
  {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    run: 'ShiftRight',
  },
];

export const PLAYER_CONFIG = {
  walkSpeed: 270,
  runSpeed: 450,
  renderScale: 0.5,
  anchorX: 0.5,
  anchorY: 0.94,
  collisionWidth: 34,
  collisionHeight: 24,
} as const;

export const MAX_DELTA_SECONDS = 0.05;
