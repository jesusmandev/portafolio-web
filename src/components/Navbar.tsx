import React, { useState, useEffect } from 'react';
import PillNav from './PillNav';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onDownloadCV: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onDownloadCV }) => {
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const sections = ['home', 'about', 'skills', 'projects', 'contact'];

    const checkActiveSection = () => {
      rafId = 0;
      let current = '';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            current = section;
            break;
          }
        }
      }

      if (current) {
        setActiveSection((prev) => (prev !== current ? current : prev));
      }
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(checkActiveSection);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const navLinks = [
    { id: 'home', label: 'Inicio' },
    { id: 'about', label: 'Sobre mí' },
    { id: 'skills', label: 'Habilidades' },
    { id: 'projects', label: 'Proyectos' },
    { id: 'contact', label: 'Contacto' },
  ];

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 pointer-events-none"
        style={{
          height: '84px',
          background: 'transparent',
          paddingLeft: 'clamp(16px, 6vw, 90px)',
          paddingRight: 'clamp(16px, 6vw, 90px)'
        }}
      >
      {/* Logo */}
      <a
        href="#home"
        className="flex items-center justify-center gap-3 cursor-pointer flex-shrink-0 pointer-events-auto px-5 h-[46px] rounded-full transition-transform duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)',
          backdropFilter: 'blur(24px) saturate(190%) brightness(1.12)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%) brightness(1.12)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 1.5px 1px rgba(255,255,255,0.5), 0 16px 36px -10px rgba(0,0,0,0.65)'
        }}
      >
        <span className="text-xl font-black tracking-tight">
          <span className="text-gray-300">&lt;</span>
          <span className="text-[#2563eb]">JM</span>
          <span className="text-gray-300">/&gt;</span>
        </span>
      </a>

      {/* Middle Controls (PillNav Liquid Glass) */}
      <div className="hidden md:flex flex-1 justify-center pointer-events-auto">
        <PillNav
          items={[
            { label: 'Inicio', href: '#home' },
            { label: 'Sobre mí', href: '#about' },
            { label: 'Habilidades', href: '#skills' },
            { label: 'Proyectos', href: '#projects' },
            { label: 'Contacto', href: '#contact' },
          ]}
          activeHref={`#${activeSection || 'home'}`}
          onItemClick={(item, _index, event) => {
            event.preventDefault();
            const id = item.href?.replace('#', '') || 'home';
            setActiveSection(id);
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, '', `#${id}`);
          }}
          itemStyle="plain"
          hoverEffect="glide"
          indicator="pill"
          layout="split"
          surface="glass"
          size="md"
          bounce={0.45}
          stretch={0.65}
          collapse="never"
          intro
        />
      </div>      {/* Right Controls */}
      <div className="flex items-center flex-shrink-0 gap-4 pointer-events-auto">
        {/* Download CV Button - Ajustado a w-[190px] horizontalmente */}
<button 
  onClick={onDownloadCV}
  /* Solo cambia w-[210px] por w-[190px] para recortar los laterales */
  className="hidden md:flex items-center justify-center gap-2.5 w-[190px] h-12 rounded-full text-[14px] font-bold text-white transition-all duration-300 hover:scale-102 group whitespace-nowrap flex-shrink-0"
  style={{
    background: 'rgba(5, 8, 16, 0.70)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(37, 99, 235, 0.5)', 
    boxShadow: '0 0 15px rgba(37, 99, 235, 0.18)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 0 25px rgba(37, 99, 235, 0.45)';
    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.85)';
    e.currentTarget.style.background = 'rgba(8, 14, 28, 0.85)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 0 15px rgba(37, 99, 235, 0.18)';
    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)';
    e.currentTarget.style.background = 'rgba(5, 8, 16, 0.70)';
  }}
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="text-gray-200 group-hover:text-white transition-colors flex-shrink-0"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
  <span className="flex-shrink-0">Descargar CV</span>
</button>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </nav>

    {/* Mobile Menu Overlay */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#040711]/98 backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col gap-8 text-center">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', `#${link.id}`);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-3xl font-black tracking-wide ${
                    activeSection === link.id ? 'text-[#2563eb]' : 'text-gray-300'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button 
                onClick={() => {
                  onDownloadCV();
                  setIsMobileMenuOpen(false);
                }}
                className="mt-6 flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-bold text-white transition-all hover:scale-105"
                style={{
                  background: 'rgba(37, 99, 235, 0.18)',
                  border: '1px solid rgba(37, 99, 235, 0.5)', 
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Descargar CV
              </button>
            </li>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>

    </>
  );
};

export default Navbar;