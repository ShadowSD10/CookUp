import { PLAYER_CONFIG } from '../core/config';
import type { Direction, Player } from '../entities/player';
import type { PlayerInput } from './input';
import { moveBody, type Rect } from './collision';

function facing(x: number, y: number): Direction {
  if (y < 0) return x < 0 ? 'up-left' : x > 0 ? 'up-right' : 'up';
  if (y > 0) return x < 0 ? 'down-left' : x > 0 ? 'down-right' : 'down';
  return x < 0 ? 'left' : 'right';
}

export function movePlayer(
  player: Player,
  input: PlayerInput,
  dt: number,
  bounds: Rect,
  obstacles: readonly Rect[],
): void {
  const length = Math.hypot(input.x, input.y);
  if (length === 0) {
    player.motion = 'idle';
    return;
  }
  player.facing = facing(input.x, input.y);
  const speed = input.run ? PLAYER_CONFIG.runSpeed : PLAYER_CONFIG.walkSpeed;
  const previousX = player.x;
  const previousY = player.y;
  moveBody(
    player,
    (input.x / length) * speed * dt,
    (input.y / length) * speed * dt,
    bounds,
    obstacles,
  );
  player.motion =
    player.x === previousX && player.y === previousY
      ? 'idle'
      : input.run
        ? 'run'
        : 'walk';
}
