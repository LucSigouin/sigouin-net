// Shader patches layered onto three's physically based materials, so custom effects keep
// proper lighting, shadows, fog and tone mapping.
import * as THREE from 'three';

export const globalUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  uNight: { value: 0 },
  /** World-space direction towards the sun, and its colour times intensity. */
  uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunColor: { value: new THREE.Color(1, 1, 1) },
};

/**
 * Sways vertices in world space; the bend grows with local height (position.y).
 * `translucency` > 0 marks foliage: the authored normals are kept on both faces (so a card
 * shades like part of the crown, not a flat sheet) and sunlight glows through from behind.
 */
export function applyWind(material: THREE.Material, bendHeight: number, amp: number, freq = 1.6, translucency = 0) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = globalUniforms.uTime;
    shader.uniforms.uWind = globalUniforms.uWind;
    shader.uniforms.uBendH = { value: bendHeight };
    shader.uniforms.uAmp = { value: amp };
    shader.uniforms.uFreq = { value: freq };
    if (translucency > 0) {
      shader.uniforms.uSunDir = globalUniforms.uSunDir;
      shader.uniforms.uSunColor = globalUniforms.uSunColor;
      shader.uniforms.uTrans = { value: translucency };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uSunDir, uSunColor; uniform float uTrans;')
        .replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''))
        .replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>
  vec3 sunV = normalize( ( viewMatrix * vec4( uSunDir, 0.0 ) ).xyz );
  float through = pow( clamp( dot( normalize( -vViewPosition ), sunV ), 0.0, 1.0 ), 3.0 );
  reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * ( through * 0.8 + 0.12 ) * uTrans * 0.35;`,
        );
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime, uWind, uBendH, uAmp, uFreq;')
      .replace(
        '#include <project_vertex>',
        `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
  vec4 wPos = modelMatrix * mvPosition;
  float bend = clamp( position.y / uBendH, 0.0, 1.0 );
  bend *= bend;
  float ph = uTime * uFreq + wPos.x * 0.21 + wPos.z * 0.17;
  float gust = sin( ph ) * 0.55 + sin( ph * 2.3 + wPos.x * 0.7 ) * 0.25 + sin( uTime * 0.37 + wPos.z * 0.05 ) * 0.45;
  wPos.x += gust * uAmp * uWind * bend;
  wPos.z += gust * uAmp * uWind * bend * 0.55;
  mvPosition = viewMatrix * wPos;
  gl_Position = projectionMatrix * mvPosition;`,
      );
  };
  material.customProgramCacheKey = () => (translucency > 0 ? 'foliage' : 'wind');
  return material;
}

/** Lets an emissive material brighten at night (lanterns, windows, screens). */
export function applyNightGlow(material: THREE.MeshStandardMaterial, day: number, night: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = globalUniforms.uNight;
    shader.uniforms.uGlow = { value: new THREE.Vector2(day, night) };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight; uniform vec2 uGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= mix(uGlow.x, uGlow.y, uNight);');
  };
  material.customProgramCacheKey = () => 'nightglow';
  return material;
}

const WATER_COMMON = /* glsl */ `
uniform float uTime;
uniform float uMode;
uniform vec3 uDeep;
uniform vec3 uFloorA;
uniform vec3 uFloorB;
uniform float uDepth;
varying vec3 vWPos;

