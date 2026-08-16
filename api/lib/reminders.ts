import { and, isNotNull, eq } from "drizzle-orm";
import { LICENCIAMENTO_2026, IPVA_ZERO_KM_DEADLINE_DAYS } from "@contracts/constants";
import { emailReminders, profiles, users } from "@db/schema";
import { getDb } from "../queries/connection";
import { sendIpvaDeadlineEmail, sendLicenciamentoEmail } from "./email";

/**
 * Lembretes automáticos por e-mail — roda no boot e a cada 24h.
 * Dedup pela tabela email_reminders (userId + kind + refKey): nunca repete.
 */

const MONTH_LABEL: Record<string, string> = {
  jul: "julho",
  ago: "agosto",
  set: "setembro",
  out: "outubro",
  nov: "novembro",
  dez: "dezembro",
};
const MONTH_NUM: Record<string, number> = { jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

async function alreadySent(userId: number, kind: string, refKey: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: emailReminders.id })
    .from(emailReminders)
    .where(and(eq(emailReminders.userId, userId), eq(emailReminders.kind, kind), eq(emailReminders.refKey, refKey)))
    .limit(1);
  return rows.length > 0;
}

async function markSent(userId: number, kind: string, refKey: string): Promise<void> {
  const db = getDb();
  try {
    await db.insert(emailReminders).values({ userId, kind, refKey });
  } catch {
    // unique race — outro processo marcou primeiro; ok
  }
}

export async function runReminders(): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({
      userId: profiles.userId,
      purchaseDate: profiles.purchaseDate,
      plateFinalDigit: profiles.plateFinalDigit,
      email: users.email,
      name: users.name,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(isNotNull(profiles.purchaseDate));

  const today = new Date();
  let sent = 0;

  for (const r of rows) {
    if (!r.email) continue;

    // ── IPVA: prazo de 30 dias após a compra (prova SIVEI) ────────────────
    if (r.purchaseDate) {
      const purchase = new Date(`${r.purchaseDate}T12:00:00`);
      const days = Math.floor((today.getTime() - purchase.getTime()) / 86_400_000);
      const daysLeft = IPVA_ZERO_KM_DEADLINE_DAYS - days;
      if (daysLeft > 0 && daysLeft <= IPVA_ZERO_KM_DEADLINE_DAYS) {
        // Aviso aos 20 dias e urgente aos 27+ (a cada dia nos últimos 3)
        const kind = daysLeft <= 3 ? "ipva30_urgente" : days <= 20 ? "ipva30_aviso" : null;
        if (kind) {
          const refKey = `${r.purchaseDate}`;
          if (!(await alreadySent(r.userId, kind, refKey))) {
            await sendIpvaDeadlineEmail(r.email, r.name ?? "", daysLeft);
            await markSent(r.userId, kind, refKey);
            sent++;
          }
        }
      }
    }

    // ── Licenciamento anual (mês da placa) ────────────────────────────────
    if (r.plateFinalDigit) {
      const mes = LICENCIAMENTO_2026.calendario[Number(r.plateFinalDigit) as keyof typeof LICENCIAMENTO_2026.calendario];
      const mesNum = MONTH_NUM[mes];
      if (mesNum && today.getMonth() + 1 === mesNum) {
        const refKey = `${today.getFullYear()}-${mesNum}`;
        if (!(await alreadySent(r.userId, "licenciamento", refKey))) {
          await sendLicenciamentoEmail(r.email, r.name ?? "", MONTH_LABEL[mes] ?? mes, r.plateFinalDigit);
          await markSent(r.userId, "licenciamento", refKey);
          sent++;
        }
      }
    }
  }

  if (sent > 0) console.log(`[reminders] ${sent} lembrete(s) enviado(s).`);
}

/** Inicia o scheduler diário (boot + a cada 24h). */
export function startReminderScheduler(): void {
  void runReminders().catch((e) => console.error("[reminders]", e));
  setInterval(() => {
    void runReminders().catch((e) => console.error("[reminders]", e));
  }, 24 * 60 * 60 * 1000).unref();
  console.log("[reminders] Scheduler diário ativo (IPVA 30d + licenciamento).");
}
