import * as THREE from 'three';
import { heightAt } from './terrain.js';
import { colliders } from './colliders.js';
import { clamp, lerp } from './noise.js';

import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { fabricNormal } from './textures.js';

const matCache = {};
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache[key]) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0 });
    if (o.fabric) { m.normalMap = fabricNormal(); m.normalScale.set(0.6, 0.6); }
    if (o.emissive) { m.emissive.set(o.emissive); m.emissiveIntensity = o.ei ?? 0.15; }
    matCache[key] = m;
  }
  return matCache[key];
}
function part(geo, color, o = {}) {
  const m = new THREE.Mesh(geo, mat(color, o));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// Konische Kapsel: oben bei y=0, reicht bis y=-len
function limb(rTop, rBot, len) {
  const r = Math.max(rTop, rBot);
  const g = new THREE.CapsuleGeometry(r, len, 6, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), t = Math.min(1, Math.max(0, (y + len / 2) / len));
    const k = (rBot + (rTop - rBot) * t) / r;
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
  }
  g.translate(0, -len / 2, 0); g.computeVertexNormals();
  return g;
}
function lathe(profile, seg = 24, zScale = 1) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.scale(1, 1, zScale); g.computeVertexNormals();
  return g;
}

// Figur: Jana Brandl, Bordmechatronikerin – detailliert modelliert, mit Gelenk-Hierarchie
export function buildCharacter() {
  const C = { overall: '#e2692a', overallDark: '#b44f1a', skin: '#d9a07c', hair: '#3e2416', boot: '#2a2622', sole: '#141210', belt: '#2f2b27', reflex: '#e6ecef', shirt: '#2f3a44' };
  const F = { fabric: true, rough: 0.85 };
  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
  // Becken
  const pelvis = part(lathe([[0, -0.1], [0.12, -0.09], [0.165, -0.03], [0.17, 0.06], [0.16, 0.12], [0, 0.12]], 22, 0.72), C.overall, F); hips.add(pelvis);
  // Gürtel mit Taschen
  const belt = part(new THREE.CylinderGeometry(0.168, 0.168, 0.05, 24, 1, true), C.belt, { rough: 0.6 }); belt.scale.z = 0.74; belt.position.y = 0.085; hips.add(belt);
  const buckle = part(new RoundedBoxGeometry(0.06, 0.045, 0.015, 2, 0.006), '#9aa0a5', { metal: 0.9, rough: 0.3 }); buckle.position.set(0, 0.085, 0.125); hips.add(buckle);
  for (const [x, z, ry, w] of [[0.15, 0.06, 0.9, 0.09], [-0.15, 0.06, -0.9, 0.08], [0.11, -0.1, 2.3, 0.07]]) {
    const pch = part(new RoundedBoxGeometry(w, 0.1, 0.05, 2, 0.012), '#3b352e', { rough: 0.7 }); pch.position.set(x, 0.04, z); pch.rotation.y = ry; hips.add(pch);
  }
  const hammer = part(new THREE.CylinderGeometry(0.012, 0.014, 0.22, 8), '#6b4a2b'); hammer.position.set(-0.17, -0.05, -0.02); hammer.rotation.z = 0.15; hips.add(hammer);

  const spine = new THREE.Group(); spine.position.y = 0.1; hips.add(spine);
  // Oberkörper (Overall): Taille, Brust, Schultern
  const torso = part(lathe([[0.15, 0.0], [0.148, 0.08], [0.158, 0.18], [0.172, 0.28], [0.178, 0.36], [0.17, 0.42], [0.13, 0.47], [0.07, 0.5], [0, 0.505]], 26, 0.7), C.overall, F); spine.add(torso);
  const zip = part(new THREE.BoxGeometry(0.012, 0.42, 0.01), '#7a7f84', { metal: 0.7, rough: 0.4 }); zip.position.set(0, 0.24, 0.124); spine.add(zip);
  for (const s of [-1, 1]) {
    const pocket = part(new RoundedBoxGeometry(0.09, 0.09, 0.018, 2, 0.008), C.overallDark, F); pocket.position.set(0.075 * s, 0.33, 0.118); pocket.rotation.y = 0.25 * s; spine.add(pocket);
    const pen = part(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), s < 0 ? '#2a6fd0' : '#222'); pen.position.set(0.09 * s, 0.39, 0.125); spine.add(pen);
  }
  // Reflexstreifen um die Brust
  const band = part(new THREE.CylinderGeometry(0.176, 0.176, 0.035, 26, 1, true), C.reflex, { rough: 0.35, emissive: '#ffffff', ei: 0.08 }); band.scale.z = 0.71; band.position.y = 0.2; spine.add(band);
  const collar = part(new THREE.TorusGeometry(0.075, 0.025, 8, 20), C.overallDark, F); collar.rotation.x = Math.PI / 2; collar.position.y = 0.49; collar.scale.y = 0.85; spine.add(collar);
  const tshirt = part(new THREE.CylinderGeometry(0.062, 0.07, 0.04, 16), C.shirt, F); tshirt.position.y = 0.5; spine.add(tshirt);
  // Rucksack mit Trägern
  const pack = part(new RoundedBoxGeometry(0.28, 0.36, 0.15, 3, 0.04), '#33505f', F); pack.position.set(0, 0.28, -0.19); spine.add(pack);
  const flap = part(new RoundedBoxGeometry(0.27, 0.12, 0.155, 3, 0.03), '#2b4452', F); flap.position.set(0, 0.42, -0.185); spine.add(flap);
  const roll = part(new THREE.CylinderGeometry(0.055, 0.055, 0.32, 14), '#5e6f3f', F); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.5, -0.19); spine.add(roll);
  for (const s of [-1, 1]) {
    const strap = part(new THREE.BoxGeometry(0.04, 0.42, 0.012), '#22323b'); strap.position.set(0.085 * s, 0.27, 0.112); strap.rotation.x = -0.08; spine.add(strap);
    const strapTop = part(new THREE.TorusGeometry(0.1, 0.012, 6, 12, Math.PI), '#22323b'); strapTop.position.set(0.085 * s, 0.43, -0.03); strapTop.rotation.y = Math.PI / 2; spine.add(strapTop);
  }

  // Hals und Kopf
  const neck = new THREE.Group(); neck.position.y = 0.5; spine.add(neck);
  const neckM = part(limb(0.045, 0.05, 0.06), C.skin, { rough: 0.55 }); neckM.position.y = 0.07; neck.add(neckM);
  const headG = new THREE.Group(); headG.position.y = 0.13; neck.add(headG);
  const skull = part(new THREE.SphereGeometry(0.105, 28, 22), C.skin, { rough: 0.55 }); skull.scale.set(0.86, 1.04, 0.98); headG.add(skull);
  const jaw = part(new THREE.SphereGeometry(0.075, 22, 16), C.skin, { rough: 0.55 }); jaw.scale.set(0.95, 0.85, 0.95); jaw.position.set(0, -0.045, 0.025); headG.add(jaw);
  for (const s of [-1, 1]) {
    const ear = part(new THREE.SphereGeometry(0.022, 10, 8), C.skin, { rough: 0.55 }); ear.scale.set(0.45, 1, 0.75); ear.position.set(0.09 * s, -0.005, -0.005); headG.add(ear);
    const eyeW = part(new THREE.SphereGeometry(0.014, 12, 10), '#f4f1ec', { rough: 0.2 }); eyeW.position.set(0.034 * s, 0.012, 0.085); headG.add(eyeW);
    const iris = part(new THREE.SphereGeometry(0.008, 10, 8), '#3d5a3a', { rough: 0.1 }); iris.position.set(0.034 * s, 0.012, 0.097); headG.add(iris);
    const brow = part(new RoundedBoxGeometry(0.032, 0.007, 0.01, 1, 0.003), C.hair); brow.position.set(0.035 * s, 0.038, 0.093); brow.rotation.z = -0.12 * s; headG.add(brow);
    const cheek = part(new THREE.SphereGeometry(0.03, 12, 10), '#dba083', { rough: 0.6 }); cheek.position.set(0.045 * s, -0.022, 0.065); cheek.scale.set(1, 0.8, 0.6); headG.add(cheek);
  }
  const nose = part(new THREE.SphereGeometry(0.018, 12, 10), C.skin, { rough: 0.5 }); nose.scale.set(0.75, 1.1, 1); nose.position.set(0, -0.012, 0.1); headG.add(nose);
  const lips = part(new THREE.TorusGeometry(0.018, 0.0055, 6, 14, Math.PI), '#b56b5c', { rough: 0.4 }); lips.position.set(0, -0.052, 0.088); lips.rotation.z = Math.PI; lips.scale.set(1.1, 0.5, 1); headG.add(lips);
  // Haare: Oberkopf, Seiten, Pony, Zopf
  const hairM = { rough: 0.6 };
  const hairTop = part(new THREE.SphereGeometry(0.112, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), C.hair, hairM); hairTop.scale.set(0.9, 1.04, 1.02); hairTop.position.set(0, 0.004, -0.006); hairTop.rotation.x = -0.3; headG.add(hairTop);
  const hairBack = part(new THREE.SphereGeometry(0.106, 22, 16), C.hair, hairM); hairBack.scale.set(0.9, 0.95, 0.9); hairBack.position.set(0, -0.005, -0.03); headG.add(hairBack);
  for (const s of [-1, 1]) { const side = part(new THREE.SphereGeometry(0.06, 14, 10), C.hair, hairM); side.scale.set(0.5, 1.1, 1.0); side.position.set(0.07 * s, 0.02, 0.0); headG.add(side); }
  const bangs = part(new THREE.SphereGeometry(0.1, 20, 10, -1.2, 2.4, 0.45, 0.5), C.hair, hairM); bangs.position.set(0, 0.012, 0.012); bangs.rotation.x = -0.15; headG.add(bangs);
  const bun = new THREE.Group(); bun.position.set(0, 0.04, -0.1); headG.add(bun);
  const tie = part(new THREE.TorusGeometry(0.022, 0.008, 8, 14), '#2a6fd0', { rough: 0.5 }); tie.rotation.x = Math.PI / 2.4; bun.add(tie);
  let seg = bun;
  for (let i = 0; i < 4; i++) {
    const sgrp = new THREE.Group(); sgrp.position.y = i ? -0.055 : -0.005; sgrp.rotation.x = i ? 0.12 : 0.35; seg.add(sgrp);
    const m = part(limb(0.026 - i * 0.004, 0.022 - i * 0.004, 0.05), C.hair, hairM); sgrp.add(m);
    seg = sgrp;
  }

  const limbs = {};
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    // Arme: Schulter (Overall), Unterarm (Ärmel hochgekrempelt → Haut), Hand
    const sh = new THREE.Group(); sh.position.set(0.2 * s, 0.43, 0); spine.add(sh);
    const shoulder = part(new THREE.SphereGeometry(0.062, 16, 12), C.overall, F); sh.add(shoulder);
    const up = part(limb(0.058, 0.048, 0.24), C.overall, F); sh.add(up);
    const stripe = part(new THREE.CylinderGeometry(0.053, 0.053, 0.025, 16, 1, true), C.reflex, { rough: 0.35, emissive: '#ffffff', ei: 0.08 }); stripe.position.y = -0.17; sh.add(stripe);
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    const cuff = part(new THREE.TorusGeometry(0.046, 0.016, 8, 16), C.overallDark, F); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.02; el.add(cuff);
    const lo = part(limb(0.042, 0.033, 0.21), C.skin, { rough: 0.55 }); el.add(lo);
    const watch = s < 0 ? part(new THREE.CylinderGeometry(0.036, 0.036, 0.022, 14), '#1d1d1d', { rough: 0.4 }) : null;
    if (watch) { watch.position.y = -0.2; el.add(watch); }
    const hand = new THREE.Group(); hand.position.y = -0.25; el.add(hand);
    const palm = part(new RoundedBoxGeometry(0.07, 0.085, 0.032, 3, 0.014), C.skin, { rough: 0.55 }); palm.position.y = -0.035; hand.add(palm);
    const fingers = part(new RoundedBoxGeometry(0.066, 0.06, 0.028, 3, 0.012), C.skin, { rough: 0.55 }); fingers.position.set(0, -0.095, 0.006); fingers.rotation.x = 0.35; hand.add(fingers);
    const thumb = part(limb(0.013, 0.011, 0.045), C.skin, { rough: 0.55 }); thumb.position.set(-0.035 * s, -0.02, 0.02); thumb.rotation.set(0.4, 0, 0.5 * s); hand.add(thumb);
    // Beine
    const hip = new THREE.Group(); hip.position.set(0.09 * s, -0.04, 0); hips.add(hip);
    const th = part(limb(0.085, 0.064, 0.38), C.overall, F); hip.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.43; hip.add(kn);
    const sk = part(limb(0.064, 0.05, 0.34), C.overall, F); kn.add(sk);
    const pad = part(new RoundedBoxGeometry(0.11, 0.12, 0.03, 2, 0.012), C.overallDark, F); pad.position.set(0, -0.02, 0.055); kn.add(pad);
    const lstripe = part(new THREE.CylinderGeometry(0.058, 0.055, 0.03, 16, 1, true), C.reflex, { rough: 0.35, emissive: '#ffffff', ei: 0.08 }); lstripe.position.y = -0.22; kn.add(lstripe);
    const pocket = part(new RoundedBoxGeometry(0.03, 0.12, 0.09, 2, 0.01), C.overallDark, F); pocket.position.set(0.075 * s, -0.17, 0.0); hip.add(pocket);
    const ft = new THREE.Group(); ft.position.y = -0.41; kn.add(ft);
    const shaft = part(limb(0.058, 0.06, 0.09), C.boot, { rough: 0.55 }); shaft.position.y = 0.06; ft.add(shaft);
    const boot = part(new RoundedBoxGeometry(0.11, 0.09, 0.25, 3, 0.035), C.boot, { rough: 0.5 }); boot.position.set(0, -0.025, 0.045); ft.add(boot);
    const toe = part(new THREE.SphereGeometry(0.055, 14, 10), C.boot, { rough: 0.45 }); toe.scale.set(1, 0.75, 1); toe.position.set(0, -0.03, 0.14); ft.add(toe);
    const sole = part(new RoundedBoxGeometry(0.118, 0.03, 0.27, 2, 0.01), C.sole, { rough: 0.9 }); sole.position.set(0, -0.07, 0.05); ft.add(sole);
    for (let i = 0; i < 3; i++) { const lace = part(new THREE.BoxGeometry(0.06, 0.006, 0.01), '#c8b48a'); lace.position.set(0, 0.0 + i * 0.022, 0.1 - i * 0.03); lace.rotation.x = -0.7; ft.add(lace); }
    limbs['sh' + side] = sh; limbs['el' + side] = el; limbs['hip' + side] = hip; limbs['kn' + side] = kn; limbs['ft' + side] = ft;
  }

  // Stirnlampe / Taschenlampe (Lichtkegel nachts)
  const lamp = new THREE.SpotLight(0xfff1d6, 0, 26, 0.5, 0.5, 1.4);
  lamp.position.set(0.12, 0.45, 0.32); spine.add(lamp);
  lamp.target.position.set(0.12, -0.6, 4); spine.add(lamp.target);

  return { root, hips, spine, neck, bun, limbs, lamp };
}

