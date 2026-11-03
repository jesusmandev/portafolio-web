import React from 'react';
import { motion, type Variants } from 'framer-motion';
import AboutModel3D from './AboutModel3D';
import AboutFreelancer3D from './AboutFreelancer3D';


const About: React.FC = () => {
  const [isSectionNear, setIsSectionNear] = React.useState(false);

  React.useEffect(() => {
    const section = document.getElementById('about');
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsSectionNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  // Framer Motion Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }; 

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] as const }
    }
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] as const }
    }
  };

  return (
    <section id="about" className="relative w-full min-h-screen flex flex-col justify-center py-20 overflow-hidden bg-[#050505] z-10">
      
      {/* 3D "FREELANCER" White Letters on Floor Background (carga optimizada al aproximarse) */}
      {isSectionNear && <AboutFreelancer3D />}

      {/* Background Subtle Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#2563eb]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-350 mx-auto w-full flex flex-col h-full justify-center">
        
        {/* Header section */}
        <motion.div 
          className="flex flex-col items-center justify-center text-center mb-12 lg:mb-16 z-10"
          initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-0.75 bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
            <h2 className="text-[#2563eb] font-black tracking-[0.3em] text-sm md:text-base uppercase drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] ml-[0.3em]">
              SOBRE MÍ
            </h2>
            <div className="w-12 h-0.75 bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,0.8)] hidden sm:block"></div>
          </div>
        </motion.div>

        {/* Main Content 2 columns */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[4.5fr_5.5fr] gap-10 lg:gap-12.5 items-center z-10">
          
          {/* Left Column: 3D Model (Lazy load para no bloquear la carga inicial en móviles) */}
          <motion.div 
            className="relative flex justify-center items-center w-full min-h-[460px] lg:min-h-[640px] group"
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Subtle blue glow behind 3D model */}
            <div className="absolute inset-0 bg-[#2563eb]/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"></div>
            
            {isSectionNear ? (
              <AboutModel3D />
            ) : (
              <div className="w-full h-[460px] lg:h-[640px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin opacity-40" />
              </div>
            )}
          </motion.div>

          {/* Right Column: Content */}
          <motion.div 
            className="flex flex-col gap-8 lg:gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            
            <div className="flex flex-col gap-6 sm:gap-8">
              <motion.h3 variants={itemVariants} className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Hola, soy Jesús Martínez.
              </motion.h3>

              <motion.p variants={itemVariants} className="text-xl sm:text-2xl lg:text-3xl text-[#60a5fa] font-bold leading-snug drop-shadow-[0_0_40px_rgba(37,99,235,0.3)]">
                Desarrollador Frontend — Transformo ideas y diseños en sitios web reales que funcionan y generan resultados.
              </motion.p>
            </div>

            <motion.p variants={itemVariants} className="text-zinc-200 text-base sm:text-lg leading-relaxed max-w-2xl font-normal drop-shadow-sm">
              Muchos negocios y proyectos se quedan estancados entre una gran idea y un sitio web que realmente funcione. Yo cierro esa brecha: tomo tu diseño en Figma o concepto de landing page y lo convierto en un sitio real, rápido y pixel-perfect. Combino código limpio con una gran atención al detalle visual, para que tu presencia digital no solo luzca increíble, sino que cargue rápido, funcione en cualquier dispositivo y ayude a tu negocio a atraer más clientes. Cuando el proyecto lo requiere, también integro experiencias 3D interactivas con Three.js — ese toque extra que hace que un sitio sea memorable, no solo visitable.
            </motion.p>

            {/* Strengths Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "De Diseño a Código",
                  desc: "Fidelidad pixel-perfect, sin sorpresas",
                  icon: "🎨"
                },
                {
                  title: "Landing Pages que Convierten",
                  desc: "Enfocadas en resultados, no solo estética",
                  icon: "🚀"
                },
                {
                  title: "Diseño Responsivo",
                  desc: "Perfecto en cualquier dispositivo",
                  icon: "🎯"
                },
                {
                  title: "Alto Rendimiento",
                  desc: "Carga rápida y código optimizado",
                  icon: "⚡"
                },
                {
                  title: "Experiencias 3D",
                  desc: "Interfaces inmersivas con Three.js",
                  icon: "🧊"
                }
              ].map((strength, i) => (
                <div 
                  key={i}
                  className="group flex flex-col items-start text-left justify-start py-5 px-6 min-h-30 rounded-2xl bg-[#0c111e]/90 border border-white/15 backdrop-blur-xl transition-all duration-300 hover:bg-[#12192e] hover:border-[#2563eb]/60 hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.22)] shadow-xl shadow-black/50"
                >
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">
                    {strength.icon}
                  </div>
                  <h4 className="text-white font-bold text-base mb-1.5 leading-snug drop-shadow-sm">{strength.title}</h4>
                  <p className="text-zinc-300 text-xs sm:text-sm font-normal leading-relaxed">{strength.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Quote */}
            <motion.div variants={itemVariants} className="relative bg-gradient-to-r from-[#0c1222]/95 via-[#080d19]/90 to-[#050811]/85 border border-white/15 border-l-0 rounded-2xl p-6 backdrop-blur-xl shadow-xl shadow-black/50 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
              <p className="text-white text-lg sm:text-xl font-semibold italic leading-relaxed pl-2 drop-shadow-sm">
                "No solo entrego un sitio web; entrego la solución que conecta tu idea con tus clientes."
              </p>
            </motion.div>

            {/* Personal Info Chips */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-2">
              {[
                "📍 Montería, Colombia",
                "💻 Desarrollador Frontend",
                "🎨 Diseño UI",
                "🚀 Aprendiz continuo"
              ].map((chip, i) => (
                <div 
                  key={i}
                  className="px-5 py-2.5 rounded-full bg-[#0e1424]/90 border border-white/15 backdrop-blur-xl text-zinc-100 text-sm font-medium hover:bg-[#151e36] hover:text-white hover:border-[#2563eb]/50 transition-all duration-300 shadow-md shadow-black/30 cursor-default"
                >
                  {chip}
                </div>
              ))}
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
