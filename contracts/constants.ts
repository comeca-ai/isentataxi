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
  { n: 8, slug: "ipva", name: "IPVA — isenção estadual", org: "SIVEI / Sefaz-SP", dependsOn: [7] },
];

/** Alíquota de IPVA em SP para veículos de passeio (4% do valor venal/ano) */
export const IPVA_RATE = 0.04;

/**
 * Gatilhos que baixam a isenção de IPVA automaticamente — a Sefaz cobra o IPVA
 * proporcional dos meses restantes do ano.
 */
export const IPVA_TRIGGERS: string[] = [
  "Venda ou transferência do veículo",
  "Pedido de isenção para outro veículo (só vale 1 isento por CPF)",
  "Deixar de rodar como táxi — alvará inativo ou conversão para uso particular",
];

/**
 * Nota do 1º ano: taxista novo precisa comprovar ≥1 ano de atividade
 * (declaração do órgão municipal + INSS/MEI/CTPS) — por isso paga o 1º IPVA.
 */
export const IPVA_FIRST_YEAR_NOTE =
  "Taxista novo: o pedido exige declaração do órgão municipal comprovando pelo menos 1 ano de atividade (com INSS, MEI ou CTPS). Por isso, normalmente se paga o 1º IPVA — a isenção vale do próximo ano em diante.";

/** Prazo para pedir a isenção no SIVEI em carro 0 km (dias após a NF-e) */
export const IPVA_ZERO_KM_DEADLINE_DAYS = 30;

/** Licenciamento anual Detran-SP 2026 — NÃO é isento. Calendário estimado. */
export const LICENCIAMENTO_2026 = {
  valor: 174.08,
  calendario: {
    1: "jul",
    2: "jul",
    3: "ago",
    4: "ago",
    5: "set",
    6: "set",
    7: "out",
    8: "out",
    9: "nov",
    0: "dez",
  } as Record<number, string>,
} as const;

/** Link oficial Sefaz-SP — consulta de certidão de isenção de IPVA */
export const SEFAZ_IPVA_URL =
  "https://servicos.sp.gov.br/fcarta/BD28413F-2B49-4BFE-9C04-38ACAF72EAE8";

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
