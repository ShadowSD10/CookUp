import {
  environment,
  equipment,
  structuralWalls,
  type SpriteAsset,
  type StructuralAsset,
} from '../assets/manifest';
import type { Rect } from '../systems/collision';

export const TILE_SIZE = 128;
const COLUMNS = 10;
const ROWS = 9;
const CLOCK_RENDER_SCALE = 1.75;
const SOUTH_WALL_VISIBLE_HEIGHT = 150;
const ROOM_EDGES = { left: 96, top: 248, right: 1192, bottom: 952 } as const;

export type DoorConfiguration =
  { state: 'closed' | 'ajar' } | { state: 'open'; connectedBounds: Rect };

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
  wallColliders: Rect[];
  floorBounds: Rect;
  visualBounds: Rect;
  floors: WorldSprite[];
  structures: WorldSprite[];
  foreground: WorldSprite[];
  foregroundBounds: Rect;
  objects: WorldObject[];
}

export function createWorld(
  door: DoorConfiguration = { state: 'closed' },
): World {
  const width = COLUMNS * TILE_SIZE;
  const height = ROWS * TILE_SIZE;
  // Explicit inner wall faces in world coordinates; PNG padding is not collision.
  const { left, top, right, bottom } = ROOM_EDGES;
  const bounds = {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
  if (door.state === 'open') {
    const connected = door.connectedBounds;
    if (
      !Object.values(connected).every(Number.isFinite) ||
      connected.x > left ||
      connected.y >= 0 ||
      connected.x + connected.width < right ||
      connected.y + connected.height < bottom
    ) {
      throw new Error(
        'An open perimeter door requires bounds for a connected room north of the kitchen',
      );
    }
  }
  // The open leaf ends at x=604; the opposite jamb starts at x=688.
  // These explicit passage/collision coordinates are not PNG rectangles.
  const passageLeft = 604;
  const passageRight = 688;
  const wallColliders: Rect[] = [
    { x: 40, y: 0, width: left - 40, height },
    { x: right, y: 0, width: 56, height },
    { x: left, y: 0, width: passageLeft - left, height: top },
    { x: passageRight, y: 0, width: right - passageRight, height: top },
    { x: left, y: bottom, width: right - left, height: height - bottom },
  ];
  if (door.state !== 'open') {
    wallColliders.push({
      x: passageLeft,
      y: 0,
      width: passageRight - passageLeft,
      height: top,
    });
  }
  const world: World = {
    width,
    height,
    bounds: door.state === 'open' ? { ...door.connectedBounds } : bounds,
    wallColliders,
    floorBounds: {
      x: TILE_SIZE / 2,
      y: TILE_SIZE,
      width: width - TILE_SIZE,
      height: height - 2 * TILE_SIZE,
    },
    visualBounds: { x: 0, y: 0, width, height },
    floors: [],
    structures: [],
    foreground: [],
    // Cut the south facade at its authored panel seam, not at its collider.
    foregroundBounds: {
      x: 0,
      y: (ROWS - 2) * TILE_SIZE,
      width,
      height: SOUTH_WALL_VISIBLE_HEIGHT,
    },
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
    columns: number,
    rows: number,
  ): WorldSprite => ({
    asset: asset.path,
    x: column * TILE_SIZE,
    y: row * TILE_SIZE,
    width: asset.width,
    height: asset.height,
    footprint: {
      x: column * TILE_SIZE,
      y: row * TILE_SIZE,
      width: columns * TILE_SIZE,
      height: rows * TILE_SIZE,
    },
  });
  const doorway = { column: 4, row: 0 };
  const doorAsset = {
    closed: structuralWalls.doorClosed,
    ajar: structuralWalls.doorAjar,
    open: structuralWalls.doorOpen,
  }[door.state];
  world.structures.push(
    structure(structuralWalls.topLeft, 0, 0, 1, 2),
    structure(structuralWalls.horizontalSingle, 1, 0, 1, 2),
    structure(structuralWalls.windowHorizontal, 2, 0, 2, 2),
    structure(structuralWalls.doorway, doorway.column, doorway.row, 2, 2),
    structure(doorAsset, doorway.column, doorway.row, 0, 0),
    structure(structuralWalls.horizontalSingle, 6, 0, 1, 2),
    structure(structuralWalls.windowHorizontal, 7, 0, 2, 2),
    structure(structuralWalls.topRight, COLUMNS - 1, 0, 1, 2),
  );
  for (const column of [0, COLUMNS - 1]) {
    world.structures.push(
      structure(structuralWalls.vertical, column, 2, 1, 2),
      structure(structuralWalls.windowVertical, column, 4, 1, 2),
      structure(structuralWalls.verticalSingle, column, 6, 1, 1),
    );
  }
  world.foreground.push(
    structure(structuralWalls.bottomLeft, 0, ROWS - 2, 1, 2),
    structure(structuralWalls.bottomRight, COLUMNS - 1, ROWS - 2, 1, 2),
  );
  for (let column = 1; column < COLUMNS - 1; column += 2) {
    world.foreground.push(
      structure(structuralWalls.horizontal, column, ROWS - 2, 2, 2),
    );
  }
  const clock = tile(environment.clock, 6, 0);
  const clockSize = TILE_SIZE * CLOCK_RENDER_SCALE;
  world.structures.push({
    ...clock,
    x: clock.x + TILE_SIZE / 2 - clockSize / 2,
    y: 96 - clockSize / 2,
    width: clockSize,
    height: clockSize,
  });
  world.floors.push(tile(environment.mat, 4, 2));
  for (const column of [1, COLUMNS - 2]) {
    const plant = tile(environment.plant, column, 2);
    world.objects.push({
      ...plant,
      depth: plant.y + 103,
      collider: { x: plant.x + 46, y: plant.y + 77, width: 36, height: 28 },
    });
  }
  const placeEquipment = (
    asset: SpriteAsset,
    column: number,
    row: number,
    body: Rect = { x: 12, y: 72, width: 104, height: 40 },
  ): void => {
    const x = column * TILE_SIZE;
    const y = row * TILE_SIZE;
    world.objects.push({
      asset: asset.path,
      x,
      y,
      width: asset.width,
      height: asset.height,
      footprint: {
        x,
        y: y + asset.height - TILE_SIZE,
        width: asset.width,
        height: TILE_SIZE,
      },
      collider: {
        x: x + body.x,
        y: y + body.y,
        width: body.width,
        height: body.height,
      },
      depth: y + body.y + body.height,
    });
  };
  placeEquipment(equipment.fridge, 1, 3, {
    x: 24,
    y: 200,
    width: 80,
    height: 40,
  });
  placeEquipment(equipment.stoveCookware, 2, 3);
  placeEquipment(equipment.sink, 3, 3);
  placeEquipment(equipment.counterEndLeft, 1, 5, {
    x: 12,
    y: 72,
    width: 116,
    height: 40,
  });
  placeEquipment(equipment.counterStraight, 2, 5, {
    x: 0,
    y: 72,
    width: 128,
    height: 40,
  });
  placeEquipment(equipment.counterEndRight, 3, 5, {
    x: 0,
    y: 72,
    width: 116,
    height: 40,
  });
  placeEquipment(equipment.island, 6, 3, {
    x: 12,
    y: 72,
    width: 232,
    height: 40,
  });
  placeEquipment(equipment.serving, 8, 3);
  placeEquipment(equipment.table, 6, 5, {
    x: 24,
    y: 72,
    width: 212,
    height: 44,
  });
  placeEquipment(equipment.prep, 8, 5);
  return world;
}