export class Player {
  constructor(scene, camera, dom) {
    this.model = buildCharacter();
    scene.add(this.model.root);
    this.camera = camera;
    this.pos = new THREE.Vector3(0, 2, 0);
    this.vel = new THREE.Vector3();
    this.vy = 0;
    this.facing = 0;
    this.camYaw = Math.PI; this.camPitch = 0.28; this.camDist = 4.6;
    this.keys = {};
    this.enabled = true;
    this.zone = 'island';
    this.zoneBounds = null;  // {x0,x1,z0,z1,floor,ceil} im Innenraum
    this.animT = 0;
    this.speed = 0;
    this.grounded = true;
    this.inWater = 0;
    this.interactAnim = 0;
    this.camTarget = new THREE.Vector3();
    this.camPos = new THREE.Vector3();
    this.sitting = false;

    addEventListener('keydown', e => { this.keys[e.code] = true; });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    dom.addEventListener('mousemove', e => {
      if (!this.enabled) return;
      if (document.pointerLockElement === dom || this.dragging) {
        this.camYaw -= e.movementX * 0.0026 * this.sens;
        this.camPitch = clamp(this.camPitch + e.movementY * 0.0022 * this.sens, -0.35, 1.2);
      }
    });
    dom.addEventListener('mousedown', e => { if (e.button === 2 || e.button === 0) this.dragging = true; });
    addEventListener('mouseup', () => { this.dragging = false; });
    dom.addEventListener('contextmenu', e => e.preventDefault());
    dom.addEventListener('wheel', e => { this.camDist = clamp(this.camDist + Math.sign(e.deltaY) * 0.5, 2.4, 8); }, { passive: true });
    this.sens = 1;
  }

