import { type CalcFn } from "./types";
import { coilLeavingConditions } from "./psychrometrics/coilLeaving";
import { mixingBoxConditions } from "./psychrometrics/mixingBox";
import { fanBrakeHorsepower } from "./fan/bhp";
import { chwCoilPerformance } from "./coil/chwCoil";
import { filterPressureDrop } from "./filter/pressureDrop";

// Registry maps calc definition codes to their implementation functions.
// To add a new calculation:
//   1. Add a row to the calculation_definitions table (via seed or admin UI)
//   2. Create a file under the appropriate category folder
//   3. Add an entry here
export const calcRegistry: Record<string, CalcFn> = {
  PSYCHRO_MIXING_BOX: mixingBoxConditions,
  PSYCHRO_COIL_LEAVING: coilLeavingConditions,
  FAN_BHP: fanBrakeHorsepower,
  COIL_CHW_PERFORMANCE: chwCoilPerformance,
  FILTER_PD: filterPressureDrop,
};
