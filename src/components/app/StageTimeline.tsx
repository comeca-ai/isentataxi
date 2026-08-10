import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, FileText, Lock, Send, Upload } from 'lucide-react';
import { STAGES, type Stage, type StageStatus } from '@contracts/constants';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime, STAGE_STATUS, docLabel } from './client-utils';
import StatusChip from './StatusChip';

export type StageRow = {
  stage: number;
  status: StageStatus;
  notes: string | null;
  updatedAt: Date | string;
};

export type LinkedDoc = {
  id: number;
  docType: string;
  fileName: string;
  status: string;
};

/** DocTypes vinculados a cada etapa (para os chips do painel expandido) */
const STAGE_DOCTYPES: Record<number, string[]> = {
  2: ['cnh', 'alvara', 'comprovante_residencia', 'certidao_cursos'],
  3: ['dtp_protocolo'],
  4: ['detran_laudo'],
  5: ['sisen_protocolo'],
  6: ['sivei_autorizacao'],
  7: ['nota_fiscal'],
};

const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: 'Seus dados e a pré-análise de elegibilidade.',
  2: 'Envio e conferência dos documentos pela nossa equipe.',
  3: 'Protocolo do requerimento na Prefeitura (DTP / SP156).',
  4: 'Vistoria e laudo do veículo no Detran-SP.',
  5: 'Pedido de isenção de IPI na Receita Federal (SISEN).',
  6: 'Autorização de isenção de ICMS na Sefaz-SP (SIVEI).',
  7: 'Compra do veículo e comprovação pós-compra em até 60 dias.',
};

function isLocked(def: Stage, rows: Map<number, StageRow>): { locked: boolean; waitingOn?: number } {
  const row = rows.get(def.n);
  if (!row || (row.status !== 'pendente' && row.status !== 'bloqueada')) return { locked: false };
  if (def.dependsOn.length === 0) return { locked: false };
  const waiting = def.dependsOn.find((dep) => rows.get(dep)?.status !== 'concluida');
  return waiting !== undefined ? { locked: true, waitingOn: waiting } : { locked: false };
}

function StageNode({ status, isCurrent }: { status: StageStatus; isCurrent: boolean }) {
  if (status === 'concluida') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-taxi-yellow">
        <Check className="h-5 w-5 text-bg-base" strokeWidth={3} />
      </span>
    );
  }
  if (status === 'em_andamento' || status === 'em_revisao') {
    return (
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-taxi-yellow">
        {isCurrent && (
          <motion.span
            className="absolute inset-0 rounded-full bg-taxi-yellow"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            aria-hidden="true"
          />
        )}
        <span className="relative h-3 w-3 rounded-full bg-bg-base" />
      </span>
    );
  }
  if (status === 'rejeitada') {
    return (
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alert-red">
        <motion.span
          className="absolute inset-0 rounded-full bg-alert-red"
          animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden="true"
        />
        <span className="relative text-sm font-bold text-white">!</span>
      </span>
    );
  }
  if (status === 'bloqueada') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong bg-bg-elevated text-text-faint">
        <Lock className="h-4 w-4" />
      </span>
    );
  }
  return <span className="h-10 w-10 shrink-0 rounded-full border-2 border-border-strong bg-bg-elevated" aria-hidden="true" />;
}

