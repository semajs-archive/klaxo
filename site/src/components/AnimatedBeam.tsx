'use client';

/**
 * Animated beam — adapted from Magic UI's `animated-beam` (21st.dev,
 * @dillionverma).
 *
 * Changed from the original in two ways that matter:
 *
 * 1. It anchors to a card's EDGE, not its centre. The original draws between
 *    the midpoints of the two elements, which means the line starts inside the
 *    first card and finishes inside the second, crossing the words on the way.
 *    `fromSide`/`toSide` pick which edge to leave from and arrive at, so the
 *    line only ever travels the gap between the two boxes.
 * 2. One rose gradient rather than the two-tone default, and a static path when
 *    the reader has asked for reduced motion.
 */
import { useEffect, useId, useState, type RefObject } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

type Side = 'left' | 'right' | 'top' | 'bottom';

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  /** Which edge of the source card the line leaves from. */
  fromSide?: Side;
  /** Which edge of the target card the line arrives at. */
  toSide?: Side;
  /** How far the line bows away from a straight run, in pixels. */
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  beamColor?: string;
  delay?: number;
  duration?: number;
}

/** The point on `side` of `rect`, in the container's coordinate space. */
function anchor(rect: DOMRect, box: DOMRect, side: Side) {
  const left = rect.left - box.left;
  const top = rect.top - box.top;
  switch (side) {
    case 'left':
      return { x: left, y: top + rect.height / 2 };
    case 'right':
      return { x: left + rect.width, y: top + rect.height / 2 };
    case 'top':
      return { x: left + rect.width / 2, y: top };
    case 'bottom':
      return { x: left + rect.width / 2, y: top + rect.height };
  }
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  fromSide = 'right',
  toSide = 'left',
  curvature = 0,
  reverse = false,
  duration = 4.5,
  delay = 0,
  pathColor = 'var(--color-line)',
  pathWidth = 1.5,
  beamColor = 'var(--color-rose)',
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
      const start = anchor(from.getBoundingClientRect(), box, fromSide);
      const end = anchor(to.getBoundingClientRect(), box, toSide);

      setSize({ width: box.width, height: box.height });

      // Bow perpendicular to the run, so a horizontal hop arcs vertically and
      // a vertical one arcs sideways.
      const horizontal = fromSide === 'left' || fromSide === 'right';
      const midX = (start.x + end.x) / 2 + (horizontal ? 0 : curvature);
      const midY = (start.y + end.y) / 2 - (horizontal ? curvature : 0);

      setPathD(`M ${start.x},${start.y} Q ${midX},${midY} ${end.x},${end.y}`);
    };

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    if (fromRef.current) observer.observe(fromRef.current);
    if (toRef.current) observer.observe(toRef.current);
    update();

    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, fromRef, toRef, fromSide, toSide, curvature]);

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
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} strokeLinecap="round" />
      {!reduceMotion && (
        <>
          <path d={pathD} strokeWidth={pathWidth} stroke={`url(#${id})`} strokeLinecap="round" />
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
