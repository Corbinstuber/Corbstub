import { type CalcFn } from "../types";

// Plug-in point: replace stub with your proprietary coil leaving condition formulas.
// Inputs expected: enteringDb (°F), enteringWb (°F), airflowCfm, coilCapacityMbh
// Outputs: leavingDb (°F), leavingWb (°F), sensibleCapacityMbh, latentCapacityMbh
export const coilLeavingConditions: CalcFn = (inputs) => {
  const { enteringDb = 80, enteringWb = 67, airflowCfm = 1000, coilCapacityMbh = 0 } = inputs as {
    enteringDb?: number;
    enteringWb?: number;
    airflowCfm?: number;
    coilCapacityMbh?: number;
  };

  // STUB: Replace with actual heat transfer calculations
  const cfmPerTon = (airflowCfm as number) / ((coilCapacityMbh as number) / 12 || 1);
  const leavingDb = (enteringDb as number) - 20;
  const leavingWb = (enteringWb as number) - 12;

  return {
    outputs: { leavingDb, leavingWb, cfmPerTon, enteringDb, enteringWb },
    warnings: ["STUB: coilLeavingConditions — replace with proprietary formula"],
  };
};
