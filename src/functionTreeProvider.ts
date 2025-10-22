import * as vscode from 'vscode';
import { AHKLSPIntegration } from './lspIntegration';
import { FunctionAnalyzer } from './functionAnalyzer';

export class FunctionTreeItem extends vscode.TreeItem {
  public childCount: number = 0;
  public isStatic: boolean = false;
  public scope: 'global' | 'static' | 'local' | undefined;
  public badge?: { value: number; tooltip?: string };
  public diagnostics: vscode.Diagnostic[] = [];
  public includePath?: string;
  public includeLineNumber?: number;

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly symbol?: vscode.DocumentSymbol,
    public readonly itemType?: 'function' | 'parameter' | 'variable' | 'section' | 'class' | 'method' | 'include' | 'hotkey' | 'directive-header' | 'directive-include' | 'directive-hotif',
    hoverContent?: string,
    childCount: number = 0,
    isStatic: boolean = false,
    diagnostics: vscode.Diagnostic[] = [],
    scope?: 'global' | 'static' | 'local',
    includePath?: string,
    includeLineNumber?: number
  ) {
    // Don't add Nerd Font icons to labels - causes rendering issues
    super(label, collapsibleState);
    this.childCount = childCount;
    this.isStatic = isStatic;
    this.scope = scope;
    this.diagnostics = diagnostics;
    this.includePath = includePath;
    this.includeLineNumber = includeLineNumber;

    if (itemType === 'function' || itemType === 'method') {
      // Check if it's a static method (now passed as parameter)
      // this.isStatic is already set in the parameters

      // Color code: static methods = default, instance = custom yellow
      if (this.isStatic) {
        this.iconPath = new vscode.ThemeIcon('symbol-method',
          new vscode.ThemeColor('symbolIcon.methodForeground'));
        this.contextValue = 'static-method';
      } else if (itemType === 'method') {
        this.iconPath = new vscode.ThemeIcon('symbol-method',
          new vscode.ThemeColor('ahkv2Toolbox.codeMap.functionColor'));
        this.contextValue = 'method';
      } else {
        this.iconPath = new vscode.ThemeIcon('zap',
          new vscode.ThemeColor('ahkv2Toolbox.codeMap.functionColor'));
        this.contextValue = 'function';
      }

      if (symbol) {
        // Add static label for methods
        if (itemType === 'method') {
          this.description = this.isStatic ? 'static' : '';
        } else {
          this.description = symbol.detail;
        }

        // Use rich hover content if available, otherwise fall back to basic info
        if (hoverContent) {
          this.tooltip = new vscode.MarkdownString(hoverContent);
        } else {
          const staticLabel = this.isStatic ? ' (static)' : '';
          this.tooltip = new vscode.MarkdownString(`**${itemType}**${staticLabel} ${symbol.name}\n\n${symbol.detail || ''}`);
        }

        // Add diagnostics to tooltip if present
        if (diagnostics.length > 0) {
          const tooltipText = typeof this.tooltip === 'string' ? this.tooltip : this.tooltip.value;
          const diagnosticMessages = diagnostics.map(d => {
            const severity = d.severity === vscode.DiagnosticSeverity.Error ? '❌ Error' :
                            d.severity === vscode.DiagnosticSeverity.Warning ? '⚠️ Warning' :
                            d.severity === vscode.DiagnosticSeverity.Information ? 'ℹ️ Info' : 'Hint';
            return `${severity}: ${d.message}`;
          }).join('\n\n');

          this.tooltip = new vscode.MarkdownString(`${tooltipText}\n\n---\n\n**Problems:**\n\n${diagnosticMessages}`);
        }
      }

      // Add badge showing parameter count or diagnostics
      if (diagnostics.length > 0) {
        const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
        const warningCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;

        this.badge = {
          value: diagnostics.length,
          tooltip: `${errorCount} error(s), ${warningCount} warning(s)`
        };

        // Change icon based on severity
        if (errorCount > 0) {
          this.iconPath = new vscode.ThemeIcon('error',
            new vscode.ThemeColor('errorForeground')
          );
        } else if (warningCount > 0) {
          this.iconPath = new vscode.ThemeIcon('warning',
            new vscode.ThemeColor('editorWarning.foreground')
          );
        }
      } else if (childCount > 0) {
        this.badge = {
          value: childCount,
          tooltip: `${childCount} ${childCount === 1 ? 'child' : 'children'}`
        };
      }
    } else if (itemType === 'class') {
      this.iconPath = new vscode.ThemeIcon('symbol-class',
        new vscode.ThemeColor('ahkv2Toolbox.codeMap.classColor'));
      this.contextValue = 'class';
      if (symbol) {
        if (hoverContent) {
          this.tooltip = new vscode.MarkdownString(hoverContent);
        } else {
          this.tooltip = new vscode.MarkdownString(`**class** ${symbol.name}\n\n${symbol.detail || ''}`);
        }

        // Add diagnostics to tooltip if present
        if (diagnostics.length > 0) {
          const tooltipText = typeof this.tooltip === 'string' ? this.tooltip : this.tooltip.value;
          const diagnosticMessages = diagnostics.map(d => {
            const severity = d.severity === vscode.DiagnosticSeverity.Error ? '❌ Error' :
                            d.severity === vscode.DiagnosticSeverity.Warning ? '⚠️ Warning' :
                            d.severity === vscode.DiagnosticSeverity.Information ? 'ℹ️ Info' : 'Hint';
            return `${severity}: ${d.message}`;
          }).join('\n\n');

          this.tooltip = new vscode.MarkdownString(`${tooltipText}\n\n---\n\n**Problems:**\n\n${diagnosticMessages}`);
        }
      }

      // Add badge showing member count or diagnostics
      if (diagnostics.length > 0) {
        const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
        const warningCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;

        this.badge = {
          value: diagnostics.length,
          tooltip: `${errorCount} error(s), ${warningCount} warning(s)`
        };

        // Change icon based on severity
        if (errorCount > 0) {
          this.iconPath = new vscode.ThemeIcon('error',
            new vscode.ThemeColor('errorForeground'));
        } else if (warningCount > 0) {
          this.iconPath = new vscode.ThemeIcon('warning',
            new vscode.ThemeColor('editorWarning.foreground'));
        }
      } else if (childCount > 0) {
        this.badge = {
          value: childCount,
          tooltip: `${childCount} ${childCount === 1 ? 'member' : 'members'}`
        };
      }
    } else if (itemType === 'parameter') {
      this.iconPath = new vscode.ThemeIcon('symbol-parameter',
        new vscode.ThemeColor('symbolIcon.variableForeground'));
      this.contextValue = 'parameter';
      if (symbol) {
        const detail = symbol.detail ? `: ${symbol.detail}` : '';
        if (hoverContent) {
          this.tooltip = new vscode.MarkdownString(hoverContent);
        } else {
          this.tooltip = new vscode.MarkdownString(`**Parameter:** ${symbol.name}${detail}`);
        }
      }
    } else if (itemType === 'variable') {
      // this.isStatic is already set in parameters

      // Color code: static variables = purple, local = green (or error/warning if diagnostics present)
      if (diagnostics.length > 0) {
        const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
        const warningCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;

        if (errorCount > 0) {
          this.iconPath = new vscode.ThemeIcon('error',
            new vscode.ThemeColor('errorForeground')
          );
        } else if (warningCount > 0) {
          this.iconPath = new vscode.ThemeIcon('warning',
            new vscode.ThemeColor('editorWarning.foreground')
          );
        }
      } else if (this.isStatic) {
        this.iconPath = new vscode.ThemeIcon('symbol-constant',
          new vscode.ThemeColor('symbolIcon.constantForeground'));
        this.contextValue = 'static-variable';
      } else {
        this.iconPath = new vscode.ThemeIcon('symbol-variable',
          new vscode.ThemeColor('symbolIcon.variableForeground'));
        this.contextValue = 'variable';
      }

      if (symbol) {
        // Use scope if provided, otherwise fall back to isStatic check
        this.description = scope || (this.isStatic ? 'static' : 'local');

        if (hoverContent) {
          this.tooltip = new vscode.MarkdownString(hoverContent);
        } else {
          const scopeLabel = scope ? scope.charAt(0).toUpperCase() + scope.slice(1) : (this.isStatic ? 'Static' : 'Local');
          this.tooltip = new vscode.MarkdownString(`**${scopeLabel} variable:** ${symbol.name}`);
        }

        // Add diagnostics to tooltip if present
        if (diagnostics.length > 0) {
          const tooltipText = typeof this.tooltip === 'string' ? this.tooltip : this.tooltip.value;
          const diagnosticMessages = diagnostics.map(d => {
            const severity = d.severity === vscode.DiagnosticSeverity.Error ? '❌ Error' :
                            d.severity === vscode.DiagnosticSeverity.Warning ? '⚠️ Warning' :
                            d.severity === vscode.DiagnosticSeverity.Information ? 'ℹ️ Info' : 'Hint';
            return `${severity}: ${d.message}`;
          }).join('\n\n');

          this.tooltip = new vscode.MarkdownString(`${tooltipText}\n\n---\n\n**Problems:**\n\n${diagnosticMessages}`);
        }
      }
    } else if (itemType === 'section') {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'section';
    } else if (itemType === 'include' || itemType === 'directive-include') {
      // Purple book icon for includes
      this.iconPath = new vscode.ThemeIcon('book',
        new vscode.ThemeColor('charts.purple'));
      this.contextValue = 'include';

      if (includePath) {
        this.description = includePath;
        this.tooltip = new vscode.MarkdownString(`**#Include** ${includePath}\n\nClick to jump to declaration`);
      }
    } else if (itemType === 'directive-header') {
      // Purple gear icon for header directives (#Requires, #SingleInstance)
      this.iconPath = new vscode.ThemeIcon('gear',
        new vscode.ThemeColor('charts.purple'));
      this.contextValue = 'directive-header';

      if (hoverContent) {
        this.tooltip = new vscode.MarkdownString(hoverContent);
      }
    } else if (itemType === 'directive-hotif') {
      // Purple filter icon for #HotIf directives
      this.iconPath = new vscode.ThemeIcon('filter',
        new vscode.ThemeColor('charts.purple'));
      this.contextValue = 'directive-hotif';

      if (hoverContent) {
        this.tooltip = new vscode.MarkdownString(hoverContent);
      }
    } else if (itemType === 'hotkey') {
      // Keyboard icon for hotkeys
      this.iconPath = new vscode.ThemeIcon('keyboard',
        new vscode.ThemeColor('symbolIcon.keywordForeground'));
      this.contextValue = 'hotkey';

      if (hoverContent) {
        this.tooltip = new vscode.MarkdownString(hoverContent);
      }
    }

    // Set the command to jump to definition
    if (symbol && itemType !== 'section' && itemType !== 'include' && itemType !== 'directive-header' && itemType !== 'directive-include' && itemType !== 'directive-hotif' && itemType !== 'hotkey') {
      this.command = {
        command: 'codeMap.jumpToDefinition',
        title: 'Jump to Definition',
        arguments: [this]
      };
    } else if ((itemType === 'include' || itemType === 'directive-include' || itemType === 'directive-header' || itemType === 'directive-hotif' || itemType === 'hotkey') && includeLineNumber !== undefined) {
      this.command = {
        command: 'codeMap.jumpToInclude',
        title: 'Jump to Declaration',
        arguments: [this]
      };
    }
  }

  /**
   * Get Nerd Font icon for item type
   */
  private static getNerdIcon(itemType?: string, isStatic?: boolean): string {
    switch (itemType) {
      case 'class':
        return ''; // nf-cod-symbol_class
      case 'function':
        return '󰊕'; // nf-md-function
      case 'method':
        return isStatic ? '' : ''; // nf-cod-symbol_method
      case 'variable':
        return isStatic ? '' : ''; // nf-cod-symbol_variable (static = constant)
      case 'parameter':
        return ''; // nf-cod-symbol_parameter
      case 'include':
        return ''; // nf-md-book (book/library icon)
      default:
        return '';
    }
  }
}

