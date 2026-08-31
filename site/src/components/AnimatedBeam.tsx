'use client';

/**
 * Animated beam — adapted from Magic UI's `animated-beam` (21st.dev,
 * @dillionverma). Changes from the original: a single-colour rose gradient
 * instead of the two-tone default, and it respects prefers-reduced-motion by
 * falling back to a static path.
 */
import { useEffect, useId, useState, type RefObject } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  beamColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 4.5,
  delay = 0,
  pathColor = 'rgba(25,28,43,0.18)',
  pathWidth = 1.5,
  pathOpacity = 1,
  beamColor = '#a9375c',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [pathD, setPathD] = useState('');
  const [size, setSize] = useState({ width: 0, height: 0 });

  const coords = reverse
    ? { x1: ['90%', '-10%'], x2: ['100%', '0%'] }
    : { x1: ['10%', '110%'], x2: ['0%', '100%'] };

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const from = fromRef.current;
      const to = toRef.current;
      if (!container || !from || !to) return;

      const box = container.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();

      setSize({ width: box.width, height: box.height });

      const startX = a.left - box.left + a.width / 2 + startXOffset;
      const startY = a.top - box.top + a.height / 2 + startYOffset;
      const endX = b.left - box.left + b.width / 2 + endXOffset;
      const endY = b.top - box.top + b.height / 2 + endYOffset;

      const controlY = startY - curvature;
      setPathD(`M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`);
    };

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    update();

    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  return (
    <svg
      fill="none"
      width={size.width}
      height={size.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none absolute left-0 top-0 transform-gpu', className)}
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      {!reduceMotion && (
        <>
          <path
            d={pathD}
            strokeWidth={pathWidth}
            stroke={`url(#${id})`}
            strokeOpacity="1"
            strokeLinecap="round"
          />
          <defs>
            <motion.linearGradient
              className="transform-gpu"
              id={id}
              gradientUnits="userSpaceOnUse"
              initial={{ x1: '0%', x2: '0%', y1: '0%', y2: '0%' }}
              animate={{ x1: coords.x1, x2: coords.x2, y1: ['0%', '0%'], y2: ['0%', '0%'] }}
              transition={{
                delay,
                duration,
                ease: [0.16, 1, 0.3, 1],
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
            >
              <stop stopColor={beamColor} stopOpacity="0" />
              <stop stopColor={beamColor} />
              <stop offset="45%" stopColor={beamColor} />
              <stop offset="100%" stopColor={beamColor} stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </>
      )}
    </svg>
  );
}
