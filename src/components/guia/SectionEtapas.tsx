import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Info } from 'lucide-react';
import { ICMS_RATE, SERVICE_PRICE } from '@contracts/constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Reveal, { RevealItem } from '@/components/Reveal';
import Eyebrow from '@/components/Eyebrow';
import { ArticleH2, ArticleSection } from './shared';

gsap.registerPlugin(ScrollTrigger);

const icmsPct = Math.round(ICMS_RATE * 100);
const precoFmt = `R$ ${SERVICE_PRICE}`;

type Etapa = {
  n: number;
  title: string;
  body: string;
  quem: string;
  tempo: string;
  enviar: string;
  dependsOn?: { n: number; why: string };
  parallel?: boolean;
};

const ETAPAS: Etapa[] = [
  {
    n: 1,
    title: 'Cadastro + pré-análise',
    body: 'Você responde o quiz gratuito e a gente diz em minutos se vale seguir. Sem custo, sem compromisso, sem senha Gov.br.',
    quem: 'Você',
    tempo: '2 min',
    enviar: 'dados básicos de contato',
  },
  {
    n: 2,
    title: 'Pagamento + documentos',
    body: `Só aqui entra o investimento de ${precoFmt}, único. Você envia os documentos guiado pelo checklist, direto do celular.`,
    quem: 'Você',
    tempo: '1 dia',
    enviar: 'CNH, alvará e certificados',
    dependsOn: { n: 1, why: 'O pagamento só faz sentido depois que a pré-análise gratuita confirma que você tem caminho.' },
  },
  {
    n: 3,
    title: 'DTP / SP156 (Prefeitura de SP)',
    body: 'A Prefeitura confirma seu alvará e sua situação no Departamento de Transportes Públicos. Roda em paralelo com o Detran — um não espera o outro.',
    quem: 'Com a gente',
    tempo: '~2–6 semanas',
    enviar: 'alvará SVAT válido',
    dependsOn: { n: 2, why: 'Só protocolamos na Prefeitura com a documentação completa da etapa 2.' },
    parallel: true,
  },
  {
    n: 4,
    title: 'Detran-SP',
    body: 'Consulta de restrições no seu nome e na sua CNH. Corre ao mesmo tempo que o DTP — por isso as duas aparecem lado a lado.',
    quem: 'Com a gente',
    tempo: 'paralelo ao DTP',
    enviar: 'CNH com EAR',
    dependsOn: { n: 2, why: 'Assim como o DTP, depende da documentação enviada na etapa 2.' },
    parallel: true,
  },
  {
    n: 5,
    title: 'SISEN — Receita Federal (IPI)',
    body: 'O desconto federal. Começa só depois do DTP; prazo típico de 30–90 dias. O protocolo é gratuito — quem cobra "taxa de protocolo" da Receita é golpe.',
    quem: 'Receita Federal',
    tempo: '30–90 dias',
    enviar: 'formulário SISEN assinado',
    dependsOn: { n: 3, why: 'A Receita Federal só aceita o pedido de isenção de IPI depois que a Prefeitura conclui a etapa DTP/SP156.' },
  },
  {
    n: 6,
    title: 'SIVEI — Sefaz-SP (ICMS)',
    body: `Os ${icmsPct}% do Estado. Começa só depois do SISEN deferido; prazo típico de 30–60 dias.`,
    quem: 'Sefaz-SP',
    tempo: '30–60 dias',
    enviar: 'deferimento do SISEN',
    dependsOn: { n: 5, why: 'A Sefaz-SP só abre o processo do ICMS depois que o IPI é deferido na Receita Federal (etapa 5).' },
  },
  {
    n: 7,
    title: 'Concessionária + pós-compra',
    body: 'Você retira o carro com a nota fiscal já sem IPI e sem ICMS e comprova a aquisição em até 60 dias junto aos órgãos. O veículo fica vinculado ao táxi por 2 anos — vender antes = devolver imposto proporcional.',
    quem: 'Você + concessionária',
    tempo: 'retirada + 60 dias',
    enviar: 'nota fiscal e comprovantes',
    dependsOn: { n: 6, why: 'A nota fiscal com os dois descontos só sai depois do ICMS deferido (etapa 6).' },
  },
];

function DependBadge({ dependsOn }: { dependsOn: NonNullable<Etapa['dependsOn']> }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-full bg-warn-amber/10 px-3 py-1 font-mono text-[0.7rem] font-bold text-warn-amber transition-colors hover:bg-warn-amber/20"
          aria-label={`Depende da etapa ${dependsOn.n} — ver explicação`}
        >
          <Info className="h-3 w-3" aria-hidden="true" />
          DEPENDE DA ETAPA {dependsOn.n}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 border-border-strong bg-bg-elevated text-sm leading-relaxed text-text-primary/90">
        {dependsOn.why}
      </PopoverContent>
    </Popover>
  );
}

