import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assetPaths, assetUrl, characters, getClip } from './manifest';
import { DIRECTIONS } from '../entities/player';

describe('original asset manifest', () => {
  it('resolves every registered PNG and verifies actual dimensions', () => {
    for (const path of assetPaths) {
      const png = readFileSync(resolve('public', path));
      expect(png.subarray(1, 4).toString(), path).toBe('PNG');
      const size = path.includes('/Environment/') ? 128 : 256;
      expect(png.readUInt32BE(16), path).toBe(size);
      expect(png.readUInt32BE(20), path).toBe(size);
    }
  });
  it('registers eight frames for idle and every walk/run direction for both chefs', () => {
    for (const character of ['maleCook', 'femaleCook'] as const) {
      expect(Object.keys(characters[character])).toHaveLength(17);
      for (const name of [
        'idle',
        ...DIRECTIONS.flatMap((d) => [`walk-${d}`, `run-${d}`]),
      ]) {
        const clip = getClip(character, name);
        expect(clip.frames).toHaveLength(8);
        expect(new Set(clip.frames).size).toBe(8);
        expect(clip.frameWidth).toBe(256);
        expect(clip.frameHeight).toBe(256);
      }
    }
  });
  it('preserves case and encodes spaces for a GitHub Pages project base', () => {
    expect(
      assetUrl(
        'assets/Spirits/Male Cook/idle/male-cook-idle-01.png',
        '/CookUp/',
      ),
    ).toBe('/CookUp/assets/Spirits/Male%20Cook/idle/male-cook-idle-01.png');
  });
  it('reports invalid animation names rather than silently substituting artwork', () => {
    expect(() => getClip('maleCook', 'missing')).toThrow('Unknown animation');
  });
});
