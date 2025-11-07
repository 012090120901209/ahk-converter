import * as vscode from 'vscode';
import { SymbolIndex } from './symbolIndex';
import { ModuleResolver } from './moduleResolver';
import { ImportParser } from './importParser';

/**
 * Provides IntelliSense completion for import statements
 */
export class ImportCompletionProvider implements vscode.CompletionItemProvider {
  constructor(
    private symbolIndex: SymbolIndex,
    private moduleResolver: ModuleResolver
  ) {}

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | undefined> {
    const line = document.lineAt(position.line).text;
    const linePrefix = line.substring(0, position.character);

    // Check if we're in an import statement
    if (!linePrefix.trim().startsWith('import')) {
      return undefined;
    }

    // Case 1: After "import {" - suggest exported symbols
    if (this.isInNamedImport(linePrefix)) {
      return this.provideSymbolCompletions(document, linePrefix);
    }

    // Case 2: After "import" or "from" - suggest module names
    if (this.shouldSuggestModules(linePrefix)) {
      return this.provideModuleCompletions(document);
    }

    return undefined;
  }

  /**
   * Check if cursor is inside a named import block: import {|}
   */
  private isInNamedImport(linePrefix: string): boolean {
    const openBraceCount = (linePrefix.match(/\{/g) || []).length;
    const closeBraceCount = (linePrefix.match(/\}/g) || []).length;
    return openBraceCount > closeBraceCount;
  }

  /**
   * Check if we should suggest module names
   */
  private shouldSuggestModules(linePrefix: string): boolean {
    const trimmed = linePrefix.trim();
    return (
      trimmed === 'import' ||
      trimmed === 'import ' ||
      trimmed.endsWith(' from') ||
      trimmed.endsWith(' from ')
    );
  }

  /**
   * Provide module name completions
   */
  private async provideModuleCompletions(
    document: vscode.TextDocument
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    // Get module candidates from file system
    const candidates = this.moduleResolver.getModuleCandidates(document.uri.fsPath);

    for (const moduleName of candidates) {
      const item = new vscode.CompletionItem(moduleName, vscode.CompletionItemKind.Module);

      // Get module exports for documentation
      const exports = this.symbolIndex.getModuleExports(moduleName);
      if (exports.length > 0) {
        const exportNames = exports.map(e => `  • ${e.name} (${e.type})`).join('\n');
        item.documentation = new vscode.MarkdownString(
          `**Module: ${moduleName}**\n\nExports:\n${exportNames}`
        );
      } else {
        item.documentation = new vscode.MarkdownString(`**Module: ${moduleName}**`);
      }

      item.detail = 'AHK Module';
      item.sortText = `0_${moduleName}`;
      items.push(item);
    }

    return items;
  }

  /**
   * Provide symbol completions for named imports
   */
  private async provideSymbolCompletions(
    document: vscode.TextDocument,
    linePrefix: string
  ): Promise<vscode.CompletionItem[]> {
    const items: vscode.CompletionItem[] = [];

    // Extract module name from the import statement
    const moduleName = this.extractModuleNameFromImport(linePrefix);
    if (!moduleName) {
      // If we can't determine the module, show all symbols
      return this.provideAllSymbolCompletions();
    }

    // Get exports from the specific module
    const exports = this.symbolIndex.getModuleExports(moduleName);

    for (const symbol of exports) {
      const kind = this.getCompletionKind(symbol.type);
      const item = new vscode.CompletionItem(symbol.name, kind);

      item.detail = `${symbol.type} from ${moduleName}`;
      item.documentation = new vscode.MarkdownString(
        `Export from module \`${moduleName}\``
      );

      // Add snippet for alias
      item.insertText = new vscode.SnippetString(
        `${symbol.name}\${1: as \${2:${symbol.name}}}`
      );

      item.sortText = `0_${symbol.name}`;
      items.push(item);
    }

    return items;
  }

  /**
   * Provide all available symbols (when module is not determined)
   */
  private provideAllSymbolCompletions(): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const allSymbols = this.symbolIndex.getAllSymbolNames();

    for (const symbolName of allSymbols) {
      const symbols = this.symbolIndex.getSymbolsByName(symbolName);

      // If symbol is exported by multiple modules, show all
      for (const symbol of symbols) {
        const kind = this.getCompletionKind(symbol.type);
        const item = new vscode.CompletionItem(symbol.name, kind);

        item.detail = `${symbol.type} from ${symbol.moduleName}`;
        item.documentation = new vscode.MarkdownString(
          `Export from module \`${symbol.moduleName}\``
        );

        item.insertText = new vscode.SnippetString(
          `${symbol.name}\${1: as \${2:${symbol.name}}}`
        );

        item.sortText = `1_${symbol.name}`;
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Extract module name from import statement
   */
  private extractModuleNameFromImport(linePrefix: string): string | null {
    // Match pattern: import {symbol, ...} from ModuleName
    const match = linePrefix.match(/import\s+\{[^}]*\}\s+from\s+([^\s{]+)/);
    if (match) {
      return match[1].replace(/^["']|["']$/g, '');
    }

    return null;
  }

  /**
   * Get VS Code completion kind from symbol type
   */
  private getCompletionKind(type: string): vscode.CompletionItemKind {
    switch (type) {
      case 'function':
        return vscode.CompletionItemKind.Function;
      case 'class':
        return vscode.CompletionItemKind.Class;
      case 'variable':
        return vscode.CompletionItemKind.Variable;
      default:
        return vscode.CompletionItemKind.Text;
    }
  }

  /**
   * Provide completion for dot notation access (Module.Symbol)
   */
  public async provideMemberCompletions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const line = document.lineAt(position.line).text;
    const linePrefix = line.substring(0, position.character);

    // Match pattern: ModuleName.
    const match = linePrefix.match(/(\w+)\.$/);
    if (!match) {
      return [];
    }

    const moduleName = match[1];

    // Check if this is an imported module
    const imports = ImportParser.parseImports(document);
    const isImported = imports.some(
      imp => imp.moduleName === moduleName && imp.type === 'default'
    );

    if (!isImported) {
      return [];
    }

    // Provide completions for module exports
    const exports = this.symbolIndex.getModuleExports(moduleName);
    const items: vscode.CompletionItem[] = [];

    for (const symbol of exports) {
      const kind = this.getCompletionKind(symbol.type);
      const item = new vscode.CompletionItem(symbol.name, kind);

      item.detail = `${symbol.type} from ${moduleName}`;
      item.documentation = new vscode.MarkdownString(
        `Export from module \`${moduleName}\``
      );

      items.push(item);
    }

    return items;
  }

  /**
   * Resolve additional information for a completion item
   */
  public async resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem> {
    // Could fetch additional details like function signatures here
    return item;
  }
}
