import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { sendWelcomeEmail } from "./lib/email";
import { updateUserPassword } from "./queries/users";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./session";
import {
  createUser,
  findUserByEmail,
  touchLastSignIn,
} from "./queries/users";
import type { TrpcContext } from "./context";

// ---------------------------------------------------------------------------
// Rate limit simples em memória: 10 tentativas de login por minuto por IP
// ---------------------------------------------------------------------------
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function checkLoginRateLimit(req: Request) {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Muitas tentativas de login. Aguarde um minuto e tente novamente.",
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers de cookie de sessão
// ---------------------------------------------------------------------------
async function setSessionCookie(ctx: TrpcContext, unionId: string) {
  const token = await signSessionToken({ unionId });
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

function clearSessionCookie(ctx: TrpcContext) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, "", {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: 0,
    }),
  );
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail válido");

export const authRouter = createRouter({
  me: publicQuery.query(({ ctx }) => ctx.user ?? null),

  register: publicQuery
    .input(
      z.object({
        name: z.string().trim().min(2, "Informe seu nome"),
        email: emailSchema,
        password: z
          .string()
          .min(8, "A senha deve ter pelo menos 8 caracteres"),
        referredBy: z.string().trim().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma conta com este e-mail.",
        });
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await createUser({
        unionId: input.email,
        name: input.name,
        email: input.email,
        passwordHash,
        referredBy: input.referredBy || null,
        role: "user",
        lastSignInAt: new Date(),
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar a conta.",
        });
      }
      await setSessionCookie(ctx, user.unionId);
      // Boas-vindas (fire-and-forget — nunca bloqueia o cadastro)
      void sendWelcomeEmail(user.email ?? input.email, user.name ?? input.name);
      return user;
    }),

  /** Troca de senha do usuário logado (exige a senha atual) */
  changePassword: authedQuery
    .input(
      z.object({
        currentPassword: z.string().min(1, "Informe a senha atual"),
        newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await findUserByEmail(ctx.user!.unionId);
      const ok =
        user?.passwordHash != null &&
        (await bcrypt.compare(input.currentPassword, user.passwordHash));
      if (!user || !ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha atual incorreta.",
        });
      }
      await updateUserPassword(user.unionId, await bcrypt.hash(input.newPassword, 10));
      return { ok: true };
    }),

  login: publicQuery
    .input(z.object({ email: emailSchema, password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      checkLoginRateLimit(ctx.req);
      const user = await findUserByEmail(input.email);
      const ok =
        user?.passwordHash != null &&
        (await bcrypt.compare(input.password, user.passwordHash));
      if (!user || !ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "E-mail ou senha incorretos.",
        });
      }
      await touchLastSignIn(user.unionId);
      await setSessionCookie(ctx, user.unionId);
      return user;
    }),

  logout: publicQuery.mutation(({ ctx }) => {
    clearSessionCookie(ctx);
    return { success: true };
  }),
});
