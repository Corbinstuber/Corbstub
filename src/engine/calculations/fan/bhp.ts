import { type CalcFn } from "../types";

// Plug-in point: replace stub with your fan BHP formula.
// Inputs: airflowCfm, totalStaticPressure (inWC), fanEfficiency (0-1)
// Outputs: bhp, motorHp (next standard motor size), amperage
export const fanBrakeHorsepower: CalcFn = (inputs) => {
  const {
    airflowCfm = 1000,
    totalStaticPressure = 2.0,
    fanEfficiency = 0.65,
  } = inputs as Record<string, number>;

  // STUB: BHP = (CFM × TSP) / (6356 × efficiency) — replace with your formula
  const bhp = (airflowCfm * totalStaticPressure) / (6356 * fanEfficiency);
  const motorHp = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100].find(
    (hp) => hp >= bhp * 1.15
  ) ?? bhp * 1.25;

  return {
    outputs: { bhp: +bhp.toFixed(2), motorHp },
    warnings: ["STUB: fanBrakeHorsepower — replace with proprietary fan curve lookup"],
  };
};
