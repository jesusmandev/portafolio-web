import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader, type FontData, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import droidSansBoldData from 'three/examples/fonts/droid/droid_sans_bold.typeface.json';
import { motion } from 'framer-motion';

interface LogoSpec {
  name: string;
  color: number;
  build: () => THREE.Group;
}

class EllipseCurve3D extends THREE.Curve<THREE.Vector3> {
  rx: number;
  ry: number;
  constructor(rx: number, ry: number) {
    super();
    this.rx = rx;
    this.ry = ry;
  }
  getPoint(t: number): THREE.Vector3 {
    const angle = t * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * this.rx, Math.sin(angle) * this.ry, 0);
  }
}

function createRoundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function createCanvasTexture(
  drawCallback: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 512
) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) drawCallback(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function applyBoundingBoxUVs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (!bbox) return;
  const max = bbox.max;
  const min = bbox.min;
  const range = new THREE.Vector2(max.x - min.x, max.y - min.y);
  const pos = geometry.attributes.position;
  const uvs: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - min.x) / (range.x || 1);
    const v = (pos.getY(i) - min.y) / (range.y || 1);
    uvs.push(u, v);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

// 1. LOGO JAVASCRIPT
function buildJavaScriptLogo() {
  const group = new THREE.Group();

  const boxShape = createRoundedRectShape(3.2, 3.2, 0.35);
  const extrudeSettings = {
    depth: 0.6,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.12,
  };
  const baseGeo = new THREE.ExtrudeGeometry(boxShape, extrudeSettings);
  baseGeo.center();

  const yellowMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7df1e,
    metalness: 0.15,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  });
  group.add(new THREE.Mesh(baseGeo, yellowMat));

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.3,
    roughness: 0.35,
  });

  const jShape = new THREE.Shape();
  jShape.moveTo(0.05, 0.25);
  jShape.lineTo(0.38, 0.25);
  jShape.lineTo(0.38, -0.75);
  jShape.quadraticCurveTo(0.38, -1.25, -0.1, -1.25);
  jShape.quadraticCurveTo(-0.52, -1.25, -0.58, -0.82);
  jShape.lineTo(-0.26, -0.75);
  jShape.quadraticCurveTo(-0.22, -0.95, -0.08, -0.95);
  jShape.quadraticCurveTo(0.05, -0.95, 0.05, -0.72);
  jShape.closePath();

  const sShape = new THREE.Shape();
  sShape.moveTo(1.32, 0.02);
  sShape.quadraticCurveTo(1.22, 0.28, 0.88, 0.28);
  sShape.quadraticCurveTo(0.52, 0.28, 0.52, -0.08);
  sShape.quadraticCurveTo(0.52, -0.35, 0.88, -0.48);
  sShape.quadraticCurveTo(1.08, -0.55, 1.08, -0.75);
  sShape.quadraticCurveTo(1.08, -0.95, 0.88, -0.95);
  sShape.quadraticCurveTo(0.68, -0.95, 0.6, -0.72);
  sShape.lineTo(0.32, -0.82);
  sShape.quadraticCurveTo(0.45, -1.25, 0.88, -1.25);
  sShape.quadraticCurveTo(1.4, -1.25, 1.4, -0.72);
  sShape.quadraticCurveTo(1.4, -0.4, 1.02, -0.25);
  sShape.quadraticCurveTo(0.82, -0.18, 0.82, -0.04);
  sShape.quadraticCurveTo(0.82, 0.05, 0.92, 0.05);
  sShape.quadraticCurveTo(1.05, 0.05, 1.1, -0.08);
  sShape.closePath();

  const letterExtrude = {
    depth: 0.18,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  };

  const jGeo = new THREE.ExtrudeGeometry(jShape, letterExtrude);
  const sGeo = new THREE.ExtrudeGeometry(sShape, letterExtrude);

  const frontLetters = new THREE.Group();
  frontLetters.add(new THREE.Mesh(jGeo, darkMat));
  frontLetters.add(new THREE.Mesh(sGeo, darkMat));
  frontLetters.position.z = 0.34;
  group.add(frontLetters);

  const backLetters = frontLetters.clone();
  backLetters.rotation.y = Math.PI;
  backLetters.position.z = -0.34;
  group.add(backLetters);

  return group;
}

