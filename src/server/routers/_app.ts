import { createTRPCRouter } from "@/server/trpc";
import { projectsRouter } from "./projects.router";
import { jobsRouter } from "./jobs.router";
import { unitsRouter } from "./units.router";
import { calculationsRouter } from "./calculations.router";
import { sectionDefsRouter } from "./admin/section-defs.router";
import { validationRulesRouter } from "./admin/validation-rules.router";

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  jobs: jobsRouter,
  units: unitsRouter,
  calculations: calculationsRouter,
  admin: createTRPCRouter({
    sectionDefs: sectionDefsRouter,
    validationRules: validationRulesRouter,
  }),
});

export type AppRouter = typeof appRouter;
