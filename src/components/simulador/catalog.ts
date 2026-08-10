import type { FuelType } from '@contracts/constants';
import { FUEL_TYPES, ICMS_RATE, IPI_RATES } from '@contracts/constants';
import { CARS } from '@/data/cars';

/** Modelo normalizado usado no palco do simulador (catálogo real ou fallback). */
export interface CatalogCar {
  id: number;
  slug: string;
  name: string;
  brand: string;
  priceRef: number;
  fuel: FuelType;
  ipiRate: number;
  imageUrl: string;
}

/** Dados de fallback (espelho do seed) enquanto `vehicles.list` carrega. */
const FALLBACK_SPECS: Record<string, { brand: string; priceRef: number; fuel: FuelType; ipiRate: number }> = {
  cronos: { brand: 'Fiat', priceRef: 100_000, fuel: 'flex', ipiRate: 0.11 },
  virtus: { brand: 'Volkswagen', priceRef: 115_000, fuel: 'flex', ipiRate: 0.11 },
  hb20s: { brand: 'Hyundai', priceRef: 105_000, fuel: 'flex', ipiRate: 0.11 },
  onixplus: { brand: 'Chevrolet', priceRef: 102_000, fuel: 'flex', ipiRate: 0.11 },
  versa: { brand: 'Nissan', priceRef: 110_000, fuel: 'flex', ipiRate: 0.11 },
  yaris: { brand: 'Toyota', priceRef: 120_000, fuel: 'flex', ipiRate: 0.11 },
  corolla: { brand: 'Toyota', priceRef: 160_000, fuel: 'flex', ipiRate: 0.13 },
  'corolla-hybrid': { brand: 'Toyota', priceRef: 190_000, fuel: 'hibrido', ipiRate: 0.065 },
  'byd-dolphin': { brand: 'BYD', priceRef: 120_000, fuel: 'eletrico', ipiRate: 0.03 },
  city: { brand: 'Honda', priceRef: 150_000, fuel: 'flex', ipiRate: 0.13 },
};

/** Catálogo local (fallback): usa imagens/nomes curtos de `src/data/cars.ts` + specs do seed. */
export const FALLBACK_CATALOG: CatalogCar[] = CARS.map((car, i) => {
  const spec = FALLBACK_SPECS[car.slug];
  return {
    id: i + 1,
    slug: car.slug,
    name: spec ? car.name : car.name,
    brand: spec?.brand ?? '',
    priceRef: spec?.priceRef ?? 0,
    fuel: spec?.fuel ?? 'flex',
    ipiRate: spec?.ipiRate ?? IPI_RATES.flex,
    imageUrl: car.image,
  };
});

export interface VehicleRow {
  id: number;
  slug: string;
  name: string;
  brand: string;
  priceRef: number;
  fuel: FuelType;
  ipiRate: string | number;
  imageUrl: string;
  sortOrder: number;
}

/** Normaliza veículos vindos do backend (ipiRate decimal string) para o palco. */
export function normalizeVehicles(rows: VehicleRow[]): CatalogCar[] {
  return rows.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    brand: v.brand,
    priceRef: v.priceRef,
    fuel: v.fuel,
    ipiRate: Number(v.ipiRate),
    imageUrl: v.imageUrl,
  }));
}

export const fmtBRL = (v: number) => Math.round(v).toLocaleString('pt-BR');

export const pct = (rate: number) =>
  `${(rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export const fuelLabel = (fuel: FuelType) => FUEL_TYPES[fuel];

export interface LocalCalc {
  price: number;
  ipiRate: number;
  ipiValue: number;
  icmsValue: number;
  totalSavings: number;
  finalPrice: number;
}

/** Cálculo local instantâneo (mesma fórmula do backend) — usado como feedback imediato. */
export function localCalculate(price: number, ipiRate: number): LocalCalc {
  const ipiValue = price * ipiRate;
  const icmsValue = price * ICMS_RATE;
  const totalSavings = ipiValue + icmsValue;
  return { price, ipiRate, ipiValue, icmsValue, totalSavings, finalPrice: price - totalSavings };
}

/** Arredonda para centena — padrão "estimativa" do design. */
export const snap100 = (v: number) => Math.round(v / 100) * 100;
