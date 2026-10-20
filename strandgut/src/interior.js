import * as THREE from 'three';
import { colliders } from './colliders.js';
import { std, mesh, makeContainer, makeCrate } from './props.js';
import { rng } from './noise.js';

// Das Innere des Wracks: Laderaum + Maschinenraum (abseits der Insel aufgebaut)
export const IX = 2000, IZ = 0;
export const ROOM = { x0: IX - 6, x1: IX + 6, z0: IZ - 8, z1: IZ + 24, floor: 0, ceil: 5.4, wallZ: IZ + 12 };

function plateTexture(base, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const r = rng(seed);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
  for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.15)';
  for (let x = 6; x < 256; x += 64) for (let y = 6; y < 256; y += 64) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(110,55,20,${0.1 + r() * 0.2})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 20, 3 + r() * 10, r() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

export function buildInterior(scene) {
  const g = new THREE.Group(); g.position.set(IX, 0, IZ); scene.add(g);
  const I = { group: g };
  const W = 12, D = 32, H = ROOM.ceil;
  const floorT = plateTexture('#4a4d4f', 3); floorT.repeat.set(3, 8);
  const floor = mesh(new THREE.PlaneGeometry(W, D), std('#ffffff', { r: 0.55, m: 0.5, extra: { map: floorT } }), false);
  floor.rotation.x = -Math.PI / 2; floor.position.z = 8; g.add(floor);
  const wallT = plateTexture('#3b4e5c', 5); wallT.repeat.set(4, 2);
  const wallM = std('#ffffff', { r: 0.7, m: 0.3, extra: { map: wallT, side: THREE.DoubleSide } });
  const ceil = mesh(new THREE.PlaneGeometry(W, D), std('#55606a', { r: 0.9, extra: { map: wallT } }), false); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, 8); g.add(ceil);
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(D, H), wallM, false); w.rotation.y = -s * Math.PI / 2; w.position.set(s * W / 2, H / 2, 8); g.add(w); }
  const back = mesh(new THREE.PlaneGeometry(W, H), wallM, false); back.position.set(0, H / 2, 24); back.rotation.y = Math.PI; g.add(back);
  const front = mesh(new THREE.PlaneGeometry(W, H), wallM, false); front.position.set(0, H / 2, -8); g.add(front);
  // Spanten (Rippen) und Deckenträger
  const rib = std('#33434e', { r: 0.6, m: 0.4 });
  for (let z = -6; z <= 22; z += 4) {
    for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(0.25, H, 0.3), rib); r.position.set(s * (W / 2 - 0.12), H / 2, z); g.add(r); }
    const b = mesh(new THREE.BoxGeometry(W, 0.35, 0.3), rib); b.position.set(0, H - 0.18, z); g.add(b);
  }
  // Leck in der Vorderwand mit Tageslicht
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.4), new THREE.MeshBasicMaterial({ color: '#cfe8ff' }));
  hole.position.set(-2.5, 1.6, -7.98); g.add(hole);
  const beamGeo = new THREE.CylinderGeometry(1.0, 2.8, 9, 16, 1, true); beamGeo.rotateX(Math.PI / 2); beamGeo.translate(0, 0, 4.5);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: '#bfe2ff', transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.set(-2.5, 1.6, -8); beam.rotation.x = -0.18; g.add(beam);
  const day = new THREE.SpotLight(0xd8ecff, 30, 26, 0.6, 0.7, 1.2); day.position.set(-2.5, 1.8, -7.6); day.target.position.set(-1.5, 0, 2); g.add(day, day.target);
  I.dayLight = day;

  // Trennwand mit Schott bei z = 12
  const wz = 12;
  for (const s of [-1, 1]) {
    const part = mesh(new THREE.BoxGeometry(W / 2 - 1.2, H, 0.3), std('#3b4e5c', { r: 0.6, m: 0.4, extra: { map: wallT } }));
    part.position.set(s * (W / 4 + 0.6), H / 2, wz); g.add(part);
    colliders.box(IX + s * (W / 4 + 0.6), IZ + wz, (W / 2 - 1.2) / 2, 0.2, 0);
  }
  const lintel = mesh(new THREE.BoxGeometry(2.4, H - 2.4, 0.3), std('#3b4e5c', { m: 0.4, extra: { map: wallT } })); lintel.position.set(0, 2.4 + (H - 2.4) / 2, wz); g.add(lintel);
  const door = mesh(new THREE.BoxGeometry(2.4, 2.4, 0.18), std('#b8b23a', { r: 0.5, m: 0.5 })); door.position.set(0, 1.2, wz - 0.05); g.add(door);
  const stripes = mesh(new THREE.PlaneGeometry(2.3, 0.3), new THREE.MeshBasicMaterial({ map: hazardTexture() })); stripes.position.set(0, 0.25, -0.1); door.add(stripes);
  const cyl = mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 10), std('#c0c4c8', { m: 0.8, r: 0.3 })); cyl.position.set(1.45, 2.6, wz - 0.3); g.add(cyl);
  const pump = mesh(new THREE.BoxGeometry(0.4, 0.5, 0.3), std('#c0392b')); pump.position.set(2.2, 0.25, wz - 0.6); g.add(pump);
  const handle = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), std('#222')); handle.position.set(2.2, 0.7, wz - 0.6); handle.rotation.z = 0.5; g.add(handle);
  I.door = door; I.doorCollider = colliders.box(IX, IZ + wz, 1.2, 0.2, 0);
  I.openDoor = (instant) => { I.doorOpen = true; I.doorCollider.on = false; if (instant) door.position.y = 3.6; };
  I.doorOpen = false;

  // Ladung im Laderaum
  const c1 = makeContainer('#8b8f94', 'LND 4122', 21); c1.position.set(-3.4, 0, 2); c1.rotation.y = Math.PI / 2 + 0.05; g.add(c1);
  colliders.box(IX - 3.4, IZ + 2, 1.25, 3.05, Math.PI / 2 + 0.05 - Math.PI / 2);
  const c2 = makeContainer('#c9a227', 'LND 4130', 22); c2.position.set(3.6, 0, -4); c2.rotation.set(0, Math.PI / 2 - 0.2, 0.0); g.add(c2);
  c2.scale.set(0.6, 1, 1);
  colliders.box(IX + 3.6, IZ - 4, 1.25, 1.9, -0.2);
  const r = rng(9);
  for (let i = 0; i < 9; i++) {
    const cr = makeCrate(i % 2 ? '#8a6d45' : '#9b7b4f', 0.6 + r() * 0.5);
    const x = (r() - 0.5) * 9, z = -5 + r() * 15;
    if (Math.abs(x) < 1.3 || (x < -1.5 && z > -1.5 && z < 5.5)) continue;
    cr.position.set(x, cr.geometry.parameters.height / 2, z); cr.rotation.y = r() * 3; g.add(cr);
    colliders.circle(IX + x, IZ + z, 0.45);
  }
  // Pfützen
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.8 + r() * 1.2, 20), new THREE.MeshStandardMaterial({ color: '#0d1418', roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.8 }));
    p.rotation.x = -Math.PI / 2; p.position.set((r() - 0.5) * 8, 0.01, -6 + r() * 16); p.scale.y = 0.6; g.add(p);
  }

  // Maschinenraum
  const engine = new THREE.Group(); engine.position.set(0, 0, 18.5); g.add(engine);
  const block = mesh(new THREE.BoxGeometry(3, 2.2, 4), std('#5a6b4f', { r: 0.5, m: 0.5 })); block.position.y = 1.1; engine.add(block);
  for (let i = 0; i < 4; i++) { const cy = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 12), std('#6b7c5f', { m: 0.6 })); cy.position.set(0, 2.5, -1.4 + i * 0.95); engine.add(cy); }
  const exh = mesh(new THREE.CylinderGeometry(0.18, 0.18, 3, 10), std('#7a6a5a', { m: 0.6 })); exh.position.set(0.8, 3.6, 0); engine.add(exh);
  colliders.box(IX, IZ + 18.5, 1.6, 2.1, 0);
  const pipeM = std('#9a8a5a', { m: 0.7, r: 0.4 });
  for (let i = 0; i < 4; i++) { const pp = mesh(new THREE.CylinderGeometry(0.07, 0.07, 12, 8), pipeM); pp.rotation.x = Math.PI / 2; pp.position.set(-5.6 + i * 0.2, 4.2 - i * 0.25, 18); g.add(pp); }
  // Schreibtisch Henrik
  const desk = mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), std('#6b5236')); desk.position.set(3.8, 0.4, 20.5); g.add(desk);
  colliders.box(IX + 3.8, IZ + 20.5, 0.8, 0.4, 0);
  const lampD = new THREE.PointLight(0xffc27a, 6, 7, 1.6); lampD.position.set(3.8, 1.6, 20.3); g.add(lampD);
  const shelf = mesh(new THREE.BoxGeometry(0.5, 2.2, 2.2), std('#555')); shelf.position.set(-5.4, 1.1, 20); g.add(shelf);
  colliders.box(IX - 5.4, IZ + 20, 0.3, 1.1, 0);
  const panel = mesh(new THREE.BoxGeometry(1.4, 1.8, 0.4), std('#2c3e50')); panel.position.set(5.6, 1.4, 15.5); panel.rotation.y = -Math.PI / 2; g.add(panel);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? '#2ecc71' : '#e74c3c' })); l.position.set(5.38, 1.8 - Math.floor(i / 3) * 0.25, 15.1 + (i % 3) * 0.3); g.add(l); }

  // Notbeleuchtung
  I.lamps = [];
  for (const [x, z, col] of [[-5.5, -2, 0xff3a2a], [5.5, 6, 0xff3a2a], [0, 10.6, 0xffa040], [-5, 14, 0xff3a2a], [4, 23, 0xff5a3a], [3, 15, 0xffe0b0], [-3, 21, 0xffe0b0]]) {
    const l = new THREE.PointLight(col, 6, 22, 1.2); l.position.set(x, 4.2, z); g.add(l);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: col })); b.position.copy(l.position); g.add(b);
    I.lamps.push(l);
  }
  // Tropfendes Wasser
  const drops = [];
  for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshBasicMaterial({ color: '#9fd3ff' })); d.userData = { x: (r() - 0.5) * 9, z: -6 + r() * 26, y: H, v: 0, wait: r() * 3 }; g.add(d); drops.push(d); }
  I.update = (t, dt) => {
    I.lamps.forEach((l, i) => { l.intensity = 6 + Math.sin(t * (2 + i) + i) * 0.6 + (Math.random() < 0.004 ? -4 : 0); });
    if (I.doorOpen && door.position.y < 3.6) door.position.y = Math.min(3.6, door.position.y + dt * 0.8);
    for (const d of drops) {
      const u = d.userData;
      if (u.wait > 0) { u.wait -= dt; d.visible = false; continue; }
      d.visible = true; u.v += 9.8 * dt; u.y -= u.v * dt;
      if (u.y < 0) { u.y = H - 0.3; u.v = 0; u.wait = 1 + Math.random() * 3; }
      d.position.set(u.x, u.y, u.z);
    }
  };
  I.group.visible = false;
  return I;
}

function hazardTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d');
  g.fillStyle = '#f1c40f'; g.fillRect(0, 0, 256, 32); g.fillStyle = '#111';
  for (let x = -32; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, 32); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
