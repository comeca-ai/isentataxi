import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Check,
  ChevronDown,
  Eye,
  Keyboard,
  LayoutGrid,
  List,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DOC_TYPES } from '@contracts/constants';
import { trpc } from '@/providers/trpc';
import { DocLightbox, DocThumb, formatSize } from '@/components/admin/DocPreview';
import type { QueueDoc } from '@/components/admin/DocPreview';
import {
  AdminToaster,
  Chip,
  DOC_STATUS,
  Kbd,
  ORG_BY_DOCTYPE,
  fmtDateTime,
  timeAgo,
} from '@/components/admin/shared';

const REJECT_REASONS = [
  'Foto ilegível',
  'Documento vencido',
  'Falta o verso',
  'Dados não conferem',
  'Arquivo errado',
  'Outro',
];

type Tab = 'fila' | 'aprovado' | 'rejeitado';

function hoursSince(d: Date | string): number {
  return (Date.now() - new Date(d).getTime()) / 3_600_000;
}

function waitTone(d: Date | string): 'zinc' | 'amber' | 'red' {
  const h = hoursSince(d);
  if (h > 24) return 'red';
  if (h > 12) return 'amber';
  return 'zinc';
}

// ---------------------------------------------------------------------------
// Card de revisão
// ---------------------------------------------------------------------------

