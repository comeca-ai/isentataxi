import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** H2 padrão do artigo: Archivo Black 2rem uppercase */
export function ArticleH2({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'font-display text-[2rem] uppercase leading-[0.95] tracking-[-0.01em] text-text-primary',
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Wrapper de seção do artigo com âncora e offset para a navbar */
export function ArticleSection({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-32 border-t border-border-subtle py-14 md:py-16', className)}>
      {children}
    </section>
  );
}

const CALLOUT_STYLES = {
  green: { border: 'bg-money-green', icon: 'text-money-green', bg: 'bg-money-green/[0.07]' },
  red: { border: 'bg-alert-red', icon: 'text-alert-red', bg: 'bg-alert-red/[0.07]' },
  yellow: { border: 'bg-taxi-yellow', icon: 'text-taxi-yellow', bg: 'bg-taxi-yellow/[0.07]' },
} as const;

/**
 * Callout do artigo: border-left colorida que se desenha
 * (scaleY 0→1, origin-top, 400ms) ao entrar no viewport.
 */
export function Callout({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof CALLOUT_STYLES;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const s = CALLOUT_STYLES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative overflow-hidden rounded-r-2xl border border-border-subtle p-5 md:p-6', s.bg)}
    >
      <motion.span
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn('absolute left-0 top-0 h-full w-1 origin-top', s.border)}
        aria-hidden="true"
      />
      <div className="flex items-start gap-3.5 pl-2">
        <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', s.icon)} aria-hidden="true" />
        <p className="text-[1.0625rem] leading-relaxed text-text-primary">{children}</p>
      </div>
    </motion.div>
  );
}

/** Item de checklist com ícone check/x */
export function CheckItem({ ok = true, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          ok ? 'bg-money-green/15 text-money-green' : 'bg-alert-red/15 text-alert-red',
        )}
        aria-hidden="true"
      >
        {ok ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        )}
      </span>
      <span className="text-[1.0625rem] leading-relaxed text-text-primary/90">{children}</span>
    </li>
  );
}
