# CookUp

A static, local two-player cooking-game prototype. Milestone 0 is an empty
modular kitchen with two playable chefs. There is no backend, database,
authentication, online multiplayer, or cooking gameplay.

## Run locally

Requires Node.js 22.12+ (Node.js 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Both players share one keyboard:

| Player           | Move       | Hold to run |
| ---------------- | ---------- | ----------- |
| P1 / Male Cook   | W A S D    | Left Shift  |
| P2 / Female Cook | Arrow keys | Right Shift |

Click **Restart kitchen** to reset both players and clear held input. Switching
windows or hiding the tab pauses the game and clears keys. Opposing directions
cancel; diagonal movement has the same speed as axial movement. Keyboard
rollover varies by hardware and can limit simultaneous physical key presses.
Touch controls are not part of this milestone.

## Architecture

- `src/core`: configuration and delta-time `requestAnimationFrame` loop.
- `src/assets`: centralized original-asset manifest and fail-fast image loading.
- `src/entities`: player state, independent sprite scale and foot collision box.
- `src/game`: deterministic state updates and the modular 128-unit kitchen grid.
- `src/systems`: keyboard abstraction, movement, swept axis-aligned collision,
  and configurable frame animation.
- `src/rendering`: fitted shared camera, high-DPI Canvas 2D drawing, and Y-sorted
  chefs/decorations. Gameplay never draws to Canvas.
- `tests`: Playwright browser checks against the production build.

The room is composed of individual floor, wall, corner, window, door, mat,
clock, and plant images. Walls and plant bases block movement. The door is
closed; there is no exit interaction. Chefs can pass through each other.
Both players stay visible using a camera that fits the whole room.

Animation definitions support source dimensions, frame count (via the frame
array), speed, looping, and current frame. Both chefs use the existing eight-frame
idle and eight-direction walk/run assets. Idle has only one supplied facing.
The loop caps elapsed time at 50 ms to avoid jumps after stalls; movement is
time-based at normal refresh rates, with intentional slowdown below 20 FPS.

### Assets

The copied artwork actually lives in **`public/assets/Spirits/`**, not the
`public/assets/sprites/` path from the initial brief. Original names, capitalization,
spaces, and image contents are preserved, including the existing deprecated sample
folder, which is not loaded. The manifest encodes URL spaces and uses Vite's
deployment base. PNG paths/dimensions are checked by tests.

Controls, speed, scale, and collision sizes are centralized in
`src/core/config.ts`. Map layout and object colliders live in `src/game/world.ts`.

## Verify

```sh
npm run test
npm run typecheck
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright serves `dist` on port 4173; keep that port free. Browser tests verify
asset loading, simultaneous movement, independent sprint, animations, collision,
restart, focus loss, resize, and visible load failures. `?debug` explicitly enables
a read-only cloned game snapshot for browser diagnostics; it is absent in normal
play. Do not put secrets in this client-side application.

## GitHub Pages

`npm run build` produces a self-contained static `dist` directory. Relative
asset URLs support both a root site and a project subdirectory. No server-side
runtime is required; the local development/preview server only serves files.

The included GitHub Actions workflow runs checks and deploys `main` to Pages.
After publishing this folder to GitHub, select **Settings > Pages > Build and
deployment > GitHub Actions**. Pull requests and pushes to `develop` run validation
without deploying. Use feature branches targeting `develop`, then merge to `main`.
The repository is [ShadowSD10/CookUp](https://github.com/ShadowSD10/CookUp).
The default branch is `main`; the local `origin` remote points to this repository.
The `develop` and feature branches can be created when the next milestone begins.

Future cooking mechanics, inventory, recipes, orders, scoring, and menus are
deliberately out of scope.
