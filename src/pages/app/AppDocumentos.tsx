import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CarFront,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  KeyRound,
  Landmark,
  Lock,
  Receipt,
  Upload,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { WHATSAPP_URL, type DocumentStatus, type DocType } from '@contracts/constants';
import UploadDialog from '@/components/app/UploadDialog';
import DocLightbox, { type PreviewDoc } from '@/components/app/DocLightbox';
import StatusChip from '@/components/app/StatusChip';
import AppToaster from '@/components/app/AppToaster';
import {
  DOC_CHECKLIST,
  DOC_STATUS,
  formatDate,
  type DocGroup,
  type DocChecklistItem,
} from '@/components/app/client-utils';
import { cn } from '@/lib/utils';

type DocRow = {
  id: number;
  docType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  rejectionReason: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
};

const GROUP_ICONS = {
  building: Building2,
  car: CarFront,
  landmark: Landmark,
  receipt: Receipt,
  key: KeyRound,
};

const STORAGE_KEY = 'isentaxi-docs-groups-open';

function loadOpenGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  // Todos abertos por padrão no primeiro acesso
  return Object.fromEntries(DOC_CHECKLIST.map((g) => [g.key, true]));
}

function DocsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando documentos">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-bg-elevated" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-bg-elevated" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface" />
      ))}
    </div>
  );
}

