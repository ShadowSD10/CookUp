import type { Rect } from '../systems/collision';

export interface Camera {
  scale: number;
  x: number;
  y: number;
}

export function fitCamera(
  width: number,
  height: number,
  worldWidth: number,
  worldHeight: number,
  visualBounds: Rect = { x: 0, y: 0, width: worldWidth, height: worldHeight },
): Camera {
  // Keep tall sprites and their labels visible when their feet reach the north wall.
  const topPadding = 64;
  const left = Math.min(0, visualBounds.x);
  const top = Math.min(-topPadding, visualBounds.y);
  const right = Math.max(worldWidth, visualBounds.x + visualBounds.width);
  const bottom = Math.max(worldHeight, visualBounds.y + visualBounds.height);
  const framedWidth = right - left;
  const framedHeight = bottom - top;
  const scale = Math.min(width / framedWidth, height / framedHeight) * 0.98;
  return {
    scale,
    x: (width - framedWidth * scale) / 2 - left * scale,
    y: (height - framedHeight * scale) / 2 - top * scale,
  };
}
