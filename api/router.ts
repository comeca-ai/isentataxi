import { adminRouter } from "./admin-router";
import { authRouter } from "./auth-router";
import { documentsRouter } from "./documents-router";
import { leadsRouter } from "./leads-router";
import { createRouter, publicQuery } from "./middleware";
import { processRouter } from "./process-router";
import { profileRouter } from "./profile-router";
import { quizRouter } from "./quiz-router";
import { simulatorRouter } from "./simulator-router";
import { vehiclesRouter } from "./vehicles-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  vehicles: vehiclesRouter,
  simulator: simulatorRouter,
  quiz: quizRouter,
  profile: profileRouter,
  process: processRouter,
  documents: documentsRouter,
  admin: adminRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
