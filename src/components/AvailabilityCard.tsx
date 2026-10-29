import React from 'react';

const AvailabilityCard: React.FC = () => {
  return (
    <a 
      href="https://wa.me/573014686477?text=Hola%20Jesús,%20estoy%20interesado%20en%20tus%20servicios!"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute z-40 hidden xl:flex animate-fade-up cursor-pointer"
      style={{ top: '52%', right: '4%', transform: 'translateY(-50%)' }}
    >
      <div 
        className="flex flex-col items-start gap-1.5 transition-all duration-300 hover:-translate-y-1"
        style={{
          background: 'rgba(17,17,17,0.35)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(37,99,235,0.35)',
          padding: '22px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(37,99,235,0.14)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(37,99,235,0.65)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.6), 0 0 25px rgba(37,99,235,0.28)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(37,99,235,0.14)';
        }}
      >
        <p className="text-gray-300 text-sm font-medium tracking-wide">Disponible para</p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse"></span>
          </div>
          <p className="text-white text-base font-bold whitespace-nowrap tracking-wide">Nuevos proyectos</p>
        </div>
      </div>
    </a>
  );
};

export default AvailabilityCard;
