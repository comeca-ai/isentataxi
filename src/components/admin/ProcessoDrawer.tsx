import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { STAGES } from '@contracts/constants';
import type { Process, ProcessStage } from '@contracts/types';
import { trpc } from '@/providers/trpc';
import { Chip, STAGE_STATUS, fmtDate, fmtDateTime, initials } from '@/components/admin/shared';

export type ProcessRow = {
  process: Process;
  userName: string | null;
  userEmail: string | null;
  stages: ProcessStage[];
};

/** SLA por etapa em dias (constante operacional) */
export const STAGE_SLA_DAYS: Record<number, number> = {
  1: 7,
  2: 10,
  3: 42,
  4: 15,
  5: 90,
  6: 60,
  7: 60,
};

export function daysInStage(stage: ProcessStage | undefined): number {
  if (!stage?.updatedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(stage.updatedAt).getTime()) / 86_400_000));
}

export function slaTone(days: number, stageN: number): 'green' | 'amber' | 'red' {
  const sla = STAGE_SLA_DAYS[stageN] ?? 30;
  if (days > sla) return 'red';
  if (days > sla * 0.7) return 'amber';
  return 'green';
}

/** Drawer de detalhe do processo (direita, w-[520px]) */
export default function ProcessoDrawer({
  row,
  onClose,
}: {
  row: ProcessRow | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [note, setNote] = useState('');

  useEffect(() => setNote(''), [row?.process.id]);

  const updateStage = trpc.process.updateStage.useMutation({
    onSuccess: () => {
      utils.process.listAll.invalidate();
      utils.admin.metrics.invalidate();
    },
    onError: (err) => toast.warning('Movimento não permitido', { description: err.message }),
  });

  const markPaid = trpc.process.markPaid.useMutation({
    onSuccess: ({ paid }) => {
      utils.process.listAll.invalidate();
      toast.success(paid ? 'Pagamento confirmado — etapas 3+ liberadas' : 'Pagamento estornado');
    },
    onError: (err) => toast.error(err.message),
  });

  const currentStageN = row?.process.currentStage ?? 1;
  const currentStageRow = row?.stages.find((s) => s.stage === currentStageN);
  const currentDef = STAGES.find((s) => s.n === currentStageN);
  const notes = (row?.stages ?? []).filter((s) => s.notes?.trim());
  const history = [...(row?.stages ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const isPaid = Boolean(row?.process.paidAt);
  const posDeadlineDays = row?.process.postPurchaseDeadline
    // eslint-disable-next-line react-hooks/purity -- countdown relativo ao tempo atual é intencional
    ? Math.ceil((new Date(row.process.postPurchaseDeadline).getTime() - Date.now()) / 86_400_000)
    : null;

  const paymentButton = (
    <button
      type="button"
      disabled={markPaid.isPending}
      onClick={() => row && markPaid.mutate({ processId: row.process.id, paid: !isPaid })}
      className={
        isPaid
          ? 'flex h-11 w-full items-center justify-center gap-2 rounded-full border border-money-green/40 bg-money-green/10 text-sm font-bold text-money-green transition-colors hover:bg-money-green/20'
          : 'flex h-11 w-full items-center justify-center gap-2 rounded-full bg-money-green text-sm font-bold text-bg-base transition-colors hover:bg-money-green/90 disabled:opacity-50'
      }
    >
      {isPaid ? '✓ Pagamento confirmado (clique p/ estornar)' : 'Confirmar pagamento R$ 299'}
    </button>
  );

  const advance = () => {
    if (!row || !currentStageRow) return;
    updateStage.mutate(
      { processId: row.process.id, stage: currentStageN, status: 'concluida' },
      {
        onSuccess: () =>
          toast.success('Etapa avançada', { description: `${currentDef?.name ?? `Etapa ${currentStageN}`} concluída.` }),
      },
    );
  };

  const addNote = () => {
    if (!row || !currentStageRow || !note.trim()) return;
    updateStage.mutate(
      {
        processId: row.process.id,
        stage: currentStageN,
        status: currentStageRow.status as ProcessStage['status'],
        notes: note.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Nota registrada na etapa atual');
          setNote('');
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {row && (
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
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border-subtle bg-bg-surface"
            role="dialog"
            aria-label={`Processo de ${row.userName ?? 'cliente'}`}
          >
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-border-subtle p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-taxi-yellow font-display text-lg text-bg-base">
                {initials(row.userName)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[1.25rem] font-bold">{row.userName ?? 'Cliente'}</h2>
                <p className="truncate text-[0.8125rem] text-text-faint">{row.userEmail ?? '—'}</p>
                <div className="mt-1.5">
                  <Chip tone="blue">
                    Etapa {currentStageN}/7 — {currentDef?.name ?? ''}
                  </Chip>
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

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Pagamento do serviço */}
              {paymentButton}

              {/* Ações */}
              <div className="flex gap-2">
                <Link
                  to={`/admin/documentos?cliente=${row.process.userId}`}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-taxi-yellow/60 text-sm font-bold text-taxi-yellow transition-colors hover:bg-taxi-yellow/10"
                >
                  <FileCheck className="h-4 w-4" aria-hidden="true" /> Ver documentos
                </Link>
                {currentStageN < 7 || currentStageRow?.status !== 'concluida' ? (
                  <button
                    onClick={advance}
                    disabled={updateStage.isPending}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-taxi-yellow text-sm font-bold text-bg-base transition-colors hover:bg-taxi-yellow-hover disabled:opacity-50"
                  >
                    Avançar etapa <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {/* Mini-timeline das 7 etapas */}
              <section aria-label="Etapas do processo">
                <h3 className="text-sm font-bold">Etapas do processo</h3>
                <ol className="mt-3">
                  {STAGES.map((def) => {
                    const st = row.stages.find((s) => s.stage === def.n);
                    const status = st?.status ?? 'pendente';
                    const cfg = STAGE_STATUS[status] ?? STAGE_STATUS.pendente;
                    const isCurrent = def.n === currentStageN;
                    return (
                      <li key={def.n} className="relative border-l border-border-strong pb-4 pl-4 last:border-transparent">
                        <span
                          className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${
                            status === 'concluida'
                              ? 'bg-money-green'
                              : isCurrent
                                ? 'bg-info-blue'
                                : 'bg-zinc-600'
                          }`}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm ${isCurrent ? 'font-bold text-text-primary' : 'text-text-muted'}`}>
                            <span className="font-mono text-text-faint">{def.n}.</span> {def.name}
                            {def.parallel && <span className="ml-1 text-info-blue" title="Etapas paralelas">∥</span>}
                          </p>
                          <Chip tone={cfg.tone} dashed={status === 'bloqueada'}>
                            {cfg.label}
                          </Chip>
                          {isCurrent && st && (
                            <span className="font-mono text-[0.75rem] text-text-faint">
                              há {daysInStage(st)}d
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* Datas e prazos */}
              <section className="rounded-2xl bg-bg-elevated p-4" aria-label="Datas e prazos">
                <h3 className="text-sm font-bold">Datas e prazos</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Processo criado em</dt>
                    <dd className="font-mono text-text-primary">{fmtDate(row.process.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Pós-compra (60 dias)</dt>
                    <dd
                      className={`font-mono ${
                        posDeadlineDays != null && posDeadlineDays < 10 ? 'font-bold text-alert-red' : 'text-text-primary'
                      }`}
                    >
                      {row.process.postPurchaseDeadline
                        ? `${fmtDate(row.process.postPurchaseDeadline)}${posDeadlineDays != null ? ` (${posDeadlineDays}d)` : ''}`
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Notas operacionais */}
              <section aria-label="Notas operacionais">
                <h3 className="text-sm font-bold">Notas operacionais</h3>
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anotar algo sobre a etapa atual…"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-faint focus:border-taxi-yellow"
                  />
                  <button
                    onClick={addNote}
                    disabled={!note.trim() || updateStage.isPending}
                    className="h-9 self-end rounded-full bg-taxi-yellow px-4 text-sm font-bold text-bg-base transition-colors hover:bg-taxi-yellow-hover disabled:opacity-50"
                  >
                    Adicionar nota
                  </button>
                </div>
                {notes.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {notes.map((s) => (
                      <li key={s.id} className="rounded-xl bg-bg-elevated p-3 text-sm">
                        <p className="text-text-primary">{s.notes}</p>
                        <p className="mt-1 font-mono text-[0.75rem] text-text-faint">
                          Etapa {s.stage} · equipe · {fmtDateTime(s.updatedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Histórico */}
              <section aria-label="Histórico">
                <h3 className="text-sm font-bold">Histórico</h3>
                <ul className="mt-3 space-y-2.5">
                  {history.map((s) => {
                    const def = STAGES.find((d) => d.n === s.stage);
                    const cfg = STAGE_STATUS[s.status] ?? STAGE_STATUS.pendente;
                    return (
                      <li key={s.id} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            s.status === 'concluida'
                              ? 'bg-money-green'
                              : s.status === 'rejeitada'
                                ? 'bg-alert-red'
                                : s.status === 'em_andamento'
                                  ? 'bg-info-blue'
                                  : 'bg-zinc-600'
                          }`}
                        />
                        <div>
                          <p className="text-text-primary">
                            Etapa {s.stage} ({def?.name ?? '—'}) → {cfg.label}
                          </p>
                          <p className="font-mono text-[0.75rem] text-text-faint">{fmtDateTime(s.updatedAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
