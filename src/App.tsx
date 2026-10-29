import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';
import CVModal from './components/CVModal';

import Footer from './components/Footer';
import { LanguageProvider } from './hooks/useLanguage';
import './index.css';

import IntroScreen from './components/IntroScreen';
import { AnimatePresence, motion } from 'framer-motion';
import ScrollVelocity from './components/ScrollVelocity';
import FluidGlass from './components/FluidGlass';

const AppContent: React.FC = () => {
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  // Intersection Observer setup
  useEffect(() => {
    if (!entered) return; // Only observe when entered
    
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [entered]);

  // Lock body scroll when intro is active
  useEffect(() => {
    if (!entered) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [entered]);

  return (
    <>
      <AnimatePresence>
        {!entered && <IntroScreen onEnter={() => setEntered(true)} />}
      </AnimatePresence>

      <div className={`min-h-screen bg-[#050505] text-white font-body selection:bg-[#2563eb]/30 relative overflow-x-hidden ${!entered ? 'h-screen overflow-hidden' : ''}`}>
        {/* Cursor fluido de cristal 3D (sprite ligero 88x88px sin lag) */}
        <FluidGlass
          shape="torus"
          shapes={['torus', 'lens', 'diamond', 'pill']}
          size={42}
          refraction={1}
          dispersion={0.35}
          color="#3b82f6"
          tint={0.25}
          reflection={1.25}
          elevation={0.4}
          smoothness={0.28}
          wobble={0.55}
          spin={0}
          idle={false}
          morphOnClick
          intro
        />

        <Navbar onDownloadCV={() => setIsCVModalOpen(true)} />
        
        <main className="flex flex-col">
          <Hero entered={entered} />
          
          <motion.div
            className="w-full overflow-hidden my-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          >
            <ScrollVelocity
              texts={[
                <div className="flex items-center gap-4 px-12 md:px-24 text-white" key="1">
                  <img src={`${import.meta.env.BASE_URL}picture 3/front-end-programming.png`} alt="frontend icon" className="h-[1em] w-[1em] object-contain" />
                  <span>JESÚS MARTÍNEZ</span>
                </div>
              ]} 
              velocity={60}
              className="custom-scroll-text flex items-center"
              numCopies={8}
              damping={40}
              stiffness={350}
            />
          </motion.div>
          
          <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12 flex flex-col gap-32 pt-24 pb-14">
            <About />
            <Skills />
            <Projects />
            <Contact />
          </div>
        </main>
        
        <Footer />
        <CVModal isOpen={isCVModalOpen} onClose={() => setIsCVModalOpen(false)} />

      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
