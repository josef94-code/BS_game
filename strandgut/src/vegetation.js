import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { heightAt, normalAt, SPOTS } from './terrain.js';
import { rng, noise2 } from './noise.js';
import { colliders } from './colliders.js';
import { barkTextures, rockTextures, frondTexture, leafClusterTexture, grassBladeTexture } from './textures.js';

export const windUniforms = { uTime: { value: 0 }, uWind: { value: 0.3 } };

// Wind-Animation in Standard-Materialien einschleusen (Stärke wächst mit der Höhe über dem Stammfuß)
function addWind(m, strength = 1, heightScale = 6, flutter = 0) {
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
      ${flutter ? `transformed.y += sin(uTime * 7.0 + wp.x * 1.3 + wp.z * 0.9 + transformed.x * 3.0) * ${flutter.toFixed(3)} * (0.3 + uWind) * hgt;` : ''}
    `);
  };
  return m;
}
function windMaterial(params, strength = 1, heightScale = 6, flutter = 0) { return addWind(new THREE.MeshStandardMaterial(params), strength, heightScale, flutter); }

function depthMat(map) { return new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 }); }

function colorize(geo, color) {
  const c = new THREE.Color(color), n = geo.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
const ni = (g) => g.index ? g.toNonIndexed() : g;

// Palme: Stamm (Rinde) + Wedel (Textur mit Fiederblättern), zwei Materialgruppen
function palmGeometry(seed) {
  const r = rng(seed);
  const height = 6.5 + r() * 4, lean = 0.8 + r() * 1.8;
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(Math.sin(t * 1.4) * lean, t * height, Math.sin(t * 2.2) * 0.2)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.TubeGeometry(curve, 24, 0.2, 10, false);
  const tp = trunk.attributes.position, tuv = trunk.attributes.uv;
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i), ty = Math.min(1, Math.max(0, y / height));
    const c = curve.getPoint(ty);
    const k = 1 + (1 - ty) * 0.55 + Math.max(0, 0.08 - ty) * 6; // Stammfuß verbreitert
    tp.setX(i, (tp.getX(i) - c.x) * k + c.x); tp.setZ(i, (tp.getZ(i) - c.z) * k + c.z);
    tuv.setXY(i, tuv.getY(i), tuv.getX(i) * height * 0.9);
  }
  trunk.computeVertexNormals();
  const top = curve.getPoint(1);
  const crown = new THREE.SphereGeometry(0.32, 10, 8); crown.translate(top.x, top.y - 0.05, top.z);
  const trunkG = mergeGeometries([ni(trunk), ni(crown)]);
  colorize(trunkG, '#ffffff');
  const fronds = [];
  const N = 13;
  for (let f = 0; f < N; f++) {
    const young = f >= 10;
    const len = young ? 2.2 + r() * 0.8 : 3.6 + r() * 1.4, segs = 12, wid = young ? 0.9 : 1.7;
    const g = new THREE.PlaneGeometry(wid, len, 2, segs);
    const p = g.attributes.position;
    const lift = young ? 0.9 : 0.35 + r() * 0.3, droop = young ? 0.6 : 2.2 + r() * 1.0;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), v = p.getY(i) / len + 0.5;
      const z = v * len;
      const y = v * len * lift - v * v * droop - Math.abs(x) * (0.25 + v * 0.2);
      p.setXYZ(i, x * (1 - v * 0.15), y, z);
    }
    g.rotateY((f / N) * Math.PI * 2 + r() * 0.35 + (young ? 0.3 : 0));
    g.translate(top.x, top.y, top.z);
    colorize(g, new THREE.Color().setHSL(0.22 + r() * 0.04, 0.35, 0.75 + r() * 0.2 - (!young && f % 3 === 0 ? 0.2 : 0)).getHex());
    fronds.push(ni(g));
  }
  for (let k = 0; k < 3; k++) {
    const s = new THREE.SphereGeometry(0.12, 10, 8); s.scale(1, 1.15, 1);
    s.translate(top.x + Math.cos(k * 2.1) * 0.24, top.y - 0.28, top.z + Math.sin(k * 2.1) * 0.24);
    colorize(s, k % 2 ? '#c8d070' : '#d8a860');
    // Kokosnüsse bekommen eine leere UV-Ecke ohne Alpha-Loch: Mittelrippe der Textur
    const uv = s.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, 0.5);
    fronds.push(ni(s));
  }
  const frondG = mergeGeometries(fronds);
  frondG.computeVertexNormals();
  // Normalen nach oben/außen neigen → weicheres, natürlicheres Licht
  const fn = frondG.attributes.normal, fp = frondG.attributes.position;
  for (let i = 0; i < fn.count; i++) {
    const v = new THREE.Vector3((fp.getX(i) - top.x) * 0.3, 1, (fp.getZ(i) - top.z) * 0.3).normalize();
    fn.setXYZ(i, v.x, v.y, v.z);
  }
  return { geo: mergeGeometries([trunkG, frondG], true), height };
}

// Laubbaum: Stamm mit Ästen und Blattbüscheln (gekreuzte Karten)
function treeGeometry(seed) {
  const r = rng(seed);
  const h = 4.5 + r() * 3;
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.2, 0.36, h, 9, 4); trunk.translate(0, h / 2, 0);
  parts.push(ni(trunk));
  const crownC = new THREE.Vector3(0, h + 0.8, 0);
  const cards = [], tips = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + r(), len = 1.4 + r() * 1.2, y0 = h * (0.6 + r() * 0.35);
    const base = new THREE.Vector3(0, y0, 0);
    const tip = new THREE.Vector3(Math.cos(a) * len, y0 + 0.8 + r() * 0.8, Math.sin(a) * len);
    const dir = tip.clone().sub(base), L = dir.length();
    const br = new THREE.CylinderGeometry(0.05, 0.11, L, 5); br.translate(0, L / 2, 0);
    br.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()));
    br.translate(0, y0, 0);
    parts.push(ni(br));
    tips.push(tip);
  }
  tips.push(new THREE.Vector3(0, h + 0.6, 0));
  for (const tip of tips) for (let k = 0; k < 3; k++) {
    const size = 2.0 + r() * 1.2;
    const c = tip.clone().add(new THREE.Vector3((r() - 0.5) * 1.6, (r() - 0.3) * 1.2, (r() - 0.5) * 1.6));
    for (let q = 0; q < 3; q++) {
      const pl = new THREE.PlaneGeometry(size, size);
      pl.rotateX((r() - 0.5) * 0.8); pl.rotateY(q * Math.PI / 3 + r());
      pl.translate(c.x, c.y, c.z);
      cards.push(ni(pl));
    }
  }
  const trunkG = mergeGeometries(parts); colorize(trunkG, '#c8b8a0');
  const leafG = mergeGeometries(cards);
  const n = leafG.attributes.normal, p = leafG.attributes.position;
  for (let i = 0; i < n.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).sub(crownC).normalize(); n.setXYZ(i, v.x, v.y * 0.8 + 0.3, v.z); }
  colorize(leafG, '#ffffff');
  return { geo: mergeGeometries([trunkG, leafG], true), height: h };
}

function bushGeometry(seed) {
  const r = rng(seed), cards = [];
  for (let i = 0; i < 7; i++) {
    const s = 0.9 + r() * 0.7;
    const pl = new THREE.PlaneGeometry(s, s);
    pl.rotateX(-0.3 + (r() - 0.5) * 0.6); pl.rotateY(i / 7 * Math.PI * 2);
    pl.translate((r() - 0.5) * 0.7, 0.35 + r() * 0.35, (r() - 0.5) * 0.7);
    cards.push(ni(pl));
  }
  const g = mergeGeometries(cards);
  const n = g.attributes.normal, p = g.attributes.position;
  for (let i = 0; i < n.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i) - 0.2, p.getZ(i)).normalize(); n.setXYZ(i, v.x, v.y * 0.7 + 0.4, v.z); }
  return g;
}

function rockGeometry(seed, detail = 3) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const n = noise2(v.x * 1.4 + seed, v.z * 1.4 + v.y) * 0.3 + noise2(v.x * 3.5, v.y * 3.5 + seed) * 0.1 + noise2(v.y * 7 + seed, v.z * 7) * 0.035;
    v.multiplyScalar(1 + n); v.y *= 0.62;
    if (v.y < -0.2) v.y = -0.2 + (v.y + 0.2) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) * 0.5 + p.getZ(i) * 0.25, p.getY(i) * 0.6 + p.getZ(i) * 0.3);
  colorize(g, new THREE.Color('#ffffff').lerp(new THREE.Color('#d8cfc0'), (seed % 5) / 5));
  return g;
}

function grassClump(seed = 7) {
  const parts = [], r = rng(seed);
  for (let i = 0; i < 3; i++) {
    const h = 0.55 + r() * 0.35, w = 0.7 + r() * 0.3;
    const pl = new THREE.PlaneGeometry(w, h);
    pl.translate(0, h / 2, 0); pl.rotateY(i * Math.PI / 3 + r() * 0.3);
    parts.push(ni(pl));
  }
  const m = mergeGeometries(parts);
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
  const q = { low: 0.5, medium: 0.85, high: 1.15 }[quality];
  const bark = barkTextures();
  const shadowAll = quality !== 'low';
  const out = { grass: null };

  // Palmen
  const palmVariants = [palmGeometry(11), palmGeometry(23), palmGeometry(37), palmGeometry(51)];
  const frondTex = frondTexture();
  const palmMats = [
    windMaterial({ map: bark.map, normalMap: bark.normal, vertexColors: true, roughness: 0.9 }, 1, 9),
    windMaterial({ map: frondTex, vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, alphaTest: 0.45 }, 1, 9, 0.06),
  ];
  const palmSpots = palmVariants.map(() => []);
  let tries = 0;
  while (palmSpots.flat().length < 190 * q && tries++ < 30000) {
    const x = (r() - 0.5) * 240, z = (r() - 0.5) * 240, h = heightAt(x, z);
    if (h < 1.1 || h > 12) continue;
    if (r() > (h < 4 ? 1 : 0.35)) continue;
    if (!isClear(x, z, 2) || normalAt(x, z).y < 0.82) continue;
    palmSpots[(r() * palmVariants.length) | 0].push([x, h, z, r() * Math.PI * 2, 0.85 + r() * 0.35]);
  }
  palmVariants.forEach((v, i) => {
    const list = palmSpots[i];
    const im = new THREE.InstancedMesh(v.geo, palmMats, list.length);
    list.forEach(([x, h, z, rot, s], k) => {
      dummy.position.set(x, h - 0.2, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(s); dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix);
      colliders.circle(x, z, 0.35);
    });
    im.castShadow = shadowAll; im.receiveShadow = true;
    im.customDepthMaterial = depthMat(frondTex);
    scene.add(im);
  });

  // Laubbäume im Inselinneren
  const treeV = [treeGeometry(5), treeGeometry(9), treeGeometry(17)];
  const leafTex = [leafClusterTexture(0), leafClusterTexture(1)];
  const treeSpots = treeV.map(() => []);
  tries = 0;
  while (treeSpots.flat().length < 85 * q && tries++ < 30000) {
    const x = (r() - 0.5) * 220, z = (r() - 0.5) * 220, h = heightAt(x, z);
    if (h < 4 || h > 24 || !isClear(x, z, 3) || normalAt(x, z).y < 0.85) continue;
    treeSpots[(r() * treeV.length) | 0].push([x, h, z, r() * 6.28, 0.85 + r() * 0.5]);
  }
  treeV.forEach((v, i) => {
    const lt = leafTex[i % 2];
    const mats = [windMaterial({ map: bark.map, normalMap: bark.normal, vertexColors: true, roughness: 0.9 }, 0.5, 8),
      windMaterial({ map: lt, vertexColors: true, roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.5 }, 0.5, 8, 0.05)];
    const list = treeSpots[i];
    const im = new THREE.InstancedMesh(v.geo, mats, list.length);
    list.forEach(([x, h, z, rot, s], k) => {
      dummy.position.set(x, h - 0.2, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(s); dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix); colliders.circle(x, z, 0.45 * s);
    });
    im.castShadow = shadowAll; im.receiveShadow = true; im.customDepthMaterial = depthMat(lt);
    scene.add(im);
  });

  // Felsen
  const rockT = rockTextures();
  const rockGeos = [rockGeometry(1, quality === 'low' ? 2 : 3), rockGeometry(2, quality === 'low' ? 2 : 3), rockGeometry(3, 2)];
  const rockMat = new THREE.MeshStandardMaterial({ map: rockT.map, normalMap: rockT.normal, normalScale: new THREE.Vector2(1.2, 1.2), vertexColors: true, roughness: 0.85 });
  const rockSpots = [[], [], []];
  tries = 0;
  while (rockSpots.flat().length < 170 && tries++ < 20000) {
    const x = (r() - 0.5) * 260, z = (r() - 0.5) * 260, h = heightAt(x, z);
    const n = normalAt(x, z);
    const steep = n.y < 0.9, shoreline = h > -1.5 && h < 0.6;
    const wreckCoast = Math.hypot(x - SPOTS.wreck.x + 15, z - SPOTS.wreck.z - 8) < 26;
    if (!(steep || (shoreline && r() < 0.25) || (wreckCoast && h > -2)) || !isClear(x, z, 1)) continue;
    if (h < -2.5) continue;
    rockSpots[(r() * 3) | 0].push([x, h, z, r() * 6.28, 0.5 + r() * (wreckCoast ? 2.2 : 1.4)]);
  }
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, x = SPOTS.spring.x + Math.cos(a) * 3.6 - 1, z = SPOTS.spring.z + Math.sin(a) * 2.6 - 3;
    if (a > 0.9 && a < 2.2) continue;
    rockSpots[i % 3].push([x, heightAt(x, z), z, a, 1.2 + (i % 3) * 0.4]);
  }
  rockGeos.forEach((g, i) => {
    const list = rockSpots[i];
    const im = new THREE.InstancedMesh(g, rockMat, list.length);
    list.forEach(([x, h, z, rot, s], k) => {
      dummy.position.set(x, h - s * 0.12, z); dummy.rotation.set(r() * 0.3, rot, r() * 0.3); dummy.scale.set(s, s * (0.8 + r() * 0.5), s); dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix); if (s > 0.7) colliders.circle(x, z, s * 0.85);
    });
    im.castShadow = true; im.receiveShadow = true; scene.add(im);
  });

  // Büsche
  const bushG = bushGeometry(3);
  const bushTex = leafClusterTexture(2);
  const bushMat = windMaterial({ map: bushTex, roughness: 0.85, side: THREE.DoubleSide, alphaTest: 0.5 }, 0.4, 1.5, 0.04);
  const bushList = [];
  tries = 0;
  while (bushList.length < 220 * q && tries++ < 30000) {
    const x = (r() - 0.5) * 230, z = (r() - 0.5) * 230, h = heightAt(x, z);
    if (h < 1.8 || !isClear(x, z, 1.5) || normalAt(x, z).y < 0.8) continue;
    bushList.push([x, h, z, r() * 6.28, 0.8 + r() * 0.9]);
  }
  const bim = new THREE.InstancedMesh(bushG, bushMat, bushList.length);
  bushList.forEach(([x, h, z, rot, s], k) => { dummy.position.set(x, h - 0.1, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); bim.setMatrixAt(k, dummy.matrix); });
  bim.castShadow = quality === 'high'; bim.receiveShadow = true; bim.customDepthMaterial = depthMat(bushTex); scene.add(bim);

  // Gras
  const grassCount = { low: 6000, medium: 30000, high: 70000 }[quality];
  const gm = windMaterial({ map: grassBladeTexture(), roughness: 0.9, side: THREE.DoubleSide, alphaTest: 0.4 }, 0.35, 0.8);
  const gim = new THREE.InstancedMesh(grassClump(), gm, grassCount);
  const col = new THREE.Color();
  let k = 0; tries = 0;
  while (k < grassCount && tries++ < grassCount * 10) {
    const x = (r() - 0.5) * 230, z = (r() - 0.5) * 230, h = heightAt(x, z);
    if (h < 2.0 + r() * 0.6 || normalAt(x, z).y < 0.86) continue;
    if (noise2(x * 0.05, z * 0.05) < -0.35 && r() < 0.8) continue;
    if (Math.hypot(x - SPOTS.camp.x, z - SPOTS.camp.z) < 7) continue;
    dummy.position.set(x, h - 0.03, z); dummy.rotation.set(0, r() * 6.28, 0);
    const s = 0.7 + r() * 0.8; dummy.scale.set(s, s * (0.8 + r() * 0.5), s); dummy.updateMatrix();
    gim.setMatrixAt(k, dummy.matrix);
    const v = noise2(x * 0.03, z * 0.03) * 0.5 + 0.5;
    col.setRGB(0.85 + v * 0.25, 0.95 + v * 0.1, 0.8 - v * 0.2); gim.setColorAt(k, col);
    k++;
  }
  gim.count = k; gim.receiveShadow = true;
  scene.add(gim);
  out.grass = gim;

  // Treibholz am Strand
  const dw = new THREE.CylinderGeometry(0.07, 0.12, 2.2, 7, 3); dw.rotateZ(Math.PI / 2);
  const dwm = new THREE.MeshStandardMaterial({ map: bark.map, normalMap: bark.normal, color: '#d8ccb8', roughness: 1 });
  const dlist = [];
  tries = 0;
  while (dlist.length < 50 && tries++ < 5000) {
    const x = (r() - 0.5) * 250, z = (r() - 0.5) * 250, h = heightAt(x, z);
    if (h < 0.15 || h > 1.3 || !isClear(x, z)) continue;
    dlist.push([x, h, z]);
  }
  const dim = new THREE.InstancedMesh(dw, dwm, dlist.length);
  dlist.forEach(([x, h, z], i) => { dummy.position.set(x, h + 0.05, z); dummy.rotation.set(0, r() * 6.28, (r() - 0.5) * 0.1); dummy.scale.set(0.6 + r(), 1, 1); dummy.updateMatrix(); dim.setMatrixAt(i, dummy.matrix); });
  dim.castShadow = true; dim.receiveShadow = true; scene.add(dim);

  // Muscheln an der Flutlinie
  const shell = new THREE.SphereGeometry(0.06, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2); shell.scale(1, 0.5, 1.3);
  const slist = [];
  tries = 0;
  while (slist.length < 260 && tries++ < 20000) {
    const x = (r() - 0.5) * 250, z = (r() - 0.5) * 250, h = heightAt(x, z);
    if (h < 0.05 || h > 0.9) continue;
    slist.push([x, h, z]);
  }
  const sim = new THREE.InstancedMesh(shell, new THREE.MeshStandardMaterial({ roughness: 0.4 }), slist.length);
  slist.forEach(([x, h, z], i) => { dummy.position.set(x, h, z); dummy.rotation.set(0, r() * 6, 0); dummy.scale.setScalar(0.7 + r()); dummy.updateMatrix(); sim.setMatrixAt(i, dummy.matrix); sim.setColorAt(i, col.setHSL(0.07 + r() * 0.05, 0.3 + r() * 0.3, 0.7 + r() * 0.2)); });
  scene.add(sim);
  return out;
}

export { windMaterial, rockGeometry, addWind };
