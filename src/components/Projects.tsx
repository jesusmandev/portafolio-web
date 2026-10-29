import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AccordionGallery, { type AccordionGalleryItem } from './AccordionGallery';

interface Project {
  id: number;
  title: string;
  category: string;
  categoryColor: string;
  description: string;
  image: string;
  gradient: string;
  codeLink: string;
  webLink: string;
}

const Projects: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  const projects: Project[] = [
    {
      id: 1,
      title: 'Tienda de Cuentas Streaming',
      category: 'APLICACIÓN WEB',
      categoryColor: '#f59e0b',
      description: 'Plataforma completa para comprar y vender cuentas de servicios streaming.',
      image: `${import.meta.env.BASE_URL}projects/tienda-streaming.png`,
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      codeLink: 'https://github.com/jesusmandev/platform-to-sell-streaming-accounts.git',
      webLink: 'https://jesusmandev.github.io/platform-to-sell-streaming-accounts/',
    },
    {
      id: 2,
      title: 'Menú de Comida Mundial',
      category: 'COMIDA',
      categoryColor: '#f59e0b',
      description: 'Menú gastronómico con platos del mundo y diseño llamativo.',
      image: `${import.meta.env.BASE_URL}projects/menu-comida.png`,
      gradient: 'linear-gradient(135deg, #2d1b00 0%, #4a2c0a 50%, #6b3a0a 100%)',
      codeLink: 'https://github.com/jesusmandev/WorldMenu.git',
      webLink: 'https://jesusmandev.github.io/WorldMenu/',
    },
    {
      id: 3,
      title: 'Juego del Ahorcado',
      category: 'GAME',
      categoryColor: '#22c55e',
      description: 'Juego clásico con múltiples niveles de dificultad.',
      image: `${import.meta.env.BASE_URL}projects/juego-ahorcado.png`,
      gradient: 'linear-gradient(135deg, #0a2a1a 0%, #1a3a2a 50%, #0d4a2a 100%)',
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
      gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #3d1f6e 100%)',
      codeLink: 'https://github.com/jesusmandev/GIF-app.git',
      webLink: 'https://jesusmandev.github.io/GIF-app/',
    },
    {
      id: 5,
      title: 'Tarjeta de San Valentín',
      category: 'DISEÑO',
      categoryColor: '#ec4899',
      description: 'Tarjeta interactiva animada con efectos CSS.',
      image: `${import.meta.env.BASE_URL}projects/tarjeta-san-valentin.png`,
      gradient: 'linear-gradient(135deg, #2e0a1a 0%, #4e1b2d 50%, #6e1f3d 100%)',
      codeLink: 'https://github.com/jesusmandev/valentine-card.git',
      webLink: 'https://jesusmandev.github.io/valentine-card/',
    },
    {
      id: 6,
      title: 'Simulador Prelcfes',
      category: 'EDUCACIÓN',
      categoryColor: '#6366f1',
      description: 'Simulador del examen Prelcfes con temporizador y puntuación.',
      image: `${import.meta.env.BASE_URL}projects/simulador-prelcfes.png`,
      gradient: 'linear-gradient(135deg, #0a0a2e 0%, #1b1b4e 50%, #1f1f6e 100%)',
      codeLink: 'https://github.com/jesusmandev/simulator.git',
      webLink: 'https://jesusmandev.github.io/simulator/',
    },
    {
      id: 7,
      title: 'Calculadora',
      category: 'UTILIDAD',
      categoryColor: '#f59e0b',
      description: 'Calculadora funcional con diseño limpio y operaciones completas.',
      image: `${import.meta.env.BASE_URL}projects/calculadora.png`,
      gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #3a3a3a 100%)',
      codeLink: 'https://github.com/jesusmandev/calculadora.git',
      webLink: 'https://jesusmandev.github.io/calculadora/',
    },
    {
      id: 8,
      title: 'Cafés Colombianos',
      category: 'COLOMBIA ☕',
      categoryColor: '#f59e0b',
      description: 'Landing page sobre la cultura del café colombiano.',
      image: `${import.meta.env.BASE_URL}projects/cafe.png`,
      gradient: 'linear-gradient(135deg, #2d1b00 0%, #3a2a0a 50%, #5a3a0a 100%)',
      codeLink: 'https://github.com/jesusmandev/CAFES-COLOMBIANOS.git',
      webLink: 'https://jesusmandev.github.io/CAFES-COLOMBIANOS/',
    },
    {
      id: 9,
      title: 'Landing Page de Hamburguesa',
      category: 'LANDING PAGE',
      categoryColor: '#ef4444',
      description:
        'Landing page atractiva para un restaurante de hamburguesas con diseño moderno y apetitoso.',
      image: `${import.meta.env.BASE_URL}projects/hamburguesa.png`,
      gradient: 'linear-gradient(135deg, #4a1a0a 0%, #8b2500 50%, #c43e00 100%)',
      codeLink: 'https://github.com/jesusmandev/burger-landing.git',
      webLink: 'https://agent-6a1ac44517acbb0fc92284c3--burger-jesu.netlify.app/',
    },
    {
      id: 10,
      title: 'Landing Page de Motocicleta',
      category: 'LANDING PAGE',
      categoryColor: '#3b82f6',
      description:
        'Landing page dinámica para la marca H2R de motocicletas con efectos visuales impactantes.',
      image: `${import.meta.env.BASE_URL}projects/moto.png`,
      gradient: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #2a3a6a 100%)',
      codeLink: 'https://github.com/jesusmandev/landing-page-of-motorbike.git',
      webLink: 'https://jesusmandev.github.io/landing-page-of-motorbike/',
    },
  ];

  const toGalleryItems = (list: Project[]): AccordionGalleryItem[] =>
    list.map((p) => ({
      image: p.image,
      label: p.title,
      link: p.webLink,
      alt: p.title,
      category: p.category,
      categoryColor: p.categoryColor,
      description: p.description,
      codeLink: p.codeLink,
      webLink: p.webLink,
    }));

  const primaryItems = toGalleryItems(projects.slice(0, 5));
  const secondaryItems = toGalleryItems(projects.slice(5, 10));

  return (
    <section
      id="projects"
      className="relative pt-20 px-4 sm:px-8 lg:px-16"
    >
      <motion.div
        className="flex flex-col items-center justify-center mb-16"
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
      </motion.div>

      {/* ====== ACCORDION GALLERY PRINCIPAL (5 proyectos destacados) ====== */}
      <motion.div
        className="w-full max-w-[1320px] mx-auto mb-8"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] as const, delay: 0.1 }}
      >
        <AccordionGallery
          items={primaryItems}
          defaultIndex={2}
          expandRatio={0.52}
          trigger="hover"
          accentColor="#ffffff"
          overlayColor="#060010"
          textColor="#ffffff"
          grayscale
          showLabels
          duration={0.6}
          ease="power3.out"
          parallax={0.5}
          tilt={8}
          stagger={0.06}
          height={460}
          gap={10}
          radius={16}
          orientation="horizontal"
        />
      </motion.div>

      {/* ====== SEGUNDA FILA ACCORDION GALLERY (al expandir "Ver todos los proyectos") ====== */}
      {expanded && (
        <motion.div
          className="w-full max-w-[1320px] mx-auto mt-8 mb-8"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] as const }}
        >
          <AccordionGallery
            items={secondaryItems}
            defaultIndex={2}
            expandRatio={0.52}
            trigger="hover"
            accentColor="#ffffff"
            overlayColor="#060010"
            textColor="#ffffff"
            grayscale
            showLabels
            duration={0.6}
            ease="power3.out"
            parallax={0.5}
            tilt={8}
            stagger={0.06}
            height={460}
            gap={10}
            radius={16}
            orientation="horizontal"
          />
        </motion.div>
      )}

      {/* Button */}
      <motion.div
        className="flex justify-center mt-14"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] as const, delay: 0.2 }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="projects-view-all"
        >
          <span>{expanded ? 'Ver menos' : 'Ver todos los proyectos'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`projects-view-all-icon ${expanded ? 'projects-view-all-icon--rotated' : ''}`}
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
      </motion.div>
    </section>
  );
};

export default Projects;
