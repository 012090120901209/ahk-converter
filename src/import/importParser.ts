import * as vscode from 'vscode';

/**
 * Represents an import statement in AHK v2
 */
export interface ImportStatement {
  /** Line number of the import statement */
  line: number;
  /** Column where the import starts */
  startCol: number;
  /** Column where the import ends */
  endCol: number;
  /** Type of import */
  type: ImportType;
  /** Module name being imported */
  moduleName: string;
  /** Module name range in document */
  moduleNameRange: vscode.Range;
  /** Imported symbols (for named imports) */
  symbols: ImportedSymbol[];
  /** Whether this is a wildcard import (import * from Module) */
  isWildcard: boolean;
  /** The full text of the import statement */
  text: string;
}

export enum ImportType {
  /** import Module */
  Default = 'default',
  /** import {Symbol} from Module */
  Named = 'named',
  /** import * from Module */
  Wildcard = 'wildcard',
}

export interface ImportedSymbol {
  /** Symbol name in the module */
  name: string;
  /** Alias (if using 'as' clause) */
  alias?: string;
  /** Range of the symbol name */
  range: vscode.Range;
  /** Range of the alias (if present) */
  aliasRange?: vscode.Range;
}

/**
 * Represents an export statement in AHK v2
 */
export interface ExportStatement {
  /** Line number of the export */
  line: number;
  /** Symbol being exported */
  symbolName: string;
  /** Symbol type (function, class, variable) */
  symbolType: ExportSymbolType;
  /** Range of the symbol */
  range: vscode.Range;
}

export enum ExportSymbolType {
  Function = 'function',
  Class = 'class',
  Variable = 'variable',
}

/**
 * Parses AutoHotkey v2 import and export statements
 */
export class ImportParser {
  /**
   * Parse all import statements in a document
   */
  public static parseImports(document: vscode.TextDocument): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments and non-import lines
      if (!trimmed.startsWith('import ')) continue;