float ringWave(vec2 p, float R, float k, float w, float a) {
  float r = length(p);
  float d = r - R;
  return a * sin(k * d - w * uTime) * exp(-abs(d) * 1.6);
}
float pointWave(vec2 p, vec2 c, float a) {
  float d = length(p - c);
  return a * sin(14.0 * d - 9.0 * uTime) * exp(-d * 2.2);
}
float waterHeight(vec2 p) {
  if (uMode < 0.5) {
    float h = ringWave(p, 1.95, 11.0, 6.0, 0.012) + ringWave(p, 1.18, 13.0, 7.0, 0.009);
    h += ringWave(p, 0.32, 16.0, 8.0, 0.006) + ringWave(p, 2.9, 9.0, 4.0, 0.003);
    for (int i = 0; i < 6; i++) {
      float a = float(i) * 1.0471976 + 0.5235988;
      h += pointWave(p, vec2(cos(a), sin(a)) * 1.95, 0.01);
    }
    h += sin(p.x * 3.1 + uTime * 1.3) * 0.002 + sin(p.y * 2.7 - uTime * 1.1) * 0.002;
    return h;
  }
  float h = 0.0;
  h += sin(dot(p, vec2(0.12, 0.05)) + uTime * 0.6) * 0.09;
  h += sin(dot(p, vec2(-0.07, 0.19)) + uTime * 0.8) * 0.06;
  h += sin(dot(p, vec2(0.31, -0.22)) + uTime * 1.3) * 0.025;
  h += sin(dot(p, vec2(-0.53, -0.41)) + uTime * 1.9) * 0.012;
  h += sin(dot(p, vec2(0.9, 0.7)) + uTime * 2.6) * 0.005;
  return h;
}
vec2 waterGrad(vec2 p) {
  float e = uMode < 0.5 ? 0.02 : 0.25;
  float h = waterHeight(p);
  return vec2(waterHeight(p + vec2(e, 0.0)) - h, waterHeight(p + vec2(0.0, e)) - h) / e;
}
float caustics(vec2 p) {
  vec2 q = p * 2.6;
  float c = 0.0;
  for (int i = 0; i < 3; i++) {
    q += vec2(sin(q.y * 1.3 + uTime * 0.9), cos(q.x * 1.1 - uTime * 0.7)) * 0.55;
    c += abs(sin(q.x + q.y));
  }
  return pow(max(1.0 - c / 3.0, 0.0), 3.0);
}
vec3 basinFloor(vec2 p) {
  vec2 g = abs(fract(p * 4.0) - 0.5);
  float grout = smoothstep(0.44, 0.49, max(g.x, g.y));
  float r = length(p);
  vec3 c = mix(uFloorA, uFloorB, smoothstep(1.2, 2.8, r));
  return mix(c, c * 0.72, grout);
}
`;

export function waterMaterial(mode: 'fountain' | 'lake') {
  const m = new THREE.MeshStandardMaterial({
    color: mode === 'fountain' ? 0x7fc4d8 : 0x2d6a86,
    roughness: mode === 'fountain' ? 0.03 : 0.06,
    metalness: 0,
    envMapIntensity: mode === 'fountain' ? 1.2 : 1.35,
  });
  const u = {
    uMode: { value: mode === 'fountain' ? 0 : 1 },
    uDeep: { value: new THREE.Color(mode === 'fountain' ? 0x2e8aa6 : 0x1d5872) },
    uFloorA: { value: new THREE.Color(0x9fd6e4) },
    uFloorB: { value: new THREE.Color(0x5fa9c4) },
    uDepth: { value: mode === 'fountain' ? 0.35 : 0 },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u, { uTime: globalUniforms.uTime });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + WATER_COMMON)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  vec2 wg = waterGrad(vWPos.xz);
  if (uMode < 0.5) {
    vec2 rp = vWPos.xz + wg * uDepth * 2.5;
    vec3 fl = basinFloor(rp) * (0.72 + caustics(rp) * 1.1);
    float edge = smoothstep(2.2, 3.0, length(vWPos.xz));
    diffuseColor.rgb = mix(fl, uDeep, 0.28 + edge * 0.25);
  } else {
    float far = smoothstep(40.0, 400.0, length(vWPos.xz - cameraPosition.xz));
    diffuseColor.rgb = mix(uDeep, uDeep * 1.25 + vec3(0.02, 0.04, 0.05), far);
  }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
  {
    float fade = uMode < 0.5 ? 1.0 : 1.0 - smoothstep(60.0, 700.0, length(vWPos.xz - cameraPosition.xz)) * 0.85;
    vec3 nW = normalize(vec3(-wg.x * fade, 1.0, -wg.y * fade));
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
  }`,
      );
  };
  m.customProgramCacheKey = () => 'water';
  return m;
}
