import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader, type FontData } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import droidSansBoldData from 'three/examples/fonts/droid/droid_sans_bold.typeface.json';

interface LetterMeshInfo {
  mesh: THREE.Mesh;
  frontMat: THREE.MeshPhysicalMaterial;
  sideMat: THREE.MeshPhysicalMaterial;
  baseY: number;
  phase: number;
}

const Footer3DText: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isVisible = true;
    const letterMeshes: LetterMeshInfo[] = [];

    // Scene & Camera
    const scene = new THREE.Scene();

    const getWidth = () => container.clientWidth || window.innerWidth;
    const getHeight = () => container.clientHeight || 220;

    const initialAspect = getWidth() / getHeight();
    const camera = new THREE.PerspectiveCamera(36, initialAspect, 0.1, 100);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(getWidth(), getHeight());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Procedural glossy environment map for rich bevel highlights
    (function setupGlossyEnvMap() {
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 512;
      envCanvas.height = 256;
      const ctx = envCanvas.getContext('2d');
      if (!ctx) return;

      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#162038');
      bgGrad.addColorStop(0.5, '#050811');
      bgGrad.addColorStop(1, '#08142e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      // Specular light strips
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 30, 180, 40);
      ctx.fillRect(300, 25, 170, 35);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(100, 100, 300, 20);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(50, 160, 200, 50);
      ctx.fillRect(280, 150, 190, 50);

      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(envTex).texture;
      envTex.dispose();
      pmrem.dispose();
    })();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(12, 20, 16);
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x2563eb, 2.5);
    blueRimLight.position.set(-18, -6, 10);
    scene.add(blueRimLight);

    const shineLight = new THREE.PointLight(0x3b82f6, 4.0, 30);
    shineLight.position.set(0, 2, 8);
    scene.add(shineLight);

    // Group for the 3D text
    const textGroup = new THREE.Group();
    scene.add(textGroup);

    // Parse Font
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

    // High gloss physical materials matching "DESARROLLADOR FRONTEND"
    const whiteFrontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.22,
    });

    const whiteSideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.12,
      metalness: 0.94,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      emissive: 0x2563eb,
      emissiveIntensity: 0.45,
    });

    const blueFrontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      roughness: 0.06,
      metalness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.55,
    });

    const blueSideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a193b,
      roughness: 0.1,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.65,
    });

    // Create 3D text "JESUSDEV.CO"
    // 'JESUSDEV' in white, '.CO' in blue
    const FULL_TEXT = 'JESUSDEV.CO';
    const FONT_SIZE = 2.4;
    const DEPTH = 0.95;
    const SPACING = 0.24;

    const tempGeos: { geo: TextGeometry; char: string; width: number; isBlue: boolean }[] = [];
    let totalTextWidth = 0;

    for (let i = 0; i < FULL_TEXT.length; i++) {
      const char = FULL_TEXT[i];
      const isBlue = i >= 8; // '.CO'

      const textGeo = new TextGeometry(char, {
        font,
        size: FONT_SIZE,
        depth: DEPTH,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.14,
        bevelSize: 0.045,
        bevelOffset: 0,
        bevelSegments: 4,
      });

      textGeo.computeBoundingBox();
      const bbox = textGeo.boundingBox!;
      const charWidth = bbox.max.x - bbox.min.x;
      textGeo.center();

      tempGeos.push({ geo: textGeo, char, width: charWidth, isBlue });
      totalTextWidth += charWidth;
    }

    totalTextWidth += SPACING * (FULL_TEXT.length - 1);
    let startX = -totalTextWidth / 2;

    for (let i = 0; i < tempGeos.length; i++) {
      const item = tempGeos[i];
      const posX = startX + item.width / 2;

      const fMat = item.isBlue ? blueFrontMaterial.clone() : whiteFrontMaterial.clone();
      const sMat = item.isBlue ? blueSideMaterial.clone() : whiteSideMaterial.clone();

      const mesh = new THREE.Mesh(item.geo, [fMat, sMat]);
      mesh.position.set(posX, 0, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      textGroup.add(mesh);

      letterMeshes.push({
        mesh,
        frontMat: fMat,
        sideMat: sMat,
        baseY: 0,
        phase: i * 0.35,
      });

      startX += item.width + SPACING;
    }

    // Responsive scale
    const updateScale = () => {
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Fit text horizontally with margin
      const margin = 2.5;
      const fovRad = (camera.fov * Math.PI) / 180;
      const visibleWidthAtZ0 = 2 * Math.tan(fovRad / 2) * camera.position.z * camera.aspect;
      const targetScale = Math.min(1.15, (visibleWidthAtZ0 - margin) / totalTextWidth);
      textGroup.scale.set(targetScale, targetScale, targetScale);
    };

    updateScale();

    // Mouse tracking for 3D tilt
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX / rect.width) * 2 - 1;
      mouse.targetY = -(clientY / rect.height) * 2 + 1;
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse tilt
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      textGroup.rotation.y = mouse.x * 0.35;
      textGroup.rotation.x = -mouse.y * 0.22;

      // Gentle floating wave per letter
      letterMeshes.forEach((item) => {
        const floatY = Math.sin(elapsedTime * 1.8 + item.phase) * 0.22;
        const floatRotZ = Math.cos(elapsedTime * 1.5 + item.phase) * 0.035;
        item.mesh.position.y = item.baseY + floatY;
        item.mesh.rotation.z = floatRotZ;
      });

      // Moving specular highlight light
      shineLight.position.x = Math.sin(elapsedTime * 1.2) * 14;
      shineLight.position.y = Math.cos(elapsedTime * 0.9) * 3;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Intersection Observer to pause when offscreen
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[180px] sm:h-[220px] md:h-[260px] flex items-center justify-center cursor-pointer select-none overflow-hidden my-4"
      title="JESUSDEV.CO en 3D"
    />
  );
};

export default Footer3DText;

