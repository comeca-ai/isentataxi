import { Link } from 'react-router';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { ICMS_RATE, IPI_RATES, TETO_DEADLINE_ISO, TETO_PRECO } from '@contracts/constants';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection, Callout, CheckItem } from './shared';

const tetoFmt = `R$ ${TETO_PRECO.toLocaleString('pt-BR')}`;
const [y, m, d] = TETO_DEADLINE_ISO.slice(0, 10).split('-');
const deadlineFmt = `${d}/${m}/${y}`;
const icmsPct = Math.round(ICMS_RATE * 100);
const fmtPct = (rate: number) => (rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

const TABELA = [
  {
    tipo: 'Até 1.0 flex',
    ipi: '7%',
    total: `~${7 + icmsPct}%`,
  },
  {
    tipo: '1.0–2.0 flex',
    ipi: `${fmtPct(IPI_RATES.flex)}–13%`,
    total: `~${Math.round(IPI_RATES.flex * 100) + icmsPct}–${13 + icmsPct}%`,
  },
  {
    tipo: 'Híbrido',
    ipi: `~${fmtPct(IPI_RATES.hibrido)}%`,
    total: `~${(IPI_RATES.hibrido * 100 + icmsPct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
  },
  {
    tipo: 'Elétrico',
    ipi: '0–4%',
    total: `~${icmsPct}–${icmsPct + 4}%`,
  },
];

/** Bloco 4 — "Qual carro pode" (#carro): checklist, callout vermelho, tabela de alíquotas */
export default function SectionCarro() {
  return (
    <ArticleSection id="carro">
      <Reveal>
        <RevealItem>
          <Eyebrow>Regras do veículo</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">Qual carro pode</ArticleH2>
        </RevealItem>

        <RevealItem className="mt-8">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 md:p-8">
            <ul className="space-y-4">
              <CheckItem>0 km, comprado em concessionária.</CheckItem>
              <CheckItem>4 portas.</CheckItem>
              <CheckItem>Motor até 2.0.</CheckItem>
              <CheckItem>Flex, álcool, gasolina, gás, híbrido ou elétrico.</CheckItem>
              <CheckItem ok={false}>Diesel (salvo exceções raríssimas).</CheckItem>
              <CheckItem>
                Até <span className="font-mono font-bold text-taxi-yellow">{tetoFmt}</span> — teto garantido até{' '}
                <span className="font-mono font-bold text-taxi-yellow">{deadlineFmt}</span> (Lei 14.183/2021).
                Senado aprovou estender por 2 anos (jun/2025), mas a lei vigente assegura só até dez/2026.
              </CheckItem>
            </ul>
          </div>
        </RevealItem>

        <RevealItem className="mt-8">
          <Callout tone="red" icon={AlertTriangle}>
            Depois de <strong>{deadlineFmt}</strong> o teto depende de lei nova. Não planeje com base em
            promessa — <strong>planeje com base na lei vigente.</strong>
          </Callout>
        </RevealItem>

        {/* Tabela de alíquotas didáticas */}
        <RevealItem className="mt-10">
          <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface">
            <div className="asphalt-texture pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" />
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <caption className="px-6 pt-5 text-left text-sm font-medium text-text-muted">
                  Tabela de alíquotas didáticas
                </caption>
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th scope="col" className="px-6 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-text-faint">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-text-faint">
                      IPI típico
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-text-faint">
                      ICMS SP
                    </th>
                    <th scope="col" className="px-6 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-text-faint">
                      Desconto total típico
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TABELA.map((row) => (
                    <tr key={row.tipo} className="border-b border-border-subtle last:border-0">
                      <th scope="row" className="px-6 py-4 font-semibold text-text-primary">
                        {row.tipo}
                      </th>
                      <td className="px-6 py-4 font-mono text-text-primary/90">{row.ipi}</td>
                      <td className="px-6 py-4 font-mono text-text-primary/90">{icmsPct}%</td>
                      <td className="px-6 py-4 font-mono font-bold text-money-green">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="relative px-6 pb-5 pt-3 text-[0.8125rem] text-text-faint">
              Valores didáticos; simule por modelo.
            </p>
          </div>
        </RevealItem>

        <RevealItem className="mt-6">
          <Link
            to="/simulador"
            className="group inline-flex items-center gap-2 font-semibold text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
          >
            Ver economia por modelo
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </RevealItem>
      </Reveal>
    </ArticleSection>
  );
}
