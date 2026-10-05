# CookUp — Session Report

**Date:** October 5, 2026  
**Milestone:** Milestone 0 — Playable Empty Kitchen  
**Outcome:** A working, locally verified, static two-player kitchen prototype.

## 1. Request and scope

Read the supplied CookUp development-context attachment and used it as the
implementation brief. The attachment was not modified.

The immediate objective was **two chefs walking around a modular kitchen**:

- Initialize a lightweight Vite and TypeScript application.
- Render the gameplay world using Canvas 2D.
- Preserve and reuse the supplied artwork.
- Support two players moving simultaneously on a shared keyboard.
- Switch between idle, walking, and running animations.
- Provide basic environment collision and shared camera handling.
- Verify game logic and browser behavior locally.
- Keep the application static and suitable for GitHub Pages.

No backend, database, authentication, online multiplayer, cooking, ingredients,
inventory, recipes, customers, orders, scoring, money, or advanced menus were
implemented.

## 2. Initial inspection

The workspace initially contained only the `public` directory. It had no
application implementation, package manifest, or Git metadata.

Inspected the copied asset directories, filenames, representative images, and
actual PNG dimensions before implementing the renderer.

### Asset findings

The attachment described an expected `public/assets/sprites/` location, but the
actual copied assets were under:

```text
public/assets/Spirits/
  Male Cook/
  Female Cook/
  Environment/
    Empty Kitchen/
```

Preserved the existing spelling, capitalization, spaces, filenames, and image
contents. No original artwork was renamed, edited, or replaced.

Inspection found:

- 272 character frames at 256 × 256 pixels.
- 45 environment images at 128 × 128 pixels.
- One 1024 × 1024 image in the existing deprecated sample collection.
- Eight idle frames for each chef.
- Eight frames per direction for both walk and run animations.
- Eight movement directions: up, up-right, right, down-right, down, down-left,
  left, and up-left.
- Independent floor, wall, corner, opening, window, transition, and decoration
  images.

The deprecated sample collection remains untouched and is not loaded by the
game. The manifest uses the required environment subset and all current
character animation frames, rather than loading every available environment
piece.

## 3. Confirmed control decision

Asked how walking and running should work. The selected behavior was:

| Player                 | Movement   | Run              |
| ---------------------- | ---------- | ---------------- |
| Player 1 — Male Cook   | W, A, S, D | Hold Left Shift  |
| Player 2 — Female Cook | Arrow keys | Hold Right Shift |

The two Shift keys are independent. Both players can move and change movement
speed simultaneously.

## 4. Project foundation

Created the application and development configuration:

| File                                            | Purpose                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| [package.json](../package.json)                 | Project metadata, development dependencies, and npm scripts             |
| [package-lock.json](../package-lock.json)       | Locked dependency installation                                          |
| [tsconfig.json](../tsconfig.json)               | Strict TypeScript configuration                                         |
| [vite.config.ts](../vite.config.ts)             | Vite, relative deployment base, and Vitest configuration                |
| [eslint.config.js](../eslint.config.js)         | JavaScript and TypeScript lint configuration                            |
| [.prettierrc.json](../.prettierrc.json)         | Formatting conventions                                                  |
| [.prettierignore](../.prettierignore)           | Excludes generated output and original assets from formatting           |
| [.gitignore](../.gitignore)                     | Excludes dependencies, build output, test output, and browser artifacts |
| [playwright.config.ts](../playwright.config.ts) | Production-preview browser testing with Chromium                        |
| [index.html](../index.html)                     | Application shell, canvas, player controls, notices, and restart button |

Used TypeScript, Vite, Canvas 2D, native browser APIs, ESLint, Prettier, Vitest,
and Playwright. No runtime framework or backend dependency was added.

TypeScript checks include strict typing, unchecked indexed access, unused
variables and parameters, and switch fallthrough checks.

### Available scripts

```sh
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run test
npm run test:e2e
```

## 5. Implemented architecture

