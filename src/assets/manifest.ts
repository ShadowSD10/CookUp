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
  connectors: string;
}

const structuralRoot =
  'assets/Spirits/Environment/Kitchen Structural Wall Kit Tall';
const wallAsset = (
  name: string,
  width: number,
  height: number,
  connectors: string,
): StructuralAsset => ({
  path: `${structuralRoot}/${name}.png`,
  width,
  height,
  connectors,
});

export const structuralWalls = {
  horizontal: wallAsset(
    'Walls/cookup-tall-wall-horizontal-256x256',
    256,
    256,
    'WE',
  ),
  vertical: wallAsset(
    'Walls/cookup-tall-wall-vertical-128x256',
    128,
    256,
    'NS',
  ),
  horizontalSingle: wallAsset(
    'Walls/cookup-tall-wall-horizontal-single-128x256',
    128,
    256,
    'WE',
  ),
  verticalSingle: wallAsset(
    'Walls/cookup-tall-wall-vertical-single-128x128',
    128,
    128,
    'NS',
  ),
  topLeft: wallAsset(
    'Corners/cookup-tall-corner-outside-top-left-128x256',
    128,
    256,
    'ES',
  ),
  topRight: wallAsset(
    'Corners/cookup-tall-corner-outside-top-right-128x256',
    128,
    256,
    'WS',
  ),
  bottomLeft: wallAsset(
    'Corners/cookup-tall-corner-outside-bottom-left-128x256',
    128,
    256,
    'EN',
  ),
  bottomRight: wallAsset(
    'Corners/cookup-tall-corner-outside-bottom-right-128x256',
    128,
    256,
    'WN',
  ),
  insideTopLeft: wallAsset(
    'Corners/cookup-tall-corner-inside-top-left-128x256',
    128,
    256,
    'ES',
  ),
  insideTopRight: wallAsset(
    'Corners/cookup-tall-corner-inside-top-right-128x256',
    128,
    256,
    'WS',
  ),
  insideBottomLeft: wallAsset(
    'Corners/cookup-tall-corner-inside-bottom-left-128x256',
    128,
    256,
    'EN',
  ),
  insideBottomRight: wallAsset(
    'Corners/cookup-tall-corner-inside-bottom-right-128x256',
    128,
    256,
    'WN',
  ),
  capTop: wallAsset('Caps/cookup-tall-cap-top-128x256', 128, 256, 'S'),
  capRight: wallAsset('Caps/cookup-tall-cap-right-128x256', 128, 256, 'W'),
  capBottom: wallAsset('Caps/cookup-tall-cap-bottom-128x256', 128, 256, 'N'),
  capLeft: wallAsset('Caps/cookup-tall-cap-left-128x256', 128, 256, 'E'),
  doorway: wallAsset(
    'Doorway/cookup-tall-doorway-horizontal-256x256',
    256,
    256,
    'WE',
  ),
  doorClosed: wallAsset(
    'Doorway/cookup-tall-door-horizontal-closed-256x256',
    256,
    256,
    '',
  ),
  doorAjar: wallAsset(
    'Doorway/cookup-tall-door-horizontal-ajar-256x256',
    256,
    256,
    '',
  ),
  doorOpen: wallAsset(
    'Doorway/cookup-tall-door-horizontal-open-256x256',
    256,
    256,
    '',
  ),
  doorwayVertical: wallAsset(
    'Doorway/cookup-tall-doorway-vertical-128x256',
    128,
    256,
    'NS',
  ),
  doorVerticalClosed: wallAsset(
    'Doorway/cookup-tall-door-vertical-closed-128x256',
    128,
    256,
    '',
  ),
  doorVerticalAjar: wallAsset(
    'Doorway/cookup-tall-door-vertical-ajar-128x256',
    128,
    256,
    '',
  ),
  doorVerticalOpen: wallAsset(
    'Doorway/cookup-tall-door-vertical-open-128x256',
    128,
    256,
    '',
  ),
  windowHorizontal: wallAsset(
    'Windows/cookup-tall-window-wall-horizontal-256x256',
    256,
    256,
    'WE',
  ),
  windowVertical: wallAsset(
    'Windows/cookup-tall-window-wall-vertical-128x256',
    128,
    256,
    'NS',
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
