import { motion } from 'framer-motion';
import { Ban, Lock, Repeat, Timer, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TETO_PRECO } from '@contracts/constants';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection } from './shared';

type Alerta = { icon: LucideIcon; title: string; body: React.ReactNode };

const ALERTAS: Alerta[] = [
  {
    icon: Timer,
    title: '60 dias pós-compra',
    body: (
      <>
        Comprou, tem <strong className="text-text-primary">60 dias</strong> para comprovar a aquisição nos
        órgãos. Perdeu o prazo? Risco de cobrança do imposto.
      </>
    ),
  },
  {
    icon: Repeat,
    title: 'Carência',
    body: (
      <>
        <strong className="text-text-primary">2 anos</strong> entre benefícios hoje;{' '}
        <strong className="text-alert-red">3 anos a partir de 2027</strong> (LC 160/2017). Usar até 2026 mantém
        a regra dos 2.
      </>
    ),
  },
  {
    icon: Ban,
    title: 'Venda antecipada',
    body: (
      <>
        Vender o carro antes de <strong className="text-text-primary">2 anos</strong> como táxi = devolução
        proporcional dos impostos.
      </>
    ),
  },
  {
    icon: TrendingDown,
    title: 'Teto',
    body: (
      <>
        Carros acima de{' '}
        <span className="font-mono font-bold text-taxi-yellow">R$ {TETO_PRECO.toLocaleString('pt-BR')}</span>{' '}
        não entram — e o teto vence em dez/2026.
      </>
    ),
  },
  {
    icon: Lock,
    title: 'Senha Gov.br',
    body: (
      <>
        Nenhum processo sério pede sua senha ou código MFA.{' '}
        <strong className="text-text-primary">Nós nunca pedimos.</strong>
      </>
    ),
  },
];

/** Bloco 6 — "Prazos e pegadinhas" (#prazos): cards de alerta em 2 colunas */
export default function SectionPrazos() {
  return (
    <ArticleSection id="prazos">
      <Reveal>
        <RevealItem>
          <Eyebrow>Fique esperto</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">Prazos e pegadinhas</ArticleH2>
        </RevealItem>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {ALERTAS.map((alerta, i) => (
          <motion.div
            key={alerta.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ delay: (i % 2) * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border-subtle bg-bg-surface p-6 transition-colors duration-200 hover:border-warn-amber/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warn-amber/10">
                <alerta.icon className="h-5 w-5 text-warn-amber" aria-hidden="true" />
              </span>
              <h3 className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-text-primary">
                {alerta.title}
              </h3>
            </div>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-text-primary/90">{alerta.body}</p>
          </motion.div>
        ))}
      </div>
    </ArticleSection>
  );
}
