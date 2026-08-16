import { Link } from 'react-router';
import { CARS, formatMil } from '@/data/cars';

/** S3 — Marquee infinito de carros: miniatura + modelo + economia estimada */
export default function CarMarquee() {
  return (
    <section className="marquee-paused overflow-hidden border-y border-border-subtle bg-bg-surface py-5" aria-label="Carros com isenção">
      <div className="marquee-track flex w-max animate-marquee items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {CARS.map((car) => (
              <Link
                key={`${copy}-${car.slug}`}
                to={`/simulador?carro=${car.slug}`}
                className="group mx-3 flex items-center gap-3 rounded-full border border-border-subtle bg-bg-elevated py-2 pl-2 pr-5 transition-transform duration-200 hover:scale-105"
              >
                <img
                  src={car.image}
                  alt={car.name}
                  loading="lazy"
                  className="h-16 w-24 rounded-full object-cover"
                />
                <span className="whitespace-nowrap text-sm font-medium text-text-primary">{car.name}</span>
                <span className="whitespace-nowrap font-mono text-sm font-bold text-taxi-yellow transition-colors group-hover:text-money-green">
                  economia até R$ {formatMil(car.economy)}
                  <span className="ml-1 text-[0.6rem] font-normal text-text-faint">estimativa</span>
                </span>
                <span className="zebra-fine ml-2 inline-block h-3 w-3 rotate-45" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
