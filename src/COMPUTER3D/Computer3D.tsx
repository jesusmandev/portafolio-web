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
      screenMode: 0, // 0: Portafolio JM Live, 1: Matrix Crimson, 2: Cyberpunk Synth, 3: Analíticas
      modeNames: ['Portafolio JM', 'Matrix Crimson', 'Synthwave 3D', 'Sistema OS'],
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

      screenTexture = new THREE.CanvasTexture(osCanvas);
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

    function drawLiveWebCodingMode(w: number, h: number, time: number) {
      osCtx.fillStyle = '#03050a';
      osCtx.fillRect(0, 0, w, h);

      const codeSnippet = [
        'import about_me',
        '',
        'class JesusMartinez(Developer):',
        '  def __init__(self):',
        '    self.name = "Jesús Martínez"',
        '    self.role = "Desarrollador Frontend"',
        '    self.location = "Colombia"',
        '    self.passion = "Convertir diseños en experiencias"',
        '',
        '  def my_mission(self):',
        '    print("Hablo con código (HTML, CSS, JS)")',
        '    print("Convierto ideas en interfaces increíbles")',
        '',
        'me = JesusMartinez()',
        'me.say_hello()',
      ];

      const fullTextLength = codeSnippet.reduce((acc, line) => acc + line.length, 0);
      const cycleDuration = 16;
      const cycleTime = time % cycleDuration;
      const typingProgress = Math.min(1, cycleTime / (cycleDuration - 3.5));
      let charsRemaining = Math.floor(typingProgress * fullTextLength);

      const edX = 20;
      const edY = 18;
      const edW = 575;
      const edH = h - 78;
      osCtx.fillStyle = '#050811';
      osCtx.beginPath();
      osCtx.roundRect(edX, edY, edW, edH, 12);
      osCtx.fill();
      osCtx.strokeStyle = 'rgba(37, 99, 235, 0.65)';
      osCtx.lineWidth = 2;
      osCtx.stroke();

      osCtx.fillStyle = '#091228';
      osCtx.beginPath();
      osCtx.roundRect(edX, edY, edW, 38, [12, 12, 0, 0]);
      osCtx.fill();

      ['#2563eb', '#f59e0b', '#10b981'].forEach((c, idx) => {
        osCtx.fillStyle = c;
        osCtx.beginPath();
        osCtx.arc(edX + 24 + idx * 20, edY + 19, 6, 0, Math.PI * 2);
        osCtx.fill();
      });

      osCtx.fillStyle = '#60a5fa';
      osCtx.font = '600 13px monospace';
      osCtx.fillText('portfolio_jm.py — Visual Studio Code', edX + 95, edY + 24);

      osCtx.font = '15px monospace';
      let cursorX = edX + 54;
      let cursorY = edY + 70;

      for (let i = 0; i < codeSnippet.length; i++) {
        const lineStr = codeSnippet[i];
        const yPos = edY + 70 + i * 32;

        osCtx.fillStyle = '#52525b';
        osCtx.fillText(String(i + 1).padStart(2, '0'), edX + 16, yPos);

        if (charsRemaining <= 0 && lineStr.length > 0) break;

        const visibleChars = Math.min(lineStr.length, charsRemaining);
        const subStr = lineStr.substring(0, visibleChars);
        charsRemaining -= visibleChars;

        if (lineStr.startsWith('import') || lineStr.includes('self.')) osCtx.fillStyle = '#3b82f6';
        else if (lineStr.startsWith('class ') || lineStr.includes('def ')) osCtx.fillStyle = '#fbbf24';
        else if (lineStr.includes('print(')) osCtx.fillStyle = '#10b981';
        else osCtx.fillStyle = '#e4e4e7';

        if (charsRemaining === 0 && typingProgress < 1) {
          osCtx.fillStyle = 'rgba(37, 99, 235, 0.22)';
          osCtx.fillRect(edX + 46, yPos - 19, edW - 56, 26);
          osCtx.fillStyle = '#60a5fa';
        }

        osCtx.fillText(subStr, edX + 52, yPos);

        cursorX = edX + 52 + osCtx.measureText(subStr).width;
        cursorY = yPos;
      }

      if (Math.floor(time * 4) % 2 === 0) {
        osCtx.fillStyle = '#2563eb';
        osCtx.fillRect(cursorX + 3, cursorY - 16, 9, 20);
      }

      osCtx.fillStyle = '#03050a';
      osCtx.fillRect(edX + 12, edY + edH - 62, edW - 24, 50);
      osCtx.fillStyle = '#10b981';
      osCtx.font = '13px monospace';
      osCtx.fillText('➜ Local: http://localhost:5173/portfolio-website/#about', edX + 22, edY + edH - 36);
      osCtx.fillStyle = '#60a5fa';
      osCtx.fillText(
        `✓ Compilando Portafolio <JM/> (${Math.round(typingProgress * 100)}%)`,
        edX + 22,
        edY + edH - 16
      );

      const brX = 612;
      const brY = 18;
      const brW = w - 632;
      const brH = h - 78;

      osCtx.fillStyle = '#04070e';
      osCtx.beginPath();
      osCtx.roundRect(brX, brY, brW, brH, 12);
      osCtx.fill();
      osCtx.strokeStyle = '#2563eb';
      osCtx.lineWidth = 2;
      osCtx.stroke();

      osCtx.fillStyle = '#091228';
      osCtx.beginPath();
      osCtx.roundRect(brX, brY, brW, 42, [12, 12, 0, 0]);
      osCtx.fill();

      osCtx.fillStyle = '#04070e';
      osCtx.beginPath();
      osCtx.roundRect(brX + 16, brY + 8, brW - 135, 26, 13);
      osCtx.fill();

      osCtx.fillStyle = '#60a5fa';
      osCtx.font = '12px Inter, sans-serif';
      osCtx.fillText('🔒 localhost:5173/portfolio-website/#about', brX + 32, brY + 25);

      osCtx.strokeStyle = 'rgba(37, 99, 235, 0.85)';
      osCtx.beginPath();
      osCtx.roundRect(brX + brW - 108, brY + 8, 94, 26, 13);
      osCtx.stroke();
      osCtx.fillStyle = '#ffffff';
      osCtx.font = 'bold 11px Inter, sans-serif';
      osCtx.fillText('⬇ Descargar CV', brX + brW - 100, brY + 25);

      const vpX = brX + 20;
      const vpY = brY + 56;
      const vpW = brW - 40;

      if (typingProgress > 0.1) {
        osCtx.fillStyle = '#081024';
        osCtx.strokeStyle = 'rgba(37, 99, 235, 0.7)';
        osCtx.beginPath();
        osCtx.roundRect(vpX, vpY, 74, 34, 17);
        osCtx.fill();
        osCtx.stroke();

        osCtx.fillStyle = '#ffffff';
        osCtx.font = '900 14px Inter, sans-serif';
        osCtx.fillText('<', vpX + 14, vpY + 22);
        osCtx.fillStyle = '#3b82f6';
        osCtx.fillText('JM', vpX + 25, vpY + 22);
        osCtx.fillStyle = '#ffffff';
        osCtx.fillText('/>', vpX + 47, vpY + 22);

        osCtx.fillStyle = 'rgba(8, 16, 36, 0.92)';
        osCtx.beginPath();
        osCtx.roundRect(vpX + 92, vpY, vpW - 92, 34, 17);
        osCtx.fill();
        osCtx.stroke();

        osCtx.fillStyle = 'rgba(37, 99, 235, 0.55)';
        osCtx.beginPath();
        osCtx.roundRect(vpX + 98, vpY + 4, 64, 26, 13);
        osCtx.fill();

        osCtx.fillStyle = '#ffffff';
        osCtx.font = '600 12px Inter, sans-serif';
        osCtx.fillText('Inicio', vpX + 114, vpY + 21);

        osCtx.fillStyle = '#d4d4d8';
        osCtx.fillText('Sobre mí     Habilidades     Proyectos     Contacto', vpX + 178, vpY + 21);
      }

      if (typingProgress > 0.32) {
        const glowGrad = osCtx.createRadialGradient(
          vpX + 260,
          vpY + 180,
          10,
          vpX + 260,
          vpY + 180,
          260
        );
        glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.38)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        osCtx.fillStyle = glowGrad;
        osCtx.fillRect(vpX, vpY + 45, vpW, 260);

        osCtx.fillStyle = '#52525b';
        osCtx.font = '900 44px Inter, sans-serif';
        osCtx.fillText('DESARROLLADOR', vpX + 13, vpY + 129);
        osCtx.fillStyle = '#f4f4f5';
        osCtx.fillText('DESARROLLADOR', vpX + 10, vpY + 126);

        osCtx.fillStyle = '#1e3a8a';
        osCtx.font = '900 48px Inter, sans-serif';
        osCtx.fillText('FRONTEND', vpX + 55, vpY + 186);
        osCtx.fillStyle = '#2563eb';
        osCtx.fillText('FRONTEND', vpX + 52, vpY + 183);
      }

      if (typingProgress > 0.58) {
        const btnGrad = osCtx.createLinearGradient(vpX + 12, vpY + 220, vpX + 142, vpY + 268);
        btnGrad.addColorStop(0, '#2563eb');
        btnGrad.addColorStop(1, '#1d4ed8');
        osCtx.fillStyle = btnGrad;
        osCtx.beginPath();
        osCtx.roundRect(vpX + 12, vpY + 220, 128, 46, 12);
        osCtx.fill();

        osCtx.fillStyle = '#ffffff';
        osCtx.font = 'bold 14px Inter, sans-serif';
        osCtx.fillText('Ver proyectos', vpX + 28, vpY + 248);

        osCtx.fillStyle = '#12131a';
        osCtx.strokeStyle = '#27272a';
        osCtx.beginPath();
        osCtx.roundRect(vpX + 154, vpY + 220, 124, 46, 12);
        osCtx.fill();
        osCtx.stroke();

        osCtx.fillStyle = '#f4f4f5';
        osCtx.fillText('Contactarme', vpX + 172, vpY + 248);

        const badgeX = vpX + vpW - 215;
        const badgeY = vpY + 210;
        osCtx.fillStyle = 'rgba(6, 12, 26, 0.94)';
        osCtx.strokeStyle = 'rgba(37, 99, 235, 0.65)';
        osCtx.beginPath();
        osCtx.roundRect(badgeX, badgeY, 210, 68, 12);
        osCtx.fill();
        osCtx.stroke();

        osCtx.fillStyle = '#a1a1aa';
        osCtx.font = '12px Inter, sans-serif';
        osCtx.fillText('Disponible para', badgeX + 18, badgeY + 26);

        osCtx.fillStyle = '#10b981';
        osCtx.beginPath();
        osCtx.arc(badgeX + 24, badgeY + 48, 5, 0, Math.PI * 2);
        osCtx.fill();

        osCtx.fillStyle = '#ffffff';
        osCtx.font = 'bold 14px Inter, sans-serif';
        osCtx.fillText('Nuevos proyectos', badgeX + 38, badgeY + 53);
      }

      if (typingProgress > 0.78) {
        const skills = ['HTML5 & CSS3', 'JavaScript / React', 'Three.js WebGL'];
        const cardW = (vpW - 32) / 3;
        skills.forEach((sk, idx) => {
          const cx = vpX + idx * (cardW + 16);
          const cy = vpY + 305;

          osCtx.fillStyle = '#081024';
          osCtx.beginPath();
          osCtx.roundRect(cx, cy, cardW, 110, 10);
          osCtx.fill();
          osCtx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
          osCtx.stroke();

          osCtx.fillStyle = '#60a5fa';
          osCtx.font = 'bold 13px Inter, sans-serif';
          osCtx.fillText(sk, cx + 14, cy + 30);

          for (let b = 0; b < 7; b++) {
            const bh =
              10 + Math.abs(Math.sin(time * 6 + idx + b)) * (28 + soundEngine.bassIntensity * 18);
            osCtx.fillStyle = b % 2 === 0 ? '#2563eb' : '#3b82f6';
            osCtx.fillRect(cx + 16 + b * 20, cy + 96 - bh, 12, bh);
          }
        });
      }
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
        drawLiveWebCodingMode(w, h, time);
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

      // Teclas escribiendo automáticamente
      if (keyboardKeys.length > 0 && state.powerOn) {
        const activeKey1 = Math.floor(state.time * 14) % keyboardKeys.length;
        const activeKey2 = Math.floor(state.time * 9 + 7) % keyboardKeys.length;
        keyboardKeys.forEach((k, idx) => {
          const baseY = (k.userData.baseY as number) || 0.052;
          k.position.y = idx === activeKey1 || idx === activeKey2 ? baseY - 0.014 : baseY;
        });
      }

      // Mouse moviéndose automáticamente
      if (mouseGroupRef && state.powerOn) {
        mouseGroupRef.position.x = 1.02 + Math.sin(state.time * 1.8) * 0.035;
        mouseGroupRef.position.z = 0.5 + Math.cos(state.time * 2.4) * 0.025;
      }

      // Ondas en el agua de la taza reactivas al bajo de los parlantes
      if (liquidWaterObj && frameTick % 2 === 0) {
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

      // Actualizar textura 2D del monitor cada 3 frames (~20 FPS para el editor de texto) evitando saturar el bus GPU
      if (frameTick % 3 === 1) {
        renderMonitorScreen(state.time);
      }
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

