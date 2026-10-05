import './style.css';
import { Assets } from './assets/loader';
import { GameLoop } from './core/loop';
import { createGame, updateGame } from './game/state';
import { Renderer } from './rendering/renderer';
import { KeyboardInput } from './systems/input';

function element<T extends HTMLElement>(id: string, type: { new (): T }): T {
  const found = document.getElementById(id);
  if (!(found instanceof type))
    throw new Error(`Missing or invalid element: ${id}`);
  return found;
}

const canvas = element('kitchen', HTMLCanvasElement);
const restart = element('restart', HTMLButtonElement);
const loading = element('loading', HTMLDivElement);
const paused = element('paused', HTMLDivElement);
const errorNotice = element('error', HTMLDivElement);
const playerLabels = [
  element('p1-state', HTMLSpanElement),
  element('p2-state', HTMLSpanElement),
];
let dispose: (() => void) | undefined;

function showError(error: unknown): void {
  console.error('CookUp failed:', error);
  dispose?.();
  restart.disabled = true;
  loading.hidden = true;
  paused.hidden = true;
  errorNotice.textContent = `The kitchen couldn't open. ${error instanceof Error ? error.message : String(error)} Reload the page to try again.`;
  errorNotice.hidden = false;
  canvas.dataset.status = 'error';
}

async function start(): Promise<void> {
  const assets = new Assets();
  await assets.load();
  const renderer = new Renderer(canvas, assets);
  const input = new KeyboardInput();
  let state = createGame();
  const render = (): void => {
    renderer.render(state);
    for (const [index, label] of playerLabels.entries()) {
      const player = state.players[index];
      if (!player) throw new Error(`Missing player ${index + 1}`);
      if (label.textContent !== player.motion)
        label.textContent = player.motion;
    }
  };
  const loop = new GameLoop(
    (dt) => updateGame(state, [input.player(0), input.player(1)], dt),
    render,
    showError,
  );
  const pause = (): void => {
    input.clear();
    loop.stop();
    paused.hidden = false;
  };
  const resume = (): void => {
    if (document.hidden) return;
    paused.hidden = true;
    loop.start();
  };
  const visibility = (): void => {
    if (document.hidden) pause();
    else resume();
  };
  const reset = (): void => {
    input.clear();
    state = createGame();
    render();
    canvas.focus();
  };
  const resize = new ResizeObserver(render);
  resize.observe(canvas);
  restart.addEventListener('click', reset);
  window.addEventListener('blur', pause);
  window.addEventListener('focus', resume);
  document.addEventListener('visibilitychange', visibility);
  dispose = () => {
    loop.stop();
    input.dispose();
    resize.disconnect();
    restart.removeEventListener('click', reset);
    window.removeEventListener('blur', pause);
    window.removeEventListener('focus', resume);
    document.removeEventListener('visibilitychange', visibility);
  };
  // Opt-in snapshot for browser tests; no mutable game state is exposed.
  if (new URLSearchParams(location.search).has('debug')) {
    Object.defineProperty(window, '__cookup', {
      configurable: true,
      value: { snapshot: () => structuredClone(state) },
    });
  }
  loading.hidden = true;
  restart.disabled = false;
  canvas.dataset.status = 'ready';
  render();
  if (document.hidden) pause();
  else loop.start();
}

import.meta.hot?.dispose(() => {
  dispose?.();
  Reflect.deleteProperty(window, '__cookup');
});

void start().catch(showError);
