import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  date,
  decimal,
  json,
  unique,
  index,
  customType,
} from "drizzle-orm/mysql-core";

/** LONGBLOB column (arquivos de documentos em bytes) */
const longblob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "longblob";
  },
});

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  /** Hash bcrypt da senha (auth local por email+senha) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Catálogo do simulador (carros elegíveis) */
export const vehicles = mysqlTable("vehicles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 128 }).notNull(),
  /** Preço de referência em reais */
  priceRef: int("priceRef").notNull(),
  fuel: mysqlEnum("fuel", ["flex", "hibrido", "eletrico"]).notNull(),
  /** Alíquota estimada de IPI (ex.: 0.11, 0.065, 0.03) */
  ipiRate: decimal("ipiRate", { precision: 5, scale: 3 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/** Captura das iscas grátis (simulador + pré-análise) */
export const leads = mysqlTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
    email: varchar("email", { length: 320 }),
    source: mysqlEnum("source", ["simulador", "pre_analise"]).notNull(),
    quizAnswers: json("quizAnswers"),
    eligibilityResult: mysqlEnum("eligibilityResult", [
      "elegivel",
      "pendencias",
      "nao_elegivel",
    ]),
    eligibilityScore: int("eligibilityScore"),
    simulationSnapshot: json("simulationSnapshot"),
    status: mysqlEnum("status", ["novo", "contatado", "convertido", "perdido"])
      .notNull()
      .default("novo"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("leads_status_idx").on(table.status),
    sourceIdx: index("leads_source_idx").on(table.source),
  }),
);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/** Cadastro completo (1:1 com user) */
export const profiles = mysqlTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .unique()
      .references(() => users.id),
    cpf: varchar("cpf", { length: 14 }).notNull(),
    rg: varchar("rg", { length: 20 }),
    birthDate: date("birthDate", { mode: "string" }),
    phone: varchar("phone", { length: 32 }).notNull(),
    cnhNumber: varchar("cnhNumber", { length: 32 }).notNull(),
    cnhCategory: varchar("cnhCategory", { length: 4 }).notNull().default("B"),
    cnhEAR: boolean("cnhEAR").notNull().default(false),
    alvaraNumber: varchar("alvaraNumber", { length: 64 }).notNull(),
    alvaraCity: varchar("alvaraCity", { length: 128 })
      .notNull()
      .default("São Paulo"),
    alvaraExpiry: date("alvaraExpiry", { mode: "string" }),
    cep: varchar("cep", { length: 9 }).notNull(),
    street: varchar("street", { length: 255 }).notNull(),
    number: varchar("number", { length: 16 }).notNull(),
    complement: varchar("complement", { length: 128 }),
    district: varchar("district", { length: 128 }).notNull(),
    city: varchar("city", { length: 128 }).notNull().default("São Paulo"),
    state: varchar("state", { length: 2 }).notNull().default("SP"),
    intendedVehicleId: bigint("intendedVehicleId", {
      mode: "number",
      unsigned: true,
    }).references(() => vehicles.id),
    intendedPrice: int("intendedPrice"),
    /** Data da compra do veículo (NF-e) — ativa o lembrete do prazo SIVEI IPVA */
    purchaseDate: date("purchaseDate", { mode: "string" }),
    /** Dígito final da placa — ativa o lembrete de licenciamento */
    plateFinalDigit: varchar("plateFinalDigit", { length: 1 }),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/** Processo de isenção (1:1 com user) */
export const processes = mysqlTable("processes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique()
    .references(() => users.id),
  currentStage: int("currentStage").notNull().default(1),
  postPurchaseDeadline: date("postPurchaseDeadline", { mode: "string" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Process = typeof processes.$inferSelect;
export type InsertProcess = typeof processes.$inferInsert;

/** Status das 7 etapas de cada processo */
export const processStages = mysqlTable(
  "process_stages",
  {
    id: serial("id").primaryKey(),
    processId: bigint("processId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => processes.id),
    stage: int("stage").notNull(),
    status: mysqlEnum("status", [
      "pendente",
      "em_andamento",
      "em_revisao",
      "concluida",
      "bloqueada",
      "rejeitada",
    ])
      .notNull()
      .default("pendente"),
    notes: text("notes"),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    processStageUnique: unique("process_stage_unique").on(
      table.processId,
      table.stage,
    ),
  }),
);

export type ProcessStage = typeof processStages.$inferSelect;
export type InsertProcessStage = typeof processStages.$inferInsert;

/** Documentos enviados pelo cliente (arquivo em bytes) */
export const documents = mysqlTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    docType: varchar("docType", { length: 64 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 128 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    data: longblob("data").notNull(),
    status: mysqlEnum("status", [
      "pendente",
      "em_revisao",
      "aprovado",
      "rejeitado",
    ])
      .notNull()
      .default("em_revisao"),
    rejectionReason: text("rejectionReason"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("documents_user_idx").on(table.userId),
    statusIdx: index("documents_status_idx").on(table.status),
  }),
);

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/** Timeline de eventos do processo */
export const events = mysqlTable(
  "events",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    actorRole: mysqlEnum("actorRole", ["cliente", "equipe", "sistema"]).notNull(),
    kind: varchar("kind", { length: 64 }).notNull(),
    message: text("message").notNull(),
    meta: json("meta"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("events_user_idx").on(table.userId),
  }),
);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