Kept input, gameplay, assets, rendering, and lifecycle concerns separate.

### Core configuration and game loop

- [src/core/config.ts](../src/core/config.ts) centralizes keyboard bindings,
  walking/running speeds, sprite scale, rendering anchors, collision dimensions,
  and the maximum frame delta.
- [src/core/loop.ts](../src/core/loop.ts) implements a startable/stoppable
  `requestAnimationFrame` loop with separate update and render callbacks.
- Movement and animation use elapsed seconds rather than frame counts.
- Frame delta is capped at 50 ms to avoid large jumps after stalls.
- Loop errors stop execution and reach the visible application error handler.

Configured defaults:

- Walk speed: 190 world units per second.
- Run speed: 310 world units per second.
- Character render scale: 0.5.
- Character collision bounds: 34 × 24 world units.

### Asset registry and loading

- [src/assets/manifest.ts](../src/assets/manifest.ts) centralizes character clips
  and environment paths.
- Animation definitions contain frame paths, source dimensions, animation speed,
  and looping behavior.
- The manifest generates the existing eight-frame directional sequences without
  renaming files or creating replacement artwork.
- URLs preserve path case, encode spaces, and use Vite's deployment base.
- [src/assets/loader.ts](../src/assets/loader.ts) loads and decodes registered
  images before gameplay begins.
- Missing images and invalid animation lookups produce explicit errors rather
  than silently substituting placeholders.

### Player entities

- [src/entities/player.ts](../src/entities/player.ts) defines player state,
  character identity, facing direction, motion, animation state, render scale,
  and collision dimensions.
- Source image size, rendered size, and physical collision bounds are separate
  concepts.

### Input system

- [src/systems/input.ts](../src/systems/input.ts) tracks keyboard state and
  translates it into independent player input.
- DOM events do not directly move players.
- Opposing directions cancel.
- Used movement keys prevent their default browser behavior.
- Focus loss and visibility changes clear pressed keys.
- Repeated keydown events are ignored so holding a key through restart does not
  immediately reactivate movement through keyboard auto-repeat.
- Event listeners can be disposed during application cleanup.

### Movement and collision

- [src/systems/movement.ts](../src/systems/movement.ts) applies elapsed-time
  movement and chooses facing and idle/walk/run state.
- Diagonal input is normalized, preventing diagonal movement from being faster.
- A fully blocked player switches to idle.
- [src/systems/collision.ts](../src/systems/collision.ts) provides axis-aligned
  body movement with room boundaries and obstacle collision.
- Axis sweeps prevent fast movement from passing through obstacle edges.
- Players can slide along a blocked axis.
- Collision geometry is independent from artwork.

### Animation

- [src/systems/animation.ts](../src/systems/animation.ts) advances animation frames
  using elapsed time.
- Changing clips resets the animation state.
- Looping clips wrap, and non-looping clips hold their final frame.
- Frame counts and speeds are configurable rather than hard-coded into the
  animation update function.
- Current defaults are 6 FPS for idle, 10 FPS for walking, and 14 FPS for running.

### Game state and modular kitchen

- [src/game/state.ts](../src/game/state.ts) creates fresh game state and updates
  both players independently.
- Invalid negative or non-finite delta times are rejected explicitly.
- Restart creates fresh players and world state.
- [src/game/world.ts](../src/game/world.ts) builds a 10 × 7 kitchen on a 128-unit
  grid, giving a world size of 1280 × 896.
- The room consists of individual floor variations, wall segments, corners,
  windows, a closed door and frame, a clock, a floor mat, and two plants.
- Plant bases have separate collision rectangles.
- The world is not a single baked background image.

### Rendering and shared camera

- [src/rendering/camera.ts](../src/rendering/camera.ts) fits the complete room into
  the available canvas area.
- Extra top space keeps tall character sprites and player labels visible at the
  north wall.
- [src/rendering/renderer.ts](../src/rendering/renderer.ts) draws the world and
  characters using Canvas 2D.
