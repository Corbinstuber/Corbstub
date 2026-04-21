import { z } from "zod";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const SECTION_CATEGORIES = ["fan", "coil", "filter", "mixing", "recovery", "misc"] as const;
const INPUT_TYPES = ["select", "number", "boolean", "multi_select", "text"] as const;

export const sectionDefsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.sectionDefinition.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      include: { _count: { select: { options: true, unitSections: true } } },
    })
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const def = await ctx.db.sectionDefinition.findUnique({
        where: { id: input.id },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { choices: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });
      if (!def) throw new TRPCError({ code: "NOT_FOUND" });
      return def;
    }),

  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1).toUpperCase(),
        label: z.string().min(1),
        category: z.enum(SECTION_CATEGORIES),
        sortOrder: z.number().int().default(0),
        config: z.record(z.string(), z.any()).default({}),
        uiMeta: z.record(z.string(), z.any()).default({}),
      })
    )
    .mutation(({ ctx, input }) => ctx.db.sectionDefinition.create({ data: input })),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        category: z.enum(SECTION_CATEGORIES).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
        config: z.record(z.string(), z.any()).optional(),
        uiMeta: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.sectionDefinition.update({ where: { id }, data });
    }),

  // Option definitions
  addOption: adminProcedure
    .input(
      z.object({
        sectionDefId: z.string(),
        code: z.string().min(1),
        label: z.string().min(1),
        inputType: z.enum(INPUT_TYPES),
        sortOrder: z.number().int().default(0),
        isRequired: z.boolean().default(false),
        defaultValue: z.string().optional(),
        unitOfMeasure: z.string().optional(),
        helpText: z.string().optional(),
        config: z.record(z.string(), z.any()).default({}),
        displayCondition: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => ctx.db.sectionOptionDefinition.create({ data: input })),

  updateOption: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        isRequired: z.boolean().optional(),
        defaultValue: z.string().optional(),
        helpText: z.string().optional(),
        sortOrder: z.number().int().optional(),
        config: z.record(z.string(), z.any()).optional(),
        displayCondition: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.sectionOptionDefinition.update({ where: { id }, data });
    }),

  // Choices
  addChoice: adminProcedure
    .input(
      z.object({
        optionDefId: z.string(),
        value: z.string().min(1),
        label: z.string().min(1),
        sortOrder: z.number().int().default(0),
        metadata: z.record(z.string(), z.any()).default({}),
      })
    )
    .mutation(({ ctx, input }) => ctx.db.sectionOptionChoice.create({ data: input })),

  updateChoice: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.sectionOptionChoice.update({ where: { id }, data });
    }),

  deleteChoice: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.sectionOptionChoice.delete({ where: { id: input.id } })),
});
