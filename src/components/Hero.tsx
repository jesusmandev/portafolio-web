import React, { useEffect, useRef } from 'react';
import SocialBar from './SocialBar';
import AvailabilityCard from './AvailabilityCard';
import StarBorder from './StarBorder';
import Hero3DText from './Hero3DText';
import Computer3D from '../COMPUTER3D/Computer3D';
import GradientWaves from './GradientWaves';

interface HeroProps {
  entered?: boolean;
}

const Hero: React.FC<HeroProps> = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;

    const updateOnScroll = () => {
      rafId = 0;
      const section = sectionRef.current;
      const bg = bgRef.current;
      const content = contentRef.current;
      if (!section || !bg || !content) return;

      const scrollY = window.scrollY;
      const sectionHeight = section.offsetHeight || window.innerHeight;
      if (scrollY > sectionHeight * 1.2) return;

      // Progress: 0 at top of section, 1 when scrolled one full section height
      const progress = Math.min(scrollY / sectionHeight, 1);

      // Hardware-accelerated transform & opacity (sin filter:blur en WebGL para mantener 60fps estables)
      const scale = 1 + progress * 0.16;
      const bgOpacity = Math.max(1 - progress * 0.9, 0.1);
      bg.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
      bg.style.opacity = `${bgOpacity}`;

      // All content (text + cards + social): fade out and slide up
      const contentOpacity = Math.max(1 - progress * 2.2, 0);
      const contentY = progress * -60;
      content.style.opacity = `${contentOpacity}`;
      content.style.transform = `translate3d(0, ${contentY}px, 0)`;
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateOnScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative w-full overflow-hidden flex flex-col justify-center"
      style={{
        minHeight: '100vh',
        paddingTop: '90px',
        paddingBottom: '70px',
        paddingLeft: 'clamp(20px, 7vw, 120px)',
        paddingRight: 'clamp(20px, 7vw, 120px)',
      }}
    >
      {/* Background GradientWaves WebGL2 Shader */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 will-change-transform bg-black"
        style={{ transformOrigin: 'center center' }}
      >
        <GradientWaves
          horizonColor="#1d4ed8"
          waveColor="#000000"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          relief={1}
          lightAngle={120}
          mouseInteraction
          swellOnClick
          lightMode={false}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={64}
          zoom={1}
          height={5.5}
          fogDepth={15}
          sheen={0}
          brightness={1}
          opacity={1}
          grain={0.15}
          quality="low"
          dpr={1}
          intro
          parallaxStrength={0.5}
          mouseStrength={0.6}
          paused={false}
        />
      </div>

      {/* All content fades out on scroll */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-20 will-change-transform"
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', position: 'relative' }}>
          {/* Full-section 3D Physics Canvas so letters fall all the way to the bottom of Hero */}
          <Hero3DText anchorRef={titleAnchorRef} />

          {/* Main Container */}
          <div
            className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 relative z-20 pointer-events-none"
            style={{
              height: '100%',
              maxWidth: '1760px',
              margin: '0 auto',
              paddingTop: '90px',
              paddingBottom: '70px',
              paddingLeft: 'clamp(20px, 5.5vw, 95px)',
              paddingRight: 'clamp(16px, 3vw, 48px)',
            }}
          >
            {/* Left Column — Shifted slightly more to the left */}
            <div className="w-full lg:w-[46%] flex flex-col justify-center animate-fade-up lg:-ml-4">
              {/* Anchor box where "DESARROLLADOR FRONTEND" floats in 3D */}
              <div
                ref={titleAnchorRef}
                className="w-full h-[145px] sm:h-[210px] lg:h-[320px]"
              />

              {/* Buttons */}
              <div
                className="pointer-events-auto w-fit relative z-40"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <StarBorder
                  as="a"
                  href="#projects"
                  color="#3b82f6"
                  speed="5s"
                  innerBg="bg-[#2563eb] hover:bg-[#1d4ed8] px-10 sm:px-12"
                  className="transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.02] flex items-center justify-center no-underline"
                  style={{
                    height: '64px',
                    minWidth: '220px',
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: 700,
                    boxShadow: '0 0 30px rgba(37,99,235,.40)',
                  }}
                >
                  Ver proyectos
                </StarBorder>

                <StarBorder
                  as="a"
                  href="#contact"
                  color="white"
                  speed="5s"
                  innerBg="bg-gradient-to-b from-black to-gray-900 border border-gray-800 px-10 sm:px-12"
                  className="transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.02] flex items-center justify-center no-underline"
                  style={{
                    height: '64px',
                    minWidth: '220px',
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: 700,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  Contactarme
                </StarBorder>
              </div>
            </div>

            {/* Right Column — 3D Computer Setup */}
            <div className="w-full lg:w-[58%] flex items-center justify-center pointer-events-auto relative overflow-visible">
              <Computer3D />
            </div>
          </div>

          {/* Floating cards — positioned absolutely, fade with the rest */}
          <AvailabilityCard />
          <SocialBar />
        </div>
      </div>
    </section>
  );
};

export default Hero;
