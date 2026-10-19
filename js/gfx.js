'use strict';
// ------------------------------------------------------------
//  Grafik-Hilfsfunktionen (alles prozedural, keine Bilddateien)
// ------------------------------------------------------------
const W = 480, H = 270;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function rngf(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(c) { return '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { return toHex(hex2rgb(h).map(v => v * f)); }
function mixc(a, b, t) { const x = hex2rgb(a), y = hex2rgb(b); return toHex(x.map((v, i) => lerp(v, y[i], t))); }
function rgba(h, a) { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function line(ctx, x1, y1, x2, y2, c, lw) {
  ctx.strokeStyle = c; ctx.lineWidth = lw || 1;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function circle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function ellipse(ctx, x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); }
function text(ctx, s, x, y, c, size, align) {
  ctx.fillStyle = c; ctx.font = (size || 6) + 'px monospace'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Boden-Koordinaten (u: links→rechts 0..1, v: hinten→vorne 0..1) → Bildschirm
function proj(room, u, v) {
  const f = room.floor;
  const xl = lerp(f.xbl, f.xfl, v), xr = lerp(f.xbr, f.xfr, v);
  return { x: lerp(xl, xr, u), y: lerp(f.yb, f.yf, v), s: lerp(f.sb, f.sf, v) };
}

// Quader auf dem Boden (h in "Einheiten", wird mit Tiefe skaliert)
function box(ctx, room, u0, u1, v0, v1, h, col, opt) {
  opt = opt || {};
  const a = proj(room, u0, v1), b = proj(room, u1, v1), c = proj(room, u1, v0), d = proj(room, u0, v0);
  const lift = opt.lift || 0;
  const A = [a.x, a.y - lift * a.s], B = [b.x, b.y - lift * b.s], C = [c.x, c.y - lift * c.s], D = [d.x, d.y - lift * d.s];
  const At = [a.x, A[1] - h * a.s], Bt = [b.x, B[1] - h * b.s], Ct = [c.x, C[1] - h * c.s], Dt = [d.x, D[1] - h * d.s];
  const cx = W / 2;
  if (a.x > cx) poly(ctx, [A, D, Dt, At], shade(col, 0.68));
  if (b.x < cx) poly(ctx, [B, C, Ct, Bt], shade(col, 0.6));
  if (!opt.noTop) poly(ctx, [At, Bt, Ct, Dt], opt.top || shade(col, 1.22));
  poly(ctx, [A, B, Bt, At], col);
  if (opt.edge) { ctx.strokeStyle = opt.edge; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(At[0], At[1]); ctx.lineTo(Bt[0], Bt[1]); ctx.stroke(); }
  return { x0: a.x, x1: b.x, y: A[1], top: At[1], s: a.s, h: h * a.s, w: b.x - a.x, bx0: d.x, bx1: c.x, by: D[1] };
}

// Raumhülle: Decke, Rückwand, Seitenwände, Boden
function shell(ctx, room, o) {
  const f = room.floor, top = room.wallTop;
  rect(ctx, 0, 0, W, H, o.ceil);
  const hb = f.yb - top, k = f.sf / f.sb;
  const ytfL = f.yf - hb * k;
  // Seitenwände
  poly(ctx, [[f.xbl, top], [f.xbl, f.yb], [f.xfl, f.yf], [f.xfl, ytfL]], o.sideL || shade(o.wall, 0.72));
  poly(ctx, [[f.xbr, top], [f.xbr, f.yb], [f.xfr, f.yf], [f.xfr, ytfL]], o.sideR || shade(o.wall, 0.62));
  // Rückwand
  rect(ctx, f.xbl, top, f.xbr - f.xbl, f.yb - top, o.wall);
  // Boden
  poly(ctx, [[f.xbl, f.yb], [f.xbr, f.yb], [f.xfr, f.yf], [f.xfl, f.yf]], o.floor);
  // Bodenfugen
  ctx.save();
  ctx.beginPath(); ctx.moveTo(f.xbl, f.yb); ctx.lineTo(f.xbr, f.yb); ctx.lineTo(f.xfr, f.yf); ctx.lineTo(f.xfl, f.yf); ctx.closePath(); ctx.clip();
  const nu = o.tilesU || 8, nv = o.tilesV || 6;
  ctx.globalAlpha = o.tileAlpha || 0.18;
  for (let i = 0; i <= nu; i++) { const p = proj(room, i / nu, 0), q = proj(room, i / nu, 1.2); line(ctx, p.x, p.y, q.x, q.y + 30, '#000', 0.6); }
  for (let j = 0; j <= nv; j++) { const vv = Math.pow(j / nv, 1.25); const p = proj(room, -0.5, vv), q = proj(room, 1.5, vv); line(ctx, p.x, p.y, q.x, q.y, '#000', 0.6); }
  ctx.globalAlpha = 1;
  // Körnung
  const r = rngf(room.seed || 7);
  for (let i = 0; i < 500; i++) {
    const u = r(), v = r(); const p = proj(room, u * 1.4 - 0.2, v);
    ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  ctx.restore();
  // Sockelleiste / Kante
  line(ctx, f.xbl, f.yb, f.xbr, f.yb, 'rgba(0,0,0,0.6)', 1);
  line(ctx, f.xbl, top, f.xbl, f.yb, 'rgba(0,0,0,0.5)', 1);
  line(ctx, f.xbr, top, f.xbr, f.yb, 'rgba(0,0,0,0.5)', 1);
  // Deckenträger
  if (o.beams) {
    for (let i = 0; i < o.beams; i++) {
      const t = (i + 0.5) / o.beams;
      const x = lerp(f.xbl, f.xbr, t);
      line(ctx, x, top, lerp(-200, W + 200, t), -60, shade(o.ceil, 1.8), 3);
    }
    line(ctx, f.xbl, top, f.xbr, top, shade(o.ceil, 2), 2);
  }
}

// Wandtexturen auf der Rückwand
function wallTex(ctx, room, kind, col, y0, y1) {
  const f = room.floor; y0 = y0 ?? room.wallTop; y1 = y1 ?? f.yb;
  const x0 = f.xbl, x1 = f.xbr;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  if (kind === 'metal') {
    for (let x = x0; x < x1; x += 4) { rect(ctx, x, y0, 1, y1 - y0, rgba('#000000', 0.22)); rect(ctx, x + 2, y0, 1, y1 - y0, rgba('#ffffff', 0.04)); }
  } else if (kind === 'brick') {
    for (let y = y0, row = 0; y < y1; y += 5, row++) {
      line(ctx, x0, y, x1, y, rgba('#000000', 0.25), 0.6);
      for (let x = x0 + (row % 2) * 6; x < x1; x += 12) line(ctx, x, y, x, y + 5, rgba('#000000', 0.2), 0.6);
    }
  } else if (kind === 'tile') {
    for (let y = y0; y < y1; y += 6) line(ctx, x0, y, x1, y, rgba('#000000', 0.18), 0.5);
    for (let x = x0; x < x1; x += 6) line(ctx, x, y0, x, y1, rgba('#000000', 0.18), 0.5);
  } else if (kind === 'panel') {
    for (let x = x0; x < x1; x += 30) line(ctx, x, y0, x, y1, rgba('#000000', 0.3), 0.8);
  }
  ctx.restore();
}

// Schmutz, Rost, Müll – Stärke amt 0..1
function grime(ctx, room, seed, amt) {
  if (amt <= 0.02) return;
  const r = rngf(seed), f = room.floor;
  ctx.save();
  ctx.globalAlpha = amt;
  // Rostschlieren an der Rückwand
  for (let i = 0; i < 14; i++) {
    const x = lerp(f.xbl, f.xbr, r()), y = lerp(room.wallTop, f.yb - 20, r());
    const g = ctx.createLinearGradient(0, y, 0, y + 30 + r() * 30);
    g.addColorStop(0, 'rgba(90,45,15,0.55)'); g.addColorStop(1, 'rgba(90,45,15,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, 1 + r() * 3, 60);
  }
  // Wasserflecken an der Wand
  for (let i = 0; i < 6; i++) {
    const x = lerp(f.xbl, f.xbr, r()), y = lerp(room.wallTop, f.yb, r());
    ellipse(ctx, x, y, 6 + r() * 14, 4 + r() * 10, 'rgba(20,25,10,0.35)');
  }
  // Ölflecken am Boden
  for (let i = 0; i < 9; i++) {
    const p = proj(room, r(), r());
    ellipse(ctx, p.x, p.y, (6 + r() * 16) * p.s, (2 + r() * 4) * p.s, 'rgba(8,8,6,0.55)');
    ellipse(ctx, p.x - 2 * p.s, p.y - 1, 3 * p.s, 0.8 * p.s, 'rgba(120,110,160,0.18)');
  }
  // Papier, Dosen, Kippen
  for (let i = 0; i < 16; i++) {
    const p = proj(room, r(), r() * 0.95 + 0.03);
    const t = r();
    if (t < 0.4) rect(ctx, p.x, p.y - 1, 4 * p.s, 2 * p.s, 'rgba(160,150,120,0.7)');
    else if (t < 0.65) rect(ctx, p.x, p.y - 2 * p.s, 2 * p.s, 3 * p.s, 'rgba(120,30,30,0.8)');
    else rect(ctx, p.x, p.y, 2, 1, 'rgba(220,210,190,0.6)');
  }
  // Spinnweben in den oberen Ecken
  const web = (x, y, dx) => {
    ctx.strokeStyle = 'rgba(200,200,200,0.25)'; ctx.lineWidth = 0.5;
    for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * (8 + a * 4), y + 22 - a * 5); ctx.stroke(); }
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + dx * k * 6, y); ctx.quadraticCurveTo(x + dx * k * 4, y + k * 4, x, y + k * 7); ctx.stroke(); }
  };
  web(f.xbl, room.wallTop, 1); web(f.xbr, room.wallTop, -1);
  ctx.restore();
}

// Industriefenster
function windowPane(ctx, x, y, w, h, seed, broken) {
  const r = rngf(seed);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#2a3550'); g.addColorStop(1, '#141a2a');
  rect(ctx, x, y, w, h, '#0c0f16');
  ctx.fillStyle = g; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  const cols = Math.max(2, Math.round(w / 10)), rows = Math.max(2, Math.round(h / 9));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const px = x + 1 + i * (w - 2) / cols, py = y + 1 + j * (h - 2) / rows;
    const t = r();
    if (broken && t < 0.18) rect(ctx, px + 1, py + 1, (w - 2) / cols - 1, (h - 2) / rows - 1, '#05060a');
    else if (t < 0.5) rect(ctx, px + 1, py + 1, (w - 2) / cols - 1, (h - 2) / rows - 1, 'rgba(160,180,220,0.08)');
  }
  for (let i = 0; i <= cols; i++) rect(ctx, x + i * (w - 1) / cols, y, 1, h, '#1b1d22');
  for (let j = 0; j <= rows; j++) rect(ctx, x, y + j * (h - 1) / rows, w, 1, '#1b1d22');
}

// Hängelampe
function hangLamp(ctx, x, y, cableTop, on, s) {
  s = s || 1;
  line(ctx, x, cableTop, x, y, '#111', 1);
  poly(ctx, [[x - 7 * s, y + 5 * s], [x + 7 * s, y + 5 * s], [x + 3 * s, y], [x - 3 * s, y]], '#2c3036');
  if (on) { ellipse(ctx, x, y + 5 * s, 5 * s, 1.6 * s, '#fff6d8'); }
  else ellipse(ctx, x, y + 5 * s, 5 * s, 1.4 * s, '#2a2a22');
}

// Leuchtstoffröhre an der Decke/Wand
function tubeLamp(ctx, x, y, w, on) {
  rect(ctx, x - w / 2 - 1, y - 1, w + 2, 4, '#222');
  rect(ctx, x - w / 2, y, w, 2, on ? '#eaf6ff' : '#3a3d40');
}

// Schild
function sign(ctx, x, y, w, h, bg, fg, txt, size) {
  rect(ctx, x - w / 2, y - h / 2, w, h, bg);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.5; ctx.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
  text(ctx, txt, x, y + 0.5, fg, size || 5);
}

// Tür in der Rückwand
function backDoor(ctx, room, u, w, h, col, label, open) {
  const p = proj(room, u, 0);
  const pw = w * p.s, ph = h * p.s;
  rect(ctx, p.x - pw / 2 - 2, p.y - ph - 2, pw + 4, ph + 2, '#15171a');
  rect(ctx, p.x - pw / 2, p.y - ph, pw, ph, open ? '#050505' : col);
  if (!open) {
    rect(ctx, p.x - pw / 2 + 2, p.y - ph + 3, pw - 4, ph * 0.35, shade(col, 1.12));
    rect(ctx, p.x + pw / 2 - 5, p.y - ph * 0.5, 3, 2, '#b0a070');
  }
  if (label) sign(ctx, p.x, p.y - ph - 8, Math.max(26, label.length * 3.6), 7, '#1d4a2a', '#d8f0d8', label, 4.6);
  return p;
}

// Tür in der Seitenwand
function sideDoor(ctx, room, side, v0, v1, h, col, label) {
  const u = side === 'L' ? 0 : 1;
  const a = proj(room, u, v0), b = proj(room, u, v1);
  const pts = [[a.x, a.y], [b.x, b.y], [b.x, b.y - h * b.s], [a.x, a.y - h * a.s]];
  poly(ctx, pts, col, '#0d0e10', 1.5);
  const m = proj(room, u, (v0 + v1) / 2);
  rect(ctx, m.x + (side === 'L' ? 2 : -4) * m.s, m.y - h * m.s * 0.5, 2 * m.s, 3 * m.s, '#a89a6a');
  if (label) {
    const t = proj(room, u, (v0 + v1) / 2);
    sign(ctx, t.x + (side === 'L' ? 6 : -6), t.y - h * t.s - 8, label.length * 3.6 + 4, 7, '#1d4a2a', '#d8f0d8', label, 4.6);
  }
}

// ------------------------------------------------------------
//  Figuren
// ------------------------------------------------------------
function person(ctx, x, y, s, look, dir, phase, moving, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  const sw = moving ? Math.sin(phase) : 0;
  const bob = moving ? Math.abs(Math.cos(phase)) * 0.8 : Math.sin(phase * 0.25) * 0.3;
  ellipse(ctx, x, y, 9 * s, 2.6 * s, 'rgba(0,0,0,0.5)');
  const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx * s, y + (dy - bob) * s, w * s, h * s); };
  const side = dir === 'L' || dir === 'R';
  const fl = dir === 'L' ? -1 : 1;
  const L = look;
  if (side) {
    // hinteres Bein / Arm
    R(-2 + sw * 3, -24, 4, 23, shade(L.legs, 0.7)); R(-2 + sw * 3 + (fl > 0 ? 0 : -1), -2, 5, 2, '#111');
    R(-1 - sw * 3 * -1, -42, 3, 15, shade(L.body, 0.7));
    R(-2 - sw * 3, -24, 4, 23, L.legs); R(-2 - sw * 3 + (fl > 0 ? 0 : -1), -2, 5, 2, '#141414');
    R(-4, -44, 8, 21, L.body);
    if (L.belt) R(-4, -26, 8, 2, L.belt);
    R(-1 + sw * 3 * -1 * -1, -42, 3, 15, shade(L.body, 0.88));
    R(-1 + sw * 3, -28, 3, 3, L.skin);
    // Kopf
    R(-3, -53, 7, 9, L.skin);
    R(-3, -54, 7, 3, L.hair); R(fl > 0 ? -3 : 2, -54, 2, 6, L.hair);
    R(fl > 0 ? 2 : -2, -50, 1, 1, '#111');
    if (L.cap) { R(-4, -56, 8, 3, L.cap); R(fl > 0 ? 3 : -6, -54, 4, 1, L.cap); }
    if (L.glasses) R(fl > 0 ? 1 : -3, -50, 3, 1, '#ddd');
    if (L.beard) R(fl > 0 ? 0 : -3, -47, 4, 2, L.beard);
  } else {
    const lA = moving ? Math.max(0, sw) * 2 : 0, lB = moving ? Math.max(0, -sw) * 2 : 0;
    R(-5, -24, 4, 23 - lA, L.legs); R(1, -24, 4, 23 - lB, L.legs);
    R(-5, -2 - lA, 4, 2, '#141414'); R(1, -2 - lB, 4, 2, '#141414');
    R(-6, -44, 12, 21, L.body);
    if (L.belt) R(-6, -26, 12, 2, L.belt);
    if (L.bib && dir === 'D') { R(-3, -42, 6, 7, shade(L.body, 1.15)); }
    R(-9, -43 + (moving ? sw : 0), 3, 15, shade(L.body, 0.85)); R(6, -43 - (moving ? sw : 0), 3, 15, shade(L.body, 0.85));
    R(-9, -29 + (moving ? sw : 0), 3, 3, L.skin); R(6, -29 - (moving ? sw : 0), 3, 3, L.skin);
    R(-4, -53, 8, 9, L.skin);
    if (dir === 'U') { R(-4, -54, 8, 8, L.hair); }
    else {
      R(-4, -54, 8, 3, L.hair); R(-4, -54, 1, 5, L.hair); R(3, -54, 1, 5, L.hair);
      R(-2, -50, 1, 1, '#111'); R(1, -50, 1, 1, '#111');
      if (L.glasses) { R(-3, -50, 3, 1, '#ccc'); R(1, -50, 3, 1, '#ccc'); }
      if (L.beard) R(-3, -47, 6, 2, L.beard);
    }
    if (L.cap) { R(-5, -56, 10, 3, L.cap); if (dir === 'D') R(-5, -54, 10, 1, shade(L.cap, 0.6)); }
    if (L.bun && dir !== 'D') R(-2, -57, 4, 3, L.hair);
    if (L.bun && dir === 'D') R(-2, -57, 4, 2, L.hair);
  }
  ctx.restore();
}

