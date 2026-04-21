import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const unitsRouter = createTRPCRouter({
  byJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.unit.findMany({
        where: { jobId: input.jobId },
        orderBy: { sortOrder: "asc" },
      })
    ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.unit.findUnique({
        where: { id: input.id },
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: {
              sectionDef: {
                include: { options: { orderBy: { sortOrder: "asc" }, include: { choices: { orderBy: { sortOrder: "asc" } } } } },
              },
              options: true,
            },
          },
          calculations: true,
        },
      });
      if (!unit) throw new TRPCError({ code: "NOT_FOUND" });
      return unit;
    }),

  create: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        tag: z.string().min(1),
        service: z.string().optional(),
        designAirflowCfm: z.number().positive().optional(),
        casingWidthIn: z.number().positive().optional(),
        casingHeightIn: z.number().positive().optional(),
        orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.unit.count({ where: { jobId: input.jobId } });
      return ctx.db.unit.create({ data: { ...input, sortOrder: count } });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tag: z.string().min(1).optional(),
        service: z.string().optional(),
        designAirflowCfm: z.number().positive().optional(),
        casingWidthIn: z.number().positive().optional(),
        casingHeightIn: z.number().positive().optional(),
        orientation: z.enum(["horizontal", "vertical"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.unit.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.unit.delete({ where: { id: input.id } })
    ),

  // Add a section to a unit
  addSection: protectedProcedure
    .input(
      z.object({
        unitId: z.string(),
        sectionDefId: z.string(),
        position: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Shift existing sections at or after the target position
      await ctx.db.unitSection.updateMany({
        where: { unitId: input.unitId, position: { gte: input.position } },
        data: { position: { increment: 1 } },
      });
      // Mark all unit calculations as stale
      await ctx.db.unitCalculation.updateMany({
        where: { unitId: input.unitId },
        data: { isStale: true },
      });
      return ctx.db.unitSection.create({ data: input });
    }),

  removeSection: protectedProcedure
    .input(z.object({ unitSectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.unitSection.findUnique({
        where: { id: input.unitSectionId },
      });
      if (!section) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.unitSection.delete({ where: { id: input.unitSectionId } });
      // Reorder remaining sections
      await ctx.db.unitSection.updateMany({
        where: { unitId: section.unitId, position: { gt: section.position } },
        data: { position: { decrement: 1 } },
      });
      await ctx.db.unitCalculation.updateMany({
        where: { unitId: section.unitId },
        data: { isStale: true },
      });
    }),

  reorderSections: protectedProcedure
    .input(z.object({ orderedSectionIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.orderedSectionIds.map((id, position) =>
          ctx.db.unitSection.update({ where: { id }, data: { position } })
        )
      );
    }),

  setSectionOption: protectedProcedure
    .input(
      z.object({
        unitSectionId: z.string(),
        optionDefId: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.unitSection.findUnique({
        where: { id: input.unitSectionId },
      });
      if (!section) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.unitCalculation.updateMany({
        where: { unitId: section.unitId },
        data: { isStale: true },
      });
      return ctx.db.unitSectionOption.upsert({
        where: { unitSectionId_optionDefId: { unitSectionId: input.unitSectionId, optionDefId: input.optionDefId } },
        update: { value: input.value },
        create: input,
      });
    }),
});
