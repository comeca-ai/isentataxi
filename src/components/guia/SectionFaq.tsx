import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { cn } from '@/lib/utils';
import { ArticleH2, ArticleSection } from './shared';

const FAQS = [
  {
    q: 'O protocolo é pago?',
    a: 'Não — o protocolo é gratuito nos órgãos (SISEN e SIVEI). O que cobramos é a operação: organizar documentos, acompanhar prazos e evitar erro que custa meses.',
  },
  {
    q: 'Posso fazer sozinho?',
    a: 'Pode — este guia mostra o caminho completo, órgão por órgão. A gente entra para acelerar e evitar erro: um documento errado pode devolver seu processo para o fim da fila.',
  },
  {
    q: 'E se mudar a lei?',
    a: 'Acompanhamos as mudanças e avisamos os clientes ativos. O que já foi protocolado segue a regra vigente na data do pedido.',
  },
  {
    q: 'IPVA entra?',
    a: 'Possível benefício adicional, avaliado caso a caso — depende de regra estadual e municipal. Sem promessa: o que está em lei hoje é IPI + ICMS.',
  },
];

const FONTES = [
  'Lei 8.989/1995',
  'LC 160/2017',
  'Lei 14.183/2021',
  'STJ REsp 2.018.676 (2025)',
  'Portais SISEN/Receita Federal e SIVEI/Sefaz-SP',
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface">
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
            open ? 'border-taxi-yellow text-taxi-yellow' : 'border-border-strong text-text-muted',
          )}
          aria-hidden="true"
        >
          <Plus className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 leading-relaxed text-text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Bloco 7 — FAQ legislativo curto + fontes oficiais (#faq) */
export default function SectionFaq() {
  const [open, setOpen] = useState<number>(0);

  return (
    <ArticleSection id="faq">
      <Reveal>
        <RevealItem>
          <Eyebrow>Dúvidas de lei</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">FAQ legislativo</ArticleH2>
        </RevealItem>
      </Reveal>

      <div className="mt-8 space-y-3">
        {FAQS.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>

      <Reveal className="mt-12">
        <RevealItem>
          <h3 className="font-mono text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-text-faint">
            Fontes oficiais
          </h3>
        </RevealItem>
        <RevealItem>
          <ul className="mt-4 space-y-2 font-mono text-[0.875rem] text-text-muted">
            {FONTES.map((fonte) => (
              <li key={fonte} className="flex items-center gap-3">
                <span className="zebra-fine inline-block h-[6px] w-4 shrink-0" aria-hidden="true" />
                {fonte}
              </li>
            ))}
          </ul>
        </RevealItem>
      </Reveal>
    </ArticleSection>
  );
}
