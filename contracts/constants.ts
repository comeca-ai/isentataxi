export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;

// ---------------------------------------------------------------------------
// Domínio IsentaTáxi
// ---------------------------------------------------------------------------

/** Combustível do veículo */
export type FuelType = "flex" | "hibrido" | "eletrico";

/** Resultado do quiz de elegibilidade (pré-análise) */
export type EligibilityResult = "elegivel" | "pendencias" | "nao_elegivel";

/** Origem do lead */
export type LeadSource = "simulador" | "pre_analise";

/** Status do funil do lead */
export type LeadStatus = "novo" | "contatado" | "convertido" | "perdido";

/** Status de uma etapa do processo */
export type StageStatus =
  | "pendente"
  | "em_andamento"
  | "em_revisao"
  | "concluida"
  | "bloqueada"
  | "rejeitada";

/** Status de revisão de um documento */
export type DocumentStatus = "pendente" | "em_revisao" | "aprovado" | "rejeitado";

/** Papel do autor de um evento na timeline */
export type ActorRole = "cliente" | "equipe" | "sistema";

/** Tipos de documento aceitos no upload */
export type DocType =
  | "cnh"
  | "alvara"
  | "crlv_atual"
  | "comprovante_residencia"
  | "certidao_cursos"
  | "dtp_protocolo"
  | "detran_laudo"
  | "sisen_protocolo"
  | "sivei_autorizacao"
  | "nota_fiscal"
  | "outros";

/** Labels pt-BR por tipo de documento */
export const DOC_TYPES: Record<DocType, string> = {
  cnh: "CNH com EAR",
  alvara: "Alvará de taxista",
  crlv_atual: "CRLV do veículo atual",
  comprovante_residencia: "Comprovante de residência",
  certidao_cursos: "Certidão dos cursos obrigatórios",
  dtp_protocolo: "Protocolo DTP/SP156",
  detran_laudo: "Laudo Detran-SP",
  sisen_protocolo: "Protocolo SISEN (IPI)",
  sivei_autorizacao: "Autorização SIVEI (ICMS)",
  nota_fiscal: "Nota fiscal do veículo",
  outros: "Outros documentos",
};

/** Labels pt-BR por tipo de combustível */
export const FUEL_TYPES: Record<FuelType, string> = {
  flex: "Flex",
  hibrido: "Híbrido",
  eletrico: "Elétrico",
};

/** Jornada do processo de isenção em 7 etapas */
export type Stage = {
  n: number;
  slug: string;
  name: string;
  org: string;
  dependsOn: number[];
  parallel?: true;
};

export const STAGES: Stage[] = [
  { n: 1, slug: "cadastro", name: "Cadastro e pré-análise", org: "IsentaTáxi", dependsOn: [] },
  { n: 2, slug: "documentos", name: "Documentos", org: "IsentaTáxi", dependsOn: [1] },
  { n: 3, slug: "dtp", name: "DTP/SP156", org: "Prefeitura de SP", dependsOn: [2], parallel: true },
  { n: 4, slug: "detran", name: "Detran-SP", org: "Detran-SP", dependsOn: [2], parallel: true },
  { n: 5, slug: "sisen", name: "SISEN — Receita Federal (IPI)", org: "Receita Federal", dependsOn: [3] },
  { n: 6, slug: "sivei", name: "SIVEI — Sefaz-SP (ICMS)", org: "Sefaz-SP", dependsOn: [5] },
  { n: 7, slug: "pos-compra", name: "Concessionária + pós-compra", org: "Concessionária", dependsOn: [6] },
];

/** Alíquota interna de ICMS em SP */
export const ICMS_RATE = 0.12;

/** Alíquotas estimadas de IPI por combustível */
export const IPI_RATES: Record<FuelType, number> = {
  flex: 0.11,
  hibrido: 0.065,
  eletrico: 0.03,
};

/** Teto de preço do veículo para isenção (Lei 14.183/2021) */
export const TETO_PRECO = 200_000;

/** Data-limite garantida do teto (senso de urgência) */
export const TETO_DEADLINE_ISO = "2026-12-31T23:59:59-03:00";

/** Investimento único do serviço (R$) */
export const SERVICE_PRICE = 299;

/** CTA secundário de WhatsApp */
export const WHATSAPP_URL = "https://wa.me/5511942299144";
