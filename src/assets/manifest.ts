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
            `assets/Spirits/characters/${folder}/${motion}/${prefix}-${name}-${String(i + 1).padStart(2, '0')}.png`,
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

const environmentRoot = 'assets/Spirits/environment';
const environmentPath = (path: string): string =>
  `${environmentRoot}/${path}.png`;
export interface StructuralAsset {
  path: string;
  width: number;
  height: number;
  connectors: string;
}

const structuralRoot = `${environmentRoot}/structure`;
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
    'walls/tall/cookup-tall-wall-horizontal-256x256',
    256,
    256,
    'WE',
  ),
  vertical: wallAsset(
    'walls/tall/cookup-tall-wall-vertical-128x256',
    128,
    256,
    'NS',
  ),
  horizontalSingle: wallAsset(
    'walls/tall/cookup-tall-wall-horizontal-single-128x256',
    128,
    256,
    'WE',
  ),
  verticalSingle: wallAsset(
    'walls/tall/cookup-tall-wall-vertical-single-128x128',
    128,
    128,
    'NS',
  ),
  topLeft: wallAsset(
    'corners/tall/cookup-tall-corner-outside-top-left-128x256',
    128,
    256,
    'ES',
  ),
  topRight: wallAsset(
    'corners/tall/cookup-tall-corner-outside-top-right-128x256',
    128,
    256,
    'WS',
  ),
  bottomLeft: wallAsset(
    'corners/tall/cookup-tall-corner-outside-bottom-left-128x256',
    128,
    256,
    'EN',
  ),
  bottomRight: wallAsset(
    'corners/tall/cookup-tall-corner-outside-bottom-right-128x256',
    128,
    256,
    'WN',
  ),
  insideTopLeft: wallAsset(
    'corners/tall/cookup-tall-corner-inside-top-left-128x256',
    128,
    256,
    'ES',
  ),
  insideTopRight: wallAsset(
    'corners/tall/cookup-tall-corner-inside-top-right-128x256',
    128,
    256,
    'WS',
  ),
  insideBottomLeft: wallAsset(
    'corners/tall/cookup-tall-corner-inside-bottom-left-128x256',
    128,
    256,
    'EN',
  ),
  insideBottomRight: wallAsset(
    'corners/tall/cookup-tall-corner-inside-bottom-right-128x256',
    128,
    256,
    'WN',
  ),
  capTop: wallAsset('caps/tall/cookup-tall-cap-top-128x256', 128, 256, 'S'),
  capRight: wallAsset('caps/tall/cookup-tall-cap-right-128x256', 128, 256, 'W'),
  capBottom: wallAsset(
    'caps/tall/cookup-tall-cap-bottom-128x256',
    128,
    256,
    'N',
  ),
  capLeft: wallAsset('caps/tall/cookup-tall-cap-left-128x256', 128, 256, 'E'),
  doorway: wallAsset(
    'doors/tall/cookup-tall-doorway-horizontal-256x256',
    256,
    256,
    'WE',
  ),
  doorClosed: wallAsset(
    'doors/tall/cookup-tall-door-horizontal-closed-256x256',
    256,
    256,
    '',
  ),
  doorAjar: wallAsset(
    'doors/tall/cookup-tall-door-horizontal-ajar-256x256',
    256,
    256,
    '',
  ),
  doorOpen: wallAsset(
    'doors/tall/cookup-tall-door-horizontal-open-256x256',
    256,
    256,
    '',
  ),
  doorwayVertical: wallAsset(
    'doors/tall/cookup-tall-doorway-vertical-128x256',
    128,
    256,
    'NS',
  ),
  doorVerticalClosed: wallAsset(
    'doors/tall/cookup-tall-door-vertical-closed-128x256',
    128,
    256,
    '',
  ),
  doorVerticalAjar: wallAsset(
    'doors/tall/cookup-tall-door-vertical-ajar-128x256',
    128,
    256,
    '',
  ),
  doorVerticalOpen: wallAsset(
    'doors/tall/cookup-tall-door-vertical-open-128x256',
    128,
    256,
    '',
  ),
  windowHorizontal: wallAsset(
    'windows/tall/cookup-tall-window-wall-horizontal-256x256',
    256,
    256,
    'WE',
  ),
  windowVertical: wallAsset(
    'windows/tall/cookup-tall-window-wall-vertical-128x256',
    128,
    256,
    'NS',
  ),
};

export const environment = {
  floor: environmentPath('structure/floors/cookup-floor-128'),
  floorWorn: environmentPath(
    'structure/floors/variations/cookup-floor-light-wear-128',
  ),
  floorSpeckle: environmentPath(
    'structure/floors/variations/cookup-floor-fine-speckle-128',
  ),
  plant: environmentPath('decorations/cookup-small-plant-128'),
  mat: environmentPath('decorations/cookup-floor-mat-128'),
  clock: environmentPath('decorations/cookup-wall-clock-128'),
};

export const characters: Record<Character, Record<string, AnimationClip>> = {
  maleCook: characterClips('male-cook', 'male-cook'),
  femaleCook: characterClips('female-cook', 'female-cook'),
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
