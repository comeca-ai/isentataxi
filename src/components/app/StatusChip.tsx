import { cn } from '@/lib/utils';
import type { StatusMeta } from './client-utils';

/** Chip de status pill 0.75rem mono (verde/azul/âmbar/zinco/vermelho) */
export default function StatusChip({
  meta,
  className,
}: {
  meta: StatusMeta;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.75rem] leading-5',
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
