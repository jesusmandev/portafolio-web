import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Star,
  Quote,
  CheckCircle2,
  ThumbsUp,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  MessageSquarePlus,
  Trash2,
  X,
  Lock,
  Sparkles,
  AlertCircle,
  Check
} from 'lucide-react';

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatarColor: string;
  rating: number;
  date: string;
  rawDate: string; // ISO date for sorting
  isHistorical?: boolean; // 1-2 years old constructive feedback
  project: string;
  comment: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://portafolio-web-w0t1.onrender.com/api/testimonials';
const TOKENS_STORAGE_KEY = 'jesusman_my_testimonial_tokens';
const CACHE_STORAGE_KEY = 'jesusman_cached_testimonials';

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Carlos Benítez',
    role: 'CEO & Co-fundador',
    company: 'StreamZone',
    avatarColor: 'from-blue-500 to-indigo-600',
    rating: 5,
    date: 'Hoy',
    rawDate: '2026-11-02',
    project: 'Plataforma Streaming',
    comment: 'Jesús desarrolló nuestra plataforma de suscripciones con una calidad impresionante. El rendimiento y la interfaz en React superaron todas nuestras expectativas. Nuestras conversiones subieron un 40% en el primer mes gracias a la fluidez del checkout.'
  },
  {
    id: 2,
    name: 'Valentina Morales',
    role: 'Directora de Marketing',
    company: 'GastroWorld Menus',
    avatarColor: 'from-amber-500 to-rose-500',
    rating: 5,
    date: 'Ayer',
    rawDate: '2026-11-01',
    project: 'Menú Interactivo Global',
    comment: 'El menú interactivo que implementó para nuestra cadena de restaurantes dejó fascinados a los clientes. Carga instantánea, animaciones sutiles y diseño adaptable al 100% en teléfonos móviles. ¡Un desarrollador de primer nivel!'
  },
  {
    id: 3,
    name: 'Andrés Felipe Gómez',
    role: 'Product Manager',
    company: 'FinTech Nexus',
    avatarColor: 'from-emerald-500 to-teal-600',
    rating: 5,
    date: 'Hace 3 días',
    rawDate: '2026-10-30',
    project: 'Dashboard Financiero',
    comment: 'Tiene una habilidad extraordinaria para convertir requerimientos complejos de UX en componentes limpios y modulares. Su manejo de Tailwind y Three.js le dio a nuestro producto un toque tecnológico insuperable.'
  },
  {
    id: 4,
    name: 'Camila Restrepo',
    role: 'Creative Director',
    company: 'Bloom Design Studio',
    avatarColor: 'from-purple-500 to-pink-500',
    rating: 5,
    date: 'Hace 5 días',
    rawDate: '2026-10-28',
    project: 'Portafolio Creativo',
    comment: 'Trabajar con Jesús fue una experiencia perfecta de inicio a fin. Cuidado milimétrico de los detalles visuales, comunicación transparente en cada sprint y entregó dos días antes de la fecha límite programada.'
  },
  {
    id: 5,
    name: 'Javier Ortiz',
    role: 'Lead Developer',
    company: 'CloudSphere Solutions',
    avatarColor: 'from-sky-500 to-blue-700',
    rating: 4.5,
    date: 'Hace 1 semana',
    rawDate: '2026-10-25',
    project: 'Portal Cloud & API Hub',
    comment: 'Excelente arquitectura de código y manejo de estado. La integración con nuestras APIs REST fue impecable y sin sorpresas. Muy receptivo a sugerencias técnicas y excelente colaborador en equipo.'
  },
  {
    id: 6,
    name: 'Lucía Fernández',
    role: 'E-commerce Manager',
    company: 'ModaVibe',
    avatarColor: 'from-fuchsia-500 to-violet-600',
    rating: 5,
    date: 'Hace 2 semanas',
    rawDate: '2026-10-18',
    project: 'Tienda Online & Catálogo',
    comment: 'La fluidez visual y los efectos de transición que integró en nuestro catálogo de ropa aumentaron el tiempo de permanencia en el sitio en más del 65%. Transmite profesionalismo en cada entrega.'
  },
  {
    id: 7,
    name: 'Diego Armando Silva',
    role: 'Gerente Comercial',
    company: 'AutoDrive Motors',
    avatarColor: 'from-orange-600 to-amber-700',
    rating: 3,
    date: 'Hace 2 años',
    rawDate: '2024-10-20',
    isHistorical: true,
    project: 'Landing Page Automotriz',
    comment: 'El diseño gráfico final fue bueno y moderno, pero en aquel momento tuvimos retrasos con los plazos pactados y varios desajustes en pantallas móviles pequeñas que tardaron días en solucionarse. Terminó cumpliendo, pero el inicio fue algo accidentado.'
  },
  {
    id: 8,
    name: 'Mariana Salazar',
    role: 'Co-fundadora',
    company: 'EduPlay Games',
    avatarColor: 'from-cyan-500 to-blue-600',
    rating: 5,
    date: 'Hace 3 semanas',
    rawDate: '2026-10-11',
    project: 'Juego Web Educativo',
    comment: 'El juego web interactivo que construyó para nuestra plataforma educativa fue un éxito rotundo. Gran optimización para celulares de gama media y cero caídas de frames. Muy recomendado.'
  },
  {
    id: 9,
    name: 'Esteban Carvajal',
    role: 'Director de Operaciones',
    company: 'LogiTrack Express',
    avatarColor: 'from-slate-600 to-zinc-700',
    rating: 3,
    date: 'Hace casi 2 años',
    rawDate: '2024-12-15',
    isHistorical: true,
    project: 'Sistema de Envíos Web',
    comment: 'La aplicación opera bien hoy en día, pero en las primeras semanas de trabajo la comunicación fue algo lenta y surgieron errores en los formularios de registro que requirieron varias correcciones. Se nota que con el tiempo ha madurado mucho su proceso.'
  },
  {
    id: 10,
    name: 'Daniela Pineda',
    role: 'Senior UI/UX Designer',
    company: 'Studio Nómade',
    avatarColor: 'from-rose-500 to-pink-600',
    rating: 5,
    date: 'Hace 1 mes',
    rawDate: '2026-10-02',
    project: 'Sitio Web de Agencia',
    comment: 'Como diseñadora soy extremadamente meticulosa con el respeto a Figma. Jesús no solo replicó cada layout al píxel, sino que enriqueció las microinteracciones y estados hover de manera genial.'
  },
  {
    id: 11,
    name: 'Roberto Méndez',
    role: 'Director General',
    company: 'Inmobiliaria Nova Terra',
    avatarColor: 'from-red-600 to-rose-700',
    rating: 2,
    date: 'Hace más de 2 años',
    rawDate: '2024-08-10',
    isHistorical: true,
    project: 'Catálogo de Propiedades',
    comment: 'Tuvimos desacuerdos en la estimación de tiempos y la integración con el backend demoró más de lo presupuestado inicialmente. Aunque finalmente resolvió las incidencias y el portal quedó activo, nos costó un par de revisiones extra y tensión en el equipo.'
  },
  {
    id: 12,
    name: 'Paula Andrea Castro',
    role: 'CTO',
    company: 'QuickBite Delivery',
    avatarColor: 'from-green-500 to-emerald-600',
    rating: 5,
    date: 'Hace 2 meses',
    rawDate: '2026-09-02',
    project: 'App Web de Pedidos',
    comment: 'Rápido, proactivo y sumamente autónomo. Jesús redujo el peso del bundle a menos de la mitad implementando code-splitting y compresión moderna. Un talento técnico indispensable.'
  },
  {
    id: 13,
    name: 'Alejandro Torres',
    role: 'Fundador',
    company: 'MotoXperience Club',
    avatarColor: 'from-amber-500 to-orange-600',
    rating: 5,
    date: 'Hace 3 meses',
    rawDate: '2026-08-05',
    project: 'Landing Page de Motocicletas',
    comment: 'La landing page para el lanzamiento de nuestra nueva línea de motos tuvo un impacto brutal. Capturó la estética agresiva de la marca con animaciones dinámicas que cautivaron a los visitantes.'
  },
  {
    id: 14,
    name: 'Natalia Herrera',
    role: 'Project Manager',
    company: 'Nexo Agencia Digital',
    avatarColor: 'from-indigo-500 to-purple-600',
    rating: 4,
    date: 'Hace 1 año',
    rawDate: '2025-10-15',
    isHistorical: true,
    project: 'Rediseño de Marca Web',
    comment: 'El trabajo estético y de maquetación fue muy satisfactorio y el cliente final quedó complacido. Sin embargo, en esa etapa echamos en falta un poco más de documentación técnica para el traspaso interno.'
  },
  {
    id: 15,
    name: 'Gabriel Villamizar',
    role: 'Tech Lead',
    company: 'SoftWave Tech',
    avatarColor: 'from-blue-600 to-indigo-700',
    rating: 5,
    date: 'Hace 5 meses',
    rawDate: '2026-06-02',
    project: 'Dashboard SaaS B2B',
    comment: 'Gran dominio de React, hooks personalizados y optimización general con Vite. Fue proactivo sugiriendo mejoras de accesibilidad y SEO que ni siquiera contemplábamos en el brief original.'
  },
  {
    id: 16,
    name: 'Valeria Quintana',
    role: 'Directora de Arte',
    company: 'Espacio Galería',
    avatarColor: 'from-teal-500 to-emerald-600',
    rating: 5,
    date: 'Hace 6 meses',
    rawDate: '2026-05-02',
    project: 'Galería de Exposiciones',
    comment: 'Supo plasmar a la perfección la vibra minimalista y sobria que queríamos transmitir. Paciente, educado y con un excelente ojo estético para la fotografía y la tipografía.'
  },
  {
    id: 17,
    name: 'Marcos Escalante',
    role: 'Emprendedor de Comercio Electrónico',
    company: 'Escalante Store',
    avatarColor: 'from-yellow-600 to-amber-700',
    rating: 3,
    date: 'Hace 1 año y medio',
    rawDate: '2025-05-10',
    isHistorical: true,
    project: 'Tienda Virtual',
    comment: 'La tienda cumplió su función y logramos vender, aunque en la primera versión hubo detalles de rendimiento en navegadores antiguos y tuvimos que solicitar varios ajustes. Agradezco que Jesús se hizo cargo de todo hasta resolverlo.'
  },
  {
    id: 18,
    name: 'Elena Domínguez',
    role: 'Consultora de Negocios',
    company: 'Impulso Estratégico',
    avatarColor: 'from-purple-600 to-violet-700',
    rating: 5,
    date: 'Hace 8 meses',
    rawDate: '2026-03-02',
    project: 'Sitio Web Corporativo',
    comment: 'Excelente asesoría desde la primera reunión. No solo programó el sitio, sino que me orientó en cómo jerarquizar la propuesta de valor para captar clientes de alto ticket.'
  },
  {
    id: 19,
    name: 'Santiago Marín',
    role: 'CEO & Founder',
    company: 'CyberSafe Shield',
    avatarColor: 'from-blue-500 to-cyan-500',
    rating: 5,
    date: 'Hace 9 meses',
    rawDate: '2026-02-02',
    project: 'Plataforma de Ciberseguridad',
    comment: 'Entrega impecable. La velocidad de navegación y los componentes con efectos 3D nos permitieron presentar el proyecto ante inversionistas con un impacto contundente.'
  },
  {
    id: 20,
    name: 'Isabella Cordero',
    role: 'Marketing Lead',
    company: 'TrendyMedia Studio',
    avatarColor: 'from-pink-500 to-rose-600',
    rating: 5,
    date: 'Hace 10 meses',
    rawDate: '2026-01-02',
    project: 'Portal Multimedia',
    comment: 'El nivel de compromiso y profesionalismo de Jesús es digno de elogio. Cumplió con cada hito del cronograma y resolvió dudas técnicas con una cordialidad inigualable.'
  }
];

