import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { KanbanSquare, List, Search, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { STAGES } from '@contracts/constants';
import { trpc } from '@/providers/trpc';
import ProcessoDrawer, { STAGE_SLA_DAYS, daysInStage, slaTone } from '@/components/admin/ProcessoDrawer';
import type { ProcessRow } from '@/components/admin/ProcessoDrawer';
import { AdminToaster, Chip, STAGE_STATUS, fmtDate, initials } from '@/components/admin/shared';

// ---------------------------------------------------------------------------
// Alertas de prazo
// ---------------------------------------------------------------------------

function deadlineDays(row: ProcessRow): number | null {
  if (!row.process.postPurchaseDeadline) return null;
  return Math.ceil((new Date(row.process.postPurchaseDeadline).getTime() - Date.now()) / 86_400_000);
}

function hasAlert(row: ProcessRow): boolean {
  const d = deadlineDays(row);
  if (d != null && d >= 0 && d < 10) return true;
  const current = row.stages.find((s) => s.stage === row.process.currentStage);
  const sla = STAGE_SLA_DAYS[row.process.currentStage] ?? 30;
  return daysInStage(current) > sla;
}

function isConcluded(row: ProcessRow): boolean {
  return row.stages.length > 0 && row.stages.every((s) => s.status === 'concluida');
}

// ---------------------------------------------------------------------------
// Card de processo
// ---------------------------------------------------------------------------

function ProcessCardBody({ row, dragging }: { row: ProcessRow; dragging?: boolean }) {
  const current = row.stages.find((s) => s.stage === row.process.currentStage);
  const days = daysInStage(current);
  const tone = slaTone(days, row.process.currentStage);
  const dDays = deadlineDays(row);
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-bg-elevated p-4 transition-all ${
        dragging
          ? 'rotate-2 scale-[1.03] border-taxi-yellow/60 shadow-[0_8px_32px_rgba(250,204,21,0.25)]'
          : 'hover:-translate-y-0.5 hover:border-taxi-yellow/40'
      }`}
    >
      <p className="font-semibold text-text-primary">{row.userName ?? 'Cliente'}</p>
      <p className="mt-0.5 truncate text-[0.75rem] text-text-faint">{row.userEmail ?? '—'}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-surface font-mono text-[0.65rem] font-bold text-taxi-yellow ring-1 ring-border-strong">
          {initials(row.userName).charAt(0)}
        </span>
        <span
          className={`font-mono text-[0.75rem] ${
            tone === 'red' ? 'animate-pulse font-bold text-alert-red' : tone === 'amber' ? 'text-warn-amber' : 'text-money-green'
          }`}
        >
          há {days} dia{days === 1 ? '' : 's'} nesta etapa
        </span>
      </div>
      {dDays != null && dDays >= 0 && dDays < 10 && (
        <div className="mt-2">
          <Chip tone="red">pós-compra: {dDays} dias p/ comprovar</Chip>
        </div>
      )}
    </div>
  );
}

function DraggableCard({
  row,
  dimmed,
  onOpen,
}: {
  row: ProcessRow;
  dimmed: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `proc-${row.process.id}`,
    data: { row },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? 'opacity-30' : ''} ${dimmed ? 'opacity-40' : ''}`}
    >
      <ProcessCardBody row={row} />
    </div>
  );
}

const COLUMN_BAR_COLORS = [
  'bg-info-blue',
  'bg-info-blue',
  'bg-warn-amber',
  'bg-warn-amber',
  'bg-taxi-yellow',
  'bg-taxi-yellow',
  'bg-money-green',
];

