import * as vscode from 'vscode';
import { SymbolIndex, SymbolInfo } from './symbolIndex';
import { ImportParser } from './importParser';
import { ModuleResolver } from './moduleResolver';

/**
 * Provides hover information for imported symbols and modules
 */
export class ImportHoverProvider implements vscode.HoverProvider {
  constructor(
    private symbolIndex: SymbolIndex,
    private moduleResolver: ModuleResolver
  ) {}

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const line = document.lineAt(position.line).text;

    // Check if we're hovering over an import statement
    if (line.trim().startsWith('import')) {
      return this.provideImportHover(document, position, word, wordRange);
    }

    // Check if we're hovering over an imported symbol in code
    return this.provideSymbolHover(document, position, word, wordRange);
  }

  /**
   * Provide hover for import statements
   */
  private async provideImportHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    wordRange: vscode.Range
  ): Promise<vscode.Hover | undefined> {
    const importStmt = ImportParser.getImportAtPosition(document, position);
    if (!importStmt) {
      return undefined;
    }

    // Check if hovering over module name
    if (importStmt.moduleNameRange.contains(position)) {
      return this.provideModuleHover(importStmt.moduleName, wordRange);
    }

    // Check if hovering over imported symbol
    for (const symbol of importStmt.symbols) {
      if (symbol.range.contains(position)) {
        return this.provideImportedSymbolHover(
          symbol.name,
          importStmt.moduleName,
          wordRange
        );
      }

      // Check alias
      if (symbol.aliasRange && symbol.aliasRange.contains(position)) {
        return this.provideAliasHover(
          symbol.name,
          symbol.alias!,
          importStmt.moduleName,
          wordRange
        );
      }
    }

    return undefined;
  }

  /**
   * Provide hover information for a module
   */
  private async provideModuleHover(
    moduleName: string,
    range: vscode.Range
  ): Promise<vscode.Hover | undefined> {
    const moduleInfo = this.symbolIndex.getModuleByName(moduleName);

    if (!moduleInfo) {
      return new vscode.Hover(
        new vscode.MarkdownString(`⚠️ Module \`${moduleName}\` not found`),
        range
      );
    }

    const exports = this.symbolIndex.getModuleExports(moduleName);
    const md = new vscode.MarkdownString();

    md.appendMarkdown(`### Module: \`${moduleName}\`\n\n`);
    md.appendMarkdown(`**Location:** ${moduleInfo.uri.fsPath}\n\n`);

    if (exports.length > 0) {
      md.appendMarkdown(`**Exports (${exports.length}):**\n\n`);
      for (const exp of exports) {
        const icon = this.getSymbolIcon(exp.type);
        md.appendMarkdown(`- ${icon} \`${exp.name}\` (${exp.type})\n`);
      }
    } else {
      md.appendMarkdown(`_No exports found_\n`);
    }

    // Show dependencies
    if (moduleInfo.imports.length > 0) {
      md.appendMarkdown(`\n**Dependencies:**\n\n`);
      const uniqueImports = new Set(moduleInfo.imports.map(i => i.moduleName));
      for (const imp of uniqueImports) {
        md.appendMarkdown(`- \`${imp}\`\n`);
      }
    }

    return new vscode.Hover(md, range);
  }

  /**
   * Provide hover for imported symbol in import statement
   */
  private async provideImportedSymbolHover(
    symbolName: string,
    moduleName: string,
    range: vscode.Range
  ): Promise<vscode.Hover | undefined> {
    const symbols = this.symbolIndex.getSymbolsByName(symbolName);
    const symbolInModule = symbols.find(s => s.moduleName === moduleName);

    if (!symbolInModule) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          `⚠️ Symbol \`${symbolName}\` not found in module \`${moduleName}\``
        ),
        range
      );
    }

    const md = new vscode.MarkdownString();
    const icon = this.getSymbolIcon(symbolInModule.type);

    md.appendMarkdown(`### ${icon} \`${symbolName}\`\n\n`);
    md.appendMarkdown(`**Type:** ${symbolInModule.type}\n\n`);
    md.appendMarkdown(`**Module:** \`${moduleName}\`\n\n`);
    md.appendMarkdown(`**Location:** ${symbolInModule.location.uri.fsPath}:${symbolInModule.location.range.start.line + 1}\n\n`);

    // Try to get more details from the symbol definition
    const details = await this.getSymbolDetails(symbolInModule);
    if (details) {
      md.appendMarkdown(`\n${details}\n`);
    }

    return new vscode.Hover(md, range);
  }

  /**
   * Provide hover for alias in import statement
   */
  private async provideAliasHover(
    originalName: string,
    alias: string,
    moduleName: string,
    range: vscode.Range
  ): Promise<vscode.Hover | undefined> {
    const md = new vscode.MarkdownString();

    md.appendMarkdown(`### Alias: \`${alias}\`\n\n`);
    md.appendMarkdown(`**Original name:** \`${originalName}\`\n\n`);
    md.appendMarkdown(`**Module:** \`${moduleName}\`\n\n`);
    md.appendMarkdown(`This alias allows you to use \`${alias}\` instead of \`${originalName}\` in your code.`);

    return new vscode.Hover(md, range);
  }

  /**
   * Provide hover for symbols used in code
   */
  private async provideSymbolHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    wordRange: vscode.Range
  ): Promise<vscode.Hover | undefined> {
    // Check if this symbol is imported
    const imports = ImportParser.parseImports(document);

    for (const importStmt of imports) {
      // Check named imports
      for (const symbol of importStmt.symbols) {
        const symbolName = symbol.alias || symbol.name;
        if (symbolName === word) {
          return this.provideImportedSymbolHover(
            symbol.name,
            importStmt.moduleName,
            wordRange
          );
        }
      }

      // Check wildcard imports
      if (importStmt.isWildcard) {
        const symbols = this.symbolIndex.getModuleExports(importStmt.moduleName);
        if (symbols.some(s => s.name === word)) {
          return this.provideImportedSymbolHover(
            word,
            importStmt.moduleName,
            wordRange
          );
        }
      }
    }

    return undefined;
  }

  /**
   * Get icon for symbol type
   */
  private getSymbolIcon(type: string): string {
    switch (type) {
      case 'function':
        return '🔧';
      case 'class':
        return '📦';
      case 'variable':
        return '📌';
      default:
        return '•';
    }
  }

  /**
   * Get additional details about a symbol from its definition
   */
  private async getSymbolDetails(symbol: SymbolInfo): Promise<string | undefined> {
    try {
      const document = await vscode.workspace.openTextDocument(symbol.location.uri);
      const line = document.lineAt(symbol.location.range.start.line);
      const text = line.text.trim();

      // Return the definition line
      if (text) {
        return `\`\`\`ahk\n${text}\n\`\`\``;
      }
    } catch (error) {
      console.error('Failed to get symbol details:', error);
    }

    return undefined;
  }
}
