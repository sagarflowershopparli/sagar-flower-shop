# Sagar virtual boutique

An optional, self-contained Three.js experience at `/shop-3d/`, served directly by GitHub Pages. There is no framework, build service, paid API, remote runtime dependency or change to the existing gallery JavaScript.

## Integration and removal

The root `index.html` contains one invitation below the hero and one `shop-3d/entry.css` link. Remove these two additions to detach the experience. The whole `shop-3d/` directory can then be removed independently. Existing `app.js`, `styles.css`, galleries, product links, deployment settings and main-page metadata are unchanged.

## Files

- `index.html`, `shop.css`: accessible shell, welcome, guided navigation, detail dialog and photo fallback.
- `shop.js`: lazy loading, pointer/touch/keyboard input, guided camera, product selection, lifecycle and error handling.
- `scene.js`: boutique architecture, material setup, instanced products, LOD, static shadows and rendering resources.
- `catalog.js`: product descriptions, positions, tour stops, real portfolio photo paths and WhatsApp links.
- `assets/botanical-kit.glb`: original curved petal and leaf geometry; high and low detail rose meshes.
- `assets/*.webp`: compact original wood, stone, contact shadow and welcome preview textures.
- `scripts/build-assets.py`: deterministic source for GLB and material textures (Python, NumPy, Pillow).
- `vendor/`: locally hosted Three.js 0.180.0 with its MIT license. GLTFLoader's geometry utility import is adjusted to the local flat directory.

## Content and visual scope

This is a designed virtual boutique, not a measured reconstruction of the physical shop. Flower geometry is illustrative. Product dialogs and the lightweight catalog use actual existing Sagar portfolio photographs. The wedding canopy and decorated car are display samples. Flower availability, customisation and prices are confirmed by the shop; no new prices or inventory promises are introduced. The WhatsApp destination is the existing published number, +91 7620644158. Opening a link drafts an enquiry; it does not send a message.

To change products, edit `catalog.js`; use a photo already present under `../assets/images/`. Display type options: `bouquet`, `vase`, `bucket`, `garland`, `arch`, `car`. Product positions and tour stops use metres in Three.js coordinates (Y up).

## Performance decisions

- The homepage loads only the tiny invitation stylesheet. The 3D renderer, scene and GLB download only after explicit entry.
- The botanical GLB is 52,588 bytes with both LODs. Draco/Meshopt decoder downloads would exceed the savings for this small mesh, so it is intentionally uncompressed. There is no claim of compressed GLB geometry.
- Material textures use WebP. Small material textures make KTX2 transcoder overhead unnecessary here. Introduce KTX2 and Meshopt/Draco if future photogrammetry assets materially increase the payload.
- Repeated blooms, stems and leaves use `InstancedMesh`; distant arrangements use the lower-detail rose. Static architecture is merged by material.
- Pixel density is capped at 1.6 on desktop and 1 on touch/low-memory devices. Sustained slow rendering lowers quality automatically; the visitor can switch manually.
- Environment reflections are prefiltered once. A directional shadow map renders once, with 1024px on mobile and 2048px on desktop. Contact shadows use a small texture; the subtle product lift intentionally does not regenerate the static shadows. No continuous reflection capture, postprocessing, particle effects or physics.
- Rendering stops when the camera and selection settle, when the tab is hidden, and while the photo catalog is open. GPU resources are disposed on final page exit.
- Save-Data and very low memory devices start with the photo catalog and can opt into 3D. Loader errors, 30-second loading timeout, WebGL failure and context loss all reveal the same usable catalog. A no-JavaScript link returns to the original collection.
- Reduced-motion preference removes animated movement. The tour is accessible through buttons; product details and ordering are accessible through Browse flowers without needing a pointer on a 3D object.

## Preview and validation

Run `python3 -m http.server 8000` from the repository root and visit `http://localhost:8000/shop-3d/`.

Check entrance, all five stops, desktop hover, touch selection and swipe, wheel input, product photos, WhatsApp URLs, modal Escape/focus restoration, quality toggle, resize, hidden-tab resume, failure fallback and original homepage gallery. `window.sagarShopDiagnostics` reports the latest draw calls, rendered triangles, quality, tour progress and selected product for profiling.

Real-device iPhone/Safari and Android testing is still recommended before treating emulated viewport checks as device performance certification. Browser software rendering is not a representative mobile GPU benchmark.

### Automated regression test

With Python Playwright installed and Chrome available at `/opt/google/chrome/chrome`, run `python3 shop-3d/scripts/smoke-test.py`. It starts a temporary local server and writes screenshots to a temporary directory. The check covers lazy entry, desktop hover/selection, product dialog and WhatsApp destination, all guided stops, mobile tap/layout, catalog return, quality mode, wheel/keyboard navigation, WebGL context loss, Save-Data, required-asset failure, and the homepage invitation. It does not send WhatsApp messages.

Validation on 2026-09-11: Chrome desktop (1200×850) and touch/mobile emulation (390×844) passed with zero JavaScript exceptions and zero HTTP failures in the monitored shop pages. The mobile bouquet view used about 70,000 triangles / 64 draw calls; selected bouquet about 86,000 triangles / 45 calls. These are render-complexity observations, not FPS claims for physical phones. Real iPhone/Safari and Android GPU testing was not available in this environment.
