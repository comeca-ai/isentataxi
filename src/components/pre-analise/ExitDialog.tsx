import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { isValidWhatsapp, maskWhatsapp } from '@/components/simulador/whatsapp';

/** Modal de saída (X) — "Seu progresso fica salvo por 7 dias" + captura mínima de WhatsApp */
export default function ExitDialog({
  open,
  onStay,
  onLeave,
  onSaveAndLeave,
  saving,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave: (whatsapp: string) => void;
  saving: boolean;
}) {
  const [whatsapp, setWhatsapp] = useState('');
  const canSave = isValidWhatsapp(whatsapp);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={onStay}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sair da pré-análise"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-elevated p-7"
          >
            <h2 className="text-xl font-bold text-text-primary">Sair da pré-análise?</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Seu progresso fica salvo por 7 dias — você pode continuar de onde parou.
            </p>

            <label htmlFor="exit-zap" className="mt-5 block text-sm font-medium text-text-muted">
              Quer receber o resumo no WhatsApp antes de sair? (opcional)
            </label>
            <input
              id="exit-zap"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
              placeholder="(11) 91234-5678"
              inputMode="tel"
              className="mt-2 h-12 w-full rounded-xl border border-border-subtle bg-bg-base px-4 font-mono text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-taxi-yellow focus:ring-2 focus:ring-taxi-yellow/40"
            />

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={onStay}
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
              >
                Continuar respondendo
              </button>
              <button
                type="button"
                disabled={!canSave || saving}
                onClick={() => onSaveAndLeave(whatsapp)}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border-strong font-medium text-text-primary transition-colors hover:bg-taxi-yellow/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar e receber por WhatsApp
              </button>
              <button
                type="button"
                onClick={onLeave}
                className="w-full text-center text-sm font-medium text-text-faint transition-colors hover:text-text-muted"
              >
                Sair sem informar WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
