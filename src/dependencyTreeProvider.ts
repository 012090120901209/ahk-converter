import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface DependencyMapSnapshot {
  rootFilePath: string;
  rootFileName: string;
  generatedAt: string;
  asciiTree: string;
  summary: {
    uniqueResolvedFiles: number;
    totalResolvedIncludes: number;
    unresolvedCount: number;
    unresolvedIncludes: string[];
    maxDepth: number;
    isPinnedRoot: boolean;
  };
}

type DependencySnapshotStats = {
  uniqueFiles: Set<string>;
  unresolved: Set<string>;
  totalResolvedEdges: number;
  maxDepth: number;
};

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

  public async captureSnapshot(): Promise<DependencyMapSnapshot | null> {
    const targetFile = await this.resolveSnapshotTargetFile();
    if (!targetFile) {
      return null;
    }

    const visited = new Set<string>([targetFile]);
    const lines: string[] = [`[Root] ${this.formatResolvedPath(targetFile)}`];
    const stats: DependencySnapshotStats = {
      uniqueFiles: new Set<string>([targetFile]),
      unresolved: new Set<string>(),
      totalResolvedEdges: 0,
      maxDepth: 0
    };

    await this.buildDependencyAscii(targetFile, '', visited, lines, stats, 0);

    return {
      rootFilePath: targetFile,
      rootFileName: path.basename(targetFile),
      generatedAt: new Date().toISOString(),
      asciiTree: lines.join('\n'),
      summary: {
        uniqueResolvedFiles: Math.max(0, stats.uniqueFiles.size - 1),
        totalResolvedIncludes: stats.totalResolvedEdges,
        unresolvedCount: stats.unresolved.size,
        unresolvedIncludes: Array.from(stats.unresolved).sort(),
        maxDepth: stats.maxDepth,
        isPinnedRoot: !!(this.pinnedFile && this.pinnedFile === targetFile)
      }
    };
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

    // Auto-expand if 5 or fewer dependencies, collapse if more
    const totalIncludes = depInfo.resolvedIncludes.length + depInfo.unresolvedIncludes.length;
    const collapsibleState = totalIncludes === 0
      ? vscode.TreeItemCollapsibleState.None
      : totalIncludes <= 5
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;

    this.rootItem = new DependencyTreeItem(
      filePath,
      fileName,
      collapsibleState,
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

      // Auto-expand if 5 or fewer dependencies, collapse if more
      const childTotalIncludes = childDepInfo.resolvedIncludes.length + childDepInfo.unresolvedIncludes.length;
      const childCollapsibleState = childTotalIncludes === 0
        ? vscode.TreeItemCollapsibleState.None
        : childTotalIncludes <= 5
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;

      items.push(new DependencyTreeItem(
        includePath,
        path.basename(includePath),
        childCollapsibleState,
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

    const lines = content.split('\n');
    for (const rawLine of lines) {
      const include = this.extractIncludePath(rawLine);
      if (include) {
        includes.push(include);
      }
    }

    return [...new Set(includes)]; // Remove duplicates
  }

  /**
   * Extract the include path from a single #Include directive line
   */
  private extractIncludePath(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed.toLowerCase().startsWith('#include')) {
      return null;
    }

    // Remove inline comments
    const withoutComments = trimmed.split(';')[0].trim();
    const pathPart = withoutComments.replace(/^#include/i, '').trim();
    if (!pathPart) {
      return null;
    }

    if (pathPart.startsWith('<') && pathPart.includes('>')) {
      const end = pathPart.indexOf('>') + 1;
      return pathPart.substring(0, end);
    }

    if (pathPart.startsWith('"')) {
      const endQuote = pathPart.indexOf('"', 1);
      if (endQuote > 0) {
        return pathPart.substring(1, endQuote).trim();
      }
      return pathPart.substring(1).trim();
    }

    return pathPart.split(/\s+/)[0];
  }

  /**
   * Normalize path separators to forward slashes
   */
  private normalizePathSeparators(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  private async resolveSnapshotTargetFile(): Promise<string | null> {
    if (this.pinnedFile) {
      try {
        await fs.access(this.pinnedFile);
        return this.pinnedFile;
      } catch {
        this.pinnedFile = null;
      }
    }

    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName.endsWith('.ahk')) {
      return editor.document.fileName;
    }

    return null;
  }

  private formatResolvedPath(filePath: string): string {
    if (this.workspaceRoot) {
      const relative = path.relative(this.workspaceRoot, filePath);
      if (relative && !relative.startsWith('..')) {
        return this.normalizePathSeparators(relative) || path.basename(filePath);
      }
    }
    return this.normalizePathSeparators(filePath);
  }

  private formattedUnresolvedPath(includePath: string): string {
    return this.normalizePathSeparators(includePath);
  }

  private async buildDependencyAscii(
    filePath: string,
    prefix: string,
    visited: Set<string>,
    lines: string[],
    stats: DependencySnapshotStats,
    depth: number
  ): Promise<void> {
    const depInfo = await this.analyzeDependencies(filePath);
    const entries = [
      ...depInfo.resolvedIncludes.map(path => ({ type: 'resolved' as const, path })),
      ...depInfo.unresolvedIncludes.map(path => ({ type: 'unresolved' as const, path }))
    ];

    if (entries.length === 0) {
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      if (entry.type === 'resolved') {
        const displayPath = this.formatResolvedPath(entry.path);
        const alreadySeen = visited.has(entry.path);

        stats.totalResolvedEdges += 1;
        stats.uniqueFiles.add(entry.path);
        stats.maxDepth = Math.max(stats.maxDepth, depth + 1);

        if (alreadySeen) {
          lines.push(`${prefix}${connector}[Loop] ${displayPath}`);
          continue;
        }

        lines.push(`${prefix}${connector}[Inc] ${displayPath}`);
        visited.add(entry.path);
        await this.buildDependencyAscii(entry.path, prefix + childPrefix, visited, lines, stats, depth + 1);
        visited.delete(entry.path);
      } else {
        const displayPath = this.formattedUnresolvedPath(entry.path);
        stats.unresolved.add(displayPath);
        lines.push(`${prefix}${connector}[Missing] ${displayPath}`);
      }
    }
  }

  /**
   * Resolve an include path to an absolute file path
   * Cross-platform compatible
   */
  private async resolveInclude(includePath: string, sourceFile: string): Promise<string | null> {
    // Normalize path separators to forward slashes for cross-platform compatibility
    const normalizedInclude = this.normalizePathSeparators(includePath);
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
