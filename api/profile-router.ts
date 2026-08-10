import { eq } from "drizzle-orm";
import { z } from "zod";
import { profiles } from "@db/schema";
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
