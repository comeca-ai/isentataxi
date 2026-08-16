import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Link } from 'react-router';
import { Check, Info } from 'lucide-react';
import Reveal, { RevealItem } from '@/components/Reveal';

const FREE_ITEMS = ['Simulador completo', 'Pré-análise de elegibilidade', 'Guia e tira-dúvidas no WhatsApp'];
const PAID_ITEMS = [
  'Protocolos DTP + SP156',
  'Detran-SP',
  'SISEN (IPI)',
  'SIVEI (ICMS)',
  'Revisão de documentos',
  'Acompanhamento até a nota fiscal',
];
const INCLUDED_STAGES = [
  'Etapa 3 — DTP / SP156 (Prefeitura de SP)',
  'Etapa 4 — Detran-SP (consulta de restrições)',
  'Etapa 5 — SISEN / Receita Federal (IPI)',
  'Etapa 6 — SIVEI / Sefaz-SP (ICMS)',
];

function PriceCounter() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, 299, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView]);
  return <span ref={ref}>0</span>;
}

/** S8 — Quanto custa / modelo de cobrança */
export default function PricingSection() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  return (
    <section className="bg-bg-base py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <Reveal>
          <RevealItem>
            <h2 className="text-center font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              Grátis para descobrir. R$ 299 só se você for comprar.
            </h2>
          </RevealItem>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Card 1 — Descobrir (destacado) */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border border-taxi-yellow bg-bg-surface p-6"
          >
            <motion.span
              initial={{ rotate: -12, opacity: 0 }}
              whileInView={{ rotate: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="zebra-fine absolute -top-3 right-5 rounded-full px-3 py-1 text-[0.65rem] font-bold text-taxi-yellow ring-1 ring-taxi-yellow/40"
            >
              GRÁTIS
            </motion.span>
            <h3 className="font-display text-xl uppercase">Descobrir</h3>
            <p className="mt-5 font-mono text-[2.2rem] font-bold leading-none text-money-green md:text-[3rem]">R$ 0</p>
            <ul className="mt-6 space-y-3">
              {FREE_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-text-muted">
                  <Check className="h-4 w-4 shrink-0 text-money-green" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/simulador"
              className="mt-7 flex h-[52px] items-center justify-center rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:scale-[1.03] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
            >
              Começar grátis
            </Link>
          </motion.div>

          {/* Card 2 — Executar */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border border-border-subtle bg-bg-surface p-6"
            onMouseEnter={() => setPopoverOpen(true)}
            onMouseLeave={() => setPopoverOpen(false)}
          >
            <h3 className="flex items-center gap-2 font-display text-xl uppercase">
              Executar
              <button
                className="relative text-text-faint transition-colors hover:text-taxi-yellow"
                aria-label="O que está incluso em cada órgão"
                aria-expanded={popoverOpen}
                onFocus={() => setPopoverOpen(true)}
                onBlur={() => setPopoverOpen(false)}
              >
                <Info className="h-4 w-4" />
              </button>
            </h3>
            {popoverOpen && (
              <div className="absolute left-6 right-6 top-14 z-10 rounded-xl border border-border-subtle bg-bg-elevated p-4 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Incluso em cada órgão
                </p>
                <ul className="mt-2 space-y-1.5">
                  {INCLUDED_STAGES.map((s) => (
                    <li key={s} className="text-xs text-text-muted">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-2 text-xs text-text-faint">Só quando você decidir comprar</p>
            <p className="mt-3 font-mono text-[2.2rem] font-bold leading-none text-taxi-yellow md:text-[3rem]">
              R$ <PriceCounter />
            </p>
            <p className="mt-1 text-xs text-text-muted">investimento único · em até 12x no cartão</p>
            <ul className="mt-6 space-y-3">
              {PAID_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-text-muted">
                  <Check className="h-4 w-4 shrink-0 text-taxi-yellow" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/pre-analise"
              className="mt-7 flex h-[52px] items-center justify-center rounded-full border border-border-strong font-medium text-text-primary transition-colors duration-200 hover:bg-taxi-yellow/10"
            >
              Fazer pré-análise primeiro
            </Link>
          </motion.div>
        </div>

        <p className="mt-8 text-center text-[0.8125rem] leading-relaxed text-text-faint">
          A aprovação é sempre do órgão público. Se a pré-análise disser que você não é elegível, você não paga
          nada — nem perde tempo.
        </p>
      </div>
    </section>
  );
}
