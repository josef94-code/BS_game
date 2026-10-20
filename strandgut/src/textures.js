import * as THREE from 'three';

// Prozedural erzeugte, kachelbare Texturen (keine Bilddateien nötig)

// Periodisches Value-Noise: Gitter wiederholt sich nach `period` Zellen → nahtlos kachelbar
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function pnoise(x, y, period, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = (a) => ((a % period) + period) % period;
  const a = hash(m(xi), m(yi), seed), b = hash(m(xi + 1), m(yi), seed), c = hash(m(xi), m(yi + 1), seed), d = hash(m(xi + 1), m(yi + 1), seed);
  return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}
// fbm über Einheitskachel (x,y in 0..1)
export function tfbm(x, y, base, oct, seed, gain = 0.5) {
  let s = 0, a = 1, n = 0, p = base;
  for (let i = 0; i < oct; i++) { s += a * pnoise(x * p, y * p, p, seed + i * 17); n += a; a *= gain; p *= 2; }
  return s / n;
}
// Zellrauschen (Worley), kachelbar – für Steine, Kiesel, Blattadern
export function tworley(x, y, cells, seed) {
  const X = x * cells, Y = y * cells, xi = Math.floor(X), yi = Math.floor(Y);
  let d1 = 9, d2 = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, mx = ((cx % cells) + cells) % cells, my = ((cy % cells) + cells) % cells;
    const px = cx + hash(mx, my, seed), py = cy + hash(mx, my, seed + 7);
    const d = Math.hypot(px - X, py - Y);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return [d1, d2];
}

// Höhenfeld → Normal-Map (kachelbar)
function heightToNormal(hgt, S, strength) {
  const out = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const l = hgt[y * S + ((x - 1 + S) % S)], r = hgt[y * S + ((x + 1) % S)];
    const u = hgt[((y - 1 + S) % S) * S + x], d = hgt[((y + 1) % S) * S + x];
    let nx = (l - r) * strength, ny = (u - d) * strength, nz = 1;
    const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
    const o = (y * S + x) * 4;
    out[o] = (nx * 0.5 + 0.5) * 255; out[o + 1] = (ny * 0.5 + 0.5) * 255; out[o + 2] = (nz * 0.5 + 0.5) * 255; out[o + 3] = 255;
  }
  return out;
}

function tex(data, S, srgb, repeat = 1) {
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

function build(S, fn) {
  // fn(u, v) → [r, g, b, height, a?]
  const col = new Uint8Array(S * S * 4), hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const r = fn(x / S, y / S), o = (y * S + x) * 4;
    col[o] = r[0]; col[o + 1] = r[1]; col[o + 2] = r[2]; col[o + 3] = r[4] ?? 255;
    hgt[y * S + x] = r[3];
  }
  return { col, hgt };
}

const cache = {};
const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function sandTextures(S = 512) {
  if (cache.sand) return cache.sand;
  const { col, hgt } = build(S, (u, v) => {
    const n = tfbm(u, v, 8, 5, 3), n2 = tfbm(u, v, 3, 4, 13);
    const grain = hash((u * S) | 0, (v * S) | 0, 9);
    // Windrippel: unregelmäßig, durch Rauschen verbogen und stellenweise ausgeblendet
    const warp = tfbm(u, v, 3, 4, 11) * 3.5;
    const rip = Math.sin((v * 9 + u * 2 + warp) * Math.PI * 2) * 0.5 + 0.5;
    const fade = Math.max(0, Math.min(1, (n2 - 0.35) * 3));
    const ripple = Math.pow(rip, 2.2) * fade;
    const h = ripple * 0.5 + grain * 0.25 + n * 0.35;
    const k = 0.86 + n * 0.2 + (grain - 0.5) * 0.22 + (n2 - 0.5) * 0.1;
    const dark = grain > 0.975 ? 0.5 : grain < 0.015 ? 1.15 : 1;
    return [202 * k * dark, 176 * k * dark, 134 * k * dark, h];
  });
  cache.sand = { map: tex(col, S, true), normal: tex(heightToNormal(hgt, S, 1.6), S, false) };
  return cache.sand;
}

export function grassGroundTextures(S = 512) {
  if (cache.grass) return cache.grass;
  const { col, hgt } = build(S, (u, v) => {
    const n = tfbm(u, v, 6, 5, 21), m = tfbm(u, v, 3, 3, 23);
    const b = hash((u * S) | 0, (v * S) | 0, 5);
    const blade = Math.pow(b, 3);
    const dirt = clamp01((m - 0.55) * 4);
    const g = [mix(58, 92, n) + blade * 40, mix(96, 132, n) + blade * 50, mix(36, 50, n) + blade * 10];
    const d = [118, 96, 66];
    return [mix(g[0], d[0], dirt * 0.6), mix(g[1], d[1], dirt * 0.6), mix(g[2], d[2], dirt * 0.6), n * 0.5 + blade * 0.5];
  });
  cache.grass = { map: tex(col, S, true), normal: tex(heightToNormal(hgt, S, 1.8), S, false) };
  return cache.grass;
}

