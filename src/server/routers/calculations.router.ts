import { z } from "zod";
import { type Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { CalculationEngine } from "@/engine/calculations/CalculationEngine";

export const calculationsRouter = createTRPCRouter({
  getResults: protectedProcedure
    .input(z.object({ unitId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.unitCalculation.findMany({
        where: { unitId: input.unitId },
        orderBy: { calculatedAt: "desc" },
      })
    ),

  trigger: protectedProcedure
    .input(z.object({ unitId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const unit = await ctx.db.unit.findUnique({
        where: { id: input.unitId },
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: {
              sectionDef: true,
              options: { include: { optionDef: true } },
            },
          },
        },
      });
      if (!unit) throw new TRPCError({ code: "NOT_FOUND" });

      const calcDefs = await ctx.db.calculationDefinition.findMany({
        where: { isActive: true },
      });

      const engine = new CalculationEngine(calcDefs);
      const results = engine.run(unit);

      await Promise.all(
        results.map((result) =>
          ctx.db.unitCalculation.upsert({
            where: { unitId_calcDefCode: { unitId: input.unitId, calcDefCode: result.code } },
            update: {
              inputs: result.inputs as Prisma.InputJsonObject,
              outputs: result.outputs as Prisma.InputJsonObject,
              warnings: result.warnings,
              calculatedAt: new Date(),
              isStale: false,
            },
            create: {
              unitId: input.unitId,
              calcDefCode: result.code,
              inputs: result.inputs as Prisma.InputJsonObject,
              outputs: result.outputs as Prisma.InputJsonObject,
              warnings: result.warnings,
              isStale: false,
            },
          })
        )
      );

      return { count: results.length };
    }),
});
