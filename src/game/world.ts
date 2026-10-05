import {
  environment,
  structuralWalls,
  type StructuralAsset,
} from '../assets/manifest';
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
  const width = COLUMNS * TILE_SIZE;
  const height = ROWS * TILE_SIZE;
  // Explicit inner wall faces in world coordinates; PNG padding is not collision.
  const left = 96;
  const top = 112;
  const right = (COLUMNS - 1) * TILE_SIZE + 40;
  const bottom = (ROWS - 1) * TILE_SIZE + 16;
  const bounds = {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
  const world: World = {
    width,
    height,
    bounds,
    floorBounds: {
      x: TILE_SIZE / 2,
      y: TILE_SIZE / 2,
      width: width - TILE_SIZE,
      height: height - TILE_SIZE,
    },
    visualBounds: { x: 0, y: 0, width, height },
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
  const structure = (
    asset: StructuralAsset,
    column: number,
    row: number,
  ): WorldSprite => ({
    asset: asset.path,
    x: column * TILE_SIZE,
    y: row * TILE_SIZE,
    width: asset.width,
    height: asset.height,
    footprint: {
      x: column * TILE_SIZE,
      y: row * TILE_SIZE,
      width: asset.width,
      height: asset.height,
    },
  });
  const doorway = { column: 4, row: 0 };
  world.structures.push(
    structure(structuralWalls.topLeft, 0, 0),
    structure(structuralWalls.horizontalSingle, 1, 0),
    structure(structuralWalls.windowHorizontal, 2, 0),
    structure(structuralWalls.doorway, doorway.column, doorway.row),
    structure(structuralWalls.doorClosed, doorway.column, doorway.row),
    structure(structuralWalls.horizontalSingle, 6, 0),
    structure(structuralWalls.windowHorizontal, 7, 0),
    structure(structuralWalls.topRight, COLUMNS - 1, 0),
  );
  for (const column of [0, COLUMNS - 1]) {
    world.structures.push(
      structure(structuralWalls.vertical, column, 1),
      structure(structuralWalls.vertical, column, 3),
      structure(structuralWalls.verticalSingle, column, 5),
    );
  }
  world.foreground.push(
    structure(structuralWalls.bottomLeft, 0, ROWS - 1),
    structure(structuralWalls.bottomRight, COLUMNS - 1, ROWS - 1),
  );
  for (let column = 1; column < COLUMNS - 1; column += 2) {
    world.foreground.push(
      structure(structuralWalls.horizontal, column, ROWS - 1),
    );
  }
  world.structures.push(tile(environment.clock, 6, 0));
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