export class FunctionTreeProvider implements
  vscode.TreeDataProvider<FunctionTreeItem>,
  vscode.TreeDragAndDropController<FunctionTreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<FunctionTreeItem | undefined | null | void> = new vscode.EventEmitter<FunctionTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FunctionTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private lspIntegration: AHKLSPIntegration;
  private useLSP: boolean = true;

  // Filter state
  private filters: Set<string> = new Set(['class', 'function', 'method', 'variable', 'parameter', 'hotkey', 'directive-header', 'directive-include', 'directive-hotif']);
  private scopedItem: FunctionTreeItem | undefined;

  // Drag and drop support
  dropMimeTypes = ['application/vnd.code.tree.codemap'];
  dragMimeTypes = ['text/uri-list', 'application/vnd.code.tree.codemap'];

  constructor(private context: vscode.ExtensionContext) {
    this.lspIntegration = AHKLSPIntegration.getInstance();

    // Check if LSP is available on startup
    this.lspIntegration.isLSPAvailable().then(available => {
      this.useLSP = available;
      if (!available) {
        console.log('AHKv2 Toolbox: Using fallback regex parser (LSP not available)');
      }
    });

    // Watch for document changes
    vscode.workspace.onDidChangeTextDocument(() => {
      this.refresh();
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
      this.refresh();
    });

    // Watch for diagnostic changes
    vscode.languages.onDidChangeDiagnostics(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.updateFilterStatus();
  }

  /**
   * Toggle filter for a specific item type
   */
  toggleFilter(itemType: string): void {
    if (this.filters.has(itemType)) {
      this.filters.delete(itemType);
    } else {
      this.filters.add(itemType);
    }
    this.refresh();
  }

  /**
   * Show only a specific item type
   */
  showOnly(itemType: string): void {
    this.filters.clear();
    this.filters.add(itemType);
    this.refresh();
  }

  /**
   * Show all item types
   */
  showAll(): void {
    this.filters = new Set(['class', 'function', 'method', 'variable', 'parameter', 'hotkey', 'directive-header', 'directive-include', 'directive-hotif']);
    this.refresh();
  }

  /**
   * Scope to a specific tree item
   */
  scopeToItem(item: FunctionTreeItem): void {
    this.scopedItem = item;
    this.updateBreadcrumb();
    this.refresh();
  }

  /**
   * Clear scoping
   */
  clearScope(): void {
    this.scopedItem = undefined;
    this.refresh();
  }

  /**
   * Get current filter status
   */
  getFilterStatus(): string {
    if (this.scopedItem) {
      return `Scoped to: ${this.scopedItem.label}`;
    }

    const activeFilters = Array.from(this.filters);
    if (activeFilters.length === 9) {
      return 'All Items';
    } else if (activeFilters.length === 0) {
      return 'No Items';
    } else {
      return `Showing: ${activeFilters.join(', ')}`;
    }
  }

  /**
   * Update status bar with filter info
   */
  private updateFilterStatus(): void {
    const status = this.getFilterStatus();
    vscode.window.setStatusBarMessage(`Code Map: ${status}`, 3000);
  }

  /**
   * Check if an item type should be shown
   */
  private shouldShowItemType(itemType?: string): boolean {
    if (!itemType) return true;
    return this.filters.has(itemType);
  }

  /**
   * Filter items based on search query
   */
  filterItem(item: FunctionTreeItem, query: string): boolean {
    const searchTerm = query.toLowerCase();

    // Search by label
    if (item.label.toString().toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search by type
    if (item.itemType?.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search by description
    if (item.description?.toString().toLowerCase().includes(searchTerm)) {
      return true;
    }

    return false;
  }

  /**
   * Handle drag operation
   */
  async handleDrag(
    source: readonly FunctionTreeItem[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Store the dragged items
    const data = source.map(item => ({
      label: item.label,
      itemType: item.itemType,
      range: item.symbol?.range
    }));

    dataTransfer.set(
      'application/vnd.code.tree.codemap',
      new vscode.DataTransferItem(data)
    );
  }

  /**
   * Handle drop operation
   */
  async handleDrop(
    target: FunctionTreeItem | undefined,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    const transferItem = dataTransfer.get('application/vnd.code.tree.codemap');
    if (!transferItem) {
      return;
    }

    const draggedItems = transferItem.value;

    // Show information about the drag/drop operation
    const targetName = target?.label || 'root';
    const itemCount = Array.isArray(draggedItems) ? draggedItems.length : 1;

    vscode.window.showInformationMessage(
      `Code reorganization detected: ${itemCount} item(s) to ${targetName}.\n\nNote: Code Map is read-only. Use refactoring commands to reorganize code.`,
      'Show Refactoring Commands'
    ).then(choice => {
      if (choice === 'Show Refactoring Commands') {
        vscode.commands.executeCommand('workbench.action.showCommands', '>Refactor');
      }
    });
  }

  /**
   * Update view title with breadcrumb
   */
  private updateBreadcrumb(): void {
    if (this.scopedItem) {
      // Show breadcrumb in status bar
      const breadcrumb = this.getBreadcrumb(this.scopedItem);
      vscode.window.setStatusBarMessage(`📍 ${breadcrumb}`, 5000);
    }
  }

  /**
   * Get breadcrumb path for an item
   */
  private getBreadcrumb(item: FunctionTreeItem): string {
    // For now, just show the item name
    // In a full implementation, you'd walk up the tree to build the full path
    return item.label.toString();
  }

  getTreeItem(element: FunctionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FunctionTreeItem): Promise<FunctionTreeItem[]> {
    const editor = vscode.window.activeTextEditor;

    if (!editor || !editor.document.fileName.endsWith('.ahk')) {
      return [];
    }

    // If scoped to a specific item, show only its children
    if (this.scopedItem && !element) {
      element = this.scopedItem;
    }

    // Try LSP first, fallback to regex parser
    let children: FunctionTreeItem[];
    if (this.useLSP && await this.lspIntegration.isLSPAvailable()) {
      children = await this.getChildrenFromLSP(editor.document, element);
    } else {
      children = this.getChildrenFromRegex(editor.document, element);
    }

    // Apply filters
    return children.filter(child => this.shouldShowItemType(child.itemType));
  }

  /**
   * Check if a symbol is static by examining the document text
   */
  private isSymbolStatic(document: vscode.TextDocument, symbol: vscode.DocumentSymbol): boolean {
    // First check the symbol detail
    if (symbol.detail?.toLowerCase().includes('static')) {
      return true;
    }

    // Fallback: check the actual source code
    try {
      const line = document.lineAt(symbol.range.start.line).text;
      const beforeName = line.substring(0, symbol.range.start.character);
      return /\bstatic\b/i.test(beforeName);
    } catch {
      return false;
    }
  }

  /**
   * Get the scope of a variable symbol (global, static, or local)
   */
  private getVariableScope(document: vscode.TextDocument, symbol: vscode.DocumentSymbol, parent?: vscode.DocumentSymbol): 'global' | 'static' | 'local' {
    // First check the symbol detail - LSP provides scope information
    const detail = symbol.detail?.toLowerCase() || '';

    // Check for global scope indicators
    if (detail.includes('@global') || detail.includes('global')) {
      return 'global';
    }

    // Check for static scope
    if (detail.includes('static') || this.isSymbolStatic(document, symbol)) {
      return 'static';
    }

    // If no parent provided, check if this is a top-level symbol (global scope)
    // Top-level variables (not inside any function or class) are global
    if (!parent) {
      // Check if symbol is at the document root (line < first function/class)
      const line = symbol.range.start.line;
      // If the variable is declared early in the file (typically before any functions/classes),
      // and it's not marked as static, it's likely global
      // We can check if it's outside of any function/class by seeing if it's a root-level symbol
      return 'global';
    }

    // Default to local
    return 'local';
  }

  /**
   * Get diagnostics that overlap with a symbol's range
   */
  private getDiagnosticsForSymbol(document: vscode.TextDocument, symbol: vscode.DocumentSymbol): vscode.Diagnostic[] {
    const allDiagnostics = vscode.languages.getDiagnostics(document.uri);
    return allDiagnostics.filter(diagnostic => {
      // Check if the diagnostic range overlaps with the symbol range
      return symbol.range.contains(diagnostic.range.start) ||
             symbol.range.contains(diagnostic.range.end) ||
             diagnostic.range.contains(symbol.range.start);
    });
  }

  /**
   * Parse all directives from the document
   */
  private parseDirectives(document: vscode.TextDocument): FunctionTreeItem[] {
    const directives: FunctionTreeItem[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    // Check if header directives should be shown
    const config = vscode.workspace.getConfiguration('ahkConverter.codeMap');
    const showHeaderDirectives = config.get<boolean>('showHeaderDirectives', false);

    // Regex patterns for different directive types
    const includeRegex = /^\s*#Include\s+(.+?)\s*$/i;
    const requiresRegex = /^\s*#Requires\s+(.+?)\s*$/i;
    const singleInstanceRegex = /^\s*#SingleInstance\s+(.+?)\s*$/i;
    const hotifRegex = /^\s*#HotIf\s+(.+?)\s*$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for #Include directives
      let match = line.match(includeRegex);
      if (match) {
        const includePath = match[1].trim();
        const cleanPath = includePath.replace(/^<|>$/g, '');

        directives.push(new FunctionTreeItem(
          cleanPath,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'directive-include',
          `**#Include** ${cleanPath}\n\nClick to jump to declaration`,
          0,
          false,
          [],
          undefined,
          cleanPath,
          i
        ));
        continue;
      }

      // Check for #Requires directive (only if setting is enabled)
      if (showHeaderDirectives) {
        match = line.match(requiresRegex);
        if (match) {
          const requirement = match[1].trim();
          directives.push(new FunctionTreeItem(
            `#Requires ${requirement}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'directive-header',
            `**#Requires** ${requirement}\n\nSpecifies minimum AutoHotkey version requirement`,
            0,
            false,
            [],
            undefined,
            undefined,
            i
          ));
          continue;
        }
      }

      // Check for #SingleInstance directive (only if setting is enabled)
      if (showHeaderDirectives) {
        match = line.match(singleInstanceRegex);
        if (match) {
          const mode = match[1].trim();
          directives.push(new FunctionTreeItem(
            `#SingleInstance ${mode}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'directive-header',
            `**#SingleInstance** ${mode}\n\nControls behavior when script is already running`,
            0,
            false,
            [],
            undefined,
            undefined,
            i
          ));
          continue;
        }
      }

      // Check for #HotIf directive
      match = line.match(hotifRegex);
      if (match) {
        const condition = match[1].trim();
        directives.push(new FunctionTreeItem(
          `#HotIf ${condition}`,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'directive-hotif',
          `**#HotIf** ${condition}\n\nConditional hotkey activation`,
          0,
          false,
          [],
          undefined,
          undefined,
          i
        ));
        continue;
      }
    }

    return directives;
  }

  /**
   * Parse hotkey assignments from the document
   */
  private parseHotkeys(document: vscode.TextDocument): FunctionTreeItem[] {
    const hotkeys: FunctionTreeItem[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    // Regex to match hotkey assignments like: F5::RunTests() or 5::Reload
    // Matches: key::action where action is a function call or command
    const hotkeyRegex = /^\s*([~*!+^#<>$]*[a-zA-Z0-9_]+)\s*::\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(hotkeyRegex);

      if (match) {
        const hotkey = match[1].trim();
        const functionName = match[2].trim();

        const item = new FunctionTreeItem(
          functionName,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'hotkey',
          `**Hotkey:** ${hotkey}\n\n**Function:** ${functionName}()\n\nClick to jump to declaration`,
          0,
          false,
          [],
          undefined,
          undefined,
          i
        );

        // Set hotkey as description (shows faded to the right like local/global)
        item.description = hotkey;

        hotkeys.push(item);
      }
    }

    return hotkeys;
  }

  /**
   * Get children using the thqby LSP extension
   */
  private async getChildrenFromLSP(
    document: vscode.TextDocument,
    element?: FunctionTreeItem
  ): Promise<FunctionTreeItem[]> {
    if (!element) {
      // Root level - get all symbols
      const symbols = await this.lspIntegration.getDocumentSymbols(document);

      if (symbols.length === 0) {
        return [new FunctionTreeItem('No symbols found', vscode.TreeItemCollapsibleState.None)];
      }

      // Parse directives and hotkeys first (with error handling)
      let directives: FunctionTreeItem[] = [];
      let hotkeys: FunctionTreeItem[] = [];

      try {
        directives = this.parseDirectives(document);
      } catch (error) {
        console.error('Error parsing directives:', error);
      }

      try {
        hotkeys = this.parseHotkeys(document);
      } catch (error) {
        console.error('Error parsing hotkeys:', error);
      }

      // Get hotkey line numbers to filter out duplicate variables (only valid line numbers)
      const hotkeyLines = new Set(
        hotkeys
          .map(h => h.includeLineNumber)
          .filter((lineNum): lineNum is number => lineNum !== undefined)
      );

      // Group symbols by type
      const items: FunctionTreeItem[] = [...directives, ...hotkeys];

      for (const symbol of symbols) {
        const itemType = this.getItemTypeFromSymbol(symbol);

        // Skip variables that are on the same line as hotkeys (prevents duplicates like "5:: global")
        if (itemType === 'variable' && hotkeyLines.has(symbol.range.start.line)) {
          continue;
        }

        // Expand everything except variables and parameters
        const shouldExpand = itemType !== 'variable' && itemType !== 'parameter';
        const collapsibleState = symbol.children && symbol.children.length > 0
          ? (shouldExpand ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed)
          : vscode.TreeItemCollapsibleState.None;

        // Get hover information for this symbol
        const hoverContent = await this.getHoverContent(document, symbol);

        // Get child count for badges
        const childCount = symbol.children?.length || 0;

        // Check if symbol is static
        const isStatic = this.isSymbolStatic(document, symbol);

        // Get variable scope if it's a variable
        const scope = itemType === 'variable' ? this.getVariableScope(document, symbol) : undefined;

        // Get diagnostics for this symbol
        const diagnostics = this.getDiagnosticsForSymbol(document, symbol);

        items.push(new FunctionTreeItem(
          symbol.name,
          collapsibleState,
          symbol,
          itemType,
          hoverContent,
          childCount,
          isStatic,
          diagnostics,
          scope
        ));
      }

      return items;
    }

    // Child level - show symbol children
    if (element.symbol && element.symbol.children) {
      const childItems: FunctionTreeItem[] = [];

      for (const child of element.symbol.children) {
        const itemType = this.getItemTypeFromSymbol(child);
        // Expand everything except variables and parameters
        const shouldExpand = itemType !== 'variable' && itemType !== 'parameter';
        const collapsibleState = child.children && child.children.length > 0
          ? (shouldExpand ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed)
          : vscode.TreeItemCollapsibleState.None;

        // Get hover information for child symbol
        const hoverContent = await this.getHoverContent(document, child);

        // Get child count for badges
        const childCount = child.children?.length || 0;

        // Check if symbol is static
        const isStatic = this.isSymbolStatic(document, child);

        // Get variable scope if it's a variable (pass parent to indicate it's not root level)
        const scope = itemType === 'variable' ? this.getVariableScope(document, child, element.symbol) : undefined;

        // Get diagnostics for this symbol
        const diagnostics = this.getDiagnosticsForSymbol(document, child);

        childItems.push(new FunctionTreeItem(
          child.name,
          collapsibleState,
          child,
          itemType,
          hoverContent,
          childCount,
          isStatic,
          diagnostics,
          scope
        ));
      }

      return childItems;
    }

    return [];
  }

  /**
   * Get hover content from LSP for a symbol
   */
  private async getHoverContent(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol
  ): Promise<string | undefined> {
    try {
      // Use the symbol's selection range start position for hover
      const position = symbol.selectionRange.start;
      const hovers = await this.lspIntegration.getHoverInfo(document, position);

      if (hovers && hovers.length > 0) {
        // Extract markdown content from hover
        const hover = hovers[0];
        if (hover.contents) {
          // Handle different hover content formats
          if (Array.isArray(hover.contents)) {
            return hover.contents
              .map((content: any) => {
                if (typeof content === 'string') {
                  return content;
                } else if (content && typeof content === 'object' && 'value' in content) {
                  return content.value;
                }
                return '';
              })
              .filter((s: string) => s)
              .join('\n\n');
          } else if (typeof hover.contents === 'string') {
            return hover.contents;
          } else if (typeof hover.contents === 'object' && hover.contents && 'value' in hover.contents) {
            return (hover.contents as any).value;
          }
        }
      }
    } catch (error) {
      // Silently fail - we'll use fallback tooltip
      console.debug('Failed to get hover content:', error);
    }

    return undefined;
  }

  /**
   * Fallback: Get children using regex parser
   */
  private getChildrenFromRegex(
    document: vscode.TextDocument,
    element?: FunctionTreeItem
  ): FunctionTreeItem[] {
    if (!element) {
      const metadata = FunctionAnalyzer.extractFunctionMetadata(document);

      if (metadata.length === 0) {
        return [new FunctionTreeItem('No functions found', vscode.TreeItemCollapsibleState.None)];
      }

      return metadata.map(func =>
        new FunctionTreeItem(
          func.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          undefined,
          'function'
        )
      );
    }

    return [];
  }

  /**
   * Map VS Code SymbolKind to our item types
   */
  private getItemTypeFromSymbol(symbol: vscode.DocumentSymbol): 'function' | 'parameter' | 'variable' | 'class' | 'method' {
    switch (symbol.kind) {
      case vscode.SymbolKind.Function:
        return 'function';
      case vscode.SymbolKind.Method:
        return 'method';
      case vscode.SymbolKind.Class:
        return 'class';
      case vscode.SymbolKind.Variable:
      case vscode.SymbolKind.Property:
      case vscode.SymbolKind.Field:
        return 'variable';
      default:
        return 'variable';
    }
  }

  /**
   * Command to jump to symbol definition
   */
  async jumpToDefinition(item: FunctionTreeItem): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !item.symbol) return;

    // Use the symbol's selection range for precise positioning
    const position = item.symbol.selectionRange.start;
    const selection = new vscode.Selection(position, position);
    editor.selection = selection;
    editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
  }

  /**
   * Command to jump to include declaration
   */
  async jumpToInclude(item: FunctionTreeItem): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || item.includeLineNumber === undefined) return;

    // Jump to the #Include line
    const position = new vscode.Position(item.includeLineNumber, 0);
    const selection = new vscode.Selection(position, position);
    editor.selection = selection;
    editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
  }

  /**
   * Export the code map as an ASCII tree in markdown format
   */
  async exportAsAsciiTree(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.ahk')) {
      vscode.window.showErrorMessage('No active AHK file to export');
      return;
    }

    // Get the tree structure
    let items: FunctionTreeItem[];
    if (this.useLSP && await this.lspIntegration.isLSPAvailable()) {
      items = await this.getChildrenFromLSP(editor.document);
    } else {
      items = this.getChildrenFromRegex(editor.document);
    }

    // Generate ASCII tree
    const asciiTree = await this.generateAsciiTree(items, editor.document);

    // Create markdown content
    const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'Unknown';
    const markdownContent = `# Code Map: ${fileName}

Generated: ${new Date().toLocaleString()}

\`\`\`
${asciiTree}
\`\`\`

## Summary

- **Total Classes**: ${items.filter(i => i.itemType === 'class').length}
- **Total Functions**: ${items.filter(i => i.itemType === 'function').length}
- **Total Methods**: ${items.filter(i => i.itemType === 'method').length}
- **Total Variables**: ${items.filter(i => i.itemType === 'variable').length}
- **Total Hotkeys**: ${items.filter(i => i.itemType === 'hotkey').length}
- **Total Header Directives**: ${items.filter(i => i.itemType === 'directive-header').length}
- **Total Includes**: ${items.filter(i => i.itemType === 'directive-include' || i.itemType === 'include').length}
- **Total #HotIf Directives**: ${items.filter(i => i.itemType === 'directive-hotif').length}
`;

    // Open in new document
    const doc = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: markdownContent
    });
    await vscode.window.showTextDocument(doc, { preview: false });

    vscode.window.showInformationMessage('Code Map exported as ASCII tree');
  }

  /**
   * Generate ASCII tree representation
   */
  private async generateAsciiTree(
    items: FunctionTreeItem[],
    document: vscode.TextDocument,
    prefix: string = '',
    isLast: boolean = true
  ): Promise<string> {
    let result = '';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLastItem = i === items.length - 1;
      const connector = isLastItem ? '└── ' : '├── ';
      const childPrefix = isLastItem ? '    ' : '│   ';

      // Get icon representation
      const icon = this.getAsciiIcon(item.itemType);
      // Use scope label for variables, static label for methods/functions
      const scopeLabel = item.scope ? ` (${item.scope})` : (item.isStatic ? ' (static)' : '');
      const badge = item.childCount > 0 ? ` [${item.childCount}]` : '';

      result += `${prefix}${connector}${icon} ${item.label}${scopeLabel}${badge}\n`;

      // Get children if any
      if (item.symbol && item.symbol.children && item.symbol.children.length > 0) {
        const childItems: FunctionTreeItem[] = [];

        for (const child of item.symbol.children) {
          const itemType = this.getItemTypeFromSymbol(child);
          const shouldExpand = itemType !== 'variable' && itemType !== 'parameter';
          const collapsibleState = child.children && child.children.length > 0
            ? (shouldExpand ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed)
            : vscode.TreeItemCollapsibleState.None;

          const hoverContent = await this.getHoverContent(document, child);
          const childCount = child.children?.length || 0;
          const isStatic = this.isSymbolStatic(document, child);
          const scope = itemType === 'variable' ? this.getVariableScope(document, child, item.symbol) : undefined;
          const diagnostics = this.getDiagnosticsForSymbol(document, child);

          childItems.push(new FunctionTreeItem(
            child.name,
            collapsibleState,
            child,
            itemType,
            hoverContent,
            childCount,
            isStatic,
            diagnostics,
            scope
          ));
        }

        // Recursively generate tree for children
        const childTree = await this.generateAsciiTree(
          childItems.filter(child => this.shouldShowItemType(child.itemType)),
          document,
          prefix + childPrefix,
          false
        );
        result += childTree;
      }
    }

    return result;
  }

  /**
   * Get ASCII icon for item type
   */
  private getAsciiIcon(itemType?: string): string {
    switch (itemType) {
      case 'class':
        return '[C]';
      case 'function':
        return '[F]';
      case 'method':
        return '[M]';
      case 'variable':
        return '[V]';
      case 'parameter':
        return '[P]';
      case 'hotkey':
        return '[⌨]';
      case 'directive-header':
        return '[#H]';
      case 'directive-include':
      case 'include':
        return '[#I]';
      case 'directive-hotif':
        return '[#?]';
      default:
        return '[ ]';
    }
  }
}
