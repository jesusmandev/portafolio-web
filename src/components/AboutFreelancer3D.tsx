import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader, type FontData } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import droidSansBoldData from 'three/examples/fonts/droid/droid_sans_bold.typeface.json';

const AboutFreelancer3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isVisible = true;

    // Scene & Camera
    const scene = new THREE.Scene();

    const getWidth = () => container.clientWidth || window.innerWidth;
    const getHeight = () => container.clientHeight || window.innerHeight;

    // Elevated camera looking down at ground level
    const camera = new THREE.PerspectiveCamera(36, getWidth() / getHeight(), 0.1, 120);
    camera.position.set(0, 5.2, 23);
    camera.lookAt(0, -2.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(getWidth(), getHeight());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Procedural glossy environment map
    (function setupGlossyEnvMap() {
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 512;
      envCanvas.height = 256;
      const ctx = envCanvas.getContext('2d');
      if (!ctx) return;

      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#131a2b');
      bgGrad.addColorStop(0.5, '#05070f');
      bgGrad.addColorStop(1, '#09142c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 25, 170, 40);
      ctx.fillRect(300, 20, 160, 35);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(50, 150, 200, 50);
      ctx.fillRect(280, 140, 190, 50);

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

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(16, 28, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const blueFloorRimLight = new THREE.DirectionalLight(0x2563eb, 2.8);
    blueFloorRimLight.position.set(-20, 8, 10);
    scene.add(blueFloorRimLight);

    const sweepLight = new THREE.PointLight(0xffffff, 3.8, 40);
    sweepLight.position.set(-1, 2, 10);
    scene.add(sweepLight);

    // Group for 3D Text positioned on floor elevated nicely
    const textGroundGroup = new THREE.Group();
    textGroundGroup.position.set(-0.5, -4.2, -1.8);
    textGroundGroup.rotation.x = -Math.PI / 2.38;
    scene.add(textGroundGroup);

    // Ground plane receiving direct contact shadow beneath letters
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.ShadowMaterial({
      opacity: 0.5,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.z = -0.08;
    floorMesh.receiveShadow = true;
    textGroundGroup.add(floorMesh);

    // Clean font glyphs
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

    // White glossy physical materials
    const whiteFrontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
    });

    const whiteSideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x162238,
      roughness: 0.12,
      metalness: 0.94,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      emissive: 0x2563eb,
      emissiveIntensity: 0.42,
    });

    // Create 3D letters for "FREELANCER"
    const WORD = 'FREELANCER';
    const FONT_SIZE = 3.6;
    const DEPTH = 1.35;
    const SPACING = 0.38;

    const tempGeos: { geo: TextGeometry; width: number }[] = [];
    let totalWordWidth = 0;

    for (let i = 0; i < WORD.length; i++) {
      const char = WORD[i];
      const textGeo = new TextGeometry(char, {
        font,
        size: FONT_SIZE,
        depth: DEPTH,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.065,
        bevelOffset: 0,
        bevelSegments: 4,
      });

      textGeo.computeBoundingBox();
      const bbox = textGeo.boundingBox!;
      const charWidth = bbox.max.x - bbox.min.x;
      textGeo.center();

      tempGeos.push({ geo: textGeo, width: charWidth });
      totalWordWidth += charWidth;
    }

    totalWordWidth += SPACING * (WORD.length - 1);
    let startX = -totalWordWidth / 2;

    for (let i = 0; i < tempGeos.length; i++) {
      const item = tempGeos[i];
      const posX = startX + item.width / 2;

      const fMat = whiteFrontMaterial.clone();
      const sMat = whiteSideMaterial.clone();

      const mesh = new THREE.Mesh(item.geo, [fMat, sMat]);
      mesh.position.set(posX, 0, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      textGroundGroup.add(mesh);

      startX += item.width + SPACING;
    }

    // Responsive scaling: adjust dynamically so the whole word fits mobile screens
    const updateScale = () => {
      const w = getWidth();
      const h = getHeight();
      const aspect = w / h;
      camera.aspect = aspect;

      const isMobile = w < 768;
      if (isMobile) {
        // En teléfonos/pantallas verticales (aspect < 0.5): alejar la cámara para que el ángulo horizontal no se comprima
        camera.position.set(0, 3.8, 48);
        camera.lookAt(0, -3.2, 0);
        camera.fov = 40;
      } else {
        camera.position.set(0, 5.2, 23);
        camera.lookAt(0, -2.2, 0);
        camera.fov = 36;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      const fovRad = (camera.fov * Math.PI) / 180;
      const camZ = camera.position.z;
      const targetZ = -1.8;
      const dist = Math.abs(camZ - targetZ);
      const visibleWidth = 2 * Math.tan(fovRad / 2) * dist * camera.aspect;

      // En móviles, asegurar que la palabra completa "FREELANCER" quepa con margen lateral y proporciones nítidas
      const targetWidth = isMobile ? visibleWidth * 0.84 : visibleWidth * 0.94;
      const scaleFactor = Math.min(isMobile ? 0.72 : 1.0, targetWidth / totalWordWidth);
      textGroundGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
      textGroundGroup.position.set(0, isMobile ? -5.2 : -4.2, -1.8);
    };

    updateScale();

    // Mouse tracking for subtle ground perspective parallax
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = clock.getElapsedTime();

      // Smooth subtle ground perspective shift with mouse
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      textGroundGroup.rotation.z = mouse.x * 0.05;
      textGroundGroup.rotation.y = mouse.x * 0.08;
      textGroundGroup.rotation.x = -Math.PI / 2.38 - mouse.y * 0.03;

      // Moving specular highlight light running along the white letters
      sweepLight.position.x = -1 + Math.sin(elapsed * 0.7) * 16;
      sweepLight.position.z = 8 + Math.cos(elapsed * 0.7) * 4;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Intersection Observer
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 opacity-60"
      style={{
        maskImage: 'radial-gradient(ellipse 98% 90% at 50% 68%, black 65%, rgba(0,0,0,0.35) 88%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 98% 90% at 50% 68%, black 65%, rgba(0,0,0,0.35) 88%, transparent 100%)',
      }}
      aria-hidden="true"
    />
  );
};

export default AboutFreelancer3D;
