import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { ICMS_RATE } from '@contracts/constants';
import Eyebrow from '@/components/Eyebrow';
import Reveal, { RevealItem } from '@/components/Reveal';
import { cn } from '@/lib/utils';
import type { CatalogCar } from './catalog';
import { fmtBRL, fuelLabel, pct } from './catalog';

type SortKey = 'name' | 'price' | 'ipi' | 'savings';

function Th({
  label,
  sortKey,
  activeKey,
  onToggle,
  className,
}: {
  label: string;
  sortKey?: SortKey;
  activeKey: SortKey;
  onToggle: (k: SortKey) => void;
  className?: string;
}) {
  return (
    <th className={cn('px-4 py-3.5 text-left text-[0.75rem] font-medium uppercase tracking-[0.08em] text-text-faint', className)}>
      {sortKey ? (
        <button
          type="button"
          onClick={() => onToggle(sortKey)}
          aria-pressed={activeKey === sortKey}
          className="inline-flex items-center gap-1.5 uppercase transition-colors hover:text-taxi-yellow"
          aria-label={`Ordenar por ${label}`}
        >
          {label}
          <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
        </button>
      ) : (
        label
      )}
    </th>
  );
}

/** S4 — Tabela comparativa dos 10 modelos elegíveis */
export default function CompareTable({
  cars,
  selectedSlug,
  onSimulate,
}: {
  cars: CatalogCar[];
  selectedSlug: string;
  onSimulate: (slug: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const data = cars.map((car) => {
      const ipi = car.priceRef * car.ipiRate;
      const icms = car.priceRef * ICMS_RATE;
      return { car, ipi, icms, savings: ipi + icms };
    });
    const dir = asc ? 1 : -1;
    data.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.car.name.localeCompare(b.car.name, 'pt-BR') * dir;
        case 'price':
          return (a.car.priceRef - b.car.priceRef) * dir;
        case 'ipi':
          return (a.car.ipiRate - b.car.ipiRate) * dir;
        case 'savings':
          return (a.savings - b.savings) * dir;
      }
    });
    return data;
  }, [cars, sortKey, asc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === 'name');
    }
  };

  return (
    <section className="asphalt-texture relative bg-bg-surface py-20 md:py-28">
      <div className="absolute inset-0 bg-bg-surface/[0.94]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 md:px-8">
        <Reveal>
          <RevealItem>
            <Eyebrow className="justify-center">Tabela completa</Eyebrow>
          </RevealItem>
          <RevealItem>
            <h2 className="mt-5 text-center font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[3.25rem]">
              Compare os 10 elegíveis
            </h2>
          </RevealItem>
        </Reveal>

        <Reveal delay={0.1}>
          <RevealItem>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-elevated/60">
                    <Th label="Modelo" sortKey="name" activeKey={sortKey} onToggle={toggleSort} />
                    <Th label="Preço ref." sortKey="price" activeKey={sortKey} onToggle={toggleSort} />
                    <Th label="Combustível" activeKey={sortKey} onToggle={toggleSort} />
                    <Th label="IPI est." sortKey="ipi" activeKey={sortKey} onToggle={toggleSort} />
                    <Th label="ICMS" activeKey={sortKey} onToggle={toggleSort} />
                    <Th label="Economia total" sortKey="savings" activeKey={sortKey} onToggle={toggleSort} />
                    <Th label="" activeKey={sortKey} onToggle={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ car, ipi, icms, savings }, i) => {
                    const selected = car.slug === selectedSlug;
                    return (
                      <motion.tr
                        layout
                        key={car.slug}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-10% 0px' }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                        className={cn(
                          'border-b border-border-subtle/60 transition-colors last:border-0 hover:bg-bg-elevated',
                          selected && 'bg-taxi-yellow/5 shadow-[inset_3px_0_0_#FACC15]',
                        )}
                      >
                        <td className="px-4 py-3.5 font-bold text-text-primary">{car.name}</td>
                        <td className="px-4 py-3.5 font-mono text-text-muted">R$ {fmtBRL(car.priceRef)}</td>
                        <td className="px-4 py-3.5 text-text-muted">{fuelLabel(car.fuel)}</td>
                        <td className="px-4 py-3.5 font-mono text-taxi-yellow">
                          {pct(car.ipiRate)} · R$ {fmtBRL(ipi)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-money-green">R$ {fmtBRL(icms)}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-money-green">R$ {fmtBRL(savings)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onSimulate(car.slug)}
                            className="font-medium text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
                          >
                            Simular
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </RevealItem>
        </Reveal>
        <p className="mt-4 text-center text-[0.8125rem] text-text-faint">
          Valores estimados (IPI + ICMS) com as alíquotas típicas de 2026. Sempre uma estimativa — sem promessa.
        </p>
      </div>
    </section>
  );
}