const LOOKS = {
  azubi: { body: '#2c4a86', legs: '#253f73', skin: '#e0b090', hair: '#4a2e1a', belt: '#1a1a1a', bib: true },
  schorsch: { body: '#4d5244', legs: '#3c4036', skin: '#c99878', hair: '#5a5a5a', cap: '#1f2a22', beard: '#5a5048', belt: '#222' },
  alois: { body: '#6a5a40', legs: '#3a3a40', skin: '#d8a888', hair: '#d8d8d0', glasses: true, beard: '#cfcfc8' },
  irmgard: { body: '#5a2a32', legs: '#2a2a33', skin: '#e2b49a', hair: '#9a9a9a', glasses: true, bun: true },
  brandl: { body: '#e8e8e0', legs: '#2c3c5c', skin: '#d6a07c', hair: '#3a3a3a', beard: '#3a3a3a' },
  kowalski: { body: '#050506', legs: '#050506', skin: '#0a0a0a', hair: '#050505', cap: '#050505' },
  arbeiter1: { body: '#2c4a86', legs: '#253f73', skin: '#c08868', hair: '#222', cap: '#a33' },
  arbeiter2: { body: '#3a5a3a', legs: '#2a3a2a', skin: '#e8c0a0', hair: '#c8a040' },
};

