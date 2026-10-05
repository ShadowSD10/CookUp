import type { AnimationClip } from '../assets/manifest';

export interface AnimationState {
  clip: string;
  frame: number;
  elapsed: number;
}

export function updateAnimation(
  state: AnimationState,
  name: string,
  clip: AnimationClip,
  dt: number,
): void {
  if (state.clip !== name) {
    state.clip = name;
    state.frame = 0;
    state.elapsed = 0;
  }
  state.elapsed += dt;
  const frame = Math.floor(state.elapsed * clip.fps + 1e-9);
  state.frame = clip.loop
    ? frame % clip.frames.length
    : Math.min(frame, clip.frames.length - 1);
}
