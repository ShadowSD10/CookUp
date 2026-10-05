import { CONTROLS, type Controls } from '../core/config';

export interface PlayerInput {
  x: number;
  y: number;
  run: boolean;
}

export function readInput(
  keys: ReadonlySet<string>,
  controls: Controls,
): PlayerInput {
  return {
    x: Number(keys.has(controls.right)) - Number(keys.has(controls.left)),
    y: Number(keys.has(controls.down)) - Number(keys.has(controls.up)),
    run: keys.has(controls.run),
  };
}

export class KeyboardInput {
  private readonly keys = new Set<string>();
  private readonly bindings = new Set(
    CONTROLS.flatMap((controls) => Object.values(controls)),
  );

  constructor() {
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.clear);
    document.addEventListener('visibilitychange', this.clear);
  }

  player(index: 0 | 1): PlayerInput {
    return readInput(this.keys, CONTROLS[index]);
  }

  readonly clear = (): void => {
    this.keys.clear();
  };

  dispose(): void {
    this.clear();
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.clear);
  }

  private readonly keyDown = (event: KeyboardEvent): void => {
    if (
      !this.bindings.has(event.code) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (event.repeat) return;
    this.keys.add(event.code);
  };

  private readonly keyUp = (event: KeyboardEvent): void => {
    if (!this.bindings.has(event.code)) return;
    event.preventDefault();
    this.keys.delete(event.code);
  };
}
