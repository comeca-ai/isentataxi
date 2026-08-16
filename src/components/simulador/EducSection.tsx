import { ArrowRight, CalendarClock, Fuel, Leaf } from 'lucide-react';
import { Link } from 'react-router';
import { TETO_DEADLINE_ISO, TETO_PRECO } from '@contracts/constants';
import Reveal, { RevealItem } from '@/components/Reveal';
import { fmtBRL } from './catalog';

function daysLeft() {
  return Math.max(0, Math.ceil((new Date(TETO_DEADLINE_ISO).getTime() - Date.now()) / 86_400_000));
}

const CARDS = [
  {
    icon: Leaf,
    title: 'Por que híbrido desconta menos?',
    body: 'IPI de híbrido e elétrico já é menor de fábrica (6,5% e 3%). O desconto maior continua sendo o ICMS de 12% — e esse vale para todos.',
  },
  {
    icon: CalendarClock,
    title: `Teto de R$ ${fmtBRL(TETO_PRECO)} até 31/12/2026`,
    body: 'O Corolla Hybrid encosta no teto. Passou do prazo, a regra pode mudar — quem protocola antes garante as alíquotas atuais.',
    countdown: true,
  },
  {
    icon: Fuel,
    title: 'Diesel quase nunca entra',
    body: 'A regra exclui diesel (salvo exceções raras). Flex, híbrido e elétrico passam sem problema — são os combustíveis do catálogo.',
  },
];

/** S5 — Educativo rápido + banner CTA */
export default function EducSection() {
  return (
    <section className="bg-bg-base py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal stagger={0.12} className="grid gap-6 md:grid-cols-3">
          {CARDS.map((card) => (
            <RevealItem key={card.title}>
              <div className="h-full rounded-2xl border border-border-subtle bg-bg-surface p-6">
                <card.icon className="h-6 w-6 text-taxi-yellow" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-text-primary">{card.title}</h3>
                {card.countdown && (
                  <p className="mt-2 font-mono text-sm font-bold text-warn-amber">
                    faltam {daysLeft()} dias
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{card.body}</p>
              </div>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal delay={0.15}>
          <RevealItem>
            <div className="relative mt-14 overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface p-10 text-center">
              <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative">
                <h2 className="font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
                  Agora descubra se você pode
                </h2>
                <p className="mx-auto mt-4 max-w-md text-text-muted">
                  16 perguntas. Sem senha Gov.br. Resultado na hora.
                </p>
                <Link
                  to="/pre-analise"
                  className="group mt-7 inline-flex h-[52px] items-center gap-2 rounded-full bg-taxi-yellow px-8 font-bold text-bg-base transition-all duration-200 hover:scale-[1.03] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
                >
                  Fazer pré-análise grátis (2 min)
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}
