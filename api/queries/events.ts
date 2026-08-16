import type { ActorRole } from "@contracts/constants";
import { events, type InsertEvent } from "@db/schema";
import { getDb } from "./connection";

/** Grava um evento na timeline do processo do usuário */
export async function writeEvent(input: {
  userId: number;
  actorRole: ActorRole;
  kind: string;
  message: string;
  meta?: Record<string, unknown> | null;
}) {
  const row: InsertEvent = {
    userId: input.userId,
    actorRole: input.actorRole,
    kind: input.kind,
    message: input.message,
    meta: input.meta ?? null,
  };
  await getDb().insert(events).values(row);
}
