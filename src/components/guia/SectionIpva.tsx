import { AlertTriangle, BadgePercent, CheckCircle2, ExternalLink, FileText } from 'lucide-react';
import { IPVA_FIRST_YEAR_NOTE, IPVA_TRIGGERS, IPVA_ZERO_KM_DEADLINE_DAYS, LICENCIAMENTO_2026, SEFAZ_IPVA_URL } from '@contracts/constants';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection, Callout, CheckItem } from './shared';

/** Bloco — "IPVA: isenção total, todo ano — mas com gatilhos" (#ipva) */
export default function SectionIpva() {
  return (
    <ArticleSection id="ipva">
      <Reveal>
        <RevealItem>
          <Eyebrow>Depois da compra</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">IPVA: isenção total, todo ano — mas com gatilhos</ArticleH2>
        </RevealItem>

        <div className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-text-primary/90">
          <RevealItem>
            <p>
              Em São Paulo, a isenção de IPVA para táxi é <strong className="text-text-primary">total — 100%,
              sem teto de valor</strong> (<strong className="text-text-primary">Lei 13.296/2008</strong>). A alíquota
              normal para carros de passeio é de{' '}
              <span className="font-mono font-bold text-taxi-yellow">4% do valor venal por ano</span> — num táxi de
              R$ 150 mil, são <span className="font-mono font-bold text-money-green">~R$ 6 mil economizados
              todo ano</span>.
            </p>
          </RevealItem>
          <RevealItem>
            <p>
              E ela <strong className="text-text-primary">vale todo ano, enquanto as condições se mantiverem</strong>:
              não precisa repedir anualmente. A confirmação é feita pela{' '}
              <strong className="text-text-primary">consulta de certidão de isenção</strong> no site da Sefaz-SP.
            </p>
          </RevealItem>
          <RevealItem>
            <ul className="space-y-3">
              <CheckItem>Vale apenas <strong>1 veículo isento por CPF</strong>.</CheckItem>
              <CheckItem>A isenção se renova sozinha enquanto você rodar como táxi com alvará ativo.</CheckItem>
              <CheckItem>
                Carro 0 km: se a isenção não sair automática, o pedido no{' '}
                <strong>SIVEI deve ser feito em até {IPVA_ZERO_KM_DEADLINE_DAYS} dias da NF-e</strong>.
              </CheckItem>
            </ul>
          </RevealItem>
        </div>

        <RevealItem className="mt-8">
          <Callout tone="red" icon={AlertTriangle}>
            <span>
              <strong>A isenção cai automaticamente — e a Sefaz cobra o IPVA proporcional dos meses
              restantes — se:</strong>
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
              <strong className="text-text-primary">Transferência táxi → taxista:</strong> hoje, vender o táxi
              isento para outro taxista derruba a isenção. O{' '}
              <strong className="text-text-primary">PL 268/2026 (Alesp)</strong> propõe manter o benefício nessas
              transferências, com janela de 5 dias úteis para o novo dono requerer —{' '}
              <strong className="text-text-primary">mas ainda é projeto de lei, não vigora</strong>.
            </p>
          </RevealItem>
          <RevealItem>
            <p>
              <strong className="text-text-primary">Licenciamento anual do Detran-SP não é isento:</strong>{' '}
              R$ {LICENCIAMENTO_2026.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              em 2026, com calendário de julho a dezembro por final de placa.
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
                Consulta oficial da certidão de isenção — Sefaz-SP
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </p>
          </RevealItem>
        </div>

        <RevealItem className="mt-8">
          <Callout tone="green" icon={CheckCircle2}>
            <span>
              <strong>Resumo:</strong> IPVA de táxi em SP é zero, todo ano, sem teto — cuide apenas dos gatilhos
              e do prazo de {IPVA_ZERO_KM_DEADLINE_DAYS} dias da NF-e no primeiro pedido.
            </span>
          </Callout>
        </RevealItem>

        <RevealItem className="mt-6">
          <p className="flex items-center gap-2 text-sm text-text-faint">
            <BadgePercent className="h-4 w-4 shrink-0" aria-hidden="true" />
            Base legal: Lei estadual 13.296/2008 · Alíquota de 4% (veículos de passeio) · PL 268/2026 em tramitação.
          </p>
        </RevealItem>
      </Reveal>
    </ArticleSection>
  );
}
