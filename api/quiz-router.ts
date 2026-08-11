import { z } from "zod";
import { leads } from "@db/schema";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

export const quizRouter = createRouter({
  /** Envia o quiz de pré-análise e cria o lead (isca grátis) */
  submit: publicQuery
    .input(
      z.object({
        name: z.string().min(2, "Informe seu nome"),
        whatsapp: z.string().min(8, "Informe um WhatsApp válido"),
        email: z.string().email("E-mail inválido").optional(),
        referredBy: z.string().trim().max(255).optional(),
        answers: z.record(z.string(), z.unknown()),
        result: z.enum(["elegivel", "pendencias", "nao_elegivel"]),
        score: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db
        .insert(leads)
        .values({
          name: input.name,
          whatsapp: input.whatsapp,
          email: input.email ?? null,
          source: "pre_analise",
          referredBy: input.referredBy || null,
          quizAnswers: input.answers,
          eligibilityResult: input.result,
          eligibilityScore: input.score,
        })
        .$returningId();
      return { id };
    }),
});
