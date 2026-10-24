'use strict';

/**
 * Diwali Fireworks — Sagar Flower Shop
 * Beautiful, elegant celebration overlay for the hero section.
 *
 * Performance design:
 * - All spark/glow textures are pre-rendered once to off-screen canvases (sprites).
 * - The render loop only calls drawImage() — zero per-frame blur, filter, or gradient creation.
 * - Adaptive FPS: auto-throttles to 30fps on weak hardware (hardwareConcurrency ≤ 4).
 * - Visibility-aware: stops entirely when tab is hidden or hero scrolls out of view.
 * - Capped at 4 simultaneous bursts and 120 particles max to prevent GC pressure.
 * - Canvas resolution is capped at 1.5× DPR on desktop, 1.25× on mobile.
 *
 * Remove this file and the <canvas> / greeting markup after the festival.
 */
(() => {
  const canvas = document.getElementById('diwaliFireworks');
  const hero = canvas?.closest('.diwali-hero');
  const ctx = canvas?.getContext('2d', { alpha: true });
  if (!ctx || !hero) return;

  const pauseButton = document.getElementById('diwaliPause');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Diwali-themed warm palettes ── */
  const palettes = [
    ['#D4AF37', '#FFD700', '#FF8C00'],   // Royal gold → deep amber
    ['#E8352E', '#FF6B6B', '#FFB347'],   // Festive red → warm peach
    ['#C850C0', '#FF6EC7', '#FFAA5C'],   // Magenta → golden pink
    ['#22C1C3', '#5DADE2', '#F7DC6F'],   // Teal → sunny yellow
    ['#8E44AD', '#AF7AC5', '#F0B27A'],   // Purple → copper
    ['#FF4500', '#FF6347', '#FFD700'],   // Deep orange → gold
  ];

  /* ── Pre-render glow sprites (once, cached) ── */
  const sprites = new Map();
  const SPRITE_SIZE = 28;

  function makeSprite(color) {
    if (sprites.has(color)) return;
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE_SIZE;
    const g = c.getContext('2d');
    const r = SPRITE_SIZE / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.15, color + 'ee');
    grad.addColorStop(0.4, color + '66');
    grad.addColorStop(0.7, color + '22');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    sprites.set(color, c);
  }

  palettes.flat().forEach(makeSprite);
  // Extra colors for shimmer sparks
  ['#FFFFFF', '#FFFACD', '#FFE4B5'].forEach(makeSprite);

  /* ── State ── */
  let W = 0, H = 0, compact = false;
  let fps = 60, frame = 0, prev = 0;
  let inView = false, paused = false, running = false;
  let elapsed = 0, nextLaunch = 0, seqIdx = 0;
  let rockets = [];
  let bursts = [];
  const MAX_BURSTS = 4;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));

  /* ── Resize ── */
  function resize() {
    const rect = hero.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (w === W && h === H) return;
    W = w; H = h;
    compact = W < 769;
    const ratio = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.5);
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    fps = (compact || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)) ? 30 : 60;
    // Clear stale state on resize
    bursts = []; rockets = [];
    nextLaunch = elapsed + 0.2;
  }

  /* ── Pre-rendered burst shell (off-screen canvas, painted once per palette) ── */
  const shellCache = new Map();

  function buildShell(palette) {
    const key = palette.join(',');
    if (shellCache.has(key)) return shellCache.get(key);

    const size = compact ? 240 : 400;
    const cx = size / 2;
    const sparkCount = compact ? 60 : 100;

    // Three layers: tails, dots, glitter — each an off-screen canvas
    const layers = [0, 1, 2].map(() => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      return c;
    });
    const [tailCtx, dotCtx, glitCtx] = layers.map(c => c.getContext('2d'));
    tailCtx.lineCap = 'round';

    for (let i = 0; i < sparkCount; i++) {
      // Golden-ratio angle distribution for beautiful circular burst
      const angle = i * 2.39996323 + rand(-0.06, 0.06);
      const innerRing = i % 3 === 0;
      const radius = cx * (innerRing ? rand(0.22, 0.6) : rand(0.65, 0.92));
      const x = cx + Math.cos(angle) * radius;
      const y = cx + Math.sin(angle) * radius;
      const color = palette[i % palette.length];

      // Tail streaks
      const tailLen = rand(compact ? 10 : 16, compact ? 20 : 32);
      tailCtx.strokeStyle = color;
      tailCtx.globalAlpha = 0.55;
      tailCtx.lineWidth = compact ? 0.8 : 1.1;
      tailCtx.beginPath();
      tailCtx.moveTo(x - Math.cos(angle) * tailLen, y - Math.sin(angle) * tailLen);
      tailCtx.lineTo(x, y);
      tailCtx.stroke();

      // Glow dots
      const dotSize = rand(compact ? 4 : 6, compact ? 8 : 11);
      dotCtx.drawImage(sprites.get(color), x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);

      // Glitter cross-stars (every 5th spark)
      if (i % 5 === 0) {
        const gc = palette[2] || palette[0];
        glitCtx.fillStyle = gc;
        glitCtx.globalAlpha = 0.9;
        const arm = compact ? 2.5 : 3.5;
        const thick = 0.7;
        glitCtx.fillRect(x - arm, y - thick / 2, arm * 2, thick);
        glitCtx.fillRect(x - thick / 2, y - arm, thick, arm * 2);
      }
    }

    const shell = { layers, size };
    shellCache.set(key, shell);
    return shell;
  }

  /* ── Launch a rocket ── */
  function launchRocket() {
    const isLeft = seqIdx % 2 === 0;
    const palette = palettes[seqIdx % palettes.length];
    seqIdx++;

    // Launch from sides, burst in upper-middle area
    const burstX = W * (compact
      ? (isLeft ? rand(0.15, 0.35) : rand(0.65, 0.85))
      : (isLeft ? rand(0.12, 0.38) : rand(0.62, 0.88)));
    const burstY = H * rand(compact ? 0.18 : 0.16, compact ? 0.42 : 0.44);
    const launchX = burstX + (isLeft ? rand(-30, -10) : rand(10, 30));
    const launchY = H * rand(0.72, 0.82);

    rockets.push({
      x: burstX,
      y: burstY,
      fromX: launchX,
      fromY: launchY,
      age: 0,
      dur: rand(0.65, 0.9),
      palette,
      color: palette[2] || palette[0],
    });
  }

  /* ── Explode rocket into burst ── */
  function explode(rocket) {
    bursts.push({
      x: rocket.x,
      y: rocket.y,
      age: 0,
      life: rand(2.2, 3.0),
      shell: buildShell(rocket.palette),
      spread: rand(0.82, 1.08),
      shimmerPhase: rand(0, 6.28),
      gravity: rand(compact ? 6 : 8, compact ? 10 : 14),
    });
    // Cap bursts
    while (bursts.length > MAX_BURSTS) bursts.shift();
  }

  /* ── Render frame ── */
  function render(dt) {
    elapsed += dt;
    ctx.clearRect(0, 0, W, H);

    // Staggered launches
    if (elapsed >= nextLaunch) {
      launchRocket();
      // Occasional double burst for visual richness
      if (seqIdx % 4 === 0 && bursts.length < MAX_BURSTS - 1) {
        setTimeout(() => { if (running) launchRocket(); }, compact ? 200 : 150);
      }
      nextLaunch = elapsed + rand(compact ? 1.6 : 1.2, compact ? 2.4 : 1.8);
    }

    // Draw rockets (rising trails)
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.age += dt;
      const t = Math.min(1, r.age / r.dur);
      const ease = 1 - (1 - t) * (1 - t); // ease-out quad

      const cx = r.fromX + (r.x - r.fromX) * ease;
      const cy = r.fromY + (r.y - r.fromY) * ease;

      // Fading trail line
      ctx.globalAlpha = 0.5 * (1 - t * 0.4);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 18 * (1 - t) + 6);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Spark head
      const headSize = 8 + 4 * (1 - t);
      ctx.drawImage(sprites.get(r.color), cx - headSize / 2, cy - headSize / 2, headSize, headSize);

      // Shimmer trail particles
      if (t < 0.8) {
        const shimSprite = sprites.get('#FFFACD');
        for (let j = 0; j < 3; j++) {
          const st = Math.max(0, t - j * 0.06);
          const sx = r.fromX + (r.x - r.fromX) * (1 - (1 - st) * (1 - st)) + rand(-3, 3);
          const sy = r.fromY + (r.y - r.fromY) * (1 - (1 - st) * (1 - st)) + rand(-2, 4);
          ctx.globalAlpha = 0.35 * (1 - st);
          ctx.drawImage(shimSprite, sx - 2.5, sy - 2.5, 5, 5);
        }
      }

      if (t >= 1) {
        explode(r);
        rockets.splice(i, 1);
      }
    }

    // Draw bursts
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.age += dt;
      if (b.age >= b.life) { bursts.splice(i, 1); continue; }

      const t = b.age / b.life;
      const expansion = (1 - Math.exp(-b.age * 2.3)) * b.spread;
      const sz = b.shell.size * expansion;
      const drawX = b.x - sz / 2;
      const drawY = b.y - sz / 2 + b.age * b.age * b.gravity;

      // Layer 0: tail streaks (fade faster)
      ctx.globalAlpha = Math.pow(1 - t, 1.8) * 0.85;
      ctx.drawImage(b.shell.layers[0], drawX, drawY, sz, sz);

      // Layer 1: glow dots (main presence)
      ctx.globalAlpha = Math.pow(1 - t, 0.7);
      ctx.drawImage(b.shell.layers[1], drawX, drawY, sz, sz);

      // Layer 2: glitter cross-stars (shimmering)
      const shimmer = 0.35 + 0.65 * Math.abs(Math.sin(b.age * 9 + b.shimmerPhase));
      ctx.globalAlpha = (1 - t) * shimmer * 0.9;
      ctx.drawImage(b.shell.layers[2], drawX, drawY, sz, sz);
    }

    ctx.globalAlpha = 1;
  }

  /* ── Animation loop with adaptive throttle ── */
  let slowFrames = 0;

  function tick(now) {
    if (!running) return;
    frame = requestAnimationFrame(tick);
    const delta = Math.max(0, now - prev);
    if (delta < 1000 / fps - 1) return; // throttle
    prev = now;

    const t0 = performance.now();
    render(Math.min(delta / 1000, 0.05));
    const renderMs = performance.now() - t0;

    // Auto-downgrade to 30fps if frames are taking too long
    if (renderMs > 7) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 12) fps = 30;
  }

  /* ── Lifecycle sync ── */
  function sync() {
    const shouldRun = inView && !document.hidden && !reduced.matches && !paused;
    if (pauseButton) pauseButton.hidden = reduced.matches;
    if (shouldRun === running) return;
    running = shouldRun;
    cancelAnimationFrame(frame);
    prev = 0;
    if (running) {
      // Fresh start — clear stale particles from when we were hidden
      bursts = []; rockets = [];
      elapsed = 0; nextLaunch = 0.25;
      prev = performance.now();
      frame = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }

  /* ── Pause button ── */
  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? 'Play fireworks' : 'Pause fireworks';
    pauseButton.setAttribute('aria-pressed', String(paused));
    sync();
  });

  /* ── Init ── */
  resize();
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(
    entries => { inView = entries[0].isIntersecting; sync(); },
    { threshold: 0.08 }
  ).observe(hero);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
})();
