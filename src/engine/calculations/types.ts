export interface CalcResult {
  code: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  warnings: string[];
  error?: string;
}

export interface CalcContext {
  upstreamResults: Map<string, CalcResult>;
  unitMeta: {
    designAirflowCfm?: number;
    casingWidthIn?: number;
    casingHeightIn?: number;
    orientation?: string;
  };
}

export type CalcFn = (
  inputs: Record<string, unknown>,
  context: CalcContext
) => Omit<CalcResult, "code" | "inputs">;

export interface CalcDefinitionInput {
  code: string;
  dependsOn: string[];
  isActive: boolean;
}
