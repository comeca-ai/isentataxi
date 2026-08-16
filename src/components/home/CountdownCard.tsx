import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TARGET = new Date('2026-12-31T23:59:59-03:00').getTime();

function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, TARGET - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-12 w-14 overflow-hidden rounded-lg bg-bg-elevated md:h-14 md:w-16">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold text-taxi-yellow md:text-3xl"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-text-faint">{label}</span>
    </div>
  );
}

/** Card countdown: fim do teto de R$ 200 mil em 31/12/2026 23:59 (-03:00) */
export default function CountdownCard() {
  const { days, hours, minutes, seconds } = useCountdown();
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border-subtle bg-bg-surface/80 p-5 backdrop-blur-md"
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text-muted">
        Fim do teto de R$ 200 mil em
      </p>
      <div className="mt-3 flex items-start gap-2">
        <FlipDigit value={days} label="dias" />
        <span className="pt-2.5 font-mono text-xl text-text-faint">:</span>
        <FlipDigit value={hours} label="horas" />
        <span className="pt-2.5 font-mono text-xl text-text-faint">:</span>
        <FlipDigit value={minutes} label="min" />
        <span className="pt-2.5 font-mono text-xl text-text-faint">:</span>
        <FlipDigit value={seconds} label="seg" />
      </div>
      <p className="mt-3 text-[0.75rem] text-text-faint">Depois disso, ninguém garante.</p>
    </motion.div>
  );
}
