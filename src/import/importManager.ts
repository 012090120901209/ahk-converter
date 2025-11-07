import * as vscode from 'vscode';
import { SymbolIndex } from './symbolIndex';
import { ModuleResolver } from './moduleResolver';
import { ImportCompletionProvider } from './completionProvider';
import { ImportHoverProvider } from './hoverProvider';
import { ImportDiagnosticProvider } from './diagnosticProvider';
import { ImportCodeActionProvider } from './codeActionProvider';
import {
  ImportDefinitionProvider,
  ImportReferenceProvider,
  ImportPeekDefinitionProvider
} from './definitionProvider';

/**
 * Main manager for the import library feature
 * Coordinates all import-related functionality
 */
export class ImportManager {
  private static instance: ImportManager;
  private symbolIndex: SymbolIndex;
  private moduleResolver: ModuleResolver;
  private diagnosticProvider: ImportDiagnosticProvider;
  private subscriptions: vscode.Disposable[] = [];
  private isInitialized = false;

  private constructor() {
    this.symbolIndex = SymbolIndex.getInstance();
    this.moduleResolver = ModuleResolver.getInstance();
    this.diagnosticProvider = new ImportDiagnosticProvider(
      this.symbolIndex,
      this.moduleResolver
    );
  }

  public static getInstance(): ImportManager {
    if (!ImportManager.instance) {
      ImportManager.instance = new ImportManager();
    }
    return ImportManager.instance;
  }

  /**
   * Initialize the import manager and register all providers
   */
  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing AHK Import Manager...');

    // Index workspace on startup
    await this.symbolIndex.indexWorkspace();

    // Register all providers
    this.registerProviders(context);

    // Register commands
    this.registerCommands(context);

    // Set up document listeners
    this.setupDocumentListeners();

    // Validate all open documents
    for (const document of vscode.workspace.textDocuments) {
      if (document.languageId === 'ahk' || document.languageId === 'ahk2') {
        await this.diagnosticProvider.validateDocument(document);
      }
    }

