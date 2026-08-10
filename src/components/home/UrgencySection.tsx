import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** S7 — Urgência dupla: transição dramática preto → amarelo via scroll */
export default function UrgencySection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;
      gsap.fromTo(
        root.current,
        { backgroundColor: '#0A0A0B' },
        {
          backgroundColor: '#FACC15',
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 80%',
            end: 'top 30%',
            scrub: true,
          },
        },
      );
      gsap.from('[data-urgency-rise]', {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 60%' },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="bg-taxi-yellow py-20 text-bg-base md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="relative grid gap-10 md:grid-cols-2 md:gap-0">
          <div className="md:pr-12" data-urgency-rise>
            <p className="font-mono text-sm font-bold">31/12/2026</p>
            <h2 className="mt-3 font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              O teto de R$ 200 mil acaba.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-bg-base/80">
              A lei garante o benefício para carros até R$ 200 mil só até o fim de 2026. Depois, depende de lei
              nova — ninguém promete.
            </p>
          </div>
          {/* divisória zebrada vertical */}
          <div
            className="absolute left-1/2 top-0 hidden h-full w-2 -translate-x-1/2 md:block"
            style={{ background: 'repeating-linear-gradient(-45deg, #0A0A0B 0 10px, transparent 10px 20px)' }}
            aria-hidden="true"
          />
          <div className="md:pl-12" data-urgency-rise>
            <p className="font-mono text-sm font-bold">01/01/2027</p>
            <h2 className="mt-3 font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              A carência sobe para 3 anos.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-bg-base/80">
              Hoje você pode usar a isenção a cada 2 anos. Em 2027 vira 3. Quem usar o benefício até 2026 fica
              na regra dos 2 anos — e troca de táxi mais cedo.
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center" data-urgency-rise>
          <div className="animate-pulse-cta">
            <Link
              to="/pre-analise"
              className="group flex h-[52px] items-center gap-2 rounded-full bg-bg-base px-8 font-bold text-taxi-yellow transition-transform duration-200 hover:scale-105"
            >
              Começar minha pré-análise grátis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