// 2. LOGO TAILWIND CSS
function buildTailwindLogo() {
  const group = new THREE.Group();

  function createWaveShape() {
    const s = new THREE.Shape();
    s.moveTo(-1.7, -0.1);
    s.bezierCurveTo(-1.45, 0.75, -0.75, 0.95, -0.1, 0.42);
    s.bezierCurveTo(0.35, 0.05, 0.78, -0.05, 1.15, 0.35);
    s.bezierCurveTo(1.32, 0.52, 1.48, 0.55, 1.7, 0.45);
    s.bezierCurveTo(1.45, -0.42, 0.75, -0.62, 0.1, -0.1);
    s.bezierCurveTo(-0.35, 0.28, -0.78, 0.38, -1.15, -0.02);
    s.bezierCurveTo(-1.32, -0.2, -1.48, -0.22, -1.7, -0.1);
    return s;
  }

  const extrudeOpts = {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };

  const waveGeo = new THREE.ExtrudeGeometry(createWaveShape(), extrudeOpts);
  waveGeo.center();

  const cyanMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    metalness: 0.2,
    roughness: 0.15,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  });

  const topWave = new THREE.Mesh(waveGeo, cyanMat);
  topWave.position.set(0, 0.65, 0);

  const bottomWave = new THREE.Mesh(waveGeo, cyanMat);
  bottomWave.position.set(0, -0.65, 0);

  group.add(topWave, bottomWave);
  return group;
}

// 3. LOGO REACT
function buildReactLogo() {
  const group = new THREE.Group();

  const reactMat = new THREE.MeshPhysicalMaterial({
    color: 0x61dafb,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.45,
    metalness: 0.25,
    roughness: 0.14,
    clearcoat: 0.95,
  });

  const nucleusGeo = new THREE.SphereGeometry(0.42, 28, 28);
  group.add(new THREE.Mesh(nucleusGeo, reactMat));

  const orbitGeo = new THREE.TubeGeometry(new EllipseCurve3D(2.15, 0.82), 80, 0.095, 16, true);

  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(orbitGeo, reactMat);
    ring.rotation.z = (i * Math.PI) / 3;
    ring.rotation.x = (i - 1) * 0.18;
    group.add(ring);
  }

  return group;
}

// 4. LOGO THREE.JS
function buildThreeJsLogo() {
  const group = new THREE.Group();

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.35,
    roughness: 0.2,
  });

  const darkCellMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.4,
    roughness: 0.3,
  });

  const N = 4;
  const V0 = new THREE.Vector2(-1.45, 1.75);
  const V1 = new THREE.Vector2(1.85, 0.65);
  const V2 = new THREE.Vector2(-0.55, -1.85);

  function getGridPt(i: number, j: number) {
    const u = i / N;
    const v = j / N;
    const w = 1 - u - v;
    return new THREE.Vector3(
      w * V0.x + u * V1.x + v * V2.x,
      w * V0.y + u * V1.y + v * V2.y,
      0
    );
  }

  function addBar(p1: THREE.Vector3, p2: THREE.Vector3, radius: number) {
    const dist = p1.distanceTo(p2);
    const cylGeo = new THREE.CylinderGeometry(radius, radius, dist, 10);
    const mesh = new THREE.Mesh(cylGeo, whiteMat);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(mesh);

    const jointGeo = new THREE.SphereGeometry(radius * 1.05, 10, 10);
    const j1 = new THREE.Mesh(jointGeo, whiteMat);
    j1.position.copy(p1);
    group.add(j1);
  }

  const barRadius = 0.055;
  for (let k = 0; k < N; k++) {
    addBar(getGridPt(k, 0), getGridPt(k, N - k), barRadius);
    addBar(getGridPt(0, k), getGridPt(N - k, k), barRadius);
    addBar(getGridPt(0, N - k), getGridPt(N - k, 0), barRadius);
  }

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N - i; j++) {
      const pA = getGridPt(i, j);
      const pB = getGridPt(i + 1, j);
      const pC = getGridPt(i, j + 1);

      const cx = (pA.x + pB.x + pC.x) / 3;
      const cy = (pA.y + pB.y + pC.y) / 3;
      const shrink = 0.72;

      const s = new THREE.Shape();
      s.moveTo(cx + (pA.x - cx) * shrink, cy + (pA.y - cy) * shrink);
      s.lineTo(cx + (pB.x - cx) * shrink, cy + (pB.y - cy) * shrink);
      s.lineTo(cx + (pC.x - cx) * shrink, cy + (pC.y - cy) * shrink);
      s.closePath();

      const cellGeo = new THREE.ExtrudeGeometry(s, {
        depth: 0.14,
        bevelEnabled: false,
      });
      cellGeo.translate(0, 0, -0.07);
      group.add(new THREE.Mesh(cellGeo, darkCellMat));
    }
  }

  return group;
}

