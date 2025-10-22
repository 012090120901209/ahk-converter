// Function Metadata Data Transfer Objects

/**
 * Type of default parameter value
 */
export enum DefaultValueType {
  None = 0,           // No default value
  Constant = 1,       // Literal value: "string", 123, true
  Expression = 2,     // Expression: Random(1, 6), obj.prop
  Unresolvable = 3    // Cannot determine (e.g., from runtime introspection)
}

/**
 * Parameter metadata with enhanced type information
 */
export interface Parameter {
  name: string;
  isByRef: boolean;
  isOptional: boolean;        // Has ? suffix (v2.1+)
  hasDefault: boolean;
  defaultValue?: string;
  defaultType: DefaultValueType;
  typeHint?: string;          // Type hint if present (v2.1+)
  position: number;
}

/**
 * Variable scope types matching AHK internal representation
 */
export enum VariableScope {
  Local = 0,
  Static = 1,
  Global = 2,
  BuiltIn = 3,
  Assume = 4
}

/**
 * Variable attributes
 */
export enum VariableAttribute {
  None = 0,
  Constant = 1,
  ReadOnly = 2
}

/**
 * Enhanced variable information
 */
export interface VariableInfo {
  name: string;
  scope: 'static' | 'local' | 'global';
  scopeValue?: VariableScope;   // Numeric scope value
  type?: string;                 // Inferred or declared type
  typeValue?: number;            // Internal type representation
  attribute?: VariableAttribute; // Variable attributes
  size?: number;                 // Memory size if applicable
  declarationLine: number;
  declarationCharacter: number;
  hasInitializer: boolean;       // Whether variable has initial value
  initializerValue?: string;     // The initializer expression
}

/**
 * Complete function metadata
 */
export interface FunctionMetadata {
  name: string;
  parameters: Parameter[];
  staticVariables: VariableInfo[];
  localVariables: VariableInfo[];
  minParams: number;
  maxParams: number | 'variadic';
  isVariadic: boolean;           // Has * param
  location: {
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  };
  documentation?: string;
  version?: number;
  returnType?: string;           // Return type hint if present (v2.1+)
}