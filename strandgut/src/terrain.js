import * as THREE from 'three';
import { noise2, fbm, smoothstep, lerp, clamp } from './noise.js';

// Wichtige Orte der Insel (x, z in Metern; Norden = -z)
export const SPOTS = {
  start:   { x: 16, z: 103 },
  camp:    { x: -9, z: 84 },
  slip:    { x: 35, z: 99 },
  wreck:   { x: 111, z: -44 },
  hill:    { x: -46, z: -24 },
  spring:  { x: -22, z: -2 },
  lagoon:  { x: -83, z: 23 },
  contA:   { x: 45, z: 92 },
  contB:   { x: -54, z: 93 },
  contC:   { x: 85, z: 22 },
};

const FLATS = [
  { x: SPOTS.camp.x, z: SPOTS.camp.z, r: 15, h: 1.9 },
  { x: SPOTS.slip.x, z: SPOTS.slip.z - 3, r: 8, h: 0.9 },
  { x: SPOTS.hill.x + 6, z: SPOTS.hill.z + 4, r: 8, h: null },
];

export function islandRadius(a) {
  return 108 + noise2(Math.cos(a) * 1.3 + 3, Math.sin(a) * 1.3 + 7) * 16 + noise2(Math.cos(a) * 4 + 9, Math.sin(a) * 4) * 5;
}

function rawHeight(x, z) {
  const d = Math.hypot(x, z);
  const a = Math.atan2(z, x);
  let R = islandRadius(a);
  // Lagune im Westen etwas eingebuchtet
  const lg = Math.hypot(x - SPOTS.lagoon.x + 8, z - SPOTS.lagoon.z);
  R -= 14 * Math.exp(-(lg * lg) / 500);
  const t = 1 - d / R;
  let h;
  if (t < 0) h = Math.max(-16, -1.2 + t * 22 + fbm(x * 0.02, z * 0.02, 2) * 1.5 * (1 + t * 3));
  else {
    h = -1.2 + smoothstep(0, 0.13, t) * 2.7 + smoothstep(0.12, 0.6, t) * 4.5;
    h += fbm(x * 0.028, z * 0.028, 4) * 2.2 * smoothstep(0.1, 0.4, t);
  }
  // Hügel im Westen
  const hx = x - SPOTS.hill.x, hz = z - SPOTS.hill.z;
  h += 20 * Math.exp(-(hx * hx + hz * hz) / (2 * 26 * 26)) * smoothstep(-0.05, 0.25, t);
  h += 6 * Math.exp(-((x + 10) ** 2 + (z + 52) ** 2) / (2 * 20 * 20)) * smoothstep(0, 0.3, t);
  // Felsige Nordostküste beim Wrack
  const wx = x - SPOTS.wreck.x + 18, wz = z - SPOTS.wreck.z - 10;
  h += 1.4 * Math.exp(-(wx * wx + wz * wz) / 300) * (0.6 + 0.4 * noise2(x * 0.2, z * 0.2));
  return h;
}

for (const f of FLATS) if (f.h === null) f.h = rawHeight(f.x, f.z);

export function heightAt(x, z) {
  let h = rawHeight(x, z);
  // Ebene Bauplätze
  for (const f of FLATS) {
    const fd = Math.hypot(x - f.x, z - f.z);
    if (fd < f.r) h = lerp(h, f.h, smoothstep(f.r, f.r * 0.55, fd));
  }
  return h;
}

export function normalAt(x, z) {
  const e = 0.5;
  const hl = heightAt(x - e, z), hr = heightAt(x + e, z), hd = heightAt(x, z - e), hu = heightAt(x, z + e);
  return new THREE.Vector3(hl - hr, 2 * e, hd - hu).normalize();
}

// Höhenkarte als Textur für das Wasser (Schaumlinie, Flachwasser-Farbe)
export function makeHeightTexture(size = 256, extent = 320) {
  const data = new Float32Array(size * size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = (i / (size - 1) - 0.5) * extent, z = (j / (size - 1) - 0.5) * extent;
    data[j * size + i] = heightAt(x, z);
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.FloatType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return { tex, extent };
}

export function buildTerrain(quality) {
  const size = 300, seg = quality === 'low' ? 160 : 260;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const sandDry = new THREE.Color('#e8d3a2'), sandWet = new THREE.Color('#b99d6b'), grass = new THREE.Color('#5d8f3a'),
    grassDark = new THREE.Color('#3f6b2a'), rock = new THREE.Color('#7b766d'), seabed = new THREE.Color('#c8b98a'), dirt = new THREE.Color('#8a6d48');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const n = normalAt(x, z);
    const slope = 1 - n.y;
    const v = noise2(x * 0.15, z * 0.15) * 0.5 + 0.5;
    if (h < -0.3) c.copy(seabed).lerp(sandWet, smoothstep(-3, -0.3, h));
    else if (h < 0.5) c.copy(sandWet).lerp(sandDry, smoothstep(-0.3, 0.5, h));
    else if (h < 1.9 + v * 0.8) c.copy(sandDry);
    else c.copy(grass).lerp(grassDark, v);
    if (h > 1.5 && h < 2.4 + v) c.lerp(sandDry, 0.35);
    if (slope > 0.22) c.lerp(rock, smoothstep(0.22, 0.42, slope));
    // Trampelpfade zum Lager
    const dc = Math.hypot(x - SPOTS.camp.x, z - SPOTS.camp.z);
    if (dc < 11 && h > 1.5) c.lerp(dirt, 0.45 * smoothstep(11, 6, dc));
    c.multiplyScalar(0.93 + v * 0.12);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

export const WATER_LEVEL = 0;
export const isLand = (x, z) => heightAt(x, z) > -0.9;
export { clamp };
