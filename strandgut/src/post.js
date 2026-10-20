import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

// Farbkorrektur nach dem Tone-Mapping: Kontrast, Sättigung, Vignette, leichte Farbstimmung
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1.12 }, uContrast: { value: 1.06 }, uVignette: { value: 0.28 }, uWarm: { value: 0.03 }, uDamage: { value: 0 }, uTime: { value: 0 }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uSunVis: { value: 0 }, uAspect: { value: 1.7 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uSat, uContrast, uVignette, uWarm, uDamage, uTime, uSunVis, uAspect; uniform vec2 uSun; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c = (c - 0.5) * uContrast + 0.5;
      // Lichter leicht warm, Schatten leicht kühl
      c += vec3(uWarm, uWarm * 0.4, -uWarm) * smoothstep(0.3, 1.0, l) + vec3(-uWarm, 0.0, uWarm) * 0.6 * smoothstep(0.5, 0.0, l);
      // Sonnenblendung und Linsenreflexe
      if (uSunVis > 0.0) {
        vec2 sd = (vUv - uSun) * vec2(uAspect, 1.0);
        float glow = exp(-length(sd) * 5.0) * 0.35 + exp(-length(sd) * 22.0) * 0.5;
        c += vec3(1.0, 0.9, 0.75) * glow * uSunVis;
        vec2 axis = vec2(0.5) - uSun;
        for (int i = 1; i <= 3; i++) {
          vec2 gp = uSun + axis * (0.6 + float(i) * 0.45);
          float g = smoothstep(0.06 + float(i) * 0.02, 0.0, length((vUv - gp) * vec2(uAspect, 1.0)));
          c += vec3(0.5, 0.75, 1.0) * g * 0.05 * uSunVis;
        }
      }
      vec2 d = vUv - 0.5;
      float vig = 1.0 - dot(d, d) * uVignette * 2.2;
      c *= vig;
      c = mix(c, c * vec3(1.0, 0.35, 0.3), uDamage * smoothstep(0.15, 0.7, length(d)));
      c += (hash(vUv * 731.0 + uTime) - 0.5) * 0.012; // feines Filmkorn gegen Banding
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

export class Post {
  constructor(renderer, scene, camera, quality) {
    this.renderer = renderer; this.quality = quality; this.enabled = quality !== 'low';
    if (!this.enabled) return;
    const w = innerWidth, h = innerHeight, pr = renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: quality === 'high' ? 0 : 4 });
    this.composer = new EffectComposer(renderer, rt);
    if (quality === 'high') {
      this.ao = new N8AOPass(scene, camera, w, h);
      Object.assign(this.ao.configuration, { aoRadius: 1.6, distanceFalloff: 0.6, intensity: 2.2, color: new THREE.Color(0, 0, 0), halfRes: false, gammaCorrection: false });
      this.ao.setQualityMode('Medium');
      this.composer.addPass(this.ao);
    } else {
      this.composer.addPass(new RenderPass(scene, camera));
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.45, 2.2);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    if (quality === 'high') { this.smaa = new SMAAPass(w * pr, h * pr); this.composer.addPass(this.smaa); }
  }
  setSun(x, y, vis, aspect) { if (!this.enabled) return; const u = this.grade.uniforms; u.uSun.value.set(x, y); u.uSunVis.value = vis; u.uAspect.value = aspect; }
  setCamera(camera) { if (this.ao) this.ao.camera = camera; }
  render(dt) {
    if (!this.enabled) return false;
    this.grade.uniforms.uTime.value = (this.grade.uniforms.uTime.value + 0.37) % 100;
    this.composer.render(dt);
    return true;
  }
  setSize(w, h) { if (this.enabled) this.composer.setSize(w, h); if (this.ao) this.ao.setSize(w, h); }
  // Bei Leistungsproblemen schrittweise abspecken
  degrade() {
    if (!this.enabled) return false;
    if (this.ao && this.ao.enabled) { this.ao.configuration.halfRes = true; this.ao.enabled = this.ao.enabled; this.ao.setQualityMode('Low'); this.aoReduced = (this.aoReduced || 0) + 1; if (this.aoReduced > 1) { this.ao.configuration.intensity = 0; } return true; }
    if (this.smaa && this.smaa.enabled) { this.smaa.enabled = false; return true; }
    return false;
  }
}
