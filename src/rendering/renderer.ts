import { Assets } from '../assets/loader';
import { getClip } from '../assets/manifest';
import { PLAYER_CONFIG } from '../core/config';
import type { Player } from '../entities/player';
import type { GameState } from '../game/state';
import type { WorldSprite } from '../game/world';
import { fitCamera } from './camera';

export class Renderer {
  private readonly context: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly assets: Assets,
  ) {
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('Canvas 2D is not supported by this browser.');
    this.context = context;
  }

  render(state: GameState): void {
    const { canvas, context: ctx } = this;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    const ratio = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#192e30';
    ctx.fillRect(0, 0, width, height);
    const camera = fitCamera(
      width,
      height,
      state.world.width,
      state.world.height,
      state.world.visualBounds,
    );
    ctx.translate(
      Math.round(camera.x * ratio) / ratio,
      Math.round(camera.y * ratio) / ratio,
    );
    ctx.scale(camera.scale, camera.scale);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.beginPath();
    const floor = state.world.floorBounds;
    ctx.rect(floor.x, floor.y, floor.width, floor.height);
    ctx.clip();
    for (const sprite of state.world.floors) this.drawSprite(sprite);
    ctx.restore();
    for (const sprite of state.world.structures) this.drawSprite(sprite);
    const depthEntries = [
      ...state.world.objects.map((object) => ({
        depth: object.depth,
        draw: () => this.drawSprite(object),
      })),
      ...state.players.map((player) => ({
        depth: player.y,
        draw: () => this.drawPlayer(player),
      })),
    ];
    depthEntries.sort((a, b) => a.depth - b.depth);
    for (const entry of depthEntries) entry.draw();
    for (const sprite of state.world.foreground) this.drawSprite(sprite);
  }

  private drawSprite(sprite: WorldSprite): void {
    if (sprite.clip) {
      this.context.save();
      this.context.beginPath();
      this.context.rect(
        sprite.clip.x,
        sprite.clip.y,
        sprite.clip.width,
        sprite.clip.height,
      );
      this.context.clip();
    }
    this.context.drawImage(
      this.assets.get(sprite.asset),
      sprite.x,
      sprite.y,
      sprite.width,
      sprite.height,
    );
    if (sprite.clip) this.context.restore();
  }

  private drawPlayer(player: Player): void {
    const ctx = this.context;
    const clip = getClip(player.character, player.animation.clip);
    const path = clip.frames[player.animation.frame];
    if (!path)
      throw new Error(
        `Invalid animation frame: ${player.animation.clip}/${player.animation.frame}`,
      );
    const width = clip.frameWidth * player.renderScale;
    const height = clip.frameHeight * player.renderScale;
    const color = player.id === 1 ? '#598966' : '#c4855c';
    ctx.fillStyle = '#23363325';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 3, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 3, 31, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.drawImage(
      this.assets.get(path),
      0,
      0,
      clip.frameWidth,
      clip.frameHeight,
      player.x - width * PLAYER_CONFIG.anchorX,
      player.y - height * PLAYER_CONFIG.anchorY,
      width,
      height,
    );
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(player.x - 16, player.y - height - 14, 32, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P${player.id}`, player.x, player.y - height - 4);
  }
}