// 5. LOGO NEXT.JS
function buildNextJsLogo() {
  const group = new THREE.Group();

  const discGeo = new THREE.CylinderGeometry(1.85, 1.85, 0.35, 56);
  discGeo.rotateX(Math.PI / 2);
  const blackMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 0.85,
  });
  group.add(new THREE.Mesh(discGeo, blackMat));

  const rimGeo = new THREE.TorusGeometry(1.85, 0.08, 20, 56);
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.2,
  });
  const fRim = new THREE.Mesh(rimGeo, whiteMat);
  fRim.position.z = 0.14;
  const bRim = fRim.clone();
  bRim.position.z = -0.14;
  group.add(fRim, bRim);

  const barExtrude = {
    depth: 0.44,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  };

  const leftBar = createRoundedRectShape(0.28, 1.75, 0.04);
  const leftGeo = new THREE.ExtrudeGeometry(leftBar, barExtrude);
  leftGeo.center();
  const leftMesh = new THREE.Mesh(leftGeo, whiteMat);
  leftMesh.position.set(-0.62, 0, 0);

  const rightBar = createRoundedRectShape(0.28, 1.75, 0.04);
  const rightGeo = new THREE.ExtrudeGeometry(rightBar, barExtrude);
  rightGeo.center();
  const rightMesh = new THREE.Mesh(rightGeo, whiteMat);
  rightMesh.position.set(0.62, 0, 0);

  const diagShape = new THREE.Shape();
  diagShape.moveTo(-0.76, 0.88);
  diagShape.lineTo(-0.44, 0.88);
  diagShape.lineTo(1.22, -1.42);
  diagShape.lineTo(0.9, -1.42);
  diagShape.closePath();

  const diagGeo = new THREE.ExtrudeGeometry(diagShape, barExtrude);
  diagGeo.translate(0, 0, -0.22);
  const diagMesh = new THREE.Mesh(diagGeo, whiteMat);

  group.add(leftMesh, rightMesh, diagMesh);
  return group;
}

