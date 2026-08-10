import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { addDays } from 'date-fns';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import {
  IPVA_ZERO_KM_DEADLINE_DAYS,
  LICENCIAMENTO_2026,
  SEFAZ_IPVA_URL,
  STAGES,
  WHATSAPP_URL,
  type StageStatus,
} from '@contracts/constants';
import StageTimeline from '@/components/app/StageTimeline';
import ProgressRing from '@/components/app/ProgressRing';
import AppToaster from '@/components/app/AppToaster';
import {
  daysToDeadline,
  docLabel,
  estimateEconomy,
  formatBRL,
  formatDate,
  profileCompleteness,
  REQUIRED_DOCS,
} from '@/components/app/client-utils';
import { cn } from '@/lib/utils';

/** Prazo típico (dias) por etapa — para o chip "Previsão" */
const STAGE_DAYS: Record<number, number> = { 1: 2, 2: 7, 3: 42, 4: 30, 5: 45, 6: 30, 7: 60, 8: 30 };
const STAGE_BLURB: Record<number, string> = {
  1: 'Conferindo seus dados de cadastro e pré-análise.',
  2: 'Envie os documentos — nossa equipe revisa em até 1 dia útil.',
  3: 'Seus documentos foram protocolados na Prefeitura. Prazo típico: 2–6 semanas.',
  4: 'Vistoria e laudo do veículo no Detran-SP. Prazo típico: 2–4 semanas.',
  5: 'Pedido de isenção de IPI na Receita Federal. Prazo típico: 4–6 semanas.',
  6: 'Autorização de ICMS na Sefaz-SP. Prazo típico: 2–4 semanas.',
  7: 'Hora de comprar seu táxi 0 km! Comprove em até 60 dias.',
  8: 'Pedido de isenção de IPVA no SIVEI em até 30 dias da NF-e.',
};

type FeedEntry = { id: string; date: Date; text: string; tone: 'blue' | 'green' | 'red' | 'zinc' | 'amber' };

const FEED_DOT: Record<FeedEntry['tone'], string> = {
  blue: 'bg-info-blue',
  green: 'bg-money-green',
  red: 'bg-alert-red',
  zinc: 'bg-text-faint',
  amber: 'bg-warn-amber',
};

const STAGE_FEED_TONE: Record<StageStatus, FeedEntry['tone']> = {
  concluida: 'green',
  em_andamento: 'blue',
  em_revisao: 'amber',
  pendente: 'zinc',
  bloqueada: 'zinc',
  rejeitada: 'red',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando painel">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-bg-elevated" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-bg-elevated" />
      </div>
      <div className="h-44 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-[480px] animate-pulse rounded-2xl border border-border-subtle bg-bg-surface lg:col-span-2" />
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl border border-border-subtle bg-bg-elevated" />
          <div className="h-36 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
        </div>
      </div>
    </div>
  );
}

