import React, { useEffect, useRef, useState } from 'react';

export type FluidShape = 'lens' | 'blob' | 'cube' | 'pill' | 'torus' | 'prism' | 'diamond';

const SHAPES: FluidShape[] = ['lens', 'blob', 'cube', 'pill', 'torus', 'prism', 'diamond'];
const EXTENT: Record<FluidShape, number> = {
  lens: 1.02,
  blob: 1.08,
  cube: 1.32,
  pill: 1.02,
  torus: 1.0,
  prism: 1.18,
  diamond: 1.05,
};
const BASE: Record<FluidShape, [number, number, number]> = {
  lens: [0, 0, 0],
  blob: [0.2, 0, 0],
  cube: [-0.48, 0.62, 0.0],
  pill: [0.0, 0.0, 0.0],
  torus: [-0.5, 0.18, 0.0],
  prism: [-0.3, 0.45, 0.0],
  diamond: [-0.35, 0.5, 0.0],
};
const SPIN: Record<FluidShape, [number, number]> = {
  lens: [0, 0],
  blob: [1, 0],
  cube: [1, 0],
  pill: [0, 0],
  torus: [0, 1],
  prism: [1, 0],
  diamond: [1, 0],
};

const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

const SDF: Record<FluidShape, string> = {
  lens: `{
    float a = length(p - vec3(0.0, 0.0, -1.85)) - 2.13;
    float b = length(p - vec3(0.0, 0.0, 1.85)) - 2.13;
    float h = clamp(0.5 - 0.5 * (b - a) / 0.2, 0.0, 1.0);
    return mix(b, a, h) + 0.2 * h * (1.0 - h);
  }`,
  blob: `{
    vec3 q = p * 1.6;
    float t = uTime;
    float n = sin(q.x + t * 1.1) * sin(q.y * 1.15 - t * 0.9) * sin(q.z * 0.95 + t * 0.8);
    n += 0.45 * sin(q.x * 1.6 - t * 0.6 + q.z) * sin(q.y * 1.9 + t * 1.2 + q.x * 0.5);
    return (length(p) - 0.92 - 0.085 * n) * 0.78;
  }`,
  cube: `{
    vec3 q = abs(p) - vec3(0.6);
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.16;
  }`,
  pill: `{
    float outline = length(vec2(max(abs(p.x) - 0.58, 0.0), p.y)) - 0.42;
    vec2 q = vec2(outline + 0.16, abs(p.z) - 0.16);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.16;
  }`,
  torus: `{
    vec2 q = vec2(length(p.xy) - 0.68, p.z);
    return length(q) - 0.3;
  }`,
  prism: `{
    vec3 q = abs(p);
    float side = max(q.x * 0.866025 + p.y * 0.5, -p.y) - 0.5;
    float d = max(q.z - 0.34, side);
    return d - 0.08;
  }`,
  diamond: `{
    vec3 q = abs(p);
    return (q.x + q.y * 0.92 + q.z * 1.25 - 0.98) * 0.5;
  }`,
};

