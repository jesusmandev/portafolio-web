import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  const inputClasses = "w-full focus:outline-none transition-all duration-300";
  const inputStyles = {
    background: 'rgba(255,255,255,.02)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: '18px',
    color: 'white',
    fontSize: '17px',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setStatus('error');
      setErrorMessage('Por favor, completa todos los campos.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const submitData = new FormData();
      submitData.append("access_key", import.meta.env.VITE_WEB3FORMS_ACCESS_KEY);
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("subject", formData.subject);
      submitData.append("message", formData.message);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();
      if (result.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        
        // Reset status after a few seconds
        setTimeout(() => {
          setStatus('idle');
        }, 5000);
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Hubo un error al enviar el mensaje.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Error de conexión. Por favor, intenta de nuevo.');
    }
  };

  return (
    <section 
      id="contact" 
      className="relative w-full overflow-hidden bg-[#050505]"
      style={{
        minHeight: '100vh',
        paddingTop: '160px',
        paddingBottom: '160px',
        paddingLeft: 'clamp(16px, 5vw, 120px)',
        paddingRight: 'clamp(16px, 5vw, 120px)',
      }}
    >
      {/* Background Subtle Glows */}
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#2563eb] rounded-full blur-[200px] opacity-[0.07] pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-20 w-full" style={{ maxWidth: '1700px', margin: '0 auto' }}>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col items-center justify-center w-full"
        >
          {/* HEADER */}
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center text-center mb-[80px]">
            
            {/* Eyebrow */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[3px] bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
              <h2 className="text-[#2563eb] font-black tracking-[0.3em] text-sm md:text-base uppercase drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]">
                Contacto
              </h2>
              <div className="w-12 h-[3px] bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,0.8)] hidden sm:block"></div>
            </div>

            {/* Headline */}
            <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-[28px]">
              ¿Tienes una idea?<br/>
              <span className="text-[#2563eb] drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]">Hagámosla realidad.</span>
            </h3>

            <p 
              style={{
                maxWidth: '650px',
                color: 'rgba(255,255,255,.72)',
                fontSize: '20px',
                lineHeight: 1.8,
                margin: 0
              }}
            >
              Estoy disponible para colaborar en nuevos proyectos y convertir tus ideas en experiencias digitales modernas, rápidas y visualmente atractivas.
            </p>
          </motion.div>

          {/* LAYOUT: Single Form Column */}
          <motion.div variants={itemVariants} className="w-full lg:w-[70%] max-w-[1000px]">
            <div 
              style={{
                background: 'rgba(255,255,255,.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '30px',
                padding: 'clamp(32px, 5vw, 60px)',
                boxShadow: '0 25px 80px rgba(0,0,0,.35)',
              }}
            >
              <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Nombre */}
                  <div className="w-full flex flex-col gap-2 relative group/input">
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nombre"
                      disabled={status === 'loading'}
                      className={`${inputClasses} h-[72px] disabled:opacity-50`}
                      style={{ ...inputStyles, padding: '20px 24px' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.boxShadow = '0 0 25px rgba(37,99,235,.28)';
                        e.target.style.background = 'rgba(255,255,255,.04)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,.08)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(255,255,255,.02)';
                      }}
                    />
                  </div>
                  {/* Correo */}
                  <div className="w-full flex flex-col gap-2 relative group/input">
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Correo electrónico"
                      disabled={status === 'loading'}
                      className={`${inputClasses} h-[72px] disabled:opacity-50`}
                      style={{ ...inputStyles, padding: '20px 24px' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2563eb';
                        e.target.style.boxShadow = '0 0 25px rgba(37,99,235,.28)';
                        e.target.style.background = 'rgba(255,255,255,.04)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,.08)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(255,255,255,.02)';
                      }}
                    />
                  </div>
                </div>

                {/* Asunto */}
                <div className="w-full flex flex-col gap-2 relative group/input">
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Asunto"
                    disabled={status === 'loading'}
                    className={`${inputClasses} h-[72px] disabled:opacity-50`}
                    style={{ ...inputStyles, padding: '20px 24px' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 25px rgba(37,99,235,.28)';
                      e.target.style.background = 'rgba(255,255,255,.04)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,.08)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255,255,255,.02)';
                    }}
                  />
                </div>

                {/* Mensaje */}
                <div className="w-full flex flex-col gap-2 relative group/input">
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Mensaje"
                    disabled={status === 'loading'}
                    className={`${inputClasses} h-[200px] resize-none disabled:opacity-50`}
                    style={{ ...inputStyles, padding: '20px 24px' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 25px rgba(37,99,235,.28)';
                      e.target.style.background = 'rgba(255,255,255,.04)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,.08)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255,255,255,.02)';
                    }}
                  ></textarea>
                </div>

                <AnimatePresence mode="wait">
                  {status === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="text-[#3b82f6] text-sm font-medium px-2"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="text-[#22c55e] text-sm font-medium px-2"
                    >
                      ¡Mensaje enviado correctamente! Me pondré en contacto contigo pronto.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón */}
                <button 
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full mt-2 flex items-center justify-center gap-3 transition-all duration-350 hover:-translate-y-[3px] hover:scale-[1.02] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100 group"
                  style={{
                    height: '62px',
                    borderRadius: '18px',
                    background: status === 'success' ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '18px',
                    boxShadow: status === 'success' ? '0 0 35px rgba(34,197,94,.35)' : '0 0 35px rgba(37,99,235,.4)'
                  }}
                >
                  {status === 'loading' ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : status === 'success' ? (
                    <>
                      Enviado
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </>
                  ) : (
                    <>
                      Enviar mensaje
                      <svg className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* SOCIAL ICONS (DEBAJO DEL FORMULARIO) */}
          <motion.div variants={itemVariants} className="w-full flex justify-center mb-[60px] gap-3 sm:gap-5 flex-wrap" style={{ marginTop: '40px' }}>
            {[
              { href: "https://github.com/jesusmandev", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> },
              { href: "https://www.linkedin.com/in/jesus-manuel-martinez-serpa-088ab33a0", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg> },
              { href: "https://wa.me/573042962947", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> },
            ].map((social, i) => (
              <a 
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-white transition-all duration-350 hover:scale-110 hover:rotate-3 hover:text-[#3b82f6] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:border-[#2563eb]/40"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.03)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255,255,255,.08)'
                }}
              >
                {social.icon}
              </a>
            ))}
          </motion.div>

        </motion.div>
      </div>

      <style>{`
        #contact input::placeholder,
        #contact textarea::placeholder {
          color: rgba(255,255,255,0.45);
        }
      `}</style>
    </section>
  );
};

export default Contact;
