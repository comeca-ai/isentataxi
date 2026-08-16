import { count, eq, gte, inArray, sql } from "drizzle-orm";
import { documents, leads, processes } from "@db/schema";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";

export const adminRouter = createRouter({
  /** Métricas do painel admin */
  metrics: adminQuery.query(async () => {
    const db = getDb();

    const [[total], [simulador], [preAnalise], [convertidos]] =
      await Promise.all([
        db.select({ n: count() }).from(leads),
        db.select({ n: count() }).from(leads).where(eq(leads.source, "simulador")),
        db
          .select({ n: count() })
          .from(leads)
          .where(eq(leads.source, "pre_analise")),
        db.select({ n: count() }).from(leads).where(eq(leads.status, "convertido")),
      ]);

    const [[procs], [docsPendentes]] = await Promise.all([
      db.select({ n: count() }).from(processes),
      db
        .select({ n: count() })
        .from(documents)
        .where(inArray(documents.status, ["pendente", "em_revisao"])),
    ]);

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const daily = await db
      .select({
        day: sql<string>`DATE(${leads.createdAt})`,
        count: count(),
      })
      .from(leads)
      .where(gte(leads.createdAt, since))
      .groupBy(sql`DATE(${leads.createdAt})`)
      .orderBy(sql`DATE(${leads.createdAt})`);

    const byDay = new Map(daily.map((d) => [String(d.day).slice(0, 10), d.count]));
    const leadsLast14Days: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const day = d.toISOString().slice(0, 10);
      leadsLast14Days.push({ day, count: byDay.get(day) ?? 0 });
    }

    const totalLeads = total.n;
    return {
      totalLeads,
      leadsSimulador: simulador.n,
      leadsPreAnalise: preAnalise.n,
      totalProcesses: procs.n,
      docsPendentes: docsPendentes.n,
      conversaoPct:
        totalLeads > 0
          ? Math.round((convertidos.n / totalLeads) * 1000) / 10
          : 0,
      leadsLast14Days,
    };
  }),
});