  groundAt(x, z) {
    if (this.zone !== 'island') return this.zoneBounds?.floor ?? 0;
    return heightAt(x, z);
  }

  teleport(x, y, z, facing) {
    this.pos.set(x, y ?? this.groundAt(x, z), z);
    if (facing !== undefined) { this.facing = facing; this.camYaw = facing + Math.PI; }
    this.vy = 0;
    this.snapCamera = true;
  }

  update(dt, stats) {
    const k = this.keys;
    let ix = 0, iz = 0;
    if (this.enabled) {
      if (k.KeyW || k.ArrowUp) iz += 1;
      if (k.KeyS || k.ArrowDown) iz -= 1;
      if (k.KeyA || k.ArrowLeft) ix += 1;
      if (k.KeyD || k.ArrowRight) ix -= 1;
    }
    const moving = ix || iz;
    const exhausted = stats && stats.energy < 8;
    const run = (k.ShiftLeft || k.ShiftRight) && !exhausted;
    const ground = this.groundAt(this.pos.x, this.pos.z);
    const depth = this.zone === 'island' ? Math.max(0, -ground) : 0;
    this.inWater = depth;
    let target = moving ? (run ? 6.6 : 3.9) : 0;
    if (depth > 0.2) target *= 0.6;
    if (exhausted) target *= 0.75;
    this.speed = lerp(this.speed, target, Math.min(1, dt * 8));
    if (moving) {
      // Bewegung relativ zur Kamera
      const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw), rx = -fz, rz = fx;
      const dirX = fx * iz - rx * ix, dirZ = fz * iz - rz * ix;
      const len = Math.hypot(dirX, dirZ) || 1;
      const want = Math.atan2(dirX / len, dirZ / len);
      let d = want - this.facing; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * Math.min(1, dt * 12);
    }
    const nx = this.pos.x + Math.sin(this.facing) * this.speed * dt;
    const nz = this.pos.z + Math.cos(this.facing) * this.speed * dt;
    const np = { x: nx, z: nz };
    if (this.zone === 'island') {
      // Nicht ins tiefe Wasser
      if (heightAt(nx, nz) > -1.25 || heightAt(nx, nz) > ground) { this.pos.x = nx; this.pos.z = nz; }
    } else { this.pos.x = nx; this.pos.z = nz; }
    np.x = this.pos.x; np.z = this.pos.z;
    colliders.resolve(np, 0.32);
    this.pos.x = np.x; this.pos.z = np.z;
    if (this.zoneBounds) {
      const b = this.zoneBounds;
      this.pos.x = clamp(this.pos.x, b.x0 + 0.35, b.x1 - 0.35); this.pos.z = clamp(this.pos.z, b.z0 + 0.35, b.z1 - 0.35);
    }

