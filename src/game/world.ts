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
}

export interface WorldObject extends WorldSprite {
  depth: number;
  collider: Rect;
}

export interface World {
  width: number;
  height: number;
  bounds: Rect;
  floors: WorldSprite[];
  structures: WorldSprite[];
  foreground: WorldSprite[];
  objects: WorldObject[];
}

export function createWorld(): World {
  const world: World = {
    width: COLUMNS * TILE_SIZE,
    height: ROWS * TILE_SIZE,
    bounds: {
      x: 84,
      y: 84,
      width: COLUMNS * TILE_SIZE - 168,
      height: ROWS * TILE_SIZE - 168,
    },
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
  for (let column = 1; column < COLUMNS - 1; column++) {
    const asset =
      column === 2 || column === 7
        ? environment.window
        : environment.wallHorizontal;
    world.structures.push(tile(asset, column, 0));
    world.foreground.push(tile(environment.wallHorizontal, column, ROWS - 1));
  }
  for (let row = 1; row < ROWS - 1; row++) {
    world.structures.push(
      tile(environment.wallVertical, 0, row),
      tile(environment.wallVertical, COLUMNS - 1, row),
    );
  }
  world.structures.push(
    tile(environment.topLeft, 0, 0),
    tile(environment.topRight, COLUMNS - 1, 0),
  );
  world.foreground.push(
    tile(environment.bottomLeft, 0, ROWS - 1),
    tile(environment.bottomRight, COLUMNS - 1, ROWS - 1),
  );
  world.structures.push(
    tile(environment.door, 4, 0),
    tile(environment.doorFrame, 4, 0),
    tile(environment.clock, 5, 0),
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
