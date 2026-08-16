export interface CarModel {
  slug: string;
  name: string;
  image: string;
  /** Economia máxima estimada em R$ */
  economy: number;
}

export const CARS: CarModel[] = [
  { slug: 'cronos', name: 'Fiat Cronos', image: '/car-cronos.png', economy: 23000 },
  { slug: 'virtus', name: 'VW Virtus', image: '/car-virtus.png', economy: 26500 },
  { slug: 'hb20s', name: 'Hyundai HB20S', image: '/car-hb20s.png', economy: 24000 },
  { slug: 'onixplus', name: 'Chevrolet Onix Plus', image: '/car-onixplus.png', economy: 23500 },
  { slug: 'versa', name: 'Nissan Versa', image: '/car-versa.png', economy: 25500 },
  { slug: 'yaris', name: 'Toyota Yaris Sedã', image: '/car-yaris.png', economy: 27500 },
  { slug: 'corolla', name: 'Toyota Corolla GLi', image: '/car-corolla.png', economy: 40000 },
  { slug: 'corolla-hybrid', name: 'Toyota Corolla Altis Hybrid', image: '/car-corolla-hybrid.png', economy: 35000 },
  { slug: 'byd-dolphin', name: 'BYD Dolphin Mini', image: '/car-byd-dolphin.png', economy: 19000 },
  { slug: 'city', name: 'Honda City', image: '/car-city.png', economy: 37500 },
];

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

/** "23 mil" / "26,5 mil" */
export function formatMil(value: number): string {
  const k = value / 1000;
  return `${k.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
}
