import * as THREE from 'three';
import { heightAt } from './terrain.js';
import { colliders } from './colliders.js';
import { clamp, lerp } from './noise.js';

function part(geo, color, opts = {}) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.75, metalness: opts.metal ?? 0 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10);

// Figur: Jana Brandl, Bordmechatronikerin – aus Grundkörpern gebaut, mit Gelenk-Hierarchie
export function buildCharacter() {
  const C = { overall: '#e8742a', overallDark: '#b8561c', skin: '#e0b08c', hair: '#4a2c1a', boot: '#2d2a28', belt: '#3a3631', reflex: '#e9eef0' };
  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
  const pelvis = part(new THREE.BoxGeometry(0.34, 0.2, 0.2), C.overall); hips.add(pelvis);
  const belt = part(new THREE.BoxGeometry(0.36, 0.06, 0.22), C.belt); belt.position.y = 0.09; hips.add(belt);
  const pouch = part(new THREE.BoxGeometry(0.1, 0.12, 0.06), C.belt); pouch.position.set(0.14, 0.02, 0.12); hips.add(pouch);

  const spine = new THREE.Group(); spine.position.y = 0.1; hips.add(spine);
  const torso = part(cap(0.17, 0.3), C.overall); torso.position.y = 0.26; torso.scale.set(1.05, 1, 0.75); spine.add(torso);
  const stripe = part(new THREE.BoxGeometry(0.37, 0.04, 0.27), C.reflex, { rough: 0.3 }); stripe.position.y = 0.3; spine.add(stripe);
  const stripe2 = stripe.clone(); stripe2.position.y = 0.2; spine.add(stripe2);
  const collar = part(new THREE.CylinderGeometry(0.09, 0.12, 0.08, 10), C.overallDark); collar.position.y = 0.52; spine.add(collar);

  const neck = new THREE.Group(); neck.position.y = 0.56; spine.add(neck);
  const head = part(new THREE.SphereGeometry(0.13, 16, 12), C.skin); head.position.y = 0.11; head.scale.set(0.92, 1.05, 1); neck.add(head);
  const hair = part(new THREE.SphereGeometry(0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), C.hair, { rough: 0.9 });
  hair.position.y = 0.125; hair.rotation.x = -0.25; hair.scale.set(0.95, 1.05, 1.05); neck.add(hair);
  const bun = new THREE.Group(); bun.position.set(0, 0.17, -0.12); neck.add(bun);
  const tail = part(cap(0.045, 0.16), C.hair, { rough: 0.9 }); tail.position.y = -0.1; bun.add(tail);
  const tie = part(new THREE.TorusGeometry(0.04, 0.012, 6, 10), '#2a6fd0'); tie.rotation.x = Math.PI / 2; bun.add(tie);
  // Gesicht: Augen
  for (const s of [-1, 1]) {
    const eye = part(new THREE.SphereGeometry(0.016, 8, 6), '#1b1b1b'); eye.position.set(0.045 * s, 0.13, 0.115); neck.add(eye);
  }
  const nose = part(new THREE.ConeGeometry(0.018, 0.04, 6), C.skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.1, 0.13); neck.add(nose);

  const limbs = {};
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    // Arme
    const sh = new THREE.Group(); sh.position.set(0.23 * s, 0.44, 0); spine.add(sh);
    const up = part(cap(0.058, 0.2), C.overall); up.position.y = -0.14; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
    const lo = part(cap(0.05, 0.18), C.overall); lo.position.y = -0.12; el.add(lo);
    const hand = part(new THREE.SphereGeometry(0.055, 10, 8), '#3b3b3b', { rough: 0.6 }); hand.position.y = -0.27; hand.scale.set(0.9, 1.1, 0.7); el.add(hand);
    // Beine
    const hip = new THREE.Group(); hip.position.set(0.1 * s, -0.05, 0); hips.add(hip);
    const th = part(cap(0.075, 0.28), C.overall); th.position.y = -0.21; hip.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.43; hip.add(kn);
    const sk = part(cap(0.065, 0.28), C.overall); sk.position.y = -0.2; kn.add(sk);
    const pad = part(new THREE.BoxGeometry(0.11, 0.1, 0.05), C.overallDark); pad.position.set(0, -0.01, 0.06); kn.add(pad);
    const ft = new THREE.Group(); ft.position.y = -0.42; kn.add(ft);
    const boot = part(new THREE.BoxGeometry(0.12, 0.1, 0.25), C.boot, { rough: 0.6 }); boot.position.set(0, -0.03, 0.05); ft.add(boot);
    limbs['sh' + side] = sh; limbs['el' + side] = el; limbs['hip' + side] = hip; limbs['kn' + side] = kn; limbs['ft' + side] = ft;
  }
  // Rucksack
  const pack = part(new THREE.BoxGeometry(0.28, 0.34, 0.14), '#36505f'); pack.position.set(0, 0.28, -0.17); spine.add(pack);
  const roll = part(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10), '#6d7d4a'); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.48, -0.17); spine.add(roll);

  // Taschenlampe (Lichtkegel nachts)
  const lamp = new THREE.SpotLight(0xfff1d6, 0, 24, 0.5, 0.5, 1.4);
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
