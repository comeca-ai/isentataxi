export const Session = {
  cookieName: "isentataxi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
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
  | "guia_paga_taxa"
  | "outros";

/** Labels pt-BR por tipo de documento */
export const DOC_TYPES: Record<DocType, string> = {
  cnh: "CNH com EAR",
  alvara: "Alvará de taxista",
  crlv_atual: "CRLV do veículo atual",
  comprovante_residencia: "Comprovante de residência",
  certidao_cursos: "Certidão dos cursos obrigatórios",
  dtp_protocolo: "Atestado da Prefeitura (regularidade da permissão)",
  detran_laudo: "Consulta/laudo Detran-PB",
  sisen_protocolo: "Protocolo SISEN (IPI)",
  sivei_autorizacao: "Autorização de isenção de ICMS (Sefaz-PB)",
  nota_fiscal: "Nota fiscal do veículo",
  guia_paga_taxa: "Comprovante de guia paga (taxa do processo)",
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
  { n: 3, slug: "dtp", name: "Atestado da Prefeitura", org: "Prefeitura (Semob-JP / STTP-CG)", dependsOn: [2], parallel: true },
  { n: 4, slug: "detran", name: "Detran-PB", org: "Detran-PB", dependsOn: [2], parallel: true },
  { n: 5, slug: "sisen", name: "SISEN — Receita Federal (IPI)", org: "Receita Federal", dependsOn: [3] },
  { n: 6, slug: "sivei", name: "Sefaz-PB (ICMS)", org: "Sefaz-PB", dependsOn: [5] },
  { n: 7, slug: "pos-compra", name: "Concessionária + pós-compra", org: "Concessionária", dependsOn: [6] },
  { n: 8, slug: "ipva", name: "IPVA — isenção estadual", org: "Sefaz-PB", dependsOn: [7] },
];

/** Alíquota de IPVA na PB para automóveis (2,5% do valor venal/ano — Lei 11.007/2017, art. 12, II) */
export const IPVA_RATE = 0.025;

/**
 * Gatilhos que baixam a isenção de IPVA automaticamente — a Sefaz cobra o IPVA
 * proporcional dos meses restantes do ano.
 */
export const IPVA_TRIGGERS: string[] = [
  "Venda ou transferência do veículo (em até 2 anos para quem não tem direito, o imposto volta a ser devido)",
  "Pedido de isenção para outro veículo (só vale 1 isento por CPF)",
  "Deixar de rodar como táxi — permissão municipal irregular ou conversão para uso particular",
  "Não renovar o reconhecimento anual da isenção na Sefaz-PB",
];

/**
 * Nota do 1º ano: taxista novo precisa comprovar ≥1 ano de atividade
 * (declaração do órgão municipal + INSS/MEI/CTPS) — por isso paga o 1º IPVA.
 */
export const IPVA_FIRST_YEAR_NOTE =
  "Taxista novo: o pedido exige declaração do órgão municipal comprovando pelo menos 1 ano de atividade (com INSS, MEI ou CTPS). Por isso, normalmente se paga o 1º IPVA — a isenção vale do próximo ano em diante.";

/** Prazo para pedir a isenção no SIVEI em carro 0 km (dias após a NF-e) */
export const IPVA_ZERO_KM_DEADLINE_DAYS = 30;

/** Programa "taxista que indica ganha" — recompensa por indicado que fechar */
export const REFERRAL_REWARD = 50;

/** Mês (abreviado, pt-BR) → número (1–12) e nome por extenso. Cobre o ano todo para qualquer calendário de licenciamento. */
export const MONTH_NUM: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};
export const MONTH_LABEL: Record<string, string> = {
  jan: "janeiro",
  fev: "fevereiro",
  mar: "março",
  abr: "abril",
  mai: "maio",
  jun: "junho",
  jul: "julho",
  ago: "agosto",
  set: "setembro",
  out: "outubro",
  nov: "novembro",
  dez: "dezembro",
};

/** Licenciamento/IPVA PB 2026 — calendário por final de placa (cota única). Valor da taxa: A CONFIRMAR no Detran-PB. */
export const LICENCIAMENTO_2026 = {
  valor: 0,
  calendario: {
    1: "jan",
    2: "fev",
    3: "mar",
    4: "abr",
    5: "mai",
    6: "jun",
    7: "jul",
    8: "ago",
    9: "set",
    0: "out",
  } as Record<number, string>,
} as const;

/** Portal oficial Sefaz-PB (IPVA / isenções) */
export const SEFAZ_IPVA_URL = "https://www.sefaz.pb.gov.br/";

/** ICMS estimado embutido no preço do 0 km na PB (conservador: 12%, alíquota interestadual de origem; a interna geral da PB é 20%) — A CONFIRMAR */
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
