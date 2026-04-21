import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const JOB_STATUSES = ["draft", "in_review", "approved", "archived"] as const;

export const jobsRouter = createTRPCRouter({
  byProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.job.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { units: true } } },
      })
    ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.job.findUnique({
        where: { id: input.id },
        include: { units: { orderBy: { sortOrder: "asc" } } },
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      return job;
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1),
        notes: z.string().optional(),
        siteConditions: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.job.count();
      const jobNumber = `AHU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
      return ctx.db.job.create({
        data: {
          ...input,
          jobNumber,
          siteConditions: input.siteConditions ?? {},
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        status: z.enum(JOB_STATUSES).optional(),
        notes: z.string().optional(),
        siteConditions: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.job.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.job.delete({ where: { id: input.id } })
    ),
});
