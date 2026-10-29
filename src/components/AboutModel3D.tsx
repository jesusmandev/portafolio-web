import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const AboutModel3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId = 0;
    let isVisible = true;
    let isDisposed = false;
    let isRendererReady = false;

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 720;

    // Escena y Cámara con FOV de retrato (28°) para mínima distorsión y máxima nitidez
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
    camera.position.set(0, 0.93, 4.05);

    // Renderizador WebGPU en Ultra HD con MSAA 4x y Supersampling
    const renderer = new WebGPURenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      samples: 4,
    });

    // PixelRatio balanceado para fluidez 60fps manteniendo nitidez HD
    const hdPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(hdPixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;

    container.innerHTML = '';
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    // Controles interactivos suaves (solo rotación horizontal)
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 2.25;
    controls.maxPolarAngle = Math.PI / 1.95;
    controls.minAzimuthAngle = -Math.PI / 3;
    controls.maxAzimuthAngle = Math.PI / 3;
    controls.target.set(0, 0.93, 0);
    controls.update();

    // Iluminación de estudio de alta definición para resaltar detalles del rostro, gafas y traje
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e1522, 1.1);
    hemiLight.position.set(0, 5, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(2.5, 4, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    // Luz de recorte (rim light) con el acento azul del portafolio
    const rimLight = new THREE.SpotLight(0x2563eb, 3.4, 10, Math.PI / 3, 0.5, 1);
    rimLight.position.set(-2.5, 2.8, -2.2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.9);
    fillLight.position.set(-2.5, 1.6, 2.8);
    scene.add(fillLight);

    // Sombra suave en la base del personaje
    const shadowPlaneGeo = new THREE.PlaneGeometry(4, 4);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.32 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    let mixer: THREE.AnimationMixer | null = null;
    let modelRoot: THREE.Group | null = null;
    let targetMouseX = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed || !isVisible || !isRendererReady) {
        animationFrameId = 0;
        return;
      }

      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      if (mixer) {
        mixer.update(delta);
      }

      if (modelRoot) {
        modelRoot.rotation.y += (targetMouseX - modelRoot.rotation.y) * 0.05;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    const startLoop = () => {
      if (!animationFrameId && !isDisposed && isRendererReady && isVisible) {
        clock.getDelta();
        animate();
      }
    };

    // Inicializar WebGPU y luego cargar el modelo GLB en máxima calidad
    renderer
      .init()
      .then(() => {
        if (isDisposed) return;
        isRendererReady = true;

        const loader = new GLTFLoader();
        const modelUrl = `${import.meta.env.BASE_URL}personaje/model%202.glb`;

        loader.load(
          modelUrl,
          (gltf) => {
            if (isDisposed) return;

            const model = gltf.scene;
            modelRoot = model;

            // Filtrado anisotrópico máximo (16x) y mipmaps trilineales para texturas en HD
            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = true;

                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                  const stdMat = mat as THREE.MeshStandardMaterial;
                  const textures = [
                    stdMat.map,
                    stdMat.normalMap,
                    stdMat.roughnessMap,
                    stdMat.metalnessMap,
                    stdMat.aoMap,
                  ];
                  textures.forEach((tex) => {
                    if (tex) {
                      tex.anisotropy = 16;
                      tex.minFilter = THREE.LinearMipmapLinearFilter;
                      tex.magFilter = THREE.LinearFilter;
                      tex.generateMipmaps = true;
                      tex.needsUpdate = true;
                    }
                  });
                  stdMat.needsUpdate = true;
                });
              }
            });

            // Activar animaciones incluidas en el GLB primero
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model);
              const action = mixer.clipAction(gltf.animations[0]);
              action.play();
              mixer.update(0);
            }

            // Escala natural (1.86m de alto, de y=0 a y=1.86)
            model.scale.setScalar(1.0);

            // Actualizar matrices de huesos y esqueleto para obtener la posición exacta del personaje
            model.updateMatrixWorld(true);
            model.traverse((child) => {
              if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                (child as THREE.SkinnedMesh).skeleton?.update();
              }
            });

            // Centrar el personaje usando el hueso Hips
            const hips = model.getObjectByName('Hips');
            if (hips) {
              const hipsPos = new THREE.Vector3();
              hips.getWorldPosition(hipsPos);
              model.position.x -= hipsPos.x;
              model.position.z -= hipsPos.z;
            }

            // Con FOV=28° y z=4.05m se abarca de -0.08m a +1.94m (cuerpo entero sin recortar y sin distorsión)
            const lookAtY = 0.93;
            controls.target.set(0, lookAtY, 0);
            camera.position.set(0, lookAtY + 0.02, 4.05);
            controls.update();

            scene.add(model);
            setIsLoaded(true);
            startLoop();
          },
          (xhr) => {
            if (xhr.total > 0) {
              setLoadingProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
            }
          },
          (err) => {
            console.error('Error cargando el modelo 3D con WebGPU:', err);
          }
        );
      })
      .catch((err) => {
        console.error('Error inicializando WebGPURenderer:', err);
      });

    // Seguimiento sutil del cursor
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseX = nx * 0.18;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Pausar renderizado cuando la sección no está en pantalla
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startLoop();
          } else if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(container);

    // ResizeObserver para mantener la resolución nativa exacta del contenedor en todo momento
    const updateSize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 720;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);

    return () => {
      isDisposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateSize);
      controls.dispose();

      if (modelRoot) {
        modelRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((m) => {
              const std = m as THREE.MeshStandardMaterial;
              std.map?.dispose();
              std.normalMap?.dispose();
              std.roughnessMap?.dispose();
              std.metalnessMap?.dispose();
              m.dispose();
            });
          }
        });
      }

      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      if (isRendererReady) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[560px] sm:h-[660px] lg:h-[760px] flex items-center justify-center select-none">
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-[#2563eb] animate-spin" />
          <span className="text-xs font-medium tracking-widest uppercase text-gray-400">
            Cargando 3D WebGPU {loadingProgress > 0 ? `${loadingProgress}%` : '...'}
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        title="Arrastra para rotar el modelo 3D (WebGPU HD)"
      />
    </div>
  );
};

export default AboutModel3D;
