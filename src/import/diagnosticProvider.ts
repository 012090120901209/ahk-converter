import * as vscode from 'vscode';
import { SymbolIndex } from './symbolIndex';
import { ImportParser, ImportStatement } from './importParser';
import { ModuleResolver } from './moduleResolver';

/**
 * Provides diagnostics for import statements
 */
export class ImportDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor(
    private symbolIndex: SymbolIndex,
    private moduleResolver: ModuleResolver
  ) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ahk-imports');
  }

  /**
   * Validate imports in a document
   */
  public async validateDocument(document: vscode.TextDocument): Promise<void> {
    if (document.languageId !== 'ahk' && document.languageId !== 'ahk2') {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    // Parse imports
    const imports = ImportParser.parseImports(document);

    // Validate each import
    for (const importStmt of imports) {
      diagnostics.push(...await this.validateImport(importStmt, document));
    }

    // Check for unused imports
    const unusedImports = await this.symbolIndex.getUnusedImports(document);
    for (const unusedImport of unusedImports) {
      const range = new vscode.Range(
        unusedImport.line, unusedImport.startCol,
        unusedImport.line, unusedImport.endCol
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        `Unused import: ${unusedImport.moduleName}`,
        vscode.DiagnosticSeverity.Hint
      );

      diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
      diagnostic.code = 'unused-import';
      diagnostics.push(diagnostic);
    }

    // Check for circular dependencies
    const moduleResolver = ModuleResolver.getInstance();
    const moduleName = moduleResolver.getModuleName(document.uri.fsPath);
    const cycles = this.symbolIndex.detectCircularDependencies(moduleName);

    if (cycles.length > 0) {
      for (const cycle of cycles) {
        const cycleStr = cycle.join(' → ');
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `Circular dependency detected: ${cycleStr}`,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'circular-dependency';
        diagnostics.push(diagnostic);
      }
    }

    // Check for symbol conflicts
    diagnostics.push(...await this.checkSymbolConflicts(document, imports));

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Validate a single import statement
   */
  private async validateImport(
    importStmt: ImportStatement,
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    // Check if module exists
    const resolvedPath = this.moduleResolver.resolveModule(
      importStmt.moduleName,
      document.uri.fsPath
    );

    if (!resolvedPath) {
      const diagnostic = new vscode.Diagnostic(
        importStmt.moduleNameRange,
        `Module '${importStmt.moduleName}' not found`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.code = 'module-not-found';
      diagnostics.push(diagnostic);
      return diagnostics;
    }

    // For named imports, validate that symbols exist in the module
    if (importStmt.type === 'named') {
      for (const symbol of importStmt.symbols) {
        const isExported = this.symbolIndex.isSymbolExportedBy(
          symbol.name,
          importStmt.moduleName
        );

        if (!isExported) {
          const diagnostic = new vscode.Diagnostic(
            symbol.range,
            `'${symbol.name}' is not exported by module '${importStmt.moduleName}'`,
            vscode.DiagnosticSeverity.Error
          );
          diagnostic.code = 'symbol-not-exported';
          diagnostics.push(diagnostic);
        }
      }
    }

    return diagnostics;
  }

  /**
   * Check for symbol naming conflicts
   */
  private async checkSymbolConflicts(
    document: vscode.TextDocument,
    imports: ImportStatement[]
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const symbolNames = new Map<string, ImportStatement[]>();

    // Collect all imported symbol names
    for (const importStmt of imports) {
      if (importStmt.type === 'named') {
        for (const symbol of importStmt.symbols) {
          const name = symbol.alias || symbol.name;
          if (!symbolNames.has(name)) {
            symbolNames.set(name, []);
          }
          symbolNames.get(name)!.push(importStmt);
        }
      }
    }

    // Check for conflicts
    for (const [name, importStmts] of symbolNames.entries()) {
      if (importStmts.length > 1) {
        // Multiple imports with the same name
        for (const importStmt of importStmts) {
          const symbol = importStmt.symbols.find(
            s => (s.alias || s.name) === name
          );
          if (symbol) {
            const diagnostic = new vscode.Diagnostic(
              symbol.range,
              `Symbol '${name}' is imported multiple times`,
              vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = 'duplicate-import';
            diagnostics.push(diagnostic);
          }
        }
      }
    }

    // Check for conflicts with local declarations
    diagnostics.push(...await this.checkLocalDeclarationConflicts(document, imports));

    return diagnostics;
  }

  /**
   * Check for conflicts between imports and local declarations
   */
  private async checkLocalDeclarationConflicts(
    document: vscode.TextDocument,
    imports: ImportStatement[]
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    // Get all imported symbol names
    const importedSymbols = new Set<string>();
    for (const importStmt of imports) {
      if (importStmt.type === 'named') {
        for (const symbol of importStmt.symbols) {
          importedSymbols.add(symbol.alias || symbol.name);
        }
      }
    }

    // Check for local declarations with same names
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip import lines
      if (line.startsWith('import')) continue;

      // Check for function declarations
      const funcMatch = line.match(/^(\w+)\s*\(/);
      if (funcMatch && importedSymbols.has(funcMatch[1])) {
        const range = new vscode.Range(i, 0, i, line.length);
        const diagnostic = new vscode.Diagnostic(
          range,
          `Function '${funcMatch[1]}' shadows imported symbol`,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'symbol-shadowing';
        diagnostics.push(diagnostic);
      }

      // Check for class declarations
      const classMatch = line.match(/^class\s+(\w+)/i);
      if (classMatch && importedSymbols.has(classMatch[1])) {
        const range = new vscode.Range(i, 0, i, line.length);
        const diagnostic = new vscode.Diagnostic(
          range,
          `Class '${classMatch[1]}' shadows imported symbol`,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'symbol-shadowing';
        diagnostics.push(diagnostic);
      }

      // Check for global variable declarations
      const globalVarMatch = line.match(/^global\s+(\w+)/);
      if (globalVarMatch && importedSymbols.has(globalVarMatch[1])) {
        const range = new vscode.Range(i, 0, i, line.length);
        const diagnostic = new vscode.Diagnostic(
          range,
          `Global variable '${globalVarMatch[1]}' shadows imported symbol`,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = 'symbol-shadowing';
        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  /**
   * Clear diagnostics for a document
   */
  public clearDiagnostics(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * Clear all diagnostics
   */
  public clearAll(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
