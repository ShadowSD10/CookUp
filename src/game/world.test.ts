import { describe, expect, it } from 'vitest';
import { environment, structuralWalls } from '../assets/manifest';
import { PLAYER_CONFIG } from '../core/config';
import { fitCamera } from '../rendering/camera';
import { movePlayer } from '../systems/movement';
import { createGame } from './state';
import { createWorld, TILE_SIZE } from './world';

describe('final structural wall layout', () => {
  const world = createWorld();
  const registry = new Map(
    Object.values(structuralWalls).map((asset) => [asset.path, asset]),
  );
  const walls = [...world.structures, ...world.foreground].filter((sprite) =>
    registry.has(sprite.asset),
  );
  const perimeter = walls.filter(
    (sprite) => sprite.asset !== structuralWalls.doorClosed.path,
  );

  it('preserves the grid and decorations with explicit bounds matching the final inner faces', () => {
    expect(TILE_SIZE).toBe(128);
    expect([world.width, world.height]).toEqual([1280, 896]);
    expect(world.bounds).toEqual({ x: 96, y: 112, width: 1096, height: 672 });
    expect(world.visualBounds).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 896,
    });
    expect(world.floorBounds).toEqual({
      x: 64,
      y: 64,
      width: 1152,
      height: 768,
    });
    expect(
      world.floors.filter((sprite) => sprite.asset !== environment.mat),
    ).toHaveLength(70);
    expect(world.objects).toHaveLength(2);
  });

  it('uses only final structural assets with native dimensions and exact grid anchors', () => {
    expect(walls).toHaveLength(20);
    for (const wall of walls) {
      const asset = registry.get(wall.asset);
      if (!asset)
        throw new Error(`Unregistered structural asset: ${wall.asset}`);
      expect(wall.width).toBe(asset.width);
      expect(wall.height).toBe(asset.height);
      expect(wall.x % TILE_SIZE).toBe(0);
      expect(wall.y % TILE_SIZE).toBe(0);
      expect(wall.footprint).toEqual({
        x: wall.x,
        y: wall.y,
        width: wall.width,
        height: wall.height,
      });
      expect(wall).not.toHaveProperty('clip');
      expect(wall).not.toHaveProperty('rotation');
    }
    for (const sprite of [...world.structures, ...world.foreground]) {
      expect(
        registry.has(sprite.asset) || sprite.asset === environment.clock,
      ).toBe(true);
    }
    for (const sprite of [
      ...world.floors,
      ...world.structures,
      ...world.foreground,
      ...world.objects,
    ]) {
      expect(sprite.asset).not.toMatch(
        /Wall Kit v2|Empty Kitchen\/(?:Walls|Windows|Openings|Transitions)\//,
      );
    }
  });

  it('covers each perimeter cell exactly once without overlaps, gaps, or interior structural tiles', () => {
    for (let row = 0; row < 7; row++) {
      for (let column = 0; column < 10; column++) {
        const x = column * TILE_SIZE;
        const y = row * TILE_SIZE;
        const covering = perimeter.filter(
          (sprite) =>
            x >= sprite.x &&
            x < sprite.x + sprite.width &&
            y >= sprite.y &&
            y < sprite.y + sprite.height,
        );
        const border = row === 0 || row === 6 || column === 0 || column === 9;
        expect(covering, `Cell ${column},${row}`).toHaveLength(border ? 1 : 0);
      }
    }
    const caps = [
      structuralWalls.capTop,
      structuralWalls.capRight,
      structuralWalls.capBottom,
      structuralWalls.capLeft,
    ];
    expect(
      walls.some((wall) => caps.some((cap) => cap.path === wall.asset)),
    ).toBe(false);
  });

  it('uses each directional corner in its intended location and keeps the south wall in front', () => {
    for (const [asset, x, y] of [
      [structuralWalls.topLeft.path, 0, 0],
      [structuralWalls.topRight.path, 1152, 0],
      [structuralWalls.bottomLeft.path, 0, 768],
      [structuralWalls.bottomRight.path, 1152, 768],
    ] as const) {
      expect(walls.filter((wall) => wall.asset === asset)).toEqual([
        expect.objectContaining({ asset, x, y, width: 128, height: 128 }),
      ]);
    }
    expect(world.foreground).toHaveLength(6);
    expect(world.foreground.every((wall) => wall.y === 768)).toBe(true);
  });

  it('replaces wall slots with final windows and shares a doorway/closed-door anchor', () => {
    const doorway = walls.find(
      (wall) => wall.asset === structuralWalls.doorway.path,
    );
    const door = walls.find(
      (wall) => wall.asset === structuralWalls.doorClosed.path,
    );
    expect(doorway).toMatchObject({ x: 512, y: 0, width: 256, height: 128 });
    expect(door).toEqual({
      ...doorway,
      asset: structuralWalls.doorClosed.path,
    });
    expect(
      walls
        .filter((wall) => wall.asset === structuralWalls.windowHorizontal.path)
        .map(({ x, y, width, height }) => ({ x, y, width, height })),
    ).toEqual([
      { x: 256, y: 0, width: 256, height: 128 },
      { x: 896, y: 0, width: 256, height: 128 },
    ]);
    for (const state of [
      structuralWalls.doorClosed,
      structuralWalls.doorAjar,
      structuralWalls.doorOpen,
    ]) {
      expect([state.width, state.height]).toEqual([256, 128]);
    }
  });

  it.each(['north', 'south', 'west', 'east'] as const)(
    'slides along the %s inner face, including transparent padding inside the wall cell',
    (side) => {
      const state = createGame();
      for (const player of state.players) {
        player.x = side === 'west' ? 113 : side === 'east' ? 1175 : 640;
        player.y = side === 'north' ? 124 : side === 'south' ? 772 : 448;
        const before = { x: player.x, y: player.y };
        const input = {
          x: side === 'west' ? -1 : 1,
          y: side === 'north' ? -1 : 1,
          run: true,
        };
        movePlayer(
          player,
          input,
          0.1,
          state.world.bounds,
          state.world.objects.map((object) => object.collider),
        );
        if (side === 'north' || side === 'south') {
          expect(player.y).toBe(before.y);
          expect(player.x).toBeGreaterThan(before.x);
        } else {
          expect(player.x).toBe(before.x);
          expect(player.y).toBeGreaterThan(before.y);
        }
        expect(player.motion).toBe('run');
      }
    },
  );

  it.each([
    [1200, 600],
    [375, 300],
    [600, 1200],
  ])(
    'frames all final wall pieces and north-wall labels at %i by %i',
    (width, height) => {
      const camera = fitCamera(
        width,
        height,
        world.width,
        world.height,
        world.visualBounds,
      );
      for (const sprite of walls) {
        expect(camera.x + sprite.x * camera.scale).toBeGreaterThanOrEqual(0);
        expect(camera.y + sprite.y * camera.scale).toBeGreaterThanOrEqual(0);
        expect(
          camera.x + (sprite.x + sprite.width) * camera.scale,
        ).toBeLessThanOrEqual(width);
        expect(
          camera.y + (sprite.y + sprite.height) * camera.scale,
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
