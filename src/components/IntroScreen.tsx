import React from 'react';
import { motion } from 'framer-motion';
import MagicRings from './MagicRings';
import SplitText from './SplitText';

interface IntroScreenProps {
  onEnter: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
      className="fixed inset-0 z-[10000] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <MagicRings
          color="#2563eb"
          colorTwo="#c7cae9"
          ringCount={6}
          speed={1}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={1}
          blur={0}
          noiseAmount={0.1}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={true}
          mouseInfluence={0.2}
          hoverScale={1.2}
          parallax={0.05}
          clickBurst={true}
        />
      </div>
      
      <div className="z-10 flex flex-col items-center gap-12 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center flex flex-col items-center w-full"
        >
          <SplitText
            text="Jesús Martínez"
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-lg"
            delay={50}
            duration={1.25}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            tag="h1"
            textAlign="center"
          />
          <SplitText
            text="Frontend Developer"
            className="text-[#2563eb] text-lg md:text-2xl tracking-widest font-light uppercase"
            delay={50}
            duration={1.25}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            tag="p"
            textAlign="center"
          />
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          onClick={onEnter}
          className="pointer-events-auto px-16 py-4 md:px-24 md:py-5 bg-transparent border border-white/30  hover:border-[#2563eb] text-white rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-[#2563eb]/10 group"
        >
          <span className="font-semibold text-xs tracking-[0.6em] uppercase group-hover:text-[#2563eb] transition-colors flex items-center justify-center">Explorar</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default IntroScreen;