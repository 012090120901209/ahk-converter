import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Represents a node in the dependency tree
 */
export class DependencyTreeItem extends vscode.TreeItem {
  public isPinnedRoot: boolean = false;

  constructor(
    public readonly filePath: string,
    public readonly labelText: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly includes: string[] = [],
    public readonly unresolvedIncludes: string[] = []
  ) {
    super(labelText, collapsibleState);

    this.tooltip = filePath;

    // Show include count in description
    this.description = includes.length > 0 ? `${includes.length} includes` : undefined;

    // Don't set resourceUri - this would show file problems/git status
    // which we don't want mixing with our dependency tree
    // Note: This means we can't use FileDecorationProvider badges

    // Set icon based on state
    if (unresolvedIncludes.length > 0) {
      // Warning icon for unresolved includes
      this.iconPath = new vscode.ThemeIcon('warning');
    } else if (includes.length > 0) {
      // Book/library icon for files with dependencies
      this.iconPath = new vscode.ThemeIcon('library');
    } else {
      // Simple file icon for files without dependencies
      this.iconPath = new vscode.ThemeIcon('file-code');
    }

    // Make clickable to open file
    this.command = {
      command: 'ahkDependencyTree.openFile',
      title: 'Open File',
      arguments: [filePath]
    };

    // Set initial context value - will be updated if this becomes a root item
    this.contextValue = 'dependency';
  }

  updatePinnedState(isPinned: boolean): void {
    this.isPinnedRoot = isPinned;

    // Keep main icon based on file status (not pin state)
    if (this.unresolvedIncludes.length > 0) {
      // Warning icon for unresolved includes
      this.iconPath = new vscode.ThemeIcon('warning');
    } else if (this.includes.length > 0) {
      // Book/library icon for files with dependencies
      this.iconPath = new vscode.ThemeIcon('library');
    } else {
      // Simple file icon for files without dependencies
      this.iconPath = new vscode.ThemeIcon('file-code');
    }

    // Update context and tooltip based on pinned state
    if (isPinned) {
      // Set context for pinned state (shows unpin icon in inline area)
      this.contextValue = 'rootItem-isPinned';
      this.tooltip = `📌 Pinned: ${this.labelText}\nTree view locked to this file`;

      // Add pin emoji to description (always visible when pinned)
      const includesText = this.includes.length > 0 ? `${this.includes.length} includes` : '';
      // Use spacing to push pin emoji to the right
      this.description = includesText ? `${includesText}  📌` : '📌';
    } else {
      // Set context for unpinned state (shows pin icon in inline area on hover)
      this.contextValue = 'rootItem';
      this.tooltip = this.filePath;

      // Normal description without pin indicator
      this.description = this.includes.length > 0 ? `${this.includes.length} includes` : undefined;
    }

    // Always use normal label
    this.label = this.labelText;
  }
}

/**
 * Manages dependency tree state and provides data to VS Code TreeView
 */