    this.isInitialized = true;
    console.log('AHK Import Manager initialized successfully');
  }

  /**
   * Register all language providers
   */
  private registerProviders(context: vscode.ExtensionContext): void {
    const ahkSelector: vscode.DocumentSelector = [
      { language: 'ahk', scheme: 'file' },
      { language: 'ahk2', scheme: 'file' }
    ];

    // Completion provider
    const completionProvider = new ImportCompletionProvider(
      this.symbolIndex,
      this.moduleResolver
    );

    this.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        ahkSelector,
        completionProvider,
        '{', ',', ' ', 'from'
      )
    );

    // Hover provider
    const hoverProvider = new ImportHoverProvider(
      this.symbolIndex,
      this.moduleResolver
    );

    this.subscriptions.push(
      vscode.languages.registerHoverProvider(ahkSelector, hoverProvider)
    );

    // Code action provider
    const codeActionProvider = new ImportCodeActionProvider(
      this.symbolIndex,
      this.moduleResolver
    );

    this.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        ahkSelector,
        codeActionProvider,
        {
          providedCodeActionKinds: ImportCodeActionProvider.providedCodeActionKinds
        }
      )
    );

    // Definition provider
    const definitionProvider = new ImportDefinitionProvider(
      this.symbolIndex,
      this.moduleResolver
    );

    this.subscriptions.push(
      vscode.languages.registerDefinitionProvider(ahkSelector, definitionProvider)
    );

    // Reference provider
    const referenceProvider = new ImportReferenceProvider(this.symbolIndex);

    this.subscriptions.push(
      vscode.languages.registerReferenceProvider(ahkSelector, referenceProvider)
    );

    // Peek definition provider
    const peekProvider = new ImportPeekDefinitionProvider(
      this.symbolIndex,
      this.moduleResolver
    );

    this.subscriptions.push(
      vscode.languages.registerDefinitionProvider(ahkSelector, peekProvider)
    );

    console.log('All import providers registered');
  }

  /**
   * Register commands
   */
  private registerCommands(context: vscode.ExtensionContext): void {
    // Organize imports command
    this.subscriptions.push(
      vscode.commands.registerCommand('ahk.organizeImports', async (uri?: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) {
          return;
        }

        await this.organizeImports(targetUri);
      })
    );

    // Reindex workspace command
    this.subscriptions.push(
      vscode.commands.registerCommand('ahk.reindexWorkspace', async () => {
        await this.reindexWorkspace();
      })
    );

    // Show module exports command
    this.subscriptions.push(
      vscode.commands.registerCommand('ahk.showModuleExports', async () => {
        await this.showModuleExports();
      })
    );

    // Add import command
    this.subscriptions.push(
      vscode.commands.registerCommand('ahk.addImport', async () => {
        await this.addImport();
      })
    );

    console.log('Import commands registered');
  }

  /**
   * Setup document event listeners
   */
  private setupDocumentListeners(): void {
    // Validate document on open
    this.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId === 'ahk' || document.languageId === 'ahk2') {
          await this.diagnosticProvider.validateDocument(document);
        }
      })
    );

    // Validate document on save
    this.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'ahk' || document.languageId === 'ahk2') {
          await this.symbolIndex.indexFile(document.uri);
          await this.diagnosticProvider.validateDocument(document);
        }
      })
    );

    // Validate document on change (debounced)
    let changeTimeout: NodeJS.Timeout;
    this.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === 'ahk' || event.document.languageId === 'ahk2') {
          clearTimeout(changeTimeout);
          changeTimeout = setTimeout(async () => {
            await this.diagnosticProvider.validateDocument(event.document);
          }, 500);
        }
      })
    );

    // Clear diagnostics on close
    this.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.diagnosticProvider.clearDiagnostics(document);
      })
    );
  }

  /**
   * Organize imports in a document
   */
  private async organizeImports(uri: vscode.Uri): Promise<void> {
    const document = await vscode.workspace.openTextDocument(uri);
    const edit = new vscode.WorkspaceEdit();

    // Get imports and sort them
    const imports = await import('./importParser').then(m => m.ImportParser.parseImports(document));

    if (imports.length === 0) {
      vscode.window.showInformationMessage('No imports to organize');
      return;
    }

    // Remove unused imports
    const unusedImports = await this.symbolIndex.getUnusedImports(document);
    const usedImports = imports.filter(
      imp => !unusedImports.some(unused => unused.line === imp.line)
    );

    // Sort by module name
    const sortedImports = usedImports.sort((a, b) =>
      a.moduleName.localeCompare(b.moduleName)
    );

    // Delete old import block
    const firstImport = imports[0];
    const lastImport = imports[imports.length - 1];
    const deleteRange = new vscode.Range(
      firstImport.line, 0,
      lastImport.line + 1, 0
    );
    edit.delete(uri, deleteRange);

    // Insert organized imports
    const importText = sortedImports.map(imp => imp.text).join('\n') + '\n';
    edit.insert(uri, new vscode.Position(firstImport.line, 0), importText);

    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage('Imports organized successfully');
  }

  /**
   * Reindex the entire workspace
   */
  private async reindexWorkspace(): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Reindexing AutoHotkey workspace...',
        cancellable: false
      },
      async (progress) => {
        progress.report({ increment: 0 });

        // Clear module resolver cache
        this.moduleResolver.clearCache();

        // Reindex all files
        await this.symbolIndex.indexWorkspace();

        progress.report({ increment: 100 });
        vscode.window.showInformationMessage('Workspace reindexed successfully');
      }
    );
  }

  /**
   * Show exports from a module
   */
  private async showModuleExports(): Promise<void> {
    // Get all modules
    const modules = this.symbolIndex.getAllModules();
    const moduleNames = modules.map(m => m.name).sort();

    if (moduleNames.length === 0) {
      vscode.window.showInformationMessage('No modules found in workspace');
      return;
    }

    // Let user select a module
    const selected = await vscode.window.showQuickPick(moduleNames, {
      placeHolder: 'Select a module to view its exports'
    });

    if (!selected) {
      return;
    }

    // Show exports
    const exports = this.symbolIndex.getModuleExports(selected);

    if (exports.length === 0) {
      vscode.window.showInformationMessage(`Module '${selected}' has no exports`);
      return;
    }

    const items = exports.map(exp => ({
      label: `$(symbol-${exp.type}) ${exp.name}`,
      description: exp.type,
      detail: exp.location.uri.fsPath
    }));

    const selectedExport = await vscode.window.showQuickPick(items, {
      placeHolder: `Exports from module '${selected}'`
    });

    if (selectedExport) {
      // Navigate to the selected export
      const exp = exports.find(e => e.name === selectedExport.label.split(' ')[1]);
      if (exp) {
        const document = await vscode.workspace.openTextDocument(exp.location.uri);
        await vscode.window.showTextDocument(document, {
          selection: exp.location.range
        });
      }
    }
  }

  /**
   * Add an import statement interactively
   */
  private async addImport(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Get all available symbols
    const allSymbols = this.symbolIndex.getAllSymbolNames();

    if (allSymbols.length === 0) {
      vscode.window.showInformationMessage('No symbols found in workspace');
      return;
    }

    // Let user select a symbol
    const selected = await vscode.window.showQuickPick(allSymbols, {
      placeHolder: 'Select a symbol to import'
    });

    if (!selected) {
      return;
    }

    // Find modules that export this symbol
    const modules = this.symbolIndex.findModuleExportingSymbol(selected);

    let moduleName: string;
    if (modules.length === 1) {
      moduleName = modules[0];
    } else {
      const selectedModule = await vscode.window.showQuickPick(modules, {
        placeHolder: `Select module to import '${selected}' from`
      });

      if (!selectedModule) {
        return;
      }

      moduleName = selectedModule;
    }

    // Insert import statement
    const importStatement = `import {${selected}} from ${moduleName}\n`;

    // Find insert position
    const { ImportParser } = await import('./importParser');
    const imports = ImportParser.parseImports(editor.document);

    let insertPosition: vscode.Position;
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      insertPosition = new vscode.Position(lastImport.line + 1, 0);
    } else {
      insertPosition = new vscode.Position(0, 0);
    }

    await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, importStatement);
    });

    vscode.window.showInformationMessage(
      `Added import: ${selected} from ${moduleName}`
    );
  }

  /**
   * Get symbol index (for external use)
   */
  public getSymbolIndex(): SymbolIndex {
    return this.symbolIndex;
  }

  /**
   * Get module resolver (for external use)
   */
  public getModuleResolver(): ModuleResolver {
    return this.moduleResolver;
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }

    this.diagnosticProvider.dispose();
    this.symbolIndex.dispose();

    this.isInitialized = false;
    console.log('AHK Import Manager disposed');
  }
}
