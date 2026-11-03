import React from 'react';
import { motion } from 'framer-motion';
import DepthCarousel, { type DepthCarouselItem } from './DepthCarousel';

interface Project {
  id: number;
  title: string;
  category: string;
  categoryColor: string;
  description: string;
  image: string;
  codeLink: string;
  webLink: string;
}

const Projects: React.FC = () => {
  const projects: Project[] = [
    {
      id: 1,
      title: 'Tienda de Cuentas Streaming',
      category: 'APLICACIÓN WEB',
      categoryColor: '#f59e0b',
      description: 'Plataforma completa para comprar y vender cuentas de servicios streaming.',
      image: `${import.meta.env.BASE_URL}projects/tienda-streaming.png`,
      codeLink: 'https://github.com/jesusmandev/platform-to-sell-streaming-accounts.git',
      webLink: 'https://jesusmandev.github.io/platform-to-sell-streaming-accounts/',
    },
    {
      id: 2,
      title: 'Menú de Comida Mundial',
      category: 'COMIDA',
      categoryColor: '#f59e0b',
      description: 'Menú gastronómico interactivo con platos del mundo.',
      image: `${import.meta.env.BASE_URL}projects/menu-comida.png`,
      codeLink: 'https://github.com/jesusmandev/WorldMenu.git',
      webLink: 'https://jesusmandev.github.io/WorldMenu/',
    },
    {
      id: 3,
      title: 'Juego del Ahorcado',
      category: 'GAME',
      categoryColor: '#22c55e',
      description: 'Juego clásico interactivo con múltiples niveles de dificultad.',
      image: `${import.meta.env.BASE_URL}projects/juego-ahorcado.png`,
      codeLink: 'https://github.com/jesusmandev/Hangman-game.git',
      webLink: 'https://jesusmandev.github.io/Hangman-game/',
    },
    {
      id: 4,
      title: 'Aplicación de GIFs',
      category: 'APP',
      categoryColor: '#a855f7',
      description: 'Aplicación para buscar y visualizar GIFs consumiendo una API externa.',
      image: `${import.meta.env.BASE_URL}projects/app-gifs.png`,
      codeLink: 'https://github.com/jesusmandev/GIF-app.git',
      webLink: 'https://jesusmandev.github.io/GIF-app/',
    },
    {
      id: 5,
      title: 'Tarjeta de San Valentín',
      category: 'DISEÑO',
      categoryColor: '#ec4899',
      description: 'Tarjeta interactiva animada con efectos visuales CSS 3D.',
      image: `${import.meta.env.BASE_URL}projects/tarjeta-san-valentin.png`,
      codeLink: 'https://github.com/jesusmandev/valentine-card.git',
      webLink: 'https://jesusmandev.github.io/valentine-card/',
    },
    {
      id: 6,
      title: 'Simulador Prelcfes',
      category: 'EDUCACIÓN',
      categoryColor: '#6366f1',
      description: 'Simulador del examen de estado con temporizador y puntuación.',
      image: `${import.meta.env.BASE_URL}projects/simulador-prelcfes.png`,
      codeLink: 'https://github.com/jesusmandev/simulator.git',
      webLink: 'https://jesusmandev.github.io/simulator/',
    },
    {
      id: 7,
      title: 'Calculadora',
      category: 'UTILIDAD',
      categoryColor: '#f59e0b',
      description: 'Calculadora matemática con interfaz limpia y operaciones completas.',
      image: `${import.meta.env.BASE_URL}projects/calculadora.png`,
      codeLink: 'https://github.com/jesusmandev/calculadora.git',
      webLink: 'https://jesusmandev.github.io/calculadora/',
    },
    {
      id: 8,
      title: 'Cafés Colombianos',
      category: 'COLOMBIA ☕',
      categoryColor: '#f59e0b',
      description: 'Landing page temática sobre la historia y cultura del café colombiano.',
      image: `${import.meta.env.BASE_URL}projects/cafe.png`,
      codeLink: 'https://github.com/jesusmandev/CAFES-COLOMBIANOS.git',
      webLink: 'https://jesusmandev.github.io/CAFES-COLOMBIANOS/',
    },
    {
      id: 9,
      title: 'Landing Page de Hamburguesa',
      category: 'LANDING PAGE',
      categoryColor: '#ef4444',
      description: 'Landing page moderna para una hamburguesería artesanal con diseño dinámico.',
      image: `${import.meta.env.BASE_URL}projects/hamburguesa.png`,
      codeLink: 'https://github.com/jesusmandev/burger-landing.git',
      webLink: 'https://agent-6a1ac44517acbb0fc92284c3--burger-jesu.netlify.app/',
    },
    {
      id: 10,
      title: 'Landing Page de Motocicleta',
      category: 'LANDING PAGE',
      categoryColor: '#3b82f6',
      description: 'Landing page dinámica para la marca de motocicletas H2R.',
      image: `${import.meta.env.BASE_URL}projects/moto.png`,
      codeLink: 'https://github.com/jesusmandev/landing-page-of-motorbike.git',
      webLink: 'https://jesusmandev.github.io/landing-page-of-motorbike/',
    },
  ];

  // Convert to DepthCarousel items with title, badge and links
  const carouselItems: DepthCarouselItem[] = projects.map((p) => ({
    image: p.image,
    alt: p.title,
    title: p.title,
    category: p.category,
    categoryColor: p.categoryColor,
    description: p.description,
    codeLink: p.codeLink,
    webLink: p.webLink,
  }));

  return (
    <section
      id="projects"
      className="relative pt-20 px-4 sm:px-8 lg:px-16 overflow-hidden"
    >
      {/* Decorative ambient glow */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-[#2563eb]/10 blur-[150px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Header */}
      <motion.div
        className="flex flex-col items-center justify-center mb-12"
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] as const }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-[#2563eb]"></div>
          <h2 className="text-[#2563eb] font-bold tracking-[0.2em] text-sm uppercase">
            Portafolio
          </h2>
          <div className="w-8 h-[2px] bg-[#2563eb]"></div>
        </div>
        <h3 className="text-3xl md:text-5xl font-black text-white text-center">
          Proyectos Destacados
        </h3>
        <p className="text-gray-400 text-center max-w-xl mt-3 text-sm md:text-base">
          Explora mis aplicaciones y páginas web más recientes en un carrusel 3D interactivo con profundidad, perspectiva y efecto de inclinación en cada tarjeta.
        </p>
      </motion.div>

      {/* ====== DEPTH CAROUSEL WITH TILTED CARDS ====== */}
      <motion.div
        className="w-full max-w-[1320px] mx-auto mb-4"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] as const, delay: 0.1 }}
      >
        <div style={{ height: '520px', position: 'relative' }}>
          <DepthCarousel
            items={carouselItems}
            depth={220}
            spread={90}
            tilt={22}
            tiltDirection="right"
            perspective={1400}
            visibleCards={4}
            falloff={0.2}
            blur={6}
            autoplay={false}
            loop
            cardWidth={310}
            cardHeight={400}
            radius={18}
            tint="#05060a"
            duration={700}
            ease="power3.out"
            autoplayDelay={3200}
            showControls
            showIndicators
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Projects;
