import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection, CheckItem } from './shared';

/** Bloco 3 — "Quem pode" (#quem-pode): checklist + card destaque STJ */
export default function SectionQuemPode() {
  return (
    <ArticleSection id="quem-pode">
      <Reveal>
        <RevealItem>
          <Eyebrow>Requisitos</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">Quem pode</ArticleH2>
        </RevealItem>

        <RevealItem className="mt-8">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 md:p-8">
            <ul className="space-y-4">
              <CheckItem>
                Alvará de taxista da <strong className="text-text-primary">Prefeitura de São Paulo</strong>{' '}
                (SVAT/DTP) válido e em seu nome.
              </CheckItem>
              <CheckItem>
                CNH com <strong className="text-text-primary">EAR</strong> (exerce atividade remunerada).
              </CheckItem>
              <CheckItem>Curso obrigatório em dia (<strong className="text-text-primary">Condutax</strong>).</CheckItem>
              <CheckItem>
                Carência respeitada: <strong className="text-text-primary">2 anos</strong> desde o último
                benefício (sobe para 3 em 2027 — use até 2026 e fique na regra dos 2).
              </CheckItem>
              <CheckItem>
                <span>
                  <strong className="text-taxi-yellow">Novidade STJ:</strong> não precisa ter exercido a
                  profissão antes da compra — basta o alvará válido (REsp 2.018.676, nov/2025, tema repetitivo).
                </span>
              </CheckItem>
            </ul>
          </div>
        </RevealItem>

        {/* Card destaque STJ */}
        <RevealItem className="mt-8">
          <div className="grid overflow-hidden rounded-2xl border border-taxi-yellow/30 bg-bg-surface md:grid-cols-2">
            <motion.div
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
              viewport={{ once: true, margin: '-20% 0px' }}
              transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
              className="min-h-[220px]"
            >
              <img
                src="/stj-illustration.png"
                alt="Ilustração de martelo de juiz e balança da justiça em traço amarelo sobre fundo preto"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div className="flex flex-col justify-center p-6 md:p-8">
              <span className="flex w-fit items-center gap-2 rounded-full bg-taxi-yellow/10 px-3 py-1 font-mono text-[0.75rem] font-bold text-taxi-yellow">
                <Gavel className="h-3.5 w-3.5" aria-hidden="true" /> STJ · REsp 2.018.676
              </span>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-text-primary/90">
                <strong className="text-text-primary">Antes:</strong> pediam histórico de atuação.{' '}
                <strong className="text-text-primary">Agora:</strong> alvará válido basta.{' '}
                <strong className="text-taxi-yellow">Tirou o alvará, pode comprar.</strong>
              </p>
            </div>
          </div>
        </RevealItem>
      </Reveal>
    </ArticleSection>
  );
}
