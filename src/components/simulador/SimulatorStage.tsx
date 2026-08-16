import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { FuelType } from '@contracts/constants';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { CatalogCar } from './catalog';
import { fmtBRL, fuelLabel, pct } from './catalog';

export type SimMode = 'modelo' | 'preco';

const FUELS: { key: FuelType; label: string }[] = [
  { key: 'flex', label: 'Flex' },
  { key: 'hibrido', label: 'Híbrido' },
  { key: 'eletrico', label: 'Elétrico' },
];

/** Segmented control "Por modelo | Por preço" */
function ModeSwitch({ mode, onChange }: { mode: SimMode; onChange: (m: SimMode) => void }) {
  return (
    <div
      className="inline-flex rounded-full border border-border-subtle bg-bg-elevated p-1"
      role="tablist"
      aria-label="Modo do simulador"
    >
      {(
        [
          { key: 'modelo', label: 'Por modelo' },
          { key: 'preco', label: 'Por preço' },
        ] as const
      ).map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={mode === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative h-11 rounded-full px-6 text-sm font-medium transition-colors',
            mode === tab.key ? 'text-bg-base' : 'text-text-muted hover:text-text-primary',
          )}
        >
          {mode === tab.key && (
            <motion.span
              layoutId="sim-mode-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="absolute inset-0 rounded-full bg-taxi-yellow"
            />
          )}
          <span className="relative z-10 font-bold">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function FuelChip({ fuel }: { fuel: FuelType }) {
  const greenDot = fuel !== 'flex';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[0.75rem] font-medium text-text-muted">
      {greenDot && <span className="h-1.5 w-1.5 rounded-full bg-money-green" aria-hidden="true" />}
      {fuelLabel(fuel)}
    </span>
  );
}

function CarCard({
  car,
  selected,
  onSelect,
  index,
}: {
  car: CatalogCar;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      aria-pressed={selected}
      className={cn(
        'group relative rounded-2xl border bg-bg-surface p-4 text-left transition-colors duration-200',
        selected ? 'border-taxi-yellow' : 'border-border-subtle hover:border-taxi-yellow/40',
      )}
    >
      {selected && (
        <motion.span
          layoutId="sim-selected-ring"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="pointer-events-none absolute -inset-[3px] rounded-[18px] border-2 border-taxi-yellow"
          aria-hidden="true"
        />
      )}
      {selected && (
        <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-taxi-yellow px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wide text-bg-base">
          <Check className="h-3 w-3" aria-hidden="true" />
          Selecionado
        </span>
      )}
      <div className="overflow-hidden rounded-xl bg-[#1B1B1F]">
        <img
          src={car.imageUrl}
          alt={car.name}
          loading="lazy"
          className="aspect-[8/5] w-full object-cover transition-transform duration-200 group-hover:scale-[1.06]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-[0.9375rem] font-bold leading-snug text-text-primary">{car.name}</p>
        <span className="shrink-0 text-[0.75rem] text-text-faint">2026</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[0.9375rem] text-text-primary">R$ {fmtBRL(car.priceRef)}</span>
        <FuelChip fuel={car.fuel} />
      </div>
    </motion.button>
  );
}

function ManualMode({
  price,
  onPrice,
  fuel,
  onFuel,
  overLimit,
}: {
  price: number;
  onPrice: (v: number) => void;
  fuel: FuelType;
  onFuel: (f: FuelType) => void;
  overLimit: boolean;
}) {
  const handleInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 7);
    if (!digits) return onPrice(0);
    onPrice(Number(digits));
  };

  return (
    <motion.div
      key="modo-preco"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border-subtle bg-bg-surface p-6 md:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <label htmlFor="sim-price" className="text-sm font-medium text-text-muted">
          Preço do carro 0 km
        </label>
        <div className="flex items-baseline gap-2 font-mono text-2xl font-bold text-text-primary">
          <span className="text-text-faint">R$</span>
          <input
            id="sim-price"
            inputMode="numeric"
            value={price ? fmtBRL(price) : ''}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="150.000"
            aria-label="Preço do carro em reais"
            className={cn(
              'w-40 rounded-xl border bg-bg-base px-3 py-1.5 text-right outline-none transition-colors',
              overLimit ? 'border-alert-red' : 'border-border-subtle focus:border-taxi-yellow',
            )}
          />
        </div>
      </div>
      <Slider
        min={80_000}
        max={200_000}
        step={1_000}
        value={[Math.min(Math.max(price, 80_000), 200_000) || 80_000]}
        onValueChange={([v]) => onPrice(v)}
        className="mt-6 [&_[data-slot=slider-range]]:bg-taxi-yellow [&_[data-slot=slider-thumb]]:h-6 [&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:border-taxi-yellow [&_[data-slot=slider-thumb]]:bg-taxi-yellow [&_[data-slot=slider-thumb]]:ring-taxi-yellow/40 [&_[data-slot=slider-track]]:bg-border-strong"
        aria-label="Preço do carro 0 km"
      />
      <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-text-faint">
        <span>R$ 80 mil</span>
        <span>R$ 200 mil</span>
      </div>

      <p className="mt-8 text-sm font-medium text-text-muted">Combustível</p>
      <div
        className="mt-3 flex rounded-full border border-border-subtle bg-bg-base p-1"
        role="group"
        aria-label="Combustível"
      >
        {FUELS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFuel(f.key)}
            aria-pressed={fuel === f.key}
            className={cn(
              'h-11 flex-1 rounded-full text-sm font-medium transition-colors',
              fuel === f.key ? 'bg-taxi-yellow font-bold text-bg-base' : 'text-text-muted hover:text-text-primary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[0.8125rem] text-text-faint">
        IPI estimado: Flex 11% · Híbrido 6,5% · Elétrico 3% — ICMS SP sempre 12%.
      </p>
    </motion.div>
  );
}

/** S2a — Catálogo de carros + modo manual "Por preço" */
export default function SimulatorStage({
  mode,
  onMode,
  cars,
  selectedSlug,
  onSelectSlug,
  price,
  onPrice,
  fuel,
  onFuel,
  overLimit,
}: {
  mode: SimMode;
  onMode: (m: SimMode) => void;
  cars: CatalogCar[];
  selectedSlug: string;
  onSelectSlug: (slug: string) => void;
  price: number;
  onPrice: (v: number) => void;
  fuel: FuelType;
  onFuel: (f: FuelType) => void;
  overLimit: boolean;
}) {
  return (
    <div>
      <ModeSwitch mode={mode} onChange={onMode} />
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {mode === 'modelo' ? (
            <motion.div
              key="modo-modelo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {cars.map((car, i) => (
                <CarCard
                  key={car.slug}
                  car={car}
                  index={i}
                  selected={car.slug === selectedSlug}
                  onSelect={() => onSelectSlug(car.slug)}
                />
              ))}
            </motion.div>
          ) : (
            <ManualMode price={price} onPrice={onPrice} fuel={fuel} onFuel={onFuel} overLimit={overLimit} />
          )}
        </AnimatePresence>
      </div>
      <p className="mt-4 text-[0.8125rem] text-text-faint">
        {mode === 'modelo'
          ? 'Toque em um modelo para ver a estimativa ao lado. IPI estimado: 11% a 13% (flex), 6,5% (híbrido), 3% (elétrico).'
          : `IPI ${pct({ flex: 0.11, hibrido: 0.065, eletrico: 0.03 }[fuel])} + ICMS 12% aplicados sobre o preço informado.`}
      </p>
    </div>
  );
}
