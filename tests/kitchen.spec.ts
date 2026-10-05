import { expect, test, type Page } from '@playwright/test';
import type { GameState } from '../src/game/state';

declare global {
  interface Window {
    __cookup: { snapshot(): GameState };
  }
}

const snapshot = (page: Page): Promise<GameState> =>
  page.evaluate(() => window.__cookup.snapshot());

async function openKitchen(page: Page): Promise<void> {
  await page.goto('/?debug');
  await expect(page.locator('canvas')).toHaveAttribute('data-status', 'ready');
  await page.locator('canvas').focus();
}

test('loads original assets, renders the canvas, and has no browser errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await openKitchen(page);
  await expect(page.locator('#p1-state')).toHaveText('idle');
  await expect(page.locator('#p2-state')).toHaveText('idle');
  await expect
    .poll(async () => (await snapshot(page)).players[0].animation.frame)
    .not.toBe(0);
  const colors = await page
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No canvas context');
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      const unique = new Set<string>();
      for (let i = 0; i < pixels.length; i += 400)
        unique.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      return unique.size;
    });
  expect(colors).toBeGreaterThan(30);
  expect(errors).toEqual([]);
});

test('both chefs move simultaneously and have independent walk/run controls', async ({
  page,
}) => {
  await openKitchen(page);
  const before = await snapshot(page);
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ShiftRight');
  await expect(page.locator('#p1-state')).toHaveText('walk');
  await expect(page.locator('#p2-state')).toHaveText('run');
  await expect
    .poll(async () => (await snapshot(page)).players[0].x)
    .toBeGreaterThan(before.players[0].x + 30);
  const moving = await snapshot(page);
  expect(moving.players[1].y).toBeLessThan(before.players[1].y - 30);
  expect(moving.players[0].animation.clip).toBe('walk-right');
  expect(moving.players[1].animation.clip).toBe('run-up');
  await page.keyboard.up('ShiftRight');
  await expect(page.locator('#p2-state')).toHaveText('walk');
  await page.keyboard.down('ShiftLeft');
  await expect(page.locator('#p1-state')).toHaveText('run');
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ShiftLeft');
  await expect(page.locator('#p1-state')).toHaveText('idle');
  await expect(page.locator('#p2-state')).toHaveText('idle');
});

test('walls stop a running chef and restart clears held input and animation', async ({
  page,
}) => {
  await openKitchen(page);
  const before = await snapshot(page);
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ShiftLeft');
  const maximum =
    before.world.bounds.x +
    before.world.bounds.width -
    before.players[0].collisionWidth / 2;
  await expect
    .poll(async () => (await snapshot(page)).players[0].x, { timeout: 7000 })
    .toBe(maximum);
  await expect(page.locator('#p1-state')).toHaveText('idle');
  await page.getByRole('button', { name: 'Restart kitchen' }).click();
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyD', repeat: true }),
    );
  });
  await expect
    .poll(async () => (await snapshot(page)).players[0].animation.frame)
    .not.toBe(0);
  const restarted = await snapshot(page);
  expect(restarted.players[0].x).toBe(before.players[0].x);
  expect(restarted.players[0].y).toBe(before.players[0].y);
  expect(restarted.players[0].animation.clip).toBe('idle');
  expect(restarted.players[1].x).toBe(before.players[1].x);
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ShiftLeft');
});

test('losing focus pauses the loop and clears pressed keys', async ({
  page,
}) => {
  await openKitchen(page);
  await page.keyboard.down('KeyW');
  await expect(page.locator('#p1-state')).toHaveText('walk');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#paused')).toBeVisible();
  const paused = await snapshot(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await snapshot(page)).toEqual(paused);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#paused')).toBeHidden();
  await expect(page.locator('#p1-state')).toHaveText('idle');
  expect((await snapshot(page)).players[0].y).toBe(paused.players[0].y);
  await page.keyboard.up('KeyW');
});

test('resizing preserves game state and fits the canvas at high DPI', async ({
  page,
}) => {
  await openKitchen(page);
  const before = await snapshot(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const dimensions = await page
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
      ratio: window.devicePixelRatio,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
  expect(dimensions.ratio).toBe(2);
  expect(dimensions.width).toBe(
    Math.round(dimensions.cssWidth * dimensions.ratio),
  );
  expect(dimensions.height).toBe(
    Math.round(dimensions.cssHeight * dimensions.ratio),
  );
  expect(dimensions.overflow).toBe(false);
  const after = await snapshot(page);
  expect(after.players[0].x).toBe(before.players[0].x);
  expect(after.players[1].y).toBe(before.players[1].y);
});

test('a missing asset produces an explicit error instead of a blank playable screen', async ({
  page,
}) => {
  await page.route('**/male-cook-idle-01.png', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#error')).toContainText('Could not load asset:');
  await expect(page.locator('canvas')).toHaveAttribute('data-status', 'error');
  await expect(
    page.getByRole('button', { name: 'Restart kitchen' }),
  ).toBeDisabled();
});

test('normal play does not expose the diagnostic snapshot', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-status', 'ready');
  expect(await page.evaluate(() => '__cookup' in window)).toBe(false);
});

test('the production build works mounted under a GitHub Pages project path', async ({
  page,
}) => {
  const unexpectedPaths: string[] = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/CookUp/')) {
      unexpectedPaths.push(url.pathname);
      await route.abort();
      return;
    }
    url.pathname = url.pathname.slice('/CookUp'.length);
    const response = await route.fetch({ url: url.href });
    await route.fulfill({ response });
  });
  await page.goto('/CookUp/?debug');
  await expect(page.locator('canvas')).toHaveAttribute('data-status', 'ready');
  await page.keyboard.down('ArrowRight');
  await expect(page.locator('#p2-state')).toHaveText('walk');
  await page.keyboard.up('ArrowRight');
  expect(unexpectedPaths).toEqual([]);
});
