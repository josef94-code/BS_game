import * as THREE from 'three';

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

export function buildWater(heightTex, extent) {
  const geo = new THREE.PlaneGeometry(3000, 3000, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const uniforms = {
    uTime: { value: 0 },
    uStorm: { value: 0 },
    uHeight: { value: heightTex },
    uExtent: { value: extent },
    uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2) },
    uSunColor: { value: new THREE.Color(1, 0.95, 0.85) },
    uSkyColor: { value: new THREE.Color('#8ec5ea') },
    uHorizon: { value: new THREE.Color('#cfe6f5') },
    uDeep: { value: new THREE.Color('#0b4a6e') },
    uShallow: { value: new THREE.Color('#2fc6c0') },
    uLight: { value: 1 },
    fogColor: { value: new THREE.Color() },
    fogNear: { value: 0 }, fogFar: { value: 1 }, fogDensity: { value: 0 },
  };
  const waveGLSL = WAVES.map(([dx, dz, k, a, s]) =>
    `h += sin((p.x*${dx.toFixed(3)} + p.y*${dz.toFixed(3)})*${k.toFixed(3)} + uTime*${s.toFixed(3)}) * ${a.toFixed(3)} * (1.0 + uStorm*1.8);`).join('\n');
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, fog: true,
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uStorm;
      varying vec3 vWorld; varying float vFogDepth;
      float wave(vec2 p){ float h = 0.0; ${waveGLSL} return h; }
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += wave(w.xz);
        vWorld = w.xyz;
        vec4 mv = viewMatrix * w;
        vFogDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uStorm; uniform sampler2D uHeight; uniform float uExtent;
      uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uSkyColor; uniform vec3 uHorizon;
      uniform vec3 uDeep; uniform vec3 uShallow; uniform float uLight;
      uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
      varying vec3 vWorld; varying float vFogDepth;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      vec3 waterNormal(vec2 p){
        float t = uTime;
        vec2 g = vec2(0.0);
        g += vec2(cos(p.x*0.21+t*1.1), cos(p.y*0.17+t*0.9)) * 0.07;
        g += vec2(cos((p.x+p.y)*0.43+t*1.7), cos((p.x-p.y)*0.39+t*1.4)) * 0.05;
        g += vec2(cos(p.x*1.13-t*2.3+p.y*0.4), cos(p.y*1.27+t*2.1-p.x*0.3)) * 0.025;
        g += (vec2(vnoise(p*0.8+t*0.3), vnoise(p*0.8-t*0.25+7.0)) - 0.5) * 0.08;
        g *= 1.0 + uStorm * 1.5;
        float dist = length(cameraPosition.xz - p);
        g *= mix(0.18, 1.0, 1.0 - smoothstep(25.0, 260.0, dist));
        return normalize(vec3(-g.x, 1.0, -g.y));
      }
      void main(){
        vec2 uv = vWorld.xz / uExtent + 0.5;
        float ground = -20.0;
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) ground = texture2D(uHeight, uv).r;
        float depth = max(vWorld.y - ground, 0.0);
        vec3 n = waterNormal(vWorld.xz);
        vec3 V = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 5.0) * 0.65 + 0.03;
        vec3 water = mix(uShallow, uDeep, smoothstep(0.0, 6.0, depth));
        water *= uLight;
        vec3 refl = mix(uHorizon, uSkyColor, clamp(reflect(-V, n).y * 2.0, 0.0, 1.0));
        vec3 col = mix(water, refl, fres);
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(n, H), 0.0), 220.0) * 3.0 * step(0.0, uSunDir.y);
        col += uSunColor * spec;
        // Schaum an der Küste
        float shore = smoothstep(0.9, 0.0, depth);
        float bands = sin(depth * 7.0 - uTime * 1.6 + vnoise(vWorld.xz * 0.6) * 4.0) * 0.5 + 0.5;
        float foamN = vnoise(vWorld.xz * 1.7 + uTime * 0.4);
        float foam = shore * smoothstep(0.6, 0.95, bands * 0.6 + foamN * 0.6) * 0.8 + smoothstep(0.15, 0.0, depth) * 0.7;
        foam += uStorm * smoothstep(0.75, 0.95, vnoise(vWorld.xz * 0.35 + uTime * 0.5)) * 0.6;
        col = mix(col, vec3(0.95) * max(uLight, 0.15), clamp(foam, 0.0, 1.0) * 0.85);
        float alpha = clamp(0.55 + depth * 0.35 + fres + foam, 0.0, 1.0);
        float fogF = smoothstep(fogNear, fogFar, vFogDepth);
        col = mix(col, fogColor, fogF);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  mesh.name = 'water';
  return { mesh, uniforms };
}