function ReviewCard({
  doc,
  expanded,
  onToggleReject,
  onApprove,
  onConfirmReject,
  onLightbox,
  pending,
  highlighted,
}: {
  doc: QueueDoc;
  expanded: boolean;
  onToggleReject: () => void;
  onApprove: () => void;
  onConfirmReject: (reason: string, note: string) => void;
  onLightbox: () => void;
  pending: boolean;
  highlighted: boolean;
}) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [note, setNote] = useState('');
  const tone = waitTone(doc.createdAt);

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ x: 40, opacity: 0, transition: { duration: 0.3 } }}
      className={`overflow-hidden rounded-2xl border bg-bg-surface transition-colors ${
        highlighted ? 'border-taxi-yellow/60' : 'border-border-subtle'
      }`}
    >
      <div className="grid sm:grid-cols-[200px_1fr]">
        <button onClick={onLightbox} className="block text-left" aria-label={`Ver ${doc.fileName} em tamanho grande`}>
          <DocThumb doc={doc} eager />
        </button>
        <div className="flex flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-text-primary">
              {DOC_TYPES[doc.docType as keyof typeof DOC_TYPES] ?? doc.docType}
            </h3>
            <Chip tone="blue">{ORG_BY_DOCTYPE[doc.docType] ?? 'Outros'}</Chip>
            <Chip tone={tone}>{timeAgo(doc.createdAt)}</Chip>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-text-primary">{doc.userName ?? 'Cliente'}</p>
          <p className="truncate text-[0.75rem] text-text-faint">{doc.userEmail ?? ''}</p>
          <p className="mt-1 font-mono text-[0.75rem] text-text-faint">
            enviado em {fmtDateTime(doc.createdAt)} · {formatSize(doc.sizeBytes)} · {doc.fileName}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <button
              onClick={onApprove}
              disabled={pending}
              className="group flex h-9 items-center gap-1.5 rounded-full bg-money-green px-4 text-sm font-bold text-bg-base transition-colors hover:bg-money-green/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden="true" /> Aprovar
              <span className="hidden group-hover:inline"><Kbd>A</Kbd></span>
            </button>
            <button
              onClick={onToggleReject}
              disabled={pending}
              className="group flex h-9 items-center gap-1.5 rounded-full border border-alert-red/60 px-4 text-sm font-bold text-alert-red transition-colors hover:bg-alert-red/10 disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Rejeitar
              <span className="hidden group-hover:inline"><Kbd>R</Kbd></span>
            </button>
            <button
              onClick={onLightbox}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver grande
              <span className="hidden group-hover:inline"><Kbd>V</Kbd></span>
            </button>
          </div>
        </div>
      </div>

      {/* Rejeição inline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border-subtle"
          >
            <div className="space-y-3 bg-alert-red/5 p-5">
              <p className="text-sm font-semibold text-alert-red">Motivo da rejeição (obrigatório — vai para o cliente)</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-alert-red"
                  aria-label="Motivo da rejeição"
                >
                  {REJECT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nota opcional — descreva para o cliente"
                  className="h-10 flex-1 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary outline-none placeholder:text-text-faint focus:border-alert-red"
                />
                <button
                  onClick={() => onConfirmReject(reason, note)}
                  disabled={pending || !reason}
                  className="h-10 rounded-full bg-alert-red px-5 text-sm font-bold text-white transition-colors hover:bg-alert-red/90 disabled:opacity-50"
                >
                  Confirmar rejeição
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function AdminDocumentos() {
  const [searchParams] = useSearchParams();
  const clienteParam = searchParams.get('cliente');

  const [tab, setTab] = useState<Tab>('fila');
  const [org, setOrg] = useState('');
  const [docType, setDocType] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'tabela'>('cards');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [lightboxDoc, setLightboxDoc] = useState<QueueDoc | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmMassApprove, setConfirmMassApprove] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);

  const utils = trpc.useUtils();
  const query = trpc.documents.queue.useQuery({}, { refetchInterval: 20_000 });
  const all = useMemo(() => (query.data ?? []) as QueueDoc[], [query.data]);

  const review = trpc.documents.review.useMutation({
    onSuccess: (_d, vars) => {
      utils.documents.queue.invalidate();
      utils.admin.metrics.invalidate();
      setRejectingId(null);
      if (vars.approve) toast.success('Documento aprovado');
      else toast.success('Documento rejeitado', { description: 'O cliente verá o motivo no painel dele.' });
    },
    onError: (err) => toast.error('Não foi possível revisar', { description: err.message }),
  });

  const waiting = all.filter((d) => d.status === 'pendente' || d.status === 'em_revisao');

  const filtered = useMemo(() => {
    let list = all;
    if (tab === 'fila') list = list.filter((d) => d.status === 'pendente' || d.status === 'em_revisao');
    else list = list.filter((d) => d.status === tab);
    if (clienteParam) list = list.filter((d) => String(d.userId) === clienteParam);
    if (org) list = list.filter((d) => (ORG_BY_DOCTYPE[d.docType] ?? 'Outros') === org);
    if (docType) list = list.filter((d) => d.docType === docType);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          (d.userName ?? '').toLowerCase().includes(term) ||
          (d.userEmail ?? '').toLowerCase().includes(term) ||
          d.fileName.toLowerCase().includes(term),
      );
    }
    return list;
  }, [all, tab, org, docType, search, clienteParam]);

  const reviewedToday = useMemo(() => {
    const today = new Date().toDateString();
    return all.filter(
      (d) =>
        (d.status === 'aprovado' || d.status === 'rejeitado') &&
        d.reviewedAt &&
        new Date(d.reviewedAt).toDateString() === today,
    );
  }, [all]);

  const approve = (doc: QueueDoc) => review.mutate({ documentId: doc.id, approve: true });
  const reject = (doc: QueueDoc, reason: string, note: string) =>
    review.mutate({
      documentId: doc.id,
      approve: false,
      rejectionReason: note.trim() ? `${reason} — ${note.trim()}` : reason,
    });

  // Atalhos de teclado: A aprovar, R rejeitar, V ver grande, ↑↓ navegar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (lightboxDoc) return;
      if (tab !== 'fila' || filtered.length === 0) return;
      const idx = Math.min(focusIdx, filtered.length - 1);
      const doc = filtered[idx];
      const key = e.key.toLowerCase();
      if (key === 'arrowdown') {
        e.preventDefault();
        setFocusIdx(Math.min(filtered.length - 1, idx + 1));
      } else if (key === 'arrowup') {
        e.preventDefault();
        setFocusIdx(Math.max(0, idx - 1));
      } else if (key === 'a' && doc) approve(doc);
      else if (key === 'r' && doc) setRejectingId(doc.id);
      else if (key === 'v' && doc) setLightboxDoc(doc);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, focusIdx, tab, lightboxDoc]);

  const orgs = Array.from(new Set(all.map((d) => ORG_BY_DOCTYPE[d.docType] ?? 'Outros'))).sort();

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const massApprove = async () => {
    for (const doc of filtered.filter((d) => selected.has(d.id))) {
      await review.mutateAsync({ documentId: doc.id, approve: true });
    }
    setSelected(new Set());
    setConfirmMassApprove(false);
  };

  return (
    <div className="space-y-5">
      <AdminToaster />

      {/* S1 — Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl uppercase md:text-4xl">Revisão de documentos</h1>
            <Chip tone="amber">{waiting.length} aguardando</Chip>
          </div>
          <p className="mt-1 font-mono text-sm text-text-muted">
            Você revisou {reviewedToday.length} hoje · meta de SLA &lt; 24h
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShortcutsOpen((v) => !v)}
            className="flex h-10 items-center gap-2 rounded-xl border border-border-subtle px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
            aria-label="Atalhos de teclado"
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" /> Atalhos
          </button>
          {shortcutsOpen && (
            <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-border-subtle bg-bg-elevated p-4 text-sm shadow-xl">
              <p className="mb-2 font-bold text-text-primary">Atalhos da fila</p>
              <ul className="space-y-2 text-text-muted">
                <li className="flex justify-between"><span>Aprovar doc em foco</span><Kbd>A</Kbd></li>
                <li className="flex justify-between"><span>Rejeitar doc em foco</span><Kbd>R</Kbd></li>
                <li className="flex justify-between"><span>Ver grande</span><Kbd>V</Kbd></li>
                <li className="flex justify-between"><span>Navegar fila</span><span><Kbd>↑</Kbd> <Kbd>↓</Kbd></span></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="sticky top-16 z-20 -mx-2 flex flex-wrap items-center gap-2 bg-bg-base/95 px-2 py-3 backdrop-blur">
        <div className="flex rounded-full border border-border-subtle bg-bg-elevated p-1" role="tablist" aria-label="Status">
          {(
            [
              { key: 'fila', label: `Aguardando (${waiting.length})` },
              { key: 'aprovado', label: 'Aprovados' },
              { key: 'rejeitado', label: 'Rejeitados' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setSelected(new Set());
              }}
              className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-taxi-yellow text-bg-base' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-taxi-yellow"
          aria-label="Filtrar por órgão"
        >
          <option value="">Órgão: todos</option>
          {orgs.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-taxi-yellow"
          aria-label="Filtrar por tipo de documento"
        >
          <option value="">Tipo: todos</option>
          {Object.entries(DOC_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex h-10 min-w-48 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 focus-within:border-border-strong">
          <Search className="h-4 w-4 shrink-0 text-text-faint" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente…"
            className="h-full w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-faint"
            aria-label="Buscar por cliente"
          />
        </div>
        {clienteParam && (
          <Chip tone="yellow">
            Cliente #{clienteParam}{' '}
            <a href="/admin/documentos" className="ml-1 underline">
              limpar
            </a>
          </Chip>
        )}
        <div className="flex rounded-full border border-border-subtle bg-bg-elevated p-1" role="tablist" aria-label="Visão">
          {(
            [
              { key: 'cards', label: 'Fila', icon: LayoutGrid },
              { key: 'tabela', label: 'Tabela', icon: List },
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

      {/* Conteúdo */}
      {query.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-10 text-center">
          <p className="text-alert-red">Erro ao carregar a fila de documentos.</p>
          <button
            onClick={() => query.refetch()}
            className="h-10 rounded-full bg-taxi-yellow px-5 text-sm font-bold text-bg-base hover:bg-taxi-yellow-hover"
          >
            Tentar novamente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-12 text-center">
          <img src="/empty-docs.svg" alt="" className="h-32 w-auto opacity-80" />
          {tab === 'fila' && !search && !org && !docType && !clienteParam ? (
            <>
              <h3 className="text-xl font-bold text-text-primary">Fila limpa.</h3>
              <p className="text-text-muted">Novos envios aparecem aqui em tempo real.</p>
              <p className="font-mono text-sm text-text-faint">
                Você revisou {reviewedToday.length} hoje
              </p>
              <Bell className="h-5 w-5 text-text-faint" aria-hidden="true" />
            </>
          ) : (
            <>
              <p className="font-semibold text-text-primary">Nada aqui com esses filtros</p>
              <button
                onClick={() => {
                  setSearch('');
                  setOrg('');
                  setDocType('');
                  setTab('fila');
                }}
                className="h-10 rounded-full border border-border-strong px-5 text-sm text-text-primary transition-colors hover:bg-taxi-yellow/10"
              >
                Limpar filtros
              </button>
            </>
          )}
        </div>
      ) : view === 'cards' ? (
        /* S2 — Fila (cards) */
        <div className="grid gap-4 xl:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((doc, i) => (
              <ReviewCard
                key={doc.id}
                doc={doc}
                expanded={rejectingId === doc.id}
                onToggleReject={() => setRejectingId(rejectingId === doc.id ? null : doc.id)}
                onApprove={() => approve(doc)}
                onConfirmReject={(reason, note) => reject(doc, reason, note)}
                onLightbox={() => setLightboxDoc(doc)}
                pending={review.isPending}
                highlighted={tab === 'fila' && i === focusIdx}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* S3 — Visão tabela */
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[0.75rem] uppercase tracking-wide text-text-faint">
                  {tab === 'fila' && <th className="w-10 px-4 py-3" />}
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Órgão</th>
                  <th className="px-4 py-3 font-medium">Enviado</th>
                  <th className="px-4 py-3 font-medium">Tamanho</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="h-14 border-b border-border-subtle/60 transition-colors last:border-0 hover:bg-bg-elevated">
                    {tab === 'fila' && (
                      <td className="px-4">
                        <input
                          type="checkbox"
                          checked={selected.has(doc.id)}
                          onChange={() => toggleSelect(doc.id)}
                          className="h-4 w-4 accent-taxi-yellow"
                          aria-label={`Selecionar ${doc.fileName}`}
                        />
                      </td>
                    )}
                    <td className="px-4">
                      <p className="font-semibold text-text-primary">{doc.userName ?? 'Cliente'}</p>
                      <p className="text-[0.75rem] text-text-faint">{doc.userEmail ?? ''}</p>
                    </td>
                    <td className="px-4 text-text-muted">
                      {DOC_TYPES[doc.docType as keyof typeof DOC_TYPES] ?? doc.docType}
                    </td>
                    <td className="px-4">
                      <Chip tone="blue">{ORG_BY_DOCTYPE[doc.docType] ?? 'Outros'}</Chip>
                    </td>
                    <td className="px-4">
                      <Chip tone={waitTone(doc.createdAt)}>{timeAgo(doc.createdAt)}</Chip>
                    </td>
                    <td className="px-4 font-mono text-[0.75rem] text-text-muted">{formatSize(doc.sizeBytes)}</td>
                    <td className="px-4">
                      <Chip tone={DOC_STATUS[doc.status]?.tone ?? 'zinc'}>
                        {DOC_STATUS[doc.status]?.label ?? doc.status}
                      </Chip>
                    </td>
                    <td className="px-4">
                      <div className="flex justify-end gap-1.5">
                        {(doc.status === 'pendente' || doc.status === 'em_revisao') && (
                          <>
                            <button
                              onClick={() => approve(doc)}
                              disabled={review.isPending}
                              className="h-8 rounded-full bg-money-green px-3 text-[0.8125rem] font-bold text-bg-base hover:bg-money-green/90 disabled:opacity-50"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => {
                                setView('cards');
                                setRejectingId(doc.id);
                              }}
                              className="h-8 rounded-full border border-alert-red/60 px-3 text-[0.8125rem] font-bold text-alert-red hover:bg-alert-red/10"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setLightboxDoc(doc)}
                          className="h-8 rounded-full px-3 text-[0.8125rem] font-medium text-text-muted hover:bg-bg-surface hover:text-text-primary"
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barra de aprovação em massa */}
      <AnimatePresence>
        {view === 'tabela' && selected.size > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-border-strong bg-bg-elevated px-4 py-3 shadow-xl md:bottom-6"
          >
            <span className="font-mono text-sm text-text-primary">{selected.size} selecionado{selected.size > 1 ? 's' : ''}</span>
            {confirmMassApprove ? (
              <button
                onClick={massApprove}
                disabled={review.isPending}
                className="h-9 rounded-full bg-money-green px-4 text-sm font-bold text-bg-base transition-colors hover:bg-money-green/90 disabled:opacity-50"
              >
                Confirmar aprovação de {selected.size}
              </button>
            ) : (
              <button
                onClick={() => setConfirmMassApprove(true)}
                className="h-9 rounded-full bg-money-green/15 px-4 text-sm font-semibold text-money-green transition-colors hover:bg-money-green/25"
              >
                Aprovar {selected.size} selecionado{selected.size > 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => {
                setSelected(new Set());
                setConfirmMassApprove(false);
              }}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* S4 — Histórico do dia */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface" aria-label="Revisados hoje">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex w-full items-center justify-between p-5 text-left"
          aria-expanded={historyOpen}
        >
          <h2 className="text-lg font-bold text-text-primary">
            Revisados hoje — <span className="font-mono">{reviewedToday.length}</span>
          </h2>
          <ChevronDown
            className={`h-5 w-5 text-text-muted transition-transform ${historyOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        <AnimatePresence>
          {historyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              {reviewedToday.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-text-faint">Nenhuma revisão concluída hoje ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border-subtle text-left text-[0.75rem] uppercase tracking-wide text-text-faint">
                      <th className="px-5 py-2.5 font-medium">Cliente</th>
                      <th className="px-5 py-2.5 font-medium">Documento</th>
                      <th className="px-5 py-2.5 font-medium">Decisão</th>
                      <th className="px-5 py-2.5 font-medium">Motivo</th>
                      <th className="px-5 py-2.5 text-right font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewedToday.map((doc) => (
                      <tr key={doc.id} className="border-b border-border-subtle/60 last:border-0">
                        <td className="px-5 py-3 font-semibold text-text-primary">{doc.userName ?? 'Cliente'}</td>
                        <td className="px-5 py-3 text-text-muted">
                          {DOC_TYPES[doc.docType as keyof typeof DOC_TYPES] ?? doc.docType}
                        </td>
                        <td className="px-5 py-3">
                          <Chip tone={doc.status === 'aprovado' ? 'green' : 'red'}>
                            {doc.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                          </Chip>
                        </td>
                        <td className="max-w-56 truncate px-5 py-3 text-text-muted" title={doc.rejectionReason ?? ''}>
                          {doc.rejectionReason ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-[0.75rem] text-text-faint">
                          {fmtDateTime(doc.reviewedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <DocLightbox
        doc={lightboxDoc}
        onClose={() => setLightboxDoc(null)}
        onApprove={(doc) => {
          approve(doc);
          setLightboxDoc(null);
        }}
        onReject={(doc) => {
          setLightboxDoc(null);
          setTab('fila');
          setView('cards');
          setRejectingId(doc.id);
        }}
        pending={review.isPending}
      />
    </div>
  );
}