// 6. LOGO HTML5
function buildHtml5Logo() {
  const group = new THREE.Group();

  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(-1.55, 1.85);
  shieldShape.lineTo(1.55, 1.85);
  shieldShape.lineTo(1.26, -1.25);
  shieldShape.lineTo(0, -1.85);
  shieldShape.lineTo(-1.26, -1.25);
  shieldShape.closePath();

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.07,
    bevelThickness: 0.07,
  });
  shieldGeo.translate(0, 0, -0.21);

  const orangeDarkMat = new THREE.MeshPhysicalMaterial({
    color: 0xe34f26,
    roughness: 0.22,
    metalness: 0.12,
    clearcoat: 0.7,
  });
  group.add(new THREE.Mesh(shieldGeo, orangeDarkMat));

  const rightHalfShape = new THREE.Shape();
  rightHalfShape.moveTo(0, 1.6);
  rightHalfShape.lineTo(1.28, 1.6);
  rightHalfShape.lineTo(1.04, -1.08);
  rightHalfShape.lineTo(0, -1.56);
  rightHalfShape.closePath();

  const rightHalfGeo = new THREE.ExtrudeGeometry(rightHalfShape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  rightHalfGeo.translate(0, 0, -0.25);

  const orangeLightMat = new THREE.MeshPhysicalMaterial({
    color: 0xf06529,
    roughness: 0.2,
    metalness: 0.12,
    clearcoat: 0.75,
  });
  group.add(new THREE.Mesh(rightHalfGeo, orangeLightMat));

  const fiveShape = new THREE.Shape();
  fiveShape.moveTo(0.85, 1.15);
  fiveShape.lineTo(-0.85, 1.15);
  fiveShape.lineTo(-0.72, -0.1);
  fiveShape.lineTo(0.45, -0.1);
  fiveShape.lineTo(0.38, -0.68);
  fiveShape.lineTo(0, -0.82);
  fiveShape.lineTo(-0.38, -0.68);
  fiveShape.lineTo(-0.42, -0.35);
  fiveShape.lineTo(-0.78, -0.35);
  fiveShape.lineTo(-0.7, -0.98);
  fiveShape.lineTo(0, -1.22);
  fiveShape.lineTo(0.7, -0.98);
  fiveShape.lineTo(0.84, 0.26);
  fiveShape.lineTo(-0.38, 0.26);
  fiveShape.lineTo(-0.42, 0.78);
  fiveShape.lineTo(0.82, 0.78);
  fiveShape.closePath();

  const fiveGeo = new THREE.ExtrudeGeometry(fiveShape, {
    depth: 0.62,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
  fiveGeo.translate(0, 0, -0.31);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.15,
  });
  group.add(new THREE.Mesh(fiveGeo, whiteMat));

  return group;
}

// 7. LOGO NODE.JS
function buildNodeJsLogo() {
  const group = new THREE.Group();

  function createHexShape(radius: number) {
    const s = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }

  const outerHexGeo = new THREE.ExtrudeGeometry(createHexShape(1.9), {
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.1,
  });
  outerHexGeo.center();

  const greenMat = new THREE.MeshPhysicalMaterial({
    color: 0x68a063,
    roughness: 0.2,
    metalness: 0.2,
    clearcoat: 0.8,
  });
  group.add(new THREE.Mesh(outerHexGeo, greenMat));

  const innerHexGeo = new THREE.ExtrudeGeometry(createHexShape(1.38), {
    depth: 0.66,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  innerHexGeo.center();

  const darkNodeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.25,
  });
  group.add(new THREE.Mesh(innerHexGeo, darkNodeMat));

  const lightGreenMat = new THREE.MeshStandardMaterial({
    color: 0x83cd29,
    roughness: 0.2,
    metalness: 0.15,
  });

  const jShape = new THREE.Shape();
  jShape.moveTo(-0.22, 0.55);
  jShape.lineTo(0.05, 0.55);
  jShape.lineTo(0.05, -0.35);
  jShape.quadraticCurveTo(0.05, -0.75, -0.35, -0.75);
  jShape.quadraticCurveTo(-0.72, -0.75, -0.76, -0.4);
  jShape.lineTo(-0.48, -0.35);
  jShape.quadraticCurveTo(-0.45, -0.5, -0.33, -0.5);
  jShape.quadraticCurveTo(-0.22, -0.5, -0.22, -0.32);
  jShape.closePath();

  const sShape = new THREE.Shape();
  sShape.moveTo(0.88, 0.35);
  sShape.quadraticCurveTo(0.78, 0.58, 0.5, 0.58);
  sShape.quadraticCurveTo(0.18, 0.58, 0.18, 0.26);
  sShape.quadraticCurveTo(0.18, 0.02, 0.5, -0.08);
  sShape.quadraticCurveTo(0.68, -0.14, 0.68, -0.32);
  sShape.quadraticCurveTo(0.68, -0.5, 0.5, -0.5);
  sShape.quadraticCurveTo(0.32, -0.5, 0.25, -0.3);
  sShape.lineTo(0.02, -0.38);
  sShape.quadraticCurveTo(0.14, -0.75, 0.5, -0.75);
  sShape.quadraticCurveTo(0.95, -0.75, 0.95, -0.3);
  sShape.quadraticCurveTo(0.95, -0.02, 0.62, 0.1);
  sShape.quadraticCurveTo(0.45, 0.16, 0.45, 0.28);
  sShape.quadraticCurveTo(0.45, 0.36, 0.54, 0.36);
  sShape.quadraticCurveTo(0.65, 0.36, 0.7, 0.25);
  sShape.closePath();

  const letterExt = {
    depth: 0.78,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  };

  const jGeo = new THREE.ExtrudeGeometry(jShape, letterExt);
  jGeo.translate(0, 0, -0.39);
  const sGeo = new THREE.ExtrudeGeometry(sShape, letterExt);
  sGeo.translate(0, 0, -0.39);

  group.add(new THREE.Mesh(jGeo, lightGreenMat), new THREE.Mesh(sGeo, lightGreenMat));
  return group;
}

