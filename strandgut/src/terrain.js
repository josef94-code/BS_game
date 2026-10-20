import * as THREE from 'three';
import { noise2, fbm, smoothstep, lerp, clamp } from './noise.js';
import { sandTextures, grassGroundTextures, rockTextures } from './textures.js';

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

export const terrainUniforms = { uTime: { value: 0 }, uCaustic: { value: 1 } };

export function buildTerrain(quality) {
  const size = 300, seg = quality === 'low' ? 180 : quality === 'medium' ? 280 : 380;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const spl = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const n = normalAt(x, z);
    const slope = 1 - n.y;
    const v = noise2(x * 0.15, z * 0.15) * 0.5 + 0.5;
    const v2 = noise2(x * 0.04 + 7, z * 0.04) * 0.5 + 0.5;
    // Gewichte: Sand, Gras, Fels, Erde
    let grass = smoothstep(1.7 + v * 0.9, 2.5 + v * 0.9, h);
    let rock = smoothstep(0.2, 0.4, slope) * (h > -1 ? 1 : 0.5);
    const dc = Math.hypot(x - SPOTS.camp.x, z - SPOTS.camp.z);
    let dirt = (dc < 11 && h > 1.4 ? 0.7 * smoothstep(11, 5, dc) : 0) + grass * smoothstep(0.62, 0.8, v2) * 0.6;
    dirt = Math.min(1, dirt);
    let sand = 1 - grass;
    grass *= 1 - dirt;
    const tot = sand + grass + rock + dirt;
    spl.set([sand / tot, grass / tot, rock / tot, dirt / tot], i * 4);
    // Großflächige Farbvariation als Tönung
    const t = 0.88 + v * 0.14 + (v2 - 0.5) * 0.12;
    col.set([t * (1 + (v2 - 0.5) * 0.06), t, t * (1 - (v2 - 0.5) * 0.08)], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('splat', new THREE.BufferAttribute(spl, 4));
  geo.computeVertexNormals();
  const S = quality === 'low' ? 256 : 512;
  const sand = sandTextures(S), grass = grassGroundTextures(S), rock = rockTextures(S);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      tSand: { value: sand.map }, nSand: { value: sand.normal }, tGrass: { value: grass.map }, nGrass: { value: grass.normal },
      tRock: { value: rock.map }, nRock: { value: rock.normal }, uTime: terrainUniforms.uTime, uCaustic: terrainUniforms.uCaustic,
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 splat; varying vec4 vSplat; varying vec3 vWPos; varying vec3 vWNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplat = splat; vWPos = (modelMatrix * vec4(position,1.0)).xyz; vWNormal = normalize(mat3(modelMatrix) * normal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D tSand, nSand, tGrass, nGrass, tRock, nRock; uniform float uTime, uCaustic;
        varying vec4 vSplat; varying vec3 vWPos; varying vec3 vWNormal;
        float wet; vec3 detailN;
        vec2 rot(vec2 p, float a){ float c=cos(a), s=sin(a); return vec2(c*p.x-s*p.y, s*p.x+c*p.y); }
        vec3 tri(sampler2D t, vec2 uv){ return mix(texture2D(t, uv).rgb, texture2D(t, rot(uv, 1.3) * 0.43 + 0.17).rgb, 0.4); }
        float caustic(vec2 p){
          float c = 0.0;
          for (int i = 0; i < 3; i++) {
            vec2 q = p * (0.55 + float(i) * 0.31) + vec2(uTime * 0.11 * float(i + 1), -uTime * 0.07 * float(i + 2));
            vec2 g = abs(fract(q + 0.5 * sin(q.yx * 2.1 + uTime * 0.6)) - 0.5);
            c += pow(1.0 - min(g.x, g.y) * 2.0, 7.0);
          }
          return c;
        }`)
      .replace('#include <map_fragment>', `
        vec4 w = vSplat;
        vec2 uv = vWPos.xz;
        vec3 cs = tri(tSand, uv * 0.22), cg = tri(tGrass, uv * 0.18), cr = tri(tRock, uv * 0.11), cd = cs * vec3(0.62, 0.5, 0.38);
        wet = smoothstep(0.75, -0.05, vWPos.y) * w.x;
        cs = mix(cs, cs * vec3(0.48, 0.45, 0.4), wet);
        if (vWPos.y < -0.3) cs = mix(cs, cs * vec3(0.8, 0.86, 0.85), smoothstep(-0.3, -4.0, vWPos.y));
        vec3 albedo = cs * w.x + cg * w.y + cr * w.z + cd * w.w;
        diffuseColor.rgb *= albedo;
        vec3 ns = texture2D(nSand, uv * 0.22).xyz * 2.0 - 1.0, ng = texture2D(nGrass, uv * 0.18).xyz * 2.0 - 1.0, nr = texture2D(nRock, uv * 0.11).xyz * 2.0 - 1.0;
        detailN = normalize(ns * (w.x + w.w) + ng * w.y * 0.8 + nr * w.z * 1.4 + vec3(0.0, 0.0, 0.6));`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = mix(roughness, 0.22, wet) - w.z * 0.08;`)
      .replace('#include <normal_fragment_maps>', `
        {
          vec3 Nw = normalize(vWNormal);
          vec3 T = normalize(vec3(1.0, 0.0, 0.0) - Nw * Nw.x);
          vec3 B = normalize(cross(T, Nw));
          vec3 nw = normalize(T * detailN.x + B * -detailN.y + Nw * detailN.z);
          normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (vWPos.y < 0.05) {
          float d = clamp(-vWPos.y, 0.0, 6.0);
          totalEmissiveRadiance += vec3(0.75, 0.95, 1.0) * caustic(vWPos.xz) * 0.16 * uCaustic * smoothstep(0.0, 0.4, d) * (1.0 - d / 6.5) * diffuseColor.rgb;
        }`);
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

export const WATER_LEVEL = 0;
export const isLand = (x, z) => heightAt(x, z) > -0.9;
export { clamp };
