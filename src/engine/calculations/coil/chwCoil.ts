import { type CalcFn } from "../types";

// Plug-in point: chilled water coil performance
// Inputs: airflowCfm, enteringDb, enteringWb, chwEnteringTemp, chwLeavingTemp, rows, finsPerInch
// Outputs: totalCapacityMbh, sensibleCapacityMbh, latentCapacityMbh, airPressureDropInWC, waterFlowGpm
export const chwCoilPerformance: CalcFn = (inputs) => {
  const {
    airflowCfm = 1000,
    enteringDb = 80,
    rows = 4,
    finsPerInch = 12,
  } = inputs as Record<string, number>;

  // STUB: Replace with actual coil selection algorithm (LMTD, NTU-effectiveness, or proprietary method)
  const faceVelocity = airflowCfm / 4; // assuming ~4 sq ft face area placeholder
  const airPressureDropInWC = rows * 0.08 + (finsPerInch / 12) * 0.05;
  const totalCapacityMbh = airflowCfm * 0.068 * (enteringDb - 55);

  return {
    outputs: {
      totalCapacityMbh: +totalCapacityMbh.toFixed(1),
      faceVelocity: +faceVelocity.toFixed(0),
      airPressureDropInWC: +airPressureDropInWC.toFixed(3),
    },
    warnings: ["STUB: chwCoilPerformance — replace with proprietary coil selection method"],
  };
};
