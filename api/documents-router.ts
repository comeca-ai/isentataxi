import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { DOC_TYPES, type DocType } from "@contracts/constants";
import { documents, users } from "@db/schema";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { writeEvent } from "./queries/events";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const docTypeEnum = z.enum([
  "cnh",
  "alvara",
  "crlv_atual",
  "comprovante_residencia",
  "certidao_cursos",
  "dtp_protocolo",
  "detran_laudo",
  "sisen_protocolo",
  "sivei_autorizacao",
  "nota_fiscal",
  "outros",
]);

/** Colunas públicas (sem o blob binário) */
const publicColumns = {
  id: documents.id,
  userId: documents.userId,
  docType: documents.docType,
  fileName: documents.fileName,
  mimeType: documents.mimeType,
  sizeBytes: documents.sizeBytes,
  status: documents.status,
  rejectionReason: documents.rejectionReason,
  reviewedAt: documents.reviewedAt,
  createdAt: documents.createdAt,
} as const;

export const documentsRouter = createRouter({
  /** Documentos do usuário logado (sem o blob) */
  mine: authedQuery.query(({ ctx }) =>
    getDb()
      .select(publicColumns)
      .from(documents)
      .where(eq(documents.userId, ctx.user.id))
      .orderBy(desc(documents.createdAt)),
  ),

  /** Upload de documento (base64, máx. 5 MB, pdf/jpeg/png/webp) */
  upload: authedQuery
    .input(
      z.object({
        docType: docTypeEnum,
        fileName: z.string().min(1).max(255),
        mimeType: z.string(),
        base64: z.string().min(1, "Arquivo vazio"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ALLOWED_MIME.has(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato não aceito. Envie PDF, JPG, PNG ou WebP.",
        });
      }
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo vazio." });
      }
      if (buffer.length > MAX_SIZE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Arquivo muito grande. O limite é 5 MB.",
        });
      }

      const db = getDb();
      const [{ id }] = await db
        .insert(documents)
        .values({
          userId: ctx.user.id,
          docType: input.docType,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: buffer.length,
          data: buffer,
          status: "em_revisao",
        })
        .$returningId();

      await writeEvent({
        userId: ctx.user.id,
        actorRole: "cliente",
        kind: "documento_enviado",
        message: `Documento enviado: ${DOC_TYPES[input.docType as DocType]} (${input.fileName})`,
        meta: { documentId: id, docType: input.docType },
      });

      return { id };
    }),

  /** Download do arquivo (dono ou admin) — retorna base64 */
  download: authedQuery
    .input(z.object({ documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const [doc] = await getDb()
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);
      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado.",
        });
      }
      if (doc.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a este documento.",
        });
      }
      return {
        base64: Buffer.from(doc.data).toString("base64"),
        mimeType: doc.mimeType,
        fileName: doc.fileName,
      };
    }),

  /** Fila de revisão (admin, sem o blob, com nome do cliente) */
  queue: adminQuery
    .input(
      z
        .object({
          status: z
            .enum(["pendente", "em_revisao", "aprovado", "rejeitado"])
            .optional(),
        })
        .optional(),
    )
    .query(({ input }) => {
      const where = input?.status
        ? eq(documents.status, input.status)
        : undefined;
      return getDb()
        .select({ ...publicColumns, userName: users.name, userEmail: users.email })
        .from(documents)
        .leftJoin(users, eq(users.id, documents.userId))
        .where(where)
        .orderBy(desc(documents.createdAt));
    }),

  /** Aprova ou rejeita um documento (admin) */
  review: adminQuery
    .input(
      z.object({
        documentId: z.number().int().positive(),
        approve: z.boolean(),
        rejectionReason: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.approve && !input.rejectionReason?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Informe o motivo da rejeição.",
        });
      }

      const db = getDb();
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);
      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado.",
        });
      }

      const status = input.approve ? "aprovado" : "rejeitado";
      await db
        .update(documents)
        .set({
          status,
          rejectionReason: input.approve
            ? null
            : (input.rejectionReason ?? null),
          reviewedAt: new Date(),
        })
        .where(and(eq(documents.id, input.documentId)));

      await writeEvent({
        userId: doc.userId,
        actorRole: "equipe",
        kind: "documento_revisado",
        message: input.approve
          ? `Documento aprovado: ${DOC_TYPES[doc.docType as DocType] ?? doc.docType}`
          : `Documento rejeitado: ${DOC_TYPES[doc.docType as DocType] ?? doc.docType} — ${input.rejectionReason}`,
        meta: { documentId: doc.id, docType: doc.docType, status },
      });

      return { ok: true, status };
    }),
});
