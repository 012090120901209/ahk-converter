import * as vscode from 'vscode';
import { FunctionMetadata, Parameter, VariableInfo } from './models/functionMetadata';

export class FunctionAnalyzer {
  private static functionRegex = /^(\w+)\s*\(([^)]*)\)\s*{/;
  private static variableRegex = /^(static|local|global)?\s*(\w+)\s*(?:=\s*(.+))?$/;

  static extractFunctionMetadata(document: vscode.TextDocument): FunctionMetadata[] {
    const metadata: FunctionMetadata[] = [];
    const lines = document.getText().split('\n');
    let currentFunction: Partial<FunctionMetadata> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for function start
      const functionMatch = line.match(this.functionRegex);
      if (functionMatch) {
        // Finish previous function if exists
        if (currentFunction) {
          metadata.push(currentFunction as FunctionMetadata);
        }

        // Start new function
        const [, name, paramsStr] = functionMatch;
        const params = this.parseParameters(paramsStr);

        currentFunction = {
          name,
          parameters: params,
          staticVariables: [],
          localVariables: [],
          minParams: params.filter(p => !p.hasDefault).length,
          maxParams: params.length,
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

      // Check for variable declarations
      const variableMatch = line.match(this.variableRegex);
      if (variableMatch) {
        const [, scopeStr, name, defaultValue] = variableMatch;
        const scope = (scopeStr || 'local') as 'static' | 'local' | 'global';
        const variableInfo: VariableInfo = {
          name,
          scope,
          declarationLine: i,
          declarationCharacter: line.indexOf(name),
          type: typeof defaultValue
        };

        if (scope === 'static') {
          currentFunction.staticVariables?.push(variableInfo);
        } else if (scope === 'local') {
          currentFunction.localVariables?.push(variableInfo);
        }
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
      const isByRef = param.startsWith('&');
      if (isByRef) param = param.slice(1).trim();

      const defaultValueMatch = param.match(/(\w+)\s*=\s*(.+)/);
      const name = defaultValueMatch ? defaultValueMatch[1] : param;
      const defaultValue = defaultValueMatch ? defaultValueMatch[2] : undefined;

      return {
        name,
        isByRef,
        hasDefault: !!defaultValue,
        defaultValue,
        position
      };
    });
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