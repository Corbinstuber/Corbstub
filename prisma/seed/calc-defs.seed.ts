import { type PrismaClient } from "@prisma/client";

export async function seedCalcDefs(db: PrismaClient) {
  const defs = [
    {
      code: "PSYCHRO_MIXING_BOX",
      label: "Mixing Box — Mixed Air Conditions",
      category: "psychrometrics",
      dependsOn: [],
      notes: "Calculates mixed air DB/WB from return air, OA conditions, and OA%",
      inputSchema: {
        returnAirDb: "number (°F)",
        returnAirWb: "number (°F)",
        oaDb: "number (°F)",
        oaWb: "number (°F)",
        oaPercent: "number (0-100)",
      },
      outputSchema: {
        mixedDb: "number (°F)",
        mixedWb: "number (°F)",
      },
    },
    {
      code: "PSYCHRO_COIL_LEAVING",
      label: "Coil — Leaving Air Conditions",
      category: "psychrometrics",
      dependsOn: ["PSYCHRO_MIXING_BOX"],
      notes: "Calculates leaving air conditions across cooling coil",
      inputSchema: {
        enteringDb: "number (°F)",
        enteringWb: "number (°F)",
        airflowCfm: "number",
        coilCapacityMbh: "number",
      },
      outputSchema: {
        leavingDb: "number (°F)",
        leavingWb: "number (°F)",
        cfmPerTon: "number",
      },
    },
    {
      code: "COIL_CHW_PERFORMANCE",
      label: "Chilled Water Coil Performance",
      category: "coil",
      dependsOn: ["PSYCHRO_MIXING_BOX"],
      notes: "Selects and rates chilled water cooling coil",
      inputSchema: {
        airflowCfm: "number",
        enteringDb: "number (°F)",
        enteringWb: "number (°F)",
        chwEnteringTemp: "number (°F)",
        chwLeavingTemp: "number (°F)",
        rows: "number",
        finsPerInch: "number",
      },
      outputSchema: {
        totalCapacityMbh: "number",
        sensibleCapacityMbh: "number",
        latentCapacityMbh: "number",
        faceVelocity: "number (fpm)",
        airPressureDropInWC: "number (in WC)",
        waterFlowGpm: "number",
      },
    },
    {
      code: "FILTER_PD",
      label: "Filter Pressure Drop",
      category: "filter",
      dependsOn: [],
      notes: "Calculates initial and final filter pressure drops",
      inputSchema: {
        airflowCfm: "number",
        filterType: "string (MERV8|MERV13|MERV15|HEPA)",
        filterArea: "number (sq ft)",
      },
      outputSchema: {
        initialPressureDropInWC: "number",
        finalPressureDropInWC: "number",
        faceVelocityFpm: "number",
      },
    },
    {
      code: "FAN_BHP",
      label: "Fan Brake Horsepower",
      category: "fan",
      dependsOn: ["COIL_CHW_PERFORMANCE", "FILTER_PD"],
      notes: "Calculates fan BHP from airflow and total static pressure including all components",
      inputSchema: {
        airflowCfm: "number",
        totalStaticPressure: "number (in WC)",
        fanEfficiency: "number (0-1)",
      },
      outputSchema: {
        bhp: "number",
        motorHp: "number (next standard motor size)",
      },
    },
  ];

  for (const def of defs) {
    const existing = await db.calculationDefinition.findUnique({ where: { code: def.code } });
    if (existing) {
      console.log(`  Skipping calc def ${def.code} (already exists)`);
      continue;
    }
    await db.calculationDefinition.create({ data: def });
    console.log(`  Created calc def: ${def.code}`);
  }
}
