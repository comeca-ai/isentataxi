import { AlertTriangle, BadgePercent, CheckCircle2, ExternalLink, FileText } from 'lucide-react';
import { IPVA_FIRST_YEAR_NOTE, IPVA_TRIGGERS, IPVA_ZERO_KM_DEADLINE_DAYS, LICENCIAMENTO_2026, SEFAZ_IPVA_URL } from '@contracts/constants';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection, Callout, CheckItem } from './shared';

/** Bloco — "IPVA: isenção total — renovada todo ano, com gatilhos" (#ipva) */
export default function SectionIpva() {
  return (
    <ArticleSection id="ipva">
      <Reveal>
        <RevealItem>
          <Eyebrow>Depois da compra</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">IPVA: isenção total — renovada todo ano, com gatilhos</ArticleH2>
        </RevealItem>

        <div className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-text-primary/90">
          <RevealItem>
            <p>
              Na Paraíba, a isenção de IPVA para táxi é <strong className="text-text-primary">total — 100%,
              sem teto de valor</strong> (<strong className="text-text-primary">Lei estadual 11.007/2017, art. 4º, IV</strong>). A alíquota
              normal para carros de passeio é de{' '}
              <span className="font-mono font-bold text-taxi-yellow">2,5% do valor venal por ano</span> — num táxi de
              R$ 150 mil, são <span className="font-mono font-bold text-money-green">~R$ 3,7 mil economizados
              todo ano</span>.
            </p>
          </RevealItem>
          <RevealItem>
            <p>
              Na PB a isenção <strong className="text-text-primary">depende de reconhecimento prévio da Sefaz-PB e precisa ser
              renovada todo ano</strong>, dentro do calendário do IPVA da sua placa. A gente lembra você do prazo.
            </p>
          </RevealItem>
          <RevealItem>
            <ul className="space-y-3">
              <CheckItem>Vale apenas <strong>1 veículo isento por CPF</strong>.</CheckItem>
              <CheckItem>Exige permissão municipal de táxi regular (Prefeitura).</CheckItem>
              <CheckItem>
                Carro 0 km: peça o reconhecimento na Sefaz-PB <strong>logo após a NF-e</strong> — nosso lembrete avisa em{' '}
                {IPVA_ZERO_KM_DEADLINE_DAYS} dias.
              </CheckItem>
            </ul>
          </RevealItem>
        </div>

        <RevealItem className="mt-8">
          <Callout tone="red" icon={AlertTriangle}>
            <span>
              <strong>A isenção cai — e o IPVA volta a ser cobrado — se:</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {IPVA_TRIGGERS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </span>
          </Callout>
        </RevealItem>

        <RevealItem className="mt-6">
          <Callout tone="yellow" icon={FileText}>
            {IPVA_FIRST_YEAR_NOTE}
          </Callout>
        </RevealItem>

        <div className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-text-primary/90">
          <RevealItem>
            <p>
              <strong className="text-text-primary">Licenciamento anual do Detran-PB não é isento:</strong>{' '}
              valor e calendário por final de placa definidos pelo Detran-PB (confira no site oficial).
            </p>
          </RevealItem>
          <RevealItem>
            <p>
              <a
                href={SEFAZ_IPVA_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
              >
                Portal oficial da Sefaz-PB
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </p>
          </RevealItem>
        </div>

        <RevealItem className="mt-8">
          <Callout tone="green" icon={CheckCircle2}>
            <span>
              <strong>Resumo:</strong> IPVA de táxi na PB é zero, sem teto — mas renove o reconhecimento todo ano e
              cuide dos gatilhos.
            </span>
          </Callout>
        </RevealItem>

        <RevealItem className="mt-6">
          <p className="flex items-center gap-2 text-sm text-text-faint">
            <BadgePercent className="h-4 w-4 shrink-0" aria-hidden="true" />
            Base legal: Lei estadual 11.007/2017 (art. 4º, IV; art. 12, II) · Alíquota de 2,5% (automóveis) · Regras a confirmar com a Sefaz-PB.
          </p>
        </RevealItem>
      </Reveal>
    </ArticleSection>
  );
}
