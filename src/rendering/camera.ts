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
): Camera {
  // Keep tall sprites and their labels visible when their feet reach the north wall.
  const topPadding = 64;
  const scale =
    Math.min(width / worldWidth, height / (worldHeight + topPadding)) * 0.94;
  return {
    scale,
    x: (width - worldWidth * scale) / 2,
    y: (height - (worldHeight + topPadding) * scale) / 2 + topPadding * scale,
  };
}
