# Temporary Diwali treatment

The seasonal styles and animation are isolated in `diwali.css` and `diwali.js`.
After the festival, remove their two references from `index.html`, the
`diwali-hero` class, the canvas and greeting, and the `diwaliPause` button.
Keep the corrected bouquet image and its outline shadow.

Fireworks use a bounded particle count (150 on mobile, 260 on desktop),
cached glow sprites, capped pixel density, and 30 fps on mobile. Desktop
starts at 60 fps and adapts to 30 fps when rendering is expensive. They stop
when the hero is offscreen, the tab is hidden, the visitor pauses them, or
reduced motion is enabled. No library, video, or network resource is needed.

## Bouquet asset

`assets/brand/hero/hero-red-roses-cutout.webp` is a transparent WebP exported
from the built-in imagegen edit. The original image is retained.

Edit prompt: “Edit this exact hero image into a pristine transparent cutout
for Sagar Flower Shop website. Preserve the red rose bouquet, beige and black
wrapping, red ribbon, scattered petals, and exact gold Marathi Sagar logo at
the bottom, keeping their appearance and arrangement. Remove all background
residue, horizontal smears, rectangular background, haze, backdrop, and
rectangular drop shadow. Everything outside the actual bouquet, petals,
ribbon, and gold logo must be fully transparent with clean detailed
antialiased edges. Keep opaque subject interiors. Preserve correct text
exactly as in reference. Isolated floating photorealistic product cutout;
no replacement background or new elements. Leave narrow transparent padding
around full composition so no edge is clipped. Return transparent PNG.”