    // Springen und Schwerkraft
    const g = this.groundAt(this.pos.x, this.pos.z);
    if (this.enabled && k.Space && this.grounded && depth < 0.5) { this.vy = 4.6; this.grounded = false; }
    this.vy -= 13 * dt;
    this.pos.y += this.vy * dt;
    const floor = Math.max(g, this.zone === 'island' ? -0.65 : g);
    if (this.pos.y <= floor) { this.pos.y = floor; this.vy = 0; this.grounded = true; }

    this.animate(dt, run && moving);
    this.updateCamera(dt);
    return { moving: this.speed > 0.5, running: run && this.speed > 4.5, depth };
  }

  animate(dt, running) {
    const m = this.model, L = m.limbs;
    m.root.position.copy(this.pos);
    if (this.inWater > 0.3) m.root.position.y = Math.max(this.pos.y, -0.55);
    m.root.rotation.y = this.facing;
    const sp = this.speed;
    this.animT += dt * (sp > 0.3 ? 2.2 + sp * 1.25 : 1.5);
    const t = this.animT;
    const amp = clamp(sp / 4, 0, 1.25);
    const sw = Math.sin(t) * 0.75 * amp;
    L.hipL.rotation.x = sw; L.hipR.rotation.x = -sw;
    L.knL.rotation.x = Math.max(0, -Math.sin(t + 1.2)) * 1.1 * amp;
    L.knR.rotation.x = Math.max(0, Math.sin(t + 1.2)) * 1.1 * amp;
    L.ftL.rotation.x = -L.knL.rotation.x * 0.3; L.ftR.rotation.x = -L.knR.rotation.x * 0.3;
    const breathe = Math.sin(t * 0.8) * 0.02;
    const reach = this.interactAnim;
    L.shL.rotation.x = -sw * 0.8 - reach * 1.2; L.shR.rotation.x = sw * 0.8 - reach * 1.3;
    L.shL.rotation.z = -0.12 - breathe; L.shR.rotation.z = 0.12 + breathe;
    L.elL.rotation.x = -0.25 - amp * 0.5 - reach * 0.3; L.elR.rotation.x = -0.25 - amp * 0.5 - reach * 0.3;
    m.hips.position.y = 0.95 + Math.abs(Math.cos(t)) * 0.05 * amp - (this.sitting ? 0.45 : 0) + breathe * 0.3;
    m.spine.rotation.x = (running ? 0.22 : 0.06 * amp) + reach * 0.25;
    m.spine.rotation.y = Math.sin(t) * 0.08 * amp;
    m.bun.rotation.x = Math.sin(t * 2) * 0.2 * amp + 0.1;
    m.neck.rotation.x = -m.spine.rotation.x * 0.6;
    this.interactAnim = Math.max(0, this.interactAnim - dt * 2.2);
  }

  updateCamera(dt) {
    const target = this.camTarget.set(this.pos.x, this.pos.y + 1.55, this.pos.z);
    const d = this.camDist * (this.zone === 'island' ? 1 : 0.8);
    const cp = Math.cos(this.camPitch);
    const want = new THREE.Vector3(
      target.x + Math.sin(this.camYaw) * cp * d,
      target.y + Math.sin(this.camPitch) * d,
      target.z + Math.cos(this.camYaw) * cp * d);
    // Schulterversatz
    const side = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw)).multiplyScalar(0.45);
    want.add(side);
    if (this.zone === 'island') {
      const gh = heightAt(want.x, want.z) + 0.5;
      if (want.y < gh) want.y = gh;
      if (want.y < 0.35) want.y = 0.35;
    } else if (this.zoneBounds) {
      const b = this.zoneBounds;
      want.x = clamp(want.x, b.x0 + 0.3, b.x1 - 0.3); want.z = clamp(want.z, b.z0 + 0.3, b.z1 - 0.3);
      want.y = clamp(want.y, b.floor + 0.4, b.ceil - 0.3);
    }
    if (this.snapCamera) { this.camPos.copy(want); this.snapCamera = false; }
    else this.camPos.lerp(want, 1 - Math.exp(-dt * 12));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(target.x + side.x, target.y, target.z + side.z);
  }
}
