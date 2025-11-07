import * as vscode from 'vscode';
import { SymbolIndex } from './symbolIndex';
import { ImportParser, ImportType } from './importParser';
import { ModuleResolver } from './moduleResolver';

/**
 * Provides code actions for import statements
 */
export class ImportCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.RefactorRewrite,
    vscode.CodeActionKind.Source,
  ];

  constructor(
    private symbolIndex: SymbolIndex,
    private moduleResolver: ModuleResolver
  ) {}

  public async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // Quick fixes for diagnostics
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.code === 'module-not-found') {
        // No fix available for missing modules
      } else if (diagnostic.code === 'symbol-not-exported') {
        actions.push(...this.createSymbolNotExportedFix(document, diagnostic));
      } else if (diagnostic.code === 'unused-import') {
        actions.push(...this.createRemoveUnusedImportFix(document, diagnostic));
      } else if (diagnostic.code === 'duplicate-import') {
        actions.push(...this.createRemoveDuplicateFix(document, diagnostic));
      }
    }

    // Code actions for organizing imports
    if (this.hasImports(document)) {
      actions.push(this.createOrganizeImportsAction(document));
      actions.push(this.createSortImportsAction(document));
    }

    // Add missing import for undefined symbol
    const wordRange = document.getWordRangeAtPosition(range.start);
    if (wordRange) {
      const word = document.getText(wordRange);
      actions.push(...await this.createAddMissingImportAction(document, word, wordRange));
    }

    // Convert import style actions
    const line = document.lineAt(range.start.line).text;
    if (line.trim().startsWith('import')) {
      actions.push(...this.createConvertImportStyleActions(document, range.start.line));
    }

    return actions;
  }

  /**
   * Create action to remove symbol that's not exported
   */
  private createSymbolNotExportedFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction[] {
    const action = new vscode.CodeAction(
      'Remove undefined symbol from import',
      vscode.CodeActionKind.QuickFix
    );

    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();

    // Get the import statement and remove the problematic symbol
    const imports = ImportParser.parseImports(document);
    const importStmt = imports.find(i => i.line === diagnostic.range.start.line);

    if (importStmt && importStmt.type === 'named') {
      const line = document.lineAt(importStmt.line);
      const symbolToRemove = importStmt.symbols.find(s =>
        s.range.isEqual(diagnostic.range) || s.range.contains(diagnostic.range)
      );

      if (symbolToRemove) {
        const newSymbols = importStmt.symbols.filter(s => s !== symbolToRemove);

        if (newSymbols.length === 0) {
          // Remove entire import statement
          action.edit.delete(
            document.uri,
            new vscode.Range(importStmt.line, 0, importStmt.line + 1, 0)
          );
        } else {
          // Rebuild import statement without the symbol
          const symbolsStr = newSymbols
            .map(s => s.alias ? `${s.name} as ${s.alias}` : s.name)
            .join(', ');
          const newImport = `import {${symbolsStr}} from ${importStmt.moduleName}`;
          action.edit.replace(document.uri, line.range, newImport);
        }
      }
    }

    return [action];
  }

  /**
   * Create action to remove unused import
   */
  private createRemoveUnusedImportFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction[] {
    const action = new vscode.CodeAction(
      'Remove unused import',
      vscode.CodeActionKind.QuickFix
    );

    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();

    // Delete the entire import line
    const range = new vscode.Range(
      diagnostic.range.start.line, 0,
      diagnostic.range.start.line + 1, 0
    );
    action.edit.delete(document.uri, range);

    return [action];
  }

  /**
   * Create action to remove duplicate import
   */
  private createRemoveDuplicateFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    const action = new vscode.CodeAction(
      'Remove duplicate import',
      vscode.CodeActionKind.QuickFix
    );

    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();

    // Delete the import line containing the duplicate
    const range = new vscode.Range(
      diagnostic.range.start.line, 0,
      diagnostic.range.start.line + 1, 0
    );
    action.edit.delete(document.uri, range);

    actions.push(action);
    return actions;
  }

  /**
   * Create action to add missing import for symbol
   */
  private async createAddMissingImportAction(
    document: vscode.TextDocument,
    symbolName: string,
    range: vscode.Range
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // Check if symbol is already imported
    const imports = ImportParser.parseImports(document);
    const isAlreadyImported = imports.some(imp =>
      imp.symbols.some(s => s.name === symbolName || s.alias === symbolName) ||
      imp.moduleName === symbolName
    );

    if (isAlreadyImported) {
      return actions;
    }

    // Find modules that export this symbol
    const modules = this.symbolIndex.findModuleExportingSymbol(symbolName);

    for (const moduleName of modules) {
      const action = new vscode.CodeAction(
        `Import '${symbolName}' from '${moduleName}'`,
        vscode.CodeActionKind.QuickFix
      );

      action.edit = new vscode.WorkspaceEdit();

      // Find the best place to insert the import
      const insertPosition = this.findImportInsertPosition(document);

      // Create import statement
      const importStatement = `import {${symbolName}} from ${moduleName}\n`;
      action.edit.insert(document.uri, insertPosition, importStatement);

      actions.push(action);
    }

    return actions;
  }

  /**
   * Find the best position to insert a new import
   */
  private findImportInsertPosition(document: vscode.TextDocument): vscode.Position {
    const imports = ImportParser.parseImports(document);

    if (imports.length > 0) {
      // Insert after the last import
      const lastImport = imports[imports.length - 1];
      return new vscode.Position(lastImport.line + 1, 0);
    }

    // Insert at the beginning, after directives
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip directives and comments
      if (line.startsWith('#') || line.startsWith(';') || line === '') {
        continue;
      }
      return new vscode.Position(i, 0);
    }

    return new vscode.Position(0, 0);
  }

  /**
   * Create action to organize imports
   */
  private createOrganizeImportsAction(document: vscode.TextDocument): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Organize Imports',
      vscode.CodeActionKind.Source
    );

    action.command = {
      title: 'Organize Imports',
      command: 'ahk.organizeImports',
      arguments: [document.uri]
    };

    return action;
  }

  /**
   * Create action to sort imports
   */
  private createSortImportsAction(document: vscode.TextDocument): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Sort Imports',
      vscode.CodeActionKind.Source
    );

    action.edit = new vscode.WorkspaceEdit();

    const imports = ImportParser.parseImports(document);
    if (imports.length === 0) {
      return action;
    }

    // Sort imports by module name
    const sortedImports = [...imports].sort((a, b) =>
      a.moduleName.localeCompare(b.moduleName)
    );

    // Delete old imports
    for (const imp of imports) {
      const range = new vscode.Range(imp.line, 0, imp.line + 1, 0);
      action.edit.delete(document.uri, range);
    }

    // Insert sorted imports
    const insertPos = new vscode.Position(imports[0].line, 0);
    const sortedText = sortedImports.map(imp => imp.text).join('\n') + '\n';
    action.edit.insert(document.uri, insertPos, sortedText);

    return action;
  }

  /**
   * Create actions to convert import styles
   */
  private createConvertImportStyleActions(
    document: vscode.TextDocument,
    lineNum: number
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const imports = ImportParser.parseImports(document);
    const importStmt = imports.find(i => i.line === lineNum);

    if (!importStmt) {
      return actions;
    }

    // Convert named to wildcard
    if (importStmt.type === ImportType.Named) {
      const action = new vscode.CodeAction(
        'Convert to wildcard import',
        vscode.CodeActionKind.RefactorRewrite
      );

      action.edit = new vscode.WorkspaceEdit();
      const line = document.lineAt(lineNum);
      const newImport = `import * from ${importStmt.moduleName}`;
      action.edit.replace(document.uri, line.range, newImport);

      actions.push(action);
    }

    // Convert wildcard to named (if we know the exports)
    if (importStmt.type === ImportType.Wildcard) {
      const exports = this.symbolIndex.getModuleExports(importStmt.moduleName);
      if (exports.length > 0) {
        const action = new vscode.CodeAction(
          'Convert to named imports',
          vscode.CodeActionKind.RefactorRewrite
        );

        action.edit = new vscode.WorkspaceEdit();
        const symbolNames = exports.map(e => e.name).join(', ');
        const line = document.lineAt(lineNum);
        const newImport = `import {${symbolNames}} from ${importStmt.moduleName}`;
        action.edit.replace(document.uri, line.range, newImport);

        actions.push(action);
      }
    }

    return actions;
  }

  /**
   * Check if document has any imports
   */
  private hasImports(document: vscode.TextDocument): boolean {
    const imports = ImportParser.parseImports(document);
    return imports.length > 0;
  }
}
