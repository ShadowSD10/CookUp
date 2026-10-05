import { describe, expect, it } from 'vitest';
import { environment } from '../assets/manifest';
import { PLAYER_CONFIG } from '../core/config';
import { fitCamera } from '../rendering/camera';
import type { Rect } from '../systems/collision';
import { createWorld, TILE_SIZE, type WorldSprite } from './world';

function visibleWall(sprite: WorldSprite): Rect {
  if (!sprite.clip)
    throw new Error('A structural wall requires explicit clipping');
  const horizontal = sprite.asset === environment.wallHorizontal;
  const left = Math.max(sprite.x + (horizontal ? 0 : 48), sprite.clip.x);
  const top = Math.max(sprite.y + (horizontal ? 32 : 0), sprite.clip.y);
  const right = Math.min(
    sprite.x + (horizontal ? 256 : 213),
    sprite.clip.x + sprite.clip.width,
  );
  const bottom = Math.min(
    sprite.y + (horizontal ? 233 : 256),
    sprite.clip.y + sprite.clip.height,
  );
  return { x: left, y: top, width: right - left, height: bottom - top };
}

describe('structural wall layout', () => {
  const world = createWorld();
  const walls = [...world.structures, ...world.foreground].filter(
    (sprite) =>
      sprite.asset === environment.wallHorizontal ||
      sprite.asset === environment.wallVertical,
  );

  it('preserves the 10 by 7 grid, collision rectangle, and original objects', () => {
    expect(TILE_SIZE).toBe(128);
    expect([world.width, world.height]).toEqual([1280, 896]);
    expect(world.bounds).toEqual({ x: 84, y: 84, width: 1112, height: 728 });
    expect(world.floorBounds).toEqual(world.bounds);
    expect(
      world.floors.filter((sprite) => sprite.asset !== environment.mat),
    ).toHaveLength(70);
    expect(world.objects).toHaveLength(2);
  });

  it('uses native 256px wall visuals with independent, grid-aligned footprints', () => {
    expect(walls).toHaveLength(20);
    for (const wall of walls) {
      expect([wall.width, wall.height]).toEqual([256, 256]);
      expect(wall.footprint.x % TILE_SIZE).toBeCloseTo(0);
      expect(wall.footprint.y % TILE_SIZE).toBeCloseTo(0);
      expect([wall.footprint.width, wall.footprint.height]).toEqual(
        wall.asset === environment.wallHorizontal ? [256, 128] : [128, 256],
      );
      expect(wall.clip).toBeDefined();
    }
  });

  it('fills the full border and all four corner joins without intruding into the floor', () => {
    const ink = walls.map(visibleWall);
    const floor = world.floorBounds;
    for (const rect of ink) {
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
      expect(
        rect.x < floor.x + floor.width &&
          rect.x + rect.width > floor.x &&
          rect.y < floor.y + floor.height &&
          rect.y + rect.height > floor.y,
      ).toBe(false);
    }
    const visual = world.visualBounds;
    for (let y = visual.y + 0.5; y < visual.y + visual.height; y += 1) {
      const intervals = ink
        .filter((rect) => y >= rect.y && y < rect.y + rect.height)
        .sort((a, b) => a.x - b.x);
      const bands =
        y < floor.y || y >= floor.y + floor.height
          ? [[visual.x, visual.x + visual.width]]
          : [
              [visual.x, floor.x],
              [floor.x + floor.width, visual.x + visual.width],
            ];
      for (const [start, end] of bands) {
        if (start === undefined || end === undefined)
          throw new Error('Missing border interval');
        let covered = start;
        for (const rect of intervals) {
          if (rect.x <= covered && rect.x + rect.width > covered)
            covered = rect.x + rect.width;
        }
        expect(covered, `Uncovered wall at y=${y}`).toBeGreaterThanOrEqual(end);
      }
    }
  });

  it('retains native legacy door and window details and separate south-wall layering', () => {
    for (const asset of [
      environment.window,
      environment.door,
      environment.doorFrame,
      environment.clock,
    ]) {
      const details = world.structures.filter(
        (sprite) => sprite.asset === asset,
      );
      expect(details.length).toBeGreaterThan(0);
      for (const detail of details)
        expect([detail.width, detail.height]).toEqual([128, 128]);
    }
    expect(world.foreground).toHaveLength(6);
    expect(
      world.foreground.every(
        (sprite) => sprite.asset === environment.wallHorizontal,
      ),
    ).toBe(true);
  });

  it.each([
    [1200, 600],
    [375, 300],
    [600, 1200],
  ])(
    'frames every visible wall and north-boundary player label in %i by %i',
    (width, height) => {
      const camera = fitCamera(
        width,
        height,
        world.width,
        world.height,
        world.visualBounds,
      );
      for (const rect of walls.map(visibleWall)) {
        expect(camera.x + rect.x * camera.scale).toBeGreaterThanOrEqual(0);
        expect(camera.y + rect.y * camera.scale).toBeGreaterThanOrEqual(0);
        expect(
          camera.x + (rect.x + rect.width) * camera.scale,
        ).toBeLessThanOrEqual(width);
        expect(
          camera.y + (rect.y + rect.height) * camera.scale,
        ).toBeLessThanOrEqual(height);
      }
      const labelTop =
        world.bounds.y +
        PLAYER_CONFIG.collisionHeight / 2 -
        256 * PLAYER_CONFIG.renderScale -
        14;
      expect(camera.y + labelTop * camera.scale).toBeGreaterThanOrEqual(0);
    },
  );
});
