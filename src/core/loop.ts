import { MAX_DELTA_SECONDS } from './config';

export class GameLoop {
  private frame: number | undefined;
  private previous: number | undefined;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly render: () => void,
    private readonly onError: (error: unknown) => void,
  ) {}

  start(): void {
    if (this.frame !== undefined) return;
    this.previous = undefined;
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.previous = undefined;
  }

  private readonly tick = (time: number): void => {
    const dt =
      this.previous === undefined
        ? 0
        : Math.min((time - this.previous) / 1000, MAX_DELTA_SECONDS);
    this.previous = time;
    try {
      this.update(dt);
      this.render();
      this.frame = requestAnimationFrame(this.tick);
    } catch (error) {
      this.stop();
      this.onError(error);
    }
  };
}
