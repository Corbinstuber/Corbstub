import { type PrismaClient } from "@prisma/client";

export async function seedValidationRules(db: PrismaClient) {
  const rules = [
    {
      code: "SUPPLY_FAN_REQUIRED",
      label: "Supply fan section is required",
      scope: "unit",
      ruleType: "requires",
      condition: {},
      assertion: { "unit.sections": { contains: "FAN_SUPPLY" } },
      errorMessage: "A supply fan section is required on every unit.",
      severity: "error",
    },
    {
      code: "RETURN_FAN_REQUIRES_MIXING_BOX",
      label: "Return fan requires mixing box",
      scope: "unit",
      ruleType: "requires",
      condition: { "unit.sections": { contains: "FAN_RETURN" } },
      assertion: { "unit.sections": { contains: "MIXING_BOX" } },
      errorMessage: "A return fan section requires a mixing box / economizer section.",
      severity: "error",
    },
    {
      code: "CHW_DRAIN_PAN_REQUIRED",
      label: "CHW coil requires drain pan selection",
      scope: "unit",
      ruleType: "requires",
      condition: { "unit.sections": { contains: "COIL_CHW" } },
      assertion: { "unit.sections": { contains: "COIL_CHW" } },
      errorMessage: "Drain pan material must be selected for chilled water coil.",
      severity: "warning",
    },
    {
      code: "PRE_FILTER_BEFORE_COIL",
      label: "Pre-filter recommended before cooling coil",
      scope: "unit",
      ruleType: "requires",
      condition: { "unit.sections": { contains: "COIL_CHW" } },
      assertion: { "unit.sections": { contains: "FILTER_PRE" } },
      errorMessage: "A pre-filter section is strongly recommended upstream of the cooling coil.",
      severity: "warning",
    },
  ];

  for (const rule of rules) {
    const existing = await db.validationRule.findUnique({ where: { code: rule.code } });
    if (existing) {
      console.log(`  Skipping rule ${rule.code} (already exists)`);
      continue;
    }
    await db.validationRule.create({ data: rule });
    console.log(`  Created rule: ${rule.code}`);
  }
}
