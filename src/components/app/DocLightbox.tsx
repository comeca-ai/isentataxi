import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { DOC_STATUS, formatBytes, formatDateTime } from './client-utils';
import StatusChip from './StatusChip';
import type { DocumentStatus } from '@contracts/constants';

export type PreviewDoc = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  createdAt: Date | string;
  reviewedAt: Date | string | null;
};

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

/** Lightbox de preview: imagem com zoom ou PDF em iframe; meta mono no rodapé */
export default function DocLightbox({ doc, onClose }: { doc: PreviewDoc; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  const download = trpc.documents.download.useQuery(
    { documentId: doc.id },
    { enabled: false, staleTime: Infinity, retry: 1 },
  );

  useEffect(() => {
    void download.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  const url = useMemo(() => {
    if (!download.data) return null;
    return base64ToBlobUrl(download.data.base64, download.data.mimeType);
  }, [download.data]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const meta = DOC_STATUS[doc.status];
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black/85"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizar ${doc.fileName}`}
    >
      {/* topbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-base/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-sm font-medium text-text-primary">{doc.fileName}</p>
          <StatusChip meta={meta} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* conteúdo */}
      <motion.div
        className="flex flex-1 items-center justify-center overflow-auto p-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={onClose}
      >
        {!url && !download.error && (
          <div className="flex items-center gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando arquivo…
          </div>
        )}
        {download.error && (
          <p className="text-sm text-alert-red">Não foi possível carregar o arquivo. Tente novamente.</p>
        )}
        {url && isPdf && (
          <iframe
            src={url}
            title={doc.fileName}
            className="h-full w-full max-w-4xl rounded-xl border border-border-subtle bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {url && !isPdf && (
          <motion.img
            layout
            src={url}
            alt={doc.fileName}
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => !z);
            }}
            className="cursor-zoom-in rounded-xl border border-border-subtle"
            style={{ maxWidth: zoom ? 'none' : '100%', maxHeight: zoom ? 'none' : '100%', width: zoom ? '140%' : undefined }}
          />
        )}
      </motion.div>

      {/* rodapé meta */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border-subtle bg-bg-base/80 px-4 py-2.5 font-mono text-xs text-text-faint backdrop-blur-sm">
        <span>enviado em {formatDateTime(doc.createdAt)}</span>
        {doc.reviewedAt && <span>revisado em {formatDateTime(doc.reviewedAt)}</span>}
        <span>{formatBytes(doc.sizeBytes)}</span>
      </div>
    </motion.div>
  );
}
