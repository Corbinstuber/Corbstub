export interface ValidationResult {
  ruleCode: string;
  severity: "error" | "warning";
  message: string;
  scope: string;
}

export interface ResolvedOption {
  id: string;
  code: string;
  label: string;
  inputType: string;
  isRequired: boolean;
  unitOfMeasure?: string | null;
  helpText?: string | null;
  config: Record<string, unknown>;
  choices: Array<{ value: string; label: string; isActive: boolean }>;
  currentValue?: string;
  isVisible: boolean;
}

export interface ResolvedSection {
  unitSectionId: string;
  sectionDefId: string;
  code: string;
  label: string;
  category: string;
  position: number;
  options: ResolvedOption[];
}

export interface ValidatedUnitConfiguration {
  unitId: string;
  sections: ResolvedSection[];
  validationResults: ValidationResult[];
  hasErrors: boolean;
  hasWarnings: boolean;
}
