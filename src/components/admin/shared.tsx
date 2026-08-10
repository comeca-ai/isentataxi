import type { ReactNode } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function formatNum(v: number): string {
  return v.toLocaleString('pt-BR');
}

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  const date = toDate(d);
  return date ? format(date, 'dd/MM HH:mm') : '—';
}

export function fmtDate(d: Date | string | null | undefined): string {
  const date = toDate(d);
  return date ? format(date, 'dd/MM/yyyy') : '—';
}

export function timeAgo(d: Date | string | null | undefined): string {
  const date = toDate(d);
  return date ? formatDistanceToNow(date, { locale: ptBR, addSuffix: true }) : '—';
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

/** Link wa.me com número brasileiro (só dígitos) e mensagem opcional */
export function waLink(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) digits = digits.slice(2);
  const base = `https://wa.me/55${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// ---------------------------------------------------------------------------
// Chips de status (pill mono 0.75rem)
// ---------------------------------------------------------------------------

export type ChipTone = 'yellow' | 'blue' | 'green' | 'amber' | 'red' | 'zinc';

const TONE_CLASSES: Record<ChipTone, string> = {
  yellow: 'bg-taxi-yellow/15 text-taxi-yellow',
  blue: 'bg-info-blue/15 text-info-blue',
  green: 'bg-money-green/15 text-money-green',
  amber: 'bg-warn-amber/15 text-warn-amber',
  red: 'bg-alert-red/15 text-alert-red',
  zinc: 'bg-zinc-500/15 text-zinc-400',
};

export function Chip({
  tone,
  children,
  className,
  dashed,
}: {
  tone: ChipTone;
  children: ReactNode;
  className?: string;
  dashed?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[0.75rem] font-medium',
        TONE_CLASSES[tone],
        dashed && 'border border-dashed border-zinc-500/50 bg-transparent',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border-strong bg-bg-base px-1.5 py-0.5 font-mono text-[0.65rem] text-text-faint">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// Mapas de rótulos pt-BR
// ---------------------------------------------------------------------------

export const LEAD_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  novo: { label: 'Novo', tone: 'blue' },
  contatado: { label: 'Contatado', tone: 'amber' },
  convertido: { label: 'Convertido', tone: 'green' },
  perdido: { label: 'Perdido', tone: 'zinc' },
};

export const LEAD_SOURCE: Record<string, { label: string; tone: ChipTone }> = {
  simulador: { label: 'Simulador', tone: 'yellow' },
  pre_analise: { label: 'Pré-análise', tone: 'blue' },
};

export const ELIGIBILITY: Record<string, { label: string; tone: ChipTone }> = {
  elegivel: { label: 'Elegível', tone: 'green' },
  pendencias: { label: 'Pendências', tone: 'amber' },
  nao_elegivel: { label: 'Não elegível', tone: 'zinc' },
};

export const STAGE_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  pendente: { label: 'Pendente', tone: 'zinc' },
  em_andamento: { label: 'Em andamento', tone: 'blue' },
  em_revisao: { label: 'Em revisão', tone: 'amber' },
  concluida: { label: 'Concluída', tone: 'green' },
  bloqueada: { label: 'Bloqueada', tone: 'zinc' },
  rejeitada: { label: 'Rejeitada', tone: 'red' },
};

export const DOC_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  pendente: { label: 'Aguardando', tone: 'zinc' },
  em_revisao: { label: 'Em revisão', tone: 'amber' },
  aprovado: { label: 'Aprovado', tone: 'green' },
  rejeitado: { label: 'Rejeitado', tone: 'red' },
};

/** Órgão responsável por tipo de documento (para filtros da fila) */
export const ORG_BY_DOCTYPE: Record<string, string> = {
  cnh: 'Detran',
  alvara: 'Prefeitura',
  crlv_atual: 'Detran',
  comprovante_residencia: 'Prefeitura',
  certidao_cursos: 'Prefeitura',
  dtp_protocolo: 'Prefeitura',
  detran_laudo: 'Detran',
  sisen_protocolo: 'SISEN',
  sivei_autorizacao: 'SIVEI',
  nota_fiscal: 'Concessionária',
  outros: 'Outros',
};

// ---------------------------------------------------------------------------
// Leitura de JSONs do lead (simulação / quiz)
// ---------------------------------------------------------------------------

export type SimulationInfo = {
  carName: string | null;
  savings: number | null;
  price: number | null;
};

/** Extrai campos conhecidos do snapshot da simulação (record livre) */
export function extractSimulation(snapshot: unknown): SimulationInfo {
  const info: SimulationInfo = { carName: null, savings: null, price: null };
  if (!snapshot || typeof snapshot !== 'object') return info;
  for (const [key, value] of Object.entries(snapshot as Record<string, unknown>)) {
    const k = key.toLowerCase();
    if (typeof value === 'string' && value.trim()) {
      if (!info.carName && /(vehicle|modelo|carro|carnome|vehiclename)/.test(k)) {
        info.carName = value;
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (info.savings == null && /(saving|economia|desconto)/.test(k)) info.savings = value;
      if (info.price == null && /(price|preco|valor)/.test(k) && !/final/.test(k)) info.price = value;
    }
    if (!info.carName && value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      if (typeof nested.name === 'string' && /(vehicle|carro|modelo|car)/.test(k)) {
        info.carName = nested.name;
      }
    }
  }
  return info;
}

/** Transforma chave técnica em rótulo legível */
export function humanizeKey(key: string): string {
  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/** Formata valor de resposta do quiz */
export function formatAnswer(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  if (Array.isArray(value)) return value.map(formatAnswer).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${humanizeKey(k)}: ${formatAnswer(v)}`)
      .join(' · ');
  }
  return String(value);
}

/** Resposta que indica pendência (dot âmbar no drawer) */
export function isNegativeAnswer(value: unknown): boolean {
  if (value === false) return true;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'não' || v === 'nao' || v.startsWith('não ') || v.startsWith('nao ');
  }
  return false;
}

// ---------------------------------------------------------------------------
// Toaster admin (uma instância por página)
// ---------------------------------------------------------------------------

export function AdminToaster() {
  return <Toaster theme="dark" position="top-right" richColors closeButton />;
}

// ---------------------------------------------------------------------------
// Exportação CSV (client-side, compatível com Excel pt-BR)
// ---------------------------------------------------------------------------

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