const fragmentFor = (a: FluidShape, b: FluidShape) => `#version 300 es
precision mediump float;
uniform vec2 uView;
uniform float uRatio;
uniform float uFocal;
uniform vec3 uCenter;
uniform mat3 uInverse;
uniform float uScale;
uniform float uBound;
uniform float uMorph;
uniform float uRipple;
uniform float uTime;
uniform float uIor;
uniform float uDispersion;
uniform float uReflection;
uniform vec4 uTint;
uniform float uPresence;
out vec4 fragColor;

float shapeA(vec3 p) ${SDF[a]}
float shapeB(vec3 p) ${SDF[b]}

float field(vec3 p) {
  float d = shapeA(p);
  ${a !== b ? 'd = mix(d, shapeB(p), uMorph);' : ''}
  if (uRipple > 0.0) {
    d += uRipple * sin(p.x * 3.1 + uTime * 2.3) * sin(p.y * 3.4 - uTime * 1.9) * sin(p.z * 2.9 + uTime * 1.6);
  }
  return d;
}

float map(vec3 w) {
  return field(uInverse * (w - uCenter)) * uScale;
}

vec3 normalAt(vec3 w) {
  float e = 0.4;
  vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * map(w + k.xyy * e) +
    k.yyx * map(w + k.yyx * e) +
    k.yxy * map(w + k.yxy * e) +
    k.xxx * map(w + k.xxx * e)
  );
}

vec3 studio(vec3 d) {
  vec2 a = vec2(atan(d.x, d.z), d.y);
  float key = smoothstep(0.42, 0.22, abs(a.x + 0.62)) * smoothstep(0.3, 0.12, abs(a.y - 0.5));
  float strip = smoothstep(0.12, 0.05, abs(a.x - 0.95)) * smoothstep(0.8, 0.35, abs(a.y - 0.05));
  float dome = smoothstep(0.0, 1.0, d.z) * 0.06;
  return vec3(16.0) * key + vec3(7.0) * strip + vec3(dome);
}

vec4 light(vec3 d, float weight) {
  vec3 c = studio(d) * weight;
  float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
  return vec4(min(c, vec3(a)), a);
}

void main() {
  vec2 w = gl_FragCoord.xy / uRatio;
  if (length(w - uCenter.xy) > uBound * 1.05) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 camera = vec3(uView * 0.5, uFocal);
  vec3 ro = camera;
  vec3 rd = normalize(vec3(w, 0.0) - camera);
  float pixel = 1.0 / uRatio;
  float eps = 0.35 * pixel;

  vec3 oc = ro - uCenter;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uBound * uBound;
  float disc = b * b - c;
  if (disc <= 0.0 || uPresence <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  float sq = sqrt(disc);
  float t = max(-b - sq, 0.0);
  float tEnd = -b + sq;
  float closest = 1e5;
  float closestT = t;
  bool hit = false;
  for (int i = 0; i < 22; i++) {
    float d = map(ro + rd * t);
    if (d < closest) {
      closest = d;
      closestT = t;
    }
    if (d < eps) {
      hit = true;
      break;
    }
    t += d * 0.92;
    if (t > tEnd) break;
  }

  if (!hit && closest < pixel * 0.35) {
    hit = true;
    t = closestT;
  }

  if (!hit) {
    float cover = clamp(1.0 - closest / (pixel * 1.2), 0.0, 1.0) * uPresence;
    if (cover <= 0.0) {
      fragColor = vec4(0.0);
      return;
    }
    vec3 pEdge = ro + rd * closestT;
    vec3 nEdge = normalAt(pEdge);
    vec3 mEdge = reflect(rd, nEdge);
    vec4 edgeCol = light(vec3(mEdge.xy, abs(mEdge.z)), uReflection) * 0.5;
    fragColor = edgeCol * cover * 0.7;
    return;
  }

  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  vec3 mirrorDir = reflect(rd, n);
  float cosi = clamp(-dot(rd, n), 0.0, 1.0);
  float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosi, 5.0);

  // Trazo interior ligero de 1 rebote para máxima fluidez (60/120fps sin lag)
  vec3 inside = refract(rd, n, 1.0 / uIor);
  vec3 q = p + inside * eps * 4.0;
  float travel = 0.0;
  for (int i = 0; i < 16; i++) {
    float d = map(q);
    if (d > -eps) break;
    float stepLen = max(-d * 0.92, eps);
    q += inside * stepLen;
    travel += stepLen;
  }
  vec3 n2 = normalAt(q);
  vec3 exitDir = refract(inside, -n2, uIor);
  if (dot(exitDir, exitDir) <= 0.0) exitDir = reflect(inside, -n2);

  vec4 green = light(vec3(exitDir.xy, abs(exitDir.z)), 0.55);
  vec4 red = green;
  vec4 blue = green;
  if (uDispersion > 0.0) {
    vec3 spread = vec3(-1.0, 0.0, 1.0) * uDispersion * 0.06;
    vec3 dirR = refract(inside, -n2, uIor + spread.x);
    vec3 dirB = refract(inside, -n2, uIor + spread.z);
    if (dot(dirR, dirR) > 0.0) red = light(vec3(dirR.xy, abs(dirR.z)), 0.55);
    if (dot(dirB, dirB) > 0.0) blue = light(vec3(dirB.xy, abs(dirB.z)), 0.55);
  }
  vec4 transmitted = vec4(red.r, green.g, blue.b, green.a);

  vec3 tint = pow(max(uTint.rgb, vec3(0.001)), vec3(uTint.a * travel / max(uBound, 1.0)));
  transmitted.rgb *= tint;
  float body = (1.0 - dot(tint, vec3(0.3333))) * 0.72;
  transmitted += vec4(uTint.rgb * body, body) * (1.0 - transmitted.a);

  vec4 reflected = light(vec3(mirrorDir.xy, abs(mirrorDir.z)), uReflection * fresnel);
  vec4 glass = reflected + transmitted * (1.0 - reflected.a);

  vec2 facing = normalize(vec2(-0.42, 0.55));
  float rimLight = pow(1.0 - cosi, 3.0) * (0.25 + 0.75 * abs(dot(normalize(n.xy + 1e-5), facing))) * 0.55 * uReflection;
  rimLight *= smoothstep(0.0, 0.08, cosi);
  glass = vec4(rimLight) + glass * (1.0 - rimLight);

  fragColor = glass * uPresence;
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (value?: string): [number, number, number, number] | null => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, (digit) => digit + digit) : hex[1];
    const rgb = [0, 2, 4].map((index) => parseInt(full.slice(index, index + 2), 16) / 255);
    return [rgb[0], rgb[1], rgb[2], 1];
  }
  return null;
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const smoother = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

type Quat = [number, number, number, number];

const quaternion = (x: number, y: number, z: number): Quat => {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);
  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
};

const multiply = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

const slerp = (a: Quat, b: Quat, t: number): Quat => {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const target: Quat = dot < 0 ? [-b[0], -b[1], -b[2], -b[3]] : b;
  dot = Math.abs(dot);
  if (dot > 0.9995) {
    const mixed = a.map((value, index) => value + (target[index] - value) * t);
    const length = Math.hypot(...mixed);
    return [mixed[0] / length, mixed[1] / length, mixed[2] / length, mixed[3] / length];
  }
  const theta = Math.acos(dot);
  const sin = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sin;
  const wb = Math.sin(t * theta) / sin;
  return [
    a[0] * wa + target[0] * wb,
    a[1] * wa + target[1] * wb,
    a[2] * wa + target[2] * wb,
    a[3] * wa + target[3] * wb,
  ];
};

const driftAt = (clock: number, size: number): [number, number] => [
  Math.sin(clock * 0.37) * size * 0.25 + Math.sin(clock * 0.71 + 1.3) * size * 0.08,
  Math.sin(clock * 0.29 + 0.8) * size * 0.15 + Math.cos(clock * 0.53) * size * 0.06,
];

const toMatrix = ([x, y, z, w]: Quat) => [
  1 - 2 * (y * y + z * z),
  2 * (x * y + z * w),
  2 * (x * z - y * w),
  2 * (x * y - z * w),
  1 - 2 * (x * x + z * z),
  2 * (y * z + x * w),
  2 * (x * z + y * w),
  2 * (y * z - x * w),
  1 - 2 * (x * x + y * y),
];

export interface FluidGlassProps {
  text?: string;
  src?: string;
  shape?: FluidShape;
  shapes?: FluidShape[];
  size?: number;
  refraction?: number;
  dispersion?: number;
  reflection?: number;
  frost?: number;
  color?: string;
  tint?: number;
  shadow?: number;
  elevation?: number;
  interaction?: 'follow' | 'drag' | 'static';
  smoothness?: number;
  wobble?: number;
  spin?: number;
  idle?: boolean;
  morphOnClick?: boolean;
  onShapeChange?: (shape: FluidShape) => void;
  position?: [number, number];
  intro?: boolean;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface ProgramEntry {
  program: WebGLProgram;
  fragment: WebGLShader | null;
  uniforms: Record<string, WebGLUniformLocation | null> | null;
  failed: boolean;
}

const FluidGlass: React.FC<FluidGlassProps> = ({
  shape = 'blob',
  shapes,
  size = 44,
  refraction = 1,
  dispersion = 0.35,
  reflection = 1.2,
  color = '#3b82f6',
  tint = 0.25,
  elevation = 0.4,
  smoothness = 0.32,
  wobble = 0.55,
  spin = 0.3,
  idle = false,
  morphOnClick = true,
  onShapeChange,
  intro = true,
}) => {
  const spriteRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [generation, setGeneration] = useState(0);

  // El canvas flotante mide solo (size * 2.1) px en vez de toda la pantalla (1920x1080), eliminando el 99.5% de carga en GPU
  const boxSize = Math.round(Math.max(32, size) * 2.1);

  const cycle =
    Array.isArray(shapes) && shapes.length
      ? shapes.filter((name): name is FluidShape => SHAPES.includes(name))
      : SHAPES;

  const settings = {
    shape: (SHAPES.includes(shape) ? shape : 'blob') as FluidShape,
    cycle: cycle.length ? cycle : SHAPES,
    size: Math.max(16, size),
    boxSize,
    ior: 1 + 0.5 * clamp(refraction, 0, 2),
    dispersion: clamp(dispersion, 0, 1),
    reflection: clamp(reflection, 0, 2),
    color: parseColor(color) || ([0.23, 0.51, 0.96, 1] as [number, number, number, number]),
    tint: clamp(tint, 0, 1),
    elevation: clamp(elevation, 0, 3),
    smoothness: clamp(smoothness, 0, 1),
    wobble: clamp(wobble, 0, 1),
    spin,
    idle,
    morphOnClick,
    onShapeChange,
    intro,
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const sprite = spriteRef.current;
    const canvas = canvasRef.current;
    if (!sprite || !canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    if (!vertex) return;
    const programs = new Map<string, ProgramEntry>();

    const request = (key: string): ProgramEntry => {
      const existing = programs.get(key);
      if (existing) return existing;
      const [a, b] = key.split('>') as [FluidShape, FluidShape];
      const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentFor(a, b));
      const program = gl.createProgram()!;
      gl.attachShader(program, vertex);
      if (fragment) gl.attachShader(program, fragment);
      gl.linkProgram(program);
      const entry: ProgramEntry = { program, fragment, uniforms: null, failed: false };
      programs.set(key, entry);
      return entry;
    };

    const ready = (entry: ProgramEntry): boolean => {
      if (entry.failed) return false;
      if (entry.uniforms) return true;
      if (parallel && !gl.getProgramParameter(entry.program, parallel.COMPLETION_STATUS_KHR)) return false;
      if (!gl.getProgramParameter(entry.program, gl.LINK_STATUS)) {
        entry.failed = true;
        return false;
      }
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = gl.getProgramParameter(entry.program, gl.ACTIVE_UNIFORMS);
      for (let index = 0; index < count; index++) {
        const info = gl.getActiveUniform(entry.program, index);
        if (info) uniforms[info.name] = gl.getUniformLocation(entry.program, info.name);
      }
      entry.uniforms = uniforms;
      return true;
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vao = gl.createVertexArray();

    const sInit = settingsRef.current;
    canvas.width = sInit.boxSize;
    canvas.height = sInit.boxSize;

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      inside: false,
    };
    const body = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      vx: 0,
      vy: 0,
      spin: 0,
      ripple: 0,
      dirX: 1,
      dirY: 0,
    };
    const spring = {
      stretch: 1,
      vstretch: 0,
      tiltX: 0,
      vtiltX: 0,
      tiltY: 0,
      vtiltY: 0,
      scale: 0,
      vscale: 0,
    };
    const morph: {
      from: FluidShape;
      to: FluidShape;
      t: number;
      pending: FluidShape | null;
    } = {
      from: sInit.shape,
      to: sInit.shape,
      t: 1,
      pending: null,
    };
    let requested = sInit.shape;
    let presence = sInit.intro && !reduced && generation === 0 ? 0 : 1;
    if (presence === 1) spring.scale = 1;
    let time = 0;
    let idleClock = 0;
    let raf = 0;
    let last = 0;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;
    let current: ProgramEntry | null = null;

    const step = (
      key: 'stretch' | 'tiltX' | 'tiltY' | 'scale',
      target: number,
      omega: number,
      zeta: number,
      dt: number
    ) => {
      const velocity = `v${key}` as 'vstretch' | 'vtiltX' | 'vtiltY' | 'vscale';
      spring[velocity] += (omega * omega * (target - spring[key]) - 2 * zeta * omega * spring[velocity]) * dt;
      spring[key] += spring[velocity] * dt;
      const settled = Math.abs(target - spring[key]) < 0.001 && Math.abs(spring[velocity]) < 0.005;
      if (settled) {
        spring[key] = target;
        spring[velocity] = 0;
      }
      return !settled;
    };

    const frame = (now: number) => {
      raf = 0;
      if (lost || !pageVisible) return;

      const s = settingsRef.current;
      const dt = clamp((now - last) / 1000 || 0.016, 0.001, 0.04);
      last = now;
      time += dt;
      let busy = false;

      if (s.shape !== requested) {
        requested = s.shape;
        morph.pending = s.shape;
      }
      if (morph.pending && morph.t >= 1) {
        const key = `${morph.to}>${morph.pending}`;
        const entry = request(key);
        if (ready(entry)) {
          request(`${morph.pending}>${morph.pending}`);
          morph.from = morph.to;
          morph.to = morph.pending;
          morph.pending = null;
          morph.t = 0;
          spring.vstretch -= 2.5 * s.wobble;
          if (morph.to !== morph.from) s.onShapeChange?.(morph.to);
        }
        busy = true;
      }
      if (morph.t < 1) {
        morph.t = Math.min(1, morph.t + dt / (reduced ? 0.35 : 0.75));
        busy = true;
      }

      const halfSize = s.size * 0.5;
      if (s.idle && !reduced) {
        idleClock += dt;
        busy = true;
      }
      const drift = s.idle && !reduced ? driftAt(idleClock, halfSize) : [0, 0];
      const goalX = pointer.x + drift[0];
      const goalY = pointer.y + drift[1];

      const omega = 26 * Math.pow(0.22, s.smoothness);
      body.vx += (omega * omega * (goalX - body.x) - 2 * 0.85 * omega * body.vx) * dt;
      body.vy += (omega * omega * (goalY - body.y) - 2 * 0.85 * omega * body.vy) * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;

      if (Math.abs(goalX - body.x) + Math.abs(goalY - body.y) > 0.15 || Math.hypot(body.vx, body.vy) > 1.5) {
        busy = true;
      }

      // Posicionar el contenedor pequeño mediante composición GPU directa (cero reflow/lag)
      const halfBox = s.boxSize * 0.5;
      sprite.style.transform = `translate3d(${(body.x - halfBox).toFixed(1)}px, ${(body.y - halfBox).toFixed(1)}px, 0)`;

      const speed = Math.hypot(body.vx, body.vy);
      if (speed > 1) {
        body.dirX = body.vx / speed;
        body.dirY = body.vy / speed;
      }
      const stretchTarget = 1 + clamp(speed / 1800, 0, 0.5) * s.wobble * (reduced ? 0 : 1);
      busy = step('stretch', stretchTarget, 14, 0.35, dt) || busy;
      const tiltGain = reduced ? 0 : 0.00045;
      busy = step('tiltX', clamp(body.vy * tiltGain, -0.65, 0.65), 10, 0.5, dt) || busy;
      busy = step('tiltY', clamp(body.vx * tiltGain, -0.65, 0.65), 10, 0.5, dt) || busy;

      if (!reduced && (morph.to === 'blob' || (morph.from === 'blob' && morph.t < 1))) busy = true;
      if (!reduced && s.spin) {
        body.spin += dt * s.spin;
        busy = true;
      }

      const key = morph.t < 1 ? `${morph.from}>${morph.to}` : `${morph.to}>${morph.to}`;
      const entry = request(key);
      if (ready(entry)) current = entry;
      else busy = true;

      if (current && current.uniforms) {
        if (presence < 1) {
          presence = Math.min(1, presence + dt / 0.45);
          busy = true;
        }
        busy = step('scale', 1, 12, 0.55, dt) || busy;

        body.ripple +=
          ((morph.t < 1 ? 0.05 * s.wobble * Math.sin(Math.PI * morph.t) : 0) - body.ripple) *
          (1 - Math.exp(-dt / 0.08));

        const eased = smoother(morph.t);
        const extent = EXTENT[morph.from] + (EXTENT[morph.to] - EXTENT[morph.from]) * eased;
        const unit = halfSize / extent;
        const scale = Math.max(0.001, spring.scale);
        const qa = quaternion(...BASE[morph.from]);
        const qb = quaternion(...BASE[morph.to]);
        let orientation = slerp(qa, qb, eased);
        const tumble = SPIN[morph.from][0] + (SPIN[morph.to][0] - SPIN[morph.from][0]) * eased;
        const sway = SPIN[morph.from][1] + (SPIN[morph.to][1] - SPIN[morph.from][1]) * eased;
        const angle = body.spin % (Math.PI * 2);
        const turnY = slerp([0, 0, 0, 1], quaternion(0, angle, 0), tumble);
        const turnZ = slerp([0, 0, 0, 1], quaternion(0, 0, angle), sway);
        orientation = multiply(
          multiply(quaternion(Math.sin(body.spin * 0.6) * 0.18 * tumble, 0, 0), turnY),
          orientation
        );
        orientation = multiply(turnZ, orientation);
        orientation = multiply(quaternion(spring.tiltX, spring.tiltY, 0), orientation);
        const r = toMatrix(orientation);
        const sx = Math.max(0.2, spring.stretch);
        const q = 1 / Math.sqrt(sx);
        const ux = body.dirX;
        const uy = -body.dirY;
        const inv = [
          1 / q + (1 / sx - 1 / q) * ux * ux,
          (1 / sx - 1 / q) * ux * uy,
          0,
          (1 / sx - 1 / q) * ux * uy,
          1 / q + (1 / sx - 1 / q) * uy * uy,
          0,
          0,
          0,
          1 / q,
        ];
        const transposeR = [r[0], r[3], r[6], r[1], r[4], r[7], r[2], r[5], r[8]];
        const combined = new Float32Array(9);
        for (let col = 0; col < 3; col++) {
          for (let row = 0; row < 3; row++) {
            let sum = 0;
            for (let k = 0; k < 3; k++) sum += transposeR[k * 3 + row] * inv[col * 3 + k];
            combined[col * 3 + row] = sum / (unit * scale);
          }
        }
        const minScale = Math.min(sx, q);
        const maxScale = Math.max(sx, q);
        const focal = s.boxSize * 2.2;
        const height = unit * (0.35 + s.elevation);

        const u = current.uniforms;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(current.program);
        gl.bindVertexArray(vao);
        gl.uniform2f(u.uView, s.boxSize, s.boxSize);
        gl.uniform1f(u.uRatio, 1);
        gl.uniform1f(u.uFocal, focal);
        gl.uniform3f(u.uCenter, halfBox, halfBox, height);
        gl.uniformMatrix3fv(u.uInverse, false, combined);
        gl.uniform1f(u.uScale, unit * scale * minScale);
        gl.uniform1f(u.uBound, halfSize * scale * maxScale * 1.08 + 2);
        gl.uniform1f(u.uMorph, eased);
        gl.uniform1f(u.uRipple, body.ripple);
        gl.uniform1f(u.uTime, reduced ? 0 : time);
        gl.uniform1f(u.uIor, s.ior);
        gl.uniform1f(u.uDispersion, s.dispersion);
        gl.uniform1f(u.uReflection, s.reflection);
        gl.uniform4f(u.uTint, s.color[0], s.color[1], s.color[2], s.tint * 1.6);
        gl.uniform1f(u.uPresence, presence);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (busy && pageVisible) {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (raf || lost || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      spring.vstretch -= 2.4 * s.wobble;
      if (s.morphOnClick && s.cycle.length > 1) {
        const index = s.cycle.indexOf(morph.pending || morph.to);
        morph.pending = s.cycle[(index + 1) % s.cycle.length];
      }
      wake();
    };

    const onVisibility = () => {
      pageVisible = document.visibilityState !== 'hidden';
      wake();
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => setGeneration((value) => value + 1);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    // Precompilar shaders de las formas del ciclo para evitar tirones al hacer clic
    sInit.cycle.forEach((sh, idx) => {
      request(`${sh}>${sh}`);
      const next = sInit.cycle[(idx + 1) % sInit.cycle.length];
      request(`${sh}>${next}`);
    });
    wake();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!gl.isContextLost()) {
        programs.forEach((entry) => {
          gl.deleteProgram(entry.program);
          if (entry.fragment) gl.deleteShader(entry.fragment);
        });
        gl.deleteShader(vertex);
        gl.deleteVertexArray(vao);
      }
    };
  }, [generation]);

  return (
    <div
      ref={spriteRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block will-change-transform"
      style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
};

export default FluidGlass;
