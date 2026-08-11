import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  Check,
  Copy,
  Download,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@contracts/types';
import { trpc } from '@/providers/trpc';
import LeadDrawer from '@/components/admin/LeadDrawer';
import {
  AdminToaster,
  Chip,
  ELIGIBILITY,
  LEAD_SOURCE,
  LEAD_STATUS,
  downloadCsv,
  extractSimulation,
  fmtDateTime,
  formatBRL,
  timeAgo,
  waLink,
} from '@/components/admin/shared';

const PAGE_SIZE = 40;

type SortKey = 'name' | 'savings' | 'createdAt';

function leadCsvRows(leads: Lead[]): (string | number | null)[][] {
  return [
    ['ID', 'Nome', 'WhatsApp', 'E-mail', 'Indicação', 'Origem', 'Resultado', 'Status', 'Carro de interesse', 'Economia est. (R$)', 'Criado em', 'Respostas do quiz', 'Simulação'],
    ...leads.map((l) => {
      const sim = extractSimulation(l.simulationSnapshot);
      return [
        l.id,
        l.name,
        l.whatsapp,
        l.email ?? '',
        l.referredBy ?? '',
        LEAD_SOURCE[l.source]?.label ?? l.source,
        l.eligibilityResult ? (ELIGIBILITY[l.eligibilityResult]?.label ?? l.eligibilityResult) : '',
        LEAD_STATUS[l.status]?.label ?? l.status,
        sim.carName ?? '',
        sim.savings ?? '',
        fmtDateTime(l.createdAt),
        l.quizAnswers ? JSON.stringify(l.quizAnswers) : '',
        l.simulationSnapshot ? JSON.stringify(l.simulationSnapshot) : '',
      ];
    }),
  ];
}

