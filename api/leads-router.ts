import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { leads } from "@db/schema";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";

export const leadsRouter = createRouter({
  /** Lista leads com filtros (admin) */
  list: adminQuery
    .input(
      z
        .object({
          source: z.enum(["simulador", "pre_analise"]).optional(),
          status: z.enum(["novo", "contatado", "convertido", "perdido"]).optional(),
          search: z.string().max(120).optional(),
          limit: z.number().int().min(1).max(500).default(100),
        })
        .optional(),
    )
    .query(({ input }) => {
      const filters: SQL[] = [];
      if (input?.source) filters.push(eq(leads.source, input.source));
      if (input?.status) filters.push(eq(leads.status, input.status));
      const term = input?.search?.trim();
      if (term) {
        const pattern = `%${term}%`;
        filters.push(
          or(
            like(leads.name, pattern),
            like(leads.whatsapp, pattern),
            like(leads.email, pattern),
          )!,
        );
      }
      return getDb()
        .select()
        .from(leads)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(leads.createdAt))
        .limit(input?.limit ?? 100);
    }),

  /** Atualiza o status do funil de um lead (admin) */
  updateStatus: adminQuery
    .input(
      z.object({
        leadId: z.number().int().positive(),
        status: z.enum(["novo", "contatado", "convertido", "perdido"]),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);
      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead não encontrado.",
        });
      }
      await db
        .update(leads)
        .set({ status: input.status })
        .where(eq(leads.id, input.leadId));
      return { ok: true };
    }),
});
