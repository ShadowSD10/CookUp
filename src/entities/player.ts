import { PLAYER_CONFIG } from '../core/config';
import type { AnimationState } from '../systems/animation';

export const DIRECTIONS = [
  'up',
  'up-right',
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type Motion = 'idle' | 'walk' | 'run';
export type Character = 'maleCook' | 'femaleCook';

export interface Player {
  id: 1 | 2;
  character: Character;
  x: number;
  y: number;
  facing: Direction;
  motion: Motion;
  collisionWidth: number;
  collisionHeight: number;
  renderScale: number;
  animation: AnimationState;
}

export function createPlayer(
  id: 1 | 2,
  character: Character,
  x: number,
  y: number,
): Player {
  return {
    id,
    character,
    x,
    y,
    facing: 'down',
    motion: 'idle',
    collisionWidth: PLAYER_CONFIG.collisionWidth,
    collisionHeight: PLAYER_CONFIG.collisionHeight,
    renderScale: PLAYER_CONFIG.renderScale,
    animation: { clip: 'idle', frame: 0, elapsed: 0 },
  };
}