// ------------------------------------------------------------
//  Inventar-Icons (48×48)
// ------------------------------------------------------------
function drawIcon(ctx, id) {
  const c = ctx;
  c.clearRect(0, 0, 48, 48);
  const R = (x, y, w, h, col) => rect(c, x, y, w, h, col);
  switch (id) {
    case 'taschenlampe':
      R(10, 20, 26, 8, '#333'); R(34, 17, 6, 14, '#555'); R(39, 18, 2, 12, '#ffef9a'); R(16, 21, 4, 2, '#a22'); break;
    case 'schloss':
      c.strokeStyle = '#bbb'; c.lineWidth = 3; c.beginPath(); c.arc(24, 18, 8, Math.PI, 0); c.stroke();
      R(13, 18, 22, 18, '#c22'); R(22, 24, 4, 6, '#300'); R(15, 32, 18, 2, '#fff'); break;
    case 'verband':
      R(10, 14, 28, 22, '#eee'); R(21, 17, 6, 16, '#c11'); R(16, 22, 16, 6, '#c11'); break;
    case 'pruefer':
      R(8, 10, 9, 26, '#e6c000'); R(31, 10, 9, 26, '#e6c000'); R(10, 13, 5, 8, '#222'); R(11, 15, 3, 2, '#3c3');
      R(11.5, 36, 2, 7, '#bbb'); R(34.5, 36, 2, 7, '#bbb');
      c.strokeStyle = '#a00'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, 10); c.quadraticCurveTo(24, -2, 36, 10); c.stroke(); break;
    case 'windeisen':
      R(6, 22, 36, 4, '#777'); R(20, 18, 8, 12, '#555'); R(22, 21, 4, 6, '#222'); R(6, 21, 6, 6, '#a33'); R(36, 21, 6, 6, '#a33'); break;
    case 'gewindebohrer':
      for (let i = 0; i < 3; i++) { R(12 + i * 9, 8, 5, 26, '#9aa'); for (let k = 0; k < 6; k++) R(11 + i * 9, 22 + k * 2, 7, 1, '#677'); for (let k = 0; k <= i; k++) R(12 + i * 9, 11 + k * 3, 5, 1, '#222'); }
      R(9, 36, 30, 4, '#3a2a1a'); break;
    case 'gewindeschneider':
      R(4, 14, 40, 4, '#777'); R(4, 13, 6, 6, '#a33'); R(38, 13, 6, 6, '#a33'); R(21, 10, 6, 10, '#555');
      R(22, 20, 4, 22, '#9aa'); for (let k = 0; k < 6; k++) R(21, 30 + k * 2, 6, 1, '#677'); break;
    case 'schluessel':
      circle(c, 14, 24, 8, '#c9a227'); circle(c, 14, 24, 3, '#222'); R(20, 22, 22, 4, '#c9a227'); R(34, 26, 3, 5, '#c9a227'); R(39, 26, 3, 4, '#c9a227');
      R(6, 34, 18, 6, '#ddd'); text(c, 'S', 15, 37.5, '#222', 6); break;
    case 'ls':
      R(6, 10, 36, 30, '#3a3a3a'); for (let i = 0; i < 4; i++) { R(9 + i * 8, 14, 6, 22, '#eee'); R(10 + i * 8, 20, 4, 6, '#222'); R(10 + i * 8, 21, 4, 2, i === 2 ? '#3c3' : '#c33'); }
      break;
    case 'platte': case 'platte_gebohrt': case 'platte_fertig':
      poly(c, [[6, 30], [30, 38], [42, 26], [18, 18]], '#7d8288');
      poly(c, [[6, 30], [30, 38], [30, 41], [6, 33]], '#4e5257'); poly(c, [[30, 38], [42, 26], [42, 29], [30, 41]], '#5d6166');
      ellipse(c, 15, 26, 3, 1.6, '#222'); ellipse(c, 33, 30, 3, 1.6, '#222');
      if (id === 'platte') { ellipse(c, 24, 28, 3.4, 1.8, '#3a2a20'); line(c, 21, 27, 27, 29, '#aa6', 1); }
      else { ellipse(c, 24, 28, 3, 1.6, '#111'); if (id === 'platte_fertig') { c.strokeStyle = '#bbb'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(24, 28, 2.2, 1.1, 0, 0, Math.PI * 2); c.stroke(); } }
      break;
    case 'zahnraeder':
      R(6, 26, 36, 16, '#6a4a2a'); R(6, 26, 36, 3, '#7d5a35');
      for (const [x, y, r] of [[16, 22, 9], [32, 20, 11]]) {
        for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2; R(x + Math.cos(ang) * r - 1.5, y + Math.sin(ang) * r - 1.5, 3, 3, '#999'); }
        circle(c, x, y, r - 1, '#888'); circle(c, x, y, 2.5, '#333');
      }
      break;
    case 'schlauch':
      c.strokeStyle = '#2a6ad8'; c.lineWidth = 4; c.beginPath(); c.arc(24, 24, 13, 0, Math.PI * 1.7); c.stroke();
      c.beginPath(); c.arc(24, 24, 7, 0, Math.PI * 1.9); c.stroke(); R(34, 12, 6, 6, '#bbb'); break;
    case 'widerstaende':
      R(5, 8, 38, 34, '#384048'); for (let i = 0; i < 5; i++) { R(9, 12 + i * 6, 30, 1, '#bbb'); R(17, 10.5 + i * 6, 14, 4, '#d8c49a'); R(19, 10.5 + i * 6, 2, 4, ['#6b3b1a', '#c22', '#e6d200', '#839', '#24c'][i]); R(23, 10.5 + i * 6, 2, 4, '#6b3b1a'); }
      break;
    case 'schaltplan':
      R(8, 6, 32, 38, '#e6e0cc'); for (let i = 0; i < 6; i++) R(12, 12 + i * 5, 24, 1, '#447');
      R(14, 30, 8, 8, 'rgba(0,0,0,0)'); c.strokeStyle = '#a22'; c.strokeRect(14.5, 31.5, 8, 7); c.strokeRect(26.5, 31.5, 8, 7); break;
    default:
      R(12, 12, 24, 24, '#777');
  }
}

// Film-Körnung vorberechnen
const GRAIN = [];
function buildGrain() {
  for (let k = 0; k < 4; k++) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); const id = g.createImageData(W, H);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < 0.5 ? 18 : 0;
    }
    g.putImageData(id, 0, 0); GRAIN.push(cv);
  }
}