function StageItem({
  def,
  row,
  currentStage,
  rows,
  docs,
  expanded,
  onToggle,
}: {
  def: Stage;
  row: StageRow | undefined;
  currentStage: number;
  rows: Map<number, StageRow>;
  docs: LinkedDoc[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = row?.status ?? 'pendente';
  const { locked, waitingOn } = isLocked(def, rows);
  const isCurrent = def.n === currentStage && status !== 'concluida';
  const meta = locked
    ? { label: `aguardando etapa ${waitingOn}`, className: 'border-dashed border-border-strong bg-transparent text-text-faint' }
    : STAGE_STATUS[status];
  const linked = docs.filter((d) => (STAGE_DOCTYPES[def.n] ?? []).includes(d.docType));

  return (
    <div className="flex-1 rounded-xl transition-colors duration-150 hover:bg-bg-elevated">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 rounded-xl p-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-text-faint">Etapa {def.n}</span>
            <StatusChip meta={meta} />
            {isCurrent && (
              <span className="rounded-full bg-taxi-yellow/10 px-2.5 py-0.5 font-mono text-[0.7rem] text-taxi-yellow">
                você está aqui
              </span>
            )}
          </div>
          <p className={cn('mt-1 font-semibold', locked || status === 'pendente' ? 'text-text-muted' : 'text-text-primary')}>
            {def.name}
            <span className="ml-2 text-sm font-normal text-text-faint">· {def.org}</span>
          </p>
          {status === 'concluida' && row && (
            <p className="mt-0.5 font-mono text-xs text-text-faint">concluída em {formatDate(row.updatedAt)}</p>
          )}
          {(status === 'em_andamento' || status === 'em_revisao') && (
            <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-border-subtle">
              <div className="h-full w-1/3 animate-zebra-move rounded-full zebra-fine" />
            </div>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-text-faint transition-transform duration-200', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-4 pl-4">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-sm text-text-muted"
              >
                {row?.notes ?? STAGE_DESCRIPTIONS[def.n]}
              </motion.p>
              {row && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-mono text-xs text-text-faint"
                >
                  Última movimentação — {formatDateTime(row.updatedAt)}
                </motion.p>
              )}
              {linked.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-wrap gap-2"
                >
                  {linked.map((d) => (
                    <Link
                      key={d.id}
                      to="/app/documentos"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-base px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-taxi-yellow/40 hover:text-text-primary"
                    >
                      <FileText className="h-3 w-3" /> {docLabel(d.docType)}
                    </Link>
                  ))}
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {def.n === 2 && status !== 'concluida' && (
                  <Link
                    to="/app/documentos"
                    className="inline-flex items-center gap-2 rounded-full bg-taxi-yellow px-4 py-2 text-sm font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
                  >
                    <Send className="h-4 w-4" /> Enviar documento
                  </Link>
                )}
                {def.n === 7 && status !== 'concluida' && (
                  <Link
                    to="/app/documentos"
                    className="inline-flex items-center gap-2 rounded-full bg-taxi-yellow px-4 py-2 text-sm font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
                  >
                    <Upload className="h-4 w-4" /> Registrar nota fiscal
                  </Link>
                )}
                {locked && waitingOn !== undefined && (
                  <p className="text-sm text-text-faint">
                    Depende da etapa {waitingOn} — assim que concluir, protocolamos automaticamente.
                  </p>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Timeline vertical das 7 etapas (3 e 4 em paralelo dentro de container tracejado) */
export default function StageTimeline({
  rows,
  currentStage,
  docs,
}: {
  rows: StageRow[];
  currentStage: number;
  docs: LinkedDoc[];
}) {
  const [expanded, setExpanded] = useState<number | null>(currentStage);
  const byStage = new Map(rows.map((r) => [r.stage, r]));

  const renderItem = (n: number, last: boolean) => {
    const def = STAGES.find((s) => s.n === n)!;
    const row = byStage.get(n);
    const done = row?.status === 'concluida';
    const active = row?.status === 'em_andamento' || row?.status === 'em_revisao';
    return (
      <div key={n} className="relative flex gap-0">
        {/* nó + conector */}
        <div className="flex flex-col items-center">
          <StageNode status={row?.status ?? 'pendente'} isCurrent={n === currentStage} />
          {!last && (
            <div
              className={cn(
                'w-0.5 flex-1',
                done ? 'bg-taxi-yellow' : active ? 'zebra-fine animate-zebra-move' : 'bg-border-subtle',
              )}
              style={{ minHeight: 24 }}
              aria-hidden="true"
            />
          )}
        </div>
        <StageItem
          def={def}
          row={row}
          currentStage={currentStage}
          rows={byStage}
          docs={docs}
          expanded={expanded === n}
          onToggle={() => setExpanded((e) => (e === n ? null : n))}
        />
      </div>
    );
  };

  return (
    <div>
      {renderItem(1, false)}
      {renderItem(2, false)}
      {/* Etapas 3 e 4 em paralelo */}
      <div className="relative ml-5 border-l-2 border-border-subtle pl-0">
        <div className="rounded-2xl border border-dashed border-border-strong p-3 md:p-4">
          <span className="mb-2 inline-block rounded-full border border-border-strong bg-bg-elevated px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider text-text-muted">
            ∥ Em paralelo
          </span>
          <div className="grid gap-2 lg:grid-cols-2">
            {[3, 4].map((n) => {
              const def = STAGES.find((s) => s.n === n)!;
              const row = byStage.get(n);
              return (
                <div key={n} className="flex">
                  <div className="flex flex-col items-center">
                    <StageNode status={row?.status ?? 'pendente'} isCurrent={n === currentStage} />
                  </div>
                  <StageItem
                    def={def}
                    row={row}
                    currentStage={currentStage}
                    rows={byStage}
                    docs={docs}
                    expanded={expanded === n}
                    onToggle={() => setExpanded((e) => (e === n ? null : n))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {renderItem(5, false)}
      {renderItem(6, false)}
      {renderItem(7, true)}
    </div>
  );
}
