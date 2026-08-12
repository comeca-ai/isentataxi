import { and, eq, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { leads, profiles, users } from "@db/schema";
import { REFERRAL_REWARD } from "@contracts/constants";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";

const profileInput = z.object({
  cpf: z.string().min(11, "CPF inválido").max(14),
  rg: z.string().max(20).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phone: z.string().min(8, "Telefone inválido"),
  cnhNumber: z.string().min(3, "Número da CNH inválido"),
  cnhCategory: z.string().max(4).default("B"),
  cnhEAR: z.boolean().default(false),
  alvaraNumber: z.string().min(1, "Informe o número do alvará"),
  alvaraCity: z.string().default("São Paulo"),
  alvaraExpiry: z.string().optional().nullable(),
  cep: z.string().min(8, "CEP inválido").max(9),
  street: z.string().min(1, "Informe o logradouro"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().optional().nullable(),
  district: z.string().min(1, "Informe o bairro"),
  city: z.string().default("São Paulo"),
  state: z.string().length(2).default("SP"),
  intendedVehicleId: z.number().int().positive().optional().nullable(),
  intendedPrice: z.number().int().positive().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  plateFinalDigit: z
    .string()
    .regex(/^[0-9]$/, "Final de placa inválido")
    .optional()
    .nullable(),
});

export const profileRouter = createRouter({

  /** Programa "taxista que indica ganha": quantos indicados citaram este usuário */
  myReferrals: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const me = ctx.user!;
    const [myProfile] = await db
      .select({ phone: profiles.phone })
      .from(profiles)
      .where(eq(profiles.userId, me.id))
      .limit(1);

    // Identidades que o indicado pode ter escrito no campo "quem te indicou"
    const needles = [me.name, me.email, myProfile?.phone]
      .filter((v): v is string => Boolean(v && v.trim().length >= 4))
      .map((v) => v.trim().toLowerCase());
    const phoneDigits = (myProfile?.phone ?? "").replace(/\D/g, "");
    if (phoneDigits.length >= 10) needles.push(phoneDigits);

    const match = (col: typeof users.referredBy | typeof leads.referredBy) =>
      needles.length === 0
        ? sql`1 = 0`
        : or(...needles.map((n) => sql`LOWER(${col}) LIKE ${"%" + n + "%"}`));

    const [u] = await db
      .select({ n: sql<number>`count(*)` })
      .from(users)
      .where(and(match(users.referredBy), ne(users.id, me.id)));
    const [l] = await db
      .select({ n: sql<number>`count(*)` })
      .from(leads)
      .where(match(leads.referredBy));

    return {
      count: Number(u?.n ?? 0) + Number(l?.n ?? 0),
      reward: REFERRAL_REWARD,
    };
  }),

  /** Perfil do usuário logado (null se ainda não preencheu) */
  get: authedQuery.query(async ({ ctx }) => {
    const [row] = await getDb()
      .select()
      .from(profiles)
      .where(eq(profiles.userId, ctx.user.id))
      .limit(1);
    return row ?? null;
  }),

  /** Cria ou atualiza o cadastro completo do usuário logado */
  upsert: authedQuery.input(profileInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const values = {
      ...input,
      rg: input.rg ?? null,
      birthDate: input.birthDate ?? null,
      alvaraExpiry: input.alvaraExpiry ?? null,
      complement: input.complement ?? null,
      intendedVehicleId: input.intendedVehicleId ?? null,
      intendedPrice: input.intendedPrice ?? null,
      purchaseDate: input.purchaseDate ?? null,
      plateFinalDigit: input.plateFinalDigit ?? null,
      userId: ctx.user.id,
      updatedAt: new Date(),
    };
    await db
      .insert(profiles)
      .values(values)
      .onDuplicateKeyUpdate({ set: values });

    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, ctx.user.id))
      .limit(1);
    return row;
  }),
});
