import React, { useRef, useState, useEffect, useCallback } from 'react';

/* Load Bebas Neue from Google Fonts */
const bebasNeueStyle = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`;
import {
  motion,
  useInView,
  AnimatePresence,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowUp } from 'lucide-react';

/* ─────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────── */
type Particle = { id: number; x: number; y: number; size: number; duration: number; delay: number };

function useParticles(count = 12): Particle[] {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1.5,
      duration: Math.random() * 5 + 4,
      delay: Math.random() * 4,
    }))
  );
  return particles;
}

/* ─────────────────────────────────────────────
   ANIMATED LINK (underline + x shift)
───────────────────────────────────────────── */
function AnimatedLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <motion.a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="relative inline-flex text-gray-400 text-[15px] font-medium group w-fit"
      whileHover={{ x: 5, color: '#3b82f6' }}
      transition={{ duration: 0.2 }}
    >
      {children}
      <motion.span
        className="absolute bottom-0 left-0 h-[1px] bg-[#2563eb] w-full origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ display: 'block' }}
      />
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   RIPPLE BUTTON
───────────────────────────────────────────── */
type Ripple = { id: number; x: number; y: number };

function RippleButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  };

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-bold text-[15px] no-underline"
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 50%, #2563eb 100%)',
        backgroundSize: '200% 200%',
        boxShadow: '0 0 24px rgba(37,99,235,0.35)',
      }}
      whileHover={{
        scale: 1.05,
        rotateX: 4,
        boxShadow: '0 0 45px rgba(37,99,235,0.6)',
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      {/* Shimmer sweep */}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
      />
      {children}
      {/* Ripples */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x, top: r.y, x: '-50%', y: '-50%' }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      ))}
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   SOCIAL ICON
───────────────────────────────────────────── */
function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center w-11 h-11 rounded-full text-gray-400"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      whileHover={{
        scale: 1.15,
        rotate: 5,
        color: '#3b82f6',
        boxShadow: '0 0 22px rgba(37,99,235,0.5)',
        background: 'rgba(37,99,235,0.12)',
        borderColor: 'rgba(37,99,235,0.35)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   COPYRIGHT FADE BY CHARACTER
───────────────────────────────────────────── */
function CharFade({ text, inView, baseDelay = 0 }: { text: string; inView: boolean; baseDelay?: number }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.04, delay: baseDelay + i * 0.03 }}
        >
          {char === ' ' ? '\u00a0' : char}
        </motion.span>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   STAGGER VARIANTS
───────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ─────────────────────────────────────────────
   SCROLL-TO-TOP BUTTON
───────────────────────────────────────────── */
function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollTop}
          aria-label="Volver arriba"
          className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 rounded-full text-white"
          style={{
            background: 'rgba(37,99,235,0.9)',
            boxShadow: '0 0 20px rgba(37,99,235,0.4)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{
            scale: 1.15,
            rotate: 180,
            boxShadow: '0 0 35px rgba(37,99,235,0.7)',
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 18 }}
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   MAIN FOOTER
───────────────────────────────────────────── */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, margin: '-80px 0px' });
  const particles = useParticles(14);

  /* Animated divider line */
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, margin: '-40px 0px' });

  const navLinks = [
    { id: 'home', label: 'Inicio' },
    { id: 'about', label: 'Sobre mí' },
    { id: 'skills', label: 'Habilidades' },
    { id: 'projects', label: 'Proyectos' },
    { id: 'contact', label: 'Contacto' },
  ];

  const socialLinks = [
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@jesusdev.co',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.86a8.28 8.28 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.27z" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/jesusdev.co',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/jesus-manuel-martinez-serpa-088ab33a0',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      label: 'GitHub',
      href: 'https://github.com/jesusmandev',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <ScrollTopButton />

      {/* Curved separator */}
      <div className="w-full overflow-hidden leading-none" style={{ marginBottom: '-2px' }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-[60px] block" fill="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#050505" />
        </svg>
      </div>

      <footer
        ref={footerRef}
        className="relative w-full overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #050505 0%, #040711 55%, #060b19 100%)',
        }}
      >
        {/* ── Noise texture overlay ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.025]" style={{ zIndex: 1 }}>
          <filter id="footer-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#footer-noise)" />
        </svg>

        {/* ── Radial glow center ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '0%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '380px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.11) 0%, transparent 72%)',
            zIndex: 1,
          }}
        />

        {/* ── Floating particles ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, -22, 0],
                opacity: [0.18, 0.5, 0.18],
              }}
              transition={{
                repeat: Infinity,
                duration: p.duration,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* ── Main animated entrance ── */}
        <motion.div
          initial={{ opacity: 0, y: 120, filter: 'blur(20px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* ── Animated top divider line ── */}
          <div ref={lineRef} className="relative overflow-hidden h-[1px] mx-0">
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(37,99,235,0.55) 30%, rgba(37,99,235,0.28) 70%, transparent)',
                transformOrigin: 'left',
              }}
              initial={{ scaleX: 0 }}
              animate={lineInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>

          {/* ── Content ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="w-full mx-auto"
            style={{ maxWidth: '1400px', padding: '80px clamp(24px, 6vw, 90px) 48px' }}
          >
            {/* ── Marquee JESUSDEV.CO ── */}
            <style>{bebasNeueStyle}</style>
            <div
              className="w-full overflow-hidden mb-16 select-none"
            >
              <motion.div
                style={{
                  display: 'flex',
                  whiteSpace: 'nowrap',
                }}
                animate={{ x: ['0%', '-50%'] }}
                transition={{
                  repeat: Infinity,
                  duration: 18,
                  ease: 'linear',
                }}
              >
                {/* Duplicate the text so the loop is seamless */}
                {[...Array(2)].map((_, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 'clamp(80px, 12vw, 160px)',
                      letterSpacing: '0.04em',
                      color: 'rgba(255,255,255,0.08)',
                      lineHeight: 1,
                      paddingRight: '0.6em',
                      display: 'inline-block',
                    }}
                  >
                    {Array.from({ length: 6 }).map((__, j) => (
                      <React.Fragment key={j}>
                        JESUSDEV.CO
                        <span style={{ color: 'rgba(37,99,235,0.25)', marginRight: '0.4em', marginLeft: '0.4em' }}>·</span>
                      </React.Fragment>
                    ))}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] gap-16 lg:gap-12 mb-16">

              {/* Brand */}
              <motion.div variants={itemVariants} className="flex flex-col gap-6">
                <span className="text-2xl font-black tracking-tight">
                  <span className="text-gray-400">&lt;</span>
                  <span className="text-[#2563eb]">JM</span>
                  <span className="text-gray-400">/&gt;</span>
                </span>
                <p className="text-gray-400 text-[15px] leading-relaxed max-w-[440px]">
                  Construyamos algo increíble juntos. Estoy disponible para proyectos freelance, oportunidades de trabajo y colaboraciones creativas.
                </p>
                {/* Social icons */}
                <motion.div variants={itemVariants} className="flex items-center gap-3 mt-1">
                  {socialLinks.map((s, i) => (
                    <SocialIcon key={i} href={s.href} label={s.label}>
                      {s.icon}
                    </SocialIcon>
                  ))}
                </motion.div>
              </motion.div>

              {/* Navigation */}
              <motion.div variants={itemVariants} className="flex flex-col gap-5">
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.2em]">Navegación</h4>
                <ul className="flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <li key={link.id}>
                      <AnimatedLink href={`#${link.id}`}>{link.label}</AnimatedLink>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Contact info */}
              <motion.div variants={itemVariants} className="flex flex-col gap-5">
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.2em]">Contacto</h4>
                <ul className="flex flex-col gap-4">
                  <li>
                    <AnimatedLink href="https://wa.me/573042962947" external>
                      <span className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        +57 304 296 2947
                      </span>
                    </AnimatedLink>
                  </li>
                  <li>
                    <AnimatedLink href="mailto:jesusmanuelserpa23@gmail.com">
                      <span className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        jesusmanuelserpa23@gmail.com
                      </span>
                    </AnimatedLink>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Bottom bar */}
            <motion.div
              variants={itemVariants}
              className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-gray-500 text-sm font-medium tracking-wide">
                <CharFade
                  text={`© ${currentYear} Jesús Martínez. Todos los derechos reservados.`}
                  inView={inView}
                  baseDelay={0.7}
                />
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </footer>
    </>
  );
};

export default Footer;
