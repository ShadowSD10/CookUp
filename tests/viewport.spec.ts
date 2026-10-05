import { expect, test, type Page } from '@playwright/test';
import { fitCamera } from '../src/rendering/camera';

async function openKitchen(page: Page): Promise<void> {
  await page.goto('/?debug');
  await expect(page.locator('canvas')).toHaveAttribute('data-status', 'ready');
}

async function viewport(page: Page) {
  await expect
    .poll(() =>
      page
        .locator('canvas')
        .evaluate(
          (canvas: HTMLCanvasElement) =>
            canvas.width ===
              Math.round(canvas.clientWidth * devicePixelRatio) &&
            canvas.height ===
              Math.round(canvas.clientHeight * devicePixelRatio),
        ),
    )
    .toBe(true);
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    const transform = ctx.getTransform();
    return {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      ratio: devicePixelRatio,
      smoothing: ctx.imageSmoothingEnabled,
      imageRendering: getComputedStyle(canvas).imageRendering,
      transform: {
        x: transform.e,
        y: transform.f,
        scaleX: transform.a,
        scaleY: transform.d,
      },
      state: window.__cookup.snapshot(),
      pageWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      windowWidth: innerWidth,
      windowHeight: innerHeight,
    };
  });
}

async function expectFramed(page: Page) {
  const view = await viewport(page);
  const { world, players } = view.state;
  const { x, y, scaleX, scaleY } = view.transform;
  const scale = scaleX / view.ratio;
  expect(scaleX).toBe(scaleY);
  expect(view.smoothing).toBe(false);
  expect(view.imageRendering).toBe('pixelated');
  expect(view.pageWidth).toBeLessThanOrEqual(view.windowWidth);
  expect(view.pageHeight).toBeLessThanOrEqual(view.windowHeight);
  const left = x / view.ratio + world.visualBounds.x * scale;
  const top = y / view.ratio + world.visualBounds.y * scale;
  const right = left + world.visualBounds.width * scale;
  const bottom = top + world.visualBounds.height * scale;
  expect(left).toBeGreaterThanOrEqual(0);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(right).toBeLessThanOrEqual(view.width);
  expect(bottom).toBeLessThanOrEqual(view.height);
  expect(Math.abs((left + right) / 2 - view.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs((top + bottom) / 2 - view.height / 2)).toBeLessThanOrEqual(1);
  for (const player of players) {
    const labelTop =
      y / view.ratio + (player.y - 256 * player.renderScale - 14) * scale;
    expect(labelTop).toBeGreaterThanOrEqual(0);
    expect(y / view.ratio + player.y * scale).toBeLessThan(view.height);
  }
  return view;
}

test('normal and maximized-size windows make the room measurably larger without stretching', async ({
  page,
}) => {
  await openKitchen(page);
  const before = (await viewport(page)).state;
  for (const size of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    const view = await expectFramed(page);
    expect(view.height).toBeGreaterThanOrEqual(size.height * 0.77);
    const { world } = view.state;
    const oldCanvasWidth = Math.min(1198, size.width - 66);
    const oldCanvasHeight = Math.min(680, Math.max(320, size.height * 0.61));
    const oldScale =
      (fitCamera(
        oldCanvasWidth,
        oldCanvasHeight,
        world.width,
        world.height,
        world.visualBounds,
      ).scale *
        0.94) /
      0.98;
    expect(view.transform.scaleX / view.ratio).toBeGreaterThanOrEqual(
      oldScale * 1.3,
    );
    expect(view.state.world).toEqual(before.world);
    expect(view.state.players.map(({ x, y }) => ({ x, y }))).toEqual(
      before.players.map(({ x, y }) => ({ x, y })),
    );
  }
});

test('portrait and short landscape windows keep the room and fullscreen control in view', async ({
  page,
}) => {
  await openKitchen(page);
  for (const size of [
    { width: 390, height: 844 },
    { width: 640, height: 360 },
    { width: 782, height: 495 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    const view = await expectFramed(page);
    if (size.height <= 600) {
      expect(view.height).toBeGreaterThanOrEqual(size.height * 0.8);
    }
    const button = page.getByRole('button', {
      name: 'Fullscreen',
      exact: true,
    });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    if (!box) throw new Error('Fullscreen control has no bounding box');
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
  }
});

test('real fullscreen enters, exits, resizes, and preserves simultaneous play', async ({
  page,
}) => {
  await openKitchen(page);
  const supported = await page.evaluate(() => document.fullscreenEnabled);
  test.skip(
    !supported,
    'This browser/platform does not permit the Fullscreen API',
  );
  const before = await viewport(page);
  const button = page.locator('#fullscreen');
  await button.click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement?.id))
    .toBe('game-shell');
  await expect(button).toHaveText('Exit fullscreen');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  const fullscreen = await expectFramed(page);
  expect(fullscreen.height).toBeGreaterThanOrEqual(
    fullscreen.windowHeight * 0.9,
  );
  expect(fullscreen.state.world).toEqual(before.state.world);
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowLeft');
  await expect
    .poll(() => page.evaluate(() => window.__cookup.snapshot().players[0].x))
    .toBeGreaterThan(before.state.players[0].x + 20);
  await expect
    .poll(() => page.evaluate(() => window.__cookup.snapshot().players[1].x))
    .toBeLessThan(before.state.players[1].x - 20);
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ArrowLeft');
  await expect(page.locator('#p1-state')).toHaveText('idle');
  await expect(page.locator('#p2-state')).toHaveText('idle');
  const moved = (await viewport(page)).state;
  await button.click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveText('Fullscreen');
  await expectFramed(page);
  expect(
    (await viewport(page)).state.players.map(({ x, y }) => ({ x, y })),
  ).toEqual(moved.players.map(({ x, y }) => ({ x, y })));
  // Exit outside the control too, as happens when the browser handles Escape.
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => document.exitFullscreen());
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.setViewportSize({ width: 1024, height: 768 });
  await expectFramed(page);
});

test('fullscreen denial is visible and does not stop gameplay or prevent retry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    });
    HTMLElement.prototype.requestFullscreen = () =>
      Promise.reject(
        new DOMException('Denied for this test', 'NotAllowedError'),
      );
  });
  await openKitchen(page);
  const button = page.locator('#fullscreen');
  await button.click();
  await expect(page.getByRole('alert')).toContainText('Denied for this test');
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.down('KeyD');
  await expect(page.locator('#p1-state')).toHaveText('walk');
  await page.keyboard.up('KeyD');
  await expectFramed(page);
});

test('unsupported fullscreen has an accessible explanation and normal play stays available', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: false,
    });
  });
  await openKitchen(page);
  await expect(page.locator('#fullscreen')).toBeDisabled();
  await expect(page.locator('#viewport-message')).toContainText(
    'not supported',
  );
  await expect(page.locator('#fullscreen')).toHaveAttribute(
    'aria-describedby',
    'viewport-message',
  );
  await page.keyboard.down('ArrowRight');
  await expect(page.locator('#p2-state')).toHaveText('walk');
  await page.keyboard.up('ArrowRight');
  await expectFramed(page);
});
