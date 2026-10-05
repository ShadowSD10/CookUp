import { environment } from '../assets/manifest';
import type { Rect } from '../systems/collision';

export const TILE_SIZE = 128;
const COLUMNS = 10;
const ROWS = 7;

export interface WorldSprite {
  asset: string;
  x: number;
  y: number;
  width: number;
  height: number;
  footprint: Rect;
  clip?: Rect;
}

export interface WorldObject extends WorldSprite {
  depth: number;
  collider: Rect;
}

export interface World {
  width: number;
  height: number;
  bounds: Rect;
  floorBounds: Rect;
  visualBounds: Rect;
  floors: WorldSprite[];
  structures: WorldSprite[];
  foreground: WorldSprite[];
  objects: WorldObject[];
}

export function createWorld(): World {
  const bounds = {
    x: 84,
    y: 84,
    width: COLUMNS * TILE_SIZE - 168,
    height: ROWS * TILE_SIZE - 168,
  };
  // Native PNG ink bounds: horizontal y=32..232, vertical x=48..212.
  // These describe artwork placement, not the player's collision geometry.
  const wallVisual = {
    size: 256,
    horizontalTop: 32,
    horizontalBottom: 233,
    verticalLeft: 48,
    verticalRight: 213,
  };
  const wallWidth = wallVisual.verticalRight - wallVisual.verticalLeft;
  const wallHeight = wallVisual.horizontalBottom - wallVisual.horizontalTop;
  const visualBounds: Rect = {
    x: bounds.x - wallWidth,
    y: bounds.y - wallHeight,
    width: bounds.width + 2 * wallWidth,
    height: bounds.height + 2 * wallHeight,
  };
  const world: World = {
    width: COLUMNS * TILE_SIZE,
    height: ROWS * TILE_SIZE,
    bounds,
    floorBounds: { ...bounds },
    visualBounds,
    floors: [],
    structures: [],
    foreground: [],
    objects: [],
  };
  const tile = (asset: string, column: number, row: number): WorldSprite => ({
    asset,
    x: column * TILE_SIZE,
    y: row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    footprint: {
      x: column * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
  });
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      const variation = (row * 7 + column * 3) % 13;
      world.floors.push(
        tile(
          variation === 0
            ? environment.floorWorn
            : variation === 4
              ? environment.floorSpeckle
              : environment.floor,
          column,
          row,
        ),
      );
    }
  }
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  const horizontalWall = (column: number, south: boolean): WorldSprite => ({
    asset: environment.wallHorizontal,
    footprint: {
      x: column * TILE_SIZE,
      y: south ? (ROWS - 1) * TILE_SIZE : 0,
      width: 2 * TILE_SIZE,
      height: TILE_SIZE,
    },
    x: column * TILE_SIZE,
    y: south
      ? bottom - wallVisual.horizontalTop
      : bounds.y - wallVisual.horizontalBottom,
    width: wallVisual.size,
    height: wallVisual.size,
    clip: {
      x: visualBounds.x,
      y: south ? bottom : visualBounds.y,
      width: visualBounds.width,
      height: wallHeight,
    },
  });
  // Partial end modules are clipped, never resized. Horizontal runs cover the
  // corner joins; dedicated structural corner/cap images are not in this kit.
  for (let column = -1; column < COLUMNS; column += 2) {
    world.structures.push(horizontalWall(column, false));
    world.foreground.push(horizontalWall(column, true));
  }
  for (let row = 0; row < ROWS; row += 2) {
    for (const east of [false, true]) {
      world.structures.push({
        asset: environment.wallVertical,
        footprint: {
          x: east ? (COLUMNS - 1) * TILE_SIZE : 0,
          y: row * TILE_SIZE,
          width: TILE_SIZE,
          height: 2 * TILE_SIZE,
        },
        x: east
          ? right - wallVisual.verticalLeft
          : bounds.x - wallVisual.verticalRight,
        y: row * TILE_SIZE,
        width: wallVisual.size,
        height: wallVisual.size,
        clip: {
          x: east ? right : visualBounds.x,
          y: bounds.y,
          width: wallWidth,
          height: bounds.height,
        },
      });
    }
  }
  const wallDetail = (asset: string, column: number): WorldSprite => ({
    ...tile(asset, column, 0),
    y: bounds.y - TILE_SIZE - 32,
  });
  world.structures.push(
    wallDetail(environment.window, 2),
    wallDetail(environment.window, 7),
    wallDetail(environment.door, 4),
    wallDetail(environment.doorFrame, 4),
    wallDetail(environment.clock, 5),
  );
  world.floors.push(tile(environment.mat, 4, 1));
  for (const column of [1, COLUMNS - 2]) {
    const plant = tile(environment.plant, column, 1);
    world.objects.push({
      ...plant,
      depth: plant.y + 103,
      collider: { x: plant.x + 46, y: plant.y + 77, width: 36, height: 28 },
    });
  }
  return world;
}
