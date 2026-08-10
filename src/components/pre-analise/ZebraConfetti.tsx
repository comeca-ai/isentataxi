import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

/** Pseudo-aleatório determinístico (puro) a partir do índice */
function rand(seed: number, salt: number): number {
  const x = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Confete zebrado sutil — ≤40 retângulos amarelo/preto caindo por 1.2s (só resultado positivo). */
function ZebraConfettiInner() {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: rand(i, 1) * 100,
        delay: rand(i, 2) * 0.4,
        width: 6 + rand(i, 3) * 8,
        height: 10 + rand(i, 4) * 12,
        yellow: i % 2 === 0,
        rotate: (rand(i, 5) - 0.5) * 260,
        drift: (rand(i, 6) - 0.5) * 120,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-24px] block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            background: p.yellow ? '#FACC15' : '#27272A',
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: p.drift, opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 1.2, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

export const ZebraConfetti = memo(ZebraConfettiInner);
