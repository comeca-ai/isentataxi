import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Reveal, { RevealItem } from '@/components/Reveal';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'Isso é legal mesmo?',
    a: 'Sim. IPI: Lei 8.989/1995 + LC 160/2017; ICMS: isenção estadual de SP via SIVEI. O protocolo nos órgãos é gratuito — cobramos a operação, não o benefício.',
  },
  {
    q: 'Preciso dar minha senha do Gov.br?',
    a: 'Nunca. Não pedimos senha, código MFA nem sessão. Você assina o que precisa, na hora, no seu celular.',
  },
  {
    q: 'Acabei de tirar o alvará. Posso?',
    a: 'Sim — decisão do STJ (REsp 2.018.676/2025): basta alvará válido. Não precisa comprovar exercício anterior da profissão.',
  },
  {
    q: 'Quais carros entram?',
    a: '0 km, 4 portas, motor até 2.0, até R$ 200 mil, flex/híbrido/elétrico (diesel só em exceções).',
  },
  {
    q: 'Quanto tempo demora?',
    a: 'Tipicamente 3 a 6 meses da pré-análise à nota fiscal, dependendo do órgão.',
  },
  {
    q: 'Já usei a isenção. Quando posso de novo?',
    a: '2 anos depois do último benefício (a partir de 2027, 3 anos).',
  },
  {
    q: 'Posso vender o carro depois?',
    a: 'Só após 2 anos rodando como táxi, senão devolve o imposto proporcional.',
  },
  {
    q: 'Preciso enviar guias? Elas precisam estar pagas?',
    a: 'Sim. Guias e taxas do processo (ex.: laudo/vistoria do Detran e o licenciamento anual, R$ 174,08 — este não é isento) precisam estar quitadas. Você fotografa ou sobe o PDF do comprovante pelo painel e nossa equipe confere antes de protocolar — guia em aberto trava o processo no órgão.',
  },
  {
    q: 'E se o órgão negar?',
    a: 'Quem defere é o órgão público; a pré-análise existe exatamente para filtrar risco antes de você pagar qualquer coisa.',
  },
];

function FaqItem({ q, a, open, onToggle, index }: { q: string; a: string; open: boolean; onToggle: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border-subtle bg-bg-surface"
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-text-primary">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
            open ? 'border-taxi-yellow bg-taxi-yellow text-bg-base' : 'border-border-strong text-text-muted',
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** S10 — FAQ (accordion, 1 aberto por vez) */
export default function FaqSection() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="faq" className="bg-bg-base py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <Reveal>
          <RevealItem>
            <h2 className="text-center font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              Perguntas de quem roda todo dia
            </h2>
          </RevealItem>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem
              key={f.q}
              q={f.q}
              a={f.a}
              index={i}
              open={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
