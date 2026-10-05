import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';
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
  const root = 'assets/Spirits/environment/structure';
  const finalAssets = Object.values(structuralWalls);
  const finalPaths = new Set(finalAssets.map((asset) => asset.path));
  it('resolves every registered PNG and verifies actual dimensions', () => {
    for (const path of assetPaths) {
      const png = readFileSync(resolve('public', path));
      expect(png.subarray(1, 4).toString(), path).toBe('PNG');
      const structural = finalAssets.find((asset) => asset.path === path);
      const size = path.includes('/environment/') ? 128 : 256;
      expect(png.readUInt32BE(16), path).toBe(structural?.width ?? size);
      expect(png.readUInt32BE(20), path).toBe(structural?.height ?? size);
    }
  });
  it('registers every tall-kit PNG and excludes every obsolete structural asset', () => {
    const files = readdirSync(resolve('public', root), { recursive: true })
      .filter(
        (file): file is string =>
          typeof file === 'string' &&
          basename(file).startsWith('cookup-tall-') &&
          file.endsWith('.png'),
      )
      .map((file) => `${root}/${file.replaceAll('\\', '/')}`);
    expect(files).toHaveLength(26);
    expect(finalPaths).toEqual(new Set(files));
    expect(finalAssets).toHaveLength(26);
    for (const path of finalPaths) expect(assetPaths).toContain(path);
    expect(structuralWalls.horizontal.path).toBe(
      `${root}/walls/tall/cookup-tall-wall-horizontal-256x256.png`,
    );
    expect(structuralWalls.vertical.path).toBe(
      `${root}/walls/tall/cookup-tall-wall-vertical-128x256.png`,
    );
    expect([
      structuralWalls.horizontal.width,
      structuralWalls.horizontal.height,
    ]).toEqual([256, 256]);
    expect([
      structuralWalls.vertical.width,
      structuralWalls.vertical.height,
    ]).toEqual([128, 256]);
    for (const path of assetPaths) {
      expect(path).not.toMatch(
        /\/legacy\/|\/Environment\/|Wall Kit|Empty Kitchen/,
      );
    }
  });
  it('matches the authoritative dimensions, connectors, anchors, scale, and unmodified PNG hashes', () => {
    const metadata: {
      worldGrid: number;
      environmentRenderScale: number;
      chefRenderScaleForComparison: number;
      horizontalVisibleHeight: number;
      verticalVisibleWidth: number;
      assets: {
        file: string;
        widthPx: number;
        heightPx: number;
        worldWidth: number;
        worldHeight: number;
        canvasGridColumns: number;
        canvasGridRows: number;
        renderScale: number;
        anchor: string;
        drawOffset: number[];
        connectors: string;
        sha256: string;
        replacesFinalKitFile: string;
      }[];
    } = JSON.parse(
      readFileSync(resolve('public', root, 'assets.json'), 'utf8'),
    );
    expect(metadata.worldGrid).toBe(128);
    expect(metadata.environmentRenderScale).toBe(1);
    expect(metadata.chefRenderScaleForComparison).toBe(0.5);
    expect(metadata.horizontalVisibleHeight).toBe(240);
    expect(metadata.verticalVisibleWidth).toBe(56);
    expect(metadata.assets).toHaveLength(26);
    expect(
      new Set(
        metadata.assets.map(
          (entry) => `${root}/${entry.file.replaceAll('\\', '/')}`,
        ),
      ),
    ).toEqual(finalPaths);
    for (const entry of metadata.assets) {
      const path = `${root}/${entry.file.replaceAll('\\', '/')}`;
      expect(finalAssets.find((asset) => asset.path === path)).toEqual({
        path,
        width: entry.widthPx,
        height: entry.heightPx,
        connectors: entry.connectors,
      });
      expect([entry.worldWidth, entry.worldHeight]).toEqual([
        entry.widthPx,
        entry.heightPx,
      ]);
      expect([
        entry.canvasGridColumns * 128,
        entry.canvasGridRows * 128,
      ]).toEqual([entry.worldWidth, entry.worldHeight]);
      expect(entry.renderScale).toBe(1);
      expect(entry.anchor).toBe('top-left');
      expect(entry.drawOffset).toEqual([0, 0]);
      expect(
        createHash('sha256')
          .update(readFileSync(resolve('public', path)))
          .digest('hex')
          .toUpperCase(),
        path,
      ).toBe(entry.sha256);
      if (entry.replacesFinalKitFile) {
        const legacyPng = readFileSync(
          resolve(
            'public/assets/Spirits/environment/legacy/wall-kit-final',
            entry.replacesFinalKitFile.replaceAll('\\', '/'),
          ),
        );
        expect(legacyPng.subarray(1, 4).toString()).toBe('PNG');
      }
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
        'assets/Spirits/characters/male-cook/idle/male-cook-idle-01.png',
        '/CookUp/',
      ),
    ).toBe(
      '/CookUp/assets/Spirits/characters/male-cook/idle/male-cook-idle-01.png',
    );
    expect(
      assetUrl('assets/Spirits/example folder/example.png', '/CookUp/'),
    ).toBe('/CookUp/assets/Spirits/example%20folder/example.png');
  });
  it('uses exact filesystem case, unique canonical paths and no duplicate active PNG copies', () => {
    const allFiles = readdirSync(resolve('public/assets/Spirits'), {
      recursive: true,
    })
      .filter((file): file is string => typeof file === 'string')
      .map((file) => `assets/Spirits/${file.replaceAll('\\', '/')}`);
    expect(assetPaths).toHaveLength(304);
    for (const path of assetPaths) {
      expect(allFiles).toContain(path);
      expect(path).toMatch(
        /^assets\/Spirits\/(?:characters\/(?:male|female)-cook\/(?:idle|walk|run)|environment\/(?:structure|decorations))\//,
      );
      expect(
        allFiles.filter((file) => basename(file) === basename(path)),
        path,
      ).toEqual([path]);
    }
    expect(readdirSync(resolve('public/assets/Spirits')).sort()).toEqual([
      'characters',
      'environment',
    ]);
  });
  it('preserves the migration baseline of all 364 PNGs and the original reference SVG byte-for-byte', () => {
    const root = resolve('public/assets/Spirits');
    const files = readdirSync(root, { recursive: true }).filter(
      (file): file is string =>
        typeof file === 'string' && /\.(png|svg)$/.test(file),
    );
    expect(files.filter((file) => file.endsWith('.png'))).toHaveLength(364);
    expect(files.filter((file) => file.endsWith('.svg'))).toHaveLength(1);
    // Path-independent fingerprint captured before moving any source artwork.
    const records = files
      .map(
        (file) =>
          `${basename(file)}:${createHash('sha256')
            .update(readFileSync(resolve(root, file)))
            .digest('hex')}`,
      )
      .sort();
    expect(createHash('sha256').update(records.join('\n')).digest('hex')).toBe(
      '1311dc790b8365f7b11ea758a53740bccce31d026a696c4fe30e8bdff3b5bc20',
    );
  });
  it('groups all directional frames by motion without changing clip identity or timing', () => {
    for (const [character, folder] of [
      ['maleCook', 'male-cook'],
      ['femaleCook', 'female-cook'],
    ] as const) {
      for (const motion of ['idle', 'walk', 'run'] as const) {
        const files = readdirSync(
          resolve('public/assets/Spirits/characters', folder, motion),
        );
        expect(files).toHaveLength(motion === 'idle' ? 8 : 64);
        const names =
          motion === 'idle'
            ? ['idle']
            : DIRECTIONS.map((direction) => `${motion}-${direction}`);
        for (const name of names) {
          const clip = getClip(character, name);
          expect(clip.fps).toBe(
            motion === 'idle' ? 6 : motion === 'walk' ? 10 : 14,
          );
          expect(clip.loop).toBe(true);
          expect(clip.frames).toEqual(
            Array.from(
              { length: 8 },
              (_, i) =>
                `assets/Spirits/characters/${folder}/${motion}/${folder}-${name}-${String(i + 1).padStart(2, '0')}.png`,
            ),
          );
        }
      }
    }
  });
  it('reports invalid animation names rather than silently substituting artwork', () => {
    expect(() => getClip('maleCook', 'missing')).toThrow('Unknown animation');
  });
});
