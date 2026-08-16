import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgePercent, Info, Landmark } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { keepPreviousData } from '@tanstack/react-query';
import type { FuelType } from '@contracts/constants';
import { IPI_RATES, IPVA_FIRST_YEAR_NOTE, IPVA_RATE, TETO_PRECO } from '@contracts/constants';
import Eyebrow from '@/components/Eyebrow';
import { Toaster } from '@/components/ui/sonner';
import { trpc } from '@/providers/trpc';
import { cn } from '@/lib/utils';
import type { CatalogCar } from '@/components/simulador/catalog';
import { FALLBACK_CATALOG, localCalculate, normalizeVehicles } from '@/components/simulador/catalog';
import SimulatorStage, { type SimMode } from '@/components/simulador/SimulatorStage';
import ResultPanel from '@/components/simulador/ResultPanel';
import LeadModal from '@/components/simulador/LeadModal';
import CompareTable from '@/components/simulador/CompareTable';
import EducSection from '@/components/simulador/EducSection';

/** Stub público — mantido para páginas ainda em construção (ex.: Guia). */
export function PageStub({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-7xl flex-col items-start justify-center px-5 py-20 md:px-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-5 font-display text-[2.6rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[4rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-lg text-text-muted">{description}</p>
    </section>
  );
}

interface SimState {
  mode: SimMode;
  slug: string;
  price: number;
  fuel: FuelType;
}

const LS_KEY = 'itx_sim';

function loadState(): Partial<SimState> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<SimState>;
  } catch {
    return {};
  }
}

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

const H1_WORDS = 'QUANTO SEU PRÓXIMO TÁXI PODE SAIR MAIS BARATO?'.split(' ');

const TRUST_CHIPS = [
  { icon: BadgePercent, label: 'IPI 0–13%' },
  { icon: Landmark, label: 'ICMS SP 12%' },
  { icon: Info, label: 'Estimativa, sem promessa' },
];

