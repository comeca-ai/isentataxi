import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ArrowRight, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import Eyebrow from '@/components/Eyebrow';
import { RevealItem } from '@/components/Reveal';
import Reveal from '@/components/Reveal';
import { cn } from '@/lib/utils';

type Fuel = 'flex' | 'hibrido' | 'eletrico';

const IPI_RATE: Record<Fuel, number> = { flex: 0.11, hibrido: 0.065, eletrico: 0.03 };
const ICMS_RATE = 0.12;
const FUELS: { key: Fuel; label: string }[] = [
  { key: 'flex', label: 'Flex' },
  { key: 'hibrido', label: 'Híbrido' },
  { key: 'eletrico', label: 'Elétrico' },
];

const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');

/** S4 — Mini-simulador (isca interativa) */
export default function MiniSimulator() {
  const [price, setPrice] = useState(120_000);
  const [fuel, setFuel] = useState<Fuel>('flex');
  const totalRef = useRef<HTMLSpanElement>(null);
  const ipiRef = useRef<HTMLSpanElement>(null);
  const icmsRef = useRef<HTMLSpanElement>(null);
  const ipiBarRef = useRef<HTMLDivElement>(null);
  const icmsBarRef = useRef<HTMLDivElement>(null);
  const tweenState = useRef({ total: 0, ipi: 0, icms: 0 });

  useEffect(() => {
    const ipi = price * IPI_RATE[fuel];
    const icms = price * ICMS_RATE;
    const total = ipi + icms;
    gsap.to(tweenState.current, {
      total,
      ipi,
      icms,
      duration: 0.4,
      ease: 'power2.out',
      snap: { total: 100, ipi: 100, icms: 100 },
      onUpdate: () => {
        if (totalRef.current) totalRef.current.textContent = fmt(tweenState.current.total);
        if (ipiRef.current) ipiRef.current.textContent = fmt(tweenState.current.ipi);
        if (icmsRef.current) icmsRef.current.textContent = fmt(tweenState.current.icms);
      },
    });
    const maxPct = 0.25;
    gsap.to(ipiBarRef.current, { scaleX: IPI_RATE[fuel] / maxPct, duration: 0.5, ease: 'power2.out' });
    gsap.to(icmsBarRef.current, { scaleX: ICMS_RATE / maxPct, duration: 0.5, ease: 'power2.out' });
  }, [price, fuel]);

  return (
    <section className="asphalt-texture relative bg-bg-surface py-20 md:py-28">
      <div className="absolute inset-0 bg-bg-surface/[0.94]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <RevealItem>
            <Eyebrow>Simulador grátis</Eyebrow>
          </RevealItem>
          <RevealItem>
            <h2 className="mt-5 font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              Quanto você deixa de pagar?
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-5 max-w-md leading-relaxed text-text-muted">
              Arraste e veja na hora. IPI (7% a 13%) + ICMS SP (12%) somam 19% a 25% do preço do carro. É
              desconto de verdade, com lei: IPI federal + isenção estadual de SP.
            </p>
          </RevealItem>
          <RevealItem>
            <ul className="mt-6 space-y-3">
              {['Sem cadastro para simular', 'Estimativa honesta, sem promessa', 'Resultado detalhado no simulador completo'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-text-muted">
                    <Check className="h-4 w-4 shrink-0 text-money-green" aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </RevealItem>
          <RevealItem>
            <Link
              to="/simulador"
              className="mt-7 inline-flex items-center gap-1.5 font-medium text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
            >
              Abrir simulador completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </RevealItem>
        </Reveal>

        <Reveal>
          <RevealItem>
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-6 md:p-8">
              <div className="flex items-baseline justify-between">
                <label htmlFor="mini-price" className="text-sm font-medium text-text-muted">
                  Preço do carro 0 km
                </label>
                <span className="font-mono text-xl font-bold text-text-primary">R$ {fmt(price)}</span>
              </div>
              <Slider
                id="mini-price"
                min={80_000}
                max={200_000}
                step={1_000}
                value={[price]}
                onValueChange={([v]) => setPrice(v)}
                className="mt-5 [&_[data-slot=slider-range]]:bg-taxi-yellow [&_[data-slot=slider-thumb]]:h-6 [&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:border-taxi-yellow [&_[data-slot=slider-thumb]]:bg-taxi-yellow [&_[data-slot=slider-thumb]]:ring-taxi-yellow/40 [&_[data-slot=slider-track]]:bg-border-strong"
                aria-label="Preço do carro 0 km"
              />
              <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-text-faint">
                <span>R$ 80 mil</span>
                <span>R$ 200 mil</span>
              </div>

              <div className="mt-6 flex rounded-full border border-border-subtle bg-bg-base p-1" role="group" aria-label="Combustível">
                {FUELS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFuel(f.key)}
                    aria-pressed={fuel === f.key}
                    className={cn(
                      'h-10 flex-1 rounded-full text-sm font-medium transition-colors',
                      fuel === f.key ? 'bg-taxi-yellow font-bold text-bg-base' : 'text-text-muted hover:text-text-primary',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-sm text-text-muted">Você economiza até</p>
                <p className="mt-1 font-mono text-[2.2rem] font-bold leading-none text-money-green md:text-[4rem]">
                  R$ <span ref={totalRef}>0</span>
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-muted">IPI federal — {(IPI_RATE[fuel] * 100).toLocaleString('pt-BR')}%</span>
                    <span className="font-mono text-taxi-yellow">R$ <span ref={ipiRef}>0</span></span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-base">
                    <div ref={ipiBarRef} className="h-full origin-left rounded-full bg-taxi-yellow" style={{ transform: 'scaleX(0)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-muted">ICMS SP — 12%</span>
                    <span className="font-mono text-money-green">R$ <span ref={icmsRef}>0</span></span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-base">
                    <div ref={icmsBarRef} className="h-full origin-left rounded-full bg-money-green" style={{ transform: 'scaleX(0)' }} />
                  </div>
                </div>
              </div>

              <p className="mt-6 text-[0.75rem] leading-relaxed text-text-faint">
                Estimativa didática com alíquotas típicas. O valor exato depende do modelo e do deferimento
                pelos órgãos.
              </p>
              <Link
                to="/simulador"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
              >
                Ver detalhe por modelo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}
