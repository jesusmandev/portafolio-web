import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, type FontData, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as CANNON from 'cannon-es';
import droidSansBoldData from 'three/examples/fonts/droid/droid_sans_bold.typeface.json';

interface LetterObject {
  mesh: THREE.Mesh<TextGeometry, THREE.MeshPhysicalMaterial[]>;
  frontMat: THREE.MeshPhysicalMaterial;
  sideMat: THREE.MeshPhysicalMaterial;
  body: CANNON.Body;
  relX: number;
  relY: number;
  initialPos: THREE.Vector3;
  phase: number;
  isFloating: boolean;
  baseEmissive: number;
  baseEmissiveIntensity: number;
}

interface Hero3DTextProps {
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

const WORD_1 = 'DESARROLLADOR'; // Blanco
const WORD_2 = 'FRONTEND';      // Rojo

const Hero3DText: React.FC<Hero3DTextProps> = ({ anchorRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetFnRef = useRef<(() => void) | null>(null);
  const [hasFallenLetters, setHasFallenLetters] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const letterObjects: LetterObject[] = [];
    const timeouts: number[] = [];

    // ==========================================
    // ESCENA, CÁMARA Y RENDERIZADOR (THREE.JS)
    // ==========================================
    const scene = new THREE.Scene();

    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;
    const initialAspect = initialWidth / initialHeight;

    const FOV = 40;
    const camera = new THREE.PerspectiveCamera(FOV, initialAspect, 0.1, 300);
    const cameraTarget = new THREE.Vector3(0, 0, 0);

    let isDraggingCamera = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Estado de la cámara
    const cameraSpherical = {
      radius: 32,
      theta: 0,
      phi: Math.PI / 2,
    };

    const updateCameraFromSpherical = () => {
      cameraSpherical.phi = Math.max(0.35, Math.min(Math.PI / 2 + 0.15, cameraSpherical.phi));
      cameraSpherical.radius = Math.max(18, Math.min(240, cameraSpherical.radius));

      camera.position.x =
        cameraTarget.x +
        cameraSpherical.radius * Math.sin(cameraSpherical.phi) * Math.sin(cameraSpherical.theta);
      camera.position.y =
        cameraTarget.y + cameraSpherical.radius * Math.cos(cameraSpherical.phi);
      camera.position.z =
        cameraTarget.z +
        cameraSpherical.radius * Math.sin(cameraSpherical.phi) * Math.cos(cameraSpherical.theta);

      camera.lookAt(cameraTarget);
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Environment Map procedural de alto brillo para reflejos tipo estudio en el bisel y relieve 3D
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

      // Barras de luz especular blancas y azules intensas para que los biseles 3D brillen
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

    // Iluminación ambiental, direccional y luces de barrido para resaltar el relieve 3D
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.85);
    dirLight.position.set(16, 26, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 90;
    const d = 35;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Luz lateral izquierda para esculpir el borde extruido 3D
    const sideRimLight = new THREE.DirectionalLight(0x2563eb, 2.2);
    sideRimLight.position.set(-22, -8, 12);
    scene.add(sideRimLight);

    // Luces puntuales animadas que recorren las letras haciéndolas brillar constantemente
    const shineLight1 = new THREE.PointLight(0xffffff, 4.5, 38);
    shineLight1.position.set(-10, 4, 9);
    scene.add(shineLight1);

    const shineLight2 = new THREE.PointLight(0x3b82f6, 4.2, 36);
    shineLight2.position.set(8, -2, 9);
    scene.add(shineLight2);

    // Luz puntual que sigue al cursor para dar reflejos dinámicos
    const cursorLight = new THREE.PointLight(0xffffff, 3.2, 32);
    cursorLight.position.set(0, 2, 8);
    scene.add(cursorLight);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const clock = new THREE.Clock();

    // ==========================================
    // MUNDO DE FÍSICAS (CANNON.JS)
    // ==========================================
    const world = new CANNON.World();
    world.gravity.set(0, -24, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    (world.solver as CANNON.GSSolver).iterations = 10;

    const defaultMaterial = new CANNON.Material('default');
    const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: 0.35,
      restitution: 0.45,
    });
    world.addContactMaterial(contactMaterial);
    world.defaultContactMaterial = contactMaterial;

    // ==========================================
    // PISO EN EL FONDO DE LA SECCIÓN HERO
    // ==========================================
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -10, 0),
    });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    floorBody.addShape(floorShape);
    world.addBody(floorBody);

    // ==========================================
    // CREACIÓN DE LETRAS 3D
    // ==========================================
    let anyFallenCached = false;
    const updateFloatingState = () => {
      anyFallenCached = letterObjects.some((l) => !l.isFloating);
      setHasFallenLetters(anyFallenCached);
    };

    let word1TotalWidth = 32;
    const letterMeshes: THREE.Mesh[] = [];

    const createWordRow = ({
      text,
      font,
      frontMaterial,
      sideMaterial,
      relY,
      size,
      depth,
      spacing,
    }: {
      text: string;
      font: Font;
      frontMaterial: THREE.MeshPhysicalMaterial;
      sideMaterial: THREE.MeshPhysicalMaterial;
      relY: number;
      size: number;
      depth: number;
      spacing: number;
    }) => {
      const tempGeometries: {
        geo: TextGeometry;
        char: string;
        width: number;
        height: number;
        depth: number;
      }[] = [];
      let totalWidth = 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const textGeo = new TextGeometry(char, {
          font,
          size,
          depth,
          curveSegments: 8,
          bevelEnabled: true,
          bevelThickness: 0.24,
          bevelSize: 0.068,
          bevelOffset: 0,
          bevelSegments: 4,
        });

        textGeo.computeBoundingBox();
        const bbox = textGeo.boundingBox!;
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const depthBox = bbox.max.z - bbox.min.z;

        textGeo.center();

        tempGeometries.push({
          geo: textGeo,
          char,
          width,
          height,
          depth: depthBox,
        });

        totalWidth += width;
      }

      totalWidth += spacing * (text.length - 1);
      let currentX = -totalWidth / 2;

      for (let i = 0; i < tempGeometries.length; i++) {
        const item = tempGeometries[i];
        const relX = currentX + item.width / 2;

        const charFrontMat = frontMaterial.clone();
        const charSideMat = sideMaterial.clone();
        // TextGeometry usa material[0] para la cara frontal/trasera y material[1] para el relieve/bisel lateral 3D
        const mesh = new THREE.Mesh(item.geo, [charFrontMat, charSideMat]);
        mesh.position.set(relX, relY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const halfExtents = new CANNON.Vec3(item.width / 2, item.height / 2, item.depth / 2);
        const boxShape = new CANNON.Box(halfExtents);

        const body = new CANNON.Body({
          mass: 2.2,
          position: new CANNON.Vec3(relX, relY, 0),
          linearDamping: 0.08,
          angularDamping: 0.08,
        });
        body.addShape(boxShape);
        body.type = CANNON.Body.KINEMATIC;
        world.addBody(body);

        const letterData: LetterObject = {
          mesh,
          frontMat: charFrontMat,
          sideMat: charSideMat,
          body,
          relX,
          relY,
          initialPos: new THREE.Vector3(relX, relY, 0),
          phase: i * 0.42 + (relY > 0 ? 0 : 1.5),
          isFloating: true,
          baseEmissive: charFrontMat.emissive.getHex(),
          baseEmissiveIntensity: charFrontMat.emissiveIntensity,
        };

        mesh.userData.letterRef = letterData;
        letterObjects.push(letterData);
        letterMeshes.push(mesh);

        currentX += item.width + spacing;
      }

      return totalWidth;
    };

    const loader = new FontLoader();
    const cleanedFontData = JSON.parse(JSON.stringify(droidSansBoldData)) as FontData;
    // Limpiar micro-curvas internas (ink-traps) en la 'N' y la 'A' que causaban triángulos cruzados al extruir el bisel 3D
    if (cleanedFontData.glyphs['N']) {
      cleanedFontData.glyphs['N'].o =
        'm 963 0 l 685 0 l 325 655 l 325 0 l 125 0 l 125 992 l 403 992 l 763 337 l 763 992 l 963 992 l 963 0 ';
    }
    if (cleanedFontData.glyphs['A']) {
      cleanedFontData.glyphs['A'].o =
        'm 690 0 l 623 238 l 280 238 l 212 0 l 0 0 l 322 996 l 579 996 l 903 0 l 690 0 m 574 413 l 451 825 l 331 413 l 574 413 ';
    }
    const font = loader.parse(cleanedFontData);

    // Materiales de alto brillo y relieve 3D contrastado para "DESARROLLADOR"
    const whiteFrontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.24,
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

    // Materiales de alto brillo y relieve 3D profundo para "FRONTEND"
    const redFrontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      roughness: 0.06,
      metalness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.55,
    });

    const redSideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a193b,
      roughness: 0.1,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.65,
    });

    // Crear fila superior: DESARROLLADOR (blanco brillante extra grueso con bisel y extrusión 3D)
    word1TotalWidth = createWordRow({
      text: WORD_1,
      font,
      frontMaterial: whiteFrontMaterial,
      sideMaterial: whiteSideMaterial,
      relY: 2.5,
      size: 2.65,
      depth: 1.35,
      spacing: 0.42,
    });

    // Crear fila inferior: FRONTEND (rojo intenso extra grueso brillante con relieve 3D profundo)
    createWordRow({
      text: WORD_2,
      font,
      frontMaterial: redFrontMaterial,
      sideMaterial: redSideMaterial,
      relY: -2.4,
      size: 3.55,
      depth: 1.55,
      spacing: 0.56,
    });

    // ==========================================
    // SINCRONIZACIÓN DE POSICIÓN CON EL LAYOUT Y EL FONDO DE LA PÁGINA
    // ==========================================
    let cachedDocLeft = 0;
    let cachedDocTop = 0;
    let cachedWidth = initialWidth;
    let cachedHeight = initialHeight;
    let currentOffsetX = 0.6;
    let currentOffsetY = 1.5;

    const syncLayoutAndFloor = () => {
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const w = cRect.width || window.innerWidth;
      const h = cRect.height || window.innerHeight;
      cachedDocLeft = cRect.left + window.scrollX;
      cachedDocTop = cRect.top + window.scrollY;
      cachedWidth = w;
      cachedHeight = h;
      const aspect = w / h;
      const isMobile = w < 640;
      const isTablet = w >= 640 && w < 1024;

      const anchorEl = anchorRef?.current;
      const aRect = anchorEl ? anchorEl.getBoundingClientRect() : null;

      let totalWorldWidth: number;
      if (isMobile) {
        // En teléfono: asegurar que las 13 letras de "DESARROLLADOR" quepan completas con margen lateral
        totalWorldWidth = word1TotalWidth * 1.18;
      } else if (isTablet) {
        // En tablet vertical/horizontal: ajustar para que quepa completo sin cortarse
        totalWorldWidth = word1TotalWidth * 1.12;
      } else {
        // En escritorio: mantener el tamaño grande e imponente original
        const anchorWidthRatio = aRect && aRect.width > 0 ? aRect.width / w : Math.min(0.85, 700 / w);
        const desiredAnchorWorldWidth = word1TotalWidth * 0.68;
        totalWorldWidth = desiredAnchorWorldWidth / Math.max(anchorWidthRatio, 0.28);
      }

      const totalWorldHeight = totalWorldWidth / aspect;

      const halfFovRad = (FOV * Math.PI) / 360;
      const radius = totalWorldHeight / (2 * Math.tan(halfFovRad));

      camera.aspect = aspect;
      cameraSpherical.radius = radius;
      updateCameraFromSpherical();
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Ubicar el piso exactamente en el borde inferior de esta sección Hero
      const floorY = -totalWorldHeight / 2 + 0.65;
      floorMesh.position.y = floorY;
      floorBody.position.set(0, floorY, 0);

      // Calcular el centro del contenedor ancla en coordenadas 3D
      let offsetX = isMobile || isTablet ? 0 : 0.6;
      let offsetY = 1.5;

      if (aRect && aRect.width > 0) {
        const anchorCenterX = aRect.left + aRect.width / 2;
        const anchorCenterY = aRect.top + aRect.height / 2;

        const ndcX = ((anchorCenterX - cRect.left) / w) * 2 - 1;
        const ndcY = -((anchorCenterY - cRect.top) / h) * 2 + 1;

        offsetX = isMobile || isTablet ? 0 : ndcX * (totalWorldWidth / 2) + 0.8;
        offsetY = ndcY * (totalWorldHeight / 2);
      }

      currentOffsetX = offsetX;
      currentOffsetY = offsetY;

      letterObjects.forEach((item) => {
        item.initialPos.set(item.relX + offsetX, item.relY + offsetY, 0);
        if (item.isFloating) {
          item.body.position.set(item.initialPos.x, item.initialPos.y, item.initialPos.z);
          item.mesh.position.copy(item.initialPos);
        }
      });
    };

    syncLayoutAndFloor();
    // Ejecutar una segunda vez tras el primer frame por si el DOM terminó de ajustar fuentes/estilos
    const initSyncTimer = window.setTimeout(syncLayoutAndFloor, 60);
    timeouts.push(initSyncTimer);

    // ==========================================
    // INTERACCIÓN FÍSICA CON LAS LETRAS
    // ==========================================
    const triggerLetterFall = (letterObj: LetterObject) => {
      letterObj.frontMat.emissive.setHex(0xffffff);
      letterObj.frontMat.emissiveIntensity = 1.1;

      const tId = window.setTimeout(() => {
        if (letterObj?.frontMat) {
          letterObj.frontMat.emissive.setHex(letterObj.baseEmissive);
          letterObj.frontMat.emissiveIntensity = letterObj.baseEmissiveIntensity;
        }
      }, 260);
      timeouts.push(tId);

      if (letterObj.isFloating) {
        letterObj.isFloating = false;
        letterObj.body.type = CANNON.Body.DYNAMIC;
        letterObj.body.mass = 2.2;
        letterObj.body.updateMassProperties();
        letterObj.body.wakeUp();

        const pushX = (Math.random() - 0.5) * 4.5;
        const pushY = 2.2;
        const pushZ = (Math.random() - 0.5) * 5.5;
        letterObj.body.velocity.set(pushX, pushY, pushZ);

        letterObj.body.angularVelocity.set(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        );

        updateFloatingState();
      } else {
        letterObj.body.wakeUp();
        letterObj.body.velocity.set(
          (Math.random() - 0.5) * 6,
          5 + Math.random() * 3,
          (Math.random() - 0.5) * 6
        );
        letterObj.body.angularVelocity.set(
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 7
        );
      }
    };

    const resetAllLetters = () => {
      syncLayoutAndFloor();
      letterObjects.forEach((item) => {
        item.isFloating = true;
        item.body.type = CANNON.Body.KINEMATIC;
        item.body.velocity.set(0, 0, 0);
        item.body.angularVelocity.set(0, 0, 0);
        item.body.position.set(item.initialPos.x, item.initialPos.y, item.initialPos.z);
        item.body.quaternion.set(0, 0, 0, 1);

        item.mesh.position.copy(item.initialPos);
        item.mesh.quaternion.set(0, 0, 0, 1);
      });
      updateFloatingState();
    };

    resetFnRef.current = resetAllLetters;

    let mouseDirty = false;
    let isVisible = true;

    const checkCursorIntersection = () => {
      if (letterMeshes.length === 0) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(letterMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const letterRef = hitMesh.userData.letterRef as LetterObject | undefined;
        if (letterRef) {
          container.style.cursor = 'pointer';
          triggerLetterFall(letterRef);
        }
      } else {
        container.style.cursor = isDraggingCamera ? 'grabbing' : 'default';
      }
    };

    // ==========================================
    // EVENTOS DE MOUSE, TOUCH Y RESIZE
    // ==========================================
    const updateNormalizedMouse = (clientX: number, clientY: number) => {
      if (cachedWidth === 0 || cachedHeight === 0) return;
      const left = cachedDocLeft - window.scrollX;
      const top = cachedDocTop - window.scrollY;
      mouse.x = ((clientX - left) / cachedWidth) * 2 - 1;
      mouse.y = -((clientY - top) / cachedHeight) * 2 + 1;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isVisible) return;
      updateNormalizedMouse(event.clientX, event.clientY);

      if (cursorLight) {
        cursorLight.position.set(mouse.x * 18, mouse.y * 10 + 2, 6);
      }

      if (isDraggingCamera) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        cameraSpherical.theta -= deltaX * 0.006;
        cameraSpherical.phi -= deltaY * 0.006;
        updateCameraFromSpherical();

        previousMousePosition = { x: event.clientX, y: event.clientY };
      } else if (
        mouse.x >= -1 &&
        mouse.x <= (cachedWidth < 1024 ? 1 : 0.25) &&
        mouse.y >= -1 &&
        mouse.y <= 1
      ) {
        mouseDirty = true;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDraggingCamera = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      updateNormalizedMouse(event.clientX, event.clientY);
      checkCursorIntersection();
    };

    const handleMouseUp = () => {
      isDraggingCamera = false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        updateNormalizedMouse(touch.clientX, touch.clientY);
        previousMousePosition = { x: touch.clientX, y: touch.clientY };
        checkCursorIntersection();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        updateNormalizedMouse(touch.clientX, touch.clientY);
        checkCursorIntersection();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', syncLayoutAndFloor);

    // ==========================================
    // BUCLE DE ANIMACIÓN Y FÍSICAS (CON PAUSA FUERA DE PANTALLA)
    // ==========================================
    const animate = () => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      if (mouseDirty) {
        mouseDirty = false;
        checkCursorIntersection();
      }

      const elapsedTime = clock.getElapsedTime();
      if (anyFallenCached) {
        world.step(1 / 60);
      }

      // Barrido dinámico de luces especulares centradas en la posición actual del texto
      shineLight1.position.x = currentOffsetX + Math.sin(elapsedTime * 1.6) * 18;
      shineLight1.position.y = currentOffsetY + Math.cos(elapsedTime * 1.1) * 5 + 1.5;
      shineLight2.position.x = currentOffsetX + Math.cos(elapsedTime * 1.4) * 18;
      shineLight2.position.y = currentOffsetY + Math.sin(elapsedTime * 1.3) * 5 - 1.5;

      for (let i = 0; i < letterObjects.length; i++) {
        const item = letterObjects[i];

        if (item.isFloating) {
          const floatOffsetY = Math.sin(elapsedTime * 2.4 + item.phase) * 0.28;
          // Inclinación 3D sutil para que el grosor, extrusión y bisel lateral 3D siempre se aprecien con claridad
          const floatRotX = -0.11 + Math.sin(elapsedTime * 1.3 + item.phase) * 0.06;
          const floatRotY = 0.22 + Math.sin(elapsedTime * 1.5 + item.phase) * 0.14;
          const floatRotZ = Math.cos(elapsedTime * 1.8 + item.phase) * 0.04;

          item.mesh.position.set(
            item.initialPos.x,
            item.initialPos.y + floatOffsetY,
            item.initialPos.z
          );
          item.mesh.rotation.set(floatRotX, floatRotY, floatRotZ);
        } else {
          item.mesh.position.set(
            item.body.position.x,
            item.body.position.y,
            item.body.position.z
          );
          item.mesh.quaternion.set(
            item.body.quaternion.x,
            item.body.quaternion.y,
            item.body.quaternion.z,
            item.body.quaternion.w
          );
        }
      }

      renderer.render(scene, camera);
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            clock.getDelta();
            animate();
          } else if (!isVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
          }
        });
      },
      { threshold: 0.02 }
    );
    visibilityObserver.observe(container);

    animate();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      timeouts.forEach((id) => clearTimeout(id));
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', syncLayoutAndFloor);
      letterObjects.forEach((item) => {
        item.mesh.geometry.dispose();
        item.frontMat.dispose();
        item.sideMat.dispose();
      });
      floorGeo.dispose();
      floorMat.dispose();
      renderer.dispose();
    };
  }, [anchorRef]);

  return (
    <div className="absolute inset-0 w-full h-full select-none z-30 pointer-events-none">
      <div
        ref={containerRef}
        onDoubleClick={() => resetFnRef.current?.()}
        className="w-full h-full pointer-events-none"
      />
      {hasFallenLetters && (
        <button
          type="button"
          onClick={() => resetFnRef.current?.()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-black/50 hover:bg-[#2563eb]/30 border border-white/15 hover:border-[#2563eb]/60 transition-all duration-300 backdrop-blur-md cursor-pointer pointer-events-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reiniciar letras
        </button>
      )}
    </div>
  );
};

export default Hero3DText;
