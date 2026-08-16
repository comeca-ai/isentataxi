import { cn } from '@/lib/utils';

/** Eyebrow padrão: quadrinho zebrado 24×10px + label amarelo uppercase */
export default function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="zebra-fine inline-block h-[10px] w-6 shrink-0" aria-hidden="true" />
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-taxi-yellow">{children}</span>
    </div>
  );
}
