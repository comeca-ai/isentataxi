import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, Copy, Lock, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { CatalogCar, LocalCalc } from './catalog';
import { fmtBRL, fuelLabel, pct } from './catalog';

export interface PanelData extends LocalCalc {
  fuel: 'flex' | 'hibrido' | 'eletrico';
  /** IPVA anual estimado (4% do valor venal) — vem do calculate; fallback local */
  ipvaAnnual: number;
  /** Nota do 1º ano de atividade (taxista novo paga o 1º IPVA) */
  ipvaNote: string;
}

/** Painel de resultado sticky — tweens GSAP isolados (sem Framer nesta árvore). */
export default function ResultPanel({
  car,
  manual,
  data,
  error,
  onOpenLead,
}: {
  car: CatalogCar | null;
  manual: boolean;
  data: PanelData;
  error: string | null;
  onOpenLead: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLSpanElement>(null);
  const ipiRef = useRef<HTMLSpanElement>(null);
  const icmsRef = useRef<HTMLSpanElement>(null);
  const finalRef = useRef<HTMLSpanElement>(null);
  const ipiBarRef = useRef<HTMLDivElement>(null);
  const icmsBarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLImageElement>(null);
  const tweenState = useRef({ total: 0, ipi: 0, icms: 0, final: 0 });
  const lastImg = useRef<string | null>(null);

  // Entrada do painel: x 40→0, opacity 0→1, 700ms
  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
    );
  }, []);

  // Tween de valores a cada mudança (snap 100, ~600ms) + barras scaleX origin-left
  useEffect(() => {
    if (error) return;
    const setText = (ref: React.RefObject<HTMLSpanElement | null>, v: number) => {
      if (ref.current) ref.current.textContent = fmtBRL(v);
    };
    gsap.to(tweenState.current, {
      total: data.totalSavings,
      ipi: data.ipiValue,
      icms: data.icmsValue,
      final: data.finalPrice,
      duration: 0.6,
      ease: 'power2.out',
      snap: { total: 100, ipi: 100, icms: 100, final: 100 },
      onUpdate: () => {
        setText(totalRef, tweenState.current.total);
        setText(ipiRef, tweenState.current.ipi);
        setText(icmsRef, tweenState.current.icms);
        setText(finalRef, tweenState.current.final);
      },
    });
    const total = Math.max(data.totalSavings, 1);
    const segs = [
      { ref: ipiBarRef, w: data.ipiValue / total },
      { ref: icmsBarRef, w: data.icmsValue / total },
    ];
    segs.forEach(({ ref, w }, i) => {
      if (!ref.current) return;
      ref.current.style.width = `${Math.max(w * 100, 2)}%`;
      gsap.fromTo(
        ref.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, delay: i * 0.1, ease: 'power2.out' },
      );
    });
  }, [data.totalSavings, data.ipiValue, data.icmsValue, data.finalPrice, error]);

  // Crossfade da miniatura ao trocar de carro (300ms)
  useEffect(() => {
    const src = car?.imageUrl ?? null;
    if (!thumbRef.current || src === lastImg.current) return;
    lastImg.current = src;
    gsap.fromTo(thumbRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
  }, [car?.imageUrl]);

  const copyResult = async () => {
    const model = manual ? 'Preço personalizado' : car?.name ?? '';
    const text = [
      `Simulação IsentaTáxi — ${model}`,
      `Preço ref.: R$ ${fmtBRL(data.price)}`,
      `IPI (~${pct(data.ipiRate)}): R$ ${fmtBRL(data.ipiValue)}`,
      `ICMS SP (12%): R$ ${fmtBRL(data.icmsValue)}`,
      `Economia estimada: R$ ${fmtBRL(data.totalSavings)}`,
      `Preço com isenção ≈ R$ ${fmtBRL(data.finalPrice)}`,
      '*Estimativa com base nas alíquotas vigentes — sem promessa de aprovação.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Resumo copiado — cole no WhatsApp.');
    } catch {
      toast.error('Não consegui copiar. Tente de novo.');
    }
  };

  return (
    <div ref={panelRef} className="lg:sticky lg:top-28">
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated">
        <div className="zebra-fine h-1 w-full" aria-hidden="true" />
        <div className="p-7">
          {/* Miniatura + nome */}
          <div className="flex items-center gap-4">
            {!manual && car ? (
              <img
                ref={thumbRef}
                src={car.imageUrl}
                alt=""
                className="h-16 w-24 shrink-0 rounded-lg bg-[#131316] object-cover"
              />
            ) : (
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-bg-surface font-mono text-lg font-bold text-taxi-yellow">
                R$
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold text-text-primary">
                {manual ? 'Preço personalizado' : car?.name}
              </p>
              <p className="font-mono text-sm text-text-muted">
                R$ {fmtBRL(data.price)}
                {!manual && car ? ` · ${fuelLabel(car.fuel)}` : ''}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-alert-red/40 bg-alert-red/10 p-4" role="alert">
              <p className="flex items-start gap-2 text-sm leading-relaxed text-text-primary">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-alert-red" aria-hidden="true" />
                {error}
              </p>
              <a
                href="https://wa.me/5511942299144"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-taxi-yellow hover:text-taxi-yellow-hover"
              >
                Falar com especialista <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          ) : (
            <>
              {/* Valor gigante */}
              <div className="mt-6">
                <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-text-muted">
                  Economia estimada total
                </p>
                <p className="mt-1 font-mono text-[2.6rem] font-bold leading-none text-money-green md:text-[3.5rem]">
                  R$ <span ref={totalRef}>{fmtBRL(data.totalSavings)}</span>
                </p>
              </div>

              {/* Breakdown empilhado */}
              <div className="mt-6">
                <div className="flex h-[18px] overflow-hidden rounded-full bg-bg-base">
                  <div ref={ipiBarRef} className="h-full origin-left bg-taxi-yellow" style={{ width: '50%' }} />
                  <div ref={icmsBarRef} className="h-full origin-left bg-money-green" style={{ width: '50%' }} />
                </div>
                <div className="mt-2 flex justify-between gap-2 text-[0.75rem]">
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <span className="h-2 w-2 rounded-full bg-taxi-yellow" aria-hidden="true" />
                    IPI {pct(data.ipiRate)} · <span className="font-mono text-text-primary">R$ {fmtBRL(data.ipiValue)}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <span className="h-2 w-2 rounded-full bg-money-green" aria-hidden="true" />
                    ICMS 12% · <span className="font-mono text-text-primary">R$ {fmtBRL(data.icmsValue)}</span>
                  </span>
                </div>
              </div>

              {/* Linhas mono */}
              <dl className="mt-6 space-y-3 font-mono text-[0.8125rem]">
                <div className="flex justify-between gap-3 border-b border-dashed border-border-subtle pb-3">
                  <dt className="text-text-muted">IPI (~{pct(data.ipiRate)} de R$ {fmtBRL(data.price)})</dt>
                  <dd className="text-taxi-yellow">= R$ <span ref={ipiRef}>{fmtBRL(data.ipiValue)}</span></dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-dashed border-border-subtle pb-3">
                  <dt className="text-text-muted">ICMS SP (12%)</dt>
                  <dd className="text-money-green">= R$ <span ref={icmsRef}>{fmtBRL(data.icmsValue)}</span></dd>
                </div>
                <div className="border-b border-dashed border-border-subtle pb-3">
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">IPVA (4%/ano)</dt>
                    <dd className="flex items-center gap-2 text-money-green">
                      R$ {fmtBRL(data.ipvaAnnual)}/ano
                      <span className="rounded-full border border-money-green/40 bg-money-green/10 px-2 py-0.5 font-mono text-[0.7rem] font-bold">
                        ISENTO*
                      </span>
                    </dd>
                  </div>
                  <p className="mt-1.5 font-sans text-[0.8125rem] leading-snug text-text-faint">{data.ipvaNote}</p>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">Preço com isenção</dt>
                  <dd className="font-bold text-text-primary">≈ R$ <span ref={finalRef}>{fmtBRL(data.finalPrice)}</span></dd>
                </div>
              </dl>

              <p className="mt-5 text-[0.75rem] leading-relaxed text-text-faint">
                Estimativa didática com base nas alíquotas típicas de 2026. O valor final depende do modelo
                exato, da tabela da montadora e do deferimento pela Receita Federal e Sefaz-SP.
              </p>

              <p className="mt-4 flex items-start gap-2 rounded-xl border border-money-green/30 bg-money-green/10 p-3 text-[0.8125rem] leading-snug text-text-primary">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-money-green" aria-hidden="true" />
                Protocolo nos órgãos é gratuito. Você não paga imposto — e não precisa pagar ninguém para simular.
              </p>
            </>
          )}

          {/* CTAs */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={onOpenLead}
              disabled={!!error}
              className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:scale-[1.02] hover:bg-taxi-yellow-hover hover:shadow-cta-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              Receber análise completa grátis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </button>
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/pre-analise"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-taxi-yellow"
              >
                Verificar se sou elegível <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={copyResult}
                disabled={!!error}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 text-[0.8125rem] font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text-primary disabled:opacity-40"
                aria-label="Copiar resultado"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
