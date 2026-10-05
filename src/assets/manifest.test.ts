import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assetPaths,
  assetUrl,
  characters,
  structuralWalls,
  getClip,
} from './manifest';
import { DIRECTIONS } from '../entities/player';

describe('original asset manifest', () => {
  const finalAssets = Object.values(structuralWalls);
  const finalPaths = new Set(finalAssets.map((asset) => asset.path));
  it('resolves every registered PNG and verifies actual dimensions', () => {
    for (const path of assetPaths) {
      const png = readFileSync(resolve('public', path));
      expect(png.subarray(1, 4).toString(), path).toBe('PNG');
      const structural = finalAssets.find((asset) => asset.path === path);
      const size = path.includes('/Environment/') ? 128 : 256;
      expect(png.readUInt32BE(16), path).toBe(structural?.width ?? size);
      expect(png.readUInt32BE(20), path).toBe(structural?.height ?? size);
    }
  });
  it('registers every final-kit PNG and excludes every obsolete structural asset', () => {
    const root = 'assets/Spirits/Environment/Kitchen Structural Wall Kit Final';
    const files = readdirSync(resolve('public', root), { recursive: true })
      .filter(
        (file): file is string =>
          typeof file === 'string' && file.endsWith('.png'),
      )
      .map((file) => `${root}/${file.replaceAll('\\', '/')}`);
    expect(files).toHaveLength(18);
    expect(finalPaths).toEqual(new Set(files));
    expect(finalAssets).toHaveLength(18);
    for (const path of finalPaths) expect(assetPaths).toContain(path);
    expect(structuralWalls.horizontal.path).toBe(
      `${root}/Walls/cookup-structural-wall-horizontal-256x128.png`,
    );
    expect(structuralWalls.vertical.path).toBe(
      `${root}/Walls/cookup-structural-wall-vertical-128x256.png`,
    );
    expect([
      structuralWalls.horizontal.width,
      structuralWalls.horizontal.height,
    ]).toEqual([256, 128]);
    expect([
      structuralWalls.vertical.width,
      structuralWalls.vertical.height,
    ]).toEqual([128, 256]);
    for (const path of assetPaths) {
      expect(path).not.toMatch(
        /Wall Kit v2|Empty Kitchen\/(?:Walls|Windows|Openings|Transitions)\//,
      );
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
