import { describe, expect, it } from 'vitest';
import { CONTROLS } from '../core/config';
import { getClip } from '../assets/manifest';
import { updateAnimation, type AnimationState } from './animation';
import { moveBody } from './collision';
import { readInput } from './input';
import { fitCamera } from '../rendering/camera';

describe('input', () => {
  it('keeps player controls independent, including left and right Shift', () => {
    const keys = new Set(['KeyW', 'ArrowRight', 'ShiftRight']);
    expect(readInput(keys, CONTROLS[0])).toEqual({ x: 0, y: -1, run: false });
    expect(readInput(keys, CONTROLS[1])).toEqual({ x: 1, y: 0, run: true });
  });
  it('cancels opposing directions and accepts alternate bindings', () => {
    expect(
      readInput(new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']), CONTROLS[0]),
    ).toEqual({ x: 0, y: 0, run: false });
    expect(readInput(new Set(['KeyI']), { ...CONTROLS[0], up: 'KeyI' }).y).toBe(
      -1,
    );
  });
});

describe('animation', () => {
  const clip = getClip('maleCook', 'walk-right');
  it('advances, wraps all eight frames, and resets on a clip change', () => {
    const state: AnimationState = { clip: 'walk-right', elapsed: 0, frame: 0 };
    for (let frame = 1; frame <= 8; frame++) {
      updateAnimation(state, 'walk-right', clip, 0.1);
      expect(state.frame).toBe(frame % 8);
    }
    updateAnimation(state, 'walk-left', clip, 0);
    expect(state).toEqual({ clip: 'walk-left', elapsed: 0, frame: 0 });
  });
  it('supports different frame counts, speeds, and non-looping clips', () => {
    const state: AnimationState = { clip: 'custom', elapsed: 0, frame: 0 };
    const custom = {
      ...clip,
      frames: ['one', 'two', 'three'],
      fps: 4,
      loop: false,
    };
    updateAnimation(state, 'custom', custom, 10);
    expect(state.frame).toBe(2);
  });
});

describe('collision', () => {
  const bounds = { x: 0, y: 0, width: 1000, height: 1000 };
  const obstacle = { x: 400, y: 400, width: 50, height: 50 };
  it.each([
    { x: 300, y: 425, dx: 500, dy: 0, expectedX: 390, expectedY: 425 },
    { x: 550, y: 425, dx: -500, dy: 0, expectedX: 460, expectedY: 425 },
    { x: 425, y: 300, dx: 0, dy: 500, expectedX: 425, expectedY: 390 },
    { x: 425, y: 550, dx: 0, dy: -500, expectedX: 425, expectedY: 460 },
  ])(
    'sweeps against obstacles from $x, $y without tunneling',
    ({ x, y, dx, dy, expectedX, expectedY }) => {
      const body = { x, y, collisionWidth: 20, collisionHeight: 20 };
      moveBody(body, dx, dy, bounds, [obstacle]);
      expect(body.x).toBe(expectedX);
      expect(body.y).toBe(expectedY);
    },
  );
  it('slides along a blocked axis', () => {
    const body = { x: 390, y: 425, collisionWidth: 20, collisionHeight: 20 };
    moveBody(body, 10, 10, bounds, [obstacle]);
    expect(body).toMatchObject({ x: 390, y: 435 });
  });
});

it.each([
  [1200, 600],
  [375, 300],
  [600, 1200],
])('fits the entire world in a %i by %i canvas', (width, height) => {
  const camera = fitCamera(width, height, 1280, 896);
  expect(camera.x).toBeGreaterThanOrEqual(0);
  expect(camera.y).toBeGreaterThanOrEqual(0);
  expect(camera.y + (84 + 12 - 128 - 14) * camera.scale).toBeGreaterThanOrEqual(
    0,
  );
  expect(camera.x + 1280 * camera.scale).toBeLessThanOrEqual(width);
  expect(camera.y + 896 * camera.scale).toBeLessThanOrEqual(height);
});
