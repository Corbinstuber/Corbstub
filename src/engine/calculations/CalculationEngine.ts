import { calcRegistry } from "./registry";
import { type CalcResult, type CalcContext, type CalcDefinitionInput } from "./types";

interface UnitInput {
  designAirflowCfm?: unknown;
  casingWidthIn?: unknown;
  casingHeightIn?: unknown;
  orientation?: string;
  sections: Array<{
    sectionDef: { code: string };
    options: Array<{ optionDef: { code: string }; value: string }>;
  }>;
}

export class CalculationEngine {
  private readonly defs: CalcDefinitionInput[];

  constructor(defs: CalcDefinitionInput[]) {
    this.defs = defs.filter((d) => d.isActive && calcRegistry[d.code]);
  }

  run(unit: UnitInput): CalcResult[] {
    const ordered = this.topologicalSort();
    const results: CalcResult[] = [];
    const upstreamResults = new Map<string, CalcResult>();

    const unitMeta = {
      designAirflowCfm: unit.designAirflowCfm != null ? Number(unit.designAirflowCfm) : undefined,
      casingWidthIn: unit.casingWidthIn != null ? Number(unit.casingWidthIn) : undefined,
      casingHeightIn: unit.casingHeightIn != null ? Number(unit.casingHeightIn) : undefined,
      orientation: unit.orientation,
    };

    const inputs = this.buildInputs(unit);
    const ctx: CalcContext = { upstreamResults, unitMeta };

    for (const code of ordered) {
      const fn = calcRegistry[code];
      if (!fn) continue;
      try {
        const { outputs, warnings } = fn(inputs[code] ?? {}, ctx);
        const result: CalcResult = { code, inputs: inputs[code] ?? {}, outputs, warnings };
        results.push(result);
        upstreamResults.set(code, result);
      } catch (err) {
        results.push({
          code,
          inputs: inputs[code] ?? {},
          outputs: {},
          warnings: [],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }

  private topologicalSort(): string[] {
    const defMap = new Map(this.defs.map((d) => [d.code, d]));
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (code: string) => {
      if (visited.has(code)) return;
      visited.add(code);
      const def = defMap.get(code);
      if (def) {
        for (const dep of def.dependsOn) visit(dep);
      }
      result.push(code);
    };

    for (const def of this.defs) visit(def.code);
    return result;
  }

  private buildInputs(unit: UnitInput): Record<string, Record<string, unknown>> {
    // Flatten all section options into a single input map per calc code.
    // Calc functions receive the full flat option set; they pick what they need.
    const flat: Record<string, unknown> = {
      airflowCfm: unit.designAirflowCfm != null ? Number(unit.designAirflowCfm) : undefined,
    };

    for (const section of unit.sections) {
      for (const opt of section.options) {
        flat[opt.optionDef.code] = opt.value;
      }
    }

    // All calcs share the same flat input bag; each function picks what it needs
    return Object.fromEntries(this.defs.map((d) => [d.code, flat]));
  }
}
