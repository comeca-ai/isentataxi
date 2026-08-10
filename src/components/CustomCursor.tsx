import { memo, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Cursor customizado (páginas públicas, desktop): ponto amarelo 10px + anel 36px
 * que expande em elementos clicáveis (mix-blend-mode: difference).
 */
const CustomCursor = memo(function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 24, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 24, mass: 0.6 });
  const scale = useMotionValue(1);
  const ringScale = useSpring(scale, { stiffness: 300, damping: 22 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      const clickable = !!target?.closest('a, button, [role="button"], input, [data-cursor]');
      scale.set(clickable ? 1.9 : 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [x, y, scale]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden lg:block" aria-hidden="true">
      <motion.div
        className="absolute h-2.5 w-2.5 rounded-full bg-taxi-yellow"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="absolute h-9 w-9 rounded-full border border-taxi-yellow/70 mix-blend-difference"
        style={{ x: ringX, y: ringY, scale: ringScale, translateX: '-50%', translateY: '-50%' }}
      />
    </div>
  );
});

export default CustomCursor;