// 8. LOGO VITE.JS
function buildViteLogo() {
  const group = new THREE.Group();

  function createRoundedPolygon(pts: THREE.Vector2[], radii: number | number[]) {
    const shape = new THREE.Shape();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const next = pts[(i + 1) % n];
      const r = Array.isArray(radii) ? radii[i] : radii;

      const v1 = new THREE.Vector2().subVectors(prev, curr);
      const v2 = new THREE.Vector2().subVectors(next, curr);
      const len1 = v1.length();
      const len2 = v2.length();
      v1.normalize();
      v2.normalize();

      const clampedR = Math.min(r, len1 * 0.45, len2 * 0.45);
      const pStart = new THREE.Vector2().copy(curr).addScaledVector(v1, clampedR);
      const pEnd = new THREE.Vector2().copy(curr).addScaledVector(v2, clampedR);

      if (i === 0) {
        shape.moveTo(pStart.x, pStart.y);
      } else {
        shape.lineTo(pStart.x, pStart.y);
      }
      shape.quadraticCurveTo(curr.x, curr.y, pEnd.x, pEnd.y);
    }
    shape.closePath();
    return shape;
  }

  const shieldGradTex = createCanvasTexture((ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s * 0.85, s);
    grad.addColorStop(0, '#41D1FF');
    grad.addColorStop(1, '#BD34FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  }, 512);

  const shieldPts = [
    new THREE.Vector2(-1.85, 1.47),
    new THREE.Vector2(0.02, -1.84),
    new THREE.Vector2(1.85, 1.47),
    new THREE.Vector2(0.02, 1.16),
  ];
  const shieldShape = createRoundedPolygon(shieldPts, [0.16, 0.16, 0.16, 0.08]);

  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
    depth: 0.36,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.07,
    bevelThickness: 0.07,
  });
  shieldGeo.translate(0, 0, -0.18);
  applyBoundingBoxUVs(shieldGeo);

  const shieldMat = new THREE.MeshPhysicalMaterial({
    map: shieldGradTex,
    roughness: 0.18,
    metalness: 0.15,
    clearcoat: 0.85,
  });
  group.add(new THREE.Mesh(shieldGeo, shieldMat));

  const boltPts = [
    new THREE.Vector2(0.87, 1.9),
    new THREE.Vector2(-0.49, 1.64),
    new THREE.Vector2(-0.57, 0.24),
    new THREE.Vector2(-0.12, 0.29),
    new THREE.Vector2(-0.2, -0.31),
    new THREE.Vector2(0.11, -0.28),
    new THREE.Vector2(-0.02, -1.22),
    new THREE.Vector2(1.12, 1.0),
    new THREE.Vector2(0.66, 0.96),
  ];
  const boltShape = createRoundedPolygon(
    boltPts,
    [0.08, 0.08, 0.07, 0.06, 0.07, 0.06, 0.06, 0.08, 0.06]
  );

  const boltGeo = new THREE.ExtrudeGeometry(boltShape, {
    depth: 0.58,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.045,
  });
  boltGeo.translate(0, 0, -0.29);
  applyBoundingBoxUVs(boltGeo);

  const boltGradTex = createCanvasTexture((ctx, s) => {
    const grad = ctx.createLinearGradient(0, s, 0, 0);
    grad.addColorStop(0, '#FFA800');
    grad.addColorStop(0.55, '#FFDD35');
    grad.addColorStop(1, '#FFEA83');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  }, 512);

  const boltMat = new THREE.MeshPhysicalMaterial({
    map: boltGradTex,
    roughness: 0.16,
    metalness: 0.22,
    clearcoat: 0.9,
  });
  group.add(new THREE.Mesh(boltGeo, boltMat));

  return group;
}

