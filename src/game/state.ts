import { clipName, getClip } from '../assets/manifest';
import { createPlayer, type Player } from '../entities/player';
import { updateAnimation } from '../systems/animation';
import type { PlayerInput } from '../systems/input';
import { movePlayer } from '../systems/movement';
import { createWorld, type World } from './world';

export interface GameState {
  world: World;
  players: [Player, Player];
}

export function createGame(): GameState {
  const world = createWorld();
  return {
    world,
    players: [
      createPlayer(1, 'maleCook', world.width * 0.4, world.height * 0.55),
      createPlayer(2, 'femaleCook', world.width * 0.6, world.height * 0.55),
    ],
  };
}

export function updateGame(
  state: GameState,
  inputs: readonly [PlayerInput, PlayerInput],
  dt: number,
): void {
  if (!Number.isFinite(dt) || dt < 0)
    throw new Error('Delta time must be finite and non-negative');
  if (dt === 0) return;
  const obstacles = state.world.objects.map((object) => object.collider);
  for (const index of [0, 1] as const) {
    const player = state.players[index];
    movePlayer(player, inputs[index], dt, state.world.bounds, obstacles);
    const name = clipName(player);
    updateAnimation(
      player.animation,
      name,
      getClip(player.character, name),
      dt,
    );
  }
}
