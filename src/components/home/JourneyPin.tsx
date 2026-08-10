import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Building2, CarFront, CreditCard, KeyRound, Landmark, Receipt, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STAGES = [
  { n: 1, icon: UserPlus, title: 'Cadastro + pré-análise', desc: 'Quiz grátis de 2 minutos diz se você pode.', chip: 'GRÁTIS', chipCls: 'zebra-fine text-taxi-yellow' },
  { n: 2, icon: CreditCard, title: 'Pagamento + documentos', desc: 'R$ 299 único, só quando decidir executar. Upload guiado.', chip: 'R$ 299', chipCls: 'bg-taxi-yellow/10 text-taxi-yellow' },
  { n: 3, icon: Building2, title: 'DTP / SP156', desc: 'Prefeitura de SP. Roda em paralelo com o Detran.', chip: '∥ PARALELO', chipCls: 'bg-info-blue/10 text-info-blue' },
  { n: 4, icon: CarFront, title: 'Detran-SP', desc: 'Consulta de restrições. Paralelo ao DTP.', chip: '∥ PARALELO', chipCls: 'bg-info-blue/10 text-info-blue' },
  { n: 5, icon: Landmark, title: 'SISEN — Receita Federal (IPI)', desc: 'O desconto federal. Só começa depois do DTP.', chip: 'DEPENDE DA 3', chipCls: 'bg-warn-amber/10 text-warn-amber' },
  { n: 6, icon: Receipt, title: 'SIVEI — Sefaz-SP (ICMS)', desc: '12% do Estado. Só depois do IPI deferido.', chip: 'DEPENDE DA 5', chipCls: 'bg-warn-amber/10 text-warn-amber' },
  { n: 7, icon: KeyRound, title: 'Concessionária + pós-compra', desc: 'Retire o carro e comprove em 60 dias.', chip: '60 DIAS', chipCls: 'bg-money-green/10 text-money-green' },
];

function StageCard({ stage, active }: { stage: (typeof STAGES)[number]; active: boolean }) {
  return (
    <div
      className={cn(
        'relative flex h-[360px] w-[280px] shrink-0 snap-center flex-col rounded-2xl border bg-bg-surface p-6 transition-all duration-300',
        active ? 'scale-[1.04] border-taxi-yellow' : 'border-border-subtle opacity-55',
      )}
    >
      <span className="pointer-events-none absolute right-4 top-3 select-none font-mono text-7xl font-bold text-text-primary/5" aria-hidden="true">
        {stage.n}
      </span>
      <stage.icon className="h-8 w-8 text-taxi-yellow" aria-hidden="true" />
      <h3 className="mt-4 font-display text-[1.1rem] uppercase leading-tight">{stage.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{stage.desc}</p>
      <span className={cn('mt-auto w-fit rounded-full px-3 py-1 font-mono text-[0.65rem] font-bold', stage.chipCls)}>
        {stage.chip}
      </span>
      <Link
        to={`/guia#etapa-${stage.n}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={`Etapa ${stage.n}: ${stage.title} — saiba mais no Guia`}
        title="Saiba mais no Guia"
      />
    </div>
  );
}

/** S5 — Jornada das 7 etapas (pinada no desktop, carrossel snap no mobile) */
export default function JourneyPin() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const roadFill = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(-1);
  const [mobileActive, setMobileActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );
  const shown = Math.max(0, active);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!;
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth + 64);
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=250%',
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (roadFill.current) {
                roadFill.current.style.clipPath = `inset(0 ${(1 - self.progress) * 100}% 0 0)`;
              }
              const idx = Math.min(6, Math.round(self.progress * 6));
              setActive((prev) => (prev === idx ? prev : idx));
            },
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // dots do carrossel mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      if (window.innerWidth >= 768) return;
      const cardW = 280 + 24;
      setMobileActive(Math.min(6, Math.round(el.scrollLeft / cardW)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mq.removeEventListener('change', onChange);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-bg-base py-20 md:py-0">
      <div className="flex min-h-0 flex-col justify-center md:h-[100dvh]">
        {/* Progresso fixo no topo */}
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              A corrida, etapa por etapa
            </h2>
            <span className="hidden font-mono text-sm text-taxi-yellow md:block">
              Etapa {shown + 1} / 7
            </span>
          </div>
          <div className="relative mt-4 hidden h-1 overflow-hidden rounded-full bg-border-subtle md:block" aria-hidden="true">
            <div
              className="zebra-animated h-full rounded-full transition-[width] duration-300"
              style={{ width: `${((shown + 1) / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Trilha */}
        <div className="relative mt-10 md:mt-16">
          <svg
            className="pointer-events-none absolute left-0 top-1/2 hidden h-24 w-full -translate-y-1/2 md:block"
            viewBox="0 0 1200 96"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 48 H1200" fill="none" stroke="#3F3F46" strokeWidth="2" strokeDasharray="12 12" />
            <path
              ref={roadFill}
              d="M0 48 H1200"
              fill="none"
              stroke="#FACC15"
              strokeWidth="3"
              strokeDasharray="12 12"
              style={{ clipPath: 'inset(0 100% 0 0)' }}
            />
          </svg>
          <div
            ref={track}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 md:snap-none md:overflow-visible md:px-8 md:pb-0 md:pl-[max(2rem,calc((100vw-1280px)/2+2rem))]"
          >
            {STAGES.map((stage, i) => (
              <StageCard key={stage.n} stage={stage} active={i === (isDesktop ? shown : mobileActive)} />
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-2 md:hidden" aria-hidden="true">
            {STAGES.map((s, i) => (
              <span
                key={s.n}
                className={cn('h-1.5 rounded-full transition-all', i === mobileActive ? 'w-6 bg-taxi-yellow' : 'w-1.5 bg-border-strong')}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
