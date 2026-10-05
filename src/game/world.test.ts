import { describe, expect, it } from 'vitest';
import { environment, structuralWalls } from '../assets/manifest';
import { PLAYER_CONFIG } from '../core/config';
import { fitCamera } from '../rendering/camera';
import { movePlayer } from '../systems/movement';
import { createGame, updateGame } from './state';
import { createWorld, TILE_SIZE } from './world';

describe('tall structural wall layout', () => {
  const world = createWorld();
  const registry = new Map(
    Object.values(structuralWalls).map((asset) => [asset.path, asset]),
  );
  const walls = [...world.structures, ...world.foreground].filter((sprite) =>
    registry.has(sprite.asset),
  );
  const perimeter = walls.filter((sprite) => sprite.footprint.width > 0);

  it('preserves the grid, scale, room dimensions and floor while expanding southward movement', () => {
    expect(TILE_SIZE).toBe(128);
    expect([world.width, world.height]).toEqual([1280, 1152]);
    expect(world.bounds).toEqual({ x: 96, y: 248, width: 1096, height: 704 });
    expect(
      (world.bounds.width * world.bounds.height) / (1096 * 672),
    ).toBeGreaterThan(0.97);
    expect(PLAYER_CONFIG.renderScale).toBe(0.5);
    expect(240 / (256 * PLAYER_CONFIG.renderScale)).toBe(1.875);
    expect(world.visualBounds).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 1152,
    });
    expect(world.floorBounds).toEqual({
      x: 64,
      y: 128,
      width: 1152,
      height: 896,
    });
    expect(
      world.floors.filter((sprite) => sprite.asset !== environment.mat),
    ).toHaveLength(90);
    expect(world.objects).toHaveLength(2);
  });

  it('uses only tall structural assets with native dimensions and exact grid anchors', () => {
    expect(walls).toHaveLength(20);
    for (const wall of walls) {
      const asset = registry.get(wall.asset);
      if (!asset)
        throw new Error(`Unregistered structural asset: ${wall.asset}`);
      expect(wall.width).toBe(asset.width);
      expect(wall.height).toBe(asset.height);
      expect(wall.x % TILE_SIZE).toBe(0);
      expect(wall.y % TILE_SIZE).toBe(0);
      const overlay = asset.connectors === '';
      expect(wall.footprint).toEqual({
        x: wall.x,
        y: wall.y,
        width: overlay ? 0 : wall.width,
        height: overlay ? 0 : wall.height,
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
        /\/legacy\/|\/Environment\/|Wall Kit|Empty Kitchen/,
      );
    }
  });

  it('covers each perimeter cell exactly once without overlaps, gaps, or interior structural tiles', () => {
    for (let row = 0; row < 9; row++) {
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
        const border = row < 2 || row >= 7 || column === 0 || column === 9;
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

  it('keeps native two-row modules but presents one continuous south cutaway independent of collision', () => {
    for (const [asset, x, y] of [
      [structuralWalls.topLeft.path, 0, 0],
      [structuralWalls.topRight.path, 1152, 0],
      [structuralWalls.bottomLeft.path, 0, 896],
      [structuralWalls.bottomRight.path, 1152, 896],
    ] as const) {
      expect(walls.filter((wall) => wall.asset === asset)).toEqual([
        expect.objectContaining({ asset, x, y, width: 128, height: 256 }),
      ]);
    }
    expect(world.foreground).toHaveLength(6);
    expect(world.foreground.every((wall) => wall.y === 896)).toBe(true);
    expect(world.foregroundBounds).toEqual({
      x: 0,
      y: 896,
      width: 1280,
      height: 150,
    });
    const southernFace = world.bounds.y + world.bounds.height;
    expect(southernFace).toBe(952);
    expect(world.wallColliders).toContainEqual({
      x: 96,
      y: 952,
      width: 1096,
      height: 200,
    });
    const southernFeet = southernFace - PLAYER_CONFIG.collisionHeight / 2;
    const spriteBottom =
      southernFeet +
      256 * PLAYER_CONFIG.renderScale * (1 - PLAYER_CONFIG.anchorY);
    expect(southernFeet).toBe(940);
    expect(spriteBottom).toBeGreaterThan(904);
    const spriteTop =
      southernFeet - 256 * PLAYER_CONFIG.renderScale * PLAYER_CONFIG.anchorY;
    expect(904 - spriteTop).toBeGreaterThan(80);
    expect(spriteBottom - 904).toBeLessThan(48);
    expect(southernFace).not.toBe(
      world.foregroundBounds.y + world.foregroundBounds.height,
    );
  });

  it('enlarges only the existing clock by 1.75 with a centered, clear north-wall anchor', () => {
    const clock = world.structures.find(
      (sprite) => sprite.asset === environment.clock,
    );
    expect(clock).toMatchObject({
      x: 720,
      y: -16,
      width: 224,
      height: 224,
      footprint: { x: 768, y: 0, width: 128, height: 128 },
    });
    if (!clock) throw new Error('Expected the original clock');
    expect(clock.width / 128).toBe(1.75);
    expect(clock.height / 128).toBe(1.75);
    expect(clock.x + clock.width / 2).toBe(832);
    // Source alpha bounds are [46,45]..[81,79], inside a padded 128px canvas.
    expect(clock.x + 46 * 1.75).toBeGreaterThan(768);
    expect(clock.x + 82 * 1.75).toBeLessThan(896);
    expect(clock.y + 45 * 1.75).toBeGreaterThan(48);
    expect(clock.y + 80 * 1.75).toBeLessThan(142);
  });

  it('replaces wall slots with tall windows and gives the door overlay no additional occupied cells', () => {
    const doorway = walls.find(
      (wall) => wall.asset === structuralWalls.doorway.path,
    );
    const door = walls.find(
      (wall) => wall.asset === structuralWalls.doorClosed.path,
    );
    expect(doorway).toMatchObject({ x: 512, y: 0, width: 256, height: 256 });
    expect(door).toEqual({
      ...doorway,
      asset: structuralWalls.doorClosed.path,
      footprint: { x: 512, y: 0, width: 0, height: 0 },
    });
    expect(
      walls
        .filter((wall) => wall.asset === structuralWalls.windowHorizontal.path)
        .map(({ x, y, width, height }) => ({ x, y, width, height })),
    ).toEqual([
      { x: 256, y: 0, width: 256, height: 256 },
      { x: 896, y: 0, width: 256, height: 256 },
    ]);
    expect(
      walls
        .filter((wall) => wall.asset === structuralWalls.windowVertical.path)
        .map(({ x, y }) => ({ x, y })),
    ).toEqual([
      { x: 0, y: 512 },
      { x: 1152, y: 512 },
    ]);
    for (const state of [
      structuralWalls.doorClosed,
      structuralWalls.doorAjar,
      structuralWalls.doorOpen,
    ]) {
      expect([state.width, state.height]).toEqual([256, 256]);
    }
  });

  it('connects every authored port to exactly one matching port without rotation', () => {
    for (const wall of perimeter) {
      const ports = registry.get(wall.asset)?.connectors;
      if (!ports) throw new Error('Expected structural ports');
      for (const port of ports) {
        const opposite = { E: 'W', W: 'E', N: 'S', S: 'N' }[port];
        const matching = perimeter.filter((neighbor) => {
          if (
            !opposite ||
            !registry.get(neighbor.asset)?.connectors.includes(opposite)
          )
            return false;
          if (port === 'E' || port === 'W') {
            return (
              neighbor.y === wall.y &&
              neighbor.height === wall.height &&
              (port === 'E'
                ? neighbor.x === wall.x + wall.width
                : neighbor.x + neighbor.width === wall.x)
            );
          }
          return (
            neighbor.x === wall.x &&
            neighbor.width === wall.width &&
            (port === 'S'
              ? neighbor.y === wall.y + wall.height
              : neighbor.y + neighbor.height === wall.y)
          );
        });
        expect(matching, `${wall.asset} ${port}`).toHaveLength(1);
      }
    }
  });

  it.each(['closed', 'ajar'] as const)(
    'keeps the %s door blocked and draws exactly one matching overlay',
    (state) => {
      const game = createGame();
      game.world = createWorld({ state });
      // Exercise the door collider itself, not just the default room clamp.
      game.world.bounds = { x: 96, y: -512, width: 1096, height: 1464 };
      const overlays = game.world.structures.filter(
        (sprite) => sprite.footprint.width === 0,
      );
      expect(overlays).toHaveLength(1);
      expect(overlays[0]).toMatchObject({
        x: 512,
        y: 0,
        width: 256,
        height: 256,
        asset:
          state === 'closed'
            ? structuralWalls.doorClosed.path
            : structuralWalls.doorAjar.path,
      });
      for (const player of game.players) {
        player.x = 640;
        player.y = 400;
      }
      updateGame(
        game,
        [
          { x: 0, y: -1, run: true },
          { x: 0, y: -1, run: true },
        ],
        2,
      );
      for (const player of game.players) expect(player.y).toBe(260);
    },
  );

  it('allows both chefs through an open doorway into supplied connected-room bounds and back, but blocks the jambs', () => {
    const game = createGame();
    game.world = createWorld({
      state: 'open',
      connectedBounds: { x: 96, y: -512, width: 1096, height: 1464 },
    });
    const overlays = game.world.structures.filter(
      (sprite) => sprite.footprint.width === 0,
    );
    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      asset: structuralWalls.doorOpen.path,
      x: 512,
      y: 0,
      width: 256,
      height: 256,
    });
    for (const player of game.players) {
      player.x = 646;
      player.y = 400;
    }
    for (let i = 0; i < 120; i++)
      updateGame(
        game,
        [
          { x: 0, y: -1, run: true },
          { x: 0, y: -1, run: true },
        ],
        1 / 120,
      );
    for (const player of game.players) expect(player.y).toBeCloseTo(-50);
    for (let i = 0; i < 120; i++)
      updateGame(
        game,
        [
          { x: 0, y: 1, run: true },
          { x: 0, y: 1, run: true },
        ],
        1 / 120,
      );
    for (const player of game.players) expect(player.y).toBeCloseTo(400);
    game.players[0].x = 603;
    game.players[1].x = 689;
    updateGame(
      game,
      [
        { x: 0, y: -1, run: true },
        { x: 0, y: -1, run: true },
      ],
      2,
    );
    for (const player of game.players) expect(player.y).toBe(260);
  });

  it('rejects open-door bounds that would create an invisible barrier across the passage', () => {
    for (const connectedBounds of [
      world.bounds,
      { x: 96, y: -128, width: 100, height: 1032 },
      { x: 96, y: NaN, width: 1096, height: 1032 },
    ]) {
      expect(() => createWorld({ state: 'open', connectedBounds })).toThrow(
        'connected room',
      );
    }
  });

  it.each(['north', 'south', 'west', 'east'] as const)(
    'slides along the %s inner face, including transparent padding inside the wall cell',
    (side) => {
      const state = createGame();
      for (const player of state.players) {
        player.x = side === 'west' ? 113 : side === 'east' ? 1175 : 640;
        player.y = side === 'north' ? 260 : side === 'south' ? 940 : 576;
        const before = { x: player.x, y: player.y };
        const input = {
          x: side === 'west' ? -1 : 1,
          y: side === 'north' ? -1 : 1,
          run: true,
        };
        movePlayer(player, input, 0.1, state.world.bounds, [
          ...state.world.wallColliders,
          ...state.world.objects.map((object) => object.collider),
        ]);
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
    'frames all tall wall pieces and north-wall labels at %i by %i',
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
