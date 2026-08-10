import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, Loader2, X } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { DOC_TYPES } from '@contracts/constants';
import type { Document } from '@contracts/types';
import { DOC_STATUS, Chip, fmtDateTime, ORG_BY_DOCTYPE } from '@/components/admin/shared';

export type QueueDoc = Omit<Document, 'data'> & {
  userName: string | null;
  userEmail: string | null;
};

function base64ToObjectUrl(base64: string, mime: string): string {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/** Busca o arquivo (base64 → object URL) sob demanda */
export function useDocUrl(documentId: number | null, enabled: boolean) {
  const query = trpc.documents.download.useQuery(
    { documentId: documentId ?? 0 },
    { enabled: false, retry: 1 },
  );
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || documentId == null || url) return;
    let cancelled = false;
    query.refetch().then((r) => {
      if (!cancelled && r.data) setUrl(base64ToObjectUrl(r.data.base64, r.data.mimeType));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, documentId]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return { url, loading: enabled && !url && query.isFetching, error: query.isError, mimeType: query.data?.mimeType ?? '' };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function extBadge(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'image/png') return 'PNG';
  if (mimeType === 'image/webp') return 'WEBP';
  return 'JPG';
}

/** Thumb do documento (imagem ou placeholder de PDF) */
export function DocThumb({ doc, eager }: { doc: QueueDoc; eager?: boolean }) {
  const { url, loading } = useDocUrl(doc.id, eager ?? true);
  const isImage = doc.mimeType.startsWith('image/');
  return (
    <div className="relative h-full min-h-40 w-full overflow-hidden bg-bg-elevated">
      {isImage && url ? (
        <img src={url} alt={doc.fileName} className="h-full w-full object-cover" loading="lazy" />
      ) : loading ? (
        <div className="flex h-full min-h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-faint" aria-label="Carregando prévia" />
        </div>
      ) : (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-text-faint">
          <FileText className="h-10 w-10" aria-hidden="true" />
          <span className="font-mono text-[0.65rem]">{extBadge(doc.mimeType)}</span>
        </div>
      )}
      <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-taxi-yellow">
        {extBadge(doc.mimeType)}
      </span>
    </div>
  );
}

/** Lightbox de conferência: arquivo grande + dados do cliente + ações */
export function DocLightbox({
  doc,
  onClose,
  onApprove,
  onReject,
  pending,
}: {
  doc: QueueDoc | null;
  onClose: () => void;
  onApprove: (doc: QueueDoc) => void;
  onReject: (doc: QueueDoc) => void;
  pending?: boolean;
}) {
  const { url, loading } = useDocUrl(doc?.id ?? null, doc != null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isPdf = doc?.mimeType === 'application/pdf';
  const isImage = doc?.mimeType.startsWith('image/') ?? false;

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-label={`Conferir ${doc.fileName}`}
        >
          {/* Área do arquivo */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-6" onClick={onClose}>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-3xl items-center justify-center"
            >
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-taxi-yellow" aria-label="Carregando arquivo" />
              ) : isPdf && url ? (
                <iframe src={url} title={doc.fileName} className="h-[80dvh] w-full rounded-xl border border-border-strong bg-white" />
              ) : isImage && url ? (
                <img src={url} alt={doc.fileName} className="max-h-[80dvh] max-w-full rounded-xl border border-border-strong object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-text-muted">
                  <FileText className="h-16 w-16" aria-hidden="true" />
                  <p className="text-sm">Não foi possível carregar a prévia.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar de conferência */}
          <div className="flex w-72 shrink-0 flex-col border-l border-border-subtle bg-bg-surface p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-text-primary">Conferência</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[0.75rem] uppercase tracking-wide text-text-faint">Cliente</dt>
                <dd className="font-semibold text-text-primary">{doc.userName ?? '—'}</dd>
                <dd className="truncate text-[0.75rem] text-text-faint">{doc.userEmail ?? ''}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] uppercase tracking-wide text-text-faint">Documento</dt>
                <dd className="text-text-primary">{DOC_TYPES[doc.docType as keyof typeof DOC_TYPES] ?? doc.docType}</dd>
                <dd className="truncate font-mono text-[0.75rem] text-text-faint">{doc.fileName}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] uppercase tracking-wide text-text-faint">Órgão</dt>
                <dd className="text-text-primary">{ORG_BY_DOCTYPE[doc.docType] ?? 'Outros'}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] uppercase tracking-wide text-text-faint">Enviado em</dt>
                <dd className="font-mono text-text-primary">{fmtDateTime(doc.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] uppercase tracking-wide text-text-faint">Tamanho</dt>
                <dd className="font-mono text-text-primary">{formatSize(doc.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] uppercase tracking-wide text-text-faint">Status</dt>
                <dd>
                  <Chip tone={DOC_STATUS[doc.status]?.tone ?? 'zinc'}>
                    {DOC_STATUS[doc.status]?.label ?? doc.status}
                  </Chip>
                </dd>
              </div>
            </dl>
            {(doc.status === 'pendente' || doc.status === 'em_revisao') && (
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <button
                  onClick={() => onApprove(doc)}
                  disabled={pending}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-money-green text-sm font-bold text-bg-base transition-colors hover:bg-money-green/90 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> Aprovar
                </button>
                <button
                  onClick={() => onReject(doc)}
                  disabled={pending}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-alert-red/60 text-sm font-bold text-alert-red transition-colors hover:bg-alert-red/10 disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" /> Rejeitar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
