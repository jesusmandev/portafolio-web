import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Skill {
  name: string;
  icon: string;
  color: string;
  bgGlow: string;
}

const skills: Skill[] = [
  {
    name: 'React',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    color: '#61DAFB',
    bgGlow: 'rgba(97, 218, 251, 0.3)',
  },
  {
    name: 'Next.js',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg',
    color: '#ffffff',
    bgGlow: 'rgba(255, 255, 255, 0.2)',
  },
  {
    name: 'TypeScript',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    color: '#3178C6',
    bgGlow: 'rgba(49, 120, 198, 0.3)',
  },
  {
    name: 'JavaScript',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    color: '#F7DF1E',
    bgGlow: 'rgba(247, 223, 30, 0.3)',
  },
  {
    name: 'Tailwind CSS',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg',
    color: '#06B6D4',
    bgGlow: 'rgba(6, 182, 212, 0.3)',
  },
  {
    name: 'Node.js',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg',
    color: '#339933',
    bgGlow: 'rgba(51, 153, 51, 0.3)',
  },
  {
    name: 'HTML5',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    color: '#E34F26',
    bgGlow: 'rgba(227, 79, 38, 0.3)',
  },
  {
    name: 'CSS3',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    color: '#1572B6',
    bgGlow: 'rgba(21, 114, 182, 0.3)',
  },
  {
    name: 'Git',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
    color: '#F05032',
    bgGlow: 'rgba(240, 80, 50, 0.3)',
  },
  {
    name: 'Vite',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg',
    color: '#646CFF',
    bgGlow: 'rgba(100, 108, 255, 0.3)',
  },
];

const VISIBLE_COUNT = 7; 
const AUTO_INTERVAL = 2500;

const Skills: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const total = skills.length;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const getVisibleItems = () => {
    const half = Math.floor(VISIBLE_COUNT / 2);
    const items: { skill: Skill; offset: number; originalIndex: number }[] = [];

    for (let i = -half; i <= half; i++) {
      const idx = ((activeIndex + i) % total + total) % total;
      items.push({ skill: skills[idx], offset: i, originalIndex: idx });
    }
    return items;
  };

  const visibleItems = getVisibleItems();
  const activeSkill = skills[activeIndex];

  return (
    <section id="skills" className="relative w-full overflow-hidden pt-20 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="flex justify-center w-full mb-16">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-black text-white text-center"
        >
          Habilidades
        </motion.h3>
      </div>

      {/* Carousel Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="skills-carousel-wrapper relative w-full flex flex-col items-center justify-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ minHeight: '250px' }} // Evita colapso de altura por los hijos absolutos
      >
        {/* Background ambient glow */}
        <div
          className="skills-ambient-glow"
          style={{ background: activeSkill.bgGlow }}
        />

        {/* Cards Track - Ahora centrado usando Flexbox relativo */}
        <div className="skills-carousel-track relative w-full flex items-center justify-center" style={{ height: '160px' }}>
          {visibleItems.map(({ skill, offset, originalIndex }) => {
            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);

            // Cálculos matemáticos de renderizado 3D
            const scale = isCenter ? 1 : Math.max(0.6, 1 - absOffset * 0.13);
            const offsetMultiplier = windowWidth < 480 ? 75 : 130;
            const translateX = offset * offsetMultiplier; // Desplazamiento lateral en px
            const zIndex = VISIBLE_COUNT - absOffset;
            const opacity = isCenter ? 1 : Math.max(0.3, 1 - absOffset * 0.22);
            const rotateY = offset * -5;

            return (
              <motion.div
                key={`${skill.name}-${originalIndex}`}
                className={`skills-card ${isCenter ? 'skills-card--active' : ''}`}
                animate={{
                  x: translateX,
                  scale,
                  rotateY,
                  opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 28,
                  mass: 0.8,
                }}
                style={{
                  position: 'absolute', // Absoluto respecto al contenedor flex centrado
                  zIndex,
                  borderColor: isCenter ? activeSkill.color : 'rgba(255, 255, 255, 0.06)',
                  boxShadow: isCenter
                    ? `0 0 25px ${activeSkill.bgGlow}, 0 0 60px ${activeSkill.bgGlow}, inset 0 0 25px ${activeSkill.bgGlow}`
                    : '0 4px 20px rgba(0, 0, 0, 0.4)',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveIndex(originalIndex)}
              >
                {/* Inner glow for active */}
                {isCenter && (
                  <div
                    className="skills-card-inner-glow"
                    style={{ background: `radial-gradient(circle, ${activeSkill.bgGlow} 0%, transparent 70%)` }}
                  />
                )}

                <img
                  src={skill.icon}
                  alt={skill.name}
                  className="skills-card-icon"
                  style={{
                    filter: isCenter
                      ? `drop-shadow(0 0 8px ${skill.bgGlow})`
                      : 'brightness(0.6) saturate(0.5)',
                  }}
                  draggable={false}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Active skill name */}
        <div className="skills-label-container mt-6 h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={activeSkill.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="skills-label"
              style={{
                color: activeSkill.color,
                textShadow: `0 0 20px ${activeSkill.bgGlow}, 0 0 40px ${activeSkill.bgGlow}`,
              }}
            >
              {activeSkill.name}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Navigation arrows */}
        <button
          className="skills-nav skills-nav--prev"
          onClick={prev}
          aria-label="Anterior habilidad"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          className="skills-nav skills-nav--next"
          onClick={next}
          aria-label="Siguiente habilidad"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="skills-dots mt-6">
          {skills.map((_, i) => (
            <button
              key={i}
              className={`skills-dot ${i === activeIndex ? 'skills-dot--active' : ''}`}
              style={i === activeIndex ? { backgroundColor: activeSkill.color, boxShadow: `0 0 8px ${activeSkill.bgGlow}` } : {}}
              onClick={() => setActiveIndex(i)}
              aria-label={`Ir a ${skills[i].name}`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Skills;