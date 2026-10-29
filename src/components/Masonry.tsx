import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export interface MasonryItem {
  id: string | number;
  height: number;
  content: React.ReactNode;
}

const MEDIA_QUERIES = ['(min-width:1024px)', '(min-width:768px)', '(min-width:480px)'];
const MEDIA_VALUES = [4, 3, 2];

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue;
  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get);
    const mqls = queries.map(q => matchMedia(q));
    mqls.forEach(mql => mql.addEventListener('change', handler));
    return () => mqls.forEach(mql => mql.removeEventListener('change', handler));
  }, []);

  return value;
};

interface MasonryProps {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
}

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true
}) => {
  const columns = useMedia(
    MEDIA_QUERIES,
    MEDIA_VALUES,
    1
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  // Distribute items into columns (shortest-column-first)
  const columnItems = React.useMemo(() => {
    const cols: MasonryItem[][] = Array.from({ length: columns }, () => []);
    const colHeights = new Array(columns).fill(0);

    items.forEach(item => {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestCol].push(item);
      colHeights[shortestCol] += item.height;
    });

    return cols;
  }, [items, columns]);

  // Animate items on mount
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const allItems = containerRef.current.querySelectorAll('[data-masonry-key]');

    if (!hasMounted.current) {
      allItems.forEach((el, index) => {
        const startY = animateFrom === 'top' ? -100 : animateFrom === 'bottom' ? 100 : 0;
        const startX = animateFrom === 'left' ? -100 : animateFrom === 'right' ? 100 : 0;

        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: startY || 45,
            x: startX,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: duration || 0.65,
            ease: ease || 'power3.out',
            delay: index * stagger,
            clearProps: 'transform'
          }
        );
      });

      const timeout = setTimeout(() => {
        hasMounted.current = true;
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [columnItems, stagger, animateFrom, blurToFocus, duration, ease]);

  const handleMouseEnter = (id: string | number) => {
    if (scaleOnHover) {
      gsap.to(`[data-masonry-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  const handleMouseLeave = (id: string | number) => {
    if (scaleOnHover) {
      gsap.to(`[data-masonry-key="${id}"]`, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="masonry-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '24px',
        width: '100%',
      }}
    >
      {columnItems.map((col, colIndex) => (
        <div key={colIndex} className="masonry-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {col.map(item => (
            <div
              key={item.id}
              data-masonry-key={item.id}
              style={{ height: item.height, opacity: 0 }}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={() => handleMouseLeave(item.id)}
            >
              {item.content}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Masonry;
