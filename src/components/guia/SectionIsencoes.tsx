import { CheckCircle2 } from 'lucide-react';
import { ICMS_RATE } from '@contracts/constants';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection, Callout } from './shared';

const icmsPct = Math.round(ICMS_RATE * 100);

/** Bloco 2 — "O que são as duas isenções" (#isencoes) */
export default function SectionIsencoes() {
  return (
    <ArticleSection id="isencoes">
      <Reveal>
        <RevealItem>
          <Eyebrow>O básico</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">O que são as duas isenções</ArticleH2>
        </RevealItem>

        <div className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-text-primary/90">
          <RevealItem>
            <p>
              <strong className="text-text-primary">IPI (federal)</strong> — Imposto sobre Produtos
              Industrializados, embutido no preço de fábrica do carro. A{' '}
              <strong className="text-text-primary">Lei 8.989/1995</strong> garante isenção para táxi, e a{' '}
              <strong className="text-text-primary">LC 160/2017</strong> estendeu o direito aos taxistas
              autônomos. Alíquotas típicas: ~7% (até 1.0) a ~11–13% (1.0–2.0); híbridos e elétricos têm
              alíquotas menores. O protocolo é gratuito no <strong className="text-text-primary">SISEN (Receita
              Federal)</strong>.
            </p>
          </RevealItem>
          <RevealItem>
            <p>
              <strong className="text-text-primary">ICMS (SP)</strong> — imposto estadual, alíquota interna de{' '}
              <span className="font-mono font-bold text-taxi-yellow">{icmsPct}%</span>. A isenção sai pelo{' '}
              <strong className="text-text-primary">SIVEI (Sefaz-SP)</strong> — e depende do IPI deferido
              primeiro.
            </p>
          </RevealItem>
          <RevealItem>
            <p>
              <strong className="text-text-primary">IPVA (SP)</strong> — isenção estadual{' '}
              <strong className="text-text-primary">total (100%, sem teto)</strong> para táxi, que vale todo ano
              enquanto as condições se mantiverem. Tem regras e gatilhos próprios — detalhamos na{' '}
              <a href="#ipva" className="font-medium text-taxi-yellow transition-colors hover:text-taxi-yellow-hover">
                seção de IPVA
              </a>{' '}
              deste guia.
            </p>
          </RevealItem>
        </div>

        <RevealItem className="mt-8">
          <Callout tone="green" icon={CheckCircle2}>
            Na prática: <strong>19% a 25% do preço do carro volta para o seu bolso.</strong> Num Corolla GLi,
            são ~<span className="font-mono font-bold text-money-green">R$ 40 mil</span>.
          </Callout>
        </RevealItem>
      </Reveal>
    </ArticleSection>
  );
}
