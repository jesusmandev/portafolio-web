import React from 'react';
import { motion, type Variants } from 'framer-motion';
import AboutModel3D from './AboutModel3D';


const About: React.FC = () => {
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
          
          {/* Left Column: 3D Model */}
          <motion.div 
            className="relative flex justify-center items-center w-full group"
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Subtle blue glow behind 3D model */}
            <div className="absolute inset-0 bg-[#2563eb]/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"></div>
            
            <AboutModel3D />
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

              <motion.p variants={itemVariants} className="text-xl sm:text-2xl lg:text-3xl text-[#3b82f6] font-semibold leading-snug drop-shadow-[0_0_105px_rgba(37,99,235,0.2)]">
                Desarrollador Frontend — Transformo ideas y diseños en sitios web reales que funcionan y generan resultados.
              </motion.p>
            </div>

           <motion.p variants={itemVariants} className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
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
                  className="group flex flex-col items-start text-left justify-start py-5 px-6 min-h-30 rounded-xl bg-linear-to-br from-white/4 to-white/1 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/6 hover:border-[#2563eb]/40 hover:-translate-y-1.25 hover:shadow-[0_10px_20px_rgba(37,99,235,0.18)]"
                >
                  <div className="text-2xl mb-3 opacity-90 group-hover:scale-110 transition-transform">
                    {strength.icon}
                  </div>
                  <h4 className="text-white font-bold text-base mb-1 leading-snug">{strength.title}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">{strength.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Quote */}
            <motion.div variants={itemVariants} className="relative bg-linear-to-r from-white/4 to-transparent border border-white/5 border-l-0 rounded-xl p-6 backdrop-blur-sm overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.65)]"></div>
              <p className="text-white text-lg sm:text-xl font-medium italic leading-relaxed pl-2">
                "No solo entrego un sitio web; entrego la solución que conecta tu idea con tus clientes."
              </p>
            </motion.div>

            {/* Personal Info Chips */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-5 pt-3">
              {[
                "📍 Montería, Colombia",
                "💻 Desarrollador Frontend",
                "🎨 Diseño UI",
                "🚀 Aprendiz continuo"
              ].map((chip, i) => (
                <div 
                  key={i}
                  className="px-5 py-2 rounded-full bg-white/3 border border-white/10 backdrop-blur-md text-gray-300 text-sm font-medium hover:bg-white/8 hover:border-white/20 transition-all duration-400 cursor-default"
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