export default function AdminLeads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ⌘K / Ctrl+K foca a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const query = trpc.leads.list.useQuery({
    source: (source || undefined) as 'simulador' | 'pre_analise' | undefined,
    status: (status || undefined) as 'novo' | 'contatado' | 'convertido' | 'perdido' | undefined,
    search: debouncedSearch || undefined,
    limit: 500,
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.admin.metrics.invalidate();
      toast.success('Status atualizado');
    },
    onError: (err) => toast.error('Não foi possível atualizar', { description: err.message }),
  });

  const leads = useMemo(() => query.data ?? [], [query.data]);

  // Filtro client-side de resultado + ordenação
  const filtered = useMemo(() => {
    let list = leads;
    if (result) list = list.filter((l) => (l.eligibilityResult ?? '') === result);
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'pt-BR');
      else if (sortKey === 'savings') {
        cmp = (extractSimulation(a.simulationSnapshot).savings ?? 0) - (extractSimulation(b.simulationSnapshot).savings ?? 0);
      } else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [leads, result, sortKey, sortAsc]);

  const visible = filtered.slice(0, visibleCount);

  // Infinite scroll com sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisibleCount((c) => c + PAGE_SIZE);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const resetPaging = () => {
    setVisibleCount(PAGE_SIZE);
    setSelected(new Set());
  };

  // Deep-link ?lead={id}
  const drawerLeadId = searchParams.get('lead');
  const drawerLead = drawerLeadId ? (leads.find((l) => String(l.id) === drawerLeadId) ?? null) : null;
  const openLead = (id: number) => setSearchParams({ lead: String(id) }, { replace: true });
  const closeLead = () => setSearchParams({}, { replace: true });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === 'name');
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map((l) => l.id)));
  };

  const activeChips: { label: string; clear: () => void }[] = [
    ...(source ? [{ label: `Origem: ${LEAD_SOURCE[source]?.label ?? source}`, clear: () => setSource('') }] : []),
    ...(status ? [{ label: `Status: ${LEAD_STATUS[status]?.label ?? status}`, clear: () => setStatus('') }] : []),
    ...(result ? [{ label: `Resultado: ${ELIGIBILITY[result]?.label ?? result}`, clear: () => setResult('') }] : []),
    ...(debouncedSearch ? [{ label: `Busca: "${debouncedSearch}"`, clear: () => setSearch('') }] : []),
  ];

  const clearAll = () => {
    setSource('');
    setStatus('');
    setResult('');
    setSearch('');
  };

  const selectedLeads = filtered.filter((l) => selected.has(l.id));

  const markSelectedContacted = async () => {
    for (const lead of selectedLeads) {
      await updateStatus.mutateAsync({ leadId: lead.id, status: 'contatado' });
    }
    setSelected(new Set());
  };

  const discardSelected = async () => {
    for (const lead of selectedLeads) {
      await updateStatus.mutateAsync({ leadId: lead.id, status: 'perdido' });
    }
    setSelected(new Set());
    setConfirmDiscard(false);
  };

  return (
    <div className="space-y-5">
      <AdminToaster />

      {/* S1 — Header + toolbar */}
      <div>
        <h1 className="font-display text-3xl uppercase md:text-4xl">Leads</h1>
        <p className="mt-1 font-mono text-sm text-text-muted">
          {query.isLoading ? '…' : `${filtered.length.toLocaleString('pt-BR')} ${source || status || result || debouncedSearch ? 'filtrados' : 'no total'}`}
        </p>
      </div>

      <div className="sticky top-16 z-20 -mx-2 space-y-2 bg-bg-base/95 px-2 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 focus-within:border-border-strong">
            <Search className="h-4 w-4 shrink-0 text-text-faint" aria-hidden="true" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPaging();
              }}
              placeholder="Buscar nome ou WhatsApp… (⌘K)"
              className="h-full w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-faint"
              aria-label="Buscar leads"
            />
          </div>
          <select
            value={source}
            onChange={(e) => { setSource(e.target.value); resetPaging(); }}
            className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-taxi-yellow"
            aria-label="Filtrar por origem"
          >
            <option value="">Origem: todas</option>
            <option value="simulador">Simulador</option>
            <option value="pre_analise">Pré-análise</option>
          </select>
          <select
            value={result}
            onChange={(e) => { setResult(e.target.value); resetPaging(); }}
            className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-taxi-yellow"
            aria-label="Filtrar por resultado"
          >
            <option value="">Resultado: todos</option>
            <option value="elegivel">Elegível</option>
            <option value="pendencias">Pendências</option>
            <option value="nao_elegivel">Não elegível</option>
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); resetPaging(); }}
            className="h-10 rounded-xl border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary focus:border-taxi-yellow"
            aria-label="Filtrar por status"
          >
            <option value="">Status: todos</option>
            {Object.entries(LEAD_STATUS).map(([value, cfg]) => (
              <option key={value} value={value}>
                {cfg.label}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                downloadCsv(`leads-isentaxi-${new Date().toISOString().slice(0, 10)}.csv`, leadCsvRows(filtered));
                toast.success('CSV exportado', { description: `${filtered.length} leads (filtros ativos aplicados).` });
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-border-strong px-4 text-sm font-medium text-text-primary transition-colors hover:bg-taxi-yellow/10"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
            </button>
          </div>
        </div>
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {activeChips.map((chip) => (
                <motion.button
                  key={chip.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={chip.clear}
                  className="flex items-center gap-1.5 rounded-full bg-taxi-yellow/15 px-3 py-1 text-[0.75rem] font-medium text-taxi-yellow transition-colors hover:bg-taxi-yellow/25"
                >
                  {chip.label} <X className="h-3 w-3" aria-hidden="true" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* S2 — Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface">
        {query.isError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-alert-red">Erro ao carregar os leads.</p>
            <button
              onClick={() => query.refetch()}
              className="h-10 rounded-full bg-taxi-yellow px-5 text-sm font-bold text-bg-base hover:bg-taxi-yellow-hover"
            >
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 && !query.isLoading ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <img src="/empty-docs.svg" alt="" className="h-28 w-auto opacity-80" />
            {activeChips.length > 0 ? (
              <>
                <p className="font-semibold text-text-primary">Nenhum lead com esses filtros</p>
                <button
                  onClick={clearAll}
                  className="h-10 rounded-full border border-border-strong px-5 text-sm text-text-primary transition-colors hover:bg-taxi-yellow/10"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <p className="max-w-sm text-text-muted">
                  Os leads aparecem aqui assim que alguém simular ou fizer a pré-análise.
                </p>
                <a href="/admin" className="text-sm font-semibold text-taxi-yellow hover:text-taxi-yellow-hover">
                  Ver funil →
                </a>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[0.75rem] uppercase tracking-wide text-text-faint">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={visible.length > 0 && selected.size === visible.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 accent-taxi-yellow"
                      aria-label="Selecionar todos"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-text-primary">
                      Nome <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Carro de interesse</th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('savings')} className="flex items-center gap-1 hover:text-text-primary">
                      Economia est. <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-text-primary">
                      Criado em <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => {
                  const sim = extractSimulation(lead.simulationSnapshot);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openLead(lead.id)}
                      className="h-14 cursor-pointer border-b border-border-subtle/60 transition-colors last:border-0 hover:bg-bg-elevated"
                    >
                      <td className="px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="h-4 w-4 accent-taxi-yellow"
                          aria-label={`Selecionar ${lead.name}`}
                        />
                      </td>
                      <td className="px-4">
                        <p className="font-semibold text-text-primary">{lead.name}</p>
                        <p className="text-[0.75rem] text-text-faint">{timeAgo(lead.createdAt)}</p>
                      </td>
                      <td className="px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-text-muted">{lead.whatsapp}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lead.whatsapp);
                              toast.success('WhatsApp copiado');
                            }}
                            className="rounded p-1 text-text-faint transition-colors hover:text-taxi-yellow"
                            aria-label="Copiar WhatsApp"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={waLink(lead.whatsapp)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-money-green transition-colors hover:bg-money-green/10"
                            aria-label="Abrir conversa no WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4">
                        <Chip tone={LEAD_SOURCE[lead.source]?.tone ?? 'zinc'}>
                          {LEAD_SOURCE[lead.source]?.label ?? lead.source}
                        </Chip>
                      </td>
                      <td className="px-4">
                        {lead.eligibilityResult ? (
                          <Chip tone={ELIGIBILITY[lead.eligibilityResult]?.tone ?? 'zinc'}>
                            {ELIGIBILITY[lead.eligibilityResult]?.label ?? lead.eligibilityResult}
                          </Chip>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 text-text-muted">
                        {sim.carName ?? <span className="text-text-faint">—</span>}
                      </td>
                      <td className="px-4 font-mono text-money-green">
                        {sim.savings != null ? formatBRL(sim.savings) : <span className="text-text-faint">—</span>}
                      </td>
                      <td className="px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateStatus.mutate({
                              leadId: lead.id,
                              status: e.target.value as 'novo' | 'contatado' | 'convertido' | 'perdido',
                            })
                          }
                          className="h-8 rounded-full border border-border-subtle bg-bg-elevated px-2.5 font-mono text-[0.75rem] text-text-primary transition-colors focus:border-taxi-yellow"
                          aria-label={`Status de ${lead.name}`}
                        >
                          {Object.entries(LEAD_STATUS).map(([value, cfg]) => (
                            <option key={value} value={value}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 font-mono text-[0.75rem] text-text-faint">{fmtDateTime(lead.createdAt)}</td>
                    </tr>
                  );
                })}
                {query.isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="h-14 animate-pulse border-b border-border-subtle/60">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4">
                          <div className="h-4 rounded bg-bg-elevated" />
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 text-[0.8125rem] text-text-faint">
            <span className="font-mono">
              mostrando {Math.min(visibleCount, filtered.length)} de {filtered.length.toLocaleString('pt-BR')}
            </span>
            {visibleCount < filtered.length && <span>Carregando…</span>}
          </div>
        )}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Barra de seleção em massa */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-border-strong bg-bg-elevated px-4 py-3 shadow-xl md:bottom-6"
          >
            <span className="flex items-center gap-1.5 font-mono text-sm text-text-primary">
              <Check className="h-4 w-4 text-taxi-yellow" aria-hidden="true" />
              {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={markSelectedContacted}
              disabled={updateStatus.isPending}
              className="h-9 rounded-full bg-warn-amber/15 px-4 text-sm font-semibold text-warn-amber transition-colors hover:bg-warn-amber/25 disabled:opacity-50"
            >
              Marcar contatado
            </button>
            <button
              onClick={() => {
                downloadCsv(`leads-selecionados-${new Date().toISOString().slice(0, 10)}.csv`, leadCsvRows(selectedLeads));
                toast.success('Seleção exportada', { description: `${selectedLeads.length} leads.` });
              }}
              className="h-9 rounded-full border border-border-strong px-4 text-sm font-medium text-text-primary transition-colors hover:bg-taxi-yellow/10"
            >
              Exportar seleção
            </button>
            {confirmDiscard ? (
              <button
                onClick={discardSelected}
                disabled={updateStatus.isPending}
                className="h-9 rounded-full bg-alert-red px-4 text-sm font-bold text-white transition-colors hover:bg-alert-red/90 disabled:opacity-50"
              >
                Confirmar descarte
              </button>
            ) : (
              <button
                onClick={() => setConfirmDiscard(true)}
                className="h-9 rounded-full bg-alert-red/15 px-4 text-sm font-semibold text-alert-red transition-colors hover:bg-alert-red/25"
              >
                Descartar
              </button>
            )}
            <button
              onClick={() => {
                setSelected(new Set());
                setConfirmDiscard(false);
              }}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadDrawer key={drawerLead?.id ?? 'closed'} lead={drawerLead} onClose={closeLead} />
    </div>
  );
}
