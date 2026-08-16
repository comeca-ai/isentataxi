import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const TOC_ITEMS = [
  { id: 'isencoes', label: 'O que são as isenções' },
  { id: 'ipva', label: 'IPVA: isenção total, todo ano' },
  { id: 'quem-pode', label: 'Quem pode' },
  { id: 'carro', label: 'Qual carro pode' },
  { id: 'etapas', label: 'As 7 etapas, órgão por órgão' },
  { id: 'prazos', label: 'Prazos e pegadinhas' },
  { id: 'faq', label: 'FAQ legislativo + fontes' },
] as const;

/** TOC sticky com indicador de seção ativa (bullet amarelo desliza via layoutId) */
export default function Toc() {
  const [active, setActive] = useState<string>(TOC_ITEMS[0].id);

  useEffect(() => {
    const sections = TOC_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-25% 0px -65% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Sumário do guia" className="sticky top-28 hidden lg:block">
      <p className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.14em] text-text-faint">Neste guia</p>
      <ul className="mt-4 space-y-1 border-l border-border-subtle">
        {TOC_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="relative">
              {isActive && (
                <motion.span
                  layoutId="toc-bullet"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-taxi-yellow"
                  aria-hidden="true"
                />
              )}
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'block py-2 pl-5 text-sm transition-colors duration-200',
                  isActive ? 'font-semibold text-taxi-yellow' : 'text-text-muted hover:text-text-primary',
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