- Canvas resolution follows its CSS size and device pixel ratio.
- Image smoothing is disabled for the supplied pixel-style artwork.
- Floors, structures, depth-sorted characters/decorations, and foreground walls
  are rendered separately.
- Player rings and labels distinguish P1 from P2.
- Gameplay systems do not manipulate Canvas drawing state.

### Application lifecycle and interface

- [src/main.ts](../src/main.ts) connects loading, input, state updates, rendering,
  restart, pause/resume, resize handling, and cleanup.
- [src/style.css](../src/style.css) provides the responsive page layout, kitchen
  panel, player cards, key hints, and status notices.
- Loading and failure states are visible.
- Restart is disabled until the game is ready.
- Losing window focus or hiding the tab pauses the loop and clears input.
- Returning to the window resumes play without carrying over the previous
  elapsed-time gap.
- Hot-module cleanup removes registered listeners and stops the loop.
- An existing chef PNG is used as the favicon; no new character artwork was
  generated.

### Browser diagnostics

Opening the application with `?debug` exposes `window.__cookup.snapshot()` for
browser verification.

The method returns a structured clone, not mutable live game state. The
diagnostic property is absent during normal play without that query parameter.

## 6. Automated tests

### Unit tests

Created:

- [src/game/state.test.ts](../src/game/state.test.ts)
- [src/systems/systems.test.ts](../src/systems/systems.test.ts)
- [src/assets/manifest.test.ts](../src/assets/manifest.test.ts)

The final unit run passed **32 tests across 3 files**.

Coverage includes:

- Independent and simultaneous movement.
- Idle, walk, and run transitions.
- Equivalent travel distance at 20, 30, 60, 120, and 144 updates per second.
- Normalized diagonal speed and directional clip selection.
- Room boundaries for both players.
- Plant-base collision.
- Fresh state after restart.
- Invalid and zero delta-time handling.
- Independent Shift keys and configurable bindings.
- Opposing-direction cancellation.
- Animation advancement, wraparound, clip changes, and non-looping clips.
- Collision from all four directions, tunneling prevention, and sliding.
- Camera fitting for different viewport proportions and north-wall label space.
- Existence and actual dimensions of every registered PNG.
- All eight frames in each registered character clip.
- Encoded asset URLs for a project deployment base.
- Explicit errors for invalid animation names.

### Browser tests

Created [tests/kitchen.spec.ts](../tests/kitchen.spec.ts).

The final browser run passed **8 Chromium tests**, using the production build
served on port 4173:

1. Original assets load, the canvas renders, idle animation advances, and no
   application/browser errors are recorded.
2. Both chefs move simultaneously and use independent walk/run controls.
3. Walls stop a running chef, and restart clears movement and held-key repeats.
4. Losing focus pauses the game and clears pressed input.
5. Resizing preserves player positions and correctly sizes the canvas at an
   explicitly asserted device pixel ratio of 2.
6. A missing asset produces a visible failure instead of a blank playable screen.
7. Normal play does not expose the diagnostic snapshot.
8. The production build loads and runs under a simulated `/CookUp/` project
   subdirectory.

The subdirectory test mounts the built responses under that prefix using
Playwright routing. It verifies browser-side relative URLs; it is not a live
GitHub Pages deployment.

## 7. Validation and iteration

### Dependency installation

Installed the dependencies declared in the new package manifest.

The initial installation reported two moderate dependency advisories associated
with the selected Vitest version and its mocker package. Updated the Vitest
declaration from `^3.2.4` to `^4.1.11` and regenerated the lockfile through npm.

The subsequent installation reported **zero known vulnerabilities**. This was a
package audit result, not a separate full application security review.

The successful build used Vite 7.3.6, and unit tests ran with Vitest 4.1.11.

### Test discovery fallback

The editor-integrated test runner did not discover tests in the supplied file
paths. Ran the configured Vitest npm script directly instead; all unit tests
were discovered and passed.

### Visual browser inspection

