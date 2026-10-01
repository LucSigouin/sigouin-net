// Post chain: render (MSAA) → far-background depth of field → bloom → ACES + sRGB output.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Quality } from './quality';

const FarDof = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 4000 },
    uTexel: { value: new THREE.Vector2() },
    uMax: { value: 2.2 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `
    #include <packing>
    uniform sampler2D tDiffuse, tDepth;
    uniform float cameraNear, cameraFar, uMax;
    uniform vec2 uTexel;
    varying vec2 vUv;
    void main() {
      float d = texture2D(tDepth, vUv).x;
      float z = -perspectiveDepthToViewZ(d, cameraNear, cameraFar);
      float k = smoothstep(110.0, 420.0, z) * uMax;
      vec4 c = texture2D(tDiffuse, vUv);
      if (k < 0.05) { gl_FragColor = c; return; }
      vec4 acc = c;
      float n = 1.0;
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 2.39996;
        float r = sqrt(float(i) + 0.5) / sqrt(12.0);
        vec2 o = vec2(cos(a), sin(a)) * r * k * uTexel;
        acc += texture2D(tDiffuse, vUv + o);
        n += 1.0;
      }
      gl_FragColor = acc / n;
    }`,
};

// Replaces NaN/Inf and clamps fireflies so one bad pixel can never bloom across the frame.
const Sanitize = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = min(c, vec4(48.0));
    }`,
};

class DepthShaderPass extends ShaderPass {
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, dt: number, mask: boolean) {
    this.uniforms.tDepth.value = readBuffer.depthTexture;
    super.render(renderer, writeBuffer, readBuffer, dt, mask);
  }
}

export class Post {
  composer: EffectComposer;
  private render: RenderPass;
  private dof: DepthShaderPass | null = null;
  private bloom: UnrealBloomPass | null = null;

  constructor(private renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, q: Quality) {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: q.msaa,
      depthTexture: q.dof ? new THREE.DepthTexture(size.x, size.y) : null,
    });
    this.composer = new EffectComposer(renderer, rt);
    this.render = new RenderPass(scene, camera);
    this.composer.addPass(this.render);
    if (q.dof) {
      this.dof = new DepthShaderPass(FarDof);
      this.composer.addPass(this.dof);
    }
    if (q.bloom) {
      this.composer.addPass(new ShaderPass(Sanitize));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.42, 0.55, 1.5);
      this.composer.addPass(this.bloom);
    }
    this.composer.addPass(new OutputPass());
  }

  setScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.render.scene = scene;
    this.render.camera = camera;
    if (this.dof) {
      this.dof.uniforms.cameraNear.value = camera.near;
      this.dof.uniforms.cameraFar.value = camera.far;
    }
  }

  /** DOF only makes sense outdoors where there is a far background. */
  setDof(on: boolean) { if (this.dof) this.dof.enabled = on; }

  setSize(w: number, h: number) {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.dof?.uniforms.uTexel.value.set(1 / size.x, 1 / size.y);
  }

  draw(dt: number) { this.composer.render(dt); }

  dispose() { this.composer.dispose(); }
}
