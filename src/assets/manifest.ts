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

export const environment = {
  floor: environmentPath('Floor/cookup-floor-128'),
  floorWorn: environmentPath('Floor/Variations/cookup-floor-light-wear-128'),
  floorSpeckle: environmentPath(
    'Floor/Variations/cookup-floor-fine-speckle-128',
  ),
  wallHorizontal: environmentPath('Walls/cookup-wall-horizontal-128'),
  wallVertical: environmentPath('Walls/cookup-wall-vertical-128'),
  topLeft: environmentPath('Walls/cookup-wall-corner-top-left-128'),
  topRight: environmentPath('Walls/cookup-wall-corner-top-right-128'),
  bottomLeft: environmentPath('Walls/cookup-wall-corner-bottom-left-128'),
  bottomRight: environmentPath('Walls/cookup-wall-corner-bottom-right-128'),
  window: environmentPath('Windows/cookup-window-wall-horizontal-128'),
  door: environmentPath('Openings/Door/cookup-door-closed-horizontal-128'),
  doorFrame: environmentPath('Openings/Door/cookup-door-frame-horizontal-128'),
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
