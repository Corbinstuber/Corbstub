import { type PrismaClient } from "@prisma/client";

export async function seedSections(db: PrismaClient) {
  const sections = [
    {
      code: "MIXING_BOX",
      label: "Mixing Box / Economizer",
      category: "mixing",
      sortOrder: 10,
      config: { allowMultiple: false, minQty: 0, maxQty: 1, defaultQty: 0 },
      uiMeta: { color: "#6366f1", description: "Outside air / return air mixing section" },
      options: [
        { code: "OA_DAMPER_TYPE", label: "OA Damper Type", inputType: "select", isRequired: true, sortOrder: 10,
          choices: [
            { value: "LOW_LEAK", label: "Low Leak (<0.1 cfm/ft²)", sortOrder: 10 },
            { value: "STANDARD", label: "Standard", sortOrder: 20 },
          ]},
        { code: "OA_PERCENT_MIN", label: "Min OA %", inputType: "number", isRequired: true, sortOrder: 20, unitOfMeasure: "%",
          config: { min: 0, max: 100, step: 1 }, defaultValue: "20" },
        { code: "RA_DAMPER_TYPE", label: "RA Damper Type", inputType: "select", sortOrder: 30,
          choices: [
            { value: "LOW_LEAK", label: "Low Leak", sortOrder: 10 },
            { value: "STANDARD", label: "Standard", sortOrder: 20 },
          ]},
      ],
    },
    {
      code: "FILTER_PRE",
      label: "Pre-Filter Section",
      category: "filter",
      sortOrder: 20,
      config: { allowMultiple: false, minQty: 0, maxQty: 1, defaultQty: 1 },
      uiMeta: { color: "#f59e0b", description: "Pre-filter for coarse particulate" },
      options: [
        { code: "FILTER_EFFICIENCY_PRE", label: "Filter Rating", inputType: "select", isRequired: true, sortOrder: 10,
          choices: [
            { value: "MERV8", label: "MERV 8", sortOrder: 10, metadata: { pressureDropInitial: 0.08 } },
            { value: "MERV11", label: "MERV 11", sortOrder: 20, metadata: { pressureDropInitial: 0.12 } },
          ]},
        { code: "FILTER_ARRANGEMENT", label: "Filter Arrangement", inputType: "select", sortOrder: 20,
          choices: [
            { value: "FLAT", label: "Flat Panel", sortOrder: 10 },
            { value: "ANGLED_45", label: "45° Angle", sortOrder: 20 },
            { value: "V_BANK", label: "V-Bank", sortOrder: 30 },
          ]},
        { code: "FILTER_GAUGE", label: "Filter Gauge (MAGNAHELIC)", inputType: "boolean", sortOrder: 30, defaultValue: "true" },
      ],
    },
    {
      code: "COIL_CHW",
      label: "Chilled Water Coil",
      category: "coil",
      sortOrder: 30,
      config: { allowMultiple: true, minQty: 0, maxQty: 2, defaultQty: 0 },
      uiMeta: { color: "#3b82f6", description: "Chilled water cooling coil" },
      options: [
        { code: "CHW_ENTERING_TEMP", label: "Entering Water Temp", inputType: "number", isRequired: true, sortOrder: 10, unitOfMeasure: "°F",
          config: { min: 35, max: 60, step: 0.5 }, defaultValue: "44" },
        { code: "CHW_LEAVING_TEMP", label: "Leaving Water Temp", inputType: "number", isRequired: true, sortOrder: 20, unitOfMeasure: "°F",
          config: { min: 40, max: 70, step: 0.5 }, defaultValue: "56" },
        { code: "COIL_ROWS", label: "Coil Rows", inputType: "select", isRequired: true, sortOrder: 30,
          choices: [
            { value: "2", label: "2 Row", sortOrder: 10 },
            { value: "4", label: "4 Row", sortOrder: 20 },
            { value: "6", label: "6 Row", sortOrder: 30 },
            { value: "8", label: "8 Row", sortOrder: 40 },
          ]},
        { code: "COIL_FPI", label: "Fins Per Inch", inputType: "select", sortOrder: 40,
          choices: [
            { value: "8", label: "8 FPI", sortOrder: 10 },
            { value: "10", label: "10 FPI", sortOrder: 20 },
            { value: "12", label: "12 FPI", sortOrder: 30 },
            { value: "14", label: "14 FPI", sortOrder: 40 },
          ]},
        { code: "COIL_FIN_MATERIAL", label: "Fin Material", inputType: "select", sortOrder: 50,
          choices: [
            { value: "ALUMINUM", label: "Aluminum", sortOrder: 10 },
            { value: "COPPER", label: "Copper", sortOrder: 20 },
            { value: "EPOXY_COATED", label: "Epoxy Coated Aluminum", sortOrder: 30 },
          ]},
        { code: "DRAIN_PAN", label: "Drain Pan Material", inputType: "select", isRequired: true, sortOrder: 60,
          choices: [
            { value: "SS_304", label: "304 Stainless Steel", sortOrder: 10 },
            { value: "GALVANIZED", label: "Galvanized Steel", sortOrder: 20 },
            { value: "POLYMER", label: "Polymer", sortOrder: 30 },
          ]},
      ],
    },
    {
      code: "COIL_HW",
      label: "Hot Water Heating Coil",
      category: "coil",
      sortOrder: 40,
      config: { allowMultiple: true, minQty: 0, maxQty: 2, defaultQty: 0 },
      uiMeta: { color: "#ef4444", description: "Hot water heating coil" },
      options: [
        { code: "HW_ENTERING_TEMP", label: "Entering Water Temp", inputType: "number", isRequired: true, sortOrder: 10, unitOfMeasure: "°F",
          config: { min: 100, max: 250, step: 5 }, defaultValue: "180" },
        { code: "HW_LEAVING_TEMP", label: "Leaving Water Temp", inputType: "number", isRequired: true, sortOrder: 20, unitOfMeasure: "°F",
          config: { min: 80, max: 220, step: 5 }, defaultValue: "160" },
        { code: "HW_COIL_ROWS", label: "Coil Rows", inputType: "select", isRequired: true, sortOrder: 30,
          choices: [
            { value: "1", label: "1 Row", sortOrder: 10 },
            { value: "2", label: "2 Row", sortOrder: 20 },
            { value: "3", label: "3 Row", sortOrder: 30 },
          ]},
      ],
    },
    {
      code: "FILTER_FINAL",
      label: "Final Filter Section",
      category: "filter",
      sortOrder: 50,
      config: { allowMultiple: false, minQty: 0, maxQty: 1, defaultQty: 0 },
      uiMeta: { color: "#f59e0b", description: "Final filter for fine particulate / HEPA" },
      options: [
        { code: "FILTER_EFFICIENCY_FINAL", label: "Filter Rating", inputType: "select", isRequired: true, sortOrder: 10,
          choices: [
            { value: "MERV13", label: "MERV 13", sortOrder: 10, metadata: { pressureDropInitial: 0.20 } },
            { value: "MERV15", label: "MERV 15", sortOrder: 20, metadata: { pressureDropInitial: 0.30 } },
            { value: "HEPA", label: "HEPA (99.97%)", sortOrder: 30, metadata: { pressureDropInitial: 0.80 } },
          ]},
        { code: "FINAL_FILTER_HOUSING", label: "Housing Style", inputType: "select", sortOrder: 20,
          choices: [
            { value: "SIDE_ACCESS", label: "Side Access", sortOrder: 10 },
            { value: "FRONT_ACCESS", label: "Front Access", sortOrder: 20 },
            { value: "BAG_IN_OUT", label: "Bag-In / Bag-Out", sortOrder: 30 },
          ]},
      ],
    },
    {
      code: "FAN_SUPPLY",
      label: "Supply Fan Section",
      category: "fan",
      sortOrder: 60,
      config: { allowMultiple: false, minQty: 1, maxQty: 1, defaultQty: 1 },
      uiMeta: { color: "#10b981", description: "Supply/forward fan section" },
      options: [
        { code: "FAN_TYPE", label: "Fan Type", inputType: "select", isRequired: true, sortOrder: 10,
          choices: [
            { value: "FC_CENTRIFUGAL", label: "Forward Curved Centrifugal", sortOrder: 10 },
            { value: "BC_CENTRIFUGAL", label: "Backward Curved / AF Plug Fan", sortOrder: 20 },
            { value: "PLENUM", label: "Plenum Fan (Plug)", sortOrder: 30 },
            { value: "VANE_AXIAL", label: "Vane Axial", sortOrder: 40 },
          ]},
        { code: "FAN_DRIVE", label: "Drive Type", inputType: "select", isRequired: true, sortOrder: 20,
          choices: [
            { value: "DIRECT", label: "Direct Drive", sortOrder: 10 },
            { value: "BELT", label: "Belt Drive", sortOrder: 20 },
          ]},
        { code: "MOTOR_EFFICIENCY", label: "Motor Efficiency Class", inputType: "select", sortOrder: 30,
          choices: [
            { value: "IE3", label: "IE3 / Premium Efficiency", sortOrder: 10 },
            { value: "IE4", label: "IE4 / Super Premium", sortOrder: 20 },
          ]},
        { code: "VFD", label: "Variable Frequency Drive", inputType: "boolean", sortOrder: 40, defaultValue: "true" },
        { code: "TOTAL_STATIC_PRESSURE", label: "Total Static Pressure", inputType: "number", isRequired: true,
          sortOrder: 50, unitOfMeasure: "in WC", config: { min: 0.25, max: 10, step: 0.25 }, defaultValue: "2.5" },
        { code: "FAN_RPM", label: "Design RPM", inputType: "number", sortOrder: 60, unitOfMeasure: "RPM",
          config: { min: 100, max: 3600, step: 10 } },
      ],
    },
    {
      code: "FAN_RETURN",
      label: "Return Fan Section",
      category: "fan",
      sortOrder: 70,
      config: { allowMultiple: false, minQty: 0, maxQty: 1, defaultQty: 0 },
      uiMeta: { color: "#10b981", description: "Return air fan section" },
      options: [
        { code: "RF_TYPE", label: "Fan Type", inputType: "select", isRequired: true, sortOrder: 10,
          choices: [
            { value: "FC_CENTRIFUGAL", label: "Forward Curved Centrifugal", sortOrder: 10 },
            { value: "BC_CENTRIFUGAL", label: "Backward Curved / AF Plug Fan", sortOrder: 20 },
            { value: "PLENUM", label: "Plenum Fan (Plug)", sortOrder: 30 },
          ]},
        { code: "RF_DRIVE", label: "Drive Type", inputType: "select", isRequired: true, sortOrder: 20,
          choices: [
            { value: "DIRECT", label: "Direct Drive", sortOrder: 10 },
            { value: "BELT", label: "Belt Drive", sortOrder: 20 },
          ]},
        { code: "RF_VFD", label: "Variable Frequency Drive", inputType: "boolean", sortOrder: 30, defaultValue: "true" },
      ],
    },
    {
      code: "ACCESS_SECTION",
      label: "Access / Service Section",
      category: "misc",
      sortOrder: 80,
      config: { allowMultiple: true, minQty: 0, maxQty: 4, defaultQty: 0 },
      uiMeta: { color: "#64748b", description: "Blank access or service section" },
      options: [
        { code: "ACCESS_LENGTH", label: "Section Length", inputType: "number", isRequired: true, sortOrder: 10,
          unitOfMeasure: "in", config: { min: 6, max: 48, step: 1 }, defaultValue: "12" },
        { code: "ACCESS_DOOR", label: "Access Door", inputType: "boolean", sortOrder: 20, defaultValue: "false" },
        { code: "ACCESS_DOOR_SIZE", label: "Door Size", inputType: "select", sortOrder: 30,
          displayCondition: { when: { ACCESS_DOOR: "true" } },
          choices: [
            { value: "12x16", label: '12" × 16"', sortOrder: 10 },
            { value: "16x20", label: '16" × 20"', sortOrder: 20 },
            { value: "18x24", label: '18" × 24"', sortOrder: 30 },
          ]},
      ],
    },
  ];

  for (const section of sections) {
    const { options, ...sectionData } = section;
    const existing = await db.sectionDefinition.findUnique({ where: { code: sectionData.code } });
    if (existing) {
      console.log(`  Skipping section ${sectionData.code} (already exists)`);
      continue;
    }

    const created = await db.sectionDefinition.create({ data: sectionData });
    console.log(`  Created section: ${created.code}`);

    for (const opt of options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { choices = [], ...optData } = opt as any;
      const createdOpt = await db.sectionOptionDefinition.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { ...optData, sectionDefId: created.id } as any,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const choice of choices as any[]) {
        const { metadata, ...choiceData } = choice;
        await db.sectionOptionChoice.create({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { ...choiceData, optionDefId: createdOpt.id, metadata: metadata ?? {} } as any,
        });
      }
    }
  }
}
