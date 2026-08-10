import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { STAGES } from "@contracts/constants";
import { processes, processStages, users } from "@db/schema";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { writeEvent } from "./queries/events";

const stageStatusEnum = z.enum([
  "pendente",
  "em_andamento",
  "em_revisao",
  "concluida",
  "bloqueada",
  "rejeitada",
]);

/** Garante que o usuário tem processo + 7 etapas; cria na primeira chamada */
async function ensureProcess(userId: number) {
  const db = getDb();
  let [process] = await db
    .select()
    .from(processes)
    .where(eq(processes.userId, userId))
    .limit(1);

  if (!process) {
    const [{ id }] = await db
      .insert(processes)
      .values({ userId })
      .$returningId();
    await db.insert(processStages).values(
      STAGES.map((s) => ({
        processId: id,
        stage: s.n,
        status: s.n <= 2 ? ("em_andamento" as const) : ("pendente" as const),
      })),
    );
    [process] = await db
      .select()
      .from(processes)
      .where(eq(processes.id, id))
      .limit(1);
  }

  const stages = await db
    .select()
    .from(processStages)
    .where(eq(processStages.processId, process.id))
    .orderBy(asc(processStages.stage));

  // Backfill: processos antigos podem não ter etapas novas (ex.: etapa 8 IPVA)
  const missing = STAGES.filter((def) => !stages.some((s) => s.stage === def.n));
  if (missing.length > 0) {
    await db
      .insert(processStages)
      .values(missing.map((def) => ({ processId: process.id, stage: def.n, status: "pendente" as const })))
      .onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    const refreshed = await db
      .select()
      .from(processStages)
      .where(eq(processStages.processId, process.id))
      .orderBy(asc(processStages.stage));
    return { process, stages: refreshed };
  }

  return { process, stages };
}

export const processRouter = createRouter({
  /** Processo + 7 etapas do usuário logado (auto-cria na 1ª chamada) */
  mine: authedQuery.query(({ ctx }) => ensureProcess(ctx.user.id)),

  /** Todos os processos com nome/e-mail do cliente (admin) */
  listAll: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        process: processes,
        userName: users.name,
        userEmail: users.email,
      })
      .from(processes)
      .leftJoin(users, eq(users.id, processes.userId))
      .orderBy(asc(processes.createdAt));

    const allStages = await db
      .select()
      .from(processStages)
      .orderBy(asc(processStages.stage));

    return rows.map((row) => ({
      ...row,
      stages: allStages.filter((s) => s.processId === row.process.id),
    }));
  }),

  /** Atualiza o status de uma etapa, respeitando dependências (admin) */
  updateStage: adminQuery
    .input(
      z.object({
        processId: z.number().int().positive(),
        stage: z.number().int().min(1).max(STAGES.length),
        status: stageStatusEnum,
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const def = STAGES.find((s) => s.n === input.stage);
      if (!def) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Etapa inválida." });
      }

      const [process] = await db
        .select()
        .from(processes)
        .where(eq(processes.id, input.processId))
        .limit(1);
      if (!process) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Processo não encontrado.",
        });
      }

      // Regra de dependência: só conclui se as etapas das quais depende
      // estiverem concluídas.
      if (input.status === "concluida" && def.dependsOn.length > 0) {
        const deps = await db
          .select()
          .from(processStages)
          .where(
            and(
              eq(processStages.processId, input.processId),
              inArray(processStages.stage, def.dependsOn),
            ),
          );
        const pendente = deps.find((d) => d.status !== "concluida");
        if (pendente) {
          const depDef = STAGES.find((s) => s.n === pendente.stage);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Não é possível concluir esta etapa: "${depDef?.name ?? `Etapa ${pendente.stage}`}" ainda não foi concluída.`,
          });
        }
      }

      await db
        .update(processStages)
        .set({
          status: input.status,
          notes: input.notes ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(processStages.processId, input.processId),
            eq(processStages.stage, input.stage),
          ),
        );

      // Recalcula a etapa corrente = primeira não concluída
      const stages = await db
        .select()
        .from(processStages)
        .where(eq(processStages.processId, input.processId))
        .orderBy(asc(processStages.stage));
      const current =
        stages.find((s) => s.status !== "concluida")?.stage ?? STAGES.length;
      await db
        .update(processes)
        .set({ currentStage: current, updatedAt: new Date() })
        .where(eq(processes.id, input.processId));

      await writeEvent({
        userId: process.userId,
        actorRole: "equipe",
        kind: "etapa_atualizada",
        message: `Etapa ${input.stage} (${def.name}) → ${input.status}${
          input.notes ? `: ${input.notes}` : ""
        }`,
        meta: {
          processId: input.processId,
          stage: input.stage,
          status: input.status,
        },
      });

      return { ok: true, currentStage: current };
    }),
});