// 9. LOGO PYTHON
function buildPythonLogo() {
  const group = new THREE.Group();

  function createPythonSnakeShape() {
    const shape = new THREE.Shape();

    shape.moveTo(-0.82, 0.92);
    shape.lineTo(-0.82, 1.32);
    shape.bezierCurveTo(-0.82, 1.68, -0.48, 1.76, 0.0, 1.76);
    shape.bezierCurveTo(0.48, 1.76, 0.82, 1.68, 0.82, 1.32);

    shape.lineTo(0.82, 0.45);
    shape.quadraticCurveTo(0.82, 0.06, 0.42, 0.06);

    shape.lineTo(-0.42, 0.06);
    shape.quadraticCurveTo(-0.88, 0.06, -0.88, -0.4);
    shape.lineTo(-0.88, -0.78);

    shape.lineTo(-1.32, -0.78);
    shape.bezierCurveTo(-1.68, -0.78, -1.76, -0.45, -1.76, 0.0);
    shape.bezierCurveTo(-1.76, 0.45, -1.68, 0.8, -1.32, 0.8);

    shape.lineTo(-0.15, 0.8);
    shape.lineTo(-0.15, 0.92);
    shape.closePath();

    const eyeHole = new THREE.Path();
    eyeHole.absarc(-0.42, 1.36, 0.15, 0, Math.PI * 2, false);
    shape.holes.push(eyeHole);

    return shape;
  }

  const extrudeSettings = {
    depth: 0.48,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };

  const snakeGeo = new THREE.ExtrudeGeometry(createPythonSnakeShape(), extrudeSettings);
  snakeGeo.translate(0, 0, -0.24);
  applyBoundingBoxUVs(snakeGeo);

  const blueGradTex = createCanvasTexture((ctx, s) => {
    const grad = ctx.createLinearGradient(0, s, s, 0);
    grad.addColorStop(0, '#4B8BBE');
    grad.addColorStop(1, '#306998');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  }, 512);

  const yellowGradTex = createCanvasTexture((ctx, s) => {
    const grad = ctx.createLinearGradient(0, s, s, 0);
    grad.addColorStop(0, '#FFE873');
    grad.addColorStop(1, '#FFD43B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  }, 512);

  const blueMat = new THREE.MeshPhysicalMaterial({
    map: blueGradTex,
    roughness: 0.18,
    metalness: 0.15,
    clearcoat: 0.85,
  });

  const yellowMat = new THREE.MeshPhysicalMaterial({
    map: yellowGradTex,
    roughness: 0.18,
    metalness: 0.15,
    clearcoat: 0.85,
  });

  group.add(new THREE.Mesh(snakeGeo, blueMat));

  const yellowSnake = new THREE.Mesh(snakeGeo, yellowMat);
  yellowSnake.rotation.z = Math.PI;
  group.add(yellowSnake);

  const eyeGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.44, 20);
  eyeGeo.rotateX(Math.PI / 2);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1,
  });

  const topEye = new THREE.Mesh(eyeGeo, eyeMat);
  topEye.position.set(-0.42, 1.36, 0);

  const bottomEye = new THREE.Mesh(eyeGeo, eyeMat);
  bottomEye.position.set(0.42, -1.36, 0);

  group.add(topEye, bottomEye);

  return group;
}

const LOGOS_SPECS: LogoSpec[] = [
  { name: 'JAVASCRIPT', color: 0xf7df1e, build: buildJavaScriptLogo },
  { name: 'TAILWIND', color: 0x38bdf8, build: buildTailwindLogo },
  { name: 'REACT', color: 0x61dafb, build: buildReactLogo },
  { name: 'THREE.JS', color: 0x3b82f6, build: buildThreeJsLogo },
  { name: 'NEXT.JS', color: 0x60a5fa, build: buildNextJsLogo },
  { name: 'HTML5', color: 0xe34f26, build: buildHtml5Logo },
  { name: 'NODE.JS', color: 0x68a063, build: buildNodeJsLogo },
  { name: 'VITE.JS', color: 0xbd34fe, build: buildViteLogo },
  { name: 'PYTHON', color: 0x3776ab, build: buildPythonLogo },
];