Started a temporary production preview on port 4174 and opened it in the browser.
Inspected the rendered room, original character sprites, interface, and movement
to the north boundary.

Visual inspection identified and resolved:

- A player label could clip above the canvas at the north wall. Added camera
  headroom and a corresponding test assertion.
- The browser requested a missing `favicon.ico`. Added an explicit favicon link
  to an existing chef image.
- Browser-generated snapshot files were picked up by the formatter. Excluded
  `.playwright-mcp` artifacts from formatting and version control.

Also tightened verification by:

- Testing keyboard auto-repeat after restart.
- Adding the production subdirectory-hosting browser test.
- Applying the 2× device-pixel-ratio setting directly to the Chromium project and
  asserting the actual ratio in the browser test.

After the fixes, visual reinspection confirmed the north-wall label remained
visible, and the inspected browser page reported no console errors.

### Final check results

| Check                                    | Result                                           |
| ---------------------------------------- | ------------------------------------------------ |
| `npm run test`                           | Passed: 32 unit tests                            |
| `npm run test:e2e`                       | Passed: 8 Chromium browser tests                 |
| `npm run typecheck`                      | Passed                                           |
| `npm run lint`                           | Passed                                           |
| `npm run format:check`                   | Passed                                           |
| `npm run build`                          | Passed                                           |
| Dependency audit after the Vitest update | Zero known vulnerabilities reported              |
| Manual browser inspection                | Completed; identified issues fixed and rechecked |

The build generated the deployable static output in `dist`. It is ignored by
Git rather than intended for manual source commits.

Stopped the temporary visual-inspection preview after verification and removed
the named temporary screenshots, snapshots, and console log created for that
inspection.

## 8. Documentation and GitHub Pages

Created [README.md](../README.md) documenting:

- Local setup and commands.
- Both players' controls.
- Architecture and file responsibilities.
- Actual asset locations and preservation rules.
- Collision and animation behavior.
- Tests and browser diagnostics.
- GitHub Pages setup.
- Scope exclusions and known limitations.

Created [.github/workflows/pages.yml](../.github/workflows/pages.yml):

- Pull requests and pushes to `main` or `develop` run validation.
- CI installs dependencies, checks types/lint/formatting, runs unit tests, builds,
  installs Chromium, and runs browser tests.
- Builds from `main` can upload the Pages artifact and deploy it.
- Deployment has the required Pages and identity-token permissions.
- The Vite relative base supports root and project-subdirectory hosting.

No Git repository, feature branch, remote, or commit was created. No GitHub
repository settings were changed, and no live deployment was performed.

## 9. Current behavior and limitations

- The application is entirely client-side.
- A shared physical keyboard is required; touch controls are not implemented.
- Keyboard hardware rollover can limit simultaneous physical key presses.
- Both players share a camera that fits the room.
- Chefs can pass through each other; player-to-player collision is not included.
- Walls and plant bases block movement.
- The door remains closed and has no interaction.
- Idle uses the single supplied idle-facing animation rather than directional
  idle artwork.
- Below 20 FPS, the 50 ms delta cap intentionally slows simulation instead of
  allowing large movement jumps.
- Asset loading must complete before play; a failure is visible and requires
  retrying by reloading the page.
- Automated browser verification covered Chromium, not a full cross-browser
  compatibility matrix.
- GitHub Pages deployment is configured but still requires publishing the
  project and enabling GitHub Actions as the Pages source.
- Cooking and later-milestone systems remain deliberately unimplemented.

## 10. Running the completed prototype

From the project root:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Dependencies were already installed during this
session; `npm ci` is useful for a fresh checkout or a clean reinstall.

For a production preview:

```sh
npm run build
npm run preview
```

For browser verification on a fresh machine:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Keep port 4173 free when running the browser tests.

## 11. Follow-up documentation request

Created the root-level `docs` directory and this
[session_report.md](session_report.md) file at the user's request.

This follow-up records the completed implementation and validation work. It does
not introduce further gameplay changes.
