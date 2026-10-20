import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { heightAt, normalAt, SPOTS } from './terrain.js';
import { rng, noise2, smoothstep } from './noise.js';
import { colliders } from './colliders.js';

export const windUniforms = { uTime: { value: 0 }, uWind: { value: 0.3 } };

// Wind-Animation in Standard-Materialien einschleusen (Stärke wächst mit der Höhe über dem Stammfuß)
function windMaterial(params, strength = 1, heightScale = 6) {
  const m = new THREE.MeshStandardMaterial(params);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = windUniforms.uTime; sh.uniforms.uWind = windUniforms.uWind;
    sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec4 wp = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wp = instanceMatrix * wp;
      #endif
      float hgt = max(transformed.y, 0.0) / ${heightScale.toFixed(1)};
      float ph = wp.x * 0.11 + wp.z * 0.07;
      float sway = (sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.9 + ph * 1.7) * 0.25) * (0.25 + uWind * 1.6);
      transformed.x += sway * hgt * hgt * ${(0.35 * strength).toFixed(3)};
      transformed.z += sway * hgt * hgt * ${(0.2 * strength).toFixed(3)};
    `);
  };
  return m;
}

function colorize(geo, color) {
  const c = new THREE.Color(color), n = geo.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

function palmGeometry(seed) {
  const r = rng(seed);
  const height = 6 + r() * 3.5, lean = 0.8 + r() * 1.6;
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector3(Math.sin(t * 1.4) * lean, t * height, 0)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.TubeGeometry(curve, 14, 0.2, 7, false);
  // Ringe am Stamm: Farbe abwechselnd
  const tp = trunk.attributes.position, tc = new Float32Array(tp.count * 3);
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i), band = (Math.sin(y * 9) * 0.5 + 0.5);
    const c = new THREE.Color('#a8865e').lerp(new THREE.Color('#7f6446'), band * 0.6);
    tc.set([c.r, c.g, c.b], i * 3);
    // Stamm unten dicker
    const ty = Math.min(1, Math.max(0, y / height)), cx = curve.getPoint(ty).x;
    const k = 1 + (1 - ty) * 0.5; tp.setX(i, (tp.getX(i) - cx) * k + cx);
    tp.setZ(i, tp.getZ(i) * k);
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  trunk.deleteAttribute('uv');
  const top = curve.getPoint(1);
  const parts = [trunk];
  const fronds = 9;
  for (let f = 0; f < fronds; f++) {
    const len = 3.2 + r() * 1.3, segs = 9;
    const g = new THREE.PlaneGeometry(1, len, 2, segs);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const v = (p.getY(i) / len) + 0.5; // 0 am Ansatz, 1 an der Spitze
      const w = Math.sin(Math.min(v * 1.15, 1) * Math.PI) * 0.75 * (p.getX(i) === 0 ? 0 : Math.sign(p.getX(i)));
      const droop = v * v * 2.2;
      const x = w, y = v * len * 0.35 - droop + (p.getX(i) === 0 ? 0.05 : -0.08 * Math.abs(w)), z = v * len;
      p.setXYZ(i, x, y, z);
      const c = new THREE.Color('#3f7d2c').lerp(new THREE.Color('#8bbf4a'), v * 0.7 + (p.getX(i) === 0 ? 0.2 : 0));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.deleteAttribute('uv');
    g.rotateX(-(0.15 + r() * 0.35));
    g.rotateY((f / fronds) * Math.PI * 2 + r() * 0.3);
    g.translate(top.x, top.y, top.z);
    parts.push(g);
  }
  // Kokosnüsse
  for (let k = 0; k < 3; k++) {
    const s = new THREE.SphereGeometry(0.17, 6, 5);
    colorize(s, '#5a3f22'); s.deleteAttribute('uv');
    s.translate(top.x + Math.cos(k * 2.1) * 0.25, top.y - 0.25, top.z + Math.sin(k * 2.1) * 0.25);
    parts.push(s);
  }
  for (const pgeo of parts) if (pgeo.index) continue;
  const merged = mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g));
  merged.computeVertexNormals();
  return { geo: merged, height };
}

function treeGeometry(seed) {
  const r = rng(seed);
  const h = 4 + r() * 3;
  const trunk = new THREE.CylinderGeometry(0.22, 0.38, h, 7);
  trunk.translate(0, h / 2, 0); colorize(trunk, '#5e4733'); trunk.deleteAttribute('uv');
  const parts = [trunk.toNonIndexed()];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.IcosahedronGeometry(1.3 + r() * 1.1, 1);
    const p = s.attributes.position;
    for (let k = 0; k < p.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(p, k); v.multiplyScalar(1 + noise2(v.x * 2 + seed, v.z * 2) * 0.18); p.setXYZ(k, v.x, v.y * 0.75, v.z); }
    s.translate((r() - 0.5) * 2.6, h + (r() - 0.2) * 1.6, (r() - 0.5) * 2.6);
    colorize(s, new THREE.Color('#3d6e2a').lerp(new THREE.Color('#5f9a3a'), r()));
    s.deleteAttribute('uv');
    parts.push(s.index ? s.toNonIndexed() : s);
  }
  const m = mergeGeometries(parts); m.computeVertexNormals();
  return { geo: m, height: h };
}

function rockGeometry(seed) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const n = noise2(v.x * 1.7 + seed, v.z * 1.7 + v.y) * 0.32 + noise2(v.x * 4, v.y * 4 + seed) * 0.08;
    v.multiplyScalar(1 + n); v.y *= 0.65;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  const ng = g.index ? g.toNonIndexed() : g; ng.computeVertexNormals();
  const c = new THREE.Color('#8a857c').lerp(new THREE.Color('#6d6a63'), (seed % 5) / 5);
  colorize(ng, c);
  return ng;
}

function bushGeometry(seed) {
  const r = rng(seed); const parts = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.IcosahedronGeometry(0.55 + r() * 0.4, 0);
    s.translate((r() - 0.5) * 1.3, 0.35 + r() * 0.4, (r() - 0.5) * 1.3);
    colorize(s, new THREE.Color('#3e7230').lerp(new THREE.Color('#6aa23f'), r()));
    s.deleteAttribute('uv');
    parts.push(s.index ? s.toNonIndexed() : s);
  }
  // Blüten
  for (let i = 0; i < 4; i++) {
    const f = new THREE.OctahedronGeometry(0.09, 0);
    f.translate((r() - 0.5) * 1.4, 0.7 + r() * 0.4, (r() - 0.5) * 1.4);
    colorize(f, ['#e84a6a', '#f2c84b', '#f7f2e8'][i % 3]); f.deleteAttribute('uv');
    parts.push(f.index ? f.toNonIndexed() : f);
  }
  const m = mergeGeometries(parts); m.computeVertexNormals(); return m;
}

function grassClump() {
  const parts = [];
  const r = rng(7);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BufferGeometry();
    const h = 0.35 + r() * 0.35, w = 0.05, a = r() * Math.PI, ox = (r() - 0.5) * 0.35, oz = (r() - 0.5) * 0.35;
    const ca = Math.cos(a) * w, sa = Math.sin(a) * w, bend = (r() - 0.5) * 0.2;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([ox - ca, 0, oz - sa, ox + ca, 0, oz + sa, ox + bend, h, oz + bend * 0.5]), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array([0.22, 0.38, 0.13, 0.22, 0.38, 0.13, 0.55, 0.75, 0.3]), 3));
    parts.push(g);
  }
  const m = mergeGeometries(parts); m.computeVertexNormals();
  // Normale nach oben: wirkt weicher
  const n = m.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return m;
}

const keepClear = [
  { ...SPOTS.camp, r: 13 }, { ...SPOTS.slip, r: 10 }, { ...SPOTS.start, r: 6 },
  { ...SPOTS.contA, r: 8 }, { ...SPOTS.contB, r: 8 }, { ...SPOTS.contC, r: 8 },
  { x: SPOTS.hill.x + 6, z: SPOTS.hill.z + 4, r: 9 }, { ...SPOTS.spring, r: 6 }, { ...SPOTS.lagoon, r: 7 },
  { x: SPOTS.camp.x + 14, z: SPOTS.camp.z - 2, r: 7 },
];
const isClear = (x, z, pad = 0) => keepClear.every(k => Math.hypot(x - k.x, z - k.z) > k.r + pad);

export function buildVegetation(scene, quality) {
  const r = rng(2024);
  const dummy = new THREE.Object3D();
  const q = { low: 0.5, medium: 0.8, high: 1 }[quality];

  // Palmen
  const palmVariants = [palmGeometry(11), palmGeometry(23), palmGeometry(37)];
  const palmMat = windMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }, 1, 9);
  const palmSpots = [[], [], []];
  let tries = 0;
  while (palmSpots.flat().length < 170 * q && tries++ < 20000) {
    const x = (r() - 0.5) * 240, z = (r() - 0.5) * 240, h = heightAt(x, z);
    if (h < 1.1 || h > 12) continue;
    const coastBias = h < 4 ? 1 : 0.35;
    if (r() > coastBias) continue;
    if (!isClear(x, z, 2) || normalAt(x, z).y < 0.82) continue;
    palmSpots[(r() * 3) | 0].push([x, h, z, r() * Math.PI * 2, 0.85 + r() * 0.35]);
  }
  palmVariants.forEach((v, i) => {
    const list = palmSpots[i];
    const im = new THREE.InstancedMesh(v.geo, palmMat, list.length);
    list.forEach(([x, h, z, rot, s], k) => {
      dummy.position.set(x, h - 0.2, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(s); dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix);
      colliders.circle(x, z, 0.35);
    });
    im.castShadow = true; im.receiveShadow = true;
    scene.add(im);
  });

  // Laubbäume im Inselinneren
  const treeV = [treeGeometry(5), treeGeometry(9)];
  const treeMat = windMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }, 0.5, 8);
  const treeSpots = [[], []];
  tries = 0;
  while (treeSpots.flat().length < 70 * q && tries++ < 20000) {
    const x = (r() - 0.5) * 220, z = (r() - 0.5) * 220, h = heightAt(x, z);
    if (h < 4 || h > 24 || !isClear(x, z, 3) || normalAt(x, z).y < 0.85) continue;
    treeSpots[(r() * 2) | 0].push([x, h, z, r() * 6.28, 0.8 + r() * 0.5]);
  }
  treeV.forEach((v, i) => {
    const list = treeSpots[i];
    const im = new THREE.InstancedMesh(v.geo, treeMat, list.length);
    list.forEach(([x, h, z, rot, s], k) => {
      dummy.position.set(x, h - 0.2, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(s); dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix); colliders.circle(x, z, 0.5 * s);
    });
    im.castShadow = true; im.receiveShadow = true; scene.add(im);
  });

  // Felsen
  const rockGeos = [rockGeometry(1), rockGeometry(2), rockGeometry(3)];
  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  const rockSpots = [[], [], []];
  tries = 0;
  while (rockSpots.flat().length < 150 && tries++ < 20000) {
    const x = (r() - 0.5) * 260, z = (r() - 0.5) * 260, h = heightAt(x, z);
    const n = normalAt(x, z);
    const steep = n.y < 0.9, shoreline = h > -1.5 && h < 0.6;
    const wreckCoast = Math.hypot(x - SPOTS.wreck.x + 15, z - SPOTS.wreck.z - 8) < 26;
    if (!(steep || (shoreline && r() < 0.25) || (wreckCoast && h > -2)) || !isClear(x, z, 1)) continue;
    if (h < -2.5) continue;
    rockSpots[(r() * 3) | 0].push([x, h, z, r() * 6.28, 0.5 + r() * (wreckCoast ? 2.2 : 1.4)]);
  }
  // Felsen um die Quelle
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, x = SPOTS.spring.x + Math.cos(a) * 3.6 - 1, z = SPOTS.spring.z + Math.sin(a) * 2.6 - 3;
    if (a > 0.9 && a < 2.2) continue;
    rockSpots[i % 3].push([x, heightAt(x, z), z, a, 1.2 + (i % 3) * 0.4]);
  }
  rockGeos.forEach((g, i) => {
    const list = rockSpots[i];
    const im = new THREE.InstancedMesh(g, rockMat, list.length);
    list.forEach(([x, h, z, rot, s], k) => {
      dummy.position.set(x, h - s * 0.15, z); dummy.rotation.set(r() * 0.3, rot, r() * 0.3); dummy.scale.setScalar(s); dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix); if (s > 0.7) colliders.circle(x, z, s * 0.85);
    });
    im.castShadow = true; im.receiveShadow = true; scene.add(im);
  });

  // Büsche
  const bushG = bushGeometry(3);
  const bushMat = windMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }, 0.4, 1.5);
  const bushList = [];
  tries = 0;
  while (bushList.length < 260 * q && tries++ < 20000) {
    const x = (r() - 0.5) * 230, z = (r() - 0.5) * 230, h = heightAt(x, z);
    if (h < 1.8 || !isClear(x, z, 1.5) || normalAt(x, z).y < 0.8) continue;
    bushList.push([x, h, z, r() * 6.28, 0.7 + r() * 0.8]);
  }
  const bim = new THREE.InstancedMesh(bushG, bushMat, bushList.length);
  bushList.forEach(([x, h, z, rot, s], k) => { dummy.position.set(x, h - 0.1, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); bim.setMatrixAt(k, dummy.matrix); });
  bim.castShadow = quality === 'high'; bim.receiveShadow = true; scene.add(bim);

  // Gras
  const grassCount = { low: 0, medium: 14000, high: 32000 }[quality];
  if (grassCount) {
    const gm = windMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }, 0.35, 0.6);
    const gim = new THREE.InstancedMesh(grassClump(), gm, grassCount);
    let k = 0; tries = 0;
    while (k < grassCount && tries++ < grassCount * 8) {
      const x = (r() - 0.5) * 230, z = (r() - 0.5) * 230, h = heightAt(x, z);
      if (h < 2.1 || normalAt(x, z).y < 0.86) continue;
      if (noise2(x * 0.05, z * 0.05) < -0.25) continue;
      dummy.position.set(x, h - 0.03, z); dummy.rotation.set(0, r() * 6.28, 0); dummy.scale.setScalar(0.8 + r() * 0.9); dummy.updateMatrix();
      gim.setMatrixAt(k++, dummy.matrix);
    }
    gim.count = k; gim.receiveShadow = true;
    scene.add(gim);
  }

  // Treibholz und Muscheln am Strand (Deko)
  const dw = new THREE.CylinderGeometry(0.08, 0.12, 2.2, 6); dw.rotateZ(Math.PI / 2);
  const dwm = new THREE.MeshStandardMaterial({ color: '#a89277', roughness: 1 });
  const dlist = [];
  tries = 0;
  while (dlist.length < 40 && tries++ < 5000) {
    const x = (r() - 0.5) * 250, z = (r() - 0.5) * 250, h = heightAt(x, z);
    if (h < 0.15 || h > 1.2 || !isClear(x, z)) continue;
    dlist.push([x, h, z]);
  }
  const dim = new THREE.InstancedMesh(dw, dwm, dlist.length);
  dlist.forEach(([x, h, z], k) => { dummy.position.set(x, h + 0.06, z); dummy.rotation.set(0, r() * 6.28, 0); dummy.scale.set(0.6 + r(), 1, 1); dummy.updateMatrix(); dim.setMatrixAt(k, dummy.matrix); });
  dim.castShadow = true; scene.add(dim);
}

export { windMaterial, rockGeometry };
