import { type ValidationResult } from "./types";

interface RuleInput {
  code: string;
  scope: string;
  ruleType: string;
  severity: string;
  errorMessage: string;
  condition: unknown;
  assertion: unknown;
}

interface EvalContext {
  sectionCodes: string[];
  optionValues: Record<string, string>; // flat map of optionCode -> value
}

// Custom function registry — engineers add complex rules here without modifying the grammar
const customFnRegistry: Record<string, (ctx: EvalContext) => boolean> = {};

export function registerCustomRule(code: string, fn: (ctx: EvalContext) => boolean) {
  customFnRegistry[code] = fn;
}

export class RuleEvaluator {
  evaluate(rules: RuleInput[], ctx: EvalContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      if (!this.conditionMet(rule, ctx)) continue;
      if (!this.assertionHolds(rule, ctx)) {
        results.push({
          ruleCode: rule.code,
          severity: rule.severity as "error" | "warning",
          message: rule.errorMessage,
          scope: rule.scope,
        });
      }
    }

    return results;
  }

  private conditionMet(rule: RuleInput, ctx: EvalContext): boolean {
    const cond = rule.condition as Record<string, unknown>;
    if (!cond || Object.keys(cond).length === 0) return true;
    return this.evaluateExpression(cond, ctx);
  }

  private assertionHolds(rule: RuleInput, ctx: EvalContext): boolean {
    if (rule.ruleType === "custom_fn") {
      const fn = customFnRegistry[rule.code];
      return fn ? fn(ctx) : true;
    }
    const assertion = rule.assertion as Record<string, unknown>;
    return this.evaluateExpression(assertion, ctx);
  }

  private evaluateExpression(expr: Record<string, unknown>, ctx: EvalContext): boolean {
    // "unit.sections contains X"
    const sectionsExpr = expr["unit.sections"] as Record<string, unknown> | undefined;
    if (sectionsExpr) {
      const contains = sectionsExpr["contains"] as string | undefined;
      if (contains !== undefined) return ctx.sectionCodes.includes(contains);
      const notContains = sectionsExpr["notContains"] as string | undefined;
      if (notContains !== undefined) return !ctx.sectionCodes.includes(notContains);
    }

    // "option.CODE between min and max"
    const optionExpr = expr["option"] as Record<string, unknown> | undefined;
    if (optionExpr) {
      const code = optionExpr["code"] as string;
      const val = parseFloat(ctx.optionValues[code] ?? "");
      const min = optionExpr["min"] as number | undefined;
      const max = optionExpr["max"] as number | undefined;
      if (!isNaN(val)) {
        if (min !== undefined && val < min) return false;
        if (max !== undefined && val > max) return false;
        return true;
      }
    }

    return true;
  }
}