/** Linha de documento (S4) */
function DocLine({
  item,
  doc,
  onUpload,
  onPreview,
}: {
  item: DocChecklistItem;
  doc: DocRow | undefined;
  onUpload: (resend: boolean) => void;
  onPreview: (doc: DocRow) => void;
}) {
  const status: DocumentStatus = doc?.status ?? 'pendente';
  const meta = DOC_STATUS[status];
  const isRejected = status === 'rejeitado';

  return (
    <motion.div
      layout="position"
      id={`doc-${item.key}`}
      initial={isRejected ? { x: -8 } : false}
      animate={isRejected ? { x: [0, -3, 3, -3, 3, 0] } : undefined}
      transition={isRejected ? { duration: 0.4 } : { type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-transparent bg-bg-elevated p-4',
        isRejected && 'border-alert-red/30',
      )}
    >
      {/* thumb/ícone */}
      {doc ? (
        doc.mimeType.startsWith('image/') ? (
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base">
            <FileText className="h-6 w-6 text-taxi-yellow" />
          </span>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base">
            <FileText className="h-6 w-6 text-taxi-yellow" />
          </span>
        )
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base">
          <Upload className="h-5 w-5 text-text-faint" />
        </span>
      )}

      {/* centro */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-text-primary">{item.name}</p>
          {!item.required && (
            <span className="rounded-full border border-border-strong px-2 py-0.5 font-mono text-[0.65rem] text-text-faint">
              condicional
            </span>
          )}
          <AnimatePresence mode="wait">
            <motion.span
              key={status + String(doc?.id ?? '')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <StatusChip meta={meta} />
            </motion.span>
          </AnimatePresence>
          {status === 'aprovado' && <CheckCircle2 className="h-4 w-4 text-money-green" aria-label="Aprovado" />}
        </div>
        <p className="mt-0.5 text-[0.8125rem] text-text-muted">{item.note}</p>
        {isRejected && doc?.rejectionReason && (
          <p className="mt-1 text-[0.8125rem] font-medium text-alert-red">{doc.rejectionReason}</p>
        )}
        {doc && (
          <p className="mt-0.5 font-mono text-xs text-text-faint">
            enviado em {formatDate(doc.createdAt)} · {doc.fileName}
          </p>
        )}
        <p className="mt-1 hidden items-center gap-1 text-[0.7rem] text-text-faint group-hover:flex">
          <Lock className="h-3 w-3" /> Armazenado criptografado. Excluído mediante solicitação (LGPD).
        </p>
      </div>

      {/* ações */}
      <div className="flex items-center gap-2">
        {status === 'pendente' && (
          <button
            type="button"
            onClick={() => onUpload(false)}
            className="rounded-full bg-taxi-yellow px-4 py-2 text-sm font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
          >
            Enviar
          </button>
        )}
        {(status === 'em_revisao' || status === 'aprovado') && doc && (
          <button
            type="button"
            onClick={() => onPreview(doc)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-taxi-yellow/5 hover:text-text-primary"
          >
            <Eye className="h-4 w-4" /> Ver
          </button>
        )}
        {isRejected && (
          <>
            {doc && (
              <button
                type="button"
                onClick={() => onPreview(doc)}
                className="hidden rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary sm:inline-flex sm:items-center sm:gap-1.5"
              >
                <Eye className="h-4 w-4" /> Ver
              </button>
            )}
            <button
              type="button"
              onClick={() => onUpload(true)}
              className="rounded-full border border-alert-red/60 px-4 py-2 text-sm font-bold text-alert-red transition-colors hover:bg-alert-red/10"
            >
              Reenviar
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function AppDocumentos() {
  const docsQ = trpc.documents.mine.useQuery();
  const profileQ = trpc.profile.get.useQuery();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadOpenGroups);
  const [uploadTarget, setUploadTarget] = useState<{ docType: DocType; name: string; resend: boolean } | null>(null);
  const [preview, setPreview] = useState<DocRow | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      /* ignore */
    }
  }, [openGroups]);

  const docs = useMemo(() => (docsQ.data ?? []) as DocRow[], [docsQ.data]);

  const byType = useMemo(() => {
    const map = new Map<string, DocRow>();
    for (const d of docs) {
      const prev = map.get(d.docType);
      if (!prev || new Date(d.createdAt) > new Date(prev.createdAt)) map.set(d.docType, d);
    }
    return map;
  }, [docs]);

  const rejected = docs.filter((d) => d.status === 'rejeitado');
  const approved = docs.filter((d) => d.status === 'aprovado').length;
  const totalItems = DOC_CHECKLIST.flatMap((g) => g.items).length;

  if (docsQ.isLoading || profileQ.isLoading) return <DocsSkeleton />;

  // S7 — estado vazio: cadastro não completado ainda
  if (!profileQ.data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex flex-col items-center py-16 text-center"
      >
        <AppToaster />
        <img src="/empty-docs.svg" alt="" className="w-full max-w-md" />
        <h1 className="mt-6 text-2xl font-bold text-text-primary">Seus documentos aparecem aqui</h1>
        <p className="mt-2 max-w-md text-text-muted">
          Complete o cadastro e inicie a execução para liberar a lista de envio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/cadastro"
            className="inline-flex items-center gap-2 rounded-full bg-taxi-yellow px-6 py-3 font-bold text-bg-base transition-all hover:bg-taxi-yellow-hover hover:shadow-cta-glow"
          >
            Completar cadastro <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Quero iniciar a execução do meu benefício de isenção (R$ 299).')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3 font-bold text-text-primary transition-colors hover:bg-taxi-yellow/5"
          >
            Iniciar execução — R$ 299
          </a>
        </div>
      </motion.div>
    );
  }

  const scrollToFirstRejected = () => {
    const first = rejected[0];
    if (!first) return;
    const item = DOC_CHECKLIST.flatMap((g) => g.items).find((i) => i.docType === first.docType);
    document.getElementById(`doc-${item?.key ?? ''}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
          <h1 className="text-[1.75rem] font-bold leading-tight text-text-primary">Meus documentos</h1>
          <p className="mt-1 text-text-muted">Envie uma vez. A gente distribui em cada órgão por você.</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-text-muted">
              {approved}/{totalItems} aprovados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-[0.7rem] text-text-faint">
              <Lock className="h-3 w-3" /> Criptografado · só sua equipe vê
            </span>
          </div>
          <div className="flex h-2 gap-1 overflow-hidden rounded-full">
            {DOC_CHECKLIST.flatMap((g) => g.items).map((item, idx) => {
              const doc = byType.get(item.docType);
              const st: DocumentStatus = doc?.status ?? 'pendente';
              return (
                <motion.span
                  key={item.key}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: idx * 0.06, duration: 0.3, ease: 'easeOut' }}
                  className={cn('h-full flex-1 origin-left rounded-full', {
                    'bg-money-green': st === 'aprovado',
                    'bg-warn-amber': st === 'em_revisao',
                    'bg-alert-red': st === 'rejeitado',
                    'bg-border-strong': st === 'pendente',
                  })}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* S2 — Alerta de rejeitados */}
      {rejected.length > 0 && (
        <motion.button
          type="button"
          onClick={scrollToFirstRejected}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full items-center gap-3 rounded-2xl border border-alert-red/40 bg-alert-red/10 p-5 text-left"
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alert-red/20"
          >
            <AlertCircle className="h-5 w-5 text-alert-red" />
          </motion.span>
          <div>
            <p className="font-bold text-alert-red">
              {rejected.length} {rejected.length === 1 ? 'documento precisa' : 'documentos precisam'} de atenção
            </p>
            <p className="text-sm text-text-muted">Toque aqui para ir direto ao item e reenviar.</p>
          </div>
        </motion.button>
      )}

      {/* S3 — Grupos por órgão */}
      <div className="space-y-4">
        {DOC_CHECKLIST.map((group: DocGroup) => {
          const open = openGroups[group.key] ?? true;
          const Icon = GROUP_ICONS[group.icon];
          const uploadedCount = group.items.filter((i) => byType.has(i.docType)).length;
          return (
            <section key={group.key} className="rounded-2xl border border-border-subtle bg-bg-surface">
              <button
                type="button"
                onClick={() => setOpenGroups((s) => ({ ...s, [group.key]: !open }))}
                className="flex w-full items-center gap-3 p-5 text-left"
                aria-expanded={open}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-elevated">
                  <Icon className="h-5 w-5 text-taxi-yellow" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-text-primary">{group.org}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-text-faint">
                      {uploadedCount}/{group.items.length}
                    </span>
                    <span className="h-1 w-20 overflow-hidden rounded-full bg-border-subtle">
                      <motion.span
                        className="block h-full rounded-full bg-taxi-yellow"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: group.items.length ? uploadedCount / group.items.length : 0 }}
                        style={{ transformOrigin: 'left' }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-text-faint transition-transform duration-200', open && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 px-5 pb-5">
                      {group.items.map((item) => (
                        <DocLine
                          key={item.key}
                          item={item}
                          doc={byType.get(item.docType)}
                          onUpload={(resend) => setUploadTarget({ docType: item.docType, name: item.name, resend })}
                          onPreview={(doc) => setPreview(doc)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>

      {/* LGPD */}
      <div className="flex justify-center pt-2">
        <a
          href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Quero solicitar a exclusão dos meus dados (LGPD).')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-text-faint underline-offset-4 transition-colors hover:text-text-muted hover:underline"
        >
          Solicitar exclusão dos meus dados
        </a>
      </div>

      {/* S5 — Modal de upload */}
      <AnimatePresence>
        {uploadTarget && (
          <UploadDialog
            docType={uploadTarget.docType}
            docName={uploadTarget.name}
            resend={uploadTarget.resend}
            onClose={() => setUploadTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* S6 — Lightbox de preview */}
      <AnimatePresence>
        {preview && <DocLightbox doc={preview as PreviewDoc} onClose={() => setPreview(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
