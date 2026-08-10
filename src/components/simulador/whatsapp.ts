/** Máscara (11) 91234-5678 */
export function maskWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const isValidWhatsapp = (v: string) => v.replace(/\D/g, '').length >= 10;

export interface StoredContactLike {
  name?: string;
  whatsapp?: string;
}

export function loadStoredContact(): StoredContactLike | null {
  try {
    return JSON.parse(localStorage.getItem('itx_contact') ?? 'null') as StoredContactLike | null;
  } catch {
    return null;
  }
}
