import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Reveal, { RevealItem } from '@/components/Reveal';

const TESTIMONIALS = [
  {
    quote:
      'Achei que era golpe. Era lei. Economizei R$ 26 mil no Virtus e o pessoal cuidou de tudo no SISEN e no SIVEI.',
    name: 'Seu Ronaldo, 54',
    meta: 'taxista SP · táxi há 22 anos · comprou Virtus',
    saved: 'economizou R$ 26.500',
    avatar: '/avatar-1.jpg',
  },
  {
    quote:
      'Tirei o alvará em março e comprei em junho. Me disseram que eu precisava esperar — a decisão do STJ mudou tudo.',
    name: 'Dona Cleusa, 41',
    meta: 'taxista SP · comprou HB20S',
    saved: 'economizou R$ 24.000',
    avatar: '/avatar-2.jpg',
  },
  {
    quote:
      'Fiz tudo pelo celular, mandei os documentos e fui acompanhando etapa por etapa. Em 5 meses estava com o Corolla na garagem.',
    name: 'Seu Antônio, 61',
    meta: 'taxista SP · comprou Corolla',
    saved: 'economizou R$ 40.000',
    avatar: '/avatar-3.jpg',
  },
];

function TiltCard({ t, i }: { t: (typeof TESTIMONIALS)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onMouseLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        className="flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-surface p-6 transition-colors duration-200 hover:border-taxi-yellow/40"
      >
        <motion.span
          className="font-display text-[3rem] leading-none text-taxi-yellow"
          style={{ transform: 'translateZ(30px)' }}
          aria-hidden="true"
        >
          “
        </motion.span>
        <p className="mt-2 flex-1 leading-relaxed text-text-primary">{t.quote}</p>
        <div className="mt-6 flex items-center gap-3">
          <img
            src={t.avatar}
            alt={`Foto de ${t.name}`}
            loading="lazy"
            className="h-12 w-12 rounded-full border border-border-strong object-cover"
          />
          <div>
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-text-faint">{t.meta}</p>
          </div>
        </div>
        <span className="mt-4 w-fit rounded-full bg-money-green/10 px-3 py-1 font-mono text-xs font-bold text-money-green">
          {t.saved}
        </span>
      </motion.div>
    </motion.div>
  );
}

/** S9 — Depoimentos */
export default function TestimonialsSection() {
  return (
    <section className="asphalt-texture relative bg-bg-surface py-20 md:py-28">
      <div className="absolute inset-0 bg-bg-surface/[0.94]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <RevealItem>
            <h2 className="font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              Quem já comprou assim
            </h2>
          </RevealItem>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <TiltCard key={t.name} t={t} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
