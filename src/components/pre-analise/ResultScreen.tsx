import { motion } from 'framer-motion';
import { ArrowRight, Check, CircleAlert, Loader2, MessageCircle, RefreshCw, TriangleAlert, XCircle } from 'lucide-react';
import { Link } from 'react-router';
import { LOGIN_PATH } from '@/const';
import { fmtBRL } from '@/components/simulador/catalog';
import { WHATSAPP_URL } from '@contracts/constants';
import type { Evaluation } from './questions';
import { ZebraConfetti } from './ZebraConfetti';

/** Selo de sucesso — réplica inline de /success-check.svg com draw do check (600ms) */
function SuccessSeal() {
  return (
    <svg width="120" height="120" viewBox="0 0 240 240" fill="none" role="img" aria-label="Selo de elegível">
      <circle cx="120" cy="120" r="116" fill="#0A0A0B" />
      <circle
        cx="120" cy="120" r="104" fill="none" stroke="#FACC15" strokeWidth="16"
        strokeDasharray="27.23 27.23" transform="rotate(-11.25 120 120)"
      />
      <circle cx="120" cy="120" r="88" fill="#0A0A0B" />
      <circle cx="120" cy="120" r="88" fill="none" stroke="#27272A" strokeWidth="1.5" />
      <motion.path
        d="M78 124 l30 30 l56 -64"
        stroke="#FAFAFA" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
      />
    </svg>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export interface EconomyEcho {
  economia: number;
  modelo: string;
}

/** Tela de resultado — 3 variações (elegível / pendências / não elegível) */
export default function ResultScreen({
  evaluation,
  echo,
  submitStatus,
  onRetrySubmit,
}: {
  evaluation: Evaluation;
  echo: EconomyEcho | null;
  submitStatus: 'pending' | 'success' | 'error';
  onRetrySubmit: () => void;
}) {
  const { result, pendencias, motivoNaoElegivel } = evaluation;

  const resumoWhats = encodeURIComponent(
    result === 'elegivel'
      ? `Oi! Fiz a pré-análise da IsentaTáxi e deu ELEGÍVEL${echo ? ` (economia estimada de R$ ${fmtBRL(echo.economia)} no ${echo.modelo})` : ''}. Quero começar.`
      : result === 'pendencias'
        ? `Oi! Fiz a pré-análise da IsentaTáxi e tenho ${pendencias.length} pendência(s): ${pendencias.join(' | ')}`
        : 'Oi! Fiz a pré-análise da IsentaTáxi e quero entender minha situação.',
  );

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-5 py-16 md:px-8">
      {result === 'elegivel' && <ZebraConfetti />}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 0%, rgba(250,204,21,0.10), transparent 70%)' }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface"
      >
        <div className="zebra-fine h-1 w-full" aria-hidden="true" />
        <motion.div variants={container} initial="hidden" animate="show" className="p-8 text-center md:p-10">
          {/* Selo / ícone */}
          <motion.div variants={item} className="flex justify-center">
            {result === 'elegivel' ? (
              <SuccessSeal />
            ) : result === 'pendencias' ? (
              <span className="flex h-[104px] w-[104px] items-center justify-center rounded-full border-2 border-warn-amber/50 bg-warn-amber/10">
                <TriangleAlert className="h-12 w-12 text-warn-amber" aria-hidden="true" />
              </span>
            ) : (
              <span className="flex h-[104px] w-[104px] items-center justify-center rounded-full border-2 border-border-strong bg-bg-elevated">
                <XCircle className="h-12 w-12 text-text-faint" aria-hidden="true" />
              </span>
            )}
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-[1.9rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[2.4rem]"
          >
            {result === 'elegivel'
              ? 'Você pode comprar com desconto.'
              : result === 'pendencias'
                ? 'Quase lá — falta pouco.'
                : 'Agora ainda não — mas tem caminho.'}
          </motion.h1>

          {/* A — ELEGÍVEL */}
          {result === 'elegivel' && (
            <>
              <motion.p variants={item} className="mt-4 font-mono text-lg font-bold text-money-green">
                {echo
                  ? `Economia estimada: até R$ ${fmtBRL(echo.economia)} (${echo.modelo})`
                  : 'Economia estimada: R$ 15 mil – R$ 45 mil'}
              </motion.p>
              <motion.ul variants={item} className="mx-auto mt-6 max-w-sm space-y-3 text-left">
                {['1. Criar sua conta grátis', '2. Enviar documentos', '3. A gente protocola nos órgãos'].map(
                  (step) => (
                    <li key={step} className="flex items-center gap-2.5 text-sm text-text-muted">
                      <Check className="h-4 w-4 shrink-0 text-money-green" aria-hidden="true" />
                      {step}
                    </li>
                  ),
                )}
              </motion.ul>
            </>
          )}

          {/* B — PENDÊNCIAS */}
          {result === 'pendencias' && (
            <>
              <motion.ul variants={item} className="mx-auto mt-6 max-w-sm space-y-3 text-left">
                {pendencias.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 rounded-xl border border-warn-amber/30 bg-warn-amber/10 p-3 text-left text-[0.8125rem] leading-snug text-text-primary">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn-amber" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </motion.ul>
              <motion.p variants={item} className="mt-5 text-sm leading-relaxed text-text-muted">
                Nosso especialista te ajuda a destravar cada item — sem custo na fase de descoberta.
              </motion.p>
            </>
          )}

          {/* C — NÃO ELEGÍVEL */}
          {result === 'nao_elegivel' && (
            <motion.p variants={item} className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-text-muted">
              {motivoNaoElegivel ??
                'Pelas respostas, o benefício não se aplica agora. Mas a regra tem caminhos — vale conversar com um humano.'}
            </motion.p>
          )}

          {/* Status do envio do resultado */}
          <motion.div variants={item} className="mt-6" aria-live="polite">
            {submitStatus === 'pending' && (
              <p className="inline-flex items-center gap-2 text-[0.8125rem] text-text-faint">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Enviando resultado…
              </p>
            )}
            {submitStatus === 'error' && (
              <button
                type="button"
                onClick={onRetrySubmit}
                className="inline-flex items-center gap-2 rounded-full border border-alert-red/50 bg-alert-red/10 px-4 py-2 text-[0.8125rem] font-medium text-text-primary transition-colors hover:border-alert-red"
              >
                <RefreshCw className="h-3.5 w-3.5 text-alert-red" aria-hidden="true" />
                Não conseguimos enviar. Tentar de novo
              </button>
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 space-y-3"
          >
            {result === 'nao_elegivel' ? (
              <>
                <a
                  href={`${WHATSAPP_URL}?text=${resumoWhats}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:scale-[1.02] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Tirar dúvida com humano no WhatsApp
                </a>
                <Link
                  to="/guia"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border-strong font-medium text-text-primary transition-colors hover:bg-taxi-yellow/10"
                >
                  Ler o guia
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={LOGIN_PATH}
                  className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:scale-[1.02] hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
                >
                  {result === 'elegivel' ? 'Criar conta grátis e começar' : 'Criar conta e resolver pendências'}
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <a
                  href={`${WHATSAPP_URL}?text=${resumoWhats}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border-strong font-medium text-text-primary transition-colors hover:bg-taxi-yellow/10"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Falar com especialista no WhatsApp
                </a>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