      const importStmt = this.parseImportStatement(line, i, document);
      if (importStmt) {
        imports.push(importStmt);
      }
    }

    return imports;
  }

  /**
   * Parse a single import statement
   * Handles:
   * - import Module
   * - import {Symbol} from Module
   * - import {Symbol as Alias} from Module
   * - import {Symbol1, Symbol2} from Module
   * - import * from Module
   */
  private static parseImportStatement(
    line: string,
    lineNum: number,
    document: vscode.TextDocument
  ): ImportStatement | null {
    const trimmed = line.trim();
    const startCol = line.indexOf('import');

    // Pattern 1: import Module
    const defaultImportMatch = trimmed.match(/^import\s+([^\s{*;]+)/);
    if (defaultImportMatch && !trimmed.includes('{') && !trimmed.includes('*')) {
      const moduleName = defaultImportMatch[1].replace(/^["']|["']$/g, '');
      const moduleStartCol = startCol + trimmed.indexOf(defaultImportMatch[1]);

      return {
        line: lineNum,
        startCol,
        endCol: startCol + trimmed.length,
        type: ImportType.Default,
        moduleName,
        moduleNameRange: new vscode.Range(
          lineNum, moduleStartCol,
          lineNum, moduleStartCol + moduleName.length
        ),
        symbols: [],
        isWildcard: false,
        text: trimmed
      };
    }

    // Pattern 2: import * from Module
    const wildcardMatch = trimmed.match(/^import\s+\*\s+from\s+([^\s;]+)/);
    if (wildcardMatch) {
      const moduleName = wildcardMatch[1].replace(/^["']|["']$/g, '');
      const moduleStartCol = startCol + trimmed.indexOf(moduleName);

      return {
        line: lineNum,
        startCol,
        endCol: startCol + trimmed.length,
        type: ImportType.Wildcard,
        moduleName,
        moduleNameRange: new vscode.Range(
          lineNum, moduleStartCol,
          lineNum, moduleStartCol + moduleName.length
        ),
        symbols: [],
        isWildcard: true,
        text: trimmed
      };
    }

    // Pattern 3: import {Symbol, ...} from Module
    const namedImportMatch = trimmed.match(/^import\s+\{([^}]+)\}\s+from\s+([^\s;]+)/);
    if (namedImportMatch) {
      const symbolsStr = namedImportMatch[1];
      const moduleName = namedImportMatch[2].replace(/^["']|["']$/g, '');
      const moduleStartCol = startCol + trimmed.indexOf(moduleName);

      const symbols = this.parseImportedSymbols(
        symbolsStr,
        lineNum,
        startCol + trimmed.indexOf('{') + 1
      );

      return {
        line: lineNum,
        startCol,
        endCol: startCol + trimmed.length,
        type: ImportType.Named,
        moduleName,
        moduleNameRange: new vscode.Range(
          lineNum, moduleStartCol,
          lineNum, moduleStartCol + moduleName.length
        ),
        symbols,
        isWildcard: false,
        text: trimmed
      };
    }

    return null;
  }

  /**
   * Parse symbols in a named import
   * Handles: Symbol, Symbol as Alias, Symbol1, Symbol2, etc.
   */
  private static parseImportedSymbols(
    symbolsStr: string,
    lineNum: number,
    startCol: number
  ): ImportedSymbol[] {
    const symbols: ImportedSymbol[] = [];
    const parts = symbolsStr.split(',').map(s => s.trim());

    let currentCol = startCol;

    for (const part of parts) {
      // Skip empty parts
      if (!part) continue;

      // Check for 'as' clause
      const asMatch = part.match(/^(\w+)\s+as\s+(\w+)$/);
      if (asMatch) {
        const [, name, alias] = asMatch;
        const nameStartCol = currentCol + part.indexOf(name);
        const aliasStartCol = currentCol + part.indexOf(alias);

        symbols.push({
          name,
          alias,
          range: new vscode.Range(
            lineNum, nameStartCol,
            lineNum, nameStartCol + name.length
          ),
          aliasRange: new vscode.Range(
            lineNum, aliasStartCol,
            lineNum, aliasStartCol + alias.length
          )
        });
      } else {
        // Simple symbol import
        const name = part.trim();
        const nameStartCol = currentCol + part.indexOf(name);

        symbols.push({
          name,
          range: new vscode.Range(
            lineNum, nameStartCol,
            lineNum, nameStartCol + name.length
          )
        });
      }

      currentCol += part.length + 1; // +1 for comma
    }

    return symbols;
  }

  /**
   * Parse exports in a module document
   * In AHK v2, exports are implicit - any class or function at module scope
   */
  public static parseExports(document: vscode.TextDocument): ExportStatement[] {
    const exports: ExportStatement[] = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    let inClassOrFunction = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith(';') || trimmed.startsWith('/*')) continue;

      // Track brace depth to know when we're at module scope
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // Only look for exports at module scope (braceDepth === 0 after the line)
      if (braceDepth > 0) {
        inClassOrFunction = true;
        continue;
      } else {
        inClassOrFunction = false;
      }

      // Function declaration: FunctionName(params) {
      const funcMatch = trimmed.match(/^(\w+)\s*\([^)]*\)\s*(?:=>\s*\w+)?\s*\{/);
      if (funcMatch && !inClassOrFunction) {
        const funcName = funcMatch[1];
        const startCol = line.indexOf(funcName);

        exports.push({
          line: i,
          symbolName: funcName,
          symbolType: ExportSymbolType.Function,
          range: new vscode.Range(
            i, startCol,
            i, startCol + funcName.length
          )
        });
      }

      // Class declaration: class ClassName {
      const classMatch = trimmed.match(/^class\s+(\w+)/i);
      if (classMatch && !inClassOrFunction) {
        const className = classMatch[1];
        const startCol = line.indexOf(className);

        exports.push({
          line: i,
          symbolName: className,
          symbolType: ExportSymbolType.Class,
          range: new vscode.Range(
            i, startCol,
            i, startCol + className.length
          )
        });
      }

      // Global variable declaration at module scope
      const globalVarMatch = trimmed.match(/^global\s+(\w+)/);
      if (globalVarMatch && !inClassOrFunction) {
        const varName = globalVarMatch[1];
        const startCol = line.indexOf(varName);

        exports.push({
          line: i,
          symbolName: varName,
          symbolType: ExportSymbolType.Variable,
          range: new vscode.Range(
            i, startCol,
            i, startCol + varName.length
          )
        });
      }
    }

    return exports;
  }

  /**
   * Get the import statement at a specific position
   */
  public static getImportAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): ImportStatement | null {
    const imports = this.parseImports(document);

    for (const importStmt of imports) {
      if (importStmt.line === position.line) {
        return importStmt;
      }
    }

    return null;
  }

  /**
   * Find all references to a module in a document
   */
  public static findModuleReferences(
    document: vscode.TextDocument,
    moduleName: string
  ): vscode.Location[] {
    const imports = this.parseImports(document);
    const references: vscode.Location[] = [];

    for (const importStmt of imports) {
      if (importStmt.moduleName === moduleName) {
        references.push(
          new vscode.Location(document.uri, importStmt.moduleNameRange)
        );
      }
    }

    return references;
  }

  /**
   * Find all references to an imported symbol in a document
   */
  public static findSymbolReferences(
    document: vscode.TextDocument,
    symbolName: string
  ): vscode.Location[] {
    const references: vscode.Location[] = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    // Use word boundary regex to find symbol usages
    const symbolRegex = new RegExp(`\\b${symbolName}\\b`, 'g');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = symbolRegex.exec(line)) !== null) {
        const range = new vscode.Range(
          i, match.index,
          i, match.index + symbolName.length
        );
        references.push(new vscode.Location(document.uri, range));
      }
    }

    return references;
  }
}
