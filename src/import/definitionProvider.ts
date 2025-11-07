import * as vscode from 'vscode';
import { SymbolIndex } from './symbolIndex';
import { ImportParser } from './importParser';
import { ModuleResolver } from './moduleResolver';

/**
 * Provides 'Go to Definition' for imported symbols and modules
 */
export class ImportDefinitionProvider implements vscode.DefinitionProvider {
  constructor(
    private symbolIndex: SymbolIndex,
    private moduleResolver: ModuleResolver
  ) {}

  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | vscode.LocationLink[] | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const line = document.lineAt(position.line).text;

    // Check if we're in an import statement
    if (line.trim().startsWith('import')) {
      return this.provideImportDefinition(document, position, word);
    }

    // Check if this is a symbol usage in code
    return this.provideSymbolDefinition(document, position, word);
  }

  /**
   * Provide definition for import statement
   */
  private async provideImportDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string
  ): Promise<vscode.Definition | vscode.LocationLink[] | undefined> {
    const importStmt = ImportParser.getImportAtPosition(document, position);
    if (!importStmt) {
      return undefined;
    }

    // If clicking on module name, go to module file
    if (importStmt.moduleNameRange.contains(position)) {
      return this.goToModule(importStmt.moduleName, document.uri.fsPath);
    }

    // If clicking on imported symbol, go to symbol definition
    for (const symbol of importStmt.symbols) {
      if (symbol.range.contains(position)) {
        return this.goToSymbol(symbol.name, importStmt.moduleName);
      }

      // Check alias
      if (symbol.aliasRange && symbol.aliasRange.contains(position)) {
        return this.goToSymbol(symbol.name, importStmt.moduleName);
      }
    }

    return undefined;
  }

  /**
   * Provide definition for symbol usage
   */
  private async provideSymbolDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    word: string
  ): Promise<vscode.Definition | vscode.LocationLink[] | undefined> {
    // Check if this symbol is imported
    const imports = ImportParser.parseImports(document);

    for (const importStmt of imports) {
      // Check named imports
      for (const symbol of importStmt.symbols) {
        const symbolName = symbol.alias || symbol.name;
        if (symbolName === word) {
          return this.goToSymbol(symbol.name, importStmt.moduleName);
        }
      }

      // Check wildcard imports
      if (importStmt.isWildcard) {
        const symbols = this.symbolIndex.getModuleExports(importStmt.moduleName);
        if (symbols.some(s => s.name === word)) {
          return this.goToSymbol(word, importStmt.moduleName);
        }
      }

      // Check default imports (Module.Symbol access)
      if (importStmt.type === 'default' && importStmt.moduleName === word) {
        return this.goToModule(importStmt.moduleName, document.uri.fsPath);
      }
    }

    return undefined;
  }

  /**
   * Navigate to module file
   */
  private async goToModule(
    moduleName: string,
    importerPath: string
  ): Promise<vscode.Location | undefined> {
    const resolvedPath = this.moduleResolver.resolveModule(moduleName, importerPath);
    if (!resolvedPath) {
      return undefined;
    }

    const uri = vscode.Uri.file(resolvedPath);
    return new vscode.Location(uri, new vscode.Position(0, 0));
  }

  /**
   * Navigate to symbol definition
   */
  private async goToSymbol(
    symbolName: string,
    moduleName: string
  ): Promise<vscode.Location | undefined> {
    const symbols = this.symbolIndex.getSymbolsByName(symbolName);
    const symbol = symbols.find(s => s.moduleName === moduleName);

    if (!symbol) {
      return undefined;
    }

    return symbol.location;
  }
}

/**
 * Provides 'Find All References' for imported symbols
 */
export class ImportReferenceProvider implements vscode.ReferenceProvider {
  constructor(private symbolIndex: SymbolIndex) {}

  public async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[] | undefined> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const line = document.lineAt(position.line).text;
    const locations: vscode.Location[] = [];

    // Check if we're in an import statement
    if (line.trim().startsWith('import')) {
      const importStmt = ImportParser.getImportAtPosition(document, position);
      if (!importStmt) {
        return undefined;
      }

      // Find references to imported symbol
      for (const symbol of importStmt.symbols) {
        if (symbol.range.contains(position) || symbol.aliasRange?.contains(position)) {
          const symbolName = symbol.alias || symbol.name;
          locations.push(...ImportParser.findSymbolReferences(document, symbolName));
        }
      }

      // If clicking on module name, find all imports of this module
      if (importStmt.moduleNameRange.contains(position)) {
        locations.push(...ImportParser.findModuleReferences(document, importStmt.moduleName));
      }
    } else {
      // Find all references to the symbol in the current document
      locations.push(...ImportParser.findSymbolReferences(document, word));
    }

    // Include the definition if requested
    if (context.includeDeclaration) {
      const imports = ImportParser.parseImports(document);
      for (const importStmt of imports) {
        for (const symbol of importStmt.symbols) {
          const symbolName = symbol.alias || symbol.name;
          if (symbolName === word) {
            locations.push(new vscode.Location(document.uri, symbol.range));
          }
        }
      }
    }

    return locations.length > 0 ? locations : undefined;
  }
}

/**
 * Provides 'Peek Definition' support
 */
export class ImportPeekDefinitionProvider implements vscode.DefinitionProvider {
  constructor(
    private symbolIndex: SymbolIndex,
    private moduleResolver: ModuleResolver
  ) {}

  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | vscode.LocationLink[] | undefined> {
    // Same implementation as DefinitionProvider
    const definitionProvider = new ImportDefinitionProvider(
      this.symbolIndex,
      this.moduleResolver
    );
    return definitionProvider.provideDefinition(document, position, token);
  }
}
