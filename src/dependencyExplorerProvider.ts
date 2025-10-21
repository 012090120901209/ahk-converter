import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents a dependency relationship between AHK files
 */
interface DependencyNode {
  filePath: string;
  fileName: string;
  dependencies: DependencyNode[];
  isResolved: boolean;
  error?: string;
}

/**
 * Provides a webview-based dependency explorer for AutoHotkey files
 */
export class DependencyExplorerProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ahkDependencyExplorer';

  private _view?: vscode.WebviewView;
  private _fileWatcher?: vscode.FileSystemWatcher;
  private _dependencyGraph: Map<string, DependencyNode> = new Map();
  private _entryPoints: string[] = [];
  private _refreshTimeout?: NodeJS.Timeout;
  private _isRefreshing: boolean = false;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'openFile':
          await this._openFile(data.filePath);
          break;
        case 'createMissingFile':
          await this._createMissingFile(data.filePath, data.sourceFile);
          break;
        case 'searchForFile':
          await this._searchForFile(data.fileName);
          break;
        case 'refresh':
          this.refresh();
          break;
      }
    });

    // Set up file watcher for real-time updates
    this._setupFileWatcher();

    // Listen for active editor changes to update dependency view
    this._context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.refresh();
      })
    );

    // Initial scan
    this.refresh();
  }

  /**
   * Refresh the dependency graph with debouncing to prevent rapid-fire refreshes
   */
  public refresh() {
    // Don't refresh if view isn't ready
    if (!this._view) {
      return;
    }

    // Clear existing timeout
    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
    }

    // Debounce refresh calls (wait 300ms after last call)
    this._refreshTimeout = setTimeout(async () => {
      // Prevent concurrent refreshes
      if (this._isRefreshing) {
        return;
      }

      // Double-check view is still available
      if (!this._view) {
        return;
      }

      this._isRefreshing = true;
      try {
        await this._scanWorkspace();
        this._updateWebview();
      } catch (error) {
        console.error('Error during refresh:', error);
      } finally {
        this._isRefreshing = false;
      }
    }, 300);
  }

  /**
   * Scan workspace for .ahk file dependencies
   * Finds all entry-point files (files not included by others) and their dependencies
   */
  private async _scanWorkspace() {
    this._dependencyGraph.clear();

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return;
    }

    try {
      const workspaceFolder = vscode.workspace.workspaceFolders[0];

      // Find all .ahk files in the workspace
      const ahkFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, '**/*.ahk'),
        '**/node_modules/**'
      );

      console.log(`[DependencyExplorer] Found ${ahkFiles.length} .ahk files in workspace`);

      if (ahkFiles.length === 0) {
        console.warn('[DependencyExplorer] No .ahk files found in workspace');
        return;
      }

      // Process all files to build complete dependency graph
      for (const fileUri of ahkFiles) {
        await this._processFile(fileUri);
      }

      // Identify entry-point files (files not included by others)
      const allFiles = new Set(ahkFiles.map(uri => uri.fsPath));
      const includedFiles = new Set<string>();

      // Collect all files that are included by others
      for (const [filePath, node] of this._dependencyGraph.entries()) {
        for (const dep of node.dependencies) {
          if (dep.isResolved) {
            includedFiles.add(dep.filePath);
          }
        }
      }

      // Mark entry points (files not included by others)
      this._entryPoints = Array.from(allFiles).filter(file => !includedFiles.has(file));

      console.log(`[DependencyExplorer] Identified ${this._entryPoints.length} entry points`);

      // Edge case: if all files are part of circular dependencies, show all files
      if (this._entryPoints.length === 0 && allFiles.size > 0) {
        console.warn('[DependencyExplorer] No entry points found - possible circular dependencies. Showing all files.');
        this._entryPoints = Array.from(allFiles);
      }

      // If we have an active editor, prioritize showing it first
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.fileName.endsWith('.ahk')) {
        const activeFile = activeEditor.document.uri.fsPath;
        console.log(`[DependencyExplorer] Active file: ${path.basename(activeFile)}`);
        // Move active file to front if it's an entry point
        const index = this._entryPoints.indexOf(activeFile);
        if (index > 0) {
          this._entryPoints.splice(index, 1);
          this._entryPoints.unshift(activeFile);
          console.log(`[DependencyExplorer] Moved active file to front of list`);
        } else if (index === -1) {
          console.warn(`[DependencyExplorer] Active file not in entry points (it's included by another file)`);
        }
      }

      console.log(`[DependencyExplorer] Final entry points:`, this._entryPoints.map(f => path.basename(f)));
    } catch (error) {
      console.error('Error scanning workspace:', error);
    }
  }

  /**
   * Process a single .ahk file to extract its dependencies
   */
  private async _processFile(fileUri: vscode.Uri): Promise<DependencyNode> {
    const filePath = fileUri.fsPath;

    // Check if already processed
    if (this._dependencyGraph.has(filePath)) {
      return this._dependencyGraph.get(filePath)!;
    }

    console.log(`[DependencyExplorer] Processing: ${path.basename(filePath)}`);

    // Create node
    const node: DependencyNode = {
      filePath,
      fileName: path.basename(filePath),
      dependencies: [],
      isResolved: false
    };

    this._dependencyGraph.set(filePath, node);

    try {
      // Check if this is actually a file (not a directory)
      const fileStat = await vscode.workspace.fs.stat(fileUri);
      if (fileStat.type === vscode.FileType.Directory) {
        console.warn(`[DependencyExplorer] Skipping directory: ${filePath}`);
        node.error = 'Path is a directory, not a file';
        return node;
      }

      // Read file content
      const content = await vscode.workspace.fs.readFile(fileUri);
      const text = Buffer.from(content).toString('utf8');

      // Parse dependencies
      const includePaths = this._parseIncludes(text, filePath);
      console.log(`[DependencyExplorer] Found ${includePaths.length} includes in ${path.basename(filePath)}:`, includePaths);

      // Resolve each include
      for (const includePath of includePaths) {
        try {
          const resolvedPath = await this._resolveIncludePath(includePath, filePath);
          if (resolvedPath) {
            const depUri = vscode.Uri.file(resolvedPath);
            // Recursively process dependency (avoid circular references)
            if (!this._dependencyGraph.has(resolvedPath)) {
              const depNode = await this._processFile(depUri);
              node.dependencies.push(depNode);
            } else {
              // Already processed, just link to it
              const existingNode = this._dependencyGraph.get(resolvedPath)!;
              node.dependencies.push(existingNode);
            }
          } else {
            // Unresolved include
            node.dependencies.push({
              filePath: includePath,
              fileName: path.basename(includePath),
              dependencies: [],
              isResolved: false,
              error: 'File not found'
            });
          }
        } catch (error) {
          console.error(`Error processing include ${includePath}:`, error);
        }
      }

      node.isResolved = true;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      node.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return node;
  }

  /**
   * Parse #Include directives from AHK file content
   */
  private _parseIncludes(content: string, sourceFile: string): string[] {
    const includes: string[] = [];
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith(';')) {
        continue;
      }

      // Match #Include <LibName>
      const libMatch = line.match(/^\s*#Include\s+<([^>]+)>/i);
      if (libMatch) {
        const libName = libMatch[1].trim();
        includes.push(`Lib\\${libName}.ahk`);
        continue;
      }

      // Match #Include "path" or #Include path
      const pathMatch = line.match(/^\s*#Include\s+(?:"([^"]+)"|(\S+))/i);
      if (pathMatch) {
        const includePath = (pathMatch[1] || pathMatch[2]).trim();

        // Filter out invalid characters or code snippets
        if (includePath &&
            !includePath.includes('(') &&
            !includePath.includes(')') &&
            !includePath.includes('{') &&
            !includePath.includes('`') &&
            includePath.length < 260) {
          includes.push(includePath);
        }
      }
    }

    return includes;
  }

  /**
   * Resolve an include path to an absolute file system path
   */
  private async _resolveIncludePath(includePath: string, sourceFilePath: string): Promise<string | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    // Handle different include path formats
    let candidatePaths: string[] = [];

    // Relative to source file
    const sourceDir = path.dirname(sourceFilePath);
    candidatePaths.push(path.resolve(sourceDir, includePath));

    // Try with .ahk extension if not present
    if (!includePath.toLowerCase().endsWith('.ahk')) {
      candidatePaths.push(path.resolve(sourceDir, includePath + '.ahk'));
    }

    // Relative to workspace
    candidatePaths.push(path.join(workspaceFolder.uri.fsPath, includePath));

    // Try workspace path with .ahk extension
    if (!includePath.toLowerCase().endsWith('.ahk')) {
      candidatePaths.push(path.join(workspaceFolder.uri.fsPath, includePath + '.ahk'));
    }

    // Lib folder (for <LibName> style includes)
    if (includePath.startsWith('Lib\\')) {
      candidatePaths.push(path.join(workspaceFolder.uri.fsPath, includePath));
      if (!includePath.toLowerCase().endsWith('.ahk')) {
        candidatePaths.push(path.join(workspaceFolder.uri.fsPath, includePath + '.ahk'));
      }
    }

    // Try each candidate path
    for (const candidatePath of candidatePaths) {
      try {
        const uri = vscode.Uri.file(candidatePath);
        const stat = await vscode.workspace.fs.stat(uri);

        // Only return if it's a file, not a directory
        if (stat.type === vscode.FileType.File) {
          return candidatePath;
        }
      } catch {
        // File doesn't exist, try next candidate
      }
    }

    return null; // Could not resolve
  }

  /**
   * Set up file watcher to auto-refresh on changes
   */
  private _setupFileWatcher() {
    if (this._fileWatcher) {
      this._fileWatcher.dispose();
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    this._fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, '**/*.ahk')
    );

    this._fileWatcher.onDidChange(() => this.refresh());
    this._fileWatcher.onDidCreate(() => this.refresh());
    this._fileWatcher.onDidDelete(() => this.refresh());
  }

  /**
   * Open a file in the editor
   */
  private async _openFile(filePath: string) {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
    }
  }

  /**
   * Create a missing dependency file
   */
  private async _createMissingFile(filePath: string, sourceFile: string) {
    try {
      const uri = vscode.Uri.file(filePath);
      const dirPath = path.dirname(filePath);

      // Create directory if it doesn't exist
      try {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
      } catch {
        // Directory might already exist
      }

      // Create the file with a basic template
      const fileName = path.basename(filePath, '.ahk');
      const template = `#Requires AutoHotkey v2.0
; ${fileName}
; Auto-generated dependency file

; Add your code here
`;

      const edit = new vscode.WorkspaceEdit();
      edit.createFile(uri, { ignoreIfExists: true });
      await vscode.workspace.applyEdit(edit);

      // Write template content
      const writeEdit = new vscode.WorkspaceEdit();
      writeEdit.insert(uri, new vscode.Position(0, 0), template);
      await vscode.workspace.applyEdit(writeEdit);

      // Open the file
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(`Created: ${path.basename(filePath)}`);

      // Refresh the dependency view
      this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create file: ${error}`);
    }
  }

  /**
   * Search for a file in the workspace
   */
  private async _searchForFile(fileName: string) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      // Search for files with similar names
      const pattern = `**/*${fileName}*`;
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, pattern),
        '**/node_modules/**',
        10
      );

      if (files.length === 0) {
        vscode.window.showInformationMessage(`No files found matching: ${fileName}`);
        return;
      }

      // Show quick pick to select from found files
      const items = files.map(uri => ({
        label: path.basename(uri.fsPath),
        description: vscode.workspace.asRelativePath(uri),
        uri
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Found ${files.length} file(s) matching "${fileName}"`,
        title: 'Select file to open'
      });

      if (selected) {
        const document = await vscode.workspace.openTextDocument(selected.uri);
        await vscode.window.showTextDocument(document);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Search failed: ${error}`);
    }
  }

  /**
   * Update the webview with current dependency graph
   */
  private _updateWebview() {
    if (!this._view || !this._view.webview) {
      return;
    }

    try {
      // Get all entry point nodes
      let rootNodes: DependencyNode[] = [];

      for (const entryPoint of this._entryPoints) {
        const node = this._dependencyGraph.get(entryPoint);
        if (node) {
          rootNodes.push(node);
        }
      }

      // If no entry points found, show empty
      if (rootNodes.length === 0) {
        this._view.webview.postMessage({
          type: 'update',
          dependencies: []
        });
        return;
      }

      // Serialize nodes with depth limit to prevent excessive data
      const serializedData = rootNodes.map(node =>
        this._serializeNode(node, new Set(), 0, 5) // Max depth of 5
      );

      // Check size before sending (limit to 10MB JSON string)
      let jsonString: string;
      try {
        jsonString = JSON.stringify(serializedData);
      } catch (stringifyError: any) {
        console.error('Failed to stringify dependency data:', stringifyError.message);
        // Send ultra-simplified version if stringify fails
        const simplified = rootNodes.slice(0, 10).map(node => ({
          filePath: node.filePath,
          fileName: node.fileName,
          dependencies: [],
          isResolved: true,
          error: 'Dependency tree too complex - showing top 10 files only'
        }));

        this._view.webview.postMessage({
          type: 'update',
          dependencies: simplified
        });
        return;
      }

      if (jsonString.length > 10 * 1024 * 1024) {
        console.warn('Dependency graph too large, truncating...');
        // Send simplified version
        const simplified = rootNodes.map(node => ({
          filePath: node.filePath,
          fileName: node.fileName,
          dependencies: [],
          isResolved: node.isResolved,
          error: 'Dependency tree too large to display fully'
        }));

        this._view.webview.postMessage({
          type: 'update',
          dependencies: simplified
        });
        return;
      }

      this._view.webview.postMessage({
        type: 'update',
        dependencies: serializedData
      });
    } catch (error) {
      console.error('Error updating dependency explorer webview:', error);
      // Show error state in webview
      if (this._view && this._view.webview) {
        this._view.webview.postMessage({
          type: 'update',
          dependencies: []
        });
      }
    }
  }

  /**
   * Serialize a dependency node to prevent circular references and limit depth
   */
  private _serializeNode(
    node: DependencyNode,
    visited: Set<string>,
    depth: number,
    maxDepth: number
  ): any {
    // Create basic node info
    const simplified: any = {
      filePath: node.filePath,
      fileName: node.fileName,
      isResolved: node.isResolved,
      dependencies: []
    };

    // Add error if present
    if (node.error) {
      simplified.error = node.error;
    }

    // Check depth limit
    if (depth >= maxDepth) {
      simplified.error = node.error || `Max depth (${maxDepth}) reached`;
      return simplified;
    }

    // Check for circular reference
    if (visited.has(node.filePath)) {
      simplified.error = 'Circular dependency';
      return simplified;
    }

    // Mark as visited
    visited.add(node.filePath);

    // Recursively serialize dependencies
    if (node.dependencies && node.dependencies.length > 0) {
      simplified.dependencies = node.dependencies.map(dep =>
        this._serializeNode(dep, new Set(visited), depth + 1, maxDepth)
      );
    }

    return simplified;
  }

  /**
   * Generate HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>AHK Dependencies</title>
  <style>
    body {
      padding: 0;
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: transparent;
    }

    .container {
      padding: 10px;
      background: transparent;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-widget-border);
    }

    .title {
      font-weight: 600;
      font-size: 13px;
      color: var(--vscode-foreground);
    }

    .refresh-btn {
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 16px;
      opacity: 0.8;
    }

    .refresh-btn:hover {
      background-color: var(--vscode-toolbar-hoverBackground);
      opacity: 1;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--vscode-descriptionForeground);
      background: transparent;
      border: none;
    }

    .dependency-tree {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .dependency-item {
      margin: 0;
      padding: 0;
    }

    .dependency-node {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 3px;
      user-select: none;
    }

    .dependency-node:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .dependency-node.error {
      opacity: 0.8;
    }

    .icon {
      margin-right: 6px;
      font-size: 16px;
      opacity: 0.9;
    }

    .file-name {
      flex: 1;
      font-size: 13px;
      color: var(--vscode-foreground);
    }

    .error-badge {
      font-size: 10px;
      background-color: transparent;
      color: var(--vscode-errorForeground);
      padding: 2px 6px;
      border-radius: 3px;
      margin-left: 6px;
      border: 1px solid var(--vscode-errorForeground);
      opacity: 0.8;
    }

    .nested {
      padding-left: 20px;
      margin-top: 4px;
    }

    .toggle-icon {
      margin-right: 4px;
      cursor: pointer;
      user-select: none;
      width: 16px;
      display: inline-block;
      text-align: center;
    }

    .collapsed > .nested {
      display: none;
    }

    .dependency-count {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-left: 6px;
    }

    .missing-file-actions {
      display: inline-flex;
      gap: 4px;
      margin-left: 8px;
    }

    .action-btn {
      background: transparent;
      color: var(--vscode-textLink-foreground);
      border: 1px solid var(--vscode-textLink-foreground);
      border-radius: 3px;
      padding: 2px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
      opacity: 0.8;
    }

    .action-btn:hover {
      background: var(--vscode-textLink-foreground);
      color: var(--vscode-editor-background);
      opacity: 1;
    }

    .action-btn:active {
      transform: scale(0.95);
    }

    .dependency-node.error .file-name {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .stats-bar {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      padding: 8px 10px;
      border-top: 1px solid var(--vscode-widget-border);
      background: transparent;
    }

    .entry-point {
      font-weight: 600;
      color: var(--vscode-terminal-ansiGreen);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">Dependencies</div>
      <button class="refresh-btn" onclick="refresh()" title="Refresh">⟳</button>
    </div>
    <div id="content">
      <div class="empty-state">Open an .ahk file to view its #Include dependencies</div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function refresh() {
      vscode.postMessage({ type: 'refresh' });
    }

    function openFile(filePath) {
      vscode.postMessage({ type: 'openFile', filePath: filePath });
    }

    function toggleNode(element) {
      element.classList.toggle('collapsed');
    }

    function createMissingFile(filePath, sourceFile) {
      vscode.postMessage({ type: 'createMissingFile', filePath: filePath, sourceFile: sourceFile });
    }

    function searchForFile(fileName) {
      vscode.postMessage({ type: 'searchForFile', fileName: fileName });
    }

    function renderDependencyNode(node, level, parentFile) {
      level = level || 0;
      parentFile = parentFile || node.filePath;
      const hasChildren = node.dependencies && node.dependencies.length > 0;
      const toggleIcon = hasChildren ? '<span class="toggle-icon" onclick="toggleNode(this.parentElement.parentElement)">▼</span>' : '<span class="toggle-icon"></span>';

      let html = '<li class="dependency-item">';
      const errorClass = node.error ? ' error' : '';
      // Properly escape paths for HTML onclick attributes
      const escapedPath = node.filePath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const escapedParentPath = parentFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      // Different click handler based on whether file exists
      const clickHandler = node.error ? '' : 'onclick="openFile(\'' + escapedPath + '\')"';

      html += '<div class="dependency-node' + errorClass + '" ' + clickHandler;
      html += '  title="' + node.filePath + '"';
      html += '>';
      html += toggleIcon;
      html += '<span class="icon">📄</span>';
      html += '<span class="file-name">' + node.fileName + '</span>';

      if (hasChildren) {
        html += '<span class="dependency-count">(' + node.dependencies.length + ')</span>';
      }

      if (node.error) {
        const escapedError = (node.error + '').replace(/"/g, '&quot;');
        html += '<span class="error-badge" title="' + escapedError + '">!</span>';

        // Add action buttons for missing files
        html += '<div class="missing-file-actions">';
        html += '<button class="action-btn" onclick="event.stopPropagation(); createMissingFile(\'' + escapedPath + '\', \'' + escapedParentPath + '\')" title="Create this file">';
        html += '➕ Create</button>';
        html += '<button class="action-btn" onclick="event.stopPropagation(); searchForFile(\'' + node.fileName.replace(/'/g, "\\\\'") + '\')" title="Search for this file">';
        html += '🔍 Search</button>';
        html += '</div>';
      }

      html += '</div>';

      if (hasChildren) {
        html += '<ul class="dependency-tree nested">';
        for (let i = 0; i < node.dependencies.length; i++) {
          html += renderDependencyNode(node.dependencies[i], level + 1, node.filePath);
        }
        html += '</ul>';
      }

      html += '</li>';
      return html;
    }

    window.addEventListener('message', function(event) {
      const message = event.data;

      if (message.type === 'update') {
        const content = document.getElementById('content');

        if (!message.dependencies || message.dependencies.length === 0) {
          content.innerHTML = '<div class="empty-state">No .ahk files found in workspace.<br><br>Open a folder containing AutoHotkey scripts to view dependencies.</div>';
          return;
        }

        // Calculate statistics
        let totalFiles = message.dependencies.length;
        let totalDeps = 0;
        let missingDeps = 0;

        function countDeps(node) {
          if (node.dependencies) {
            totalDeps += node.dependencies.length;
            for (let dep of node.dependencies) {
              if (dep.error) missingDeps++;
              countDeps(dep);
            }
          }
        }

        for (let node of message.dependencies) {
          countDeps(node);
        }

        let html = '<ul class="dependency-tree">';
        for (let i = 0; i < message.dependencies.length; i++) {
          html += renderDependencyNode(message.dependencies[i], 0);
        }
        html += '</ul>';

        // Add statistics bar
        html += '<div class="stats-bar">';
        html += totalFiles + ' entry point' + (totalFiles !== 1 ? 's' : '') + ' • ';
        html += totalDeps + ' dependenc' + (totalDeps !== 1 ? 'ies' : 'y');
        if (missingDeps > 0) {
          html += ' • <span style="color: var(--vscode-errorForeground)">' + missingDeps + ' missing</span>';
        }
        html += '</div>';

        content.innerHTML = html;
      }
    });
  </script>
</body>
</html>`;
  }
}
