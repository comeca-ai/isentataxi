import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import bcrypt from "bcryptjs";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createUser, findUserByEmail } from "./queries/users";
import { startReminderScheduler } from "./lib/reminders";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

/**
 * Bootstrap do primeiro admin: se ADMIN_EMAIL + ADMIN_PASSWORD estiverem
 * definidos e não existir usuário com esse e-mail, cria com role "admin".
 */
async function bootstrapAdmin() {
  if (!env.adminEmail || !env.adminPassword) return;
  try {
    const email = env.adminEmail.trim().toLowerCase();
    const existing = await findUserByEmail(email);
    if (existing) {
      if (existing.role !== "admin") {
        console.warn(
          `[bootstrap] ${email} já existe sem role admin — ajuste manualmente no banco.`,
        );
      }
      return;
    }
    await createUser({
      unionId: email,
      name: "Administrador",
      email,
      passwordHash: await bcrypt.hash(env.adminPassword, 10),
      role: "admin",
      lastSignInAt: new Date(),
    });
    console.log(`[bootstrap] Admin criado: ${email}`);
  } catch (error) {
    console.error("[bootstrap] Falha ao criar admin:", error);
  }
}

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  await bootstrapAdmin();
  startReminderScheduler();

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
