import { RuleEvaluator } from "./RuleEvaluator";
import { type ValidatedUnitConfiguration, type ResolvedSection, type ResolvedOption } from "./types";

interface OptionChoice {
  value: string;
  label: string;
  isActive: boolean;
}

interface OptionDef {
  id: string;
  code: string;
  label: string;
  inputType: string;
  isRequired: boolean;
  unitOfMeasure?: string | null;
  helpText?: string | null;
  config: unknown;
  displayCondition?: unknown;
  choices: OptionChoice[];
}

interface SectionDef {
  id: string;
  code: string;
  label: string;
  category: string;
  options: OptionDef[];
}

interface UnitSectionInput {
  id: string;
  sectionDefId: string;
  position: number;
  sectionDef: SectionDef;
  options: Array<{ optionDefId: string; value: string }>;
}

interface ValidationRuleInput {
  code: string;
  scope: string;
  ruleType: string;
  severity: string;
  errorMessage: string;
  condition: unknown;
  assertion: unknown;
  isActive: boolean;
}

export class ConfigurationEngine {
  private readonly ruleEvaluator = new RuleEvaluator();

  resolve(
    unitId: string,
    sections: UnitSectionInput[],
    rules: ValidationRuleInput[]
  ): ValidatedUnitConfiguration {
    // Build flat option value map for rule evaluation
    const optionValues: Record<string, string> = {};
    for (const section of sections) {
      for (const opt of section.options) {
        const def = section.sectionDef.options.find((o) => o.id === opt.optionDefId);
        if (def) optionValues[def.code] = opt.value;
      }
    }

    const sectionCodes = sections.map((s) => s.sectionDef.code);
    const evalCtx = { sectionCodes, optionValues };
    const activeRules = rules.filter((r) => r.isActive);
    const validationResults = this.ruleEvaluator.evaluate(activeRules, evalCtx);

    const resolvedSections: ResolvedSection[] = sections.map((section) => {
      const currentValues = new Map(
        section.options.map((o) => [o.optionDefId, o.value])
      );

      const resolvedOptions: ResolvedOption[] = section.sectionDef.options.map((optDef) => {
        const isVisible = this.evaluateDisplayCondition(optDef.displayCondition, currentValues, section.sectionDef.options);
        return {
          id: optDef.id,
          code: optDef.code,
          label: optDef.label,
          inputType: optDef.inputType,
          isRequired: optDef.isRequired,
          unitOfMeasure: optDef.unitOfMeasure,
          helpText: optDef.helpText,
          config: (optDef.config ?? {}) as Record<string, unknown>,
          choices: optDef.choices.filter((c) => c.isActive),
          currentValue: currentValues.get(optDef.id),
          isVisible,
        };
      });

      return {
        unitSectionId: section.id,
        sectionDefId: section.sectionDefId,
        code: section.sectionDef.code,
        label: section.sectionDef.label,
        category: section.sectionDef.category,
        position: section.position,
        options: resolvedOptions,
      };
    });

    return {
      unitId,
      sections: resolvedSections,
      validationResults,
      hasErrors: validationResults.some((r) => r.severity === "error"),
      hasWarnings: validationResults.some((r) => r.severity === "warning"),
    };
  }

  private evaluateDisplayCondition(
    condition: unknown,
    currentValues: Map<string, string>,
    allOptions: OptionDef[]
  ): boolean {
    if (!condition) return true;
    const cond = condition as Record<string, unknown>;

    // { "when": { "optionCode": "VALUE" } }
    const when = cond["when"] as Record<string, string> | undefined;
    if (when) {
      return Object.entries(when).every(([optCode, expectedVal]) => {
        const optDef = allOptions.find((o) => o.code === optCode);
        if (!optDef) return true;
        return currentValues.get(optDef.id) === expectedVal;
      });
    }

    return true;
  }
}
