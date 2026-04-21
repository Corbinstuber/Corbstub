import { type CalcFn } from "../types";

// Inputs: returnAirDb, returnAirWb, oaDb, oaWb, oaPercent (0-100)
// Outputs: mixedDb, mixedWb, mixedEnthalpy
export const mixingBoxConditions: CalcFn = (inputs) => {
  const {
    returnAirDb = 75,
    returnAirWb = 63,
    oaDb = 95,
    oaWb = 75,
    oaPercent = 20,
  } = inputs as Record<string, number>;

  const ra = (100 - oaPercent) / 100;
  const oa = oaPercent / 100;
  const mixedDb = returnAirDb * ra + oaDb * oa;
  const mixedWb = returnAirWb * ra + oaWb * oa;

  return {
    outputs: { mixedDb, mixedWb },
    warnings: ["STUB: mixingBoxConditions — replace with psychrometric enthalpy calculation"],
  };
};
