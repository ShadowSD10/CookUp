import { DIRECTIONS, type Character, type Player } from '../entities/player';

export interface AnimationClip {
  frames: readonly string[];
  frameWidth: number;
  frameHeight: number;
  fps: number;
  loop: boolean;
}

function characterClips(
  folder: string,
  prefix: string,
): Record<string, AnimationClip> {
  const clips: Record<string, AnimationClip> = {};
  for (const motion of ['idle', 'walk', 'run'] as const) {
    const names =
      motion === 'idle'
        ? ['idle']
        : DIRECTIONS.map((direction) => `${motion}-${direction}`);
    for (const name of names) {
      clips[name] = {
        frames: Array.from(
          { length: 8 },
          (_, i) =>
            `assets/Spirits/${folder}/${name}/${prefix}-${name}-${String(i + 1).padStart(2, '0')}.png`,
        ),
        frameWidth: 256,
        frameHeight: 256,
        fps: motion === 'idle' ? 6 : motion === 'walk' ? 10 : 14,
        loop: true,
      };
    }
  }
  return clips;
}

const environmentRoot = 'assets/Spirits/Environment/Empty Kitchen';
const environmentPath = (path: string): string =>
  `${environmentRoot}/${path}.png`;
export interface StructuralAsset {
  path: string;
  width: number;
  height: number;
}

const structuralRoot =
  'assets/Spirits/Environment/Kitchen Structural Wall Kit Final';
const wallAsset = (
  name: string,
  width: number,
  height: number,
): StructuralAsset => ({
  path: `${structuralRoot}/${name}.png`,
  width,
  height,
});

export const structuralWalls = {
  horizontal: wallAsset(
    'Walls/cookup-structural-wall-horizontal-256x128',
    256,
    128,
  ),
  vertical: wallAsset(
    'Walls/cookup-structural-wall-vertical-128x256',
    128,
    256,
  ),
  horizontalSingle: wallAsset(
    'Walls/cookup-structural-wall-horizontal-single-128x128',
    128,
    128,
  ),
  verticalSingle: wallAsset(
    'Walls/cookup-structural-wall-vertical-single-128x128',
    128,
    128,
  ),
  topLeft: wallAsset(
    'Corners/cookup-structural-corner-top-left-128x128',
    128,
    128,
  ),
  topRight: wallAsset(
    'Corners/cookup-structural-corner-top-right-128x128',
    128,
    128,
  ),
  bottomLeft: wallAsset(
    'Corners/cookup-structural-corner-bottom-left-128x128',
    128,
    128,
  ),
  bottomRight: wallAsset(
    'Corners/cookup-structural-corner-bottom-right-128x128',
    128,
    128,
  ),
  capTop: wallAsset('Caps/cookup-structural-cap-top-128x128', 128, 128),
  capRight: wallAsset('Caps/cookup-structural-cap-right-128x128', 128, 128),
  capBottom: wallAsset('Caps/cookup-structural-cap-bottom-128x128', 128, 128),
  capLeft: wallAsset('Caps/cookup-structural-cap-left-128x128', 128, 128),
  doorway: wallAsset(
    'Doorway/cookup-structural-doorway-frame-opening-256x128',
    256,
    128,
  ),
  doorClosed: wallAsset(
    'Doorway/cookup-structural-door-closed-256x128',
    256,
    128,
  ),
  doorAjar: wallAsset('Doorway/cookup-structural-door-ajar-256x128', 256, 128),
  doorOpen: wallAsset('Doorway/cookup-structural-door-open-256x128', 256, 128),
  windowHorizontal: wallAsset(
    'Windows/cookup-structural-window-wall-horizontal-256x128',
    256,
    128,
  ),
  windowVertical: wallAsset(
    'Windows/cookup-structural-window-wall-vertical-128x256',
    128,
    256,
  ),
};

export const environment = {
  floor: environmentPath('Floor/cookup-floor-128'),
  floorWorn: environmentPath('Floor/Variations/cookup-floor-light-wear-128'),
  floorSpeckle: environmentPath(
    'Floor/Variations/cookup-floor-fine-speckle-128',
  ),
  plant: environmentPath('Decor/cookup-small-plant-128'),
  mat: environmentPath('Decor/cookup-floor-mat-128'),
  clock: environmentPath('Decor/cookup-wall-clock-128'),
};

export const characters: Record<Character, Record<string, AnimationClip>> = {
  maleCook: characterClips('Male Cook', 'male-cook'),
  femaleCook: characterClips('Female Cook', 'female-cook'),
};

export function getClip(character: Character, name: string): AnimationClip {
  const clip = characters[character][name];
  if (!clip) throw new Error(`Unknown animation: ${character}/${name}`);
  return clip;
}

export function clipName(player: Pick<Player, 'motion' | 'facing'>): string {
  return player.motion === 'idle'
    ? 'idle'
    : `${player.motion}-${player.facing}`;
}

export const assetPaths = [
  ...new Set([
    ...Object.values(environment),
    ...Object.values(structuralWalls).map((asset) => asset.path),
    ...Object.values(characters).flatMap((clips) =>
      Object.values(clips).flatMap((clip) => clip.frames),
    ),
  ]),
];

export function assetUrl(
  path: string,
  base = import.meta.env.BASE_URL,
): string {
  return `${base}${path.split('/').map(encodeURIComponent).join('/')}`;
}
