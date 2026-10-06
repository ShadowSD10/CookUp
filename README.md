# CookUp

A static, local two-player cooking-game prototype. The modular kitchen now has
collision-aware equipment and two playable chefs. There is no backend, database,
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
  chefs/decorations/equipment. Gameplay never draws to Canvas.
- `tests`: Playwright browser checks against the production build.

The room is composed of individual floor, structural wall, window, door, mat,
clock, plant, and equipment images. Walls, plant bases, and equipment bodies block movement. The door is
closed; there is no exit interaction. Chefs can pass through each other.
Both players stay visible using a camera that fits the whole room.

The entire perimeter uses **Kitchen Structural Wall Kit Tall**, registered in
`src/assets/manifest.ts`. Its artwork is organized by category under
`public/assets/Spirits/environment/structure/`, with walls in `walls/tall/`
and matching `doors/tall/`, `windows/tall/`, `corners/tall/`, and `caps/tall/`.
The kit's `assets.json` and README live at the structure root; only their folder
references changed during migration, not the artwork or authored geometry.
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

The canonical root remains **`public/assets/Spirits/`** (including that spelling
and capitalization). All active family folders below it are lowercase:

```text
Spirits/
  characters/
    male-cook/
      idle/
      walk/
      run/
      legacy/samples/
    female-cook/
      idle/
      walk/
      run/
  environment/
    structure/
      README.md
      assets.json
      walls/tall/
      doors/tall/
      windows/tall/
      corners/tall/
      caps/tall/
      floors/
        corners/
        edges/
        variations/
    decorations/
    legacy/
      empty-kitchen/
      wall-kit-final/
      wall-kit-v2/
    furniture/
      counters/
      tables/
      islands/
    stations/
      prep/
      cooking/
      sink/
      serving/
    appliances/refrigerator/
```

Each character has 8 idle, 64 walk, and 64 run frames. Direction names stay in
the original filenames, not separate direction folders. Logical character,
animation, and environment IDs are unchanged. The manifest remains the sole
runtime registry; world/layout/renderer code does not contain asset paths.
The favicon uses the canonical male idle frame as well.

All **364 PNGs** and the original reference SVG were moved without changing
their filenames or bytes. The 17 floor tiles retain their own edge/corner/variation
categories; the four existing clock, plant, mat, and light assets justify the
`decorations` category. Only three floor variants and three decorations are active.
All 26 Tall images load; not every registered variant is placed in the current room.

The 23 obsolete short structural tiles, 18 Final-kit images, and two v2 images
are retained under `environment/legacy/`, preserving their original internal
folder names for reference. The two deprecated male PNGs and SVG live under
`characters/male-cook/legacy/samples/`. None are loaded by the runtime.
Do not remove these reference assets without a separate reviewed cleanup.

**Kitchen Equipment Kit v1** adds 14 supplied, byte-preserved PNGs in the furniture,
stations, and appliances categories above. There are now **378 PNGs** in the
repository and **318 registered runtime images**. All 14 equipment images load;
10 are placed. The inside/outside counter corners, single counter, and bare stove
remain available without being forced into the layout. The cookware stove is a
complete visual state, not an overlay. No ingredients or food categories were added.

The loader continues to encode URLs and honor Vite's deployment base. Tests check
exact filesystem case, unique active paths, all original artwork hashes, clip
timings, the supplied tall metadata, browser rendering, and GitHub Pages URLs.
The original 364-PNG/SVG integrity baseline is retained separately from the new
14-image equipment integrity baseline.

Controls, speed, scale, and collision sizes are centralized in
`src/core/config.ts`. Map layout and object colliders live in `src/game/world.ts`.

### Equipment layout

The approved 10 × 9 architecture is unchanged. Equipment uses native scale **1.0**,
top-left grid anchors, and the existing object/chef depth sort. Chef artwork,
animation and scale **0.5** are unchanged. P1's ring, label and control badge are
blue; P2's are orange, from one shared palette.

| Object            | Grid anchor (column,row) | PNG/world size | Local body collider (x,y,w,h) |
| ----------------- | ------------------------ | -------------- | ----------------------------- |
| Fridge            | (1,3)                    | 128 × 256      | (24,200,80,40)                |
| Cookware stove    | (2,3)                    | 128 × 128      | (12,72,104,40)                |
| Sink              | (3,3)                    | 128 × 128      | (12,72,104,40)                |
| Counter left end  | (1,5)                    | 128 × 128      | (12,72,116,40)                |
| Counter straight  | (2,5)                    | 128 × 128      | (0,72,128,40)                 |
| Counter right end | (3,5)                    | 128 × 128      | (0,72,116,40)                 |
| Island            | (6,3)                    | 256 × 128      | (12,72,232,40)                |
| Serving counter   | (8,3)                    | 128 × 128      | (12,72,104,40)                |
| Table             | (6,5)                    | 256 × 128      | (24,72,212,44)                |
| Prep counter      | (8,5)                    | 128 × 128      | (12,72,104,40)                |

Multiply anchors by 128 for world positions. Colliders describe floor-level bodies,
not full image canvases or raised worktops. Sorting uses each body's front edge;
chefs can stand behind a worktop or render in front of it. Connected counter
colliders meet exactly at their internal seams. Fridge artwork occupies two rows,
with its floor footprint in the lower row.

West storage/cooking and its connected workspace face east island/serving and
table/prep zones. The central **256-unit** lane at x=512..768 stays free of equipment,
including the north doorway approach. The main cross-aisle is **216 units** deep
east of the fridge; the south aisle is **196 units** deep. These are primary routes,
not the narrow incidental gaps next to walls. Both original spawns remain clear.
The default door remains closed; its existing open/connected-room configuration
still permits passage. Windows, clock, floor, plants, mat, walls, south clipping,
physical room bounds, camera and fullscreen behavior are unchanged.

Equipment is visual and collision-aware only. No station interaction, cooking,
washing, serving, inventory, recipes, timers, scoring, or equipment state machines
have been implemented.

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
