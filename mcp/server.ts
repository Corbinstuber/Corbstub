#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { fanBrakeHorsepower } from "../src/engine/calculations/fan/bhp.js";
import { filterPressureDrop } from "../src/engine/calculations/filter/pressureDrop.js";
import { mixingBoxConditions } from "../src/engine/calculations/psychrometrics/mixingBox.js";
import { chwCoilPerformance } from "../src/engine/calculations/coil/chwCoil.js";
import { CalculationEngine } from "../src/engine/calculations/CalculationEngine.js";

const EMPTY_CTX = { upstreamResults: new Map(), unitMeta: {} };

function createDb() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

async function main() {
  const db = createDb();
  const server = new McpServer({ name: "robin-hood-mcp", version: "1.0.0" });

  // ─── Stateless Engineering Calculations ───────────────────────────────────
  // These tools run without a database connection and are useful for quick
  // engineering estimates during the design process.

  server.tool(
    "calculate_fan_bhp",
    "Calculate fan brake horsepower (BHP) and select the next standard motor size.",
    {
      airflowCfm: z.number().default(1000).describe("Design airflow in CFM"),
      totalStaticPressure: z.number().default(2.0).describe("Total static pressure in inches WC"),
      fanEfficiency: z.number().min(0.1).max(1).default(0.65).describe("Fan efficiency as decimal (0–1)"),
    },
    async ({ airflowCfm, totalStaticPressure, fanEfficiency }) => {
      const result = fanBrakeHorsepower({ airflowCfm, totalStaticPressure, fanEfficiency }, EMPTY_CTX);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "calculate_filter_pressure_drop",
    "Calculate filter initial/final pressure drop and face velocity for a given filter type and airflow.",
    {
      airflowCfm: z.number().default(1000).describe("Airflow in CFM"),
      filterType: z
        .enum(["MERV8", "MERV13", "MERV15", "HEPA"])
        .default("MERV13")
        .describe("Filter efficiency rating"),
      filterArea: z.number().positive().default(4).describe("Filter face area in sq ft"),
    },
    async ({ airflowCfm, filterType, filterArea }) => {
      const result = filterPressureDrop({ airflowCfm, filterType, filterArea }, EMPTY_CTX);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "calculate_mixing_box",
    "Calculate mixed air dry-bulb and wet-bulb conditions from return air and outdoor air streams.",
    {
      returnAirDb: z.number().default(75).describe("Return air dry-bulb temperature (°F)"),
      returnAirWb: z.number().default(63).describe("Return air wet-bulb temperature (°F)"),
      oaDb: z.number().default(95).describe("Outdoor air dry-bulb temperature (°F)"),
      oaWb: z.number().default(75).describe("Outdoor air wet-bulb temperature (°F)"),
      oaPercent: z.number().min(0).max(100).default(20).describe("Outdoor air percentage (0–100)"),
    },
    async ({ returnAirDb, returnAirWb, oaDb, oaWb, oaPercent }) => {
      const result = mixingBoxConditions({ returnAirDb, returnAirWb, oaDb, oaWb, oaPercent }, EMPTY_CTX);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "calculate_chw_coil",
    "Estimate chilled water coil total capacity and air-side pressure drop.",
    {
      airflowCfm: z.number().default(1000).describe("Airflow in CFM"),
      enteringDb: z.number().default(80).describe("Entering air dry-bulb temperature (°F)"),
      rows: z.number().int().min(1).max(12).default(4).describe("Number of coil rows"),
      finsPerInch: z.number().int().min(8).max(18).default(12).describe("Fins per inch"),
    },
    async ({ airflowCfm, enteringDb, rows, finsPerInch }) => {
      const result = chwCoilPerformance({ airflowCfm, enteringDb, rows, finsPerInch }, EMPTY_CTX);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Project Management ────────────────────────────────────────────────────

  server.tool(
    "list_projects",
    "List all AHU design projects.",
    {},
    async () => {
      const projects = await db.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { jobs: true } } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(projects, null, 2) }] };
    }
  );

  server.tool(
    "get_project",
    "Get project details including its associated jobs.",
    { projectId: z.string().describe("Project UUID") },
    async ({ projectId }) => {
      const project = await db.project.findUniqueOrThrow({
        where: { id: projectId },
        include: { jobs: { orderBy: { createdAt: "desc" } } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(project, null, 2) }] };
    }
  );

  server.tool(
    "create_project",
    "Create a new AHU design project.",
    {
      name: z.string().min(1).describe("Project name"),
      customerName: z.string().optional().describe("Customer / owner name"),
      customerContact: z.string().optional().describe("Customer contact person"),
      address: z.string().optional().describe("Project site address"),
      notes: z.string().optional().describe("Additional notes"),
      createdById: z.string().describe("ID of the user creating the project"),
    },
    async ({ name, customerName, customerContact, address, notes, createdById }) => {
      const project = await db.project.create({
        data: { name, customerName, customerContact, address, notes, createdById },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(project, null, 2) }] };
    }
  );

  server.tool(
    "list_jobs",
    "List all jobs (bid revisions) for a project.",
    { projectId: z.string().describe("Project UUID") },
    async ({ projectId }) => {
      const jobs = await db.job.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { units: true } } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(jobs, null, 2) }] };
    }
  );

  server.tool(
    "get_job",
    "Get job details and its list of AHU units.",
    { jobId: z.string().describe("Job UUID") },
    async ({ jobId }) => {
      const job = await db.job.findUniqueOrThrow({
        where: { id: jobId },
        include: { units: { orderBy: { sortOrder: "asc" } } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(job, null, 2) }] };
    }
  );

  server.tool(
    "create_job",
    "Create a new job (bid) within a project.",
    {
      projectId: z.string().describe("Parent project UUID"),
      jobNumber: z.string().min(1).describe("Unique job number (e.g. J-2026-001)"),
      name: z.string().min(1).describe("Job name / description"),
      notes: z.string().optional().describe("Additional notes"),
      createdById: z.string().describe("ID of the user creating the job"),
    },
    async ({ projectId, jobNumber, name, notes, createdById }) => {
      const job = await db.job.create({
        data: { projectId, jobNumber, name, notes, createdById },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(job, null, 2) }] };
    }
  );

  server.tool(
    "list_units",
    "List all AHU units in a job, ordered by position.",
    { jobId: z.string().describe("Job UUID") },
    async ({ jobId }) => {
      const units = await db.unit.findMany({
        where: { jobId },
        orderBy: { sortOrder: "asc" },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(units, null, 2) }] };
    }
  );

  server.tool(
    "get_unit",
    "Get full AHU unit details: sections, configuration options, and latest calculation results.",
    { unitId: z.string().describe("Unit UUID") },
    async ({ unitId }) => {
      const unit = await db.unit.findUniqueOrThrow({
        where: { id: unitId },
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: {
              sectionDef: {
                include: {
                  options: {
                    orderBy: { sortOrder: "asc" },
                    include: { choices: { orderBy: { sortOrder: "asc" } } },
                  },
                },
              },
              options: true,
            },
          },
          calculations: { orderBy: { calculatedAt: "desc" } },
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(unit, null, 2) }] };
    }
  );

  server.tool(
    "create_unit",
    "Add a new AHU unit to a job.",
    {
      jobId: z.string().describe("Parent job UUID"),
      tag: z.string().min(1).describe("Unit tag (e.g. AHU-1)"),
      service: z.string().optional().describe("System service description (e.g. Lab Exhaust)"),
      designAirflowCfm: z.number().positive().optional().describe("Design airflow in CFM"),
      casingWidthIn: z.number().positive().optional().describe("Casing width in inches"),
      casingHeightIn: z.number().positive().optional().describe("Casing height in inches"),
      orientation: z
        .enum(["horizontal", "vertical"])
        .default("horizontal")
        .describe("Unit orientation"),
      notes: z.string().optional().describe("Additional notes"),
    },
    async ({ jobId, tag, service, designAirflowCfm, casingWidthIn, casingHeightIn, orientation, notes }) => {
      const count = await db.unit.count({ where: { jobId } });
      const unit = await db.unit.create({
        data: {
          jobId,
          tag,
          service,
          designAirflowCfm,
          casingWidthIn,
          casingHeightIn,
          orientation,
          notes,
          sortOrder: count,
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(unit, null, 2) }] };
    }
  );

  server.tool(
    "add_unit_section",
    "Add an AHU section (fan, coil, filter, mixing box, etc.) to a unit at the specified position. Shifts existing sections down.",
    {
      unitId: z.string().describe("Unit UUID"),
      sectionDefId: z.string().describe("Section definition UUID (from list_section_definitions)"),
      position: z.number().int().min(0).describe("Insert position (0-indexed)"),
    },
    async ({ unitId, sectionDefId, position }) => {
      await db.unitSection.updateMany({
        where: { unitId, position: { gte: position } },
        data: { position: { increment: 1 } },
      });
      const section = await db.unitSection.create({
        data: { unitId, sectionDefId, position },
      });
      await db.unitCalculation.updateMany({
        where: { unitId },
        data: { isStale: true },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(section, null, 2) }] };
    }
  );

  server.tool(
    "set_section_option",
    "Set a configuration option value on a unit section (upserts if already set).",
    {
      unitSectionId: z.string().describe("Unit section UUID"),
      optionDefId: z.string().describe("Option definition UUID"),
      value: z.string().describe("Option value (always stored as string)"),
    },
    async ({ unitSectionId, optionDefId, value }) => {
      const section = await db.unitSection.findUniqueOrThrow({ where: { id: unitSectionId } });
      await db.unitCalculation.updateMany({
        where: { unitId: section.unitId },
        data: { isStale: true },
      });
      const option = await db.unitSectionOption.upsert({
        where: { unitSectionId_optionDefId: { unitSectionId, optionDefId } },
        update: { value },
        create: { unitSectionId, optionDefId, value },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(option, null, 2) }] };
    }
  );

  server.tool(
    "run_unit_calculations",
    "Run all active engineering calculations for an AHU unit and persist the results to the database.",
    { unitId: z.string().describe("Unit UUID") },
    async ({ unitId }) => {
      const unit = await db.unit.findUniqueOrThrow({
        where: { id: unitId },
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
      const calcDefs = await db.calculationDefinition.findMany({ where: { isActive: true } });
      const engine = new CalculationEngine(calcDefs);
      const results = engine.run(unit);

      await Promise.all(
        results.map((r) =>
          db.unitCalculation.upsert({
            where: { unitId_calcDefCode: { unitId, calcDefCode: r.code } },
            update: {
              inputs: r.inputs,
              outputs: r.outputs,
              warnings: r.warnings,
              calculatedAt: new Date(),
              isStale: false,
            },
            create: {
              unitId,
              calcDefCode: r.code,
              inputs: r.inputs,
              outputs: r.outputs,
              warnings: r.warnings,
              isStale: false,
            },
          })
        )
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ count: results.length, results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "list_section_definitions",
    "List all available AHU section types (fan, coil, filter, mixing box, etc.) with their configurable options and choices.",
    {},
    async () => {
      const defs = await db.sectionDefinition.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { choices: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(defs, null, 2) }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Robin Hood MCP fatal error:", err);
  process.exit(1);
});