export function rockTextures(S = 512) {
  if (cache.rock) return cache.rock;
  const { col, hgt } = build(S, (u, v) => {
    const n = tfbm(u, v, 4, 6, 31, 0.55);
    const [d1, d2] = tworley(u, v, 7, 33);
    const crack = clamp01(1 - (d2 - d1) * 9);
    const strata = Math.sin((v * 9 + n * 3) * Math.PI * 2) * 0.5 + 0.5;
    const h = n * 0.8 + strata * 0.15 - crack * 0.6 + d1 * 0.2;
    const k = 0.72 + n * 0.45 - crack * 0.35;
    const moss = clamp01((tfbm(u, v, 3, 3, 37) - 0.62) * 5);
    return [mix(128 * k, 70, moss * 0.6), mix(122 * k, 92, moss * 0.6), mix(112 * k, 50, moss * 0.6), h];
  });
  cache.rock = { map: tex(col, S, true), normal: tex(heightToNormal(hgt, S, 3.5), S, false) };
  return cache.rock;
}

export function barkTextures(S = 256) {
  if (cache.bark) return cache.bark;
  const { col, hgt } = build(S, (u, v) => {
    const ring = Math.pow(Math.abs(Math.sin(v * Math.PI * 12 + tfbm(u, v, 4, 2, 41) * 2)), 0.4);
    const fib = tfbm(u * 1, v * 0.1 + u, 16, 3, 43);
    const h = ring * 0.6 + fib * 0.4;
    const k = 0.6 + ring * 0.35 + fib * 0.2;
    return [168 * k, 136 * k, 98 * k, h];
  });
  cache.bark = { map: tex(col, S, true), normal: tex(heightToNormal(hgt, S, 4), S, false) };
  return cache.bark;
}

// Wasser-Normalmap aus überlagerten, kachelbaren Wellen
export function waterNormal(S = 512) {
  if (cache.water) return cache.water;
  const hgt = new Float32Array(S * S);
  const waves = [];
  for (let i = 0; i < 24; i++) {
    const kx = Math.round((hash(i, 1, 51) - 0.5) * 16), ky = Math.round((hash(i, 2, 51) - 0.5) * 16);
    if (!kx && !ky) continue;
    waves.push([kx, ky, hash(i, 3, 51) * 6.28, 1 / Math.hypot(kx, ky)]);
  }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    let h = 0;
    for (const [kx, ky, ph, a] of waves) h += Math.sin((u * kx + v * ky) * Math.PI * 2 + ph) * a;
    h += tfbm(u, v, 16, 3, 55) * 0.25;
    hgt[y * S + x] = h;
  }
  cache.water = tex(heightToNormal(hgt, S, 6), S, false);
  return cache.water;
}

export function foamTexture(S = 256) {
  if (cache.foam) return cache.foam;
  const { col } = build(S, (u, v) => {
    const [d1, d2] = tworley(u, v, 10, 61);
    const n = tfbm(u, v, 8, 4, 63);
    const f = clamp01((d2 - d1) * 3) * 0.6 + n * 0.6;
    const val = clamp01((f - 0.45) * 2.5) * 255;
    return [val, val, val, 0];
  });
  cache.foam = tex(col, S, false);
  return cache.foam;
}

// Wellblech mit Rost für Container
export function corrugatedNormal(S = 256) {
  if (cache.corr) return cache.corr;
  const hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S;
    const w = (u * 16) % 1;
    const prof = w < 0.25 ? 0 : w < 0.4 ? (w - 0.25) / 0.15 : w < 0.75 ? 1 : w < 0.9 ? 1 - (w - 0.75) / 0.15 : 0;
    hgt[y * S + x] = prof + tfbm(u, y / S, 16, 3, 71) * 0.15;
  }
  cache.corr = tex(heightToNormal(hgt, S, 5), S, false);
  return cache.corr;
}

export function rustTextures(S = 512, seed = 1) {
  const key = 'rust' + seed;
  if (cache[key]) return cache[key];
  const rough = new Uint8Array(S * S * 4);
  const { col, hgt } = build(S, (u, v) => {
    const n = tfbm(u, v, 4, 6, 81 + seed);
    const streak = tfbm(u * 1, v * 0.08 + u * 0.3, 24, 3, 83 + seed);
    const rust = clamp01((n - 0.5) * 3 + (streak - 0.5) * 2.2);
    const pit = hash((u * S) | 0, (v * S) | 0, 85 + seed) > 0.985 ? 1 : 0;
    const r = clamp01(rust + pit * 0.5);
    const o = (((v * S) | 0) * S + ((u * S) | 0)) * 4;
    const rv = mix(110, 240, r); rough[o] = rv; rough[o + 1] = rv; rough[o + 2] = rv; rough[o + 3] = 255;
    // Farbmaske: weiß = Lack (wird mit Lackfarbe multipliziert), braun = Rost
    const dirt = 0.9 + n * 0.1 - streak * 0.08;
    return [mix(255 * dirt, 150, r), mix(255 * dirt, 82, r), mix(255 * dirt, 48, r), n * 0.3 + r * 0.6 - pit * 0.3];
  });
  cache[key] = { mask: tex(col, S, true), normal: tex(heightToNormal(hgt, S, 2), S, false), rough: tex(rough, S, false) };
  return cache[key];
}

