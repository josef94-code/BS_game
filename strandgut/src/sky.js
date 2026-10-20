import * as THREE from 'three';
import { clamp, smoothstep, lerp, rng } from './noise.js';

// Tageszeit, Sonne, Mond, Wolken, Regen, Blitze
export class Environment {
  constructor(scene, renderer, quality) {
    this.scene = scene;
    this.renderer = renderer;
    this.time = 14.5;      // Uhrzeit in Stunden
    this.storm = 0;        // 0..1
    this.stormTarget = 0;
    this.lightning = 0;
    this.indoor = false;

    this.sky = makeSky(4500);
    scene.add(this.sky);

    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = quality !== 'low';
    const sm = quality === 'high' ? 4096 : 2048;
    this.sun.shadow.mapSize.set(sm, sm);
    const sc = this.sun.shadow.camera, ext = quality === 'high' ? 55 : 40;
    sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 300;
    this.sun.shadow.radius = 3; this.sun.shadow.blurSamples = 12;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xbfdcff, 0x6b5a3a, 1.1);
    scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0x223355, 0.0);
    scene.add(this.ambient);

    scene.fog = new THREE.Fog(0xcfe6f5, 120, 1300);

    // Sterne
    const r = rng(42), N = 1400, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, y = Math.abs(u);
      const s = Math.sqrt(1 - y * y);
      pos.set([Math.cos(th) * s * 2000, y * 2000 + 40, Math.sin(th) * s * 2000], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
    scene.add(this.stars);

    // Mond
    const moonTex = makeGlowTexture('#f4f1e6');
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, transparent: true, depthWrite: false }));
    this.moon.scale.setScalar(160);
    scene.add(this.moon);

    // Wolkenkuppel
    this.cloudU = {
      uTime: { value: 0 }, uCover: { value: 0.35 }, uSun: { value: new THREE.Vector3() },
      uSunCol: { value: new THREE.Color() }, uDark: { value: new THREE.Color() }, uLight: { value: 1 }, uFlash: { value: 0 },
    };
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: this.cloudU, transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uCover, uLight, uFlash; uniform vec3 uSun, uSunCol, uDark; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; }
        void main(){
          if (vDir.y < 0.0) discard;
          vec2 uv = vDir.xz / (vDir.y + 0.12) * 1.4;
          uv += vec2(uTime * 0.012, uTime * 0.004);
          float d = fbm(uv);
          float c = smoothstep(1.0 - uCover - 0.18, 1.0 - uCover + 0.22, d);
          float shade = fbm(uv + uSun.xz * 0.08);
          float sunAmt = pow(max(dot(normalize(vDir), uSun), 0.0), 6.0);
          vec3 col = mix(uDark, uSunCol, clamp(1.0 - (shade - d) * 3.0, 0.0, 1.0) * 0.8 + 0.2);
          col += uSunCol * sunAmt * 0.4;
          col *= uLight;
          col += vec3(0.75, 0.8, 1.0) * uFlash * c;
          float a = c * smoothstep(0.0, 0.18, vDir.y) * 0.95;
          gl_FragColor = vec4(col, a);
          #include <colorspace_fragment>
        }`,
    });
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16), cloudMat);
    this.clouds.renderOrder = -1;
    scene.add(this.clouds);

    // Regen
    const RN = quality === 'low' ? 1500 : 4000;
    const rp = new Float32Array(RN * 6);
    for (let i = 0; i < RN; i++) {
      const x = (r() - 0.5) * 60, y = r() * 30, z = (r() - 0.5) * 60;
      rp.set([x, y, z, x + 0.15, y - 0.9, z + 0.05], i * 6);
    }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.0, depthWrite: false }));
    this.rain.frustumCulled = false;
    scene.add(this.rain);
    this.rainBase = rp.slice();

    this._c = { sky: new THREE.Color(), hor: new THREE.Color(), tmp: new THREE.Color() };
    // Umgebungslicht (IBL) aus dem Himmel: eigene Mini-Szene, wird regelmäßig neu gefiltert
    this.useIBL = quality !== 'low';
    if (this.useIBL) {
      this.pmrem = new THREE.PMREMGenerator(renderer);
      this.envScene = new THREE.Scene();
      this.envSky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), this.sky.material); // gleiche Uniforms
      this.envScene.add(this.envSky);
      this.envGround = new THREE.Mesh(new THREE.CircleGeometry(400, 24), new THREE.MeshBasicMaterial({ color: '#6f7d5a' }));
      this.envGround.rotation.x = -Math.PI / 2; this.envGround.position.y = -8;
      this.envScene.add(this.envGround);
      this.envTimer = 0; this.envKey = '';
    }
    this.sunDir = new THREE.Vector3();
    this.flashTimer = 5;
    this.onThunder = null;
  }

  get dayLight() { return smoothstep(-0.12, 0.25, this.sunDir.y); }
  get isNight() { return this.time < 5.8 || this.time > 19.6; }

  update(dt, center, camera, waterU, elapsed) {
    // Sonnenstand aus Uhrzeit (Aufgang 6 Uhr, Untergang 19 Uhr)
    const dayFrac = (this.time - 6) / 13;
    const ang = dayFrac * Math.PI;
    this.sunDir.set(-Math.cos(ang) * 0.75, Math.sin(ang), -0.42).normalize();
    if (this.sunDir.y < -0.05) this.sunDir.y = Math.max(this.sunDir.y, -0.4);
    this.storm = lerp(this.storm, this.stormTarget, Math.min(1, dt * 0.25));
    const st = this.storm;


    const day = this.dayLight;
    const golden = smoothstep(0.42, 0.04, this.sunDir.y) * smoothstep(-0.14, 0.02, this.sunDir.y);
    const sunCol = this._c.tmp.setRGB(1, lerp(0.96, 0.62, golden), lerp(0.88, 0.38, golden));
    this.sun.color.copy(sunCol);
    this.sun.intensity = 3.2 * day * (1 - st * 0.75);
    const lightDir = this.sunDir.y > 0 ? this.sunDir : this._moonDir();
    this.sun.position.copy(center).addScaledVector(lightDir, 120);
    this.sun.target.position.copy(center);
    if (this.sunDir.y <= 0) { this.sun.intensity = 0.35 * (1 - st * 0.6); this.sun.color.setRGB(0.6, 0.7, 1.0); }

    this.hemi.intensity = lerp(0.18, 1.15, day) * (1 - st * 0.35);
    this.hemi.color.setRGB(lerp(0.25, 0.75, day), lerp(0.32, 0.86, day), lerp(0.55, 1.0, day));
    this.hemi.groundColor.setRGB(lerp(0.1, 0.42, day), lerp(0.1, 0.36, day), lerp(0.14, 0.24, day));

    // Himmels- und Nebelfarben
    const skyC = this._c.sky.setRGB(lerp(0.02, 0.45, day), lerp(0.04, 0.68, day), lerp(0.1, 0.92, day));
    const horC = this._c.hor.setRGB(lerp(0.05, 0.8, day), lerp(0.07, 0.86, day), lerp(0.14, 0.92, day));
    horC.lerp(new THREE.Color(1.0, 0.62, 0.38), golden * 0.7);
    const grey = new THREE.Color(0.42, 0.46, 0.5).multiplyScalar(lerp(0.15, 1, day));
    skyC.lerp(grey, st * 0.85); horC.lerp(grey, st * 0.9);
    this.scene.fog.color.copy(horC);
    // Himmelskuppel
    const su = this.sky.material.uniforms;
    su.uSun.value.copy(this.sunDir);
    su.uZenith.value.setRGB(lerp(0.004, 0.09, day), lerp(0.008, 0.27, day), lerp(0.025, 0.78, day)).lerp(new THREE.Color(0.22, 0.24, 0.45), golden * 0.5);
    su.uHorizon.value.setRGB(lerp(0.02, 0.66, day), lerp(0.03, 0.82, day), lerp(0.07, 1.0, day)).lerp(new THREE.Color(1.4, 0.58, 0.26), golden);
    su.uSunCol.value.copy(sunCol).multiplyScalar(day);
    su.uGolden.value = golden; su.uStorm.value = st;
    su.uGrey.value.setRGB(0.4, 0.43, 0.48).multiplyScalar(lerp(0.08, 1, day));
    this.scene.fog.near = lerp(120, 25, st);
    this.scene.fog.far = lerp(1300, 260, st);
    this.renderer.toneMappingExposure = lerp(0.42, 0.62, day) * (1 - st * 0.2);

    this.stars.material.opacity = smoothstep(0.05, -0.15, this.sunDir.y) * (1 - st);
    this.stars.position.copy(camera.position);
    const md = this._moonDir();
    this.moon.position.copy(camera.position).addScaledVector(md, 1900);
    this.moon.material.opacity = smoothstep(0.1, -0.1, this.sunDir.y) * (1 - st * 0.9) * smoothstep(-0.05, 0.1, md.y);
    this.sky.visible = true;

    // IBL neu berechnen, wenn sich Licht deutlich geändert hat
    if (this.useIBL) {
      this.envTimer -= dt;
      const key = (this.sunDir.y * 20 | 0) + ':' + (this.sunDir.x * 10 | 0) + ':' + (st * 8 | 0);
      if (this.envTimer <= 0 && key !== this.envKey) {
        this.envTimer = 1.0; this.envKey = key;
        this.envGround.material.color.setRGB(0.35 * day + 0.02, 0.38 * day + 0.02, 0.3 * day + 0.03);
        const old = this.envRT;
        this.envRT = this.pmrem.fromScene(this.envScene, 0, 1, 1000);
        this.scene.environment = this.envRT.texture;
        if (old) old.dispose();
      }
      this.scene.environmentIntensity = lerp(0.08, 0.9, day) * (1 - st * 0.4);
      this.hemi.intensity *= 0.35;
    }

    // Wolken
    this.clouds.position.copy(camera.position);
    const cu = this.cloudU;
    cu.uTime.value = elapsed * (1 + st * 4);
    cu.uCover.value = lerp(0.32, 0.92, st);
    cu.uSun.value.copy(this.sunDir);
    cu.uSunCol.value.copy(sunCol).lerp(new THREE.Color(0.5, 0.52, 0.56), st);
    cu.uDark.value.setRGB(0.55, 0.58, 0.66).lerp(new THREE.Color(0.18, 0.2, 0.24), st);
    cu.uLight.value = lerp(0.08, 1.0, day);

    // Blitze
    this.lightning = Math.max(0, this.lightning - dt * 3);
    if (st > 0.6) {
      this.flashTimer -= dt;
      if (this.flashTimer < 0) {
        this.lightning = 1; this.flashTimer = 4 + Math.random() * 9;
        if (this.onThunder) setTimeout(() => this.onThunder(), 400 + Math.random() * 1500);
      }
    }
    const fl = this.lightning > 0.6 ? 1 : this.lightning * 0.6;
    cu.uFlash.value = fl;
    this.ambient.intensity = fl * 2.5;
    this.ambient.color.setRGB(0.7, 0.75, 1);

    // Regen folgt der Kamera
    const rainAmt = smoothstep(0.35, 0.8, st);
    this.rain.material.opacity = rainAmt * 0.55 * (this.indoor ? 0 : 1);
    this.rain.visible = rainAmt > 0.01 && !this.indoor;
    if (this.rain.visible) {
      const p = this.rain.geometry.attributes.position.array, b = this.rainBase;
      const fall = (elapsed * 28) % 30;
      for (let i = 0; i < p.length; i += 3) {
        let y = b[i + 1] - fall; if (y < 0) y += 30;
        p[i] = b[i] + camera.position.x; p[i + 1] = y + camera.position.y - 12; p[i + 2] = b[i + 2] + camera.position.z;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    // Wasser
    waterU.uTime.value = elapsed;
    waterU.uStorm.value = st;
    waterU.uSunDir.value.copy(this.sunDir);
    waterU.uSunColor.value.copy(sunCol).multiplyScalar(day * (1 - st));
    waterU.uSkyColor.value.copy(skyC);
    waterU.uHorizon.value.copy(horC);
    waterU.uLight.value = lerp(0.12, 1, day) * (1 - st * 0.4) + fl * 0.5;
    waterU.uDeep.value.set('#0b4a6e').lerp(new THREE.Color('#1d2f3a'), st);
    waterU.uShallow.value.set('#2fc6c0').lerp(new THREE.Color('#4f7f80'), st);
  }

  _moonDir() {
    const a = ((this.time + 12 - 6) / 13) * Math.PI;
    return new THREE.Vector3(-Math.cos(a) * 0.6, Math.max(0.25, Math.sin(a)), 0.5).normalize();
  }
}

// Himmelskuppel mit Farbverlauf, Sonnenscheibe und Abendrot
function makeSky(R) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSun: { value: new THREE.Vector3(0, 1, 0) }, uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() }, uGrey: { value: new THREE.Color() }, uGolden: { value: 0 }, uStorm: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz); vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position,1.0)).xyz, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uZenith, uHorizon, uSunCol, uGrey; uniform float uGolden, uStorm; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.48));
        if (h < 0.0) col = mix(uHorizon, uHorizon * 0.55, clamp(-h * 4.0, 0.0, 1.0));
        float sd = max(dot(d, uSun), 0.0);
        // Dunst um die Sonne, Abendrot in Sonnenrichtung
        float horizonBand = exp(-abs(h) * 6.0);
        col += uSunCol * (pow(sd, 5.0) * (0.25 + uGolden * 0.9) * (0.5 + horizonBand) + pow(sd, 90.0) * 0.9);
        col += uSunCol * smoothstep(0.99955, 0.99985, sd) * 40.0 * (1.0 - uStorm);
        col *= 1.35;
        col = mix(col, uGrey, uStorm * 0.88);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24), mat);
  m.frustumCulled = false; m.renderOrder = -2;
  return m;
}

export function makeGlowTexture(color) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, color); gr.addColorStop(0.28, color); gr.addColorStop(0.34, 'rgba(255,255,240,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
