// ============================================================================
//  Procedural cover art.
//  The arcade holds no image files. Every cabinet's cover is drawn from its
//  accent palette and a seed, so adding a game never means adding a PNG.
//  Register a new style here and reference it by name from games.json.
// ============================================================================

/** Deterministic PRNG so a given seed always draws the same cover. */
export function rng(seed) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

const hex = (c) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };

/* ------------------------------------------------------------- aurora */
function aurora(ctx, w, h, acc, seed) {
  const R = rng(seed);
  const horizon = h * 0.62;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#05070f');
  sky.addColorStop(1, '#0a1120');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);

  for (let i = 0; i < 90; i++) {
    const x = R() * w, y = R() * horizon * 0.95, r = R() * 1.1 + 0.2;
    ctx.fillStyle = `rgba(220,238,255,${0.15 + R() * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  // curtains: a swept band per accent colour, brightest at its lower edge
  ctx.globalCompositeOperation = 'lighter';
  for (let c = 0; c < 5; c++) {
    const col = acc[c % acc.length];
    const yBase = horizon * (0.30 + R() * 0.52);
    const amp = h * (0.05 + R() * 0.11);
    const phase = R() * 6.28;
    const freq = 1.1 + R() * 1.9;
    const thick = h * (0.12 + R() * 0.20);

    for (let x = 0; x <= w; x += 2) {
      const t = x / w;
      const y = yBase + Math.sin(t * freq * 6.28 + phase) * amp;
      const g = ctx.createLinearGradient(0, y - thick, 0, y + thick * 0.35);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.62, rgba(col, 0.10));
      g.addColorStop(1, rgba(col, 0.34));
      ctx.fillStyle = g;
      ctx.fillRect(x, y - thick, 3, thick * 1.35);
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  // water
  const sea = ctx.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#0a1626');
  sea.addColorStop(1, '#03060c');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const y = horizon + (i / 26) * (h - horizon);
    const squash = 1 - (y - horizon) / (h - horizon);
    ctx.strokeStyle = rgba(acc[i % acc.length], 0.07 + squash * 0.16);
    ctx.lineWidth = 0.7 + (1 - squash) * 1.4;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const yy = y + Math.sin(x * 0.03 + i * 0.9 + seed) * (1.4 + (1 - squash) * 3.5);
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // the flyer
  const fx = w * 0.5, fy = horizon + (h - horizon) * 0.34;
  const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.20);
  glow.addColorStop(0, rgba(acc[0], 0.5));
  glow.addColorStop(1, rgba(acc[0], 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(240,255,255,.95)';
  ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx - w * 0.13, fy + 5);
  ctx.quadraticCurveTo(fx, fy - 11, fx + w * 0.13, fy + 5);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

/* -------------------------------------------------------------- waves */
function waves(ctx, w, h, acc, seed) {
  const R = rng(seed);
  ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const col = acc[i % acc.length];
    const y0 = (i / 40) * h * 1.15 - h * 0.08;
    ctx.strokeStyle = rgba(col, 0.10 + R() * 0.20);
    ctx.lineWidth = 0.6 + R() * 1.3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const t = x / w;
      const y = y0
        + Math.sin(t * 7 + i * 0.4 + seed) * h * 0.05
        + Math.sin(t * 17 - i * 0.2) * h * 0.018;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

/* -------------------------------------------------------------- orbit */
function orbit(ctx, w, h, acc, seed) {
  const R = rng(seed);
  ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const col = acc[i % acc.length];
    const rad = (0.10 + i * 0.055) * w;
    ctx.strokeStyle = rgba(col, 0.34 - i * 0.028);
    ctx.lineWidth = 0.6 + R();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rad, rad * (0.30 + R() * 0.28), R() * 3.14, 0, 7);
    ctx.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const a = R() * 6.28, rad = R() * w * 0.5;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.42;
    ctx.fillStyle = rgba(acc[i % acc.length], 0.2 + R() * 0.6);
    ctx.beginPath(); ctx.arc(x, y, R() * 1.5 + 0.3, 0, 7); ctx.fill();
  }
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.16);
  g.addColorStop(0, rgba(acc[0], 0.8));
  g.addColorStop(1, rgba(acc[0], 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/* --------------------------------------------------------------- grid */
function grid(ctx, w, h, acc, seed) {
  ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, w, h);
  const hz = h * 0.42;
  const g = ctx.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, rgba(acc[2 % acc.length], 0.30));
  g.addColorStop(1, rgba(acc[0], 0.05));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz);

  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(acc[1 % acc.length], 0.34); ctx.lineWidth = 0.7;
  for (let i = -14; i <= 14; i++) {
    ctx.beginPath(); ctx.moveTo(w / 2 + i * 9, hz); ctx.lineTo(w / 2 + i * w * 0.14, h); ctx.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const t = i / 16, y = hz + Math.pow(t, 2.1) * (h - hz);
    ctx.strokeStyle = rgba(acc[0], 0.34 * (1 - t) + 0.06);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

const STYLES = { aurora, waves, orbit, grid };

export function drawCover(canvas, game) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 340, h = canvas.clientHeight || 178;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const fn = STYLES[game.art] || aurora;
  fn(ctx, w, h, game.accent && game.accent.length ? game.accent : ['#6bffc4', '#7ad4ff', '#c58bff'], game.seed || 1);
}

export const ART_STYLES = Object.keys(STYLES);