// ---------- Blatt- und Grastexturen mit Alpha (Canvas) ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Palmwedel: Mittelrippe von unten nach oben, Fiederblätter zu beiden Seiten
export function frondTexture() {
  if (cache.frond) return cache.frond;
  cache.frond = canvasTex(256, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w / 2;
    for (let i = 0; i < 70; i++) {
      const t = i / 70, y = h - 40 - t * (h - 60);
      const len = (Math.sin(Math.min(1, t * 1.25) * Math.PI) * 0.85 + 0.15) * (w / 2 - 6);
      for (const s of [-1, 1]) {
        const droop = 30 + t * 20;
        const grd = g.createLinearGradient(cx, y, cx + s * len, y + droop);
        grd.addColorStop(0, `rgb(${60 + t * 20},${110 + t * 30},${40})`);
        grd.addColorStop(1, `rgb(${110 + t * 40},${150 + t * 30},${55})`);
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(cx + s * 2, y - 3);
        g.quadraticCurveTo(cx + s * len * 0.5, y - 6, cx + s * len, y + droop);
        g.quadraticCurveTo(cx + s * len * 0.5, y + 6, cx + s * 2, y + 5);
        g.fill();
        g.strokeStyle = 'rgba(30,60,20,0.35)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(cx + s * len * 0.5, y, cx + s * len, y + droop); g.stroke();
      }
    }
    g.fillStyle = '#7a8a3a'; g.fillRect(cx - 4, 10, 8, h - 10);
  });
  return cache.frond;
}

// Blattbüschel für Laubbäume und Büsche
export function leafClusterTexture(hue = 0) {
  const key = 'leaf' + hue;
  if (cache[key]) return cache[key];
  cache[key] = canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = 7 + hue * 13;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * w * 0.42;
      const x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r * 0.9;
      const L = 26 + rnd() * 26, W = L * 0.45, ang = a + (rnd() - 0.5) * 1.2;
      const shade = 0.6 + rnd() * 0.5 + (y < h / 2 ? 0.15 : -0.1);
      g.save(); g.translate(x, y); g.rotate(ang);
      g.fillStyle = `rgb(${(48 + hue * 30) * shade | 0},${(108 + hue * 10) * shade | 0},${(38) * shade | 0})`;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -W, L, 0); g.quadraticCurveTo(L * 0.5, W, 0, 0); g.fill();
      g.strokeStyle = 'rgba(20,45,15,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.9, 0); g.stroke();
      g.restore();
    }
  });
  return cache[key];
}

export function grassBladeTexture() {
  if (cache.blade) return cache.blade;
  cache.blade = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let s = 3;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 46; i++) {
      const x = 10 + rnd() * (w - 20), bh = h * (0.45 + rnd() * 0.55), bend = (rnd() - 0.5) * 50, bw = 3 + rnd() * 4;
      const grd = g.createLinearGradient(0, h, 0, h - bh);
      const dry = rnd() < 0.18;
      grd.addColorStop(0, dry ? '#6b6236' : '#2f4a1c'); grd.addColorStop(0.6, dry ? '#b8a462' : '#5f8f34'); grd.addColorStop(1, dry ? '#d8c98a' : '#9ccf5a');
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(x - bw, h); g.quadraticCurveTo(x + bend * 0.3, h - bh * 0.6, x + bend, h - bh); g.quadraticCurveTo(x + bend * 0.3 + bw * 0.4, h - bh * 0.6, x + bw, h); g.fill();
    }
  });
  return cache.blade;
}

export function particleTexture(kind = 'soft') {
  const key = 'p' + kind;
  if (cache[key]) return cache[key];
  cache[key] = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (kind === 'smoke') { gr.addColorStop(0, 'rgba(200,200,200,0.5)'); gr.addColorStop(1, 'rgba(200,200,200,0)'); }
    else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return cache[key];
}

// Stoffstruktur (Köperbindung) für Kleidung
export function fabricNormal(S = 256) {
  if (cache.fabric) return cache.fabric;
  const hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const twill = Math.sin(((x + y) / S) * Math.PI * 2 * 48) * 0.5 + 0.5;
    hgt[y * S + x] = twill * 0.6 + tfbm(x / S, y / S, 16, 3, 91) * 0.4;
  }
  cache.fabric = tex(heightToNormal(hgt, S, 2.5), S, false, 4);
  return cache.fabric;
}