function EtapaCard({ etapa }: { etapa: Etapa }) {
  return (
    <Reveal>
      <RevealItem>
        <h3 className="text-[1.25rem] font-bold leading-snug text-text-primary md:text-[1.5rem]">
          {etapa.title}
        </h3>
      </RevealItem>
      <RevealItem>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-text-primary/90">{etapa.body}</p>
      </RevealItem>
      <RevealItem>
        <div className="mt-5 grid gap-3 rounded-2xl border border-border-subtle bg-bg-elevated p-5 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-faint">Quem faz</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{etapa.quem}</p>
          </div>
          <div>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-faint">Quanto tempo</p>
            <p className="mt-1 font-mono text-sm font-bold text-taxi-yellow">{etapa.tempo}</p>
          </div>
          <div>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-faint">Você envia</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{etapa.enviar}</p>
          </div>
        </div>
      </RevealItem>
      {etapa.dependsOn && (
        <RevealItem className="mt-4">
          <DependBadge dependsOn={etapa.dependsOn} />
        </RevealItem>
      )}
    </Reveal>
  );
}

function EtapaNumero({ n }: { n: number }) {
  return (
    <span
      className="pointer-events-none block w-16 shrink-0 select-none text-center font-mono text-[4rem] font-bold leading-none text-text-primary/[0.08]"
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

/** Bloco 5 — "As 7 etapas, órgão por órgão" (#etapas, âncoras #etapa-1…#etapa-7) */
export default function SectionEtapas() {
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  // Conector da timeline desenha com o scroll (scrub, via transform — GSAP isolado neste efeito)
  useEffect(() => {
    const el = track.current;
    const bar = fill.current;
    if (!el || !bar) return;
    const tween = gsap.fromTo(
      bar,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 70%', scrub: 0.4 },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const simples = (n: number) => ETAPAS.find((e) => e.n === n)!;

  return (
    <ArticleSection id="etapas">
      <Reveal>
        <RevealItem>
          <Eyebrow>O caminho completo</Eyebrow>
        </RevealItem>
        <RevealItem>
          <ArticleH2 className="mt-5">As 7 etapas, órgão por órgão</ArticleH2>
        </RevealItem>
        <RevealItem>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-text-primary/90">
            O processo é uma esteira: algumas etapas correm em paralelo, outras só abrem depois da anterior.
            Aqui está o mapa completo, com quem faz o quê.
          </p>
        </RevealItem>
      </Reveal>

      <div ref={track} className="relative mt-12">
        {/* Conector vertical tracejado (gutter centralizado na coluna do número: w-16 → left-8) */}
        <div className="absolute bottom-4 left-8 top-4 w-px -translate-x-1/2" aria-hidden="true">
          <div className="absolute inset-0 border-l-2 border-dashed border-taxi-yellow/25" />
          <div ref={fill} className="absolute inset-0 origin-top border-l-2 border-taxi-yellow" style={{ transform: 'scaleY(0)' }} />
        </div>

        <div className="space-y-14">
          {[1, 2].map((n) => (
            <article key={n} id={`etapa-${n}`} className="relative flex scroll-mt-32 gap-5 md:gap-7">
              <EtapaNumero n={n} />
              <div className="min-w-0 flex-1 pt-2">
                <EtapaCard etapa={simples(n)} />
              </div>
            </article>
          ))}

          {/* Etapas 3 e 4 — paralelas, lado a lado no desktop */}
          <div>
            <Reveal>
              <RevealItem>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-info-blue/10 px-4 py-1.5 font-mono text-[0.75rem] font-bold text-info-blue">
                  ∥ paralelas — rodam ao mesmo tempo
                </span>
              </RevealItem>
            </Reveal>
            <div className="grid gap-14 md:grid-cols-2 md:gap-8">
              {[3, 4].map((n) => (
                <article key={n} id={`etapa-${n}`} className="relative flex scroll-mt-32 gap-5">
                  <EtapaNumero n={n} />
                  <div className="min-w-0 flex-1 pt-2">
                    <EtapaCard etapa={simples(n)} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {[5, 6, 7].map((n) => (
            <article key={n} id={`etapa-${n}`} className="relative flex scroll-mt-32 gap-5 md:gap-7">
              <EtapaNumero n={n} />
              <div className="min-w-0 flex-1 pt-2">
                <EtapaCard etapa={simples(n)} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </ArticleSection>
  );
}
