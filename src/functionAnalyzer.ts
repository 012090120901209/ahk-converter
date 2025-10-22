import * as vscode from 'vscode';
import { FunctionMetadata, Parameter, VariableInfo, DefaultValueType, VariableScope, VariableAttribute } from './models/functionMetadata';

export class FunctionAnalyzer {
  // Enhanced regex for function declarations with optional return type
  private static functionRegex = /^(\w+)\s*\(([^)]*)\)\s*(?:=>\s*(\w+))?\s*{/;

  // Variable declaration patterns
  private static variableRegex = /^(static|local|global)?\s*(\w+)\s*(?::=\s*(.+))?$/;

  // Assignment chain pattern (d := e := f := 0)
  private static chainAssignmentRegex = /^(\w+)\s*:=\s*(.+)$/;

  static extractFunctionMetadata(document: vscode.TextDocument): FunctionMetadata[] {
    const metadata: FunctionMetadata[] = [];
    const lines = document.getText().split('\n');
    let currentFunction: Partial<FunctionMetadata> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments
      if (line.startsWith(';') || line.startsWith('/*')) continue;

      // Check for function start
      const functionMatch = line.match(this.functionRegex);
      if (functionMatch) {
        // Finish previous function if exists
        if (currentFunction) {
          metadata.push(currentFunction as FunctionMetadata);
        }

        // Start new function
        const [, name, paramsStr, returnType] = functionMatch;
        const params = this.parseParameters(paramsStr);
        const hasVariadic = params.some(p => p.name === '*' || p.name.startsWith('*'));

        currentFunction = {
          name,
          parameters: params,
          staticVariables: [],
          localVariables: [],
          minParams: params.filter(p => !p.hasDefault && !p.isOptional).length,
          maxParams: hasVariadic ? 'variadic' : params.length,
          isVariadic: hasVariadic,
          returnType: returnType || undefined,
          location: {
            startLine: i,
            startCharacter: line.indexOf(name),
            endLine: -1,
            endCharacter: -1
          }
        };

        continue;
      }

      // Skip if not in a function
      if (!currentFunction) continue;

      // Check for variable declarations (static keyword)
      if (line.startsWith('static ')) {
        const variables = this.parseVariableDeclaration(line, i, 'static');
        currentFunction.staticVariables?.push(...variables);
        continue;
      }

      // Check for assignment chains (local variables)
      const chainMatch = line.match(this.chainAssignmentRegex);
      if (chainMatch && !line.startsWith('static') && !line.startsWith('global')) {
        const variables = this.parseAssignmentChain(line, i);
        currentFunction.localVariables?.push(...variables);
      }

      // Check for function end
      if (line === '}') {
        if (currentFunction && currentFunction.location) {
          currentFunction.location.endLine = i;
          currentFunction.location.endCharacter = line.length;
          metadata.push(currentFunction as FunctionMetadata);
          currentFunction = null;
        }
      }
    }

    // Add last function if not added
    if (currentFunction) {
      metadata.push(currentFunction as FunctionMetadata);
    }

    return metadata;
  }

  private static parseParameters(paramsStr: string): Parameter[] {
    if (!paramsStr.trim()) return [];

    return paramsStr.split(',').map((param, position) => {
      param = param.trim();

      // Check for byref (&)
      const isByRef = param.startsWith('&');
      if (isByRef) param = param.slice(1).trim();

      // Check for variadic (*)
      if (param.startsWith('*')) {
        return {
          name: '*',
          isByRef: false,
          isOptional: false,
          hasDefault: false,
          defaultType: DefaultValueType.None,
          position
        };
      }

      // Check for optional (?)
      let isOptional = false;
      if (param.endsWith('?')) {
        isOptional = true;
        param = param.slice(0, -1).trim();
      }

      // Parse type hint (name: Type or name as Type)
      let typeHint: string | undefined;
      const typeHintMatch = param.match(/^(\w+)\s*(?::|as)\s*(\w+)/);
      if (typeHintMatch) {
        param = typeHintMatch[1];
        typeHint = typeHintMatch[2];
      }

      // Parse default value (name := value)
      const defaultValueMatch = param.match(/^(\w+)\s*:=\s*(.+)$/);
      const name = defaultValueMatch ? defaultValueMatch[1] : param;
      const defaultValue = defaultValueMatch ? defaultValueMatch[2].trim() : undefined;

      // Determine default value type
      const defaultType = defaultValue ? this.detectDefaultValueType(defaultValue) : DefaultValueType.None;

      return {
        name,
        isByRef,
        isOptional,
        hasDefault: !!defaultValue,
        defaultValue,
        defaultType,
        typeHint,
        position
      };
    });
  }

  /**
   * Detect if a default value is a constant or expression
   */
  private static detectDefaultValueType(value: string): DefaultValueType {
    if (!value) return DefaultValueType.None;

    value = value.trim();

    // Check for string literals
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return DefaultValueType.Constant;
    }

    // Check for numeric literals
    if (/^-?\d+(?:\.\d+)?$/.test(value)) {
      return DefaultValueType.Constant;
    }

    // Check for boolean literals
    if (value === 'true' || value === 'false') {
      return DefaultValueType.Constant;
    }

    // Check for empty string
    if (value === '""' || value === "''") {
      return DefaultValueType.Constant;
    }

    // Check for unset
    if (value === 'unset') {
      return DefaultValueType.Constant;
    }

    // Check for arrays/objects
    if ((value.startsWith('[') && value.endsWith(']')) ||
        (value.startsWith('{') && value.endsWith('}'))) {
      // Could be literal or expression - default to expression for safety
      return DefaultValueType.Expression;
    }

    // If it contains function calls, property access, operators, etc.
    if (value.includes('(') || value.includes('.') || value.includes('[') ||
        value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/')) {
      return DefaultValueType.Expression;
    }

    // Simple identifier - likely a constant but could be variable reference
    // Default to expression for safety
    return DefaultValueType.Expression;
  }

  /**
   * Parse variable declarations (static a, b, c)
   */
  private static parseVariableDeclaration(line: string, lineNum: number, scope: 'static' | 'local' | 'global'): VariableInfo[] {
    const variables: VariableInfo[] = [];

    // Remove scope keyword
    line = line.replace(/^(static|local|global)\s+/, '').trim();

    // Split by comma for multiple declarations
    const declarations = line.split(',');

    for (const decl of declarations) {
      const trimmed = decl.trim();
      const assignMatch = trimmed.match(/^(\w+)\s*(?::=\s*(.+))?$/);

      if (assignMatch) {
        const [, name, initializer] = assignMatch;
        variables.push({
          name,
          scope,
          scopeValue: scope === 'static' ? VariableScope.Static :
                     scope === 'global' ? VariableScope.Global :
                     VariableScope.Local,
          declarationLine: lineNum,
          declarationCharacter: line.indexOf(name),
          hasInitializer: !!initializer,
          initializerValue: initializer?.trim(),
          attribute: VariableAttribute.None
        });
      }
    }

    return variables;
  }

  /**
   * Parse assignment chains (d := e := f := 0)
   */
  private static parseAssignmentChain(line: string, lineNum: number): VariableInfo[] {
    const variables: VariableInfo[] = [];

    // Split by := to find all variables in chain
    const parts = line.split(':=').map(p => p.trim());

    // The last part is the value, everything else is a variable
    const value = parts.pop();

    for (const varName of parts) {
      // Extract just the variable name (could have spaces or other chars)
      const cleanName = varName.match(/(\w+)/)?.[1];
      if (cleanName) {
        variables.push({
          name: cleanName,
          scope: 'local',
          scopeValue: VariableScope.Local,
          declarationLine: lineNum,
          declarationCharacter: line.indexOf(cleanName),
          hasInitializer: true,
          initializerValue: value,
          attribute: VariableAttribute.None
        });
      }
    }

    return variables;
  }

  static getFunctionMetadataAtPosition(
    document: vscode.TextDocument, 
    position: vscode.Position
  ): FunctionMetadata | null {
    const metadata = this.extractFunctionMetadata(document);
    return metadata.find(func => 
      position.line >= func.location.startLine && 
      position.line <= func.location.endLine
    ) || null;
  }

  // Utility method for generating diagnostics
  static generateDiagnostics(metadata: FunctionMetadata[]): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    metadata.forEach(func => {
      // Check for duplicate local/static variable names
      const allVariables = [...func.localVariables, ...func.staticVariables];
      const uniqueVariables = new Set();

      allVariables.forEach(variable => {
        if (uniqueVariables.has(variable.name)) {
          const range = new vscode.Range(
            new vscode.Position(variable.declarationLine, variable.declarationCharacter),
            new vscode.Position(variable.declarationLine, variable.declarationCharacter + variable.name.length)
          );
          diagnostics.push({
            severity: vscode.DiagnosticSeverity.Warning,
            range,
            message: `Duplicate variable name: ${variable.name}`,
            source: 'AHK Function Analyzer'
          });
        }
        uniqueVariables.add(variable.name);
      });

      // Check parameter/variable name conflicts
      func.parameters.forEach(param => {
        if (allVariables.some(v => v.name === param.name)) {
          // We'd need to know the parameter's position to create an accurate range
          diagnostics.push({
            severity: vscode.DiagnosticSeverity.Warning,
            range: new vscode.Range(
              new vscode.Position(func.location.startLine, func.location.startCharacter),
              new vscode.Position(func.location.startLine, func.location.startCharacter + func.name.length)
            ),
            message: `Parameter '${param.name}' conflicts with a local or static variable`,
            source: 'AHK Function Analyzer'
          });
        }
      });
    });

    return diagnostics;
  }
}