export class DependencyTreeProvider implements vscode.TreeDataProvider<DependencyTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DependencyTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private dependencyCache = new Map<string, DependencyInfo>();
  private workspaceRoot: string | null = null;
  private fileWatcher?: vscode.FileSystemWatcher;
  private editorChangeListener?: vscode.Disposable;
  private pinnedFile: string | null = null;
  private rootItem: DependencyTreeItem | null = null;

  constructor(private context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }

    // Initialize pin context to false
    vscode.commands.executeCommand('setContext', 'ahkDependencyTree.isPinned', false);

    // Watch for file changes
    this.setupFileWatcher();

    // Watch for active editor changes
    this.editorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
      // Update context based on whether active file is the pinned file
      this.updatePinContext(editor?.document.fileName);

      // Only refresh tree if not pinned
      if (!this.pinnedFile) {
        // No pin active, normal behavior - update tree for active file
        this.refresh();
      }
      // If pinned, tree stays locked but context updates for header icon
    });

    this.context.subscriptions.push(this.editorChangeListener);
  }

  private setupFileWatcher(): void {
    // Only watch files if we have a workspace
    if (!this.workspaceRoot) {
      return;
    }

    // Watch all .ahk files in workspace
    this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.ahk');

    this.fileWatcher.onDidCreate(() => this.refresh());
    this.fileWatcher.onDidChange((uri) => {
      // Invalidate cache for changed file
      this.dependencyCache.delete(uri.fsPath);
      this.refresh();
    });
    this.fileWatcher.onDidDelete((uri) => {
      this.dependencyCache.delete(uri.fsPath);
      this.refresh();
    });

    this.context.subscriptions.push(this.fileWatcher);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Update the pin context based on whether the active file is the pinned file
   */
  private updatePinContext(activeFilePath: string | undefined): void {
    // Context is true only if active file IS the pinned file
    const isPinnedFileActive = !!(
      activeFilePath &&
      this.pinnedFile &&
      activeFilePath === this.pinnedFile
    );

    vscode.commands.executeCommand('setContext', 'ahkDependencyTree.isPinned', isPinnedFileActive);
  }

  /**
   * Pin the current file, preventing tree from changing when clicking dependencies
   */
  pinCurrentFile(): void {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.fileName.endsWith('.ahk')) {
      this.pinnedFile = activeEditor.document.fileName;

      // Update context - active file is now the pinned file
      this.updatePinContext(activeEditor.document.fileName);

      // Update root item visual state
      if (this.rootItem) {
        this.rootItem.updatePinnedState(true);
        this._onDidChangeTreeData.fire(this.rootItem);
      }

      vscode.window.setStatusBarMessage('📌 Dependency view pinned', 3000);
    }
  }

  /**
   * Clear the pinned file
   */
  clearPin(): void {
    const wasOurFile = this.pinnedFile;
    this.pinnedFile = null;

    // Update context based on current active file
    const activeEditor = vscode.window.activeTextEditor;
    this.updatePinContext(activeEditor?.document.fileName);

    // Update root item visual state
    if (this.rootItem) {
      this.rootItem.updatePinnedState(false);
      this._onDidChangeTreeData.fire(this.rootItem);
    }

    // If we unpinned while viewing a different file, refresh to show that file
    if (activeEditor && activeEditor.document.fileName !== wasOurFile) {
      this.refresh();
    }
  }

  getTreeItem(element: DependencyTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: DependencyTreeItem): Promise<DependencyTreeItem[]> {
    if (!element) {
      // Root level: show active file's dependencies
      return this.getRootFiles();
    } else {
      // Show dependencies of this file
      return this.getDependencies(element.filePath);
    }
  }

  private async getRootFiles(): Promise<DependencyTreeItem[]> {
    // Use pinned file if available, otherwise use active editor
    let filePath: string | null = null;
    const activeEditor = vscode.window.activeTextEditor;

    if (this.pinnedFile) {
      // Verify pinned file still exists
      try {
        await fs.access(this.pinnedFile);
        filePath = this.pinnedFile;
      } catch {
        // Pinned file no longer exists - clear the pin
        console.log(`Pinned file no longer exists: ${this.pinnedFile}`);
        this.pinnedFile = null;
        this.updatePinContext(undefined);
        // Fall through to use active editor instead
      }
    }

    if (!filePath) {
      // Get the active editor
      // If no active editor or not an AHK file, show message
      if (!activeEditor || !activeEditor.document.fileName.endsWith('.ahk')) {
        return [{
          filePath: '',
          label: 'Open an .ahk file to view dependencies',
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          includes: [],
          unresolvedIncludes: [],
          iconPath: new vscode.ThemeIcon('info'),
          command: undefined,
          contextValue: 'info'
        } as any];
      }

      filePath = activeEditor.document.fileName;
    }

    // Update context to reflect if current file is pinned
    this.updatePinContext(activeEditor?.document.fileName);

    const depInfo = await this.analyzeDependencies(filePath);

    // Show the active/pinned file as root with its dependencies
    const fileName = path.basename(filePath);

    this.rootItem = new DependencyTreeItem(
      filePath,
      fileName,
      depInfo.resolvedIncludes.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
      depInfo.resolvedIncludes,
      depInfo.unresolvedIncludes
    );

    // Update pinned state if currently pinned, otherwise set as root item
    if (this.pinnedFile !== null) {
      this.rootItem.updatePinnedState(true);
    } else {
      this.rootItem.updatePinnedState(false);
    }

    return [this.rootItem];
  }

  private async getDependencies(filePath: string): Promise<DependencyTreeItem[]> {
    const depInfo = await this.analyzeDependencies(filePath);
    const items: DependencyTreeItem[] = [];

    for (const includePath of depInfo.resolvedIncludes) {
      const childDepInfo = await this.analyzeDependencies(includePath);
      const relativePath = this.workspaceRoot ?
        path.relative(this.workspaceRoot, includePath) :
        path.basename(includePath);

      items.push(new DependencyTreeItem(
        includePath,
        path.basename(includePath),
        childDepInfo.resolvedIncludes.length > 0
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None,
        childDepInfo.resolvedIncludes,
        childDepInfo.unresolvedIncludes
      ));
    }

    // Add unresolved includes with error icon
    for (const unresolvedPath of depInfo.unresolvedIncludes) {
      items.push(new DependencyTreeItem(
        unresolvedPath,
        `⚠️ ${unresolvedPath}`,
        vscode.TreeItemCollapsibleState.None,
        [],
        [unresolvedPath]
      ));
    }

    return items;
  }

  private async analyzeDependencies(filePath: string): Promise<DependencyInfo> {
    // Check cache first
    if (this.dependencyCache.has(filePath)) {
      return this.dependencyCache.get(filePath)!;
    }

    const depInfo: DependencyInfo = {
      resolvedIncludes: [],
      unresolvedIncludes: [],
      rawIncludes: []
    };

    try {
      // Check if file exists before trying to read it
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist - return empty dependency info
        // This can happen if a file was deleted but is still referenced
        console.log(`Skipping non-existent file: ${filePath}`);
        return depInfo;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const includes = this.parseIncludes(content);
      depInfo.rawIncludes = includes;

      for (const include of includes) {
        const resolved = await this.resolveInclude(include, filePath);
        if (resolved) {
          depInfo.resolvedIncludes.push(resolved);
        } else {
          depInfo.unresolvedIncludes.push(include);
        }
      }

      this.dependencyCache.set(filePath, depInfo);
    } catch (error) {
      // Only log actual read/parse errors, not file-not-found
      console.log(`Could not analyze dependencies for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return depInfo;
  }

  /**
   * Parse #Include directives from file content
   * Supports:
   * - #Include MyFile.ahk
   * - #Include "path/to/file.ahk"
   * - #Include <LibName>
   * - #Include %A_ScriptDir%\file.ahk
   */
  private parseIncludes(content: string): string[] {
    const includes: string[] = [];

    // Regex patterns for different include formats
    const patterns = [
      // #Include <LibName>
      /#Include\s+<([^>]+)>/gi,
      // #Include "quoted/path.ahk"
      /#Include\s+"([^"]+)"/gi,
      // #Include path.ahk (unquoted)
      /#Include\s+([^\s;]+\.ahk)/gi,
      // #Include %A_ScriptDir%\file.ahk or similar
      /#Include\s+%A_\w+%[\\/]([^\s;]+)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        includes.push(match[1].trim());
      }
    }

    return [...new Set(includes)]; // Remove duplicates
  }

  /**
   * Resolve an include path to an absolute file path
   * Cross-platform compatible
   */
  private async resolveInclude(includePath: string, sourceFile: string): Promise<string | null> {
    // Normalize path separators to forward slashes for cross-platform compatibility
    const normalizedInclude = includePath.replace(/\\/g, '/');
    const sourceDir = path.dirname(sourceFile);

    const candidates: string[] = [];

    // Case 1: Library include <LibName> - no path separators means it's a library reference
    const hasPathSeparator = normalizedInclude.includes('/');
    const isLibraryInclude = !hasPathSeparator && !path.isAbsolute(includePath);

    if (isLibraryInclude) {
      const libName = includePath.replace(/[<>]/g, '');
      const libFileName = libName.endsWith('.ahk') ? libName : `${libName}.ahk`;

      // Check workspace Lib folder FIRST (if we have a workspace)
      if (this.workspaceRoot) {
        candidates.push(path.join(this.workspaceRoot, 'Lib', libFileName));
      }

      // Also check relative to source file's Lib folder
      candidates.push(path.join(sourceDir, 'Lib', libFileName));

      // Check AutoHotkey installation Lib folders (platform-specific)
      if (process.platform === 'win32') {
        const programFiles = process.env['ProgramFiles'] || 'C:/Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)';

        candidates.push(
          path.join(programFiles, 'AutoHotkey', 'Lib', libFileName),
          path.join(programFilesX86, 'AutoHotkey', 'Lib', libFileName)
        );
      }
    }

    // Case 2: Relative path
    if (normalizedInclude.startsWith('.')) {
      candidates.push(path.resolve(sourceDir, normalizedInclude));
    }

    // Case 3: Absolute path
    if (path.isAbsolute(normalizedInclude)) {
      candidates.push(normalizedInclude);
    }

    // Case 4: Relative to source file directory
    candidates.push(path.join(sourceDir, normalizedInclude));

    // Case 5: Relative to workspace root (if we have a workspace)
    if (this.workspaceRoot) {
      candidates.push(path.join(this.workspaceRoot, normalizedInclude));
    }

    // Try each candidate
    for (const candidate of candidates) {
      try {
        await fs.access(candidate, fs.constants.R_OK);
        return candidate;
      } catch {
        // File doesn't exist or not readable, try next
      }
    }

    return null; // Could not resolve
  }

  dispose(): void {
    this.fileWatcher?.dispose();
  }
}

interface DependencyInfo {
  resolvedIncludes: string[];
  unresolvedIncludes: string[];
  rawIncludes: string[];
}
