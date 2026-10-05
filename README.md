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

## Viewport and fullscreen

The game shell fills the browser viewport, with compact controls leaving most
of the height for gameplay. The canvas display size follows its container;
its backing resolution follows the device pixel ratio. The shared camera
uniformly fits the complete room, including exterior walls and player-label
headroom, without changing the world/grid or stretching artwork.

Use **Fullscreen** in the kitchen toolbar to enter browser fullscreen. The same
control becomes **Exit fullscreen**; the browser's Escape action also exits.
The toolbar stays available in fullscreen, and returning to normal view preserves
the game. Browser resize and fullscreen changes update the canvas and camera.
Unsupported or denied fullscreen requests show an explanation; windowed play
remains available.

Image smoothing is disabled, nearest-neighbor CSS scaling is requested, and
camera translation is aligned to device pixels. The fit uses a uniform fractional
scale when integer scaling would crop the room or leave it unnecessarily small.
Some letterboxing is intentional when the viewport and room have different aspect
ratios. Short windows hide the nonessential header and player-control cards to
prioritize the canvas; the fullscreen/restart toolbar remains available.

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

The room is composed of individual floor, structural wall, window, door, mat,
clock, and plant images. Walls and plant bases block movement. The door is
closed; there is no exit interaction. Chefs can pass through each other.
Both players stay visible using a camera that fits the whole room.

The entire perimeter uses **Kitchen Structural Wall Kit Tall**, registered in
`src/assets/manifest.ts`. Its original metadata and artwork are preserved in
`public/assets/Spirits/Environment/Kitchen Structural Wall Kit Tall/`.
Environment scale is **1.0** and chef scale remains **0.5**. Horizontal walls
are 256 × 256, vertical walls are 128 × 256, and corners/caps are 128 × 256.
Visible horizontal architecture is 240 units high, versus a 128-unit chef frame;
visible side-wall width is only 56 units. All structural top-left anchors remain
on the **128-unit grid**, with zero offsets, native proportions, and no rotation,
stretching, or old structural overlays. The south foreground uses the display-only
cutaway described below; the original wall canvases and grid footprints stay intact.

The approved room expansion is **10 × 9 cells / 1280 × 1152 units**. North
modules occupy rows 0–1, south modules rows 7–8. Side runs begin at row 2,
with two-row modules at rows 2 and 4 and a one-row vertical filler at row 6.
This preserves over 97% of the previous clear floor area instead of losing two
interior rows. Floor tiling is unchanged; the mat and plants move down one row.

Matching directional corners close the perimeter. The north doorway frame and
closed door share the same 2 × 2 anchor at cell (4,0). Exactly one door overlay
is drawn and adds no occupied cells. North windows replace wall slots with tall
horizontal window-walls; side windows use the authored vertical variant at row 4.
All **26 PNGs** are registered and loaded, including separate inside corners,
directional caps, and both orientations of door frames/states. Unneeded caps,
inside corners, and vertical doors are not placed in this rectangular room.

Collision remains explicitly defined, independent of PNG dimensions: the playable
room edges bound x=96..1192 and y=248..952. Foot colliders and movement speeds
are unchanged. The south collision boundary is independent of its artwork:
chefs' feet can reach y=940, 36 units past the wall's first opaque horizontal row
at y=904. The foreground hides their lower bodies while leaving heads/shoulders
and labels readable. This adds 48 units of southward movement without shrinking
the floor or changing the 10 × 9 room.

South modules remain at row 7 with their native 256-unit height. After drawing
the chefs, the renderer clips only the foreground layer to y=896..1046, displaying
the cap and upper panel through the existing horizontal seam. This approved
cutaway reduces the heavy lower facade without resizing or modifying any PNG.
The cutaway edge is not a collider. North/side walls, camera framing, and floor
tiling are unchanged. Floor tiles extend under opaque wall bands to prevent seams.

The original north-wall clock renders at **1.75×** its former size (a 224 × 224
padded canvas), centered at world (832,96) on the filler between the doorway and
right window. Its occupied grid footprint stays unchanged, and image smoothing
remains disabled.

The agreed default is a **closed perimeter door**, with no door interaction.
`createWorld` also supports closed/ajar/open configurations. Open requires explicit
`connectedBounds` containing the kitchen and extending north into a future room:
it removes the door blocker and leaves a real passage at x=604..688, rather than
retaining an invisible room-edge wall. Unit tests traverse it in both directions
with both chefs. No connected room or door gameplay is enabled in the prototype;
the default closed room keeps both players enclosed.

The existing fitted camera, responsive canvas, and fullscreen implementation are
unchanged. Original floor/decor images remain active, but Final/v2/legacy walls,
corners, transitions, doorways, and windows are not registered or rendered.
Small mobile screens necessarily show smaller chefs when fitting the entire room;
there are still no touch controls.

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
deployment base. PNG paths/dimensions, supplied SHA-256 hashes, native scale,
anchors, and connectors are checked against the tall kit's `assets.json` by tests.

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
