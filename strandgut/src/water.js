import * as THREE from 'three';
import { waterNormal, foamTexture } from './textures.js';

// Gleiche Wellenformel wie im Shader, damit das Boot passend schaukelt
const WAVES = [
  [0.9, 0.3, 0.035, 0.18, 0.9],
  [-0.4, 1.0, 0.05, 0.10, 1.3],
  [0.6, -0.8, 0.09, 0.06, 1.7],
];
export function waveHeight(x, z, t, storm = 0) {
  let h = 0;
  for (const [dx, dz, k, a, s] of WAVES) h += Math.sin((x * dx + z * dz) * k + t * s) * a * (1 + storm * 1.8);
  return h;
}

export function buildWater(heightTex, extent, quality = 'high') {
  const geo = new THREE.PlaneGeometry(3000, 3000, 260, 260);
  geo.rotateX(-Math.PI / 2);
  const reflect = quality !== 'low';
  const scale = quality === 'high' ? 0.75 : 0.5;
  const rt = reflect ? new THREE.WebGLRenderTarget(Math.round(innerWidth * scale), Math.round(innerHeight * scale), { type: THREE.HalfFloatType, samples: quality === 'high' ? 4 : 0 }) : null;
  const uniforms = {
    uTime: { value: 0 }, uStorm: { value: 0 },
    uHeight: { value: heightTex }, uExtent: { value: extent },
    uNormal: { value: waterNormal(quality === 'low' ? 256 : 512) }, uFoam: { value: foamTexture() },
    uReflect: { value: rt ? rt.texture : null }, uHasReflect: { value: reflect ? 1 : 0 },
    uTexMatrix: { value: new THREE.Matrix4() },
    uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2) }, uSunColor: { value: new THREE.Color(1, 0.95, 0.85) },
    uSkyColor: { value: new THREE.Color('#8ec5ea') }, uHorizon: { value: new THREE.Color('#cfe6f5') },
    uDeep: { value: new THREE.Color('#0a3f60') }, uShallow: { value: new THREE.Color('#2ec4bc') },
    uLight: { value: 1 },
    fogColor: { value: new THREE.Color() }, fogNear: { value: 0 }, fogFar: { value: 1 }, fogDensity: { value: 0 },
  };
  const waveGLSL = WAVES.map(([dx, dz, k, a, s]) =>
    `h += sin((p.x*${dx.toFixed(3)} + p.y*${dz.toFixed(3)})*${k.toFixed(3)} + uTime*${s.toFixed(3)}) * ${a.toFixed(3)} * (1.0 + uStorm*1.8);`).join('\n');
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, fog: true,
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uStorm; uniform mat4 uTexMatrix;
      varying vec3 vWorld; varying float vFogDepth; varying vec4 vMirror; varying float vCrest;
      float wave(vec2 p){ float h = 0.0; ${waveGLSL} return h; }
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        float h = wave(w.xz);
        w.y += h;
        vCrest = h;
        vWorld = w.xyz;
        vMirror = uTexMatrix * vec4(w.x, 0.0, w.z, 1.0);
        vec4 mv = viewMatrix * w;
        vFogDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uStorm, uExtent, uLight, uHasReflect;
      uniform sampler2D uHeight, uNormal, uFoam, uReflect;
      uniform vec3 uSunDir, uSunColor, uSkyColor, uHorizon, uDeep, uShallow;
      uniform vec3 fogColor; uniform float fogNear, fogFar;
      varying vec3 vWorld; varying float vFogDepth; varying vec4 vMirror; varying float vCrest;
      vec3 nmap(vec2 uv){ return texture2D(uNormal, uv).xzy * 2.0 - 1.0; }
      void main(){
        vec2 hv = vWorld.xz / uExtent + 0.5;
        float ground = -25.0;
        if (hv.x > 0.0 && hv.x < 1.0 && hv.y > 0.0 && hv.y < 1.0) ground = texture2D(uHeight, hv).r;
        float depth = max(vWorld.y - ground, 0.0);
        float dist = length(cameraPosition - vWorld);
        float t = uTime;
        // Normalen: drei bewegte Lagen der Normal-Map
        vec2 p = vWorld.xz;
        vec3 n1 = nmap(p * 0.045 + vec2(t * 0.012, t * 0.006));
        vec3 n2 = nmap(p * 0.11 + vec2(-t * 0.018, t * 0.014));
        vec3 n3 = nmap(p * 0.008 + vec2(t * 0.004, -t * 0.003));
        float detail = mix(1.0, 0.25, smoothstep(30.0, 400.0, dist));
        vec3 n = normalize(vec3((n1.x + n2.x * 0.7) * detail + n3.x * 0.8, 1.0 / (0.35 + uStorm * 0.5), (n1.z + n2.z * 0.7) * detail + n3.z * 0.8));
        vec3 V = normalize(cameraPosition - vWorld);
        float NV = max(dot(n, V), 0.0);
        float fres = 0.02 + 0.98 * pow(1.0 - NV, 5.0);
        // Spiegelung
        vec3 R = reflect(-V, n);
        vec3 sky = mix(uHorizon, uSkyColor, clamp(R.y * 2.5, 0.0, 1.0));
        vec3 refl = sky;
        if (uHasReflect > 0.5) {
          vec2 ruv = vMirror.xy / vMirror.w + n.xz * 0.035 * detail;
          vec4 rc = texture2D(uReflect, ruv);
          refl = mix(sky, rc.rgb, rc.a);
        }
        // Wasserkörper: Farbe nach Tiefe, Streuung auf Wellenkämmen
        float shallowK = exp(-depth * 0.45);
        vec3 body = mix(uDeep, uShallow, shallowK);
        body += vec3(0.0, 0.08, 0.07) * clamp(vCrest * 2.0, 0.0, 1.0) * (1.0 - uStorm);
        body *= uLight;
        vec3 col = mix(body, refl, fres);
        // Sonnenglanz
        vec3 H = normalize(uSunDir + V);
        float NH = max(dot(n, H), 0.0);
        float spec = pow(NH, 600.0) * 6.0 + pow(NH, 80.0) * 0.25;
        col += uSunColor * spec * step(0.0, uSunDir.y);
        // Schaum: Brandung an der Küste + Gischt im Sturm
        float fm = texture2D(uFoam, p * 0.18 + vec2(t * 0.02, 0.0)).r * 0.6 + texture2D(uFoam, p * 0.07 - vec2(0.0, t * 0.015)).r * 0.6;
        float bands = sin(depth * 5.5 - t * 1.4 + fm * 2.0) * 0.5 + 0.5;
        float shore = smoothstep(1.1, 0.0, depth);
        float foam = shore * smoothstep(0.45, 0.85, bands * 0.55 + fm * 0.6) + smoothstep(0.18, 0.0, depth) * 0.9 * fm;
        foam += uStorm * smoothstep(0.75, 1.1, fm + vCrest * 0.6) * 0.8;
        foam = clamp(foam, 0.0, 1.0);
        col = mix(col, vec3(0.92, 0.95, 0.96) * max(uLight, 0.12), foam * 0.9);
        // Transparenz im Flachwasser (Meeresgrund sichtbar)
        float alpha = clamp(1.0 - exp(-depth * 1.4) + fres * 0.6 + foam, 0.0, 1.0);
        alpha = mix(alpha, 1.0, smoothstep(60.0, 200.0, dist));
        float fogF = smoothstep(fogNear, fogFar, vFogDepth);
        col = mix(col, fogColor, fogF);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  mat.toneMapped = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  mesh.name = 'water';

  // ---------- Planare Spiegelung (nach three.js Reflector) ----------
  const mirrorCam = new THREE.PerspectiveCamera();
  const plane = new THREE.Plane(), normal = new THREE.Vector3(0, 1, 0), reflPos = new THREE.Vector3(), camPos = new THREE.Vector3();
  const rot = new THREE.Matrix4(), lookAt = new THREE.Vector3(), clipPlane = new THREE.Vector4(), view = new THREE.Vector3(), target = new THREE.Vector3(), q = new THREE.Vector4();
  const texM = uniforms.uTexMatrix.value;
  function renderReflection(renderer, scene, camera, hide = []) {
    if (!rt) return;
    camPos.setFromMatrixPosition(camera.matrixWorld);
    if (camPos.y < 0.05) return;
    reflPos.set(camPos.x, 0, camPos.z);
    view.subVectors(reflPos, camPos).reflect(normal).negate().add(reflPos);
    rot.extractRotation(camera.matrixWorld);
    lookAt.set(0, 0, -1).applyMatrix4(rot).add(camPos);
    target.subVectors(reflPos, lookAt).reflect(normal).negate().add(reflPos);
    mirrorCam.position.copy(view);
    mirrorCam.up.set(0, 1, 0).applyMatrix4(rot).reflect(normal);
    mirrorCam.lookAt(target);
    mirrorCam.far = camera.far;
    mirrorCam.updateMatrixWorld();
    mirrorCam.projectionMatrix.copy(camera.projectionMatrix);
    texM.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    texM.multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
    // Schräge Clip-Ebene: nur was über dem Wasser liegt
    plane.setFromNormalAndCoplanarPoint(normal, reflPos).applyMatrix4(mirrorCam.matrixWorldInverse);
    clipPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const pm = mirrorCam.projectionMatrix;
    q.x = (Math.sign(clipPlane.x) + pm.elements[8]) / pm.elements[0];
    q.y = (Math.sign(clipPlane.y) + pm.elements[9]) / pm.elements[5];
    q.z = -1.0; q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
    pm.elements[2] = clipPlane.x; pm.elements[6] = clipPlane.y; pm.elements[10] = clipPlane.z + 1.0 - 0.05; pm.elements[14] = clipPlane.w;
    mesh.visible = false;
    const vis = hide.map(o => o.visible); hide.forEach(o => o.visible = false);
    const prevRT = renderer.getRenderTarget(), prevShadow = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(rt);
    renderer.state.buffers.depth.setMask(true);
    renderer.clear();
    renderer.render(scene, mirrorCam);
    renderer.setRenderTarget(prevRT);
    renderer.shadowMap.autoUpdate = prevShadow;
    hide.forEach((o, i) => o.visible = vis[i]);
    mesh.visible = true;
  }
  function resize(w, h) { if (rt) rt.setSize(Math.round(w * scale), Math.round(h * scale)); }
  return { mesh, uniforms, renderReflection, resize };
}
