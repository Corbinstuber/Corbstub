import { z } from "zod";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "@/server/trpc";

export const validationRulesRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.validationRule.findMany({ orderBy: { scope: "asc" } })
  ),

  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1),
        label: z.string().min(1),
        scope: z.enum(["unit", "section", "option"]),
        ruleType: z.enum(["requires", "excludes", "range_check", "custom_fn"]),
        condition: z.record(z.string(), z.any()),
        assertion: z.record(z.string(), z.any()),
        errorMessage: z.string().min(1),
        severity: z.enum(["error", "warning"]).default("error"),
      })
    )
    .mutation(({ ctx, input }) => ctx.db.validationRule.create({ data: input })),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        errorMessage: z.string().min(1).optional(),
        severity: z.enum(["error", "warning"]).optional(),
        isActive: z.boolean().optional(),
        condition: z.record(z.string(), z.any()).optional(),
        assertion: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.validationRule.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.validationRule.delete({ where: { id: input.id } })
    ),
});
