import React, { useEffect } from 'react';
import cvEs from '../assets/curriculum/CV_JesusManuel_ES.pdf';
import cvEn from '../assets/curriculum/CV_JesusManuel_EN.pdf';

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CVModal: React.FC<CVModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown as EventListener);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown as EventListener);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-up">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      ></div>
      
      {/* Content - Estructura idéntica a la original */}
      <div className="relative z-10 glass-card min-h-[100px] md:min-h-[250px] py-24 px-12 md:py-32 md:px-24 rounded-[3rem] border border-white/10 max-w-[750px] w-[92%] flex flex-col items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.9)]">
        {/* Botón X (Cerrar) */}
        <button 
          className="absolute top-6 right-6 md:top-8 md:right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2563eb]/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        {/* Título - Agregado -mt-6 y md:-mt-10 para forzar el desplazamiento hacia arriba */}
        <h3 className="text-2xl md:text-4xl font-bold text-white text-center tracking-wide mb-14 md:mb-18"
            style={{ transform: 'translateY(-20px)' }}
        >
            Descargar Currículum
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8 w-full">
          <a 
            href={cvEs} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center transition-all duration-300 w-auto"
            style={{
              height: '58px',
              padding: '0 34px',
              borderRadius: '18px',
              fontSize: '18px',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.02)',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
            onClick={onClose}
          >
            CV en Español
          </a>
          
          <a 
            href={cvEn} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center transition-all duration-300 w-auto"
            style={{
              height: '58px',
              padding: '0 34px',
              borderRadius: '18px',
              fontSize: '18px',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.02)',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
            onClick={onClose}
          >
            CV en Inglés
          </a>
        </div>
      </div>
    </div>
  );
};

export default CVModal;