import React from 'react';

const SocialBar: React.FC = () => {
  return (
    <div 
      className="absolute top-[74%] -translate-y-1/2 left-0 z-40 hidden xl:flex flex-col animate-fade-right"
    >
      <div 
        className="relative flex flex-col items-center justify-between py-8 w-16 h-[290px]"
        style={{
          background: 'rgba(12, 12, 12, 0.90)',
          backdropFilter: 'blur(16px)',
          borderTopRightRadius: '36px',
          borderBottomRightRadius: '36px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          perspective: '700px',
        }}
      >
        <style>{`
          .social-curve::before {
            content: '';
            position: absolute;
            top: -36px;
            left: 0;
            width: 36px;
            height: 36px;
            background: transparent;
            border-bottom-left-radius: 36px;
            box-shadow: -12px 12px 0 12px rgba(12, 12, 12, 0.90);
          }
          .social-curve::after {
            content: '';
            position: absolute;
            bottom: -36px;
            left: 0;
            width: 36px;
            height: 36px;
            background: transparent;
            border-top-left-radius: 36px;
            box-shadow: -12px -12px 0 12px rgba(12, 12, 12, 0.90);
          }

          .social-icon-3d {
            position: relative;
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform-style: preserve-3d;
            transition:
              transform 0.38s cubic-bezier(0.22, 1, 0.36, 1),
              background 0.35s ease,
              box-shadow 0.38s cubic-bezier(0.22, 1, 0.36, 1),
              color 0.3s ease;
            will-change: transform, box-shadow;
          }

          .social-icon-3d::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 14px;
            background: linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
            border: 1px solid rgba(255,255,255,0.12);
            opacity: 0;
            transform: translateZ(-4px);
            transition: opacity 0.35s ease, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
          }

          .social-icon-3d svg {
            transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), filter 0.38s ease;
            transform: translateZ(0px);
          }

          .social-icon-3d:hover {
            transform: translate3d(10px, -6px, 26px) rotateX(14deg) rotateY(-18deg) scale(1.16);
            background: rgba(255, 255, 255, 0.07);
            box-shadow:
              -8px 12px 20px rgba(0, 0, 0, 0.75),
              -3px 4px 0px rgba(37, 99, 235, 0.45),
              0 0 18px rgba(37, 99, 235, 0.3);
          }

          .social-icon-3d:hover::before {
            opacity: 1;
            transform: translateZ(-2px);
          }

          .social-icon-3d:hover svg {
            transform: translateZ(14px) scale(1.08);
            filter: drop-shadow(-4px 6px 6px rgba(0, 0, 0, 0.65));
          }
        `}</style>
        <div className="social-curve absolute inset-0 -z-10" />

        {/* Blue Dash */}
        <div className="w-6 h-[3.5px] bg-[#2563eb] rounded-full shadow-[0_0_12px_rgba(37,99,235,0.95)] mt-1" />

        {/* Iconos sociales grandes con elevación 3D */}
        <div className="flex flex-col items-center gap-4" style={{ transformStyle: 'preserve-3d' }}>
          {/* GitHub */}
          <a 
            href="https://github.com/jesusmandev" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="social-icon-3d text-gray-300 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
          </a>

          {/* LinkedIn */}
          <a 
            href="https://www.linkedin.com/in/jesus-manuel-martinez-serpa-088ab33a0?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="social-icon-3d text-[#5885A8] hover:text-[#7fb3dc]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
          </a>

          {/* Email */}
          <a 
            href="mailto:jesusmanuelserpa23@gmail.com" 
            aria-label="Email"
            className="social-icon-3d text-gray-300 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 4.25l-7.07 4.42c-.32.2-.74.2-1.06 0L4.4 8.25a.85.85 0 11.9-1.44L12 11l6.7-4.19a.85.85 0 11.9 1.44z"></path></svg>
          </a>
        </div>

        <div className="h-1" />
      </div>
    </div>
  );
};

export default SocialBar;