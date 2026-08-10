import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { fmtBRL } from './catalog';
import { isValidWhatsapp, loadStoredContact, maskWhatsapp } from './whatsapp';

/** Conteúdo do modal — montado só quando aberto, então o estado reinicia a cada abertura */
function ModalContent({
  onClose,
  modelName,
  snapshot,
}: {
  onClose: () => void;
  modelName: string;
  snapshot: Record<string, unknown>;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(() => loadStoredContact()?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(() => loadStoredContact()?.whatsapp ?? '');
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  const saveLead = trpc.simulator.saveLead.useMutation();
  const valid = name.trim().length >= 2 && isValidWhatsapp(whatsapp) && consent;
  const economia = typeof snapshot.economiaEstimada === 'number' ? snapshot.economiaEstimada : null;

  const submit = () => {
    if (!valid || saveLead.isPending) return;
    const cleanName = name.trim();
    saveLead.mutate(
      { name: cleanName, whatsapp, simulationSnapshot: snapshot },
      {
        onSuccess: ({ id }) => {
          localStorage.setItem('itx_contact', JSON.stringify({ name: cleanName, whatsapp, leadId: id }));
          setDone(true);
          toast.success('Análise a caminho! Agora confirme sua elegibilidade (2 min)');
          window.setTimeout(() => {
            onClose();
            navigate(`/pre-analise?lead=${id}`);
          }, 700);
        },
        onError: (err) => {
          toast.error(err.message || 'Não foi possível enviar. Tente de novo.');
        },
      },
    );
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold leading-snug text-text-primary">
          Receba a análise completa do {modelName}
        </h3>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {economia != null && (
        <p className="mt-3 font-mono text-sm text-text-muted">
          Economia estimada: <span className="font-bold text-money-green">R$ {fmtBRL(economia)}</span>
        </p>
      )}

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium text-text-muted">
            Nome
          </label>
          <input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            className="h-12 w-full rounded-xl border border-border-subtle bg-bg-base px-4 text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-taxi-yellow focus:ring-2 focus:ring-taxi-yellow/40"
          />
        </div>
        <div>
          <label htmlFor="lead-zap" className="mb-1.5 block text-sm font-medium text-text-muted">
            WhatsApp
          </label>
          <input
            id="lead-zap"
            value={whatsapp}
            onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
            placeholder="(11) 91234-5678"
            inputMode="tel"
            autoComplete="tel"
            className="h-12 w-full rounded-xl border border-border-subtle bg-bg-base px-4 font-mono text-text-primary outline-none transition-colors placeholder:text-text-faint focus:border-taxi-yellow focus:ring-2 focus:ring-taxi-yellow/40"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[0.8125rem] leading-snug text-text-muted">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#FACC15]"
          />
          Aceito ser contatado pela IsentaTáxi sobre meu benefício.
        </label>

        <button
          type="submit"
          disabled={!valid || saveLead.isPending || done}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-taxi-yellow font-bold text-bg-base transition-all duration-200 hover:bg-taxi-yellow-hover hover:shadow-cta-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {done ? (
            <>
              <Check className="h-5 w-5 text-money-green" aria-hidden="true" />
              Enviado!
            </>
          ) : saveLead.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            'Receber no WhatsApp'
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          onClose();
          navigate('/pre-analise');
        }}
        className="mt-4 w-full text-center text-sm font-medium text-text-muted transition-colors hover:text-taxi-yellow"
      >
        Prefiro só fazer a pré-análise
      </button>
    </>
  );
}

/** S3 — Modal de captura de lead do simulador */
export default function LeadModal({
  open,
  onClose,
  modelName,
  snapshot,
}: {
  open: boolean;
  onClose: () => void;
  modelName: string;
  snapshot: Record<string, unknown>;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Receba a análise completa do ${modelName}`}
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated"
          >
            <div className="zebra-fine h-1 w-full" aria-hidden="true" />
            <div className="p-7">
              <ModalContent onClose={onClose} modelName={modelName} snapshot={snapshot} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
