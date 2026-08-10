import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CloudUpload, FileText, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import type { DocType } from '@contracts/constants';
import { cn } from '@/lib/utils';
import { formatBytes } from './client-utils';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB (limite do backend)
const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const DOC_TIPS: Record<string, string[]> = {
  cnh: ['Foto nítida, sem reflexo', 'Frente e verso no mesmo arquivo (ou PDF de 2 páginas)', 'Dentro da validade, com EAR visível no verso'],
  alvara: ['PDF ou foto nítida do alvará SVAT', 'Dentro da validade', 'Número do alvará legível'],
  comprovante_residencia: ['Conta de luz, água ou telefone', 'Emitido há até 90 dias', 'Endereço igual ao do cadastro'],
  nota_fiscal: ['Nota fiscal da compra do veículo', 'Emitida pela concessionária', 'Prazo de 60 dias após a compra'],
};
const DEFAULT_TIPS = ['Arquivo legível, sem cortes', 'JPG, PNG, WebP ou PDF', 'Tamanho máximo: 5 MB'];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1]! : result);
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

/** Modal de upload com dropzone (react-dropzone) — máx. 5 MB, pdf/jpeg/png/webp */
export default function UploadDialog({
  docType,
  docName,
  resend,
  onClose,
}: {
  docType: DocType;
  docName: string;
  resend?: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const upload = trpc.documents.upload.useMutation({
    onSuccess: async () => {
      toast.success('Documento enviado! Revisamos em até 1 dia útil.');
      await utils.documents.mine.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Não foi possível enviar. Tente novamente.');
    },
  });

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    if (rejected.length > 0) {
      toast.error('Arquivo inválido. Use JPG, PNG, WebP ou PDF de até 5 MB.');
      return;
    }
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: false,
    noClick: false,
  });

  const submit = async () => {
    if (!file || upload.isPending) return;
    try {
      const base64 = await readAsBase64(file);
      upload.mutate({ docType, fileName: file.name, mimeType: file.type, base64 });
    } catch {
      toast.error('Não foi possível ler o arquivo.');
    }
  };

  const tips = DOC_TIPS[docType] ?? DEFAULT_TIPS;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Enviar — ${docName}`}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-surface p-6"
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: 'spring', duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-text-primary">
            {resend ? 'Reenviar' : 'Enviar'} — {docName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 space-y-1.5">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info-blue" aria-hidden="true" />
              {tip}
            </li>
          ))}
        </ul>

        <div
          {...getRootProps()}
          className={cn(
            'mt-5 flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong text-center transition-colors',
            isDragActive ? 'border-taxi-yellow bg-taxi-yellow/5' : 'hover:border-taxi-yellow hover:bg-taxi-yellow/5',
          )}
        >
          <input {...getInputProps()} />
          <motion.span animate={{ y: isDragActive ? -4 : 0 }} transition={{ duration: 0.2 }}>
            <CloudUpload className={cn('h-8 w-8', isDragActive ? 'text-taxi-yellow' : 'text-text-faint')} />
          </motion.span>
          <p className="text-sm font-medium text-text-primary">Arraste aqui ou toque para escolher</p>
          <p className="font-mono text-xs text-text-faint">JPG, PNG, WebP ou PDF até 5 MB</p>
        </div>

        {/* Câmera (mobile) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > MAX_SIZE) toast.error('Foto muito grande. O limite é 5 MB.');
              else setFile(f);
            }
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-taxi-yellow/5 hover:text-text-primary md:hidden"
        >
          <Camera className="h-4 w-4" /> Tirar foto
        </button>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3"
            >
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base">
                  <FileText className="h-6 w-6 text-taxi-yellow" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{file.name}</p>
                <p className="font-mono text-xs text-text-faint">{formatBytes(file.size)}</p>
                {upload.isPending && (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
                    <div className="zebra-animated h-full w-full" />
                  </div>
                )}
              </div>
              {!upload.isPending && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint transition-colors hover:text-alert-red"
                  aria-label="Remover arquivo"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!file || upload.isPending}
            className={cn(
              'rounded-full bg-taxi-yellow px-5 py-2.5 text-sm font-bold text-bg-base transition-all',
              !file || upload.isPending
                ? 'cursor-not-allowed opacity-40'
                : 'hover:bg-taxi-yellow-hover hover:shadow-cta-glow',
            )}
          >
            {upload.isPending ? 'Enviando…' : 'Enviar para revisão'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
