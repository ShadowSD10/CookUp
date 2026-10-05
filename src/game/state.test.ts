import { describe, expect, it } from 'vitest';
import { PLAYER_CONFIG } from '../core/config';
import { createGame, updateGame } from './state';
import type { PlayerInput } from '../systems/input';

const idle: PlayerInput = { x: 0, y: 0, run: false };
const right: PlayerInput = { x: 1, y: 0, run: false };

describe('playable kitchen', () => {
  it('moves both players independently and switches idle, walk, and run', () => {
    const state = createGame();
    const [p1, p2] = state.players;
    const x = p1.x;
    const y = p2.y;
    updateGame(state, [right, { x: 0, y: -1, run: true }], 0.25);
    expect(p1.x).toBeCloseTo(x + PLAYER_CONFIG.walkSpeed * 0.25);
    expect(p2.y).toBeCloseTo(y - PLAYER_CONFIG.runSpeed * 0.25);
    expect(p1.motion).toBe('walk');
    expect(p2.motion).toBe('run');
    expect(p1.animation.clip).toBe('walk-right');
    expect(p2.animation.clip).toBe('run-up');
    updateGame(state, [idle, idle], 0.1);
    expect(p1.motion).toBe('idle');
    expect(p2.motion).toBe('idle');
    expect(p1.animation.clip).toBe('idle');
  });

  it.each([20, 30, 60, 120, 144])(
    'moves the same distance at %i updates per second',
    (fps) => {
      const state = createGame();
      const startX = state.players[0].x;
      for (let i = 0; i < fps; i++) updateGame(state, [right, idle], 1 / fps);
      expect(state.players[0].x - startX).toBeCloseTo(
        PLAYER_CONFIG.walkSpeed,
        8,
      );
    },
  );

  it('normalizes diagonal movement and uses directional sprites', () => {
    const state = createGame();
    const { x, y } = state.players[0];
    updateGame(state, [{ x: 1, y: -1, run: true }, idle], 0.5);
    expect(
      Math.hypot(state.players[0].x - x, state.players[0].y - y),
    ).toBeCloseTo(PLAYER_CONFIG.runSpeed * 0.5);
    expect(state.players[0].animation.clip).toBe('run-up-right');
  });

  it.each([
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: 1 },
  ])('keeps both players within boundaries for $x, $y', (direction) => {
    const state = createGame();
    const input = { ...direction, run: true };
    for (let i = 0; i < 500; i++) updateGame(state, [input, input], 1 / 30);
    const bounds = state.world.bounds;
    for (const player of state.players) {
      expect(player.x - player.collisionWidth / 2).toBeGreaterThanOrEqual(
        bounds.x,
      );
      expect(player.x + player.collisionWidth / 2).toBeLessThanOrEqual(
        bounds.x + bounds.width,
      );
      expect(player.y - player.collisionHeight / 2).toBeGreaterThanOrEqual(
        bounds.y,
      );
      expect(player.y + player.collisionHeight / 2).toBeLessThanOrEqual(
        bounds.y + bounds.height,
      );
      expect(player.motion).toBe('idle');
    }
  });

  it('blocks the plant base independently of its artwork', () => {
    const state = createGame();
    const plant = state.world.objects[0];
    if (!plant) throw new Error('Expected a plant in the kitchen');
    const player = state.players[0];
    player.x = plant.collider.x + plant.collider.width / 2;
    player.y = plant.collider.y + plant.collider.height + 100;
    updateGame(state, [{ x: 0, y: -1, run: true }, idle], 1);
    expect(player.y).toBe(
      plant.collider.y + plant.collider.height + player.collisionHeight / 2,
    );
  });

  it('restarts with fresh players, world, positions, and animations', () => {
    const original = createGame();
    const state = createGame();
    updateGame(state, [right, right], 0.5);
    expect(createGame()).toEqual(original);
    expect(createGame().players[0]).not.toBe(original.players[0]);
  });

  it('rejects invalid delta times and preserves state on a zero-time update', () => {
    const state = createGame();
    for (const dt of [-1, Infinity, NaN]) {
      expect(() => updateGame(state, [right, idle], dt)).toThrow('Delta time');
    }
    updateGame(state, [right, right], 0);
    expect(state).toEqual(createGame());
  });
});
