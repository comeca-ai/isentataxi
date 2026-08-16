import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Lock, MapPin, ShieldCheck, UserCheck } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import CountdownCard from '@/components/home/CountdownCard';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHIPS = [
  { icon: ShieldCheck, label: 'Sem senha Gov.br', tip: 'Nunca pedimos senha, código MFA ou sessão do Gov.br.' },
  { icon: UserCheck, label: 'Humano no processo', tip: 'Gente de verdade acompanha cada etapa com você.' },
  { icon: MapPin, label: 'Só SP capital', tip: 'Benefício estadual de SP + alvará da Prefeitura de SP.' },
  { icon: Lock, label: 'LGPD', tip: 'Seus documentos tratados conforme a lei de dados.' },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        gsap.set('[data-hero-word], [data-hero-char], [data-hero-rise]', { clearProps: 'all', opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ delay: 0.3 });
      tl.from('[data-hero-word]', {
        yPercent: 110,
        rotate: 4,
        duration: 1,
        stagger: 0.04,
        ease: 'expo.out',
      })
        .from(
          '[data-hero-char]',
          { yPercent: 110, duration: 1, stagger: 0.03, ease: 'expo.out' },
          '<0.1',
        )
        .to('[data-hero-char]', { color: '#FACC15', duration: 0.4, stagger: 0.02 }, '-=0.5')
        .from('[data-hero-rise]', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, '-=0.6');

      gsap.to('[data-hero-bg]', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[92vh] flex-col overflow-hidden">
      {/* Fundo com parallax */}
      <div className="absolute inset-0" data-hero-bg>
        <img
          src="/hero-taxi.jpg"
          alt="Táxi amarelo 0 km na Avenida Paulista à noite"
          className="h-[115%] w-full object-cover"
          fetchPriority="high"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-bg-base/80 via-bg-base/60 to-bg-base" aria-hidden="true" />
      <div className="hero-glow absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-20 md:px-8">
        <div className="max-w-3xl">
          <div data-hero-rise>
            <Eyebrow>Para taxistas de São Paulo — Capital</Eyebrow>
          </div>

          <h1 className="mt-6 font-display text-[2.6rem] uppercase leading-[0.95] tracking-[-0.01em] text-text-primary md:text-[5rem]">
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                Seu&nbsp;
              </span>
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                táxi&nbsp;
              </span>
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                0&nbsp;km&nbsp;
              </span>
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                com&nbsp;
              </span>
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                até&nbsp;
              </span>
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom" aria-label="R$ 45 mil">
              {'R$ 45 MIL'.split('').map((ch, i) => (
                <span key={i} className="inline-block" data-hero-char aria-hidden="true">
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                &nbsp;de&nbsp;
              </span>
            </span>
            <span className="inline-block overflow-hidden pb-1 align-bottom">
              <span className="inline-block" data-hero-word>
                desconto
              </span>
            </span>
          </h1>

          <p data-hero-rise className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
            Isenção de IPI + ICMS para taxista com alvará de SP. A gente cuida de DTP, Detran, Receita (SISEN)
            e Sefaz (SIVEI) — você só escolhe o carro.
          </p>

          <div data-hero-rise className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/simulador"
              className="group relative flex h-[52px] items-center justify-center gap-2 rounded-full bg-taxi-yellow px-7 font-bold text-bg-base transition-all duration-200 hover:scale-[1.03] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
            >
              Simular minha economia — grátis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              <span className="zebra-fine absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-bold text-taxi-yellow ring-1 ring-taxi-yellow/40">
                GRÁTIS
              </span>
            </Link>
            <Link
              to="/pre-analise"
              className="flex h-[52px] items-center justify-center rounded-full border border-border-strong px-7 font-medium text-text-primary transition-colors duration-200 hover:bg-taxi-yellow/10"
            >
              Fazer pré-análise em 2 min
            </Link>
          </div>

          <div data-hero-rise className="mt-8 flex flex-wrap gap-2.5">
            {CHIPS.map((chip) => (
              <span
                key={chip.label}
                title={chip.tip}
                className="flex cursor-help items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface/70 px-3 py-1.5 text-xs font-medium text-text-muted backdrop-blur-sm transition-colors hover:border-taxi-yellow/40 hover:text-text-primary"
              >
                <chip.icon className="h-3.5 w-3.5 text-taxi-yellow" aria-hidden="true" />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 self-start md:absolute md:bottom-10 md:right-8 md:mt-0">
          <CountdownCard />
        </div>
      </div>
    </section>
  );
}
