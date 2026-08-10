import { useMemo } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  FolderCheck,
  KanbanSquare,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STAGES } from '@contracts/constants';
import { trpc } from '@/providers/trpc';
import {
  AdminToaster,
  Chip,
  ELIGIBILITY,
  LEAD_SOURCE,
  formatNum,
  timeAgo,
} from '@/components/admin/shared';

const META_MES = 50;

type LeadPoint = { day: string; count: number };

/** Delta semana atual vs. semana anterior (leadsLast14Days) */
function weeklyDelta(points: LeadPoint[]): number | null {
  if (points.length < 14) return null;
  const prev = points.slice(0, 7).reduce((s, p) => s + p.count, 0);
  const curr = points.slice(7).reduce((s, p) => s + p.count, 0);
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="font-mono text-[0.8125rem] text-text-faint">—</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-0.5 font-mono text-[0.8125rem] font-bold ${
        up ? 'text-money-green' : 'text-alert-red'
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {up ? '+' : ''}
      {value}%
    </motion.span>
  );
}

function Sparkline({ data }: { data: LeadPoint[] }) {
  const chartData = data.map((p) => ({ v: p.count }));
  return (
    <div className="h-6 w-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="#71717A"
            strokeWidth={1.5}
            dot={(props) => {
              const { cx, cy, index } = props as { cx?: number; cy?: number; index?: number };
              if (index !== chartData.length - 1) return <g key={index} />;
              return <circle key={index} cx={cx} cy={cy} r={2.5} fill="#FACC15" />;
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function LeadsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs">
      <p className="text-text-faint">{label}</p>
      <p className="font-mono text-sm font-bold text-taxi-yellow">
        {formatNum(payload[0]?.value ?? 0)} leads
      </p>
    </div>
  );
}

export default function AdminOverview() {
  const metrics = trpc.admin.metrics.useQuery(undefined, { refetchInterval: 60_000 });
  const processes = trpc.process.listAll.useQuery(undefined, { refetchInterval: 60_000 });
  const lastLeads = trpc.leads.list.useQuery({ limit: 6 });

  const m = metrics.data;
  const delta = useMemo(() => (m ? weeklyDelta(m.leadsLast14Days) : null), [m]);

  const chartData = useMemo(
    () =>
      (m?.leadsLast14Days ?? []).map((p) => {
        const d = new Date(`${p.day}T12:00:00`);
        return { day: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, count: p.count };
      }),
    [m],
  );

  const stageCounts = useMemo(() => {
    const counts = new Array(7).fill(0) as number[];
    for (const row of processes.data ?? []) {
      const s = Math.min(7, Math.max(1, row.process.currentStage));
      counts[s - 1] += 1;
    }
    return counts;
  }, [processes.data]);

  const deadlineAlerts = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- exibição relativa ao tempo atual é intencional
    const now = Date.now();
    return (processes.data ?? []).filter((row) => {
      if (!row.process.postPurchaseDeadline) return false;
      const days = (new Date(row.process.postPurchaseDeadline).getTime() - now) / 86_400_000;
      return days >= 0 && days < 10;
    });
  }, [processes.data]);

  if (metrics.isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-10 text-center">
        <TriangleAlert className="h-8 w-8 text-alert-red" aria-hidden="true" />
        <p className="text-text-muted">Não foi possível carregar as métricas do painel.</p>
        <button
          onClick={() => metrics.refetch()}
          className="flex h-11 items-center gap-2 rounded-full bg-taxi-yellow px-5 text-sm font-bold text-bg-base transition-colors hover:bg-taxi-yellow-hover"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente
        </button>
      </div>
    );
  }

  const kpis = m
    ? [
        { label: 'Leads totais', value: formatNum(m.totalLeads), delta, spark: true },
        {
          label: 'Leads do simulador',
          value: formatNum(m.leadsSimulador),
          sub: m.totalLeads > 0 ? `${((m.leadsSimulador / m.totalLeads) * 100).toFixed(1).replace('.', ',')}% dos leads` : undefined,
          delta: null as number | null,
          spark: false,
        },
        { label: 'Leads da pré-análise', value: formatNum(m.leadsPreAnalise), delta: null as number | null, spark: false },
        { label: 'Processos ativos', value: formatNum(m.totalProcesses), highlight: true, delta: null as number | null, spark: false },
        { label: 'Docs pendentes', value: formatNum(m.docsPendentes), amber: true, delta: null as number | null, spark: false },
        { label: 'Conversão em cliente', value: `${String(m.conversaoPct).replace('.', ',')}%`, green: true, delta: null as number | null, spark: false },
      ]
    : [];

  const funnel = m
    ? [
        { label: 'Leads capturados', value: m.totalLeads },
        { label: 'Simulador', value: m.leadsSimulador },
        { label: 'Pré-análise', value: m.leadsPreAnalise },
        { label: 'Virou processo', value: m.totalProcesses },
      ]
    : [];
  const funnelBase = funnel[0]?.value || 1;

  return (
    <div className="space-y-8">
      <AdminToaster />

      {/* Header */}
      <div>
        <p className="flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-taxi-yellow">
          <span className="zebra-fine inline-block h-[10px] w-6 rounded-sm" aria-hidden="true" />
          Painel operacional
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase md:text-4xl">Visão geral</h1>
        <p className="mt-1 text-sm text-text-muted">KPIs de negócio, funil e saúde da operação.</p>
      </div>

      {/* S1 — KPIs */}
      <section aria-label="Indicadores">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {metrics.isLoading || !m
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border-subtle bg-bg-surface p-5">
                  <div className="h-3 w-20 rounded bg-bg-elevated" />
                  <div className="mt-3 h-7 w-14 rounded bg-bg-elevated" />
                  <div className="mt-3 h-4 w-10 rounded bg-bg-elevated" />
                </div>
              ))
            : kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                  className="rounded-2xl border border-border-subtle bg-bg-surface p-5"
                >
                  <p className="text-[0.75rem] uppercase tracking-wide text-text-muted">{kpi.label}</p>
                  <p
                    className={`mt-2 font-mono text-[1.75rem] font-bold leading-none ${
                      kpi.highlight ? 'text-taxi-yellow' : kpi.green ? 'text-money-green' : kpi.amber ? 'text-warn-amber' : 'text-text-primary'
                    }`}
                  >
                    {kpi.value}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    {'sub' in kpi && kpi.sub ? (
                      <span className="text-[0.75rem] text-text-faint">{kpi.sub}</span>
                    ) : (
                      <Delta value={kpi.delta ?? null} />
                    )}
                    {kpi.spark && <Sparkline data={m.leadsLast14Days} />}
                  </div>
                </motion.div>
              ))}
        </div>
      </section>

      {/* S2 + S3 — Funil e gráfico */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6 lg:col-span-2" aria-label="Funil de conversão">
          <h2 className="text-lg font-bold">Funil — da isca grátis à operação</h2>
          <p className="mt-0.5 text-sm text-text-faint">Todo o período</p>
          <div className="mt-6 space-y-3">
            {funnel.map((stage, i) => {
              const pct = Math.max(4, Math.round((stage.value / funnelBase) * 100));
              const rate = i === 0 ? 100 : funnel[i - 1].value > 0 ? Math.round((stage.value / funnel[i - 1].value) * 1000) / 10 : 0;
              const last = i === funnel.length - 1;
              return (
                <Link
                  to="/admin/leads"
                  key={stage.label}
                  className="group flex items-center gap-3"
                  title={`${formatNum(stage.value)} no estágio`}
                >
                  <span className="w-32 shrink-0 text-sm text-text-muted group-hover:text-text-primary">
                    {stage.label}
                  </span>
                  <div className="flex-1">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      style={{ width: `${pct}%`, transformOrigin: 'left' }}
                      className={`h-12 rounded-r-full transition-opacity group-hover:opacity-90 ${
                        last
                          ? 'bg-money-green'
                          : 'bg-gradient-to-r from-taxi-yellow to-warn-amber'
                      }`}
                    />
                  </div>
                  <span className="w-32 shrink-0 text-right font-mono text-sm">
                    <span className={last ? 'font-bold text-money-green' : 'text-text-primary'}>
                      {formatNum(stage.value)}
                    </span>{' '}
                    <span className="text-text-faint">({String(rate).replace('.', ',')}%)</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6" aria-label="Leads por dia">
          <h2 className="text-lg font-bold">Leads por dia</h2>
          <p className="mt-0.5 text-sm text-text-faint">Últimos 14 dias</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  interval={2}
                />
                <YAxis hide domain={[0, 'dataMax + 2']} />
                <Tooltip content={<LeadsTooltip />} cursor={{ stroke: '#3F3F46' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#FACC15"
                  strokeWidth={2}
                  fill="url(#leadsFill)"
                  isAnimationActive
                  animationDuration={900}
                  activeDot={{ r: 4, fill: '#FACC15', stroke: '#0A0A0B', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* S4 — Saúde da operação */}
      <section aria-label="Saúde da operação">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
            <h3 className="text-sm font-bold text-text-primary">Processos ativos por etapa</h3>
            <div className="mt-4 space-y-2.5">
              {STAGES.map((s, i) => {
                const count = stageCounts[i];
                const max = Math.max(1, ...stageCounts);
                return (
                  <div key={s.n} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-[0.75rem] text-text-muted" title={s.name}>
                      <span className="font-mono text-text-faint">{s.n}.</span> {s.name.split(' ')[0]}
                      {s.parallel && <span className="ml-1 text-info-blue" title="Etapas paralelas">∥</span>}
                    </span>
                    <div className="h-1.5 flex-1 rounded-full bg-bg-elevated">
                      <div
                        className="h-full rounded-full bg-info-blue transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono text-[0.75rem] text-text-primary">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border-subtle bg-bg-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <FolderCheck className="h-4 w-4 text-warn-amber" aria-hidden="true" />
              Fila de documentos
            </h3>
            <p className="mt-4 font-mono text-4xl font-bold text-warn-amber">
              {m ? formatNum(m.docsPendentes) : '—'}
            </p>
            <p className="mt-1 text-sm text-text-muted">aguardando revisão</p>
            <Link
              to="/admin/documentos"
              className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
            >
              Revisar agora <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <TriangleAlert className="h-4 w-4 text-alert-red" aria-hidden="true" />
              Alertas de prazo
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              {deadlineAlerts.length > 0 ? (
                <Link
                  to="/admin/processos?alerta=pos-compra"
                  className="block rounded-xl border border-alert-red/30 bg-alert-red/10 px-3 py-2 text-alert-red transition-colors hover:bg-alert-red/15"
                >
                  {deadlineAlerts.length}{' '}
                  {deadlineAlerts.length === 1 ? 'cliente com pós-compra vencendo' : 'clientes com pós-compra vencendo'} em &lt; 10 dias
                </Link>
              ) : (
                <p className="text-text-faint">Nenhum prazo de pós-compra vencendo.</p>
              )}
              <Link
                to="/admin/processos"
                className="flex items-center gap-1 text-text-muted transition-colors hover:text-text-primary"
              >
                <KanbanSquare className="h-4 w-4" aria-hidden="true" /> Ver quadro operacional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* S5 — Últimos leads */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface" aria-label="Últimos leads">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-bold">Últimos leads</h2>
          <Link
            to="/admin/leads"
            className="inline-flex items-center gap-1 text-sm font-semibold text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
          >
            Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border-subtle text-left text-[0.75rem] uppercase tracking-wide text-text-faint">
                <th className="px-5 py-2.5 font-medium">Nome</th>
                <th className="px-5 py-2.5 font-medium">WhatsApp</th>
                <th className="px-5 py-2.5 font-medium">Origem</th>
                <th className="px-5 py-2.5 font-medium">Resultado</th>
                <th className="px-5 py-2.5 text-right font-medium">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {(lastLeads.data ?? []).map((lead) => (
                <tr key={lead.id} className="border-b border-border-subtle/60 transition-colors last:border-0 hover:bg-bg-elevated">
                  <td className="px-5 py-3 font-semibold">
                    <Link to={`/admin/leads?lead=${lead.id}`} className="hover:text-taxi-yellow">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-mono text-text-muted">{lead.whatsapp}</td>
                  <td className="px-5 py-3">
                    <Chip tone={LEAD_SOURCE[lead.source]?.tone ?? 'zinc'}>
                      {LEAD_SOURCE[lead.source]?.label ?? lead.source}
                    </Chip>
                  </td>
                  <td className="px-5 py-3">
                    {lead.eligibilityResult ? (
                      <Chip tone={ELIGIBILITY[lead.eligibilityResult]?.tone ?? 'zinc'}>
                        {ELIGIBILITY[lead.eligibilityResult]?.label ?? lead.eligibilityResult}
                      </Chip>
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-text-faint">{timeAgo(lead.createdAt)}</td>
                </tr>
              ))}
              {lastLeads.data && lastLeads.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-faint">
                    Sem dados no período — os leads aparecem aqui assim que alguém simular ou fizer a pré-análise.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* S6 — Meta do mês */}
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5" aria-label="Meta do mês">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Meta de processos — mês atual</h2>
          <span className="font-mono text-sm text-text-primary">
            {m ? formatNum(m.totalProcesses) : '—'}/{META_MES} —{' '}
            <span className="text-taxi-yellow">{m ? Math.round((m.totalProcesses / META_MES) * 100) : 0}%</span>
          </span>
        </div>
        <div className="zebra mt-3 h-3 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, ((m?.totalProcesses ?? 0) / META_MES) * 100)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full bg-taxi-yellow"
          />
        </div>
        <p className="mt-2 text-[0.8125rem] text-text-muted">
          Processos em execução sobre a meta mensal de {META_MES}.
        </p>
      </section>
    </div>
  );
}