// Crear texto 3D extruido con el mismo estilo de "DESARROLLADOR FRONTEND"
function create3DTitleMesh(text: string, font: Font, accentHex: number) {
  const geo = new TextGeometry(text, {
    font,
    size: 0.62,
    depth: 0.34,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: 0.065,
    bevelSize: 0.022,
    bevelOffset: 0,
    bevelSegments: 4,
  });
  geo.center();

  const frontMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.06,
    metalness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
    emissive: 0xffffff,
    emissiveIntensity: 0.22,
  });

  const sideMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    emissive: accentHex,
    emissiveIntensity: 0.65,
  });

  return new THREE.Mesh(geo, [frontMat, sideMat]);
}

const Skills: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 1000;
    const h = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.1, 12.2);
    camera.lookAt(0, -0.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Environment Map procedural brillante igual que el de "DESARROLLADOR FRONTEND"
    (function setupGlossyEnvMap() {
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 512;
      envCanvas.height = 256;
      const g = envCanvas.getContext('2d')!;
      const bgGrad = g.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#162038');
      bgGrad.addColorStop(0.45, '#050811');
      bgGrad.addColorStop(1, '#08142e');
      g.fillStyle = bgGrad;
      g.fillRect(0, 0, 512, 256);

      g.fillStyle = '#ffffff';
      g.fillRect(30, 20, 160, 38);
      g.fillRect(290, 18, 180, 35);
      g.fillStyle = 'rgba(255, 255, 255, 0.85)';
      g.fillRect(100, 90, 310, 21);
      g.fillStyle = '#2563eb';
      g.fillRect(45, 145, 190, 48);
      g.fillRect(280, 140, 195, 52);

      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(envTex).texture;
      envTex.dispose();
      pmrem.dispose();
    })();

    // Iluminación de estudio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(8, 12, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.1);
    dirLight2.position.set(-8, -5, 6);
    scene.add(dirLight2);

    const pointLight1 = new THREE.PointLight(0xffffff, 2.8, 28);
    pointLight1.position.set(0, 2, 7);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x2563eb, 2.2, 26);
    pointLight2.position.set(-5, -3, 5);
    scene.add(pointLight2);

    // Fuente 3D droid_sans_bold con glifos limpios
    const loader = new FontLoader();
    const cleanedFontData = JSON.parse(JSON.stringify(droidSansBoldData)) as FontData;
    if (cleanedFontData.glyphs['N']) {
      cleanedFontData.glyphs['N'].o =
        'm 963 0 l 685 0 l 325 655 l 325 0 l 125 0 l 125 992 l 403 992 l 763 337 l 763 992 l 963 992 l 963 0 ';
    }
    if (cleanedFontData.glyphs['A']) {
      cleanedFontData.glyphs['A'].o =
        'm 690 0 l 623 238 l 280 238 l 212 0 l 0 0 l 322 996 l 579 996 l 903 0 l 690 0 m 574 413 l 451 825 l 331 413 l 574 413 ';
    }
    const font = loader.parse(cleanedFontData);

    // Construir cada slot del carrusel: Logo 3D arriba + Nombre 3D extruido abajo
    interface SlotItem {
      slotGroup: THREE.Group;
      logoMeshGroup: THREE.Group;
      titleMesh: THREE.Mesh;
    }

    const slots: SlotItem[] = [];
    LOGOS_SPECS.forEach((spec) => {
      const slotGroup = new THREE.Group();

      const logoMeshGroup = spec.build();
      logoMeshGroup.position.set(0, 0.72, 0);
      logoMeshGroup.scale.setScalar(0.76);
      slotGroup.add(logoMeshGroup);

      const titleMesh = create3DTitleMesh(spec.name, font, spec.color);
      titleMesh.position.set(0, -1.95, 0.2);
      slotGroup.add(titleMesh);

      scene.add(slotGroup);
      slots.push({
        slotGroup,
        logoMeshGroup,
        titleMesh,
      });
    });

    const total = slots.length;
    const stepAngle = (Math.PI * 2) / total;
    let targetCarouselAngle = 0;
    let currentCarouselAngle = 0;

    // Avance automático continuo cada 2.4 segundos
    const autoTimer = window.setInterval(() => {
      if (!isDragging) {
        targetCarouselAngle += stepAngle;
      }
    }, 2400);

    // Arrastrar para girar el carrusel manualmente si el usuario lo desea
    let isDragging = false;
    let startX = 0;
    let dragStartAngle = 0;

    const domEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startX = e.clientX;
      dragStartAngle = targetCarouselAngle;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      targetCarouselAngle = dragStartAngle - dx * 0.006;
    };
    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      const nearestStep = Math.round(targetCarouselAngle / stepAngle);
      targetCarouselAngle = nearestStep * stepAngle;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 1000;
      const nh = container.clientHeight || 500;
      camera.aspect = nw / nh;
      camera.position.z = nw < 640 ? 14.0 : 12.2;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    onResize();
    window.addEventListener('resize', onResize);

    let rafId = 0;
    let isVisible = true;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      currentCarouselAngle += (targetCarouselAngle - currentCarouselAngle) * 0.08;

      const cw = container.clientWidth || 1000;
      const radiusX = cw < 640 ? 5.6 : 7.4;
      const radiusZ = 4.2;

      // Barrido suave de la luz puntual para hacer brillar las letras 3D
      pointLight1.position.x = Math.sin(elapsedTime * 1.6) * 6;
      pointLight1.position.y = Math.cos(elapsedTime * 1.2) * 2.5;

      slots.forEach((slot, i) => {
        const itemAngle = i * stepAngle - currentCarouselAngle;
        const sinA = Math.sin(itemAngle);
        const cosA = Math.cos(itemAngle);

        const x = sinA * radiusX;
        const z = (cosA - 1) * radiusZ + 1.8;
        const y = Math.sin(elapsedTime * 2.2 + i * 0.8) * 0.12;

        slot.slotGroup.position.set(x, y, z);

        // Escala prominente al frente (cosA = 1) y más pequeña hacia atrás
        const frontFactor = (cosA + 1) * 0.5;
        const scale = 0.38 + Math.pow(frontFactor, 1.55) * 0.68;
        slot.slotGroup.scale.setScalar(scale);

        // Todos los logos rotan automáticamente sobre su propio eje 3D
        slot.logoMeshGroup.rotation.y = elapsedTime * 1.15 + i * 0.7;
        slot.logoMeshGroup.rotation.x = Math.sin(elapsedTime * 1.4 + i) * 0.14;

        // Las letras 3D del nombre oscilan sutilmente hacia la cámara para lucir su extrusión y bisel 3D
        slot.titleMesh.rotation.x = -0.08 + Math.sin(elapsedTime * 1.6 + i) * 0.05;
        slot.titleMesh.rotation.y = Math.sin(elapsedTime * 1.3 + i) * 0.16 - sinA * 0.25;
      });

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !rafId) {
            clock.getDelta();
            animate();
          } else if (!isVisible && rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        });
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    animate();

    return () => {
      clearInterval(autoTimer);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <section
      id="skills"
      className="relative w-full overflow-hidden pt-20 flex flex-col items-center justify-center"
    >
      {/* Header */}
      <motion.div
        className="flex flex-col items-center justify-center mb-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-[2px] bg-[#2563eb]"></div>
          <h2 className="text-[#2563eb] font-bold tracking-[0.2em] text-sm uppercase">
            Tech Stack 3D
          </h2>
          <div className="w-8 h-[2px] bg-[#2563eb]"></div>
        </div>
        <h3 className="text-3xl md:text-5xl font-black text-white text-center">
          Habilidades
        </h3>
      </motion.div>

      {/* Carrusel 3D: Solo el Logo 3D arriba y su Nombre en Letras 3D abajo */}
      <div className="relative w-full max-w-[1400px] mx-auto flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full h-[420px] sm:h-[500px] cursor-grab active:cursor-grabbing"
        />
      </div>
    </section>
  );
};

export default Skills;
