import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StageStatus, DocumentStatus, DocType } from '@contracts/constants';
import { DOC_TYPES, ICMS_RATE, TETO_DEADLINE_ISO } from '@contracts/constants';

/** dd/MM/yyyy */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

/** dd/MM/yyyy HH:mm */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/** R$ 26.500 (mono) */
export function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Dias restantes até o teto de isenção 2026 */
export function daysToDeadline(): number {
  return Math.max(0, Math.ceil((new Date(TETO_DEADLINE_ISO).getTime() - Date.now()) / 86_400_000));
}

/** Economia estimada = (IPI + ICMS) × preço de referência */
export function estimateEconomy(priceRef: number, ipiRate: string | number): number {
  const ipi = typeof ipiRate === 'string' ? parseFloat(ipiRate) : ipiRate;
  return Math.round(priceRef * (ipi + ICMS_RATE));
}

// ---------------------------------------------------------------------------
// Metadados visuais de status
// ---------------------------------------------------------------------------

export type StatusMeta = { label: string; className: string };

export const STAGE_STATUS: Record<StageStatus, StatusMeta> = {
  concluida: { label: 'concluída', className: 'border-money-green/40 bg-money-green/10 text-money-green' },
  em_andamento: { label: 'em andamento', className: 'border-info-blue/40 bg-info-blue/10 text-info-blue' },
  em_revisao: { label: 'em revisão', className: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber' },
  pendente: { label: 'pendente', className: 'border-border-strong bg-bg-elevated text-text-muted' },
  bloqueada: { label: 'bloqueada', className: 'border-dashed border-border-strong bg-transparent text-text-faint' },
  rejeitada: { label: 'ação necessária', className: 'border-alert-red/40 bg-alert-red/10 text-alert-red' },
};

export const DOC_STATUS: Record<DocumentStatus, StatusMeta> = {
  pendente: { label: 'pendente', className: 'border-border-strong bg-bg-elevated text-text-muted' },
  em_revisao: { label: 'em revisão', className: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber' },
  aprovado: { label: 'aprovado', className: 'border-money-green/40 bg-money-green/10 text-money-green' },
  rejeitado: { label: 'rejeitado', className: 'border-alert-red/40 bg-alert-red/10 text-alert-red' },
};

// ---------------------------------------------------------------------------
// Checklist documental agrupado por órgão (espelha app-documentos.md §S3)
// ---------------------------------------------------------------------------

export type DocChecklistItem = {
  /** chave única da linha */
  key: string;
  docType: DocType;
  name: string;
  required: boolean;
  note: string;
};

export type DocGroup = {
  key: string;
  org: string;
  icon: 'building' | 'car' | 'landmark' | 'receipt' | 'key';
  lockedUntilStage?: number;
  items: DocChecklistItem[];
};

export const DOC_CHECKLIST: DocGroup[] = [
  {
    key: 'prefeitura',
    org: 'Prefeitura de SP — DTP / SVAT',
    icon: 'building',
    items: [
      { key: 'alvara', docType: 'alvara', name: 'Alvará de taxista (SVAT)', required: true, note: 'PDF ou foto nítida, dentro da validade' },
      { key: 'certidao_cursos', docType: 'certidao_cursos', name: 'Certificado do curso Condutax', required: true, note: 'Curso obrigatório para taxistas de SP' },
      { key: 'dtp_protocolo', docType: 'dtp_protocolo', name: 'Formulário SP156 preenchido', required: true, note: 'Geramos pré-preenchido com seu cadastro — baixe, assine, reenvie' },
    ],
  },
  {
    key: 'detran',
    org: 'Detran-SP',
    icon: 'car',
    items: [
      { key: 'cnh', docType: 'cnh', name: 'CNH com EAR (frente e verso)', required: true, note: 'EAR visível no verso' },
      { key: 'crlv_atual', docType: 'crlv_atual', name: 'CRLV do táxi atual (se for troca)', required: false, note: 'Só se já possui táxi' },
    ],
  },
  {
    key: 'receita',
    org: 'Receita Federal — SISEN / IPI',
    icon: 'landmark',
    items: [
      { key: 'cpf_foto', docType: 'outros', name: 'CPF (documento com foto)', required: true, note: 'RG ou CNH vale' },
      { key: 'comprovante_residencia', docType: 'comprovante_residencia', name: 'Comprovante de residência', required: true, note: 'Até 90 dias (conta de luz, água ou telefone)' },
      { key: 'sisen_protocolo', docType: 'sisen_protocolo', name: 'Termo de autorização SISEN assinado', required: true, note: 'Assinatura digital na plataforma' },
    ],
  },
  {
    key: 'sefaz',
    org: 'Sefaz-SP — SIVEI / ICMS',
    icon: 'receipt',
    items: [
      { key: 'sivei_autorizacao', docType: 'sivei_autorizacao', name: 'Requerimento SIVEI', required: true, note: 'Gerado automaticamente após SISEN deferido' },
      { key: 'declaracao_vinculo', docType: 'detran_laudo', name: 'Declaração de vinculação ao táxi', required: true, note: 'Modelo fornecido' },
    ],
  },
  {
    key: 'taxas',
    org: 'Taxas do processo (guias pagas)',
    icon: 'receipt',
    items: [
      { key: 'guia_paga_taxa', docType: 'guia_paga_taxa', name: 'Comprovante de guia paga', required: true, note: 'A guia precisa estar PAGA — foto ou PDF do comprovante. Guia em aberto trava o processo' },
    ],
  },
  {
    key: 'pos-compra',
    org: 'Concessionária / pós-compra',
    icon: 'key',
    lockedUntilStage: 7,
    items: [
      { key: 'nota_fiscal', docType: 'nota_fiscal', name: 'Nota fiscal da compra', required: true, note: 'Prazo de 60 dias após a compra' },
      { key: 'crlv_novo', docType: 'crlv_atual', name: 'CRLV do veículo novo', required: true, note: 'Após emplacamento' },
    ],
  },
];

/** Itens obrigatórios do checklist (para o widget de resumo) */
export const REQUIRED_DOCS = DOC_CHECKLIST.flatMap((g) => g.items).filter((i) => i.required);

export function docLabel(docType: string): string {
  return DOC_TYPES[docType as DocType] ?? 'Documento';
}

/** % de completude do cadastro a partir dos campos persistidos */
export function profileCompleteness(profile: Record<string, unknown> | null | undefined): number {
  const FIELDS = [
    'cpf', 'rg', 'birthDate', 'phone', 'cnhNumber', 'cnhCategory',
    'alvaraNumber', 'alvaraExpiry', 'cep', 'street', 'number', 'district',
    'intendedVehicleId', 'intendedPrice',
  ] as const;
  if (!profile) return 0;
  const filled = FIELDS.filter((f) => {
    const v = profile[f];
    return v !== null && v !== undefined && v !== '';
  }).length;
  return Math.round((filled / FIELDS.length) * 100);
}
