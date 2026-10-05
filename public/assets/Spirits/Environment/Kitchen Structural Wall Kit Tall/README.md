# CookUp - Kitchen Structural Wall Kit Tall

26 native pixel-art PNGs. Existing Final kit and characters are unchanged.

## Scale and placement

- World grid stays 128 x 128. Render these environment PNGs at 1.0: one PNG pixel equals one world unit. Keep the chefs at their existing 0.5 scale.
- A horizontal wall canvas is 256 world units high (two grid rows); its visible architecture is 240 pixels, with 8 transparent pixels above and below. This is about 1.9x a 128-unit rendered chef frame, and about 2.2x the visible chef silhouette.
- Vertical wall canvases are 128 units wide; the visible wall is only 56 pixels wide. Their long dimension follows the room perimeter, not a second wall-height scale.
- Anchor every canvas at a top-left grid intersection, with zero draw offset. Horizontal and corner modules occupy two visual rows. This revision is NOT a drop-in placement replacement for old one-row modules.
- Repeat horizontal modules by their canvas width; repeat vertical modules by their canvas height. A vertical single-cell filler changes side-wall run length, not architectural height.
- Corners and caps are 128 x 256. E/W connections cover the full 256px side; N/S connections cover the 128px top/bottom. Never rotate sprites: use named variants to keep lighting consistent.
- Outside corners use square returns; inside corners add a chamfer to the concave return. Both use the documented E/W/N/S ports. Select by the visible return treatment, not by mirroring or rotating.
- Window-wall modules already include their wall. Doorway modules include wall, lintel and jambs; overlay exactly one matching door state at the same top-left. Door-state grid spans describe alignment only: they do not add cells.
- Canvas bounds and opaque bounds are not collision prescriptions. The transparent doorway is a passage; walls do not fill every pixel of their canvas.

## Example perimeter placement (grid-column, grid-row)

For an 8 x 8 grid bounding box: outside top-left (0,0), outside top-right (7,0), outside bottom-left (0,6), outside bottom-right (7,6).
Place horizontal segments at (1,0), (3,0), (5,0) and (1,6), (3,6), (5,6).
Place vertical segments at (0,2), (0,4), (7,2), (7,4). Replace the module at (3,6) with the horizontal doorway and its selected door overlay. All coordinates multiply by 128; no old-kit pieces or corner rotations are needed.

## Asset inventory and Final-kit replacements

Replacement paths below are relative to Kitchen Structural Wall Kit Final. Empty mappings are new capabilities. Folder paths are relative to this Tall kit.