export default function AppDashboard() {
  const { user } = useAuth();
  const processQ = trpc.process.mine.useQuery(undefined, { refetchInterval: 30_000 });
  const docsQ = trpc.documents.mine.useQuery();
  const profileQ = trpc.profile.get.useQuery();
  const vehiclesQ = trpc.vehicles.list.useQuery();

  const isLoading = processQ.isLoading || docsQ.isLoading || profileQ.isLoading;

  const derived = (() => {
    if (!processQ.data) return null;
    const { process, stages } = processQ.data;
    const docs = docsQ.data ?? [];
    const currentStage = process.currentStage;
    const currentRow = stages.find((s) => s.stage === currentStage);
    const currentDef = STAGES.find((s) => s.n === currentStage);
    const done = stages.filter((s) => s.status === 'concluida').length;
    const percent = Math.round((done / STAGES.length) * 100);

    const docsByType = new Map<string, (typeof docs)[number]>();
    for (const d of docs) {
      const prev = docsByType.get(d.docType);
      if (!prev || new Date(d.createdAt) > new Date(prev.createdAt)) docsByType.set(d.docType, d);
    }
    const rejected = docs.filter((d) => d.status === 'rejeitado');
    const requiredTypes = REQUIRED_DOCS.map((r) => r.docType);
    const missingCount = requiredTypes.filter((t) => !docsByType.has(t)).length;

    const profile = profileQ.data ?? null;
    const completeness = profileCompleteness(profile);

    const vehicle = profile?.intendedVehicleId
      ? (vehiclesQ.data ?? []).find((v) => v.id === profile.intendedVehicleId)
      : undefined;
    const economy = vehicle ? estimateEconomy(vehicle.priceRef, vehicle.ipiRate) : null;

    // Feed de atualizações derivado de etapas + documentos
    const feed: FeedEntry[] = [];
    for (const s of stages) {
      const def = STAGES.find((d) => d.n === s.stage);
      feed.push({
        id: `stage-${s.id}`,
        date: new Date(s.updatedAt),
        text: `Etapa ${s.stage} (${def?.name ?? s.stage}) — ${s.status.replace('_', ' ')}`,
        tone: STAGE_FEED_TONE[s.status as StageStatus] ?? 'zinc',
      });
    }
    for (const d of docs) {
      feed.push({
        id: `doc-${d.id}`,
        date: new Date(d.createdAt),
        text: `Documento enviado: ${docLabel(d.docType)}`,
        tone: 'blue',
      });
      if (d.reviewedAt && d.status === 'aprovado') {
        feed.push({
          id: `doc-ok-${d.id}`,
          date: new Date(d.reviewedAt),
          text: `Documento aprovado: ${docLabel(d.docType)}`,
          tone: 'green',
        });
      }
      if (d.reviewedAt && d.status === 'rejeitado') {
        feed.push({
          id: `doc-bad-${d.id}`,
          date: new Date(d.reviewedAt),
          text: `Documento rejeitado: ${docLabel(d.docType)}`,
          tone: 'red',
        });
      }
    }
    feed.sort((a, b) => b.date.getTime() - a.date.getTime());

    const previsao = currentRow ? addDays(new Date(currentRow.updatedAt), STAGE_DAYS[currentStage] ?? 30) : null;

    // Lembretes pós-compra (IPVA + licenciamento) derivados do perfil
    const purchaseDate = profile?.purchaseDate ?? null;
    const ipvaDaysLeft = purchaseDate
      ? IPVA_ZERO_KM_DEADLINE_DAYS -
        Math.floor((Date.now() - new Date(`${purchaseDate}T00:00:00`).getTime()) / 86_400_000)
      : null;
    const plateDigit = profile?.plateFinalDigit ?? null;
    const licMonth = plateDigit ? (LICENCIAMENTO_2026.calendario[Number(plateDigit)] ?? null) : null;

    const reachedStage7 = currentStage >= 7;
    const deadlineDays = process.postPurchaseDeadline
      ? Math.max(0, Math.ceil((new Date(process.postPurchaseDeadline).getTime() - new Date().getTime()) / 86_400_000))
      : 60;

    return {
      process,
      stages,
      docs,
      currentStage,
      currentRow,
      currentDef,
      percent,
      rejected,
      missingCount,
      completeness,
      vehicle,
      economy,
      feed: feed.slice(0, 20),
      previsao,
      reachedStage7,
      deadlineDays,
      ipvaDaysLeft,
      licMonth,
      plateDigit,
      purchaseDate,
    };
  })();

  if (isLoading || !derived) return <DashboardSkeleton />;

  const firstName = (user?.name ?? 'taxista').trim().split(' ')[0] ?? 'taxista';
  const waMessage = encodeURIComponent(
    `Olá! Sou ${user?.name ?? 'cliente'} da IsentaTáxi, processo #${derived.process.id} (etapa ${derived.currentStage}/8). Preciso de ajuda.`,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="space-y-6"
    >
      <AppToaster />

      {/* S1 — Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold leading-tight text-text-primary">Olá, {firstName}.</h1>
          <p className="mt-1 text-text-muted">
            Seu processo de isenção está em andamento. Protocolado em {formatDate(derived.process.createdAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-info-blue/40 bg-info-blue/10 px-3 py-1 font-mono text-xs text-info-blue">
            Etapa {derived.currentStage}/8 — {derived.currentDef?.name ?? ''}
          </span>
          <span className="rounded-full border border-warn-amber/40 bg-warn-amber/10 px-3 py-1 font-mono text-xs text-warn-amber">
            {daysToDeadline()} dias p/ o teto 2026
          </span>
        </div>
      </div>

      {/* S2 — Progresso geral */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
        className="grid items-center gap-8 rounded-2xl border border-border-subtle bg-bg-surface p-6 md:grid-cols-[auto_1fr_auto] lg:p-8"
      >
        <div className="mx-auto">
          <ProgressRing percent={derived.percent} />
        </div>
        <div className="text-center md:text-left">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-taxi-yellow">Você está aqui</p>
          <h2 className="mt-2 text-xl font-bold text-text-primary md:text-2xl">
            {derived.currentDef?.name ?? '—'} — {derived.currentDef?.org ?? ''}
          </h2>
          <p className="mt-1.5 text-sm text-text-muted">
            {derived.currentRow?.notes ?? STAGE_BLURB[derived.currentStage] ?? ''}
          </p>
          {derived.previsao && (
            <span className="mt-3 inline-block rounded-full border border-info-blue/40 bg-info-blue/10 px-3 py-1 font-mono text-xs text-info-blue">
              Previsão: até {formatDate(derived.previsao)}
            </span>
          )}
        </div>
        <div className="mx-auto flex items-center gap-4 md:mx-0 md:flex-col md:items-end md:gap-2">
          <div className="text-center md:text-right">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-money-green">
              Sua economia estimada
            </p>
            <p className="mt-1 font-mono text-[2rem] font-bold leading-none text-money-green">
              {derived.economy !== null ? formatBRL(derived.economy) : '—'}
            </p>
            <p className="mt-1 text-xs text-text-faint">
              {derived.vehicle ? `${derived.vehicle.name} · estimativa` : 'Defina o veículo no cadastro · estimativa'}
            </p>
          </div>
          {derived.vehicle && (
            <img
              src={derived.vehicle.imageUrl}
              alt={derived.vehicle.name}
              className="h-14 w-20 rounded-lg border border-border-subtle object-cover"
              loading="lazy"
            />
          )}
        </div>
      </motion.section>

      {/* S7 — Banner pós-compra (etapa 7) */}
      {derived.reachedStage7 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.28, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-taxi-yellow p-8 text-bg-base"
        >
          <div>
            <h3 className="flex items-center gap-2 text-2xl font-bold uppercase">
              <PartyPopper className="h-6 w-6" /> Parabéns, seu táxi chegou!
            </h3>
            <p
              className={cn(
                'mt-2 font-mono text-lg font-bold',
                derived.deadlineDays < 10 && 'animate-pulse text-alert-red',
              )}
            >
              Faltam {derived.deadlineDays} dias para comprovar a compra
            </p>
          </div>
          <Link
            to="/app/documentos"
            className="inline-flex items-center gap-2 rounded-full bg-bg-base px-6 py-3 font-bold text-taxi-yellow transition-transform hover:scale-[1.03]"
          >
            <Upload className="h-4 w-4" /> Enviar nota fiscal
          </Link>
        </motion.section>
      )}

      {/* S7b — Lembretes (IPVA + licenciamento) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.28, ease: 'easeOut' }}
        className="rounded-2xl border border-border-subtle bg-bg-surface p-6"
      >
        <h3 className="flex items-center gap-2 font-bold text-text-primary">
          <BellRing className="h-5 w-5 text-taxi-yellow" /> Lembretes
        </h3>
        {!derived.purchaseDate && !derived.plateDigit ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              Complete seus dados pós-compra (data da NF-e e final da placa) para ativar os lembretes de IPVA e
              licenciamento.
            </p>
            <Link
              to="/app/cadastro"
              className="inline-flex items-center gap-2 rounded-full bg-taxi-yellow px-4 py-2 text-sm font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
            >
              Complete seus dados pós-compra <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {derived.ipvaDaysLeft !== null && (
              <li className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-taxi-yellow" />
                <span className="text-sm text-text-primary">
                  Pedido SIVEI IPVA:{' '}
                  {derived.ipvaDaysLeft > 0 ? (
                    <span
                      className={cn(
                        'font-mono font-bold',
                        derived.ipvaDaysLeft <= 7 ? 'animate-pulse text-alert-red' : 'text-text-primary',
                      )}
                    >
                      {derived.ipvaDaysLeft} dias restantes
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-money-green">
                      prazo encerrado — verifique a certidão
                    </span>
                  )}
                  <span className="ml-2 text-text-faint">regra dos {IPVA_ZERO_KM_DEADLINE_DAYS} dias da NF-e</span>
                </span>
              </li>
            )}
            {derived.licMonth && (
              <li className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-info-blue" />
                <span className="text-sm text-text-primary">
                  Licenciamento 2026: ~{derived.licMonth} —{' '}
                  R$ {LICENCIAMENTO_2026.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="ml-2 rounded-full border border-border-strong bg-bg-elevated px-2 py-0.5 font-mono text-[0.7rem] text-text-muted">
                    calendário estimado
                  </span>
                </span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-money-green" />
              <a
                href={SEFAZ_IPVA_URL}
                target="_blank"
                rel="noreferrer"
                className="group text-sm text-text-primary hover:underline"
              >
                Certidão de isenção IPVA — conferir 1×/ano
                <ExternalLink className="ml-1.5 inline h-3.5 w-3.5 text-text-faint group-hover:text-taxi-yellow" />
              </a>
            </li>
          </ul>
        )}
      </motion.section>

      {/* S3 + S4/S5/S6 — grid */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.28, ease: 'easeOut' }}
          className="rounded-2xl border border-border-subtle bg-bg-surface p-6 lg:col-span-2 lg:p-8"
        >
          <h2 className="text-lg font-bold text-text-primary">As 8 etapas do seu processo</h2>
          <p className="mb-4 mt-1 text-sm text-text-muted">Toque numa etapa para ver detalhes e documentos.</p>
          <StageTimeline
            rows={derived.stages.map((s) => ({
              stage: s.stage,
              status: s.status as StageStatus,
              notes: s.notes,
              updatedAt: s.updatedAt,
            }))}
            currentStage={derived.currentStage}
            docs={derived.docs.map((d) => ({ id: d.id, docType: d.docType, fileName: d.fileName, status: d.status }))}
          />
        </motion.section>

        <div className="space-y-6">
          {/* S4 — Próximas ações */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.28, ease: 'easeOut' }}
            className="rounded-2xl border-l-4 border-l-taxi-yellow border border-border-subtle bg-bg-elevated p-6"
          >
            <h3 className="font-bold text-text-primary">Próximas ações</h3>
            <ul className="mt-4 space-y-3">
              {derived.rejected.map((d) => (
                <li key={`rej-${d.id}`}>
                  <Link to="/app/documentos" className="group flex items-start gap-3">
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-alert-red" />
                    <span className="text-sm text-text-primary group-hover:underline">
                      Reenvie: {docLabel(d.docType)}
                      <span className="ml-2 rounded-full border border-alert-red/40 bg-alert-red/10 px-2 py-0.5 font-mono text-[0.7rem] text-alert-red">
                        rejeitado
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {derived.missingCount > 0 && (
                <li>
                  <Link to="/app/documentos" className="group flex items-start gap-3">
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-faint" />
                    <span className="text-sm text-text-primary group-hover:underline">
                      Envie seus documentos pendentes
                      <span className={cn(
                        'ml-2 rounded-full border px-2 py-0.5 font-mono text-[0.7rem]',
                        derived.rejected.length > 0
                          ? 'border-alert-red/40 bg-alert-red/10 text-alert-red'
                          : 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber',
                      )}
                      >
                        faltam {derived.missingCount} docs
                      </span>
                    </span>
                  </Link>
                </li>
              )}
              {derived.completeness < 100 && (
                <li>
                  <Link to="/app/cadastro" className="group flex items-start gap-3">
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-faint" />
                    <span className="text-sm text-text-primary group-hover:underline">
                      Complete seu cadastro
                      <span className="ml-2 rounded-full border border-info-blue/40 bg-info-blue/10 px-2 py-0.5 font-mono text-[0.7rem] text-info-blue">
                        {derived.completeness}% completo
                      </span>
                    </span>
                  </Link>
                </li>
              )}
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-money-green" />
                <span className="text-sm text-text-muted line-through decoration-money-green/60">
                  Cadastro na plataforma realizado
                </span>
              </li>
            </ul>
            <Link
              to="/app/documentos"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-taxi-yellow transition-colors hover:text-taxi-yellow-hover"
            >
              Ver todos os documentos <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.section>

          {/* S5 — Widget documentos */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.28, ease: 'easeOut' }}
            className="relative rounded-2xl border border-border-subtle bg-bg-surface p-6"
          >
            {derived.rejected.length > 0 && (
              <span className="absolute -top-2 right-4 flex items-center gap-1.5 rounded-full bg-alert-red px-2.5 py-0.5 text-[0.7rem] font-bold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                {derived.rejected.length} {derived.rejected.length === 1 ? 'documento precisa' : 'documentos precisam'} de atenção
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold text-text-primary">Documentos</h3>
              <span className="font-mono text-sm text-text-muted">
                {derived.docs.filter((d) => d.status === 'aprovado').length}/{REQUIRED_DOCS.length} aprovados
              </span>
            </div>
            <div className="mt-3 flex h-2 gap-1 overflow-hidden rounded-full">
              {(['aprovado', 'em_revisao', 'rejeitado', 'pendente'] as const).map((st) => {
                const count =
                  st === 'pendente'
                    ? derived.missingCount
                    : derived.docs.filter((d) => d.status === st).length;
                if (count === 0) return null;
                return (
                  <motion.div
                    key={st}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={cn('h-full origin-left rounded-full', {
                      'bg-money-green': st === 'aprovado',
                      'bg-warn-amber': st === 'em_revisao',
                      'bg-alert-red': st === 'rejeitado',
                      'bg-border-strong': st === 'pendente',
                    })}
                    style={{ flexGrow: count }}
                    title={`${count} ${st.replace('_', ' ')}`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-text-faint">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-money-green" /> aprovado</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warn-amber" /> em revisão</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-alert-red" /> rejeitado</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-border-strong" /> pendente</span>
            </div>
            {derived.rejected.length > 0 && (
              <Link
                to="/app/documentos"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-alert-red/40 px-4 py-2 text-sm font-bold text-alert-red transition-colors hover:bg-alert-red/10"
              >
                Resolver <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </motion.section>

          {/* S6 — Suporte */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.28, ease: 'easeOut' }}
            className="rounded-2xl border border-border-subtle bg-bg-surface p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-money-green/10">
                <MessageCircle className="h-5 w-5 text-money-green" />
              </span>
              <div>
                <h3 className="font-bold text-text-primary">Dúvida? Fala com humano</h3>
                <p className="text-xs text-text-faint">Seg–Sáb, 8h–20h</p>
              </div>
            </div>
            <a
              href={`${WHATSAPP_URL}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-money-green/50 px-4 py-2.5 text-sm font-bold text-money-green transition-colors hover:bg-money-green/10"
            >
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
            </a>
          </motion.section>
        </div>
      </div>

      {/* S6b — Feed de atualizações */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.28, ease: 'easeOut' }}
        className="rounded-2xl border border-border-subtle bg-bg-surface p-6"
      >
        <h3 className="font-bold text-text-primary">Atualizações do processo</h3>
        <div className="mt-4 max-h-80 space-y-1 overflow-auto pr-2">
          {derived.feed.length === 0 && (
            <p className="text-sm text-text-muted">As movimentações do seu processo aparecem aqui.</p>
          )}
          {derived.feed.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg-elevated">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', FEED_DOT[entry.tone])} aria-hidden="true" />
              <p className="flex-1 text-sm text-text-primary">{entry.text}</p>
              <span className="shrink-0 font-mono text-xs text-text-faint">{formatDate(entry.date)}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Aviso legal */}
      <p className="flex items-start gap-2 text-[0.8125rem] text-text-faint">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Valores de economia são estimativas com base nas alíquotas vigentes. Quem defere o benefício é o órgão público.
      </p>
    </motion.div>
  );
}
