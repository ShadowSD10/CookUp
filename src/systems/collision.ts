export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Body {
  x: number;
  y: number;
  collisionWidth: number;
  collisionHeight: number;
}

function overlaps(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): boolean {
  return aMin < bMax && aMax > bMin;
}

export function moveBody(
  body: Body,
  dx: number,
  dy: number,
  bounds: Rect,
  obstacles: readonly Rect[],
): void {
  const halfW = body.collisionWidth / 2;
  const halfH = body.collisionHeight / 2;
  let x = Math.max(
    bounds.x + halfW,
    Math.min(bounds.x + bounds.width - halfW, body.x + dx),
  );
  // Sweep each axis against obstacle edges so fast motion cannot tunnel through them.
  for (const obstacle of obstacles) {
    if (
      !overlaps(
        body.y - halfH,
        body.y + halfH,
        obstacle.y,
        obstacle.y + obstacle.height,
      )
    )
      continue;
    if (dx > 0 && body.x + halfW <= obstacle.x && x + halfW > obstacle.x)
      x = Math.min(x, obstacle.x - halfW);
    if (
      dx < 0 &&
      body.x - halfW >= obstacle.x + obstacle.width &&
      x - halfW < obstacle.x + obstacle.width
    )
      x = Math.max(x, obstacle.x + obstacle.width + halfW);
  }
  body.x = x;
  let y = Math.max(
    bounds.y + halfH,
    Math.min(bounds.y + bounds.height - halfH, body.y + dy),
  );
  for (const obstacle of obstacles) {
    if (
      !overlaps(
        body.x - halfW,
        body.x + halfW,
        obstacle.x,
        obstacle.x + obstacle.width,
      )
    )
      continue;
    if (dy > 0 && body.y + halfH <= obstacle.y && y + halfH > obstacle.y)
      y = Math.min(y, obstacle.y - halfH);
    if (
      dy < 0 &&
      body.y - halfH >= obstacle.y + obstacle.height &&
      y - halfH < obstacle.y + obstacle.height
    )
      y = Math.max(y, obstacle.y + obstacle.height + halfH);
  }
  body.y = y;
}