function KanbanColumn({
  stageN,
  rows,
  dimFilter,
  onOpen,
}: {
  stageN: number;
  rows: ProcessRow[];
  dimFilter: ((row: ProcessRow) => boolean) | null;
  onOpen: (row: ProcessRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stageN}` });
  const def = STAGES[stageN - 1];
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[300px] shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
        isOver ? 'border-dashed border-taxi-yellow/60 bg-taxi-yellow/5' : 'border-border-subtle bg-bg-surface/60'
      }`}
    >
      <div className="sticky top-0">
        <div className={`h-0.5 w-10 rounded-full ${COLUMN_BAR_COLORS[stageN - 1]}`} />
        <div className="mt-2 flex items-baseline gap-2 px-1">
          <span className="font-mono text-sm font-bold text-taxi-yellow">{stageN}</span>
          <h3 className="truncate text-sm font-bold text-text-primary" title={def?.name}>
            {def?.name}
          </h3>
          {def?.parallel && (
            <span className="rounded bg-info-blue/15 px-1.5 py-0.5 font-mono text-[0.65rem] text-info-blue" title="Etapas 3 e 4 são paralelas">
              ∥ paralelas
            </span>
          )}
          <span className="ml-auto font-mono text-[0.75rem] text-text-faint">{rows.length}</span>
        </div>
      </div>
      <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border-strong text-[0.8125rem] text-zinc-500">
            Nenhum processo aqui
          </div>
        ) : (
          rows.map((row) => (
            <DraggableCard
              key={row.process.id}
              row={row}
              dimmed={dimFilter ? !dimFilter(row) : false}
              onOpen={() => onOpen(row)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function AdminProcessos() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [search, setSearch] = useState('');
  const [alertOnly, setAlertOnly] = useState(searchParams.get('alerta') != null);
  const [drawerRow, setDrawerRow] = useState<ProcessRow | null>(null);
  const [activeRow, setActiveRow] = useState<ProcessRow | null>(null);
  const [confirm, setConfirm] = useState<{ row: ProcessRow; target: number } | null>(null);
  const [alertsDismissed, setAlertsDismissed] = useState(
    () => sessionStorage.getItem('admin-proc-alertas') === 'off',
  );

  const utils = trpc.useUtils();
  const query = trpc.process.listAll.useQuery(undefined, { refetchInterval: 60_000 });
  const rows = useMemo(() => (query.data ?? []) as ProcessRow[], [query.data]);

  const updateStage = trpc.process.updateStage.useMutation();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStage = useMemo(() => {
    const map = new Map<number, ProcessRow[]>();
    for (let n = 1; n <= 7; n++) map.set(n, []);
    for (const row of rows) {
      const s = Math.min(7, Math.max(1, row.process.currentStage));
      map.get(s)?.push(row);
    }
    return map;
  }, [rows]);

  const matchesFilter = (row: ProcessRow): boolean => {
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const hay = `${row.userName ?? ''} ${row.userEmail ?? ''}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    if (alertOnly && !hasAlert(row)) return false;
    return true;
  };
  const filtersActive = search.trim() !== '' || alertOnly;
  const dimFilter = filtersActive ? matchesFilter : null;

  const alertRows = rows.filter(hasAlert);
  const concluded = rows.filter(isConcluded).length;

  const onDragStart = (event: DragStartEvent) => {
    setActiveRow((event.active.data.current as { row: ProcessRow } | undefined)?.row ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveRow(null);
    const row = (event.active.data.current as { row: ProcessRow } | undefined)?.row;
    const overId = event.over?.id;
    if (!row || typeof overId !== 'string' || !overId.startsWith('col-')) return;
    const target = Number(overId.slice(4));
    if (!Number.isInteger(target) || target < 1 || target > 7 || target === row.process.currentStage) return;
    setConfirm({ row, target });
  };

  const runMove = async (row: ProcessRow, target: number) => {
    const cur = row.process.currentStage;
    const targetName = STAGES[target - 1]?.name ?? `Etapa ${target}`;
    try {
      if (target > cur) {
        // Avança: conclui as etapas intermediárias em sequência (backend valida dependências)
        for (let s = cur; s < target; s++) {
          await updateStage.mutateAsync({ processId: row.process.id, stage: s, status: 'concluida' });
        }
      } else {
        // Retorna: reabre a etapa de destino
        await updateStage.mutateAsync({ processId: row.process.id, stage: target, status: 'em_andamento' });
      }
      toast.success('Processo movido', {
        description: `${row.userName ?? 'Cliente'} → ${targetName}.`,
      });
    } catch (err) {
      toast.warning('Movimento não permitido', {
        description: err instanceof Error ? err.message : 'Dependências da etapa não atendidas.',
      });
    } finally {
      utils.process.listAll.invalidate();
      utils.admin.metrics.invalidate();
    }
  };

  const filteredList = rows.filter(matchesFilter);

  return (
    <div className="space-y-5">
      <AdminToaster />

      {/* S1 — Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase md:text-4xl">Processos</h1>
          <p className="mt-1 text-sm text-text-muted">
            <span className="font-mono">{rows.length}</span> em execução ·{' '}
            <span className="font-mono">{concluded}</span> concluídos
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip tone={alertRows.length > 0 ? 'red' : 'zinc'}>
              <button onClick={() => setAlertOnly((v) => !v)} className="flex items-center gap-1">
                <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                {alertRows.length} alerta{alertRows.length === 1 ? '' : 's'} de prazo
              </button>
            </Chip>
            <Chip tone="blue">SLA por etapa: 7–90 dias</Chip>
          </div>
        </div>
        <div className="flex rounded-full border border-border-subtle bg-bg-elevated p-1" role="tablist" aria-label="Visão">
          {(
            [
              { key: 'kanban', label: 'Kanban', icon: KanbanSquare },
              { key: 'lista', label: 'Lista', icon: List },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                view === v.key ? 'bg-taxi-yellow text-bg-base' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <v.icon className="h-4 w-4" aria-hidden="true" /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* S5 — Alertas de prazo */}
      {alertRows.length > 0 && !alertsDismissed && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-alert-red/40 bg-alert-red/10 p-4">
          <TriangleAlert className="h-5 w-5 shrink-0 text-alert-red" aria-hidden="true" />
          <p className="flex-1 text-sm text-alert-red">
            {alertRows.length} processo{alertRows.length === 1 ? '' : 's'} com prazo vencendo ou SLA de etapa estourado.
          </p>
          <button
            onClick={() => setAlertOnly(true)}
            className="h-9 rounded-full bg-alert-red px-4 text-sm font-bold text-white transition-colors hover:bg-alert-red/90"
          >
            Filtrar quadro
          </button>
          <button
            onClick={() => {
              setAlertsDismissed(true);
              sessionStorage.setItem('admin-proc-alertas', 'off');
            }}
            className="rounded-lg p-1.5 text-alert-red/70 transition-colors hover:text-alert-red"
            aria-label="Dispensar alertas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* S6 — Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 focus-within:border-border-strong">
          <Search className="h-4 w-4 shrink-0 text-text-faint" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente ou e-mail…"
            className="h-full w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-faint"
            aria-label="Buscar processo"
          />
        </div>
        <button
          onClick={() => setAlertOnly((v) => !v)}
          aria-pressed={alertOnly}
          className={`h-10 rounded-xl border px-4 text-sm font-medium transition-colors ${
            alertOnly
              ? 'border-alert-red/60 bg-alert-red/15 text-alert-red'
              : 'border-border-subtle text-text-muted hover:border-border-strong hover:text-text-primary'
          }`}
        >
          Só com alerta
        </button>
      </div>

      {/* Conteúdo */}
      {query.isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 w-[300px] shrink-0 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface/60" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-10 text-center">
          <p className="text-alert-red">Erro ao carregar os processos.</p>
          <button
            onClick={() => query.refetch()}
            className="h-10 rounded-full bg-taxi-yellow px-5 text-sm font-bold text-bg-base hover:bg-taxi-yellow-hover"
          >
            Tentar novamente
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-12 text-center">
          <img src="/empty-docs.svg" alt="" className="h-32 w-auto opacity-80" />
          <p className="text-text-muted">Converta o primeiro lead para iniciar a operação.</p>
          <Link
            to="/admin/leads"
            className="h-10 rounded-full bg-taxi-yellow px-5 text-sm font-bold leading-10 text-bg-base hover:bg-taxi-yellow-hover"
          >
            Ir para Leads
          </Link>
        </div>
      ) : view === 'kanban' ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div
            className="-mx-2 overflow-x-auto px-2 pb-4"
            style={{
              backgroundImage: 'radial-gradient(#3F3F46 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="flex gap-4">
              {STAGES.map((def, i) => (
                <motion.div
                  key={def.n}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
                >
                  <KanbanColumn
                    stageN={def.n}
                    rows={byStage.get(def.n) ?? []}
                    dimFilter={dimFilter}
                    onOpen={setDrawerRow}
                  />
                </motion.div>
              ))}
            </div>
          </div>
          <DragOverlay>{activeRow ? <ProcessCardBody row={activeRow} dragging /> : null}</DragOverlay>
        </DndContext>
      ) : (
        /* S3 — Visão lista */
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[0.75rem] uppercase tracking-wide text-text-faint">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Etapa atual</th>
                  <th className="px-4 py-3 font-medium">Dias na etapa</th>
                  <th className="px-4 py-3 font-medium">Status da etapa</th>
                  <th className="px-4 py-3 font-medium">Pós-compra</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => {
                  const current = row.stages.find((s) => s.stage === row.process.currentStage);
                  const days = daysInStage(current);
                  const tone = slaTone(days, row.process.currentStage);
                  const dDays = deadlineDays(row);
                  return (
                    <tr
                      key={row.process.id}
                      onClick={() => setDrawerRow(row)}
                      className="h-14 cursor-pointer border-b border-border-subtle/60 transition-colors last:border-0 hover:bg-bg-elevated"
                    >
                      <td className="px-4">
                        <p className="font-semibold text-text-primary">{row.userName ?? 'Cliente'}</p>
                        <p className="text-[0.75rem] text-text-faint">{row.userEmail ?? '—'}</p>
                      </td>
                      <td className="px-4">
                        <Chip tone="blue">
                          {row.process.currentStage} · {STAGES[row.process.currentStage - 1]?.name ?? ''}
                        </Chip>
                      </td>
                      <td className="px-4">
                        <span
                          className={`font-mono ${
                            tone === 'red' ? 'font-bold text-alert-red' : tone === 'amber' ? 'text-warn-amber' : 'text-money-green'
                          }`}
                        >
                          {days}d
                        </span>
                      </td>
                      <td className="px-4">
                        {current && (
                          <Chip tone={STAGE_STATUS[current.status]?.tone ?? 'zinc'}>
                            {STAGE_STATUS[current.status]?.label ?? current.status}
                          </Chip>
                        )}
                      </td>
                      <td className="px-4 font-mono text-[0.8125rem]">
                        {dDays != null ? (
                          <span className={dDays < 10 ? 'font-bold text-alert-red' : 'text-text-primary'}>
                            {fmtDate(row.process.postPurchaseDeadline)}
                          </span>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 font-mono text-[0.75rem] text-text-faint">{fmtDate(row.process.createdAt)}</td>
                    </tr>
                  );
                })}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-faint">
                      Nenhum processo com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmação de movimento */}
      <AnimatePresence>
        {confirm && (
          <>
            <motion.div
              key="confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirm(null)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              key="confirm-dialog"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-subtle bg-bg-elevated p-6"
              role="alertdialog"
              aria-label="Confirmar movimentação"
            >
              <h2 className="text-lg font-bold text-text-primary">Mover processo</h2>
              <p className="mt-2 text-sm text-text-muted">
                Mover o processo de <strong className="text-text-primary">{confirm.row.userName ?? 'cliente'}</strong>{' '}
                para <strong className="text-taxi-yellow">{STAGES[confirm.target - 1]?.name}</strong>?
                {confirm.target < confirm.row.process.currentStage && (
                  <span className="mt-1 block text-warn-amber">
                    A etapa {confirm.target} será reaberta (em andamento).
                  </span>
                )}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={async () => {
                    const { row, target } = confirm;
                    setConfirm(null);
                    await runMove(row, target);
                  }}
                  disabled={updateStage.isPending}
                  className="h-11 flex-1 rounded-full bg-taxi-yellow text-sm font-bold text-bg-base transition-colors hover:bg-taxi-yellow-hover disabled:opacity-50"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirm(null)}
                  className="h-11 rounded-full border border-border-strong px-5 text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProcessoDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />
    </div>
  );
}
