/**
 * Seed DEMO (branch despachante / Despacha.Ai)
 * Popula um escritório fictício com clientes em várias etapas do pipeline,
 * documentos, leads e eventos — para apresentações com o painel "vivo".
 * Idempotente: pula usuários/leads que já existem por e-mail.
 * Rodar: ./node_modules/.bin/tsx db/seed-demo.ts
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import {
  users,
  profiles,
  processes,
  processStages,
  documents,
  leads,
  events,
  vehicles,
} from "./schema";
import { STAGES } from "../contracts/constants";

const DEMO_PASSWORD = "Demo12345";
const FAKE_PDF = Buffer.from(
  "%PDF-1.4\n% Despacha.Ai demo document (ficticio)\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
);

type StageSpec = { stage: number; status: "pendente" | "em_andamento" | "em_revisao" | "concluida" | "bloqueada" | "rejeitada"; notes?: string };

type DemoClient = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  referredBy?: string;
  currentStage: number;
  paid: boolean;
  stages: StageSpec[];
  docs: { docType: string; fileName: string; status: "pendente" | "em_revisao" | "aprovado" | "rejeitado"; rejectionReason?: string }[];
  events: { actorRole: "cliente" | "equipe" | "sistema"; kind: string; message: string }[];
  vehicleSlug: string;
  purchaseDate?: string;
  plateFinalDigit?: string;
};

const CLIENTS: DemoClient[] = [
  {
    name: "Carlos Mendes",
    email: "carlos.mendes@demo.dev",
    phone: "(11) 97001-1001",
    cpf: "111.111.111-11",
    currentStage: 5,
    paid: true,
    vehicleSlug: "cronos",
    stages: [
      { stage: 1, status: "concluida" },
      { stage: 2, status: "concluida" },
      { stage: 3, status: "concluida" },
      { stage: 4, status: "concluida" },
      { stage: 5, status: "em_andamento", notes: "SISEN protocolado — aguardando deferimento" },
      { stage: 6, status: "pendente" },
      { stage: 7, status: "pendente" },
      { stage: 8, status: "pendente" },
    ],
    docs: [
      { docType: "cnh", fileName: "cnh-carlos.pdf", status: "aprovado" },
      { docType: "alvara", fileName: "alvara-carlos.pdf", status: "aprovado" },
      { docType: "comprovante_residencia", fileName: "conta-luz.pdf", status: "aprovado" },
      { docType: "guia_paga_taxa", fileName: "guia-dtp-paga.pdf", status: "aprovado" },
    ],
    events: [
      { actorRole: "cliente", kind: "cadastro", message: "Cliente cadastrado pelo portal" },
      { actorRole: "equipe", kind: "pagamento", message: "Pagamento confirmado pelo escritório" },
      { actorRole: "sistema", kind: "etapa", message: "Etapa 4 (DETRAN) concluída" },
    ],
  },
  {
    name: "Ana Beatriz Souza",
    email: "ana.souza@demo.dev",
    phone: "(11) 97001-1002",
    cpf: "222.222.222-22",
    currentStage: 2,
    paid: false,
    vehicleSlug: "hb20s",
    stages: [
      { stage: 1, status: "concluida" },
      { stage: 2, status: "em_andamento", notes: "CNH rejeitada — foto ilegível, aguardando reenvio" },
      ...[3, 4, 5, 6, 7, 8].map((n) => ({ stage: n, status: "pendente" as const })),
    ],
    docs: [
      { docType: "cnh", fileName: "cnh-ana.pdf", status: "rejeitado", rejectionReason: "Foto ilegível — reenvie com boa iluminação" },
      { docType: "alvara", fileName: "alvara-ana.pdf", status: "aprovado" },
      { docType: "comprovante_residencia", fileName: "comprovante-ana.pdf", status: "em_revisao" },
    ],
    events: [
      { actorRole: "cliente", kind: "cadastro", message: "Cliente cadastrado pelo portal" },
      { actorRole: "equipe", kind: "doc_rejeitado", message: "CNH rejeitada: foto ilegível" },
    ],
  },
  {
    name: "José Roberto Lima",
    email: "ze.lima@demo.dev",
    phone: "(11) 97001-1003",
    cpf: "333.333.333-33",
    currentStage: 3,
    paid: false,
    vehicleSlug: "onixplus",
    stages: [
      { stage: 1, status: "concluida" },
      { stage: 2, status: "concluida" },
      { stage: 3, status: "pendente" },
      ...[4, 5, 6, 7, 8].map((n) => ({ stage: n, status: "pendente" as const })),
    ],
    docs: [
      { docType: "cnh", fileName: "cnh-ze.pdf", status: "aprovado" },
      { docType: "alvara", fileName: "alvara-ze.pdf", status: "aprovado" },
      { docType: "guia_paga_taxa", fileName: "guia-paga-ze.pdf", status: "em_revisao" },
    ],
    events: [
      { actorRole: "cliente", kind: "upload", message: "Cliente enviou comprovante de guia paga" },
      { actorRole: "sistema", kind: "paywall", message: "Etapas 3+ travadas até confirmação de pagamento" },
    ],
  },
  {
    name: "Maria Fernanda Costa",
    email: "maria.costa@demo.dev",
    phone: "(11) 97001-1004",
    cpf: "444.444.444-44",
    currentStage: 7,
    paid: true,
    vehicleSlug: "virtus",
    purchaseDate: "2026-08-02",
    plateFinalDigit: "4",
    stages: [
      ...[1, 2, 3, 4, 5, 6].map((n) => ({ stage: n, status: "concluida" as const })),
      { stage: 7, status: "em_andamento", notes: "Pós-compra: prazo SIVEI/IPVA de 30 dias correndo" },
      { stage: 8, status: "pendente" },
    ],
    docs: [
      { docType: "cnh", fileName: "cnh-maria.pdf", status: "aprovado" },
      { docType: "alvara", fileName: "alvara-maria.pdf", status: "aprovado" },
      { docType: "guia_paga_taxa", fileName: "guia-maria.pdf", status: "aprovado" },
    ],
    events: [
      { actorRole: "equipe", kind: "pagamento", message: "Pagamento confirmado pelo escritório" },
      { actorRole: "sistema", kind: "lembrete", message: "Lembrete IPVA 0 km (30 dias) agendado" },
    ],
  },
  {
    name: "Paulo Henrique Dias",
    email: "paulo.dias@demo.dev",
    phone: "(11) 97001-1005",
    cpf: "555.555.555-55",
    referredBy: "Carlos Mendes",
    currentStage: 1,
    paid: false,
    vehicleSlug: "versa",
    stages: [
      { stage: 1, status: "em_andamento", notes: "Pré-análise aprovada — completando cadastro" },
      { stage: 2, status: "em_andamento" },
      ...[3, 4, 5, 6, 7, 8].map((n) => ({ stage: n, status: "pendente" as const })),
    ],
    docs: [{ docType: "cnh", fileName: "cnh-paulo.pdf", status: "em_revisao" }],
    events: [
      { actorRole: "cliente", kind: "cadastro", message: "Cliente cadastrado — indicação de Carlos Mendes" },
    ],
  },
  {
    name: "Luiza Campos",
    email: "luiza.campos@demo.dev",
    phone: "(11) 97001-1006",
    cpf: "666.666.666-66",
    currentStage: 4,
    paid: true,
    vehicleSlug: "city",
    stages: [
      ...[1, 2, 3].map((n) => ({ stage: n, status: "concluida" as const })),
      { stage: 4, status: "em_andamento", notes: "DETRAN: aguardando laudo/inserção no sistema" },
      ...[5, 6, 7, 8].map((n) => ({ stage: n, status: "pendente" as const })),
    ],
    docs: [
      { docType: "cnh", fileName: "cnh-luiza.pdf", status: "aprovado" },
      { docType: "alvara", fileName: "alvara-luiza.pdf", status: "aprovado" },
      { docType: "comprovante_residencia", fileName: "comprovante-luiza.pdf", status: "aprovado" },
      { docType: "guia_paga_taxa", fileName: "guia-luiza.pdf", status: "aprovado" },
    ],
    events: [
      { actorRole: "equipe", kind: "pagamento", message: "Pagamento confirmado pelo escritório" },
      { actorRole: "sistema", kind: "etapa", message: "Etapa 3 (DTP) concluída" },
    ],
  },
];

const LEADS = [
  { name: "Roberto Alves", whatsapp: "(11) 98001-2001", email: "roberto.alves@demo.dev", source: "simulador" as const, status: "novo" as const, eligibilityResult: "elegivel" as const, eligibilityScore: 92 },
  { name: "Sandra Pereira", whatsapp: "(11) 98001-2002", email: "sandra.pereira@demo.dev", source: "pre_analise" as const, status: "contatado" as const, eligibilityResult: "pendencias" as const, eligibilityScore: 64 },
  { name: "Marcos Vinícius Rocha", whatsapp: "(11) 98001-2003", email: "marcos.rocha@demo.dev", source: "simulador" as const, status: "novo" as const, referredBy: "Maria Fernanda Costa", eligibilityResult: "elegivel" as const, eligibilityScore: 88 },
  { name: "Teresa Cristina Melo", whatsapp: "(11) 98001-2004", email: "teresa.melo@demo.dev", source: "pre_analise" as const, status: "convertido" as const, eligibilityResult: "elegivel" as const, eligibilityScore: 95 },
];

async function seedDemo() {
  const db = getDb();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  console.log("Seeding Despacha.Ai DEMO data...");

  // Admin demo
  const existingAdmin = await db.select().from(users).where(eq(users.email, "demo@despacha.ai")).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      unionId: "demo@despacha.ai",
      name: "Demo Despachante",
      email: "demo@despacha.ai",
      passwordHash,
      role: "admin",
    });
    console.log("  + admin demo@despacha.ai (senha: " + DEMO_PASSWORD + ")");
  } else {
    console.log("  = admin demo@despacha.ai já existe");
  }

  // Clientes demo
  for (const c of CLIENTS) {
    const existing = await db.select().from(users).where(eq(users.email, c.email)).limit(1);
    if (existing.length > 0) {
      console.log(`  = ${c.email} já existe — pulando`);
      continue;
    }
    const [{ id: userId }] = await db
      .insert(users)
      .values({ unionId: c.email, name: c.name, email: c.email, passwordHash, referredBy: c.referredBy })
      .$returningId();

    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.slug, c.vehicleSlug)).limit(1);

    await db.insert(profiles).values({
      userId,
      cpf: c.cpf,
      phone: c.phone,
      cnhNumber: "0" + String(userId).padStart(10, "0"),
      cnhEAR: true,
      alvaraNumber: `2026-TX-${String(userId).padStart(4, "0")}`,
      cep: "01001-000",
      street: "Praça da Sé",
      number: "100",
      district: "Sé",
      intendedVehicleId: vehicle?.id,
      intendedPrice: vehicle?.priceRef,
      purchaseDate: c.purchaseDate,
      plateFinalDigit: c.plateFinalDigit,
    });

    const [{ id: processId }] = await db
      .insert(processes)
      .values({ userId, currentStage: c.currentStage, paidAt: c.paid ? new Date() : null })
      .$returningId();

    await db.insert(processStages).values(
      STAGES.map((def) => {
        const spec = c.stages.find((s) => s.stage === def.n);
        return { processId, stage: def.n, status: spec?.status ?? "pendente", notes: spec?.notes };
      }),
    );

    for (const d of c.docs) {
      await db.insert(documents).values({
        userId,
        docType: d.docType,
        fileName: d.fileName,
        mimeType: "application/pdf",
        sizeBytes: FAKE_PDF.length,
        data: FAKE_PDF,
        status: d.status,
        rejectionReason: d.rejectionReason,
        reviewedAt: d.status === "aprovado" || d.status === "rejeitado" ? new Date() : null,
      });
    }

    for (const e of c.events) {
      await db.insert(events).values({ userId, actorRole: e.actorRole, kind: e.kind, message: e.message });
    }

    console.log(`  + cliente ${c.name} (etapa ${c.currentStage}${c.paid ? ", pago" : ""})`);
  }

  // Leads demo
  for (const l of LEADS) {
    const existing = await db.select().from(leads).where(eq(leads.email, l.email)).limit(1);
    if (existing.length > 0) continue;
    await db.insert(leads).values(l);
    console.log(`  + lead ${l.name}`);
  }

  console.log("Demo seed concluído.");
  process.exit(0);
}

seedDemo();
