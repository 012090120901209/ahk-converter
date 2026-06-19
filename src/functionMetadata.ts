// Function Metadata Types for AHK Script Introspection

export interface Parameter {
  name: string;
  isByRef: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  position: number;
}

export interface VariableInfo {
  name: string;
  scope: 'static' | 'local' | 'global';
  type?: string;
  declarationLine: number;
  declarationCharacter: number;
}

export interface FunctionMetadata {
  name: string;
  parameters: Parameter[];
  staticVariables: VariableInfo[];
  localVariables: VariableInfo[];
  minParams: number;
  maxParams: number | 'variadic';
  location: {
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  };
  documentation?: string;
  version?: number;
}