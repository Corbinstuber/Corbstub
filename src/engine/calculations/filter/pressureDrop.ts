import { type CalcFn } from "../types";

// Inputs: airflowCfm, filterType (MERV8|MERV13|MERV15|HEPA), filterArea
// Outputs: initialPressureDropInWC, finalPressureDropInWC, faceVelocityFpm
export const filterPressureDrop: CalcFn = (inputs) => {
  const {
    airflowCfm = 1000,
    filterType = "MERV13",
    filterArea = 4,
  } = inputs as { airflowCfm?: number; filterType?: string; filterArea?: number };

  const initialPd: Record<string, number> = {
    MERV8: 0.08,
    MERV13: 0.20,
    MERV15: 0.30,
    HEPA: 0.80,
  };
  const finalPd: Record<string, number> = {
    MERV8: 0.30,
    MERV13: 0.60,
    MERV15: 0.80,
    HEPA: 1.40,
  };

  const faceVelocityFpm = (airflowCfm as number) / (filterArea as number);
  const velocityFactor = faceVelocityFpm / 500;

  return {
    outputs: {
      initialPressureDropInWC: +((initialPd[filterType] ?? 0.20) * velocityFactor).toFixed(3),
      finalPressureDropInWC: +((finalPd[filterType] ?? 0.60) * velocityFactor).toFixed(3),
      faceVelocityFpm: +faceVelocityFpm.toFixed(0),
    },
    warnings: [],
  };
};