| Tall filename | PNG pixels | Grid placement | Final-kit replacement |
|---|---|---|---|
| Walls\cookup-tall-wall-horizontal-256x256.png | 256 x 256 | 2x2 cells; repeat east/west every 256 units. | Walls\cookup-structural-wall-horizontal-256x128.png |
| Walls\cookup-tall-wall-vertical-128x256.png | 128 x 256 | 1x2 cells; repeat north/south every 256 units. | Walls\cookup-structural-wall-vertical-128x256.png |
| Corners\cookup-tall-corner-outside-top-left-128x256.png | 128 x 256 | 1x2 cells; east horizontal connection, south vertical connection. | Corners\cookup-structural-corner-top-left-128x128.png |
| Walls\cookup-tall-wall-horizontal-single-128x256.png | 128 x 256 | 1x2 cells; horizontal filler for an odd grid-column count. | Walls\cookup-structural-wall-horizontal-single-128x128.png |
| Walls\cookup-tall-wall-vertical-single-128x128.png | 128 x 128 | 1x1 cell; longitudinal side-wall filler, not a shorter wall elevation. | Walls\cookup-structural-wall-vertical-single-128x128.png |
| Corners\cookup-tall-corner-inside-top-left-128x256.png | 128 x 256 | 1x2 cells; chamfered concave return, ports ES; new alternative, not a rotated outside corner. | New piece; no direct predecessor. |
| Corners\cookup-tall-corner-outside-top-right-128x256.png | 128 x 256 | 1x2 cells; square return, ports WS. | Corners\cookup-structural-corner-top-right-128x128.png |
| Corners\cookup-tall-corner-inside-top-right-128x256.png | 128 x 256 | 1x2 cells; chamfered concave return, ports WS; new alternative, not a rotated outside corner. | New piece; no direct predecessor. |
| Corners\cookup-tall-corner-outside-bottom-left-128x256.png | 128 x 256 | 1x2 cells; square return, ports EN. | Corners\cookup-structural-corner-bottom-left-128x128.png |
| Corners\cookup-tall-corner-inside-bottom-left-128x256.png | 128 x 256 | 1x2 cells; chamfered concave return, ports EN; new alternative, not a rotated outside corner. | New piece; no direct predecessor. |
| Corners\cookup-tall-corner-outside-bottom-right-128x256.png | 128 x 256 | 1x2 cells; square return, ports WN. | Corners\cookup-structural-corner-bottom-right-128x128.png |
| Corners\cookup-tall-corner-inside-bottom-right-128x256.png | 128 x 256 | 1x2 cells; chamfered concave return, ports WN; new alternative, not a rotated outside corner. | New piece; no direct predecessor. |
| Caps\cookup-tall-cap-left-128x256.png | 128 x 256 | 1x2 cells; terminates at left, connects only on E. | Caps\cookup-structural-cap-left-128x128.png |
| Caps\cookup-tall-cap-right-128x256.png | 128 x 256 | 1x2 cells; terminates at right, connects only on W. | Caps\cookup-structural-cap-right-128x128.png |
| Caps\cookup-tall-cap-top-128x256.png | 128 x 256 | 1x2 cells; terminates at top, connects only on S. | Caps\cookup-structural-cap-top-128x128.png |
| Caps\cookup-tall-cap-bottom-128x256.png | 128 x 256 | 1x2 cells; terminates at bottom, connects only on N. | Caps\cookup-structural-cap-bottom-128x128.png |
| Doorway\cookup-tall-doorway-horizontal-256x256.png | 256 x 256 | 2x2 cells; complete wall/frame module; overlay matching horizontal door state at identical top-left. | Doorway\cookup-structural-doorway-frame-opening-256x128.png |
| Doorway\cookup-tall-door-horizontal-closed-256x256.png | 256 x 256 | 2x2 canvas; overlay only, same origin as doorway-horizontal; choose one state. | Doorway\cookup-structural-door-closed-256x128.png |
| Doorway\cookup-tall-door-horizontal-ajar-256x256.png | 256 x 256 | 2x2 canvas; overlay only, same origin as doorway-horizontal; choose one state. | Doorway\cookup-structural-door-ajar-256x128.png |
| Doorway\cookup-tall-door-horizontal-open-256x256.png | 256 x 256 | 2x2 canvas; overlay only, same origin as doorway-horizontal; choose one state. | Doorway\cookup-structural-door-open-256x128.png |
| Windows\cookup-tall-window-wall-horizontal-256x256.png | 256 x 256 | 2x2 cells; replaces matching tall straight segment; window already embedded. | Windows\cookup-structural-window-wall-horizontal-256x128.png |
| Doorway\cookup-tall-doorway-vertical-128x256.png | 128 x 256 | 1x2 cells; complete wall/frame module; overlay matching vertical door state at identical top-left. | New piece; no direct predecessor. |
| Doorway\cookup-tall-door-vertical-closed-128x256.png | 128 x 256 | 1x2 canvas; overlay only, same origin as doorway-vertical; choose one state. | New piece; no direct predecessor. |
| Doorway\cookup-tall-door-vertical-ajar-128x256.png | 128 x 256 | 1x2 canvas; overlay only, same origin as doorway-vertical; choose one state. | New piece; no direct predecessor. |
| Doorway\cookup-tall-door-vertical-open-128x256.png | 128 x 256 | 1x2 canvas; overlay only, same origin as doorway-vertical; choose one state. | New piece; no direct predecessor. |
| Windows\cookup-tall-window-wall-vertical-128x256.png | 128 x 256 | 1x2 cells; replaces matching tall straight segment; window already embedded. | Windows\cookup-structural-window-wall-vertical-128x256.png |

assets.json contains exact dimensions, top-left anchors, connector directions, opaque bounds, scale, replacement mappings, and SHA-256 hashes for every PNG.
