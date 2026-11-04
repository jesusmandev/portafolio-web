import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SpeakerItem {
  cabinetGroup: THREE.Group;
  wooferGroup: THREE.Group;
  waveRings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[];
  eqBars: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[];
  basePos: THREE.Vector3;
  side: number;
}

interface LiquidWaterObj {
  surfaceMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhysicalMaterial>;
  meniscusRing: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  baseY: Float32Array;
}

const Computer3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    let animationFrameId = 0;

    // Variables de Three.js
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let setupGroup: THREE.Group;
    let monitorGroup: THREE.Group;
    let screenMesh: THREE.Mesh;
    let ledMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
    let ambientBacklight: THREE.PointLight;
    let screenGlowLight: THREE.PointLight;
    const keyboardKeys: THREE.Mesh[] = [];
    let mouseGroupRef: THREE.Group | null = null;
    const speakersList: SpeakerItem[] = [];
    let liquidWaterObj: LiquidWaterObj | null = null;

    // Motor de Audio Web API (Sintetizador Synthwave en Tiempo Real Automático)
    const soundEngine: {
      ctx: AudioContext | null;
      analyser: AnalyserNode | null;
      dataArray: Uint8Array<ArrayBuffer> | null;
      isPlaying: boolean;
      audioUnlocked: boolean;
      step: number;
      nextNoteTime: number;
      bassIntensity: number;
    } = {
      ctx: null,
      analyser: null,
      dataArray: null,
      isPlaying: true,
      audioUnlocked: false,
      step: 0,
      nextNoteTime: 0,
      bassIntensity: 0,
    };

    // Estado automático de la estación 3D
    const state = {
      powerOn: true,
      screenMode: 0, // 0: Gargantua Geodesic 3D Raymarching, 1: Matrix Crimson, 2: Cyberpunk Synth, 3: Analíticas
      modeNames: ['Robot 3D Pro', 'Matrix Crimson', 'Synthwave 3D', 'Sistema OS'],
      rgbMode: 0, // 0: Rojo Carmesí (JM)
      autoRotate: true,
      time: 0,
    };

    // Controles de cámara orbitales personalizados (encuadre completo con margen amplio en ambos lados)
    const camControl = {
      isDragging: false,
      prevX: 0,
      prevY: 0,
      theta: -0.05,
      phi: 1.18,
      radius: 7.1,
      targetTheta: -0.05,
      targetPhi: 1.18,
      targetRadius: 7.1,
      lookAtTarget: new THREE.Vector3(0.05, 0.85, 0.0),
    };

    // Canvas 2D dinámico para generar la textura en vivo de la pantalla del monitor
    const osCanvas = document.createElement('canvas');
    osCanvas.width = 1280;
    osCanvas.height = 720;
    const osCtx = osCanvas.getContext('2d')!;
    let screenTexture: THREE.CanvasTexture;

    // ---------------------------------------------------------------------------
    // Renderizador Offscreen del Robot 3D Pro (Compañero IA en pantalla completa)
    // ---------------------------------------------------------------------------
    const robotCanvas = document.createElement('canvas');
    robotCanvas.width = 960;
    robotCanvas.height = 540;
    let robotRenderer: THREE.WebGLRenderer | null = null;
    let robotScene: THREE.Scene | null = null;
    let robotCamera: THREE.PerspectiveCamera | null = null;

    let robotGroup: THREE.Group;
    let robotHeadGroup: THREE.Group;
    let robotBodyGroup: THREE.Group;
    let robotLeftArmPivot: THREE.Group;
    let robotRightArmPivot: THREE.Group;
    let robotFaceRoot: THREE.Group;
    let robotDefaultFaceGroup: THREE.Group;
    let robotLoveFaceGroup: THREE.Group;
    let robotStarFaceGroup: THREE.Group;
    let robotSurprisedFaceGroup: THREE.Group;
    let robotEqFaceGroup: THREE.Group;
    let robotSleepFaceGroup: THREE.Group;

    let robotLeftEyeArch: THREE.Group;
    let robotRightEyeArch: THREE.Group;
    let robotRightEyeWinkChevron: THREE.Group;
    let robotHappyMouthMesh: THREE.Group;
    let robotBlushLeft: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
    let robotBlushRight: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
    const robotEqBars: THREE.Mesh[] = [];
    let robotShadowDisc: THREE.Mesh;

    let lastActiveKey1 = -1;
    let lastActiveKey2 = -1;

    const robotDisposables: { dispose: () => void }[] = [];

    const robotState = {
      action: 'happy',
      actionTimer: 0,
      actionIndex: 0,
      blinkTimer: 0,
      isBlinking: false,
      squishVelocity: 0,
      squishAmount: 0,
      headPatTilt: 0,
      lookX: 0,
      lookY: 0,
      toastEmoji: '✨',
      toastText: '¡Hola humano!',
      actionsList: [
        { id: 'happy', label: 'Original', icon: '😊', toast: '✨ ¡Hola humano!' },
        { id: 'wave', label: 'Saludar', icon: '👋', toast: '👋 ¡Hola, bienvenido!' },
        { id: 'love', label: 'Amor', icon: '😍', toast: '🥰 ¡Diseño con amor!' },
        { id: 'dance', label: 'Fiesta DJ', icon: '🎵', toast: '🎵 ¡Ritmo en el código!' },
        { id: 'star', label: 'Genial', icon: '🤩', toast: '🤩 ¡Frontend Pro!' },
        { id: 'wink', label: 'Guiño', icon: '😉', toast: '😉 ¡Pixel-perfect!' },
        { id: 'surprised', label: 'Sorpresa', icon: '😮', toast: '😮 ¡Wow, qué fluido!' },
        { id: 'spin', label: 'Turbo Giro', icon: '🚀', toast: '🚀 ¡A toda velocidad!' },
      ]
    };

    function setRobotAction(actionId: string) {
      robotState.action = actionId;
      robotState.actionTimer = 0;
      robotState.squishVelocity = 0.22;

      const actItem = robotState.actionsList.find(a => a.id === actionId);
      if (actItem) {
        robotState.toastEmoji = actItem.icon;
        robotState.toastText = actItem.toast;
      }

      if (robotDefaultFaceGroup) {
        robotDefaultFaceGroup.visible = ['happy', 'wave', 'wink', 'spin'].includes(actionId);
      }
      if (robotRightEyeArch) {
        robotRightEyeArch.visible = actionId !== 'wink';
      }
      if (robotRightEyeWinkChevron) {
        robotRightEyeWinkChevron.visible = actionId === 'wink';
      }

      if (robotLoveFaceGroup) robotLoveFaceGroup.visible = actionId === 'love';
      if (robotStarFaceGroup) robotStarFaceGroup.visible = actionId === 'star';
      if (robotSurprisedFaceGroup) robotSurprisedFaceGroup.visible = actionId === 'surprised';
      if (robotEqFaceGroup) robotEqFaceGroup.visible = actionId === 'dance';
      if (robotSleepFaceGroup) robotSleepFaceGroup.visible = actionId === 'sleep';

      if (actionId === 'love' && robotBlushLeft && robotBlushRight) {
        robotBlushLeft.material.opacity = 0.75;
        robotBlushRight.material.opacity = 0.75;
      }
    }

    function addCleanOutline(mesh: THREE.Mesh, thickness = 0.048, colorHex = 0x171a2e) {
      const outlineMat = new THREE.ShaderMaterial({
        uniforms: {
          uThickness: { value: thickness },
          uColor: { value: new THREE.Color(colorHex) }
        },
        vertexShader: `
          uniform float uThickness;
          void main() {
            vec3 displaced = position + normalize(normal) * uThickness;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          void main() {
            gl_FragColor = vec4(uColor, 1.0);
          }
        `,
        side: THREE.BackSide
      });
      robotDisposables.push(outlineMat);

      const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
      mesh.add(outlineMesh);
      return outlineMesh;
    }

    function createBotSurfaceMaterial(litHex: number, shadowHex: number) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uLitColor: { value: new THREE.Color(litHex) },
          uShadowColor: { value: new THREE.Color(shadowHex) },
          uLightDir: { value: new THREE.Vector3(-0.68, 0.38, 0.62).normalize() },
          uSmoothness: { value: 0.045 },
          uSpecStrength: { value: 0.12 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uLitColor;
          uniform vec3 uShadowColor;
          uniform vec3 uLightDir;
          uniform float uSmoothness;
          uniform float uSpecStrength;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 n = normalize(vNormal);
            vec3 v = normalize(vViewDir);

            float ndotl = dot(n, uLightDir);
            float ramp = smoothstep(-0.12 - uSmoothness, -0.04 + uSmoothness, ndotl);
            vec3 col = mix(uShadowColor, uLitColor, ramp);

            vec3 halfVec = normalize(uLightDir + v);
            float spec = pow(max(dot(n, halfVec), 0.0), 32.0) * uSpecStrength;
            col += vec3(spec);

            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
      robotDisposables.push(mat);
      return mat;
    }

    function evalRoundedCapsuleBoxSDF(
      x: number,
      y: number,
      z: number,
      params: {
        width: number;
        height: number;
        depth: number;
        cornerRadiusXY: number;
        edgeRadiusZ: number;
        topArch?: number;
        pillowZ?: number;
      }
    ) {
      const halfW = params.width * 0.5;
      const halfH = params.height * 0.5;
      const halfD = params.depth * 0.5;
      const rxy = params.cornerRadiusXY;
      const rz = params.edgeRadiusZ;

      const nx = Math.min(1.0, Math.abs(x) / halfW);
      const archOffset = (params.topArch || 0) * Math.cos(nx * Math.PI * 0.5);
      const localY = y - archOffset * (y > 0 ? y / halfH : 0.25 * (y / halfH));

      const ny = Math.min(1.0, Math.abs(localY) / halfH);
      const pillow = (params.pillowZ || 0) * Math.cos(nx * Math.PI * 0.5) * Math.cos(ny * Math.PI * 0.5);
      const effectiveHalfD = halfD + pillow;

      const qx = Math.abs(x) - (halfW - rxy);
      const qy = Math.abs(localY) - (halfH - rxy);
      const dist2D = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - (rxy - rz);

      const qz = Math.abs(z) - (effectiveHalfD - rz);
      const dist3D = Math.hypot(Math.max(dist2D, 0), Math.max(qz, 0)) + Math.min(Math.max(dist2D, qz), 0) - rz;

      return dist3D;
    }

    function createSmoothSDFMeshGeometry(
      params: {
        width: number;
        height: number;
        depth: number;
        cornerRadiusXY: number;
        edgeRadiusZ: number;
        topArch?: number;
        pillowZ?: number;
      },
      subdivisions = 24
    ) {
      const geo = new THREE.BoxGeometry(1, 1, 1, subdivisions, subdivisions, subdivisions);
      const pos = geo.attributes.position;
      const normals = new Float32Array(pos.count * 3);

      const maxBound = Math.max(params.width, params.height, params.depth) * 1.2;
      const eps = 0.002;

      for (let i = 0; i < pos.count; i++) {
        let dx = pos.getX(i);
        let dy = pos.getY(i);
        let dz = pos.getZ(i);
        const len = Math.hypot(dx, dy, dz) || 1;
        dx /= len;
        dy /= len;
        dz /= len;

        let lo = 0.0;
        let hi = maxBound;
        for (let iter = 0; iter < 16; iter++) {
          const mid = (lo + hi) * 0.5;
          const d = evalRoundedCapsuleBoxSDF(dx * mid, dy * mid, dz * mid, params);
          if (d < 0) lo = mid;
          else hi = mid;
        }
        const r = (lo + hi) * 0.5;
        const px = dx * r;
        const py = dy * r;
        const pz = dz * r;

        pos.setXYZ(i, px, py, pz);

        const gx =
          evalRoundedCapsuleBoxSDF(px + eps, py, pz, params) -
          evalRoundedCapsuleBoxSDF(px - eps, py, pz, params);
        const gy =
          evalRoundedCapsuleBoxSDF(px, py + eps, pz, params) -
          evalRoundedCapsuleBoxSDF(px, py - eps, pz, params);
        const gz =
          evalRoundedCapsuleBoxSDF(px, py, pz + eps, params) -
          evalRoundedCapsuleBoxSDF(px, py - eps, pz, params);
        const glen = Math.hypot(gx, gy, gz) || 1;

        normals[i * 3] = gx / glen;
        normals[i * 3 + 1] = gy / glen;
        normals[i * 3 + 2] = gz / glen;
      }

      geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      robotDisposables.push(geo);
      return geo;
    }

    function getHeadFrontZ(
      x: number,
      y: number,
      headParams: {
        width: number;
        height: number;
        depth: number;
        cornerRadiusXY: number;
        edgeRadiusZ: number;
        topArch?: number;
        pillowZ?: number;
      }
    ) {
      let lo = 0.0;
      let hi = headParams.depth;
      for (let iter = 0; iter < 16; iter++) {
        const mid = (lo + hi) * 0.5;
        if (evalRoundedCapsuleBoxSDF(x, y, mid, headParams) < 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) * 0.5;
    }

    function createCurvedSurfacePatchGeometry(
      width: number,
      height: number,
      cornerRadius: number,
      headParams: {
        width: number;
        height: number;
        depth: number;
        cornerRadiusXY: number;
        edgeRadiusZ: number;
        topArch?: number;
        pillowZ?: number;
      },
      zOffset = 0.01
    ) {
      const radialSegs = 48;
      const ringSegs = 10;
      const halfW = width * 0.5;
      const halfH = height * 0.5;
      const r = Math.min(cornerRadius, halfW, halfH);

      function getBoundaryPoint(theta: number) {
        const ct = Math.cos(theta);
        const st = Math.sin(theta);
        let lo = 0;
        let hi = Math.hypot(halfW, halfH);
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) * 0.5;
          const x = ct * mid;
          const y = st * mid;
          const qx = Math.abs(x) - (halfW - r);
          const qy = Math.abs(y) - (halfH - r);
          const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
          if (d < 0) lo = mid;
          else hi = mid;
        }
        const dist = (lo + hi) * 0.5;
        return { x: ct * dist, y: st * dist };
      }

      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let j = 0; j <= ringSegs; j++) {
        const rho = j / ringSegs;
        for (let i = 0; i <= radialSegs; i++) {
          const theta = (i / radialSegs) * Math.PI * 2;
          const bPt = getBoundaryPoint(theta);
          const x = bPt.x * rho;
          const y = bPt.y * rho;
          const z = getHeadFrontZ(x, y, headParams) + zOffset;

          positions.push(x, y, z);
          uvs.push(x / width + 0.5, y / height + 0.5);
        }
      }

      for (let j = 0; j < ringSegs; j++) {
        for (let i = 0; i < radialSegs; i++) {
          const a = j * (radialSegs + 1) + i;
          const b = a + radialSegs + 1;
          const c = b + 1;
          const d = a + 1;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      robotDisposables.push(geo);
      return geo;
    }

    function createCurvedCapsuleArmGeometry(isLeft: boolean) {
      const dir = isLeft ? -1 : 1;
      const spineCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(dir * 0.18, -0.38, 0.02),
        new THREE.Vector3(dir * 0.25, -0.78, 0.0)
      );

      const rTop = 0.205;
      const rBottom = 0.225;
      const radialSegs = 24;
      const capSegs = 8;
      const bodySegs = 16;
      const totalRings = capSegs + bodySegs + capSegs;

      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      const frames = spineCurve.computeFrenetFrames(bodySegs, false);

      for (let ring = 0; ring <= totalRings; ring++) {
        const center = new THREE.Vector3();
        const tangent = new THREE.Vector3();
        const normalVec = new THREE.Vector3();
        const binormalVec = new THREE.Vector3();
        let ringRadius = 0;
        let axialOffset = 0;
        let sinLat = 0;
        let cosLat = 1;

        if (ring < capSegs) {
          const frac = ring / capSegs;
          const angle = (1 - frac) * (Math.PI * 0.5);
          sinLat = Math.sin(angle);
          cosLat = Math.cos(angle);

          center.copy(spineCurve.getPointAt(0));
          tangent.copy(frames.tangents[0]);
          normalVec.copy(frames.normals[0]);
          binormalVec.copy(frames.binormals[0]);

          ringRadius = rTop * cosLat;
          axialOffset = -rTop * sinLat;
        } else if (ring <= capSegs + bodySegs) {
          const idx = ring - capSegs;
          const t = idx / bodySegs;
          center.copy(spineCurve.getPointAt(t));
          tangent.copy(frames.tangents[idx]);
          normalVec.copy(frames.normals[idx]);
          binormalVec.copy(frames.binormals[idx]);

          ringRadius = rTop + (rBottom - rTop) * t;
          axialOffset = 0;
          sinLat = 0;
          cosLat = 1;
        } else {
          const frac = (ring - (capSegs + bodySegs)) / capSegs;
          const angle = frac * (Math.PI * 0.5);
          sinLat = Math.sin(angle);
          cosLat = Math.cos(angle);

          center.copy(spineCurve.getPointAt(1));
          tangent.copy(frames.tangents[bodySegs]);
          normalVec.copy(frames.normals[bodySegs]);
          binormalVec.copy(frames.binormals[bodySegs]);

          ringRadius = rBottom * cosLat;
          axialOffset = rBottom * sinLat;
        }

        for (let j = 0; j <= radialSegs; j++) {
          const theta = (j / radialSegs) * Math.PI * 2;
          const ct = Math.cos(theta);
          const st = Math.sin(theta);

          const radialDir = new THREE.Vector3()
            .addScaledVector(normalVec, ct)
            .addScaledVector(binormalVec, st);

          const posVec = new THREE.Vector3()
            .copy(center)
            .addScaledVector(tangent, axialOffset)
            .addScaledVector(radialDir, ringRadius);

          const normVec = new THREE.Vector3()
            .addScaledVector(radialDir, cosLat)
            .addScaledVector(tangent, ring < capSegs ? -sinLat : ring > capSegs + bodySegs ? sinLat : 0)
            .normalize();

          positions.push(posVec.x, posVec.y, posVec.z * 0.9);
          normals.push(normVec.x, normVec.y, normVec.z);
        }
      }

      for (let r = 0; r < totalRings; r++) {
        for (let j = 0; j < radialSegs; j++) {
          const a = r * (radialSegs + 1) + j;
          const b = a + radialSegs + 1;
          const c = b + 1;
          const d = a + 1;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setIndex(indices);
      robotDisposables.push(geo);
      return geo;
    }

    function getTorsoSurfacePoint(phi: number, theta: number, extraRadius = 0) {
      const yCenter = -0.58;
      const halfH = 0.78;
      const y = yCenter + halfH * Math.cos(phi);

      const baseR = 0.92 + 0.08 * Math.cos(phi) - 0.03 * Math.cos(2 * phi);
      const sinPhi = Math.sin(phi);

      const rx = baseR * sinPhi + extraRadius;
      const rz = baseR * 0.82 * sinPhi + extraRadius;

      const x = rx * Math.sin(theta);
      const z = rz * Math.cos(theta);
      return new THREE.Vector3(x, y, z);
    }

    function createCompactEggTorsoGeometry() {
      const latSegs = 32;
      const lonSegs = 40;
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i <= latSegs; i++) {
        const phi = (i / latSegs) * Math.PI;
        for (let j = 0; j <= lonSegs; j++) {
          const theta = (j / lonSegs) * Math.PI * 2;
          const p = getTorsoSurfacePoint(phi, theta, 0);
          positions.push(p.x, p.y, p.z);

          const eps = 0.005;
          const phi1 = Math.max(0.002, Math.min(Math.PI - 0.002, phi));
          const dPhi = getTorsoSurfacePoint(phi1 + eps, theta, 0).sub(getTorsoSurfacePoint(phi1 - eps, theta, 0));
          const dTheta = getTorsoSurfacePoint(phi1, theta + eps, 0).sub(getTorsoSurfacePoint(phi1 - eps, theta, 0));
          const n = new THREE.Vector3().crossVectors(dPhi, dTheta).normalize();
          if (i === 0) n.set(0, 1, 0);
          if (i === latSegs) n.set(0, -1, 0);
          normals.push(n.x, n.y, n.z);
        }
      }

      for (let i = 0; i < latSegs; i++) {
        for (let j = 0; j < lonSegs; j++) {
          const a = i * (lonSegs + 1) + j;
          const b = a + lonSegs + 1;
          const c = b + 1;
          const d = a + 1;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setIndex(indices);
      robotDisposables.push(geo);
      return geo;
    }

    function createVisorTexture() {
      const vCanvas = document.createElement('canvas');
      vCanvas.width = 512;
      vCanvas.height = 256;
      const vCtx = vCanvas.getContext('2d');
      if (vCtx) {
        vCtx.fillStyle = '#173749';
        vCtx.fillRect(0, 0, 512, 256);
        vCtx.fillStyle = '#0e2533';
        vCtx.beginPath();
        vCtx.moveTo(375, 0);
        vCtx.bezierCurveTo(428, 98, 378, 212, 220, 256);
        vCtx.lineTo(512, 256);
        vCtx.lineTo(512, 0);
        vCtx.closePath();
        vCtx.fill();
      }
      const tex = new THREE.CanvasTexture(vCanvas);
      tex.needsUpdate = true;
      robotDisposables.push(tex);
      return tex;
    }

    function buildRobot() {
      if (!robotScene) return;

      robotGroup = new THREE.Group();
      robotGroup.position.set(0, -0.22, 0);
      robotScene.add(robotGroup);

      const headAndBodyWhiteMat = createBotSurfaceMaterial(0xedf3fa, 0xcad6e6);
      const neckAndTopAntennaMat = createBotSurfaceMaterial(0xd2ddec, 0xb1c0d5);
      const sideEarGrayMat = createBotSurfaceMaterial(0xb7c6da, 0x95a6c0);

      const darkOutlineNavyMat = new THREE.MeshBasicMaterial({ color: 0x171a2e });
      const cyanBrightMat = new THREE.MeshBasicMaterial({ color: 0x66f9ff });
      const cyanUpperRimMat = new THREE.MeshBasicMaterial({ color: 0x22d8ec });
      const pinkLoveMat = new THREE.MeshBasicMaterial({ color: 0xff6b9d });
      const pureWhiteHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cyanBeltMat = new THREE.MeshBasicMaterial({ color: 0x1ce1f0 });

      robotDisposables.push(
        darkOutlineNavyMat,
        cyanBrightMat,
        cyanUpperRimMat,
        pinkLoveMat,
        pureWhiteHighlightMat,
        cyanBeltMat
      );

      // 1. CABEZA
      robotHeadGroup = new THREE.Group();
      robotHeadGroup.position.set(0, 1.15, 0);
      robotGroup.add(robotHeadGroup);

      const headParams = {
        width: 2.64,
        height: 1.74,
        depth: 1.48,
        cornerRadiusXY: 0.64,
        edgeRadiusZ: 0.56,
        topArch: 0.06,
        pillowZ: 0.09
      };

      const headGeo = createSmoothSDFMeshGeometry(headParams, 26);
      const headMesh = new THREE.Mesh(headGeo, headAndBodyWhiteMat);
      robotHeadGroup.add(headMesh);
      addCleanOutline(headMesh, 0.052);

      const antennaParams = {
        width: 0.96,
        height: 0.36,
        depth: 0.68,
        cornerRadiusXY: 0.17,
        edgeRadiusZ: 0.17,
        topArch: 0.04,
        pillowZ: 0.03
      };
      const antennaGeo = createSmoothSDFMeshGeometry(antennaParams, 16);
      const antennaMesh = new THREE.Mesh(antennaGeo, neckAndTopAntennaMat);
      antennaMesh.position.set(0, 0.89, 0);
      robotHeadGroup.add(antennaMesh);
      addCleanOutline(antennaMesh, 0.048);

      const earParams = {
        width: 0.42,
        height: 0.72,
        depth: 0.64,
        cornerRadiusXY: 0.20,
        edgeRadiusZ: 0.20,
        topArch: 0.0,
        pillowZ: 0.02
      };
      const earGeo = createSmoothSDFMeshGeometry(earParams, 16);

      const leftEar = new THREE.Mesh(earGeo, sideEarGrayMat);
      leftEar.position.set(-1.35, -0.02, 0);
      robotHeadGroup.add(leftEar);
      addCleanOutline(leftEar, 0.048);

      const rightEar = new THREE.Mesh(earGeo, sideEarGrayMat);
      rightEar.position.set(1.35, -0.02, 0);
      robotHeadGroup.add(rightEar);
      addCleanOutline(rightEar, 0.048);

      // Brillos en la cabeza
      const headHighlightGroup = new THREE.Group();
      const headHighlightPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const hx = -0.94 + t * 0.48;
        const hy = 0.64 + Math.sin(t * Math.PI * 0.65) * 0.11;
        const hz = getHeadFrontZ(hx, hy, headParams) + 0.012;
        headHighlightPts.push(new THREE.Vector3(hx, hy, hz));
      }
      const headPillCurve = new THREE.CatmullRomCurve3(headHighlightPts);
      const headPillGeo = new THREE.TubeGeometry(headPillCurve, 16, 0.042, 10, false);
      const headPillMesh = new THREE.Mesh(headPillGeo, pureWhiteHighlightMat);
      const hCap1 = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), pureWhiteHighlightMat);
      hCap1.position.copy(headHighlightPts[0]);
      const hCap2 = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), pureWhiteHighlightMat);
      hCap2.position.copy(headHighlightPts[headHighlightPts.length - 1]);
      headPillMesh.add(hCap1, hCap2);
      headHighlightGroup.add(headPillMesh);

      const headDotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), pureWhiteHighlightMat);
      headDotMesh.scale.set(1, 1, 0.45);
      headDotMesh.position.set(-1.05, 0.50, getHeadFrontZ(-1.05, 0.50, headParams) + 0.012);
      headHighlightGroup.add(headDotMesh);
      robotHeadGroup.add(headHighlightGroup);

      // 2. VISOR
      const visorBorderGeo = createCurvedSurfacePatchGeometry(2.14, 1.30, 0.50, headParams, 0.007);
      const visorBorderMesh = new THREE.Mesh(visorBorderGeo, darkOutlineNavyMat);
      robotHeadGroup.add(visorBorderMesh);

      const visorScreenGeo = createCurvedSurfacePatchGeometry(2.04, 1.20, 0.46, headParams, 0.013);
      const visorScreenMesh = new THREE.Mesh(
        visorScreenGeo,
        new THREE.MeshBasicMaterial({ map: createVisorTexture() })
      );
      robotHeadGroup.add(visorScreenMesh);

      // 3. EXPRESIONES FACIALES
      const visorCenterZ = getHeadFrontZ(0, 0, headParams) + 0.025;
      robotFaceRoot = new THREE.Group();
      robotFaceRoot.position.set(0, 0, visorCenterZ);
      robotHeadGroup.add(robotFaceRoot);

      robotDefaultFaceGroup = new THREE.Group();
      robotFaceRoot.add(robotDefaultFaceGroup);

      function createOriginalTwoToneEye() {
        const eyeContainer = new THREE.Group();
        const w = 0.46;
        const h = 0.26;
        const cornerR = 0.075;

        const eyeShape = new THREE.Shape();
        eyeShape.moveTo(-w * 0.5 + cornerR, -h * 0.36);
        eyeShape.lineTo(w * 0.5 - cornerR, -h * 0.36);
        eyeShape.quadraticCurveTo(w * 0.5, -h * 0.36, w * 0.5, -h * 0.36 + cornerR);
        eyeShape.absarc(0, -h * 0.36 + cornerR * 0.25, w * 0.5, 0, Math.PI, false);
        eyeShape.lineTo(-w * 0.5, -h * 0.36 + cornerR);
        eyeShape.quadraticCurveTo(-w * 0.5, -h * 0.36, -w * 0.5 + cornerR, -h * 0.36);

        const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, {
          depth: 0.014,
          bevelEnabled: true,
          bevelSegments: 4,
          steps: 1,
          bevelSize: 0.01,
          bevelThickness: 0.01
        });
        eyeGeo.center();
        robotDisposables.push(eyeGeo);

        const upperRim = new THREE.Mesh(eyeGeo, cyanUpperRimMat);
        upperRim.position.set(0, 0.014, 0);
        eyeContainer.add(upperRim);

        const lowerFill = new THREE.Mesh(eyeGeo, cyanBrightMat);
        lowerFill.scale.set(0.95, 0.82, 1);
        lowerFill.position.set(0, -0.018, 0.006);
        eyeContainer.add(lowerFill);

        return eyeContainer;
      }

      robotLeftEyeArch = createOriginalTwoToneEye();
      robotLeftEyeArch.position.set(-0.47, 0.05, -0.022);
      robotLeftEyeArch.rotation.y = -0.14;
      robotDefaultFaceGroup.add(robotLeftEyeArch);

      robotRightEyeArch = createOriginalTwoToneEye();
      robotRightEyeArch.position.set(0.47, 0.05, -0.022);
      robotRightEyeArch.rotation.y = 0.14;
      robotDefaultFaceGroup.add(robotRightEyeArch);

      robotRightEyeWinkChevron = new THREE.Group();
      const winkBarGeo = new THREE.BoxGeometry(0.32, 0.075, 0.02);
      const winkTop = new THREE.Mesh(winkBarGeo, cyanBrightMat);
      winkTop.position.set(0, 0.05, 0);
      winkTop.rotation.z = 0.40;
      const winkBot = new THREE.Mesh(winkBarGeo, cyanBrightMat);
      winkBot.position.set(0, -0.05, 0);
      winkBot.rotation.z = -0.40;
      robotRightEyeWinkChevron.add(winkTop, winkBot);
      robotRightEyeWinkChevron.position.set(0.47, 0.05, -0.02);
      robotRightEyeWinkChevron.rotation.y = 0.14;
      robotRightEyeWinkChevron.visible = false;
      robotDefaultFaceGroup.add(robotRightEyeWinkChevron);

      robotHappyMouthMesh = new THREE.Group();
      const mw = 0.27;
      const mouthShape = new THREE.Shape();
      mouthShape.moveTo(-mw * 0.5, 0.03);
      mouthShape.lineTo(mw * 0.5, 0.03);
      mouthShape.absarc(0, 0.03, mw * 0.5, 0, Math.PI, true);
      mouthShape.closePath();

      const mouthGeo = new THREE.ExtrudeGeometry(mouthShape, {
        depth: 0.014,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.008
      });
      mouthGeo.center();
      robotDisposables.push(mouthGeo);

      const mouthTopRim = new THREE.Mesh(mouthGeo, cyanUpperRimMat);
      mouthTopRim.position.set(0, 0.01, 0);
      const mouthBottomFill = new THREE.Mesh(mouthGeo, cyanBrightMat);
      mouthBottomFill.scale.set(0.94, 0.80, 1);
      mouthBottomFill.position.set(0, -0.012, 0.006);
      robotHappyMouthMesh.add(mouthTopRim, mouthBottomFill);
      robotHappyMouthMesh.position.set(0, -0.23, 0.0);
      robotDefaultFaceGroup.add(robotHappyMouthMesh);

      const blushGeo = new THREE.CircleGeometry(0.11, 20);
      blushGeo.scale(1.35, 0.75, 1);
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xff7eb3, transparent: true, opacity: 0.0 });
      robotDisposables.push(blushGeo, blushMat);
      robotBlushLeft = new THREE.Mesh(blushGeo, blushMat);
      robotBlushLeft.position.set(-0.68, -0.16, -0.035);
      robotBlushLeft.rotation.y = -0.2;
      robotBlushRight = new THREE.Mesh(blushGeo, blushMat);
      robotBlushRight.position.set(0.68, -0.16, -0.035);
      robotBlushRight.rotation.y = 0.2;
      robotFaceRoot.add(robotBlushLeft, robotBlushRight);

      // Amor (Corazones)
      robotLoveFaceGroup = new THREE.Group();
      robotLoveFaceGroup.visible = false;
      robotFaceRoot.add(robotLoveFaceGroup);

      function createHeartMesh() {
        const hs = new THREE.Shape();
        hs.moveTo(0, -0.14);
        hs.bezierCurveTo(0.20, -0.02, 0.25, 0.16, 0.12, 0.21);
        hs.bezierCurveTo(0.04, 0.24, 0, 0.16, 0, 0.12);
        hs.bezierCurveTo(0, 0.16, -0.04, 0.24, -0.12, 0.21);
        hs.bezierCurveTo(-0.25, 0.16, -0.20, -0.02, 0, -0.14);
        const hGeo = new THREE.ExtrudeGeometry(hs, { depth: 0.02, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
        hGeo.center();
        robotDisposables.push(hGeo);
        return new THREE.Mesh(hGeo, pinkLoveMat);
      }
      const leftHeart = createHeartMesh();
      leftHeart.position.set(-0.47, 0.05, -0.02);
      leftHeart.rotation.y = -0.14;
      const rightHeart = createHeartMesh();
      rightHeart.position.set(0.47, 0.05, -0.02);
      rightHeart.rotation.y = 0.14;
      robotLoveFaceGroup.add(leftHeart, rightHeart, robotHappyMouthMesh.clone());

      // Genial (Estrellas)
      robotStarFaceGroup = new THREE.Group();
      robotStarFaceGroup.visible = false;
      robotFaceRoot.add(robotStarFaceGroup);

      function createStarMesh() {
        const ss = new THREE.Shape();
        const outer = 0.21, inner = 0.08, spikes = 4;
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const angle = (i / (spikes * 2)) * Math.PI * 2;
          const sx = Math.cos(angle) * r;
          const sy = Math.sin(angle) * r;
          if (i === 0) ss.moveTo(sx, sy);
          else ss.lineTo(sx, sy);
        }
        ss.closePath();
        const sGeo = new THREE.ExtrudeGeometry(ss, { depth: 0.02, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
        sGeo.center();
        robotDisposables.push(sGeo);
        return new THREE.Mesh(sGeo, cyanBrightMat);
      }
      const leftStar = createStarMesh();
      leftStar.position.set(-0.47, 0.05, -0.02);
      leftStar.rotation.y = -0.14;
      const rightStar = createStarMesh();
      rightStar.position.set(0.47, 0.05, -0.02);
      rightStar.rotation.y = 0.14;
      const starMouth = robotHappyMouthMesh.clone();
      starMouth.scale.set(1.2, 1.2, 1);
      robotStarFaceGroup.add(leftStar, rightStar, starMouth);

      // Sorpresa
      robotSurprisedFaceGroup = new THREE.Group();
      robotSurprisedFaceGroup.visible = false;
      robotFaceRoot.add(robotSurprisedFaceGroup);

      const ringEyeGeo = new THREE.TorusGeometry(0.16, 0.048, 12, 24);
      const surpLeft = new THREE.Mesh(ringEyeGeo, cyanBrightMat);
      surpLeft.position.set(-0.47, 0.05, -0.02);
      surpLeft.rotation.y = -0.14;
      const surpRight = new THREE.Mesh(ringEyeGeo, cyanBrightMat);
      surpRight.position.set(0.47, 0.05, -0.02);
      surpRight.rotation.y = 0.14;
      const surpMouthGeo = new THREE.TorusGeometry(0.075, 0.032, 12, 20);
      const surpMouth = new THREE.Mesh(surpMouthGeo, cyanUpperRimMat);
      surpMouth.position.set(0, -0.23, 0);
      robotSurprisedFaceGroup.add(surpLeft, surpRight, surpMouth);

      // DJ Equalizer
      robotEqFaceGroup = new THREE.Group();
      robotEqFaceGroup.visible = false;
      robotFaceRoot.add(robotEqFaceGroup);

      const numBars = 9;
      for (let i = 0; i < numBars; i++) {
        const barGeo = new THREE.BoxGeometry(0.105, 0.38, 0.02);
        const mat = i % 2 === 0 ? cyanBrightMat : cyanUpperRimMat;
        const bar = new THREE.Mesh(barGeo, mat);
        const bx = (i - (numBars - 1) / 2) * 0.17;
        bar.position.set(bx, -0.02, -Math.abs(bx) * 0.04);
        robotEqFaceGroup.add(bar);
        robotEqBars.push(bar);
      }

      // Dormir
      robotSleepFaceGroup = new THREE.Group();
      robotSleepFaceGroup.visible = false;
      robotFaceRoot.add(robotSleepFaceGroup);

      const sleepEyeGeo = new THREE.TorusGeometry(0.17, 0.038, 12, 24, Math.PI);
      sleepEyeGeo.rotateZ(Math.PI);
      const sleepL = new THREE.Mesh(sleepEyeGeo, cyanUpperRimMat);
      sleepL.position.set(-0.47, 0.09, -0.02);
      sleepL.rotation.y = -0.14;
      const sleepR = new THREE.Mesh(sleepEyeGeo, cyanUpperRimMat);
      sleepR.position.set(0.47, 0.09, -0.02);
      sleepR.rotation.y = 0.14;
      const sleepMouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), cyanBrightMat);
      sleepMouth.position.set(0, -0.23, 0);
      robotSleepFaceGroup.add(sleepL, sleepR, sleepMouth);

      // 4. TORSO Y CUELLO
      robotBodyGroup = new THREE.Group();
      robotGroup.add(robotBodyGroup);

      const neckGeo = new THREE.CylinderGeometry(0.39, 0.41, 0.34, 28);
      const neckMesh = new THREE.Mesh(neckGeo, neckAndTopAntennaMat);
      neckMesh.position.set(0, 0.19, 0);
      robotBodyGroup.add(neckMesh);
      addCleanOutline(neckMesh, 0.048);

      const collarPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const cx = Math.sin(a) * 0.415;
        const cz = Math.cos(a) * 0.36;
        const cy = 0.08 - Math.cos(a) * 0.045;
        collarPts.push(new THREE.Vector3(cx, cy, cz));
      }
      const collarMesh = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(collarPts, true), 36, 0.030, 8, true),
        darkOutlineNavyMat
      );
      robotBodyGroup.add(collarMesh);

      const torsoGeo = createCompactEggTorsoGeometry();
      const torsoMesh = new THREE.Mesh(torsoGeo, headAndBodyWhiteMat);
      robotBodyGroup.add(torsoMesh);
      addCleanOutline(torsoMesh, 0.052);

      const chestHighlightGroup = new THREE.Group();
      const chestArcPts = [
        getTorsoSurfacePoint(0.70, -0.68, 0.016),
        getTorsoSurfacePoint(0.84, -0.80, 0.016),
        getTorsoSurfacePoint(1.00, -0.88, 0.016),
        getTorsoSurfacePoint(1.16, -0.92, 0.016)
      ];
      const chestArcCurve = new THREE.CatmullRomCurve3(chestArcPts);
      const chestArcMesh = new THREE.Mesh(
        new THREE.TubeGeometry(chestArcCurve, 16, 0.040, 10, false),
        pureWhiteHighlightMat
      );
      const cCap1 = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), pureWhiteHighlightMat);
      cCap1.position.copy(chestArcPts[0]);
      const cCap2 = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), pureWhiteHighlightMat);
      cCap2.position.copy(chestArcPts[3]);
      chestArcMesh.add(cCap1, cCap2);
      chestHighlightGroup.add(chestArcMesh);

      const chestDotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 12), pureWhiteHighlightMat);
      chestDotMesh.scale.set(1, 1, 0.5);
      chestDotMesh.position.copy(getTorsoSurfacePoint(1.34, -0.93, 0.018));
      chestHighlightGroup.add(chestDotMesh);
      robotBodyGroup.add(chestHighlightGroup);

      // Cinturón cian escalonado
      const cyanBeltGroup = new THREE.Group();
      const phiSide = 1.82;
      const phiStepTop = 1.90;
      const phiStepBottom = 2.04;
      const stepTheta = 0.39;
      const beltOffset = 0.012;
      const beltRadius = 0.022;

      const leftSidePts: THREE.Vector3[] = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const th = -1.42 + t * (-stepTheta - -1.42);
        const ph = phiSide + t * (phiStepTop - phiSide);
        leftSidePts.push(getTorsoSurfacePoint(ph, th, beltOffset));
      }
      cyanBeltGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftSidePts), 16, beltRadius, 8, false), cyanBeltMat)
      );

      const leftStepPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const ph = phiStepTop + t * (phiStepBottom - phiStepTop);
        leftStepPts.push(getTorsoSurfacePoint(ph, -stepTheta, beltOffset));
      }
      cyanBeltGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftStepPts), 6, beltRadius, 8, false), cyanBeltMat)
      );

      const centerPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const th = -stepTheta + t * (stepTheta * 2);
        const ph = phiStepBottom + Math.cos((th / stepTheta) * (Math.PI * 0.5)) * 0.025;
        centerPts.push(getTorsoSurfacePoint(ph, th, beltOffset));
      }
      cyanBeltGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(centerPts), 18, beltRadius, 8, false), cyanBeltMat)
      );

      const rightStepPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const ph = phiStepBottom + t * (phiStepTop - phiStepBottom);
        rightStepPts.push(getTorsoSurfacePoint(ph, stepTheta, beltOffset));
      }
      cyanBeltGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightStepPts), 6, beltRadius, 8, false), cyanBeltMat)
      );

      const rightSidePts: THREE.Vector3[] = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const th = stepTheta + t * (1.42 - stepTheta);
        const ph = phiStepTop + t * (phiSide - phiStepTop);
        rightSidePts.push(getTorsoSurfacePoint(ph, th, beltOffset));
      }
      cyanBeltGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightSidePts), 16, beltRadius, 8, false), cyanBeltMat)
      );

      [
        getTorsoSurfacePoint(phiStepTop, -stepTheta, beltOffset),
        getTorsoSurfacePoint(phiStepBottom, -stepTheta, beltOffset),
        getTorsoSurfacePoint(phiStepBottom, stepTheta, beltOffset),
        getTorsoSurfacePoint(phiStepTop, stepTheta, beltOffset)
      ].forEach(pt => {
        const cornerSphere = new THREE.Mesh(new THREE.SphereGeometry(beltRadius, 8, 8), cyanBeltMat);
        cornerSphere.position.copy(pt);
        cyanBeltGroup.add(cornerSphere);
      });

      robotBodyGroup.add(cyanBeltGroup);

      // 5. BRAZOS
      function buildArmPivot(isLeft: boolean) {
        const dir = isLeft ? -1 : 1;
        const pivot = new THREE.Group();
        pivot.position.set(dir * 0.86, -0.18, -0.02);

        const armGeo = createCurvedCapsuleArmGeometry(isLeft);
        const armMesh = new THREE.Mesh(armGeo, headAndBodyWhiteMat);
        pivot.add(armMesh);
        addCleanOutline(armMesh, 0.048);

        return pivot;
      }

      robotLeftArmPivot = buildArmPivot(true);
      robotRightArmPivot = buildArmPivot(false);
      robotBodyGroup.add(robotLeftArmPivot, robotRightArmPivot);

      // 6. SOMBRA
      const shadowGeo = new THREE.CircleGeometry(0.68, 36);
      shadowGeo.rotateX(-Math.PI * 0.5);
      shadowGeo.scale(1.25, 1, 0.42);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x050b18,
        transparent: true,
        opacity: 0.85
      });
      robotDisposables.push(shadowGeo, shadowMat);
      robotShadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
      robotShadowDisc.position.set(0, -1.96, 0);
      robotScene.add(robotShadowDisc);

      // 7. FONDO OSCURO PROCEDIMENTAL EN GPU Y CÁMARA CENTRADA
      const bgGeo = new THREE.PlaneGeometry(28, 16);
      const bgMat = new THREE.ShaderMaterial({
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          void main() {
            float dist = distance(vUv, vec2(0.5, 0.48)) * 1.32;
            vec3 colCenter = vec3(0.118, 0.161, 0.231); // #1e293b
            vec3 colMid    = vec3(0.059, 0.090, 0.165); // #0f172a
            vec3 colEdge   = vec3(0.008, 0.024, 0.090); // #020617
            vec3 col = mix(colCenter, colMid, smoothstep(0.0, 0.65, dist));
            col = mix(col, colEdge, smoothstep(0.65, 1.15, dist));
            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
      robotDisposables.push(bgGeo, bgMat);
      const bgMesh = new THREE.Mesh(bgGeo, bgMat);
      bgMesh.position.set(0, 0, -4.5);
      robotScene.add(bgMesh);

      robotCamera = new THREE.PerspectiveCamera(32, robotCanvas.width / robotCanvas.height, 0.1, 100);
      robotCamera.position.set(0, 0.10, 6.6);
      robotCamera.lookAt(0, -0.05, 0);

      const ambLight = new THREE.AmbientLight(0xffffff, 0.95);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
      dirLight.position.set(-5, 7, 6);
      const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
      rimLight.position.set(5, -3, -4);
      robotScene.add(ambLight, dirLight, rimLight);
    }

    try {
      robotRenderer = new THREE.WebGLRenderer({
        canvas: robotCanvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      robotRenderer.setPixelRatio(1);
      robotRenderer.setSize(robotCanvas.width, robotCanvas.height, false);
      robotScene = new THREE.Scene();
      buildRobot();
    } catch (err) {
      console.warn('Robot 3D offscreen renderer setup fallback:', err);
    }
// Datos para el efecto Matrix en pantalla
    const matrixCols = 52;
    const matrixDrops = Array(matrixCols).fill(1);

    // Inicializar o reanudar el motor de sonido Web Audio API automáticamente
    function initOrResumeAudio() {
      if (!soundEngine.isPlaying || isDisposed) return;
      try {
        if (!soundEngine.ctx) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          soundEngine.ctx = new AudioCtx();
          soundEngine.analyser = soundEngine.ctx.createAnalyser();
          soundEngine.analyser.fftSize = 64;
          soundEngine.dataArray = new Uint8Array(new ArrayBuffer(soundEngine.analyser.frequencyBinCount));

          const masterGain = soundEngine.ctx.createGain();
          masterGain.gain.value = 0.18;
          soundEngine.analyser.connect(masterGain);
          masterGain.connect(soundEngine.ctx.destination);
          soundEngine.nextNoteTime = soundEngine.ctx.currentTime + 0.05;
        }
        if (soundEngine.ctx.state === 'suspended') {
          soundEngine.ctx.resume();
        }
        soundEngine.audioUnlocked = soundEngine.ctx.state === 'running';
      } catch {
        // Esperando primera interacción del navegador
      }
    }

    // Disparar bombo, bajo synthwave y arpegio cristalino
    function triggerSynthStep(step: number, noteTime: number) {
      const ctx = soundEngine.ctx;
      if (!ctx || !soundEngine.analyser) return;

      if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, noteTime);
        osc.frequency.exponentialRampToValueAtTime(32, noteTime + 0.12);

        gain.gain.setValueAtTime(0.95, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.14);

        osc.connect(gain);
        gain.connect(soundEngine.analyser);
        osc.start(noteTime);
        osc.stop(noteTime + 0.15);
      }

      const bassFreqs = [55, 55, 65.41, 55, 73.42, 65.41, 82.41, 73.42];
      if (step % 2 === 0) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreqs[(step / 2) % bassFreqs.length], noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(520, noteTime);
        filter.frequency.exponentialRampToValueAtTime(140, noteTime + 0.11);

        gain.gain.setValueAtTime(0.38, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(soundEngine.analyser);
        osc.start(noteTime);
        osc.stop(noteTime + 0.13);
      }

      const arpFreqs = [220, 261.63, 329.63, 392.0, 440, 392.0, 329.63, 261.63];
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(
        arpFreqs[step % arpFreqs.length] * (step > 11 ? 1.5 : 1),
        noteTime
      );

      arpGain.gain.setValueAtTime(0.16, noteTime);
      arpGain.gain.exponentialRampToValueAtTime(0.005, noteTime + 0.11);

      arpOsc.connect(arpGain);
      arpGain.connect(soundEngine.analyser);
      arpOsc.start(noteTime);
      arpOsc.stop(noteTime + 0.12);
    }

    // Programar notas del sintetizador electrónico automáticamente
    function updateSynthAudio(time: number) {
      if (!soundEngine.isPlaying) {
        soundEngine.bassIntensity = 0;
        return;
      }

      if (soundEngine.ctx && soundEngine.ctx.state === 'running' && soundEngine.analyser && soundEngine.dataArray) {
        while (soundEngine.nextNoteTime < soundEngine.ctx.currentTime + 0.12) {
          triggerSynthStep(soundEngine.step, soundEngine.nextNoteTime);
          soundEngine.nextNoteTime += 0.135;
          soundEngine.step = (soundEngine.step + 1) % 16;
        }
        soundEngine.analyser.getByteFrequencyData(soundEngine.dataArray);
        let lowSum = 0;
        for (let i = 0; i < 6; i++) lowSum += soundEngine.dataArray[i];
        soundEngine.bassIntensity = Math.min(1, (lowSum / (6 * 255)) * 1.45);
      } else {
        const beatPhase = (time * 3.7) % 1;
        const kickEnv = Math.pow(Math.max(0, 1 - beatPhase * 3.2), 2);
        const subWave = Math.abs(Math.sin(time * 28)) * 0.35;
        soundEngine.bassIntensity = kickEnv * 0.85 + subWave * 0.25;
      }
    }

    function updateCameraPosition(instant = false) {
      if (instant) {
        camControl.theta = camControl.targetTheta;
        camControl.phi = camControl.targetPhi;
        camControl.radius = camControl.targetRadius;
      } else {
        camControl.theta += (camControl.targetTheta - camControl.theta) * 0.08;
        camControl.phi += (camControl.targetPhi - camControl.phi) * 0.08;
        camControl.radius += (camControl.targetRadius - camControl.radius) * 0.08;
      }

      camControl.targetPhi = Math.max(0.35, Math.min(Math.PI / 2 - 0.02, camControl.targetPhi));
      camControl.targetRadius = Math.max(3.8, Math.min(11, camControl.targetRadius));

      camera.position.x = camControl.radius * Math.sin(camControl.phi) * Math.sin(camControl.theta);
      camera.position.y = camControl.radius * Math.cos(camControl.phi);
      camera.position.z = camControl.radius * Math.sin(camControl.phi) * Math.cos(camControl.theta);

      camera.lookAt(camControl.lookAtTarget);
    }

    function setupLights() {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xf0f6ff, 0.72);
      mainLight.position.set(5, 9, 6);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 25;
      const d = 5;
      mainLight.shadow.camera.left = -d;
      mainLight.shadow.camera.right = d;
      mainLight.shadow.camera.top = d;
      mainLight.shadow.camera.bottom = -d;
      mainLight.shadow.bias = -0.0005;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0x2563eb, 0.95);
      fillLight.position.set(-6, 3, 3);
      scene.add(fillLight);

      ambientBacklight = new THREE.PointLight(0x2563eb, 3.2, 9);
      ambientBacklight.position.set(0, 1.6, -0.6);
      scene.add(ambientBacklight);

      screenGlowLight = new THREE.PointLight(0x3b82f6, 1.25, 5.5);
      screenGlowLight.position.set(0, 1.3, 0.85);
      scene.add(screenGlowLight);
    }

    function createJMBrandTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#04060d';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.85)';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 236, 236);
      ctx.fillStyle = '#2563eb';
      ctx.shadowColor = '#2563eb';
      ctx.shadowBlur = 22;
      ctx.font = '900 105px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('JM', 128, 134);
      return new THREE.CanvasTexture(c);
    }

    function createSmoothBoxGeometry(w: number, h: number, d: number, r = 0.04, segs = 6) {
      const maxR = Math.min(w, h, d) * 0.48;
      const radius = Math.min(r, maxR);
      const sx = Math.max(8, Math.round(segs * 2.5));
      const sy = Math.max(6, Math.round(segs * 2));
      const sz = Math.max(8, Math.round(segs * 2.5));

      const geo = new THREE.BoxGeometry(w, h, d, sx, sy, sz);
      const pos = geo.attributes.position;
      const hx = w / 2 - radius;
      const hy = h / 2 - radius;
      const hz = d / 2 - radius;

      const v = new THREE.Vector3();
      const c = new THREE.Vector3();
      const dir = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        c.set(
          Math.max(-hx, Math.min(hx, v.x)),
          Math.max(-hy, Math.min(hy, v.y)),
          Math.max(-hz, Math.min(hz, v.z))
        );
        dir.subVectors(v, c);
        if (dir.lengthSq() > 1e-8) {
          dir.normalize().multiplyScalar(radius);
          v.copy(c).add(dir);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }

    function createRoundedExtrude(
      w: number,
      h: number,
      depth: number,
      cornerRadius = 0.08,
      bevel = 0.025,
      curveSegments = 24
    ) {
      const iw = Math.max(0.01, w - bevel * 2);
      const ih = Math.max(0.01, h - bevel * 2);
      const r = Math.min(cornerRadius, iw / 2 - 0.002, ih / 2 - 0.002);

      const shape = new THREE.Shape();
      const x = -iw / 2;
      const y = -ih / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + iw - r, y);
      shape.quadraticCurveTo(x + iw, y, x + iw, y + r);
      shape.lineTo(x + iw, y + ih - r);
      shape.quadraticCurveTo(x + iw, y + ih, x + iw - r, y + ih);
      shape.lineTo(x + r, y + ih);
      shape.quadraticCurveTo(x, y + ih, x, y + ih - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);

      const extrudeDepth = Math.max(0.002, depth - bevel * 2);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelSegments: 8,
        steps: 1,
        bevelSize: bevel,
        bevelThickness: bevel,
        curveSegments: curveSegments,
      });
      geo.center();
      geo.computeVertexNormals();
      return geo;
    }

    function createRoundedPlane(w: number, h: number, r = 0.08, segments = 20) {
      const shape = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      const rad = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
      shape.moveTo(x + rad, y);
      shape.lineTo(x + w - rad, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + rad);
      shape.lineTo(x + w, y + h - rad);
      shape.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      shape.lineTo(x + rad, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - rad);
      shape.lineTo(x, y + rad);
      shape.quadraticCurveTo(x, y, x + rad, y);

      const geo = new THREE.ShapeGeometry(shape, segments);
      const pos = geo.attributes.position;
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + w / 2) / w;
        uvs[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      return geo;
    }

    function createDeskAndEnvironment() {
      const deskGroup = new THREE.Group();
      setupGroup.add(deskGroup);

      const deskMat = new THREE.MeshPhysicalMaterial({
        color: 0x050811,
        roughness: 0.32,
        metalness: 0.15,
        clearcoat: 0.5,
        clearcoatRoughness: 0.25,
      });

      const topBoard = new THREE.Mesh(createSmoothBoxGeometry(6.05, 0.14, 2.05, 0.06, 8), deskMat);
      topBoard.position.set(0, -0.07, 0.08);
      topBoard.castShadow = true;
      topBoard.receiveShadow = true;
      deskGroup.add(topBoard);

      // Tira LED azul intensa perimetral en el borde frontal de la mesa
      const deskFrontLed = new THREE.Mesh(
        createSmoothBoxGeometry(5.92, 0.024, 0.028, 0.01, 6),
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      deskFrontLed.position.set(0, -0.07, 1.1);
      deskGroup.add(deskFrontLed);

      // Base inferior flotante biselada (sin patas cortadas abajo) para que la mesa se vea 100% completa
      const underBaseGeo = createSmoothBoxGeometry(5.45, 0.06, 1.7, 0.025, 6);
      const underBaseMat = new THREE.MeshPhysicalMaterial({
        color: 0x03050a,
        roughness: 0.3,
        metalness: 0.6,
        clearcoat: 0.5,
      });
      const underBase = new THREE.Mesh(underBaseGeo, underBaseMat);
      underBase.position.set(0, -0.16, 0.08);
      deskGroup.add(underBase);

      const underGlowStrip = new THREE.Mesh(
        createSmoothBoxGeometry(5.52, 0.014, 1.74, 0.006, 6),
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      underGlowStrip.position.set(0, -0.135, 0.08);
      deskGroup.add(underGlowStrip);

      // Alfombrilla XL con borde luminoso azul intenso
      const matGlowGeo = createRoundedExtrude(4.96, 1.54, 0.008, 0.13, 0.003, 32);
      matGlowGeo.rotateX(Math.PI / 2);
      const matGlow = new THREE.Mesh(
        matGlowGeo,
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      matGlow.position.set(0, 0.002, 0.34);
      deskGroup.add(matGlow);

      const matGeo = createRoundedExtrude(4.9, 1.48, 0.014, 0.12, 0.003, 32);
      matGeo.rotateX(Math.PI / 2);
      const matMat = new THREE.MeshStandardMaterial({ color: 0x04060c, roughness: 0.88 });
      const mouseMat = new THREE.Mesh(matGeo, matMat);
      mouseMat.position.set(0, 0.005, 0.34);
      mouseMat.receiveShadow = true;
      deskGroup.add(mouseMat);

      const jmTexture = createJMBrandTexture();

      // Cubo luminoso "JM"
      const cubeGroup = new THREE.Group();
      cubeGroup.position.set(-1.64, 0.2, 0.44);
      cubeGroup.rotation.y = 0.35;
      setupGroup.add(cubeGroup);

      const cubeCore = new THREE.Mesh(createSmoothBoxGeometry(0.38, 0.38, 0.38, 0.05, 8), deskMat);
      cubeCore.castShadow = true;
      cubeGroup.add(cubeCore);

      const faceGeo = createRoundedPlane(0.32, 0.32, 0.04, 16);
      const faceMat = new THREE.MeshBasicMaterial({ map: jmTexture, transparent: true });
      const cubeFace = new THREE.Mesh(faceGeo, faceMat);
      cubeFace.position.set(0, 0, 0.194);
      cubeGroup.add(cubeFace);

      const cubeGlow = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.013, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      cubeGlow.position.set(0, 0, 0.196);
      cubeGroup.add(cubeGlow);

      // Barras LED azules intensas decorativas horizontales
      [-1.24, 1.24].forEach((bx) => {
        const ledBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.035, 0.045),
          new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        ledBar.position.set(bx, 0.018, -0.05);
        deskGroup.add(ledBar);
      });

      // Vaso/taza de cerámica "JM" con interior hueco y agua 3D animada
      const mugGroup = new THREE.Group();
      mugGroup.position.set(1.7, 0.01, 0.44);
      mugGroup.rotation.y = -0.35;
      setupGroup.add(mugGroup);

      const coaster = new THREE.Mesh(
        createRoundedExtrude(0.36, 0.36, 0.018, 0.175, 0.006, 32).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 })
      );
      coaster.position.y = 0.009;
      mugGroup.add(coaster);

      const mugMat = new THREE.MeshPhysicalMaterial({
        color: 0x09090b,
        roughness: 0.18,
        metalness: 0.1,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
      });
      const mugOuterWall = new THREE.Mesh(
        new THREE.CylinderGeometry(0.135, 0.122, 0.29, 40, 1, true),
        mugMat
      );
      mugOuterWall.position.y = 0.155;
      mugOuterWall.castShadow = true;
      mugGroup.add(mugOuterWall);

      const mugBottom = new THREE.Mesh(
        new THREE.CircleGeometry(0.122, 40).rotateX(Math.PI / 2),
        mugMat
      );
      mugBottom.position.y = 0.01;
      mugGroup.add(mugBottom);

      const mugInnerMat = new THREE.MeshPhysicalMaterial({
        color: 0xcffafe,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 0.9,
        side: THREE.BackSide,
      });
      const mugInnerWall = new THREE.Mesh(
        new THREE.CylinderGeometry(0.123, 0.112, 0.275, 40, 1, true),
        mugInnerMat
      );
      mugInnerWall.position.y = 0.16;
      mugGroup.add(mugInnerWall);

      const mugInnerBottom = new THREE.Mesh(
        new THREE.CircleGeometry(0.112, 40).rotateX(-Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0x67e8f9, roughness: 0.2 })
      );
      mugInnerBottom.position.y = 0.025;
      mugGroup.add(mugInnerBottom);

      const mugRim = new THREE.Mesh(new THREE.TorusGeometry(0.129, 0.0085, 20, 44), mugMat);
      mugRim.rotation.x = Math.PI / 2;
      mugRim.position.y = 0.3;
      mugGroup.add(mugRim);

      const waterVolumeGeo = new THREE.CylinderGeometry(0.121, 0.112, 0.235, 40);
      const waterVolumeMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.22,
        roughness: 0.05,
        metalness: 0.05,
        transparent: true,
        opacity: 0.72,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });
      const waterVolume = new THREE.Mesh(waterVolumeGeo, waterVolumeMat);
      waterVolume.position.y = 0.142;
      mugGroup.add(waterVolume);

      const waterTopGeo = new THREE.PlaneGeometry(0.242, 0.242, 10, 10);
      waterTopGeo.rotateX(-Math.PI / 2);
      const wPos = waterTopGeo.attributes.position;
      const wBaseY = new Float32Array(wPos.count);
      for (let i = 0; i < wPos.count; i++) {
        const vx = wPos.getX(i);
        const vz = wPos.getZ(i);
        const dist = Math.hypot(vx, vz);
        const maxR = 0.1205;
        if (dist > maxR) {
          const ang = Math.atan2(vz, vx);
          wPos.setX(i, Math.cos(ang) * maxR);
          wPos.setZ(i, Math.sin(ang) * maxR);
        }
        wBaseY[i] = wPos.getY(i);
      }
      waterTopGeo.computeVertexNormals();

      const waterSurfaceMat = new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.38,
        roughness: 0.04,
        metalness: 0.15,
        transparent: true,
        opacity: 0.88,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
      });
      const waterSurface = new THREE.Mesh(waterTopGeo, waterSurfaceMat);
      waterSurface.position.y = 0.262;
      mugGroup.add(waterSurface);

      const meniscusRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.119, 0.0035, 12, 40).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.85 })
      );
      meniscusRing.position.y = 0.264;
      mugGroup.add(meniscusRing);

      liquidWaterObj = {
        surfaceMesh: waterSurface,
        meniscusRing: meniscusRing,
        baseY: wBaseY,
      };

      const mugLabel = new THREE.Mesh(
        createRoundedPlane(0.155, 0.155, 0.025, 16),
        new THREE.MeshBasicMaterial({ map: jmTexture, transparent: true })
      );
      mugLabel.position.set(0, 0.155, 0.136);
      mugGroup.add(mugLabel);

      const mugHandle = new THREE.Mesh(
        new THREE.TorusGeometry(0.078, 0.019, 20, 36, Math.PI),
        mugMat
      );
      mugHandle.rotation.z = -Math.PI / 2;
      mugHandle.position.set(0.128, 0.155, 0);
      mugGroup.add(mugHandle);
    }

    function createMonitor() {
      monitorGroup = new THREE.Group();
      setupGroup.add(monitorGroup);

      const spaceGrayMetal = new THREE.MeshPhysicalMaterial({
        color: 0x18181b,
        roughness: 0.22,
        metalness: 0.85,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
      });

      const darkAnodized = new THREE.MeshPhysicalMaterial({
        color: 0x09090b,
        roughness: 0.28,
        metalness: 0.65,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
      });

      const crimsonAccent = new THREE.MeshPhysicalMaterial({
        color: 0x2563eb,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.75,
        roughness: 0.16,
        metalness: 0.8,
        clearcoat: 0.85,
      });

      const baseHubGeo = createRoundedExtrude(1.02, 0.62, 0.048, 0.16, 0.016, 28);
      baseHubGeo.rotateX(Math.PI / 2);
      const baseHub = new THREE.Mesh(baseHubGeo, darkAnodized);
      baseHub.position.set(0, 0.025, -0.25);
      baseHub.castShadow = true;
      baseHub.receiveShadow = true;
      monitorGroup.add(baseHub);

      const baseGlowGeo = createRoundedExtrude(1.04, 0.64, 0.012, 0.17, 0.004, 24);
      baseGlowGeo.rotateX(Math.PI / 2);
      const baseGlowMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const baseGlow = new THREE.Mesh(baseGlowGeo, baseGlowMat);
      baseGlow.position.set(0, 0.006, -0.25);
      monitorGroup.add(baseGlow);

      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.04, -0.28),
        new THREE.Vector3(0, 0.52, -0.42),
        new THREE.Vector3(0, 1.12, -0.4),
        new THREE.Vector3(0, 1.52, -0.24),
      ]);
      const pillarGeo = new THREE.TubeGeometry(armCurve, 40, 0.088, 28, false);
      const pillar = new THREE.Mesh(pillarGeo, spaceGrayMetal);
      pillar.castShadow = true;
      monitorGroup.add(pillar);

      const cableRingGeo = new THREE.TorusGeometry(0.105, 0.018, 20, 40);
      const cableRing = new THREE.Mesh(cableRingGeo, crimsonAccent);
      cableRing.rotation.x = Math.PI / 2 - 0.15;
      cableRing.position.set(0, 0.48, -0.41);
      monitorGroup.add(cableRing);

      const vesaMountGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.12, 40);
      const vesaMount = new THREE.Mesh(vesaMountGeo, darkAnodized);
      vesaMount.rotation.x = Math.PI / 2;
      vesaMount.position.set(0, 1.52, -0.25);
      monitorGroup.add(vesaMount);

      const ringGeo = new THREE.TorusGeometry(0.32, 0.026, 20, 56);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const vesaRing = new THREE.Mesh(ringGeo, ringMat);
      vesaRing.position.set(0, 1.52, -0.2);
      monitorGroup.add(vesaRing);

      const screenWidth = 3.74;
      const screenHeight = 2.14;
      const chassisDepth = 0.095;

      const panelGroup = new THREE.Group();
      panelGroup.position.set(0, 1.64, -0.16);
      panelGroup.rotation.x = -0.025;
      monitorGroup.add(panelGroup);

      const outerFrameGeo = createRoundedExtrude(
        screenWidth + 0.08,
        screenHeight + 0.08,
        chassisDepth,
        0.14,
        0.032,
        32
      );
      const outerFrame = new THREE.Mesh(outerFrameGeo, spaceGrayMetal);
      outerFrame.castShadow = true;
      outerFrame.receiveShadow = true;
      panelGroup.add(outerFrame);

      const backCoreGeo = createRoundedExtrude(
        screenWidth * 0.62,
        screenHeight * 0.56,
        0.065,
        0.22,
        0.028,
        28
      );
      const backCore = new THREE.Mesh(backCoreGeo, darkAnodized);
      backCore.position.set(0, 0, -chassisDepth / 2 - 0.02);
      panelGroup.add(backCore);

      const glassFaceGeo = createRoundedPlane(screenWidth + 0.02, screenHeight + 0.02, 0.11, 28);
      const glassFaceMat = new THREE.MeshPhysicalMaterial({
        color: 0x050507,
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      });
      const glassFace = new THREE.Mesh(glassFaceGeo, glassFaceMat);
      glassFace.position.set(0, 0, chassisDepth / 2 + 0.002);
      panelGroup.add(glassFace);

      const chinHeight = 0.075;
      const logoBarGeo = createSmoothBoxGeometry(0.18, 0.018, 0.01, 0.008, 6);
      const logoBarMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const logoBar = new THREE.Mesh(logoBarGeo, logoBarMat);
      logoBar.position.set(0, -screenHeight / 2 + chinHeight / 2, chassisDepth / 2 + 0.006);
      panelGroup.add(logoBar);

      screenTexture = new THREE.CanvasTexture(robotCanvas);
      screenTexture.minFilter = THREE.LinearFilter;
      screenTexture.magFilter = THREE.LinearFilter;

      const bezelThickness = 0.042;
      const displayGeo = createRoundedPlane(
        screenWidth - bezelThickness * 2,
        screenHeight - bezelThickness - chinHeight,
        0.065,
        24
      );
      const displayMat = new THREE.MeshBasicMaterial({ map: screenTexture });
      screenMesh = new THREE.Mesh(displayGeo, displayMat);
      screenMesh.position.set(0, (chinHeight - bezelThickness) / 2, chassisDepth / 2 + 0.005);
      panelGroup.add(screenMesh);

      const lightBarGroup = new THREE.Group();
      lightBarGroup.position.set(0, screenHeight / 2 + 0.065, chassisDepth / 2 + 0.075);
      panelGroup.add(lightBarGroup);

      const barTubeGeo = new THREE.CylinderGeometry(0.024, 0.024, 1.64, 32);
      const barTube = new THREE.Mesh(barTubeGeo, darkAnodized);
      barTube.rotation.z = Math.PI / 2;
      lightBarGroup.add(barTube);

      [-0.82, 0.82].forEach((endX) => {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.024, 24, 16), crimsonAccent);
        cap.position.x = endX;
        lightBarGroup.add(cap);
      });

      const barEmitterGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.56, 16);
      barEmitterGeo.rotateZ(Math.PI / 2);
      const barEmitterMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const barEmitter = new THREE.Mesh(barEmitterGeo, barEmitterMat);
      barEmitter.position.set(0, -0.02, 0.005);
      lightBarGroup.add(barEmitter);

      const clipGeo = createSmoothBoxGeometry(0.2, 0.095, 0.17, 0.035, 8);
      const clip = new THREE.Mesh(clipGeo, spaceGrayMetal);
      clip.position.set(0, -0.015, -0.055);
      lightBarGroup.add(clip);

      const camLensGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.025, 28);
      const camLensMat = new THREE.MeshPhysicalMaterial({
        color: 0x2563eb,
        roughness: 0.1,
        metalness: 0.9,
        clearcoat: 1.0,
      });
      const camLens = new THREE.Mesh(camLensGeo, camLensMat);
      camLens.rotation.x = Math.PI / 2;
      camLens.position.set(0, 0.042, 0.025);
      lightBarGroup.add(camLens);

      const ledGeo = new THREE.SphereGeometry(0.014, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(
        screenWidth / 2 - 0.18,
        -screenHeight / 2 + chinHeight / 2,
        chassisDepth / 2 + 0.006
      );
      panelGroup.add(ledMesh);
    }

    function createPeripherals() {
      const kbGroup = new THREE.Group();
      kbGroup.position.set(-0.2, 0.022, 0.48);
      kbGroup.rotation.x = 0.065;
      setupGroup.add(kbGroup);

      const underglowGeo = createRoundedExtrude(1.62, 0.62, 0.028, 0.085, 0.01, 24);
      underglowGeo.rotateX(Math.PI / 2);
      const underglowMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
      underglowMesh.position.y = -0.015;
      kbGroup.add(underglowMesh);

      const kbBaseGeo = createRoundedExtrude(1.59, 0.59, 0.068, 0.075, 0.022, 28);
      kbBaseGeo.rotateX(Math.PI / 2);
      const kbBaseMat = new THREE.MeshPhysicalMaterial({
        color: 0x09090b,
        roughness: 0.24,
        metalness: 0.72,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      });
      const kbBase = new THREE.Mesh(kbBaseGeo, kbBaseMat);
      kbBase.castShadow = true;
      kbBase.receiveShadow = true;
      kbGroup.add(kbBase);

      const wristGeo = createSmoothBoxGeometry(1.58, 0.046, 0.25, 0.022, 8);
      const wristMat = new THREE.MeshPhysicalMaterial({
        color: 0x0b0b0e,
        roughness: 0.45,
        metalness: 0.15,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
      });
      const wristRest = new THREE.Mesh(wristGeo, wristMat);
      wristRest.position.set(0, -0.008, 0.44);
      wristRest.rotation.x = 0.08;
      wristRest.castShadow = true;
      kbGroup.add(wristRest);

      const switchPlateGeo = createRoundedPlane(1.48, 0.49, 0.04, 16);
      const switchPlateMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
      const switchPlate = new THREE.Mesh(switchPlateGeo, switchPlateMat);
      switchPlate.rotation.x = -Math.PI / 2;
      switchPlate.position.y = 0.035;
      kbGroup.add(switchPlate);

      const coilGroup = new THREE.Group();
      coilGroup.position.set(-0.45, 0.01, -0.36);
      kbGroup.add(coilGroup);
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.3,
        metalness: 0.45,
      });
      for (let i = 0; i < 12; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.009, 14, 24), coilMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = i * 0.016;
        coilGroup.add(ring);
      }
      const aviatorPlug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.09, 20),
        new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.2 })
      );
      aviatorPlug.rotation.z = Math.PI / 2;
      aviatorPlug.position.set(0.24, 0, 0);
      coilGroup.add(aviatorPlug);

      const knobGroup = new THREE.Group();
      knobGroup.position.set(0.67, 0.055, -0.19);
      kbGroup.add(knobGroup);
      const knobMat = new THREE.MeshPhysicalMaterial({
        color: 0x2563eb,
        roughness: 0.18,
        metalness: 0.85,
        clearcoat: 0.8,
      });
      const volumeKnob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.046, 0.048, 0.048, 32),
        knobMat
      );
      knobGroup.add(volumeKnob);
      const knobBevel = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 16, 32), knobMat);
      knobBevel.rotation.x = Math.PI / 2;
      knobBevel.position.y = 0.022;
      knobGroup.add(knobBevel);

      function createSculptedKeycapGeo(kw: number, kh: number, kd: number) {
        const geo = createSmoothBoxGeometry(kw, kh, kd, 0.013, 4);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let vx = pos.getX(i);
          let vy = pos.getY(i);
          let vz = pos.getZ(i);
          if (vy > 0) {
            vx *= 0.86;
            vz *= 0.86;
            const nx = vx / (kw * 0.5);
            const nz = vz / (kd * 0.5);
            const dish = Math.max(0, 1 - (nx * nx + nz * nz));
            vy -= 0.0045 * dish;
          }
          pos.setXYZ(i, vx, vy, vz);
        }
        geo.computeVertexNormals();
        return geo;
      }

      const keyGeo = createSculptedKeycapGeo(0.078, 0.042, 0.078);
      const spaceGeo = createSculptedKeycapGeo(0.54, 0.044, 0.078);

      const keyAlphaMat = new THREE.MeshPhysicalMaterial({
        color: 0x18181b,
        roughness: 0.32,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
      });
      const keyModMat = new THREE.MeshPhysicalMaterial({
        color: 0x0b0b0e,
        roughness: 0.36,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
      });
      const keyAccentMat = new THREE.MeshPhysicalMaterial({
        color: 0x2563eb,
        roughness: 0.22,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.55,
        clearcoat: 0.65,
      });
      const keyEnterMat = new THREE.MeshPhysicalMaterial({
        color: 0x1d4ed8,
        roughness: 0.22,
        emissive: 0x1e40af,
        emissiveIntensity: 0.55,
        clearcoat: 0.65,
      });

      const rows = 5;
      const cols = 15;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 0 && c === 14) continue;

          if (r === 4 && c > 3 && c < 10) {
            if (c === 4) {
              const spaceKey = new THREE.Mesh(spaceGeo, keyModMat);
              spaceKey.position.set(-0.67 + 6.5 * 0.095, 0.052, -0.19 + r * 0.095);
              spaceKey.userData = { baseY: 0.052 };
              spaceKey.castShadow = true;
              kbGroup.add(spaceKey);
              keyboardKeys.push(spaceKey);
            }
            continue;
          }

          let chosenMat = keyAlphaMat;
          if (r === 0 && c === 0) chosenMat = keyAccentMat;
          else if (r === 2 && c === 14) chosenMat = keyEnterMat;
          else if ((r === 1 && c === 2) || (r === 2 && c >= 1 && c <= 3)) chosenMat = keyAccentMat;
          else if (c === 0 || c >= 13 || r === 4) chosenMat = keyModMat;

          const keyMesh = new THREE.Mesh(keyGeo, chosenMat);
          keyMesh.position.set(-0.67 + c * 0.095, 0.052, -0.19 + r * 0.095);
          keyMesh.userData = { baseY: 0.052 };
          keyMesh.castShadow = true;
          kbGroup.add(keyMesh);
          keyboardKeys.push(keyMesh);
        }
      }

      // Mouse paramétrico 3D
      (function buildCustomParametricMouse() {
        const L = 1.9;
        const W = 1.1;
        const H = 1.15;
        const EDGE = 0.16;
        const SH = 0.4;
        const T = 128;
        const HALF = Math.PI / 2;

        function pt(th: number, r: number, y: number) {
          const wx = W * (1 + 0.14 * Math.sin(th));
          return new THREE.Vector3(
            Math.cos(th) * wx * r,
            y,
            Math.sin(th) * L * r + SH * (1 - r * r)
          );
        }

        function domeY(s: number) {
          return EDGE + (H - EDGE) * Math.pow(1 - Math.pow(s, 2.1), 0.55);
        }

        function surf(th: number, r: number) {
          const y0 = domeY(r);
          const p = pt(th, r, y0);
          p.y = EDGE + (y0 - EDGE) * (1 + (0.07 * p.x) / W);
          return p;
        }

        const smooth = (a: number, b: number, x: number) => {
          const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
          return t * t * (3 - 2 * t);
        };

        function lathe(profile: number[][]) {
          const P = profile.length;
          const pos = new Float32Array(T * P * 3);
          for (let j = 0; j < T; j++) {
            const th = (j / T) * Math.PI * 2;
            for (let i = 0; i < P; i++) {
              const r = profile[i][0];
              const y0 = profile[i][1];
              const p = pt(th, r, y0);
              if (y0 > EDGE) p.y = EDGE + (y0 - EDGE) * (1 + (0.07 * p.x) / W);
              pos.set([p.x, p.y, p.z], (j * P + i) * 3);
            }
          }
          const idx: number[] = [];
          for (let j = 0; j < T; j++) {
            for (let i = 0; i < P - 1; i++) {
              const a = j * P + i;
              const b = ((j + 1) % T) * P + i;
              idx.push(a, b, a + 1, b, b + 1, a + 1);
            }
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          g.setIndex(idx);
          g.computeVertexNormals();
          const n = g.attributes.normal;
          const avg = new THREE.Vector3();
          for (let j = 0; j < T; j++) avg.add(new THREE.Vector3().fromBufferAttribute(n, j * P));
          avg.normalize();
          for (let j = 0; j < T; j++) n.setXYZ(j * P, avg.x, avg.y, avg.z);
          return g;
        }

        const mouse = new THREE.Group();
        mouse.scale.setScalar(0.185);
        mouse.position.set(1.02, 0.022, 0.5);
        setupGroup.add(mouse);
        mouseGroupRef = mouse;

        const top: number[][] = [];
        const N = 64;
        for (let k = 0; k <= N; k++) {
          const s = Math.sin((k / N) * HALF);
          top.push([s, domeY(s)]);
        }
        top.push([0.997, 0.145]);
        const shellMat = new THREE.MeshPhysicalMaterial({
          color: 0x3a3a3d,
          roughness: 0.42,
          metalness: 0.05,
          clearcoat: 0.45,
          clearcoatRoughness: 0.28,
          side: THREE.DoubleSide,
        });
        const shell = new THREE.Mesh(lathe(top), shellMat);
        shell.castShadow = true;
        shell.receiveShadow = true;
        mouse.add(shell);

        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x1d1d1f,
          roughness: 0.45,
          side: THREE.DoubleSide,
        });
        const base = new THREE.Mesh(
          lathe([
            [0, 0],
            [0.82, 0],
            [0.93, 0.015],
            [0.98, 0.06],
            [0.99, 0.14],
          ]),
          baseMat
        );
        base.castShadow = true;
        mouse.add(base);

        const zw = -0.7;
        const zToR = (z: number) => (-L + Math.sqrt(L * L - 4 * SH * (z - SH))) / (2 * SH);
        const rS = zToR(-0.2);
        const TH0 = -HALF + 0.045;
        const TH1 = -HALF + 1.05;
        const btnMat = new THREE.MeshPhysicalMaterial({
          color: 0x3a3a3d,
          roughness: 0.35,
          metalness: 0.05,
          clearcoat: 0.55,
          clearcoatRoughness: 0.22,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });

        function buttonPatch(mirror: boolean) {
          const NU = 40;
          const NV = 32;
          const rA = rS + 0.012;
          const rB = 0.996;
          const pos: number[] = [];
          const idx: number[] = [];
          for (let i = 0; i <= NU; i++) {
            let th = TH0 + ((TH1 - TH0) * i) / NU;
            if (mirror) th = -Math.PI - th;
            for (let j = 0; j <= NV; j++) {
              const p = surf(th, rA + ((rB - rA) * j) / NV);
              pos.push(p.x, p.y, p.z);
            }
          }
          for (let i = 0; i < NU; i++) {
            for (let j = 0; j < NV; j++) {
              const a = i * (NV + 1) + j;
              const b = (i + 1) * (NV + 1) + j;
              idx.push(a, b, a + 1, b, b + 1, a + 1);
            }
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setIndex(idx);
          g.computeVertexNormals();
          const P = g.attributes.position;
          const Nn = g.attributes.normal;
          for (let i = 0; i <= NU; i++) {
            for (let j = 0; j <= NV; j++) {
              const u = i / NU;
              const v = j / NV;
              const k = i * (NV + 1) + j;
              const d = Math.min(u * 1.2, (1 - u) * 1.2, v * 1.25);
              let lift = 0.017 * smooth(0, 0.09, d) * smooth(1, 0.9, v);
              lift -=
                0.011 *
                Math.exp(-(((u - 0.5) * (u - 0.5)) / 0.06 + ((v - 0.5) * (v - 0.5)) / 0.09));
              P.setXYZ(
                k,
                P.getX(k) + Nn.getX(k) * lift,
                P.getY(k) + Nn.getY(k) * lift,
                P.getZ(k) + Nn.getZ(k) * lift
              );
            }
          }
          g.computeVertexNormals();
          const m = new THREE.Mesh(g, btnMat);
          m.castShadow = true;
          return m;
        }
        mouse.add(buttonPatch(false), buttonPatch(true));

        const wheel = new THREE.Group();
        const rubber = new THREE.MeshStandardMaterial({ color: 0x3b3b3f, roughness: 0.85 });
        const R = 0.3;
        wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.2, 40).rotateZ(HALF), rubber));
        const wy = domeY(zToR(zw)) - 0.1;
        wheel.position.set(0, wy, zw);
        mouse.add(wheel);
      })();

      // Parlantes Activos con Ondas Acústicas y Ecualizador
      const spkStandGeo = createRoundedExtrude(0.42, 0.42, 0.075, 0.1, 0.02, 24);
      spkStandGeo.rotateX(Math.PI / 2);
      const spkCabinetGeo = createSmoothBoxGeometry(0.48, 0.76, 0.46, 0.085, 10);
      const spkBaffleGeo = createRoundedExtrude(0.41, 0.69, 0.032, 0.075, 0.012, 24);
      const spkPortGeo = createRoundedExtrude(0.24, 0.044, 0.025, 0.02, 0.006, 16);
      const eqPillGeo = createSmoothBoxGeometry(0.044, 0.12, 0.044, 0.018, 5);

      [-2.48, 2.48].forEach((posX, index) => {
        const spkAnchor = new THREE.Group();
        spkAnchor.position.set(posX, 0.0, -0.18);
        spkAnchor.rotation.y = posX < 0 ? 0.28 : -0.28;
        setupGroup.add(spkAnchor);

        const standMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.75 });
        const stand = new THREE.Mesh(spkStandGeo, standMat);
        stand.position.y = 0.038;
        spkAnchor.add(stand);

        const cabinetGroup = new THREE.Group();
        cabinetGroup.position.set(0, 0.44, 0);
        spkAnchor.add(cabinetGroup);

        const cabinetMat = new THREE.MeshPhysicalMaterial({
          color: 0x09090b,
          roughness: 0.22,
          metalness: 0.45,
          clearcoat: 0.75,
          clearcoatRoughness: 0.18,
        });
        const cabinet = new THREE.Mesh(spkCabinetGeo, cabinetMat);
        cabinet.castShadow = true;
        cabinet.receiveShadow = true;
        cabinetGroup.add(cabinet);

        const baffleMat = new THREE.MeshPhysicalMaterial({
          color: 0x111114,
          roughness: 0.32,
          clearcoat: 0.4,
        });
        const baffle = new THREE.Mesh(spkBaffleGeo, baffleMat);
        baffle.position.z = 0.222;
        cabinetGroup.add(baffle);

        [-0.205, 0.205].forEach((lx) => {
          const stripGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.56, 16);
          const stripMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
          const strip = new THREE.Mesh(stripGeo, stripMat);
          strip.position.set(lx, 0, 0.236);
          cabinetGroup.add(strip);
        });

        const tweeterRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.076, 0.015, 24, 48),
          new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        tweeterRing.position.set(0, 0.19, 0.238);
        cabinetGroup.add(tweeterRing);

        const tweeterDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 28, 20),
          new THREE.MeshPhysicalMaterial({
            color: 0x09090b,
            roughness: 0.15,
            metalness: 0.85,
            clearcoat: 0.9,
          })
        );
        tweeterDome.scale.z = 0.52;
        tweeterDome.position.set(0, 0.19, 0.232);
        cabinetGroup.add(tweeterDome);

        const wooferFrame = new THREE.Mesh(
          new THREE.TorusGeometry(0.144, 0.019, 24, 48),
          new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        wooferFrame.position.set(0, -0.08, 0.238);
        cabinetGroup.add(wooferFrame);

        const wooferGroup = new THREE.Group();
        wooferGroup.position.set(0, -0.08, 0.232);
        cabinetGroup.add(wooferGroup);

        const surroundMesh = new THREE.Mesh(
          new THREE.TorusGeometry(0.122, 0.014, 20, 40),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55 })
        );
        surroundMesh.position.z = 0.008;
        wooferGroup.add(surroundMesh);

        const coneGeo = new THREE.CylinderGeometry(0.125, 0.052, 0.055, 40, 1, true);
        const coneMat = new THREE.MeshPhysicalMaterial({
          color: 0x1d4ed8,
          emissive: 0x1e3a8a,
          emissiveIntensity: 0.35,
          roughness: 0.25,
          metalness: 0.35,
          clearcoat: 0.5,
          side: THREE.DoubleSide,
        });
        const wooferCone = new THREE.Mesh(coneGeo, coneMat);
        wooferCone.rotation.x = Math.PI / 2;
        wooferGroup.add(wooferCone);

        const dustCap = new THREE.Mesh(
          new THREE.SphereGeometry(0.056, 28, 20),
          new THREE.MeshPhysicalMaterial({
            color: 0x09090b,
            roughness: 0.18,
            metalness: 0.75,
            clearcoat: 0.85,
          })
        );
        dustCap.scale.z = 0.45;
        dustCap.position.z = 0.016;
        wooferGroup.add(dustCap);

        const portMesh = new THREE.Mesh(
          spkPortGeo,
          new THREE.MeshBasicMaterial({ color: 0x020203 })
        );
        portMesh.position.set(0, -0.275, 0.23);
        cabinetGroup.add(portMesh);

        const wavesContainer = new THREE.Group();
        wavesContainer.position.set(0, 0.4, 0.26);
        spkAnchor.add(wavesContainer);

        const waveRings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
        for (let w = 0; w < 4; w++) {
          const wGeo = new THREE.TorusGeometry(0.13, 0.009, 16, 48);
          const wMat = new THREE.MeshBasicMaterial({
            color: w % 2 === 0 ? 0x2563eb : 0x3b82f6,
            transparent: true,
            opacity: 0.0,
          });
          const wMesh = new THREE.Mesh(wGeo, wMat);
          wMesh.userData = { phaseOffset: w * 0.25 };
          wavesContainer.add(wMesh);
          waveRings.push(wMesh);
        }

        const eqBars: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
        const eqGroup = new THREE.Group();
        eqGroup.position.set(0, 0.86, 0);
        spkAnchor.add(eqGroup);
        for (let b = 0; b < 5; b++) {
          const barMat = new THREE.MeshBasicMaterial({
            color: b % 2 === 0 ? 0x2563eb : 0x3b82f6,
          });
          const bar = new THREE.Mesh(eqPillGeo, barMat);
          bar.position.x = (b - 2) * 0.07;
          eqGroup.add(bar);
          eqBars.push(bar);
        }

        speakersList.push({
          cabinetGroup,
          wooferGroup,
          waveRings,
          eqBars,
          basePos: new THREE.Vector3(0, 0.44, 0),
          side: index === 0 ? -1 : 1,
        });
      });
    }

    function drawRobot3DScreen(_w: number, _h: number, time: number) {
      if (!robotRenderer || !robotScene || !robotCamera) return;

      // 1. Ciclo automático de expresiones cada 4.8 segundos
      const cycleLength = 4.8;
      const currentActionIdx = Math.floor(time / cycleLength) % robotState.actionsList.length;
      if (currentActionIdx !== robotState.actionIndex) {
        robotState.actionIndex = currentActionIdx;
        setRobotAction(robotState.actionsList[currentActionIdx].id);
      }

      // 2. Físicas elásticas ultra fluidas (Squash & Stretch)
      robotState.squishAmount += robotState.squishVelocity;
      robotState.squishVelocity -= robotState.squishAmount * 0.28;
      robotState.squishVelocity *= 0.82;
      robotState.headPatTilt *= 0.92;

      const scaleY = 1 - robotState.squishAmount * 0.3;
      const scaleXZ = 1 + robotState.squishAmount * 0.18;
      robotGroup.scale.set(scaleXZ, scaleY, scaleXZ);

      // 3. Levitación suave y sombra
      const hoverSpeed = robotState.action === 'sleep' ? 1.2 : 2.2;
      const hoverAmp = robotState.action === 'sleep' ? 0.05 : 0.09;
      const hoverOffset = Math.sin(time * hoverSpeed) * hoverAmp;
      robotGroup.position.y = -0.22 + hoverOffset;

      const shadowScale = 1 - hoverOffset * 0.35;
      robotShadowDisc.scale.set(1.25 * shadowScale, 1, 0.42 * shadowScale);

      // 4. Parpadeo orgánico de ojos
      robotState.blinkTimer += 0.016;
      if (robotState.blinkTimer > 3.6) {
        robotState.isBlinking = true;
        if (robotState.blinkTimer > 3.78) {
          robotState.isBlinking = false;
          robotState.blinkTimer = 0;
        }
      }

      // 5. Mirada procedimental fluida (el robot explora su entorno con curiosidad)
      robotState.lookX += (Math.sin(time * 0.7) * 0.22 - robotState.lookX) * 0.06;
      robotState.lookY += (Math.cos(time * 0.9) * 0.12 - robotState.lookY) * 0.06;

      let targetHeadRotY = robotState.lookX;
      let targetHeadRotX = robotState.lookY;
      let targetHeadRotZ = robotState.headPatTilt;

      let targetLeftArmZ = 0;
      let targetRightArmZ = 0;
      let targetLeftArmX = 0;
      let targetRightArmX = 0;

      const eyeBlinkScale = robotState.isBlinking ? 0.08 : 1;
      let mouthScaleX = 1;
      let mouthScaleY = 1;

      // Animaciones cinemáticas según el estado
      if (robotState.action === 'wave') {
        targetRightArmZ = 2.25 + Math.sin(time * 11) * 0.25;
        targetRightArmX = -0.18;
        targetHeadRotZ = -0.08;
        mouthScaleX = 1.15;
        mouthScaleY = 1.18;
      } else if (robotState.action === 'love') {
        const beat = 1 + Math.sin(time * 8) * 0.14;
        robotLoveFaceGroup.children[0]?.scale.set(beat, beat, 1);
        robotLoveFaceGroup.children[1]?.scale.set(beat, beat, 1);
        targetHeadRotZ = Math.sin(time * 3) * 0.08;
        targetLeftArmZ = -0.22;
        targetRightArmZ = 0.22;
      } else if (robotState.action === 'star') {
        if (robotStarFaceGroup.children[0]) robotStarFaceGroup.children[0].rotation.z = time * 2.2;
        if (robotStarFaceGroup.children[1]) robotStarFaceGroup.children[1].rotation.z = -time * 2.2;
        robotGroup.position.y = -0.22 + hoverOffset + Math.abs(Math.sin(time * 6)) * 0.12;
        targetLeftArmZ = -0.42;
        targetRightArmZ = 0.42;
      } else if (robotState.action === 'wink') {
        targetHeadRotZ = 0.12;
        mouthScaleX = 1.18;
      } else if (robotState.action === 'surprised') {
        const tremble = Math.sin(time * 30) * 0.018;
        targetHeadRotZ = tremble;
        targetLeftArmZ = -0.35;
        targetRightArmZ = 0.35;
      } else if (robotState.action === 'dance') {
        robotGroup.position.y = -0.22 + Math.abs(Math.sin(time * 7.5)) * 0.22;
        robotGroup.rotation.z = Math.sin(time * 3.75) * 0.09;
        targetHeadRotZ = -Math.sin(time * 3.75) * 0.14;
        targetHeadRotY = Math.cos(time * 3.75) * 0.2;
        targetLeftArmZ = -0.55 + Math.sin(time * 7.5) * 0.45;
        targetRightArmZ = 0.55 + Math.cos(time * 7.5) * 0.45;

        robotEqBars.forEach((bar, i) => {
          const barH = 0.25 + Math.abs(Math.sin(time * 10 + i * 0.7)) * 1.1;
          bar.scale.y = barH;
        });
      } else if (robotState.action === 'spin') {
        robotGroup.rotation.y += 0.08;
        targetLeftArmZ = -0.38;
        targetRightArmZ = 0.38;
      }

      if (robotState.action !== 'dance') {
        robotGroup.rotation.z += (0 - robotGroup.rotation.z) * 0.1;
      }
      if (robotState.action !== 'spin') {
        const curY = robotGroup.rotation.y % (Math.PI * 2);
        robotGroup.rotation.y = curY + (0 - curY) * 0.1;
      }

      robotHeadGroup.rotation.y += (targetHeadRotY - robotHeadGroup.rotation.y) * 0.12;
      robotHeadGroup.rotation.x += (targetHeadRotX - robotHeadGroup.rotation.x) * 0.12;
      robotHeadGroup.rotation.z += (targetHeadRotZ - robotHeadGroup.rotation.z) * 0.12;

      robotFaceRoot.position.x = targetHeadRotY * 0.055;
      robotFaceRoot.position.y = targetHeadRotX * 0.035;

      robotLeftEyeArch.scale.y += (eyeBlinkScale - robotLeftEyeArch.scale.y) * 0.28;
      robotRightEyeArch.scale.y += (eyeBlinkScale - robotRightEyeArch.scale.y) * 0.28;
      robotHappyMouthMesh.scale.x += (mouthScaleX - robotHappyMouthMesh.scale.x) * 0.2;
      robotHappyMouthMesh.scale.y += (mouthScaleY - robotHappyMouthMesh.scale.y) * 0.2;

      const idleSwing = Math.sin(time * hoverSpeed) * 0.035;
      robotLeftArmPivot.rotation.z += (targetLeftArmZ - idleSwing - robotLeftArmPivot.rotation.z) * 0.12;
      robotRightArmPivot.rotation.z += (targetRightArmZ + idleSwing - robotRightArmPivot.rotation.z) * 0.12;
      robotLeftArmPivot.rotation.x += (targetLeftArmX - robotLeftArmPivot.rotation.x) * 0.12;
      robotRightArmPivot.rotation.x += (targetRightArmX - robotRightArmPivot.rotation.x) * 0.12;

      // 6. Renderizar Robot 3D directamente en el offscreen WebGL Canvas sin sobrecoste de textos 2D
      robotRenderer.render(robotScene, robotCamera);
    }

    function drawMatrixMode(w: number, h: number) {
      osCtx.fillStyle = 'rgba(3, 6, 16, 0.22)';
      osCtx.fillRect(0, 0, w, h);

      osCtx.font = 'bold 21px monospace';

      const chars = 'JM0123456789FRONTEND<>/{}$#@&%*';
      for (let i = 0; i < matrixDrops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 25;
        const y = matrixDrops[i] * 24;

        osCtx.fillStyle = Math.random() > 0.82 ? '#60a5fa' : '#2563eb';
        osCtx.fillText(char, x, y);

        if (y > h && Math.random() > 0.96) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i] += 0.45;
      }
    }

    function drawSynthwaveMode(w: number, h: number, time: number) {
      const skyGrad = osCtx.createLinearGradient(0, 0, 0, h * 0.6);
      skyGrad.addColorStop(0, '#04081a');
      skyGrad.addColorStop(0.5, '#1e3a8a');
      skyGrad.addColorStop(1, '#2563eb');
      osCtx.fillStyle = skyGrad;
      osCtx.fillRect(0, 0, w, h * 0.6);

      const sunGrad = osCtx.createLinearGradient(0, 80, 0, 310);
      sunGrad.addColorStop(0, '#60a5fa');
      sunGrad.addColorStop(1, '#2563eb');
      osCtx.fillStyle = sunGrad;
      osCtx.beginPath();
      osCtx.arc(w / 2, h * 0.58, 125, Math.PI, 0);
      osCtx.fill();

      osCtx.fillStyle = '#050b1f';
      osCtx.fillRect(0, h * 0.58, w, h * 0.42);

      osCtx.strokeStyle = '#2563eb';
      osCtx.lineWidth = 2;

      for (let i = -10; i <= 10; i++) {
        osCtx.beginPath();
        osCtx.moveTo(w / 2 + i * 25, h * 0.58);
        osCtx.lineTo(w / 2 + i * 160, h);
        osCtx.stroke();
      }

      const offset = (time * 40) % 28;
      for (let y = h * 0.58 + offset; y < h; y += 28) {
        osCtx.beginPath();
        osCtx.moveTo(0, y);
        osCtx.lineTo(w, y);
        osCtx.stroke();
      }
    }

    function drawDashboardOSMode(w: number, h: number, time: number) {
      osCtx.fillStyle = '#0f172a';
      osCtx.fillRect(0, 0, w, h);

      const colors = ['#38bdf8', '#818cf8', '#2563eb'];
      colors.forEach((color, idx) => {
        osCtx.strokeStyle = color;
        osCtx.lineWidth = 4;
        osCtx.beginPath();
        for (let x = 40; x < w - 40; x += 10) {
          const y = h / 2 + Math.sin(x * 0.012 + time * (2 + idx) + idx) * (65 + idx * 20);
          if (x === 40) osCtx.moveTo(x, y);
          else osCtx.lineTo(x, y);
        }
        osCtx.stroke();
      });

      osCtx.fillStyle = '#f8fafc';
      osCtx.font = 'bold 26px Inter, sans-serif';
      osCtx.fillText('ESTACIÓN DE TRABAJO 3D // MONITOR ULTRAHD', 55, 75);
    }

    function renderMonitorScreen(time: number) {
      const w = osCanvas.width;
      const h = osCanvas.height;

      if (!state.powerOn) {
        osCtx.fillStyle = '#050507';
        osCtx.fillRect(0, 0, w, h);
        screenTexture.needsUpdate = true;
        return;
      }

      if (state.screenMode === 0) {
        drawRobot3DScreen(w, h, time);
        screenTexture.needsUpdate = true;
        return;
      } else if (state.screenMode === 1) {
        drawMatrixMode(w, h);
      } else if (state.screenMode === 2) {
        drawSynthwaveMode(w, h, time);
      } else {
        drawDashboardOSMode(w, h, time);
      }

      osCtx.fillStyle = 'rgba(4, 7, 16, 0.96)';
      osCtx.fillRect(0, h - 46, w, 46);

      osCtx.fillStyle = 'rgba(37, 99, 235, 0.75)';
      osCtx.fillRect(0, h - 46, w, 1.5);

      osCtx.fillStyle = '#3b82f6';
      osCtx.font = '600 13px Inter, sans-serif';
      osCtx.fillText(soundEngine.isPlaying ? '🔊 AUDIO REACTIVO ON' : '🔇 MUTED', 24, h - 18);

      for (let i = 0; i < 12; i++) {
        const barH = soundEngine.isPlaying
          ? 4 + Math.abs(Math.sin(time * 10 + i * 0.7)) * 22 * (0.4 + soundEngine.bassIntensity)
          : 3;
        osCtx.fillStyle = i % 2 === 0 ? '#2563eb' : '#3b82f6';
        osCtx.fillRect(185 + i * 8, h - 12 - barH, 5, barH);
      }

      const iconColors = ['#2563eb', '#1d4ed8', '#10b981', '#3b82f6', '#3f3f46'];
      iconColors.forEach((col, i) => {
        osCtx.fillStyle = col;
        osCtx.beginPath();
        osCtx.roundRect(w / 2 - 100 + i * 44, h - 36, 28, 28, 7);
        osCtx.fill();
      });

      osCtx.fillStyle = '#f4f4f5';
      osCtx.font = '600 15px Inter, sans-serif';
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      osCtx.fillText(timeStr, w - 110, h - 17);

      screenTexture.needsUpdate = true;
    }

    // Inicializar escena con fondo transparente para integrarse en el Hero
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 580;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    updateCameraPosition(true);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Environment Map procedural oscuro con reflejos azules intensos para que la mesa se integre con el Hero
    (function setupEnvMap() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const g = c.getContext('2d')!;
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#060c1f');
      gr.addColorStop(0.5, '#0b1838');
      gr.addColorStop(1, '#02040a');
      g.fillStyle = gr;
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = 'rgba(219, 234, 254, 0.35)';
      g.fillRect(60, 45, 85, 60);
      g.fillRect(280, 35, 115, 45);
      g.fillStyle = 'rgba(37, 99, 235, 0.85)';
      g.fillRect(190, 10, 110, 38);
      g.fillRect(415, 70, 65, 80);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromEquirectangular(tex).texture;
      tex.dispose();
      pm.dispose();
    })();

    setupLights();

    setupGroup = new THREE.Group();
    scene.add(setupGroup);

    createDeskAndEnvironment();
    createMonitor();
    createPeripherals();
    initOrResumeAudio();

    // Eventos de desbloqueo automático de audio y control orbital
    const unlockAudioHandler = () => {
      if (soundEngine.isPlaying && (!soundEngine.ctx || soundEngine.ctx.state === 'suspended')) {
        initOrResumeAudio();
      }
    };
    window.addEventListener('pointerdown', unlockAudioHandler, { passive: true });
    window.addEventListener('keydown', unlockAudioHandler, { passive: true });
    window.addEventListener('click', unlockAudioHandler, { passive: true });

    const onMouseDown = (e: MouseEvent) => {
      camControl.isDragging = true;
      camControl.prevX = e.clientX;
      camControl.prevY = e.clientY;
      initOrResumeAudio();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!camControl.isDragging) return;
      const deltaX = e.clientX - camControl.prevX;
      const deltaY = e.clientY - camControl.prevY;
      camControl.prevX = e.clientX;
      camControl.prevY = e.clientY;

      camControl.targetTheta -= deltaX * 0.007;
      camControl.targetPhi -= deltaY * 0.007;
    };

    const onMouseUp = () => {
      camControl.isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let initialPinchDist: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      initOrResumeAudio();
      if (e.touches.length === 1) {
        camControl.isDragging = true;
        camControl.prevX = e.touches[0].clientX;
        camControl.prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        camControl.isDragging = false;
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && camControl.isDragging) {
        const deltaX = e.touches[0].clientX - camControl.prevX;
        const deltaY = e.touches[0].clientY - camControl.prevY;
        camControl.prevX = e.touches[0].clientX;
        camControl.prevY = e.touches[0].clientY;

        camControl.targetTheta -= deltaX * 0.007;
        camControl.targetPhi -= deltaY * 0.007;
      } else if (e.touches.length === 2 && initialPinchDist) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = initialPinchDist - currentDist;
        camControl.targetRadius += diff * 0.02;
        initialPinchDist = currentDist;
      }
    };

    const onTouchEnd = () => {
      camControl.isDragging = false;
      initialPinchDist = null;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // Bucle principal 100% automático con pausa inteligente fuera de pantalla
    let isVisible = true;
    let frameTick = 0;

    function animate() {
      if (isDisposed || !isVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      frameTick++;
      state.time += 0.016;

      updateSynthAudio(state.time);
      const bass = soundEngine.bassIntensity;

      // Movimiento orbital suave automático manteniendo toda la mesa dentro del lienzo sin recortarse
      if (state.autoRotate && !camControl.isDragging) {
        camControl.targetTheta = -0.04 + Math.sin(state.time * 0.45) * 0.07;
      }

      ambientBacklight.intensity = 3.2 + bass * 1.4;
      ambientBacklight.color.setHex(0x2563eb);

      // Teclas escribiendo automáticamente con actualización selectiva O(1)
      if (keyboardKeys.length > 0 && state.powerOn) {
        const activeKey1 = Math.floor(state.time * 26) % keyboardKeys.length;
        const activeKey2 = Math.floor(state.time * 18 + 7) % keyboardKeys.length;
        if (activeKey1 !== lastActiveKey1 || activeKey2 !== lastActiveKey2) {
          if (lastActiveKey1 >= 0 && keyboardKeys[lastActiveKey1]) {
            keyboardKeys[lastActiveKey1].position.y = (keyboardKeys[lastActiveKey1].userData.baseY as number) || 0.052;
          }
          if (lastActiveKey2 >= 0 && keyboardKeys[lastActiveKey2]) {
            keyboardKeys[lastActiveKey2].position.y = (keyboardKeys[lastActiveKey2].userData.baseY as number) || 0.052;
          }
          if (keyboardKeys[activeKey1]) {
            keyboardKeys[activeKey1].position.y = ((keyboardKeys[activeKey1].userData.baseY as number) || 0.052) - 0.014;
          }
          if (keyboardKeys[activeKey2]) {
            keyboardKeys[activeKey2].position.y = ((keyboardKeys[activeKey2].userData.baseY as number) || 0.052) - 0.014;
          }
          lastActiveKey1 = activeKey1;
          lastActiveKey2 = activeKey2;
        }
      }

      // Mouse moviéndose automáticamente
      if (mouseGroupRef && state.powerOn) {
        mouseGroupRef.position.x = 1.02 + Math.sin(state.time * 1.8) * 0.035;
        mouseGroupRef.position.z = 0.5 + Math.cos(state.time * 2.4) * 0.025;
      }

      // Ondas en el agua de la taza reactivas al bajo de los parlantes
      if (liquidWaterObj && frameTick % 4 === 0) {
        const posAttr = liquidWaterObj.surfaceMesh.geometry.attributes.position;
        const rippleAmp = 0.0022 + (soundEngine.isPlaying ? bass * 0.0095 : 0);
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vz = posAttr.getZ(i);
          const r = Math.hypot(vx, vz);
          const concentricWave = Math.sin(r * 75 - state.time * 11) * rippleAmp * (1 - r * 3.5);
          const slosh =
            (Math.sin(vx * 22 + state.time * 4.2) + Math.cos(vz * 22 + state.time * 3.6)) * 0.0014;
          posAttr.setY(i, liquidWaterObj.baseY[i] + concentricWave + slosh);
        }
        posAttr.needsUpdate = true;
        liquidWaterObj.meniscusRing.scale.setScalar(1 + (soundEngine.isPlaying ? bass * 0.02 : 0));
      }

      // Parlantes vibrando con ondas acústicas y ecualizador en vivo
      speakersList.forEach((spk) => {
        if (soundEngine.isPlaying && state.powerOn) {
          const shakeAmp = bass * 0.022;
          spk.cabinetGroup.position.x = spk.basePos.x + Math.sin(state.time * 55) * shakeAmp;
          spk.cabinetGroup.position.y =
            spk.basePos.y + Math.abs(Math.cos(state.time * 48)) * shakeAmp * 1.2;
          spk.cabinetGroup.rotation.z = Math.sin(state.time * 42) * shakeAmp * 0.8;

          const conePump = 1 + bass * 0.28;
          spk.wooferGroup.scale.set(conePump, conePump, 1 + bass * 0.65);
          spk.wooferGroup.position.z = 0.225 + bass * 0.028;

          spk.waveRings.forEach((ring) => {
            const progress = (state.time * 1.35 + (ring.userData.phaseOffset as number)) % 1;
            ring.position.z = progress * 1.45;
            const scale = 1 + progress * (2.6 + bass * 1.2);
            ring.scale.set(scale, scale, 1);
            ring.material.opacity = (1 - progress) * (0.55 + bass * 0.45);
          });

          spk.eqBars.forEach((bar, bIdx) => {
            const eqScale =
              0.4 + Math.abs(Math.sin(state.time * 12 + bIdx * 1.1)) * (1.8 + bass * 2.2);
            bar.scale.y = eqScale;
            bar.position.y = (eqScale * 0.12) / 2;
          });
        }
      });

      // Renderizar el Robot 3D a 60 FPS ultra fluidos
      renderMonitorScreen(state.time);
      updateCameraPosition();
      renderer.render(scene, camera);
    }

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            if (!animationFrameId && !isDisposed) {
              animate();
            }
          } else {
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = 0;
            }
          }
        });
      },
      { threshold: 0.02 }
    );
    visibilityObserver.observe(container);

    renderMonitorScreen(0);
    animate();

    return () => {
      isDisposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointerdown', unlockAudioHandler);
      window.removeEventListener('keydown', unlockAudioHandler);
      window.removeEventListener('click', unlockAudioHandler);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      if (soundEngine.ctx) {
        soundEngine.ctx.close().catch(() => {});
      }
      if (robotRenderer) {
        robotRenderer.dispose();
      }
      robotDisposables.forEach((d) => {
        try {
          d.dispose();
        } catch {}
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-[132%] -ml-[16%] -mr-[16%] h-[560px] sm:h-[680px] lg:h-[860px] -my-[60px] cursor-grab active:cursor-grabbing select-none"
      title="Arrastra para rotar el Setup 3D"
    />
  );
};

export default Computer3D;

