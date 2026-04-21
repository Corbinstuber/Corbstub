import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { jobs: true } } },
    })
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: { jobs: { orderBy: { createdAt: "desc" } } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        customerName: z.string().optional(),
        customerContact: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.db.project.create({
        data: { ...input, createdById: ctx.session.user.id },
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        customerName: z.string().optional(),
        customerContact: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.project.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.project.delete({ where: { id: input.id } })
    ),
});
