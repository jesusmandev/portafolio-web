import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

export interface AccordionGalleryItem {
  image: string;
  label: string;
  link?: string;
  alt?: string;
  category?: string;
  categoryColor?: string;
  description?: string;
  codeLink?: string;
  webLink?: string;
}

export interface AccordionGalleryProps {
  items?: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: 'horizontal' | 'vertical';
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: 'hover' | 'click';
  showLabels?: boolean;
  grayscale?: boolean;
  className?: string;
}

const DEFAULT_ITEMS: AccordionGalleryItem[] = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' },
];

const AccordionGallery: React.FC<AccordionGalleryProps> = ({
  items = DEFAULT_ITEMS,
  defaultIndex = 2,
  accentColor = '#ffffff',
  overlayColor = '#060010',
  textColor = '#ffffff',
  height = 460,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.6,
  ease = 'power3.out',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);

  const vertical = orientation === 'vertical';
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const overlayBg = `linear-gradient(180deg, transparent 30%, color-mix(in srgb, ${overlayColor} 88%, transparent) 100%), color-mix(in srgb, ${overlayColor} calc(var(--ag-dim, 0.35) * 100%), transparent)`;

  const applyLayout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = mediaSizeRef.current;

      tlRef.current?.kill();
      const dur = animate && !prefersReduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const bar = barRefs.current[i];
        const text = textRefs.current[i];

        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

        tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * parallax * mediaSize * 0.06;
          const gray = grayscale ? (isActive ? 0 : 1) : 0;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.35,
              duration: dur,
              ease,
            } as gsap.TweenVars,
            0
          );
        }

        if (showLabels && bar && text) {
          if (isActive) {
            tl.to(
              [bar, text],
              { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger },
              0
            );
          } else {
            tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
          }
        }
      });

      tlRef.current = tl;
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      vertical,
      tilt,
      parallax,
      grayscale,
      showLabels,
      stagger,
      prefersReduced,
    ]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
      mediaSizeRef.current = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio, vertical]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  const handleEnter = (i: number) => {
    if (trigger === 'hover') setActive(i);
  };

  const handleClick = (i: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (i !== active) {
      e.preventDefault();
      setActive(i);
    } else if (items[i]?.link && items[i].link !== '#') {
      window.open(items[i].link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i + 1) % count);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i - 1 + count) % count);
    } else if (e.key === 'Enter' && i === active && items[i]?.link && items[i].link !== '#') {
      window.open(items[i].link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={rootRef}
      className={`flex ${vertical ? 'flex-col' : 'flex-row'} w-full max-w-full [perspective:1400px] max-[640px]:!flex-col max-[640px]:[perspective:none] ${className}`}
      style={{
        gap: `${gap}px`,
        height: vertical ? `${Math.round(height * 1.6)}px` : `${height}px`,
      }}
      role="list"
      aria-label="Image accordion gallery"
    >
      {items.map((item, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            className="group relative block min-w-0 min-h-0 flex-[1_1_0] cursor-pointer overflow-hidden bg-[#0a0713] no-underline outline-none [transform-style:preserve-3d] [transform-origin:center] [box-shadow:0_10px_30px_-18px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[#2563eb]/50 focus-visible:[box-shadow:0_0_0_2px_var(--ag-accent),0_10px_30px_-18px_rgba(0,0,0,0.8)] max-[640px]:min-h-[72px] max-[640px]:!transform-none transition-colors duration-300"
            style={
              {
                borderRadius: `${radius}px`,
                '--ag-accent': accentColor,
                willChange: 'flex-grow, transform',
              } as React.CSSProperties
            }
            onClick={(e) => handleClick(i, e)}
            onMouseEnter={() => handleEnter(i)}
            onFocus={() => setActive(i)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            role="listitem"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label}
          >
            <span className="absolute inset-0 overflow-hidden [border-radius:inherit]">
              <span
                ref={(el) => {
                  mediaRefs.current[i] = el;
                }}
                className="absolute top-1/2 left-1/2 [filter:grayscale(var(--ag-gray,1))]"
                style={{
                  width: vertical ? '100%' : 'var(--ag-media-size, 320px)',
                  height: vertical ? 'var(--ag-media-size, 320px)' : '100%',
                  willChange: 'transform, filter',
                }}
              >
                <img
                  src={item.image}
                  alt={item.alt || item.label || ''}
                  draggable="false"
                  loading="lazy"
                  className="block h-full w-full select-none object-cover [-webkit-user-drag:none]"
                />
              </span>
              <span
                className="pointer-events-none absolute inset-0"
                style={{ background: overlayBg }}
                aria-hidden="true"
              />
            </span>
            {showLabels && (
              <div
                className={`absolute bottom-5 left-5 right-5 z-[2] flex items-end justify-between gap-4 ${
                  isActive ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    ref={(el) => {
                      barRefs.current[i] = el;
                    }}
                    className="mt-1 h-[42px] w-[4px] flex-none rounded-[3px] opacity-0"
                    style={{
                      background: accentColor,
                      boxShadow: `0 0 14px color-mix(in srgb, ${accentColor} 70%, transparent)`,
                    }}
                  />
                  <div
                    ref={(el) => {
                      textRefs.current[i] = el;
                    }}
                    className="flex flex-col gap-1.5 min-w-0 opacity-0"
                  >
                    {item.category && (
                      <span
                        className="w-fit px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                        style={{
                          backgroundColor: item.categoryColor || '#2563eb',
                          color: '#000',
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                    <span
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.05rem,1.5vw,1.45rem)] font-bold tracking-[0.01em] [text-shadow:0_2px_14px_rgba(0,0,0,0.75)]"
                      style={{ color: textColor }}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 max-w-[460px] [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]">
                        {item.description}
                      </p>
                    )}
                    {(item.codeLink || item.webLink) && (
                      <div className="flex items-center gap-2.5 mt-2">
                        {item.codeLink && (
                          <a
                            href={item.codeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/10 hover:bg-[#2563eb] border border-white/20 hover:border-[#3b82f6] backdrop-blur-md transition-all duration-200 no-underline"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="16 18 22 12 16 6" />
                              <polyline points="8 6 2 12 8 18" />
                            </svg>
                            Código
                          </a>
                        )}
                        {item.webLink && (
                          <a
                            href={item.webLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-[#2563eb]/90 hover:bg-[#1d4ed8] border border-[#3b82f6]/50 shadow-[0_0_15px_rgba(37,99,235,0.45)] backdrop-blur-md transition-all duration-200 no-underline"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            Ver Web
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AccordionGallery;

