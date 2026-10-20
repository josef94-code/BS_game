import * as THREE from 'three';
import { heightAt, normalAt, SPOTS } from './terrain.js';
import { colliders } from './colliders.js';
import { rng, noise2 } from './noise.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0, ...o.extra });
function mesh(geo, mat, shadow = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; }

// Rost-/Schmutz-Textur für Container und Schiffsrumpf (prozedural)
function grimeTexture(base, ribs = true, seed = 1) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 128);
  if (ribs) for (let x = 0; x < 256; x += 8) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x, 0, 2, 128); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 3, 0, 2, 128); }
  const r = rng(seed);
  for (let i = 0; i < 140; i++) {
    const x = r() * 256, y = r() * 128, w = 1 + r() * 4, h = 6 + r() * 40;
    g.fillStyle = `rgba(${90 + r() * 50},${45 + r() * 20},${20},${0.08 + r() * 0.22})`;
    g.fillRect(x, y, w, h);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(60,40,25,${r() * 0.25})`; g.beginPath(); g.arc(r() * 256, r() * 128, 2 + r() * 10, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function labelTexture(text, sub, bg = 'rgba(0,0,0,0)', fg = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.fillStyle = fg; g.font = 'bold 64px system-ui, sans-serif'; g.fillText(text, 16, 70);
  if (sub) { g.font = '28px system-ui, sans-serif'; g.fillText(sub, 18, 112); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Schiffscontainer (20 Fuß), optional mit offener Tür
export function makeContainer(color, label, seed = 1) {
  const g = new THREE.Group();
  const L = 6.06, W = 2.44, H = 2.59;
  const tex = grimeTexture(color, true, seed); tex.repeat.set(2, 1);
  const mat = std('#ffffff', { r: 0.6, m: 0.3, extra: { map: tex } });
  const body = mesh(new THREE.BoxGeometry(L, H, W), mat); body.position.y = H / 2; g.add(body);
  // Eckbeschläge
  const cm = std('#2f2f2f', { r: 0.5, m: 0.5 });
  for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [-1, 1]) {
    const k = mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), cm, false); k.position.set(sx * (L / 2 - 0.09), sy * (H - 0.06) + 0.06 * (1 - sy) * 0 + (sy ? 0 : 0.06), sz * (W / 2 - 0.09)); g.add(k);
  }
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: labelTexture(label, 'MV LINDAU · LOGISTIK', 'rgba(0,0,0,0)'), transparent: true }));
  lab.position.set(0, H - 0.6, W / 2 + 0.01); g.add(lab);
  const lab2 = lab.clone(); lab2.rotation.y = Math.PI; lab2.position.z = -W / 2 - 0.01; g.add(lab2);
  // Türflügel am Ende (+x)
  const doorMat = std('#ffffff', { r: 0.6, m: 0.3, extra: { map: tex } });
  const doors = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(L / 2 + 0.02, 0, s * W / 2); g.add(pivot);
    const d = mesh(new THREE.BoxGeometry(0.06, H - 0.1, W / 2), doorMat); d.position.set(0, H / 2, -s * W / 4); pivot.add(d);
    const bar = mesh(new THREE.CylinderGeometry(0.025, 0.025, H - 0.3, 6), cm, false); bar.position.set(0.05, H / 2, -s * W / 4 + s * 0.2); pivot.add(bar);
    doors.push({ pivot, s });
  }
  g.userData.open = (t) => { for (const d of doors) d.pivot.rotation.y = -d.s * t * 1.9; };
  // dunkles Inneres sichtbar bei offener Tür
  const inner = mesh(new THREE.PlaneGeometry(W - 0.1, H - 0.1), std('#151311'), false); inner.rotation.y = Math.PI / 2; inner.position.set(L / 2 - 0.02, H / 2, 0); g.add(inner);
  g.userData.size = { L, W, H };
  return g;
}

export function placeOnGround(obj, x, z, rot = 0, tilt = true, sink = 0.15) {
  const h = heightAt(x, z);
  obj.position.set(x, h - sink, z);
  obj.rotation.y = rot;
  if (tilt) { const n = normalAt(x, z); obj.rotation.x = n.z * 0.6; obj.rotation.z = -n.x * 0.6; }
  return obj;
}

// Kiste
export function makeCrate(color = '#9b7b4f', size = 0.8) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3;
  for (let y = 0; y < 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  g.lineWidth = 10; g.strokeStyle = 'rgba(60,40,20,0.6)'; g.strokeRect(5, 5, 118, 118);
  g.beginPath(); g.moveTo(8, 8); g.lineTo(120, 120); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.BoxGeometry(size, size, size), std('#ffffff', { r: 0.9, extra: { map: t } }));
}

// Frachtschiff-Wrack: Rumpf, Aufbau, Container an Deck, Leck auf der Landseite
export function makeWreck() {
  const g = new THREE.Group();
  const len = 52, wid = 13, hgt = 9;
  // Rumpfquerschnitt
  const shape = new THREE.Shape();
  shape.moveTo(-wid / 2, hgt); shape.lineTo(-wid / 2, 2.2); shape.quadraticCurveTo(-wid / 2, 0, -wid / 2 + 2.2, 0);
  shape.lineTo(wid / 2 - 2.2, 0); shape.quadraticCurveTo(wid / 2, 0, wid / 2, 2.2); shape.lineTo(wid / 2, hgt);
  shape.lineTo(wid / 2 - 0.35, hgt); shape.lineTo(wid / 2 - 0.35, 2.2); shape.lineTo(-wid / 2 + 0.35, 2.2); shape.lineTo(-wid / 2 + 0.35, hgt);
  const hull = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, steps: 24 });
  hull.translate(0, 0, -len / 2);
  // Bug zuspitzen
  const p = hull.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const red = new THREE.Color('#7a2a22'), blue = new THREE.Color('#1f3346'), rust = new THREE.Color('#7b4a2a');
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = (z + len / 2) / len;
    if (f > 0.72) { const t = (f - 0.72) / 0.28; x *= 1 - t * t * 0.95; y += t * t * 1.5; }
    p.setXYZ(i, x, y, z);
    const c = (y < 3.4 ? red : blue).clone();
    const n = noise2(x * 0.5 + z * 0.3, y * 0.8);
    c.lerp(rust, Math.max(0, n) * 0.6 + (y > 3.2 && y < 3.6 ? 0.2 : 0));
    if (y > 3.25 && y < 3.55) c.set('#d8d8d0');
    colors.set([c.r, c.g, c.b], i * 3);
  }
  hull.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  hull.computeVertexNormals();
  const hullM = mesh(hull, std('#ffffff', { r: 0.65, m: 0.35, extra: { vertexColors: true, side: THREE.DoubleSide } }));
  g.add(hullM);
  // Deck
  const deck = mesh(new THREE.BoxGeometry(wid - 0.8, 0.3, len * 0.72), std('#3d3a35', { r: 0.9 }));
  deck.position.set(0, hgt - 0.6, -len * 0.14); g.add(deck);
  // Brückenaufbau am Heck
  const white = std('#e7e4dc', { r: 0.6 });
  const sup = mesh(new THREE.BoxGeometry(wid - 1.5, 7, 7), white); sup.position.set(0, hgt + 3.2, -len / 2 + 4.5); g.add(sup);
  const bridge = mesh(new THREE.BoxGeometry(wid + 1, 2.2, 4.5), white); bridge.position.set(0, hgt + 7.6, -len / 2 + 4.8); g.add(bridge);
  const win = mesh(new THREE.BoxGeometry(wid + 1.02, 0.8, 0.1), std('#1a2630', { r: 0.1, m: 0.6 })); win.position.set(0, hgt + 7.9, -len / 2 + 7.06); g.add(win);
  const funnel = mesh(new THREE.CylinderGeometry(1.1, 1.4, 4, 12), std('#d8a52b')); funnel.position.set(0, hgt + 8.6, -len / 2 + 1.8); g.add(funnel);
  const fband = mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.8, 12), std('#202020')); fband.position.set(0, hgt + 10.2, -len / 2 + 1.8); g.add(fband);
  const mast = mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 6), std('#d0d0c8')); mast.position.set(0, hgt + 11.5, -len / 2 + 5); g.add(mast);
  // Container an Deck, teilweise verrutscht
  const cols = ['#b5452c', '#2f6aa3', '#3d8a4f', '#c9a227', '#8b8f94', '#a33a64'];
  const r = rng(77);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) for (let lay = 0; lay < 2; lay++) {
    if (r() < 0.25 || (lay === 1 && r() < 0.4)) continue;
    const c = makeContainer(cols[(row + col * 2 + lay) % cols.length], 'LND ' + (4100 + row * 10 + col), row * 7 + col + lay);
    c.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.2 * lay;
    c.position.set((col - 1) * 3.3 + (r() - 0.5) * 0.4 * lay, hgt - 0.45 + lay * 2.6, -len * 0.05 + row * 6.5 - 8);
    if (lay === 1 && r() < 0.5) c.rotation.z = (r() - 0.5) * 0.3;
    g.add(c);
  }
  // Leck auf der Landseite (-x): dunkle Öffnung + verbogene Platten
  const hole = mesh(new THREE.PlaneGeometry(3.6, 3.4), new THREE.MeshBasicMaterial({ color: '#050505' }), false);
  hole.rotation.y = -Math.PI / 2; hole.position.set(-wid / 2 - 0.03, 3.1, 4); g.add(hole);
  for (let i = 0; i < 5; i++) {
    const pl = mesh(new THREE.BoxGeometry(0.08, 1.2 + r(), 0.9), std('#2a3846', { r: 0.6, m: 0.4 }));
    pl.position.set(-wid / 2 - 0.3 - r() * 0.5, 2 + r() * 2.5, 2.3 + i * 0.8);
    pl.rotation.set(r() - 0.5, r() * 0.8, r() - 0.5); g.add(pl);
  }
  // Rampe (abgerissene Lukenabdeckung) vom Strand zum Leck
  const ramp = mesh(new THREE.BoxGeometry(7.5, 0.25, 2.6), std('#4b5560', { r: 0.6, m: 0.4 }));
  ramp.position.set(-wid / 2 - 3.4, 0.9 + 0.95, 4); ramp.rotation.z = 0.36; g.add(ramp);
  // Positionslampe (rot blinkend)
  const lamp = new THREE.PointLight(0xff3020, 0, 18, 1.6); lamp.position.set(-wid / 2 + 0.5, hgt + 8.8, -len / 2 + 6.5); g.add(lamp);
  g.userData.lamp = lamp;
  g.userData.dims = { len, wid, hgt };
  return g;
}

// Unterstand aus Plane und Treibholz
export function makeShelter() {
  const g = new THREE.Group();
  const wood = std('#8a6a48', { r: 0.95 });
  const poles = [[-1.6, -1.2, 2.2], [1.6, -1.2, 2.2], [-1.6, 1.2, 1.2], [1.6, 1.2, 1.2]];
  for (const [x, z, h] of poles) { const p = mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 6), wood); p.position.set(x, h / 2, z); g.add(p); }
  const ridge = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.6, 6), wood); ridge.rotation.z = Math.PI / 2; ridge.position.set(0, 2.2, -1.2); g.add(ridge);
  const tarpGeo = new THREE.PlaneGeometry(3.8, 2.8, 8, 6);
  const tp = tarpGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i); tp.setZ(i, Math.sin((x / 3.8 + 0.5) * Math.PI) * 0.06 * (y / 1.4) - Math.abs(y) * 0.02); }
  tarpGeo.computeVertexNormals();
  const tarp = mesh(tarpGeo, std('#2f7fb8', { r: 0.7, extra: { side: THREE.DoubleSide } }));
  tarp.position.set(0, 1.72, 0); tarp.rotation.x = -Math.PI / 2 + 0.38; g.add(tarp);
  // Schlafmatte
  const mat = mesh(new THREE.BoxGeometry(0.8, 0.06, 1.9), std('#5a6b3b')); mat.position.set(0.6, 0.05, 0); mat.rotation.y = Math.PI / 2; g.add(mat);
  const bag = mesh(new THREE.CapsuleGeometry(0.25, 1.1, 4, 8), std('#8b3a2f')); bag.rotation.z = Math.PI / 2; bag.position.set(0.4, 0.2, -0.2); g.add(bag);
  return g;
}

// Feuerstelle mit Flammen und Licht
export function makeFire() {
  const g = new THREE.Group();
  const stones = std('#6a665f', { r: 0.95 });
  for (let i = 0; i < 9; i++) {
    const s = mesh(new THREE.DodecahedronGeometry(0.18, 0), stones); const a = i / 9 * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55); s.scale.y = 0.7; g.add(s);
  }
  const logs = std('#5a3e27');
  for (let i = 0; i < 4; i++) { const l = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 6), logs); l.rotation.set(Math.PI / 2 - 0.4, i * Math.PI / 2, 0); l.position.y = 0.2; g.add(l); }
  const flames = new THREE.Group(); g.add(flames);
  const fm = [];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.015, 0.7 - i * 0.06, 7), new THREE.MeshBasicMaterial({ color: i < 2 ? '#ffb43a' : '#ff6a1a', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    f.position.set((i % 3 - 1) * 0.1, 0.45, ((i * 7) % 3 - 1) * 0.1); flames.add(f); fm.push(f);
  }
  const light = new THREE.PointLight(0xff8a3a, 0, 14, 1.5); light.position.y = 0.8; g.add(light);
  g.userData.flames = flames; g.userData.light = light; g.userData.fm = fm;
  g.userData.lit = false;
  g.userData.update = (t, dt) => {
    flames.visible = g.userData.lit;
    if (!g.userData.lit) { light.intensity = 0; return; }
    fm.forEach((f, i) => { f.scale.set(1, 0.8 + Math.sin(t * (9 + i) + i) * 0.25, 1); f.rotation.y = t * (1 + i * 0.3); });
    light.intensity = 9 + Math.sin(t * 17) * 1.5 + Math.sin(t * 7.3) * 1.2;
  };
  return g;
}

// Solarmodul auf Gestell
export function makeSolarPanel() {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 128; c.height = 192; const x = c.getContext('2d');
  x.fillStyle = '#0d1a33'; x.fillRect(0, 0, 128, 192);
  x.strokeStyle = '#6a7fa8'; x.lineWidth = 1;
  for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(i * 21.3, 0); x.lineTo(i * 21.3, 192); x.stroke(); }
  for (let j = 0; j <= 10; j++) { x.beginPath(); x.moveTo(0, j * 19.2); x.lineTo(128, j * 19.2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const frame = std('#b8bcc2', { m: 0.7, r: 0.3 });
  const panel = mesh(new THREE.BoxGeometry(1.0, 0.04, 1.6), [frame, frame, new THREE.MeshStandardMaterial({ map: t, roughness: 0.15, metalness: 0.5 }), std('#555555'), frame, frame]);
  panel.rotation.x = -0.35; panel.position.y = 0.85; g.add(panel);
  const leg = std('#9aa0a6', { m: 0.6, r: 0.4 });
  for (const [px, pz, h] of [[-0.4, 0.55, 0.6], [0.4, 0.55, 0.6], [-0.4, -0.5, 1.1], [0.4, -0.5, 1.1]]) { const l = mesh(new THREE.BoxGeometry(0.05, h, 0.05), leg); l.position.set(px, h / 2, pz); g.add(l); }
  return g;
}

// Kleinwindanlage
export function makeWindTurbine() {
  const g = new THREE.Group();
  const m = std('#e9ecef', { r: 0.4, m: 0.2 });
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.5, 8), m); pole.position.y = 2.75; g.add(pole);
  const head = new THREE.Group(); head.position.y = 5.6; g.add(head);
  const nac = mesh(new THREE.CapsuleGeometry(0.16, 0.5, 4, 8), m); nac.rotation.x = Math.PI / 2; head.add(nac);
  const tail = mesh(new THREE.BoxGeometry(0.02, 0.5, 0.8), m); tail.position.set(0, 0.1, -0.8); head.add(tail);
  const rotor = new THREE.Group(); rotor.position.z = 0.42; head.add(rotor);
  for (let i = 0; i < 3; i++) {
    const b = mesh(new THREE.BoxGeometry(0.14, 1.3, 0.03), m); b.position.y = 0.68; const piv = new THREE.Group(); piv.rotation.z = i * Math.PI * 2 / 3; piv.add(b); b.rotation.y = 0.3; rotor.add(piv);
  }
  g.userData.rotor = rotor;
  // Abspannseile
  return g;
}

// Batteriekasten mit Laderegler
export function makePowerStation() {
  const g = new THREE.Group();
  const box = mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), std('#2b3d55', { r: 0.5, m: 0.3 })); box.position.y = 0.3; g.add(box);
  const lid = mesh(new THREE.BoxGeometry(0.92, 0.05, 0.62), std('#e0b62f')); lid.position.y = 0.6; g.add(lid);
  const reg = mesh(new THREE.BoxGeometry(0.45, 0.6, 0.12), std('#1a1a1a')); reg.position.set(0, 1.1, -0.25); g.add(reg);
  const post = mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), std('#8a6a48')); post.position.set(0, 0.7, -0.35); g.add(post);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), new THREE.MeshBasicMaterial({ color: '#1d4a2c' }));
  disp.position.set(0, 1.2, -0.188); g.add(disp);
  g.userData.display = disp;
  return g;
}

// Lichterkette am Lager
export function makeLightString(points) {
  const g = new THREE.Group();
  const bulbs = [];
  const bm = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffcf6a', emissiveIntensity: 0 });
  const curve = new THREE.CatmullRomCurve3(points);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.01, 4), std('#222')); g.add(wire);
  for (let i = 0; i <= 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), bm); b.position.copy(curve.getPoint(i / 14)); b.position.y -= 0.05; g.add(b); bulbs.push(b); }
  const light = new THREE.PointLight(0xffd27a, 0, 16, 1.5); light.position.copy(curve.getPoint(0.5)); light.position.y -= 0.3; g.add(light);
  g.userData.set = (on) => { bm.emissiveIntensity = on ? 2.2 : 0; light.intensity = on ? 7 : 0; };
  return g;
}

// Das Solarboot – wächst mit dem Baufortschritt
export function makeBoat() {
  const g = new THREE.Group();
  const parts = {};
  const pont = std('#f2f2ee', { r: 0.4 });
  const hull = new THREE.Group();
  for (const s of [-1, 1]) {
    const p = mesh(new THREE.CapsuleGeometry(0.42, 4.6, 6, 12), pont); p.rotation.x = Math.PI / 2; p.position.set(s * 1.05, 0.25, 0); hull.add(p);
    const stripe = mesh(new THREE.CylinderGeometry(0.425, 0.425, 4.2, 12, 1, true), std('#d0402b')); stripe.rotation.x = Math.PI / 2; stripe.position.set(s * 1.05, 0.25, 0); stripe.scale.set(1, 1, 0.3); hull.add(stripe);
  }
  const alu = std('#c4c9ce', { m: 0.8, r: 0.35 });
  for (const z of [-1.8, -0.6, 0.6, 1.8]) { const b = mesh(new THREE.BoxGeometry(2.6, 0.08, 0.08), alu); b.position.set(0, 0.72, z); hull.add(b); }
  for (const x of [-1.05, 1.05]) { const b = mesh(new THREE.BoxGeometry(0.08, 0.08, 4.6), alu); b.position.set(x, 0.72, 0); hull.add(b); }
  const deck = mesh(new THREE.BoxGeometry(2.0, 0.06, 3.6), std('#8a6a48', { r: 0.95 })); deck.position.y = 0.78; hull.add(deck);
  g.add(hull); parts.hull = hull;

  const drive = new THREE.Group();
  const motor = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 12), std('#2d5aa0', { m: 0.4 })); motor.rotation.x = Math.PI / 2; motor.position.set(0, 1.0, -2.0); drive.add(motor);
  const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), alu); shaft.position.set(0, 0.35, -2.25); shaft.rotation.x = 0.4; drive.add(shaft);
  const prop = new THREE.Group(); prop.position.set(0, -0.2, -2.5); drive.add(prop);
  for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(0.06, 0.32, 0.02), std('#c99a3a', { m: 0.8, r: 0.3 })); b.position.y = 0.15; const pv = new THREE.Group(); pv.rotation.z = i * 2.09; pv.add(b); b.rotation.y = 0.5; prop.add(pv); }
  const belt = mesh(new THREE.TorusGeometry(0.18, 0.02, 4, 16), std('#1a1a1a')); belt.rotation.y = Math.PI / 2; belt.position.set(0.25, 0.9, -2.1); belt.scale.set(1, 1.8, 1); drive.add(belt);
  g.add(drive); parts.drive = drive; parts.prop = prop;

  const energy = new THREE.Group();
  const batt = mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), std('#2b3d55')); batt.position.set(0, 1.0, -0.9); energy.add(batt);
  const roofPosts = std('#c4c9ce', { m: 0.8, r: 0.35 });
  for (const [x, z] of [[-0.95, -1.2], [0.95, -1.2], [-0.95, 1.4], [0.95, 1.4]]) { const p = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), roofPosts); p.position.set(x, 1.55, z); energy.add(p); }
  for (let i = 0; i < 4; i++) {
    const sp = makeSolarPanel().children[0].clone(); sp.rotation.x = 0; sp.position.set(i % 2 ? 0.5 : -0.5, 2.32, i < 2 ? -0.6 : 0.95); energy.add(sp);
  }
  g.add(energy); parts.energy = energy;

  const control = new THREE.Group();
  const seat = mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), std('#3a3631')); seat.position.set(0, 1.0, 0.2); control.add(seat);
  const desk = mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), std('#e0b62f')); desk.position.set(0, 1.15, 1.0); control.add(desk);
  const lever = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), std('#c22')); lever.position.set(0.15, 1.6, 1.0); control.add(lever);
  const flag = mesh(new THREE.PlaneGeometry(0.5, 0.32), std('#ff6a00', { extra: { side: THREE.DoubleSide } })); flag.position.set(-0.95, 2.6, 1.4); control.add(flag);
  g.add(control); parts.control = control;

  g.userData.parts = parts;
  return g;
}

// Glitzernder Marker für einsammelbare Gegenstände
export function makeSparkle() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.2, 'rgba(255,230,140,0.7)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(0.7);
  return s;
}

export { std, mesh, grimeTexture, labelTexture };
