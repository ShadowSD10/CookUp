import { describe, expect, it } from 'vitest';
import { equipment } from '../assets/manifest';
import { PLAYER_CONFIG } from '../core/config';
import { moveBody, type Rect } from '../systems/collision';
import { createGame, updateGame } from './state';
import { createWorld } from './world';

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

describe('equipment layout and circulation', () => {
  const world = createWorld();
  const registry = new Map(
    Object.values(equipment).map((asset) => [asset.path, asset]),
  );
  const objects = world.objects.filter((object) => registry.has(object.asset));

  it('places ten native objects in coherent zones without replacing architecture or stacking stove states', () => {
    expect(world.objects).toHaveLength(12);
    expect(objects.map(({ asset, x, y }) => ({ asset, x, y }))).toEqual([
      { asset: equipment.fridge.path, x: 128, y: 384 },
      { asset: equipment.stoveCookware.path, x: 256, y: 384 },
      { asset: equipment.sink.path, x: 384, y: 384 },
      { asset: equipment.counterEndLeft.path, x: 128, y: 640 },
      { asset: equipment.counterStraight.path, x: 256, y: 640 },
      { asset: equipment.counterEndRight.path, x: 384, y: 640 },
      { asset: equipment.island.path, x: 768, y: 384 },
      { asset: equipment.serving.path, x: 1024, y: 384 },
      { asset: equipment.table.path, x: 768, y: 640 },
      { asset: equipment.prep.path, x: 1024, y: 640 },
    ]);
    expect(
      objects.some((object) => object.asset === equipment.stove.path),
    ).toBe(false);
    for (const object of objects) {
      expect(object.x % 128).toBe(0);
      expect(object.y % 128).toBe(0);
      expect([object.width, object.height]).toEqual([
        registry.get(object.asset)?.width,
        registry.get(object.asset)?.height,
      ]);
      expect(object.depth).toBe(object.collider.y + object.collider.height);
      expect(object).not.toHaveProperty('rotation');
      expect(object).not.toHaveProperty('clip');
      expect(object.collider.height).toBeLessThan(object.height);
      expect(object.collider.width).toBeLessThanOrEqual(object.width);
    }
  });

  it('joins the left-end, straight, and right-end counter surfaces and body footprints without gaps', () => {
    const run = objects.filter((object) =>
      [
        equipment.counterEndLeft.path,
        equipment.counterStraight.path,
        equipment.counterEndRight.path,
      ].includes(object.asset),
    );
    expect(run).toHaveLength(3);
    for (let index = 1; index < run.length; index++) {
      const previous = run[index - 1];
      const next = run[index];
      if (!previous || !next) throw new Error('Expected counter run');
      expect(previous.x + previous.width).toBe(next.x);
      expect(previous.y).toBe(next.y);
      expect(previous.collider.x + previous.collider.width).toBe(
        next.collider.x,
      );
      expect(previous.depth).toBe(next.depth);
    }
  });

  it('keeps the north architecture, 256-unit entrance lane and primary two-player aisles unobstructed', () => {
    const entrance = { x: 512, y: 248, width: 256, height: 704 };
    const crossAisle = { x: 248, y: 496, width: 944, height: 216 };
    const southAisle = { x: 96, y: 756, width: 1096, height: 196 };
    for (const object of objects) {
      expect(overlaps(object, { x: 0, y: 0, width: 1280, height: 256 })).toBe(
        false,
      );
      expect(overlaps(object, entrance)).toBe(false);
      expect(overlaps(object.collider, crossAisle)).toBe(false);
      expect(overlaps(object.collider, southAisle)).toBe(false);
      expect(object.y + object.height).toBeLessThanOrEqual(768);
      for (const other of world.objects) {
        if (object === other) continue;
        expect(overlaps(object.collider, other.collider)).toBe(false);
      }
    }
    for (const width of [
      entrance.width,
      crossAisle.height,
      southAisle.height,
    ]) {
      expect(width).toBeGreaterThanOrEqual(128);
      expect(width - 2 * PLAYER_CONFIG.collisionWidth).toBeGreaterThanOrEqual(
        60,
      );
    }
    for (const player of createGame().players) {
      const body = {
        x: player.x - 17,
        y: player.y - 12,
        width: 34,
        height: 24,
      };
      expect(
        world.objects.some((object) => overlaps(body, object.collider)),
      ).toBe(false);
    }
  });

  it.each(objects.map((object) => [object.asset, object] as const))(
    'blocks both chefs at all four physical faces of %s',
    (_path, object) => {
      for (const template of createGame().players) {
        const { x, y, width, height } = object.collider;
        for (const side of ['north', 'south', 'east', 'west'] as const) {
          const player = { ...template, x: x + width / 2, y: y + height / 2 };
          const horizontal = side === 'east' || side === 'west';
          if (side === 'north') player.y = y - 64;
          if (side === 'south') player.y = y + height + 64;
          if (side === 'west') player.x = x - 64;
          if (side === 'east') player.x = x + width + 64;
          const delta = side === 'east' || side === 'south' ? -500 : 500;
          moveBody(
            player,
            horizontal ? delta : 0,
            horizontal ? 0 : delta,
            world.bounds,
            [object.collider],
          );
          if (side === 'north') expect(player.y).toBe(y - 12);
          if (side === 'south') expect(player.y).toBe(y + height + 12);
          if (side === 'west') expect(player.x).toBe(x - 17);
          if (side === 'east') expect(player.x).toBe(x + width + 17);
        }
      }
    },
  );

  it('allows feet across the transparent lower canvas margins instead of blocking the full PNG', () => {
    for (const object of objects) {
      for (const template of createGame().players) {
        const player = {
          ...template,
          x: Math.min(1175, object.x + object.width + 24),
          y: object.y + object.height,
        };
        const destination = Math.max(113, object.x - 24);
        moveBody(player, destination - player.x, 0, world.bounds, [
          object.collider,
        ]);
        expect(player.x).toBe(destination);
        expect(player.y).toBe(object.y + object.height);
      }
    }
  });

  it('slides along a solid counter face during diagonal movement', () => {
    const state = createGame();
    for (const player of state.players) {
      player.x = 300;
      player.y = 700;
    }
    for (let i = 0; i < 30; i++)
      updateGame(
        state,
        [
          { x: 1, y: 1, run: false },
          { x: 1, y: 1, run: true },
        ],
        1 / 120,
      );
    for (const player of state.players) {
      expect(player.x).toBeGreaterThan(340);
      expect(player.y).toBe(700);
    }
  });

  it('routes both chefs to every object front and the entrance through the actual collision system', () => {
    const obstacles = [
      ...world.wallColliders,
      ...world.objects.map((object) => object.collider),
    ];
    const template = createGame().players[0];
    const start = { x: 640, y: 608 };
    const reached = new Map<string, typeof start>([
      [`${start.x},${start.y}`, start],
    ]);
    const queue = [start];
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      if (!point) throw new Error('Expected route point');
      for (const [dx, dy] of [
        [16, 0],
        [-16, 0],
        [0, 16],
        [0, -16],
      ] as const) {
        const next = { ...template, ...point };
        moveBody(next, dx, dy, world.bounds, obstacles);
        if (next.x !== point.x + dx || next.y !== point.y + dy) continue;
        const key = `${next.x},${next.y}`;
        if (!reached.has(key)) {
          const value = { x: next.x, y: next.y };
          reached.set(key, value);
          queue.push(value);
        }
      }
    }
    const targets = [
      { x: 640, y: 272 },
      ...objects.map(({ collider }) => ({
        x: collider.x + collider.width / 2,
        y: collider.y + collider.height + 28,
      })),
    ];
    for (const target of targets) {
      expect(
        queue.some(
          (point) =>
            Math.abs(point.x - target.x) <= 16 &&
            Math.abs(point.y - target.y) <= 16,
        ),
        JSON.stringify(target),
      ).toBe(true);
    }
    const state = createGame();
    state.players[0].x = 576;
    state.players[1].x = 704;
    for (let i = 0; i < 240; i++)
      updateGame(
        state,
        [
          { x: 0, y: -1, run: true },
          { x: 0, y: -1, run: true },
        ],
        1 / 120,
      );
    expect(state.players.map((player) => player.y)).toEqual([260, 260]);
    for (let i = 0; i < 240; i++)
      updateGame(
        state,
        [
          { x: 0, y: 1, run: true },
          { x: 0, y: 1, run: true },
        ],
        1 / 120,
      );
    expect(state.players.map((player) => player.y)).toEqual([940, 940]);
  });

  it('allows the configured open door passage through the furnished kitchen without moving the doorway', () => {
    const state = createGame();
    state.world = createWorld({
      state: 'open',
      connectedBounds: { x: 96, y: -512, width: 1096, height: 1464 },
    });
    for (const player of state.players) {
      player.x = 646;
      player.y = 800;
    }
    for (let i = 0; i < 240; i++)
      updateGame(
        state,
        [
          { x: 0, y: -1, run: true },
          { x: 0, y: -1, run: true },
        ],
        1 / 120,
      );
    for (const player of state.players) expect(player.y).toBeCloseTo(-100);
  });
});