export default function Simulador() {
  const [searchParams] = useSearchParams();
  const carroParam = searchParams.get('carro');

  const [savedSim] = useState(() => loadState());
  const [mode, setMode] = useState<SimMode>(() => (savedSim.mode === 'preco' ? 'preco' : 'modelo'));
  const [slug, setSlug] = useState<string>(() => savedSim.slug ?? FALLBACK_CATALOG[0].slug);
  const [price, setPrice] = useState<number>(() => savedSim.price ?? 120_000);
  const [fuel, setFuel] = useState<FuelType>(() => savedSim.fuel ?? 'flex');
  const [leadOpen, setLeadOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const vehiclesQuery = trpc.vehicles.list.useQuery();
  const cars: CatalogCar[] = useMemo(
    () => (vehiclesQuery.data?.length ? normalizeVehicles(vehiclesQuery.data) : FALLBACK_CATALOG),
    [vehiclesQuery.data],
  );

  // Deep-link ?carro=<slug> — pré-seleciona e rola ao palco
  useEffect(() => {
    if (carroParam && cars.some((c) => c.slug === carroParam)) {
      setMode('modelo');
      setSlug(carroParam);
      window.setTimeout(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carroParam, vehiclesQuery.data]);

  // Persistência local (restaura na volta)
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ mode, slug, price, fuel }));
  }, [mode, slug, price, fuel]);

  const selectedCar = cars.find((c) => c.slug === slug) ?? cars[0];
  const overLimit = mode === 'preco' && price > TETO_PRECO;

  // Cálculo local instantâneo (mesma fórmula do backend)
  const local = useMemo(
    () =>
      mode === 'modelo'
        ? localCalculate(selectedCar.priceRef, selectedCar.ipiRate)
        : localCalculate(price || 80_000, IPI_RATES[fuel]),
    [mode, selectedCar, price, fuel],
  );

  // Backend real (fonte da verdade) — debounced para o slider
  const debouncedPrice = useDebounced(price, 250);
  const calcInput =
    mode === 'modelo'
      ? { vehicleId: selectedCar.id }
      : { customPrice: debouncedPrice || 80_000, fuel };
  const calcQuery = trpc.simulator.calculate.useQuery(calcInput, {
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
  });

  const server = calcQuery.data;
  const base = server
    ? {
        price: server.price,
        ipiRate: server.ipiRate,
        ipiValue: server.ipiValue,
        icmsValue: server.icmsValue,
        totalSavings: server.totalSavings,
        finalPrice: server.finalPrice,
      }
    : local;
  const displayed = {
    ...base,
    ipvaAnnual: server?.ipvaAnnual ?? Math.round(base.price * IPVA_RATE),
    ipvaNote: server?.ipvaNote ?? IPVA_FIRST_YEAR_NOTE,
  };

  const tetoMessage = `A isenção vale para carros de até R$ ${TETO_PRECO.toLocaleString('pt-BR')}. Este valor passa do teto — fale com a gente no WhatsApp para avaliar seu caso.`;
  const error = overLimit ? (calcQuery.error?.message ?? tetoMessage) : null;

  // Guarda última estimativa para ecoar no resultado da pré-análise
  useEffect(() => {
    if (error) return;
    localStorage.setItem(
      'itx_sim_last',
      JSON.stringify({
        economia: Math.round(displayed.totalSavings),
        modelo: mode === 'modelo' ? selectedCar.name : 'Preço personalizado',
      }),
    );
  }, [displayed.totalSavings, mode, selectedCar.name, error]);

  const selectFromTable = useCallback((s: string) => {
    setMode('modelo');
    setSlug(s);
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const snapshot = {
    modelo: mode === 'modelo' ? selectedCar.name : 'Preço personalizado',
    slug: mode === 'modelo' ? selectedCar.slug : null,
    precoRef: displayed.price,
    combustivel: mode === 'modelo' ? selectedCar.fuel : fuel,
    ipiEstimado: Math.round(displayed.ipiValue),
    icmsEstimado: Math.round(displayed.icmsValue),
    economiaEstimada: Math.round(displayed.totalSavings),
    origem: 'simulador',
  };

  return (
    <>
      <Toaster theme="dark" position="bottom-center" />

      {/* S1 — Header */}
      <section className="pb-10 pt-24">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow className="justify-center">Simulador grátis — sem cadastro</Eyebrow>
          </motion.div>
          <h1
            className="mt-6 font-display text-[2.2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]"
            aria-label="Quanto seu próximo táxi pode sair mais barato?"
          >
            {H1_WORDS.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%', rotate: 4 }}
                  animate={{ y: '0%', rotate: 0 }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                  {i < H1_WORDS.length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-xl leading-relaxed text-text-muted"
          >
            Escolha o carro ou arraste o preço. A gente calcula a estimativa de IPI + ICMS na hora, com as
            alíquotas vigentes em 2026.
          </motion.p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {TRUST_CHIPS.map((chip, i) => (
              <motion.span
                key={chip.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.55 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3.5 py-1.5',
                  'text-[0.8125rem] font-medium text-text-muted',
                )}
              >
                <chip.icon className="h-3.5 w-3.5 text-taxi-yellow" aria-hidden="true" />
                {chip.label}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* S2 — Palco do simulador */}
      <section className="pb-20 md:pb-28" ref={stageRef}>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[1fr_420px]">
          <SimulatorStage
            mode={mode}
            onMode={setMode}
            cars={cars}
            selectedSlug={selectedCar.slug}
            onSelectSlug={setSlug}
            price={price}
            onPrice={setPrice}
            fuel={fuel}
            onFuel={setFuel}
            overLimit={overLimit}
          />
          <ResultPanel
            car={mode === 'modelo' ? selectedCar : null}
            manual={mode === 'preco'}
            data={{ ...displayed, fuel: mode === 'modelo' ? selectedCar.fuel : fuel }}
            error={error}
            onOpenLead={() => setLeadOpen(true)}
          />
        </div>
      </section>

      {/* S4 — Tabela comparativa */}
      <CompareTable cars={cars} selectedSlug={mode === 'modelo' ? selectedCar.slug : ''} onSimulate={selectFromTable} />

      {/* S5 — Educativo + CTA */}
      <EducSection />

      {/* S3 — Modal de captura de lead */}
      <LeadModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        modelName={mode === 'modelo' ? selectedCar.name : 'seu carro'}
        snapshot={snapshot}
      />
    </>
  );
}
