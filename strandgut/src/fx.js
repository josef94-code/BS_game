import * as THREE from 'three';
import { heightAt, islandRadius } from './terrain.js';
import { particleTexture } from './textures.js';
import { rng } from './noise.js';

// Partikel und Leben: Möwen, Gischt, Funken, Rauch, Glühwürmchen, Staub, Sonnen-Linsenreflex
export class FX {
  constructor(scene, env, quality) {
    this.scene = scene; this.env = env; this.q = quality;
    const r = this.r = rng(99);
    const soft = particleTexture('soft'), smoke = particleTexture('smoke');

    // ---- Möwen: einfache Körper mit schlagenden Flügeln ----
    this.gulls = [];
    const body = new THREE.CapsuleGeometry(0.09, 0.35, 4, 8); body.rotateX(Math.PI / 2);
    const wingG = new THREE.BufferGeometry();
    wingG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.12, 0, 0, -0.12, 0.75, 0.02, -0.05, 0, 0, -0.12, 0.75, 0.02, -0.05, 0.85, 0.0, -0.18]), 3));
    wingG.computeVertexNormals();
    const white = new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.8, side: THREE.DoubleSide });
    const grey = new THREE.MeshStandardMaterial({ color: '#9aa3ab', roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < (quality === 'low' ? 5 : 12); i++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(body, white));
      const wl = new THREE.Mesh(wingG, grey), wr = new THREE.Mesh(wingG, grey); wr.scale.x = -1;
      g.add(wl, wr);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 5), new THREE.MeshStandardMaterial({ color: '#e8b33a' })); beak.rotation.x = Math.PI / 2; beak.position.z = 0.28; g.add(beak);
      g.userData = { wl, wr, cx: (r() - 0.5) * 200, cz: (r() - 0.5) * 200, rad: 30 + r() * 60, h: 14 + r() * 22, sp: (0.15 + r() * 0.15) * (r() < 0.5 ? 1 : -1), ph: r() * 6.28, flap: r() * 6 };
      scene.add(g); this.gulls.push(g);
    }

    // ---- Punkt-Partikel-Systeme ----
    const pts = (n, tex, size, color, blending = THREE.AdditiveBlending) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const m = new THREE.Points(geo, new THREE.PointsMaterial({ map: tex, size, color, transparent: true, depthWrite: false, blending, sizeAttenuation: true }));
      m.frustumCulled = false; scene.add(m); return m;
    };
    // Funken und Rauch am Lagerfeuer
    this.sparks = pts(40, soft, 0.12, '#ffb04a'); this.sparkData = [];
    for (let i = 0; i < 40; i++) this.sparkData.push({ t: r() * 2, life: 1 + r() * 1.2, vx: (r() - 0.5) * 0.4, vz: (r() - 0.5) * 0.4, vy: 1.2 + r() * 1.5 });
    this.smoke = pts(30, smoke, 1.6, '#9a9a9a', THREE.NormalBlending); this.smoke.material.opacity = 0.35; this.smokeData = [];
    for (let i = 0; i < 30; i++) this.smokeData.push({ t: r() * 4, life: 3 + r() * 2, vx: (r() - 0.5) * 0.2, vz: (r() - 0.5) * 0.2 });
    // Glühwürmchen nachts
    this.flies = pts(80, soft, 0.18, '#d8ff7a'); this.flyData = [];
    for (let i = 0; i < 80; i++) {
      let x, z, h, k = 0;
      do { x = (r() - 0.5) * 200; z = (r() - 0.5) * 200; h = heightAt(x, z); } while ((h < 2.5 || h > 16) && k++ < 50);
      this.flyData.push({ x, z, y: h + 0.5 + r() * 2, ph: r() * 6.28 });
    }
    // Gischt an der Küste
    const SN = quality === 'low' ? 150 : 500;
    this.spray = pts(SN, soft, 0.5, '#ffffff', THREE.NormalBlending); this.spray.material.opacity = 0.5; this.sprayData = [];
    for (let i = 0; i < SN; i++) this.sprayData.push(this._sprayPoint());
    // Staub im Wrack
    this.dust = pts(300, soft, 0.05, '#ffe8c8'); this.dustData = [];
    for (let i = 0; i < 300; i++) this.dustData.push({ x: (r() - 0.5) * 11, y: r() * 5, z: -8 + r() * 32, ph: r() * 6.28 });
    this.dust.visible = false;

  }

  _sprayPoint() {
    const a = this.r() * Math.PI * 2, R = islandRadius(a) - 2 + this.r() * 4;
    return { x: Math.cos(a) * R, z: Math.sin(a) * R, t: this.r() * 2, life: 0.8 + this.r() * 1.2, vy: 0.5 + this.r() * 1.2 };
  }

  update(dt, t, ctx) {
    const { camera, fire, fireLit, indoor, interiorOrigin } = ctx;
    const env = this.env, night = env.isNight, storm = env.storm;
    // Möwen (nicht bei Sturm und nachts)
    const gullsOn = !indoor && !night && storm < 0.5;
    for (const g of this.gulls) {
      g.visible = gullsOn;
      if (!gullsOn) continue;
      const u = g.userData; u.ph += u.sp * dt;
      const x = u.cx + Math.cos(u.ph) * u.rad, z = u.cz + Math.sin(u.ph) * u.rad, y = u.h + Math.sin(u.ph * 3) * 2;
      g.position.set(x, y, z);
      g.rotation.y = Math.atan2(-Math.sin(u.ph) * u.sp, Math.cos(u.ph) * u.sp) ;
      g.rotation.z = -u.sp * 2;
      u.flap += dt * (Math.sin(t * 0.3 + u.ph) > 0.3 ? 9 : 0.5);
      const f = Math.sin(u.flap) * 0.6;
      u.wl.rotation.z = f; u.wr.rotation.z = -f;
    }
    // Feuer
    const fp = fire.position;
    this.sparks.visible = this.smoke.visible = fireLit && !indoor;
    if (fireLit) {
      const a = this.sparks.geometry.attributes.position.array;
      this.sparkData.forEach((s, i) => {
        s.t += dt; if (s.t > s.life) { s.t = 0; }
        const k = s.t;
        a[i * 3] = fp.x + s.vx * k + Math.sin(k * 6 + i) * 0.05; a[i * 3 + 1] = fp.y + 0.4 + s.vy * k; a[i * 3 + 2] = fp.z + s.vz * k;
      });
      this.sparks.geometry.attributes.position.needsUpdate = true;
      const b = this.smoke.geometry.attributes.position.array;
      this.smokeData.forEach((s, i) => {
        s.t += dt; if (s.t > s.life) s.t = 0;
        const k = s.t;
        b[i * 3] = fp.x + s.vx * k + k * 0.25; b[i * 3 + 1] = fp.y + 0.8 + k * 0.9; b[i * 3 + 2] = fp.z + s.vz * k;
      });
      this.smoke.geometry.attributes.position.needsUpdate = true;
    }
    // Glühwürmchen
    this.flies.visible = night && !indoor && storm < 0.3;
    if (this.flies.visible) {
      const a = this.flies.geometry.attributes.position.array;
      this.flyData.forEach((f, i) => { a[i * 3] = f.x + Math.sin(t * 0.5 + f.ph) * 1.5; a[i * 3 + 1] = f.y + Math.sin(t * 0.8 + f.ph * 2) * 0.4; a[i * 3 + 2] = f.z + Math.cos(t * 0.4 + f.ph) * 1.5; });
      this.flies.geometry.attributes.position.needsUpdate = true;
      this.flies.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
    }
    // Gischt
    this.spray.visible = !indoor;
    if (this.spray.visible) {
      const a = this.spray.geometry.attributes.position.array;
      const k = 1 + storm * 2;
      this.sprayData.forEach((s, i) => {
        s.t += dt * k;
        if (s.t > s.life) Object.assign(s, this._sprayPoint(), { t: 0 });
        const y = s.vy * s.t - 1.2 * s.t * s.t;
        a[i * 3] = s.x; a[i * 3 + 1] = Math.max(0, y * (0.6 + storm)) + 0.05; a[i * 3 + 2] = s.z;
      });
      this.spray.geometry.attributes.position.needsUpdate = true;
      this.spray.material.opacity = 0.25 + storm * 0.4;
      this.spray.material.color.setScalar(Math.max(0.15, env.dayLight));
    }
    // Staub im Wrack
    this.dust.visible = indoor;
    if (indoor) {
      const a = this.dust.geometry.attributes.position.array;
      this.dustData.forEach((d, i) => { a[i * 3] = interiorOrigin.x + d.x + Math.sin(t * 0.2 + d.ph) * 0.3; a[i * 3 + 1] = d.y + Math.sin(t * 0.15 + d.ph * 3) * 0.3; a[i * 3 + 2] = interiorOrigin.z + d.z + Math.cos(t * 0.17 + d.ph) * 0.3; });
      this.dust.geometry.attributes.position.needsUpdate = true;
    }
  }
}