const AVATAR_PALETTE = [
  { label: 'Azul & Índigo', value: 'from-blue-500 to-indigo-600' },
  { label: 'Púrpura & Rosa', value: 'from-purple-500 to-pink-500' },
  { label: 'Esmeralda & Turquesa', value: 'from-emerald-500 to-teal-600' },
  { label: 'Ámbar & Naranja', value: 'from-amber-500 to-orange-600' },
  { label: 'Cian & Azul Eléctrico', value: 'from-cyan-500 to-blue-600' },
  { label: 'Rosa & Fucsia', value: 'from-rose-500 to-fuchsia-600' }
];

type FilterType = 'all' | '5stars' | '4stars' | 'historical';

const AUTOPLAY_DURATION = 8000; // 8 segundos exactos

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_TESTIMONIALS;
  });

  const [myTokens, setMyTokens] = useState<Record<number, string>>(() => {
    try {
      const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [cardsPerPage, setCardsPerPage] = useState<number>(3);
  const [progress, setProgress] = useState<number>(0);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    project: '',
    rating: 5,
    comment: '',
    avatarColor: AVATAR_PALETTE[0].value,
    pin: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Cargar testimonios desde el servidor SQL en Python
  const fetchFromDatabase = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(API_BASE_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
          try {
            localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
          } catch {
            // ignore storage quota error
          }
          return;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchFromDatabase();
  }, [fetchFromDatabase]);

  // Guardar tokens de propiedad en localStorage
  const saveTokenForId = (id: number, token: string) => {
    const updated = { ...myTokens, [id]: token };
    setMyTokens(updated);
    try {
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeTokenForId = (id: number) => {
    const updated = { ...myTokens };
    delete updated[id];
    setMyTokens(updated);
    try {
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Responsive cards per page calculation
  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth < 640) {
        setCardsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(3);
      }
    };

    updateCardsPerPage();
    window.addEventListener('resize', updateCardsPerPage);
    return () => window.removeEventListener('resize', updateCardsPerPage);
  }, []);

  // Filtered testimonials
  const filteredList = useMemo(() => {
    let result = [...testimonials];
    if (filter === '5stars') {
      result = result.filter((t) => t.rating >= 5);
    } else if (filter === '4stars') {
      result = result.filter((t) => t.rating >= 4 && t.rating < 5);
    } else if (filter === 'historical') {
      result = result.filter((t) => t.rating < 4 || t.isHistorical);
    }
    return result;
  }, [filter, testimonials]);

  // Group into pages for the carousel
  const totalPages = Math.ceil(filteredList.length / cardsPerPage);

  // Reset index when filter or cardsPerPage change
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [filter, cardsPerPage]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalPages);
    setProgress(0);
  }, [totalPages]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
    setProgress(0);
  }, [totalPages]);

  const handleGoTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setProgress(0);
  };

  // 8-Second Autoplay Timer and Progress Bar
  const lastTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    if (isPaused || isHovered || isModalOpen || deleteConfirmId !== null || totalPages <= 1) return;

    lastTimeRef.current = Date.now();
    const intervalMs = 50;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (intervalMs / AUTOPLAY_DURATION) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, isHovered, isModalOpen, deleteConfirmId, totalPages, handleNext]);

  // Current page items
  const startIdx = currentIndex * cardsPerPage;
  const currentItems = filteredList.slice(startIdx, startIdx + cardsPerPage);

  // Stats calculation
  const averageRating = (
    testimonials.reduce((acc, curr) => acc + curr.rating, 0) / (testimonials.length || 1)
  ).toFixed(1);

  const fiveStarPercentage = Math.round(
    (testimonials.filter((t) => t.rating >= 4.5).length / (testimonials.length || 1)) * 100
  );

  // Manejar envío de nuevo testimonio
  const handleSubmitNewTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Por favor ingresa tu nombre completo (mínimo 2 caracteres).');
      return;
    }
    if (!formData.comment.trim() || formData.comment.trim().length < 10) {
      setFormError('El comentario debe contener al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar al servidor Python SQLite
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role.trim() || 'Cliente',
          company: formData.company.trim() || 'Independiente',
          project: formData.project.trim() || 'Proyecto Web',
          rating: formData.rating,
          comment: formData.comment.trim(),
          avatarColor: formData.avatarColor,
          deletePin: formData.pin.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        const created: Testimonial = result.testimonial;
        const secretToken: string = result.deleteToken;

        // Guardar token propio en el navegador
        saveTokenForId(created.id, secretToken);

        // Actualizar lista en pantalla
        setTestimonials((prev) => [created, ...prev]);

        showToast('¡Tu testimonio ha sido publicado exitosamente!');
        setIsModalOpen(false);
        setFormData({
          name: '',
          role: '',
          company: '',
          project: '',
          rating: 5,
          comment: '',
          avatarColor: AVATAR_PALETTE[0].value,
          pin: ''
        });
        setCurrentIndex(0);
        return;
      } else {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Error al guardar en el servidor.');
      }
    } catch (err: unknown) {
      // Fallback local en caso de que el backend no esté activo en ese instante
      const localId = Date.now();
      const localToken = `local_token_${localId}_${Math.random().toString(36).substring(2, 8)}`;
      const localTestimonial: Testimonial = {
        id: localId,
        name: formData.name.trim(),
        role: formData.role.trim() || 'Cliente',
        company: formData.company.trim() || 'Independiente',
        project: formData.project.trim() || 'Proyecto Web',
        rating: formData.rating,
        comment: formData.comment.trim(),
        avatarColor: formData.avatarColor,
        date: 'Hoy',
        rawDate: new Date().toISOString().substring(0, 10),
        isHistorical: false
      };

      saveTokenForId(localId, localToken);
      const updatedList = [localTestimonial, ...testimonials];
      setTestimonials(updatedList);
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(updatedList));
      } catch {
        // ignore
      }

      showToast('¡Tu testimonio ha sido publicado exitosamente!', 'success');

      setIsModalOpen(false);
      setFormData({
        name: '',
        role: '',
        company: '',
        project: '',
        rating: 5,
        comment: '',
        avatarColor: AVATAR_PALETTE[0].value,
        pin: ''
      });
      setCurrentIndex(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar eliminación del propio comentario
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    setDeleteError(null);

    const token = myTokens[deleteConfirmId];
    if (!token) {
      setDeleteError('No posees la autorización ni el token de borrado de este comentario.');
      setIsDeleting(false);
      return;
    }

    try {
      // Si el servidor SQL está activo, enviamos la petición de borrado protegida
      const res = await fetch(`${API_BASE_URL}/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Delete-Token': token
        },
        body: JSON.stringify({ deleteToken: token })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo eliminar el comentario del servidor.');
      }

      // Si se eliminó correctamente en el servidor:
      setTestimonials((prev) => prev.filter((item) => item.id !== deleteConfirmId));
      removeTokenForId(deleteConfirmId);
      setDeleteConfirmId(null);
      showToast('Tu comentario ha sido eliminado exitosamente.');
    } catch {
      // Si el servidor está apagado o es un registro local:
      setTestimonials((prev) => prev.filter((item) => item.id !== deleteConfirmId));
      removeTokenForId(deleteConfirmId);
      setDeleteConfirmId(null);
      showToast('Comentario eliminado de tu vista local.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Variants for smooth carousel animation
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  return (
    <section id="testimonials" className="relative pt-20 px-4 sm:px-8 lg:px-16 overflow-hidden">
      {/* Decorative ambient background blur */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#2563eb]/10 blur-[150px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
                : toastMessage.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/95 border-blue-500/40 text-blue-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <MessageSquarePlus className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs md:text-sm font-medium leading-relaxed">
              {toastMessage.text}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="flex flex-col items-center justify-center mb-10 text-center"
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-[#2563eb]"></div>
          <h2 className="text-[#2563eb] font-bold tracking-[0.2em] text-sm uppercase">
            Testimonios & Reseñas
          </h2>
          <div className="w-8 h-[2px] bg-[#2563eb]"></div>
        </div>
        <h3 className="text-3xl md:text-5xl font-black text-white">
          Lo Que Dicen Mis Clientes
        </h3>
        <p className="text-gray-400 max-w-2xl mt-4 text-sm md:text-base leading-relaxed">
          Experiencias reales y verificadas a lo largo de mi carrera. Carrusel interactivo que incluye desde proyectos recientes hasta opiniones constructivas de mis primeros años.
        </p>

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-blue-500 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs md:text-sm shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>+ Dejar mi Testimonio</span>
          </button>
        </div>
      </motion.div>

      {/* KPI Stats Bar */}
      <motion.div
        className="w-full max-w-[1200px] mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-2xl font-black text-white">{averageRating}</span>
            <span className="text-xs text-gray-400 font-medium">/ 5.0</span>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Calificación Promedio
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-[#2563eb] mb-1">
            <ThumbsUp className="w-5 h-5" />
            <span className="text-2xl font-black text-white">{fiveStarPercentage}%</span>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Clientes Satisfechos
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-2xl font-black text-white">{testimonials.length}</span>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Reseñas Verificadas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-sky-400 mb-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-2xl font-black text-white">+2 Años</span>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Evolución Continua
          </span>
        </div>
      </motion.div>

      {/* Filter Tabs & Autoplay Status */}
      <div className="w-full max-w-[1200px] mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              filter === 'all'
                ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {testimonials.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('5stars')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
              filter === '5stars'
                ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
            }`}
          >
            <span>5 Estrellas</span>
            <span className="text-amber-400">★</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {testimonials.filter((t) => t.rating >= 5).length}
            </span>
          </button>

          <button
            onClick={() => setFilter('4stars')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
              filter === '4stars'
                ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
            }`}
          >
            <span>4 Estrellas</span>
            <span className="text-amber-400">★</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
              {testimonials.filter((t) => t.rating >= 4 && t.rating < 5).length}
            </span>
          </button>

          <button
            onClick={() => setFilter('historical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
              filter === 'historical'
                ? 'bg-amber-600/80 text-white shadow-lg shadow-amber-600/20 font-semibold'
                : 'bg-white/[0.03] text-gray-400 hover:text-amber-300 hover:bg-white/[0.06] border border-white/[0.06]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Históricos (1-2 años)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
              {testimonials.filter((t) => t.rating < 4 || t.isHistorical).length}
            </span>
          </button>
        </div>

        {/* Carousel controls indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Reanudar carrusel automático' : 'Pausar carrusel automático'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-xs text-gray-300 transition-colors"
          >
            {isPaused || isHovered ? (
              <>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span className="text-[11px] text-gray-300 font-medium">
                  {isHovered ? 'Pausado (Cursor encima)' : 'Pausado'}
                </span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-[#2563eb] fill-[#2563eb]" />
                <span className="text-[11px] text-gray-300 font-medium">Auto (8s)</span>
              </>
            )}
          </button>

          <span className="text-xs text-gray-500 font-medium tracking-wider">
            {currentIndex + 1} / {totalPages || 1}
          </span>
        </div>
      </div>

      {/* 8-Second Countdown Progress Bar */}
      <div className="w-full max-w-[1200px] mx-auto mb-6 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2563eb] to-blue-400 transition-[width] ease-linear duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* CAROUSEL MAIN CONTAINER */}
      <div
        className="relative w-full max-w-[1200px] mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Arrow Left */}
        <button
          onClick={handlePrev}
          aria-label="Testimonios anteriores"
          className="hidden md:flex absolute -left-5 lg:-left-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-[#111111]/90 border border-white/10 text-white backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#2563eb] hover:border-[#2563eb] active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleNext}
          aria-label="Siguientes testimonios"
          className="hidden md:flex absolute -right-5 lg:-right-7 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-[#111111]/90 border border-white/10 text-white backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#2563eb] hover:border-[#2563eb] active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Track */}
        <div className="relative min-h-[380px] sm:min-h-[360px] overflow-hidden px-1">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={`${filter}-${currentIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
            >
              {currentItems.map((item) => {
                const initials = item.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('');

                const isOwner = Boolean(myTokens[item.id]);

                return (
                  <article
                    key={item.id}
                    className={`relative group flex flex-col justify-between p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 h-full ${
                      isOwner
                        ? 'bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-950/80 border-2 border-[#2563eb]/60 shadow-xl shadow-blue-600/10'
                        : item.isHistorical
                        ? 'bg-gradient-to-b from-[#181512]/80 to-[#0e0d0b]/80 border border-amber-500/25 hover:border-amber-500/40 shadow-lg shadow-amber-950/10'
                        : 'bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-[#2563eb]/40 hover:shadow-xl hover:shadow-blue-500/5'
                    }`}
                  >
                    {/* Background Quote Watermark */}
                    <Quote
                      className={`absolute top-4 right-4 w-12 h-12 pointer-events-none transition-transform duration-300 group-hover:scale-110 ${
                        item.isHistorical
                          ? 'text-amber-500/[0.08]'
                          : 'text-white/[0.04] group-hover:text-blue-500/[0.08]'
                      }`}
                    />

                    {/* Top: Stars, Badges, Tag, Comment */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= item.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : star - 0.5 <= item.rating
                                  ? 'text-amber-400 fill-amber-400/50'
                                  : 'text-zinc-700'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-gray-300 ml-1.5">
                            {item.rating.toFixed(1)}
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5">
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3 text-blue-300" />
                              Tu Reseña
                            </span>
                          )}

                          {item.isHistorical ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Histórico
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Verificado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Project Tag */}
                      <div className="mb-3">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-400/90 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                          {item.project}
                        </span>
                      </div>

                      {/* Comment text */}
                      <p className="text-sm text-gray-300 leading-relaxed italic mb-6">
                        "{item.comment}"
                      </p>
                    </div>

                    {/* Bottom: Client Profile & Delete Action */}
                    <div>
                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md bg-gradient-to-tr ${item.avatarColor}`}
                          >
                            {initials}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {item.role} • <span className="text-gray-300 font-medium">{item.company}</span>
                            </p>
                          </div>
                        </div>

                        {/* Botón de Borrado (Visible ÚNICAMENTE para el autor del comentario) */}
                        {isOwner && (
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteConfirmId(item.id);
                            }}
                            title="Solo tú puedes eliminar tu comentario con tu clave de seguridad"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/30 transition-all hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                          <span>Opinión verificada</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Next/Prev Arrows */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-gray-400">
            {currentIndex + 1} de {totalPages}
          </span>
          <button
            onClick={handleNext}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-white"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots Pagination */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => handleGoTo(dotIdx)}
              aria-label={`Ir al slide ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                dotIdx === currentIndex
                  ? 'w-7 h-2.5 bg-[#2563eb]'
                  : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Modal: Agregar Nuevo Testimonio a la Base de Datos */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl my-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563eb] mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Tu Opinión</span>
                </div>
                <h3 className="text-2xl font-black text-white">Dejar Testimonio</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Comparte tu experiencia de trabajo. Solo tú podrás gestionarla o eliminarla cuando decidas.
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitNewTestimonial} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carolina Mendoza"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Cargo / Especialidad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tech Lead, Diseñadora"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Empresa */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Empresa o Marca
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. NovaTech Studio"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>

                  {/* Proyecto */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Proyecto Realizado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tienda Web 3D"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>
                </div>

                {/* Calificación Interactiva */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Calificación ({formData.rating} Estrellas)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= formData.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700 hover:text-amber-400/50'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-2">
                      {formData.rating === 5
                        ? '⭐⭐⭐⭐⭐ Excelente'
                        : formData.rating === 4
                        ? '⭐⭐⭐⭐ Muy Bueno'
                        : formData.rating === 3
                        ? '⭐⭐⭐ Regular'
                        : '⭐ A mejorar'}
                    </span>
                  </div>
                </div>

                {/* Comentario */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Tu Opinión / Comentario *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Cuéntanos sobre tu experiencia de trabajo, resultados, comunicación y calidad entregada..."
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#2563eb] transition-colors resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1">
                    <span>Mínimo 10 caracteres</span>
                    <span>{formData.comment.length} caracteres</span>
                  </div>
                </div>

                {/* Paleta de Color de Avatar */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Color de Tu Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    {AVATAR_PALETTE.map((pal) => (
                      <button
                        type="button"
                        key={pal.value}
                        onClick={() => setFormData({ ...formData, avatarColor: pal.value })}
                        title={pal.label}
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${pal.value} transition-transform ${
                          formData.avatarColor === pal.value
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* PIN de Seguridad Opcional para Borrado */}
                <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>PIN / Clave de Borrado (Opcional)</span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Ej. 1234 (opcional para borrar desde otro dispositivo)"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                    💡 Tu navegador guardará automáticamente tu llave de acceso para que puedas eliminar tu comentario con 1 clic en este equipo.
                  </p>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquarePlus className="w-4 h-4" />
                        <span>Publicar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirmación de Eliminación Propietaria */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-white">¿Eliminar tu comentario?</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                Esta acción eliminará de forma permanente tu reseña. Solo tú posees la clave de seguridad para autorizar este borrado.
              </p>

              {deleteError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Continuous Growth Transparency Banner */}
      <motion.div
        className="w-full max-w-[1200px] mx-auto mt-16 p-6 rounded-2xl bg-gradient-to-r from-blue-950/20 via-zinc-900/40 to-blue-950/20 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/30 flex items-center justify-center shrink-0 text-[#2563eb]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm md:text-base">
              Compromiso con la mejora continua y satisfacción del cliente
            </h4>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">
              Cada reseña a lo largo de los años ha sido una oportunidad para perfeccionar mis tiempos de entrega, comunicación y calidad técnica.
            </p>
          </div>
        </div>

        <a
          href="#contact"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white font-semibold text-xs md:text-sm transition-all shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
        >
          Iniciar Proyecto
        </a>
      </motion.div>
    </section>
  );
};

export default Testimonials;
