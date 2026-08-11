import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Car, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@contracts/types';
import { trpc } from '@/providers/trpc';
import {
  Chip,
  ELIGIBILITY,
  LEAD_SOURCE,
  LEAD_STATUS,
  extractSimulation,
  fmtDateTime,
  formatAnswer,
  formatBRL,
  humanizeKey,
  initials,
  isNegativeAnswer,
  waLink,
} from '@/components/admin/shared';

const LOST_REASONS = ['Sem resposta', 'Desistiu', 'Fora de SP', 'Outro'];

function whatsappTemplate(lead: Lead): string {
  const sim = extractSimulation(lead.simulationSnapshot);
  const modelo = sim.carName ?? 'seu táxi 0 km';
  const valor = sim.savings != null ? formatBRL(sim.savings) : 'uma ótima economia';
  return `Olá ${lead.name.split(' ')[0]}, aqui é da IsentaTáxi! Vi sua simulação do ${modelo} — economia estimada de ${valor}. Posso te ajudar a confirmar a elegibilidade?`;
}

/** Drawer de detalhe do lead (direita, w-[480px]) */
export default function LeadDrawer({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);
  const [confirmLost, setConfirmLost] = useState(false);

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: (_data, vars) => {
      utils.leads.list.invalidate();
      utils.admin.metrics.invalidate();
      toast.success('Status atualizado', {
        description: `Lead marcado como ${LEAD_STATUS[vars.status]?.label ?? vars.status}.`,
      });
      if (vars.status === 'perdido') onClose();
    },
    onError: (err) => toast.error('Não foi possível atualizar', { description: err.message }),
  });

  const sim = lead ? extractSimulation(lead.simulationSnapshot) : null;
  const quizEntries =
    lead?.quizAnswers && typeof lead.quizAnswers === 'object'
      ? Object.entries(lead.quizAnswers as Record<string, unknown>)
      : [];

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border-subtle bg-bg-surface"
            role="dialog"
            aria-label={`Detalhe do lead ${lead.name}`}
          >
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-border-subtle p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-taxi-yellow font-display text-lg text-bg-base">
                {initials(lead.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[1.25rem] font-bold">{lead.name}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {lead.eligibilityResult && (
                    <Chip tone={ELIGIBILITY[lead.eligibilityResult]?.tone ?? 'zinc'}>
                      {ELIGIBILITY[lead.eligibilityResult]?.label ?? lead.eligibilityResult}
                    </Chip>
                  )}
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateStatus.mutate({
                        leadId: lead.id,
                        status: e.target.value as 'novo' | 'contatado' | 'convertido' | 'perdido',
                      })
                    }
                    disabled={updateStatus.isPending}
                    className="h-7 rounded-full border border-border-subtle bg-bg-elevated px-2 font-mono text-[0.75rem] text-text-primary focus:border-taxi-yellow"
                    aria-label="Status do lead"
                  >
                    {Object.entries(LEAD_STATUS).map(([value, cfg]) => (
                      <option key={value} value={value}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-5"
              >
                {/* Ações */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="flex gap-2">
                  <a
                    href={waLink(lead.whatsapp, whatsappTemplate(lead))}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-money-green text-sm font-bold text-bg-base transition-colors hover:bg-money-green/90"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chamar no WhatsApp
                  </a>
                </motion.div>

                {/* Resumo econômico */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="rounded-2xl bg-bg-elevated p-4"
                  aria-label="Resumo econômico"
                >
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Car className="h-4 w-4 text-taxi-yellow" aria-hidden="true" />
                    <span className="font-semibold text-text-primary">{sim?.carName ?? 'Veículo não informado'}</span>
                  </div>
                  {sim?.savings != null && (
                    <p className="mt-2 font-mono text-3xl font-bold text-money-green">
                      {formatBRL(sim.savings)}
                      <span className="ml-2 align-middle text-xs font-medium text-text-faint">economia est.</span>
                    </p>
                  )}
                  <p className="mt-2 text-[0.8125rem] text-text-faint">
                    Origem: {LEAD_SOURCE[lead.source]?.label ?? lead.source} · recebido em {fmtDateTime(lead.createdAt)}
                  </p>
                  {lead.email && <p className="mt-1 text-[0.8125rem] text-text-faint">E-mail: {lead.email}</p>}
                  {lead.referredBy && (
                    <p className="mt-1 text-[0.8125rem] font-semibold text-taxi-yellow">
                      Indicação: {lead.referredBy} — taxista que indica ganha
                    </p>
                  )}
                </motion.div>

                {/* Respostas da pré-análise */}
                {quizEntries.length > 0 && (
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    aria-label="Respostas da pré-análise"
                  >
                    <h3 className="text-sm font-bold">Respostas da pré-análise</h3>
                    {lead.eligibilityScore != null && (
                      <p className="mt-0.5 font-mono text-[0.75rem] text-text-faint">
                        Score: {lead.eligibilityScore}
                      </p>
                    )}
                    <ul className="mt-3 space-y-2.5">
                      {quizEntries.map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2 text-sm">
                          {isNegativeAnswer(value) && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warn-amber" title="Gerou pendência" />
                          )}
                          <div className={isNegativeAnswer(value) ? '' : 'pl-4'}>
                            <p className="text-[0.8125rem] text-text-muted">{humanizeKey(key)}</p>
                            <p className="font-semibold text-text-primary">{formatAnswer(value)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Snapshot da simulação */}
                {lead.simulationSnapshot != null && typeof lead.simulationSnapshot === 'object' && (
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    aria-label="Detalhes da simulação"
                  >
                    <h3 className="text-sm font-bold">Detalhes da simulação</h3>
                    <ul className="mt-3 space-y-2">
                      {Object.entries(lead.simulationSnapshot as Record<string, unknown>).map(([key, value]) => (
                        <li key={key} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-[0.8125rem] text-text-muted">{humanizeKey(key)}</span>
                          <span className="text-right font-mono text-[0.8125rem] text-text-primary">
                            {typeof value === 'number' && /(saving|economia|price|preco|valor|ipi|icms)/i.test(key)
                              ? formatBRL(value)
                              : formatAnswer(value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Timeline de contato */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  aria-label="Timeline de contato"
                >
                  <h3 className="text-sm font-bold">Timeline de contato</h3>
                  <ol className="mt-3 space-y-0">
                    <li className="relative border-l border-border-strong pb-4 pl-4">
                      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-taxi-yellow" />
                      <p className="text-sm text-text-primary">
                        Lead criado — {LEAD_SOURCE[lead.source]?.label ?? lead.source}
                      </p>
                      <p className="font-mono text-[0.75rem] text-text-faint">{fmtDateTime(lead.createdAt)}</p>
                    </li>
                    {lead.status !== 'novo' && (
                      <li className="relative border-l border-transparent pl-4">
                        <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-info-blue" />
                        <p className="text-sm text-text-primary">
                          Status atual: {LEAD_STATUS[lead.status]?.label ?? lead.status}
                        </p>
                      </li>
                    )}
                  </ol>
                </motion.div>
              </motion.div>
            </div>

            {/* Zona de perigo */}
            {lead.status !== 'perdido' && (
              <div className="border-t border-border-subtle p-4">
                {confirmLost ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.8125rem] text-text-muted" htmlFor="lost-reason">
                      Motivo (obrigatório)
                    </label>
                    <select
                      id="lost-reason"
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-taxi-yellow"
                    >
                      {LOST_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 flex gap-2">
                      <button
                        onClick={() => updateStatus.mutate({ leadId: lead.id, status: 'perdido' })}
                        disabled={updateStatus.isPending}
                        className="h-10 flex-1 rounded-full bg-alert-red text-sm font-bold text-white transition-colors hover:bg-alert-red/90 disabled:opacity-50"
                      >
                        Confirmar: marcar como perdido
                      </button>
                      <button
                        onClick={() => setConfirmLost(false)}
                        className="h-10 rounded-full border border-border-strong px-4 text-sm text-text-muted transition-colors hover:text-text-primary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmLost(true)}
                    className="w-full rounded-full py-2 text-sm font-medium text-alert-red transition-colors hover:bg-alert-red/10"
                  >
                    Marcar como perdido
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
