import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * JSDoc metadata interface
 */
interface JSDocMetadata {
  file?: string;
  title?: string;
  fileoverview?: string;
  abstract?: string;
  description?: string;
  module?: string;
  author?: string;
  license?: string;
  version?: string;
  since?: string;
  date?: string;
  homepage?: string;
  repository?: string;
  link?: string[];
  see?: string[];
  keywords?: string;
  category?: string;
  'ahk-version'?: string;
  requires?: string[];
  imports?: string[];
  exports?: string[];
  entrypoint?: string;
  env?: string;
  permissions?: string;
  config?: string;
  arguments?: string;
  returns?: string;
  sideEffects?: string;
  examples?: string;
  bugs?: string;
  todo?: string[];
  changelog?: string;
  funding?: string;
  maintainer?: string;
  contributors?: string[];
  [key: string]: string | string[] | undefined;
}

interface ToolboxSettings {
  autoInsertHeaders?: boolean;
  defaultRequires?: string;
  defaultSingleInstance?: string;
  includeFormat?: string;
  libFolders?: string[];
}

interface ToolboxSettingsMessage {
  headerSettings?: {
    autoInsert: boolean;
    defaultRequires: string;
    singleInstance: string;
  };
  libFolderSettings?: {
    searchFolders: string[];
    includeFormat: string;
  };
}

interface ActiveFileInfo {
  isAhkFile: boolean;
  libraryName?: string;
  hasMetadata?: boolean;
  filePath?: string;
}

const enum WebviewMessageType {
  ExecuteCommand = 'executeCommand',
  EditActiveFileMetadata = 'editActiveFileMetadata',
  ShowMetadataEditor = 'showMetadataEditor',
  ShowSettings = 'showSettings',
  ShowMain = 'showMain',
  SaveMetadata = 'saveMetadata',
  SaveSettings = 'saveSettings',
  GetActiveFileInfo = 'getActiveFileInfo',
  ActiveFileInfo = 'activeFileInfo'
}

interface WebviewMessage {
  type: WebviewMessageType | string;
  command?: string;
  args?: any[];
  filePath?: string;
  metadata?: JSDocMetadata;
  settings?: ToolboxSettingsMessage;
  data?: ActiveFileInfo | null;
}

/**
 * Enhanced AHKv2 Toolbox sidebar webview provider
 * Supports multiple views: main toolbox, settings, metadata editor
 */
export class ToolboxSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ahkv2Toolbox';

  private _view?: vscode.WebviewView;
  private currentView: 'main' | 'settings' | 'metadata' = 'main';
  private currentFilePath?: string;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.html = this.getMainViewHtml();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
      try {
        switch (data.type) {
          case WebviewMessageType.ExecuteCommand:
            if (data.command) {
              await vscode.commands.executeCommand(data.command, ...(data.args || []));
            }
            break;
          case WebviewMessageType.EditActiveFileMetadata:
            await this.editActiveFileMetadata();
            break;
          case WebviewMessageType.ShowMetadataEditor:
            if (data.filePath) {
              await this.showMetadataEditor(data.filePath);
            }
            break;
          case WebviewMessageType.ShowSettings:
            await this.showSettings();
            break;
          case WebviewMessageType.ShowMain:
            this.showMainView();
            break;
          case WebviewMessageType.SaveMetadata:
            if (data.filePath && data.metadata) {
              await this.saveMetadata(data.filePath, data.metadata);
            }
            break;
          case WebviewMessageType.SaveSettings:
            if (data.settings) {
              await this.saveSettings(data.settings);
            }
            break;
          case WebviewMessageType.GetActiveFileInfo:
            await this.sendActiveFileInfo();
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Webview action failed: ${errorMessage}`);
      }
    });

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.sendActiveFileInfo();
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value).replace(/"/g, '&quot;');
  }

  /**
   * Edit metadata for the currently active file
   */
  public async editActiveFileMetadata() {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showErrorMessage('No active file open. Please open an AHK file first.');
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;

    // Check if it's an AHK file
    if (!filePath.endsWith('.ahk') && !filePath.endsWith('.ahk2')) {
      vscode.window.showWarningMessage('Please open an AutoHotkey (.ahk or .ahk2) file.');
      return;
    }

    await this.showMetadataEditor(filePath);
  }

  /**
   * Show metadata editor for a specific file
   */
  public async showMetadataEditor(filePath: string) {
    if (!this._view) {
      return;
    }

    this.currentView = 'metadata';
    this.currentFilePath = filePath;

    const metadata = await this.parseJSDoc(filePath);
    this._view.webview.html = this.getMetadataEditorHtml(metadata, filePath);
  }

  /**
   * Show settings view
   */
  public async showSettings() {
    if (!this._view) {
      return;
    }

    this.currentView = 'settings';

    // Load current settings from VS Code
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
    const currentSettings = {
      autoInsertHeaders: config.get('autoInsertHeaders', false),
      defaultRequires: config.get('defaultRequires', 'AutoHotkey v2.1'),
      defaultSingleInstance: config.get('defaultSingleInstance', 'Force'),
      includeFormat: config.get('includeFormat', 'Lib/{name}.ahk'),
      libFolders: config.get('libFolders', ['Lib', 'vendor'])
    };

    this._view.webview.html = this.getSettingsHtml(currentSettings);
  }

  /**
   * Show main toolbox view
   */
  public showMainView() {
    if (!this._view) {
      return;
    }

    this.currentView = 'main';
    this._view.webview.html = this.getMainViewHtml();
  }

  /**
   * Send active file info to webview
   */
  private async sendActiveFileInfo() {
    if (!this._view) {
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      this._view.webview.postMessage({
        type: 'activeFileInfo',
        data: null
      });
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;
    const isAhkFile = filePath.endsWith('.ahk') || filePath.endsWith('.ahk2');

    if (!isAhkFile) {
      this._view.webview.postMessage({
        type: 'activeFileInfo',
        data: null
      });
      return;
    }

    // Extract library name from file path
    const fileName = path.basename(filePath, path.extname(filePath));

    // Check if metadata exists
    const metadata = await this.parseJSDoc(filePath);
    const hasMetadata = Object.keys(metadata).length > 0;

    this._view.webview.postMessage({
      type: 'activeFileInfo',
      data: {
        isAhkFile: true,
        libraryName: fileName,
        hasMetadata: hasMetadata,
        filePath: filePath
      }
    });
  }

  /**
   * Parse JSDoc header from AHK file
   */
  private async parseJSDoc(filePath: string): Promise<JSDocMetadata> {
    try {
      // Check if file exists before trying to read it
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, return empty metadata silently
        return {};
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      const metadata: JSDocMetadata = {};
      let inJSDoc = false;
      let currentTag: string | null = null;
      let foundFileTag = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Start of JSDoc block
        if (trimmed.startsWith('/**') || trimmed.startsWith('/***')) {
          inJSDoc = true;
          continue;
        }

        // End of JSDoc block
        if (trimmed.endsWith('*/') || trimmed.endsWith('***/')) {
          // If we found a @file tag, this is the file header - stop parsing
          if (foundFileTag) {
            break;
          }
          // Otherwise, reset and continue looking for file header
          inJSDoc = false;
          currentTag = null;
          continue;
        }

        if (!inJSDoc) {
          continue;
        }

        // Match JSDoc tag line: * @tagname: value or * @tagname value
        const tagMatch = trimmed.match(/^\*\s*@(\w+[-\w]*)\s*[:：]?\s*(.*)$/);
        if (tagMatch) {
          const tag = tagMatch[1];
          const value = tagMatch[2].trim();
          currentTag = tag;

          // Mark that we found the file header
          if (tag === 'file') {
            foundFileTag = true;
          }

          // Handle array-type tags
          if (['link', 'see', 'requires', 'imports', 'exports', 'todo', 'contributors'].includes(tag)) {
            if (!metadata[tag]) {
              metadata[tag] = [];
            }
            if (value) {
              (metadata[tag] as string[]).push(value);
            }
          } else {
            // Single-value tags
            metadata[tag] = value;
          }
        } else if (currentTag && trimmed.startsWith('*')) {
          // Continuation line (multi-line description)
          const continuationText = trimmed.replace(/^\*\s*/, '');

          if (continuationText) {
            // Append to existing tag value
            if (Array.isArray(metadata[currentTag])) {
              // For array tags, append to last item
              const arr = metadata[currentTag] as string[];
              if (arr.length > 0) {
                arr[arr.length - 1] += ' ' + continuationText;
              }
            } else if (metadata[currentTag]) {
              // For string tags, append with space or newline
              metadata[currentTag] += ' ' + continuationText;
            }
          }
        }
      }

      return metadata;
    } catch (error) {
      console.error('Failed to parse JSDoc:', error);
      return {};
    }
  }

  /**
   * Save metadata back to file
   */
  private async saveMetadata(filePath: string, metadata: JSDocMetadata) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      let jsdocStart = -1;
      let jsdocEnd = -1;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('/**') || trimmed.startsWith('/***')) {
          jsdocStart = i;
        }
        if (jsdocStart !== -1 && (trimmed.endsWith('*/') || trimmed.endsWith('***/'))) {
          jsdocEnd = i;
          break;
        }
      }

      const newJSDoc = this.generateJSDocHeader(metadata);

      let newContent: string;
      if (jsdocStart !== -1 && jsdocEnd !== -1) {
        const before = lines.slice(0, jsdocStart);
        const after = lines.slice(jsdocEnd + 1);
        newContent = [...before, ...newJSDoc.split('\n'), ...after].join('\n');
      } else {
        newContent = newJSDoc + '\n\n' + content;
      }

      // Check if document is open in editor
      const doc = vscode.workspace.textDocuments.find(d => d.fileName === filePath);

      if (doc) {
        // Document is open - edit through workspace API to handle dirty state
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          doc.lineAt(0).range.start,
          doc.lineAt(doc.lineCount - 1).range.end
        );
        edit.replace(doc.uri, fullRange, newContent);
        await vscode.workspace.applyEdit(edit);
        await doc.save();
      } else {
        // Document not open - write directly to disk
        await fs.writeFile(filePath, newContent, 'utf-8');
      }

      vscode.window.showInformationMessage('Metadata saved successfully!');
      this.showMainView();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save metadata: ${error}`);
    }
  }

  /**
   * Generate JSDoc header from metadata
   */
  private generateJSDocHeader(metadata: JSDocMetadata): string {
    const lines: string[] = [];
    lines.push('/************************************************************************');

    const tagOrder = [
      'file', 'title', 'fileoverview', 'abstract', 'description', 'module',
      'author', 'license', 'version', 'since', 'date', 'homepage', 'repository',
      'link', 'see', 'keywords', 'category', 'ahk-version', 'requires',
      'imports', 'exports', 'entrypoint', 'env', 'permissions', 'config',
      'arguments', 'returns', 'sideEffects', 'examples', 'bugs', 'todo',
      'changelog', 'funding', 'maintainer', 'contributors'
    ];

    for (const tag of tagOrder) {
      const value = metadata[tag];
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        for (const item of value) {
          lines.push(` * @${tag}: ${item}`);
        }
      } else {
        const valueLines = String(value).split('\n');
        if (valueLines.length === 1) {
          lines.push(` * @${tag}: ${value}`);
        } else {
          lines.push(` * @${tag}: ${valueLines[0]}`);
          for (let i = 1; i < valueLines.length; i++) {
            lines.push(` * ${valueLines[i]}`);
          }
        }
      }
    }

    lines.push(' ***********************************************************************/');
    return lines.join('\n');
  }

  /**
   * Save settings
   */
  private async saveSettings(settings: ToolboxSettingsMessage): Promise<void> {
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');

    try {
      if (settings.headerSettings) {
        await config.update('autoInsertHeaders', settings.headerSettings.autoInsert, vscode.ConfigurationTarget.Global);
        await config.update('defaultRequires', settings.headerSettings.defaultRequires, vscode.ConfigurationTarget.Global);
        await config.update('defaultSingleInstance', settings.headerSettings.singleInstance, vscode.ConfigurationTarget.Global);
      }

      if (settings.libFolderSettings) {
        await config.update('libFolders', settings.libFolderSettings.searchFolders, vscode.ConfigurationTarget.Global);
        await config.update('includeFormat', settings.libFolderSettings.includeFormat, vscode.ConfigurationTarget.Global);
      }

      vscode.window.showInformationMessage('Settings saved successfully!');
      this.showMainView();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to save settings: ${errorMessage}`);
    }
  }

  /**
   * Get common HTML template wrapper
   */
  private getHtmlTemplate(params: {
    title: string;
    additionalStyles?: string;
    bodyContent: string;
    scriptContent: string;
  }): string {
    if (!this._view) {
      throw new Error('Webview not initialized');
    }

    const toolkitUri = this._view.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js')
    );

    const cacheBuster = Date.now();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>${params.title} - ${cacheBuster}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
  <script type="module" src="${toolkitUri}"></script>
  <style>
    ${this.getCommonStyles()}
    ${params.additionalStyles || ''}
  </style>
</head>
<body>
  ${params.bodyContent}
  <script>
    const vscode = acquireVsCodeApi();
    ${params.scriptContent}
  </script>
</body>
</html>`;
  }

  /**
   * Get common CSS styles used across all views
   */
  private getCommonStyles(): string {
    return `
      body {
        padding: 0;
        margin: 0;
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
      }

      .menu-section {
        margin-bottom: 16px;
        padding: 8px 24px;
      }

      .section-header {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-sideBarTitle-foreground);
        margin: 0 0 12px 0;
        padding: 0;
        opacity: 0.8;
      }

      vscode-button {
        width: 100%;
        margin-bottom: 5px;
      }

      .button-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 7px 14px;
        align-items: stretch;
      }

      .button-grid vscode-button {
        width: 100%;
        height: 32px;
      }

      .button-stack {
        display: flex;
        flex-direction: column;
        row-gap: 7px;
      }

      .button-with-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 7px;
      }

      .button-with-info vscode-button {
        flex: 1;
        margin-bottom: 0;
      }

      .info-badge {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        white-space: nowrap;
        display: none;
      }
    `;
  }

  /**
   * Get main toolbox view HTML
   */
  private getMainViewHtml(): string {
    if (!this._view) {
      return '';
    }

    const toolkitUri = this._view.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js')
    );
    const cacheBuster = Date.now();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>AHKv2 Toolbox - ${cacheBuster}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
  <script type="module" src="${toolkitUri}"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      padding: 0;
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      line-height: 1.5;
      overflow-y: scroll;
      width: 100%;
      box-sizing: border-box;
    }

    /* Force consistent width regardless of scrollbar */
    .sidebar-content,
    .menu-section {
      box-sizing: border-box;
    }

    .sidebar-content {
      padding: 12px 0;
    }

    .menu-section {
      margin-bottom: 12px;
      padding: 0 24px;
    }

    .section-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #969696;
      margin: 0 0 12px 0;
      padding: 0;
    }

    /* 2x2 Grid layout for Script Converter */
    .button-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .button-grid vscode-button {
      width: 100%;
      height: 32px;
      margin: 0;
    }

    /* Button container: flex column with gap */
    .button-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .button-container vscode-button {
      margin: 0;
    }

    /* Button with info text layout */
    .button-with-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .button-with-info:last-child {
      margin-bottom: 0;
    }

    .button-with-info vscode-button {
      flex: 1 1 0;
      margin: 0;
      height: 32px;
      min-width: 0;
    }

    .info-badge {
      font-size: 13px;
      padding: 2px 12px 2px 6px;
      border-radius: 3px;
      background: #4d4d4d;
      color: #cccccc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
      flex: 1 1 0;
      text-align: right;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 0;
    }

    .info-badge.has-metadata {
      background: #1a7f37;
      color: #ffffff;
    }

    /* Darker button background - 12% darker than VS Code default */
    vscode-button {
      width: 100%;
      background: #2e2e2e;
      color: #cccccc;
      border: 1px solid #3c3c3c;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 400;
      text-align: center;
      cursor: pointer;
      border-radius: 2px;
      transition: background 0.1s ease;
      min-height: 28px;
    }

    vscode-button::part(control) {
      background: #2e2e2e;
      color: #cccccc;
      border: 1px solid #3c3c3c;
      font-size: 13px;
      font-weight: 400;
      padding: 6px 12px;
    }

    vscode-button:hover::part(control) {
      background: #2a2a2a;
    }

    vscode-button:active::part(control) {
      background: #242424;
    }

    vscode-button:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    .divider {
      height: 1px;
      background: #3c3c3c;
      margin: 12px 0;
    }

    vscode-divider {
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div class="sidebar-content">
    <section class="menu-section">
      <h3 class="section-header">Script Converter</h3>
      <div class="button-grid">
        <vscode-button appearance="secondary" id="convertNewTab">
          New Tab
        </vscode-button>
        <vscode-button appearance="secondary" id="convertDiff">
          Show Diff
        </vscode-button>
        <vscode-button appearance="secondary" id="convertReplace">
          Replace
        </vscode-button>
        <vscode-button appearance="secondary" id="convertBatch">
          Batch
        </vscode-button>
      </div>
    </section>

    <vscode-divider></vscode-divider>

    <section class="menu-section">
      <h3 class="section-header">Metadata</h3>
      <div class="button-with-info">
        <vscode-button appearance="secondary" id="extractMetadata" aria-label="Metadata - Extract: Button">
          Extract
        </vscode-button>
        <span
          class="info-badge"
          id="extractInfo"
          role="status"
          aria-live="polite"
          aria-label="Metadata - Extract: Text Box"
        ></span>
      </div>
    </section>

    <vscode-divider></vscode-divider>

    <section class="menu-section">
      <h3 class="section-header">Library Manager</h3>
      <div class="button-container">
        <vscode-button appearance="secondary" id="viewDependencies">
          View Dependencies
        </vscode-button>
        <vscode-button appearance="secondary" id="installPackage">
          Install Package
        </vscode-button>
        <vscode-button appearance="secondary" id="updatePackages">
          Update Packages
        </vscode-button>
      </div>
      <div class="button-with-info" style="margin-top: 7px;">
        <vscode-button appearance="secondary" id="editFileMetadata" aria-label="Library Manager - Edit Metadata: Button">
          Edit Metadata
        </vscode-button>
        <span
          class="info-badge"
          id="editInfo"
          role="status"
          aria-live="polite"
          aria-label="Library Manager - Edit Metadata: Text Box"
        ></span>
      </div>
    </section>

    <vscode-divider></vscode-divider>

    <section class="menu-section">
      <h3 class="section-header">Update Header</h3>
      <div class="button-container">
        <vscode-button appearance="secondary" id="updateHeader">
          Update Script Header
        </vscode-button>
        <vscode-button appearance="secondary" id="generateJSDoc">
          Generate JSDoc Header
        </vscode-button>
      </div>
    </section>

    <vscode-divider></vscode-divider>

    <section class="menu-section">
      <h3 class="section-header">Settings</h3>
      <div class="button-grid">
        <vscode-button appearance="secondary" id="toolboxSettings">
          Toolbox
        </vscode-button>
        <vscode-button appearance="secondary" id="extensionSettings">
          Extension
        </vscode-button>
      </div>
    </section>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const actionMap = {
      'convertNewTab': { type: 'executeCommand', command: 'ahk.convertV1toV2' },
      'convertDiff': { type: 'executeCommand', command: 'ahk.convertV1toV2.diff' },
      'convertReplace': { type: 'executeCommand', command: 'ahk.convertV1toV2.replace' },
      'convertBatch': { type: 'executeCommand', command: 'ahk.convertV1toV2.batch' },
      'extractMetadata': { type: 'executeCommand', command: 'ahk.extractFunctionMetadata' },
      'editFileMetadata': { type: 'editActiveFileMetadata' },
      'viewDependencies': { type: 'executeCommand', command: 'workbench.view.extension.ahkv2-toolbox' },
      'installPackage': { type: 'executeCommand', command: 'ahkPackageManager.installPackage' },
      'updatePackages': { type: 'executeCommand', command: 'ahkPackageManager.updatePackage' },
      'updateHeader': { type: 'executeCommand', command: 'ahk.updateHeader' },
      'generateJSDoc': { type: 'executeCommand', command: 'ahkPackageManager.generateJSDocHeader' },
      'toolboxSettings': { type: 'showSettings' },
      'extensionSettings': { type: 'executeCommand', command: 'workbench.action.openSettings', args: ['@ext:TrueCrimeAudit.ahkv2-toolbox'] }
    };

    document.querySelectorAll('vscode-button').forEach(button => {
      button.addEventListener('click', () => {
        const action = actionMap[button.id];
        if (action) {
          vscode.postMessage(action);
        }
      });
    });

    // Request active file info on load
    vscode.postMessage({ type: 'getActiveFileInfo' });

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'activeFileInfo') {
        updateFileInfo(message.data);
      }
    });

    function updateFileInfo(fileInfo) {
      const extractInfo = document.getElementById('extractInfo');
      const editInfo = document.getElementById('editInfo');

      // Helper function to truncate filename
      function truncateFilename(filename, maxLength = 15) {
        if (filename.length <= maxLength) {
          return filename;
        }
        // Remove .ahk extension for truncation
        const nameWithoutExt = filename.replace('.ahk', '');
        const truncated = nameWithoutExt.substring(0, maxLength - 3) + '...';
        return truncated;
      }

      if (fileInfo && fileInfo.isAhkFile) {
        // Show library name with .ahk extension (truncated)
        if (fileInfo.libraryName) {
          const fullName = fileInfo.libraryName + '.ahk';
          const displayName = truncateFilename(fullName);

          extractInfo.textContent = displayName;
          extractInfo.style.display = 'flex';
          extractInfo.title = fullName; // Tooltip shows full name

          // Show same name in Edit badge with metadata status indicator
          if (fileInfo.hasMetadata) {
            editInfo.textContent = displayName;
            editInfo.classList.add('has-metadata');
          } else {
            editInfo.textContent = displayName;
            editInfo.classList.remove('has-metadata');
          }
          editInfo.style.display = 'flex';
          editInfo.title = fullName; // Tooltip shows full name
        } else {
          extractInfo.textContent = '';
          extractInfo.style.display = 'flex';
          editInfo.textContent = '';
          editInfo.style.display = 'flex';
        }
      } else {
        // Keep both badges visible but empty to maintain button width
        extractInfo.textContent = '';
        extractInfo.style.display = 'flex';
        editInfo.textContent = '';
        editInfo.style.display = 'flex';
      }
    }
  </script>
</body>
</html>`;
  }

  /**
   * Get settings view HTML
   */
  private getSettingsHtml(settings: ToolboxSettings): string {
    if (!this._view) {
      return '';
    }

    // Get the toolkit URI
    const toolkitUri = this._view.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
  <script type="module" src="${toolkitUri}"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      padding: 0;
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      line-height: 1.5;
      overflow-y: scroll;
      width: 100%;
      box-sizing: border-box;
    }

    /* Force consistent width regardless of scrollbar */
    .sidebar-content,
    .menu-section {
      box-sizing: border-box;
    }

    .header {
      padding: 12px 16px;
      background: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
      display: flex;
      align-items: center;
      gap: 4px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header h2 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-sideBarTitle-foreground);
      flex: 1;
    }

    vscode-button[appearance="icon"] {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    vscode-button[appearance="icon"]::part(control) {
      background: transparent;
      border: none;
      padding: 0;
      transition: background 0.1s ease;
    }

    vscode-button[appearance="icon"]:hover::part(control) {
      background: rgba(255, 255, 255, 0.1);
    }

    vscode-button[appearance="icon"]:active::part(control) {
      background: rgba(255, 255, 255, 0.05);
    }

    .settings-container {
      padding: 12px 0;
    }

    .settings-section {
      margin-bottom: 12px;
      padding: 0 24px;
    }

    /* Match mockup section headers: 11px, uppercase, #969696 */
    .section-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #969696;
      margin: 0 0 12px 0;
      padding: 0;
    }

    .setting-row {
      margin-bottom: 12px;
    }

    .setting-label {
      font-weight: 500;
      font-size: 12px;
      color: var(--vscode-foreground);
      margin-bottom: 6px;
      display: block;
    }

    .setting-control {
      width: 100%;
    }

    .setting-description {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
      line-height: 1.4;
      opacity: 0.8;
    }

    .checkbox-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 12px;
    }

    .checkbox-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    /* Native HTML form controls */
    input[type="text"],
    select {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, #3e3e42);
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      border-radius: 2px;
      height: 26px;
      transition: border-color 0.15s ease, outline 0.15s ease;
      box-sizing: border-box;
    }

    select {
      cursor: pointer;
      padding: 2px 8px;
    }

    input[type="text"]:focus,
    select:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
      border-color: var(--vscode-focusBorder);
    }

    input[type="text"]::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      margin-top: 2px;
      accent-color: var(--vscode-focusBorder);
    }

    .checkbox-row label {
      cursor: pointer;
      font-size: 12px;
      line-height: 1.4;
    }

    /* Divider styling to match mockup */
    .divider {
      height: 1px;
      background: #3c3c3c;
      margin: 12px 0;
    }

    vscode-divider {
      margin: 12px 0;
      border-top: 1px solid var(--vscode-widget-border, #3c3c3c);
    }

    vscode-divider::part(root) {
      border-color: var(--vscode-widget-border, #3c3c3c);
    }

    /* Button group with vertical stack */
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 16px;
    }

    .button-group vscode-button {
      width: 100%;
      height: 32px;
      margin: 0;
    }

    /* Match button styling from mockup */
    vscode-button::part(control) {
      background: #2e2e2e;
      color: #cccccc;
      border: 1px solid #3c3c3c;
      font-size: 13px;
      font-weight: 400;
      padding: 6px 12px;
      height: 32px;
    }

    vscode-button:hover::part(control) {
      background: #2a2a2a;
    }

    vscode-button:active::part(control) {
      background: #242424;
    }

    vscode-button[appearance="primary"]::part(control) {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
    }

    vscode-button[appearance="primary"]:hover::part(control) {
      background: var(--vscode-button-hoverBackground);
    }

    /* Link styling for Popular Libraries */
    .library-link {
      display: block;
      margin-bottom: 12px;
    }

    .library-url {
      font-size: 12px;
      display: block;
      margin-top: 4px;
      margin-bottom: 2px;
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      cursor: pointer;
    }

    .library-url:hover {
      color: var(--vscode-textLink-activeForeground);
      text-decoration: underline;
    }

    .library-link .setting-description {
      margin-top: 2px;
      margin-left: 0;
    }

    /* Custom styling for back button */
    .back-btn {
      --button-padding-horizontal: 8px;
      --button-padding-vertical: 4px;
    }

    /* Native HTML button styling */
    button.button-primary,
    button.button-secondary {
      width: 100%;
      height: 32px;
      margin: 0;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 400;
      font-family: inherit;
      text-align: center;
      cursor: pointer;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.1s ease;
      border: none;
    }

    button.button-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    button.button-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button.button-primary:active {
      background: var(--vscode-button-background);
      opacity: 0.9;
    }

    button.button-secondary {
      background: #2e2e2e;
      color: #cccccc;
      border: 1px solid #3c3c3c;
    }

    button.button-secondary:hover {
      background: #2a2a2a;
    }

    button.button-secondary:active {
      background: #242424;
    }
  </style>
</head>
<body>
  <div class="header">
    <vscode-button class="back-btn" appearance="icon" aria-label="Back to main" id="back-btn">
      <span slot="start" class="codicon codicon-arrow-left"></span>
    </vscode-button>
    <h2>Settings</h2>
  </div>

  <div class="settings-container">
    <!-- Header Configuration Section -->
    <section class="settings-section" role="region" aria-label="Header Configuration">
      <h3 class="section-header">Header Configuration</h3>

      <div class="setting-row checkbox-row">
        <input type="checkbox" id="auto-insert" ${settings.autoInsertHeaders ? 'checked' : ''}>
        <label for="auto-insert">Auto-insert headers when installing packages</label>
      </div>
      <div class="setting-description" style="margin-bottom: 12px;">
        Automatically adds #Requires and #Include directives to your script
      </div>

      <div class="setting-row">
        <label for="requires-version" class="setting-label">Default Version</label>
        <input
          type="text"
          id="requires-version"
          value="${settings.defaultRequires}"
          placeholder="e.g., AutoHotkey v2.1"
          class="setting-control">
        <div class="setting-description">
          Version string for #Requires directive
        </div>
      </div>

      <div class="setting-row">
        <label for="single-instance" class="setting-label">Single Instance Mode</label>
        <select id="single-instance" class="setting-control">
          <option value="Force" ${settings.defaultSingleInstance === 'Force' ? 'selected' : ''}>Force</option>
          <option value="Ignore" ${settings.defaultSingleInstance === 'Ignore' ? 'selected' : ''}>Ignore</option>
          <option value="Prompt" ${settings.defaultSingleInstance === 'Prompt' ? 'selected' : ''}>Prompt</option>
          <option value="Off" ${settings.defaultSingleInstance === 'Off' ? 'selected' : ''}>Off</option>
        </select>
        <div class="setting-description">
          Default #SingleInstance mode for new scripts
        </div>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Library Folders Section -->
    <section class="settings-section" role="region" aria-label="Library Folders">
      <h3 class="section-header">Library Folders</h3>

      <div class="setting-row">
        <label for="include-format" class="setting-label">Include Path Format</label>
        <input
          type="text"
          id="include-format"
          value="${settings.includeFormat}"
          placeholder="Lib/{name}.ahk"
          class="setting-control">
        <div class="setting-description">
          Template for #Include paths. Use {name} as placeholder for package name
        </div>
      </div>

      <div class="setting-row">
        <label for="lib-folders" class="setting-label">Search Folders</label>
        <input
          type="text"
          id="lib-folders"
          value="${settings.libFolders?.join(', ') || ''}"
          placeholder="Lib, vendor"
          class="setting-control">
        <div class="setting-description">
          Comma-separated list of library search folders (relative to workspace)
        </div>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Popular Libraries Section -->
    <section class="settings-section" role="region" aria-label="Popular Libraries">
      <h3 class="section-header">Popular AHK v2 Libraries</h3>

      <div class="setting-description" style="margin-bottom: 12px;">
        Quick access to commonly used AutoHotkey v2 libraries. Click to open in browser.
      </div>

      <div class="library-link">
        <div class="setting-label">JSON Parser</div>
        <a href="https://github.com/thqby/ahk2_lib" target="_blank" class="library-url">
          github.com/thqby/ahk2_lib
        </a>
        <div class="setting-description">
          JSON parsing and stringification for AHK v2
        </div>
      </div>

      <div class="library-link">
        <div class="setting-label">WinClip</div>
        <a href="https://github.com/Clip-AHK/WinClip-v2" target="_blank" class="library-url">
          github.com/Clip-AHK/WinClip-v2
        </a>
        <div class="setting-description">
          Advanced clipboard manipulation library
        </div>
      </div>

      <div class="library-link">
        <div class="setting-label">Socket</div>
        <a href="https://github.com/G33kDude/Socket.ahk" target="_blank" class="library-url">
          github.com/G33kDude/Socket.ahk
        </a>
        <div class="setting-description">
          TCP/UDP socket communication library
        </div>
      </div>

      <div class="library-link">
        <div class="setting-label">WebView2</div>
        <a href="https://github.com/thqby/ahk2_lib" target="_blank" class="library-url">
          github.com/thqby/ahk2_lib
        </a>
        <div class="setting-description">
          Microsoft Edge WebView2 control for AHK v2
        </div>
      </div>

      <div class="library-link">
        <div class="setting-label">Gdip</div>
        <a href="https://github.com/mmikeww/AHK-v2-Gdip" target="_blank" class="library-url">
          github.com/mmikeww/AHK-v2-Gdip
        </a>
        <div class="setting-description">
          GDI+ graphics library for advanced image manipulation
        </div>
      </div>
    </section>

    <div class="divider"></div>

    <!-- Action Buttons -->
    <section class="settings-section">
      <div class="button-group">
        <button id="save-btn" class="button-primary">
          Save Settings
        </button>
        <button id="reset-btn" class="button-secondary">
          Reset to Defaults
        </button>
      </div>
    </section>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Load saved settings
    window.addEventListener('load', () => {
      loadSettings();
    });

    function loadSettings() {
      // TODO: Load settings from extension storage
      // For now, using defaults
    }

    // Back button handler
    document.getElementById('back-btn').addEventListener('click', () => {
      vscode.postMessage({ type: 'showMain' });
    });

    // Save button handler
    document.getElementById('save-btn').addEventListener('click', () => {
      const settings = {
        headerSettings: {
          autoInsert: document.getElementById('auto-insert').checked,
          defaultRequires: document.getElementById('requires-version').value,
          singleInstance: document.getElementById('single-instance').value
        },
        libFolderSettings: {
          includeFormat: document.getElementById('include-format').value,
          searchFolders: document.getElementById('lib-folders').value.split(',').map(s => s.trim())
        }
      };

      vscode.postMessage({ type: 'saveSettings', settings });

      // Show feedback
      const saveBtn = document.getElementById('save-btn');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✓ Saved';
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 2000);
    });

    // Reset button handler
    document.getElementById('reset-btn').addEventListener('click', () => {
      document.getElementById('auto-insert').checked = false;
      document.getElementById('requires-version').value = 'AutoHotkey v2.1';
      document.getElementById('single-instance').value = 'Force';
      document.getElementById('include-format').value = 'Lib/{name}.ahk';
      document.getElementById('lib-folders').value = 'Lib, vendor';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          document.getElementById('save-btn').click();
        }
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Get metadata editor HTML (continued in next part due to length)
   */
  private getMetadataEditorHtml(metadata: JSDocMetadata, filePath: string): string {
    const toolkitUri = this._view!.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js')
    );

    const escapeAttr = (value?: string) => this.escapeAttribute(typeof value === 'string' ? value : '');
    const escapeText = (value?: string) => this.escapeHtml(typeof value === 'string' ? value : '');
    const escapeTextarea = (value?: string | string[]) => {
      if (Array.isArray(value)) {
        return this.escapeHtml(value.join('\n'));
      }
      return this.escapeHtml(typeof value === 'string' ? value : '');
    };

    const originalMetadataJson = JSON.stringify(metadata);
    const filePathJson = JSON.stringify(filePath);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit Metadata</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
  <script type="module" src="${toolkitUri}"></script>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      padding: 0;
      margin: 0;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background: var(--vscode-sideBar-background);
    }

    .header {
      padding: 12px 16px;
      background: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
      display: flex;
      align-items: center;
      gap: 4px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header h2 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-sideBarTitle-foreground);
      flex: 1;
    }

    vscode-button[appearance="icon"] {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    vscode-button[appearance="icon"]::part(control) {
      background: transparent;
      border: none;
      padding: 0;
      transition: background 0.1s ease;
    }

    vscode-button[appearance="icon"]:hover::part(control) {
      background: rgba(255, 255, 255, 0.1);
    }

    vscode-button[appearance="icon"]:active::part(control) {
      background: rgba(255, 255, 255, 0.05);
    }

    .file-path {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content {
      padding: 16px 24px 16px 16px;
      overflow-y: auto;
    }

    .section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .section:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    .field {
      margin-bottom: 12px;
    }

    .field-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
    }

    .field-input,
    .field-textarea,
    .field-select {
      width: 100%;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-sideBarSectionHeader-border);
      color: var(--vscode-input-foreground);
      border-radius: 3px;
      padding: 6px 8px;
      font-family: var(--vscode-font-family);
      font-size: 12px;
      transition: border 0.15s ease, box-shadow 0.15s ease;
    }

    .field-input:focus,
    .field-textarea:focus,
    .field-select:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .field-help {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    .file-info {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px 12px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      align-items: center;
    }

    .file-info-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
    }

    .file-info-path {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      color: var(--vscode-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    input[type="text"],
    input[type="url"],
    input[type="date"],
    textarea,
    select {
      width: 100%;
      padding: 6px 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-family: var(--vscode-font-family);
      font-size: 12px;
      transition: border 0.15s ease;
    }

    input[type="text"]:focus,
    input[type="url"]:focus,
    input[type="date"]:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    textarea {
      min-height: 60px;
      resize: vertical;
      font-family: var(--vscode-editor-font-family);
      line-height: 1.5;
    }

    select {
      cursor: pointer;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-sideBarSectionHeader-border);
      position: sticky;
      bottom: 0;
      background: var(--vscode-sideBar-background);
    }

    button {
      flex: 1;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.15s ease;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button:active {
      transform: translateY(1px);
    }

    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .help-text {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="header">
    <vscode-button appearance="icon" aria-label="Back to main" id="back-btn">
      <span class="codicon codicon-arrow-left"></span>
    </vscode-button>
    <h2>Edit Metadata</h2>
  </div>

  <div class="content">
    <div class="file-info">
      <div class="file-info-label">File:</div>
      <div class="file-info-path">${escapeText(filePath)}</div>
    </div>

    <div class="section">
      <div class="section-title">Basic Information</div>
      <div class="field">
        <label for="title" class="field-label">Title</label>
        <input type="text" id="title" class="field-input" value="${escapeAttr(metadata.title)}" placeholder="Short module title" />
      </div>
      <div class="field">
        <label for="description" class="field-label">Description</label>
        <textarea id="description" class="field-textarea" rows="3" placeholder="Full explanation of purpose and features">${escapeTextarea(metadata.description)}</textarea>
      </div>
      <div class="field">
        <label for="abstract" class="field-label">Abstract</label>
        <textarea id="abstract" class="field-textarea" rows="2" placeholder="1-2 sentence overview">${escapeTextarea(metadata.abstract)}</textarea>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Authorship</div>
      <div class="field">
        <label for="author" class="field-label">Author</label>
        <input type="text" id="author" class="field-input" value="${escapeAttr(metadata.author)}" placeholder="Name &lt;email&gt;" />
      </div>
      <div class="field">
        <label for="license" class="field-label">License</label>
        <input type="text" id="license" class="field-input" value="${escapeAttr(metadata.license)}" placeholder="MIT, GPL, etc." />
      </div>
    </div>

    <div class="section">
      <div class="section-title">Version Information</div>
      <div class="field">
        <label for="version" class="field-label">Version</label>
        <input type="text" id="version" class="field-input" value="${escapeAttr(metadata.version)}" placeholder="1.0.0" />
      </div>
      <div class="field">
        <label for="date" class="field-label">Date</label>
        <input type="date" id="date" class="field-input" value="${escapeAttr(metadata.date)}" />
      </div>
      <div class="field">
        <label for="since" class="field-label">Since</label>
        <input type="date" id="since" class="field-input" value="${escapeAttr(metadata.since)}" />
        <div class="field-help">First release date</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Links & References</div>
      <div class="field">
        <label for="repository" class="field-label">Repository</label>
        <input type="url" id="repository" class="field-input" value="${escapeAttr(metadata.repository)}" placeholder="https://github.com/user/repo" />
      </div>
      <div class="field">
        <label for="homepage" class="field-label">Homepage</label>
        <input type="url" id="homepage" class="field-input" value="${escapeAttr(metadata.homepage)}" placeholder="https://example.com" />
      </div>
    </div>

    <div class="section">
      <div class="section-title">Classification</div>
      <div class="field">
        <label for="category" class="field-label">Category</label>
        <select id="category" class="field-select">
          <option value="">Select category...</option>
          <option value="Automation" ${metadata.category === 'Automation' ? 'selected' : ''}>Automation</option>
          <option value="GUI" ${metadata.category === 'GUI' ? 'selected' : ''}>GUI</option>
          <option value="WinAPI" ${metadata.category === 'WinAPI' ? 'selected' : ''}>WinAPI</option>
          <option value="DevTools" ${metadata.category === 'DevTools' ? 'selected' : ''}>DevTools</option>
          <option value="Networking" ${metadata.category === 'Networking' ? 'selected' : ''}>Networking</option>
          <option value="FileSystem" ${metadata.category === 'FileSystem' ? 'selected' : ''}>FileSystem</option>
          <option value="DataParsing" ${metadata.category === 'DataParsing' ? 'selected' : ''}>DataParsing</option>
          <option value="Graphics" ${metadata.category === 'Graphics' ? 'selected' : ''}>Graphics</option>
        </select>
      </div>
      <div class="field">
        <label for="keywords" class="field-label">Keywords</label>
        <input type="text" id="keywords" class="field-input" value="${escapeAttr(metadata.keywords)}" placeholder="json, parsing, data, autohotkey" />
        <div class="field-help">Comma-separated topical terms</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Technical Details</div>
      <div class="field">
        <label for="ahkVersion" class="field-label">AHK Version</label>
        <input type="text" id="ahkVersion" class="field-input" value="${escapeAttr(metadata['ahk-version'])}" placeholder="v2.0+" />
      </div>
      <div class="field">
        <label for="requires" class="field-label">Requires</label>
        <textarea id="requires" class="field-textarea" rows="2" placeholder="Library files, DLLs, or external tools (one per line)">${escapeTextarea(metadata.requires)}</textarea>
      </div>
      <div class="field">
        <label for="exports" class="field-label">Exports</label>
        <textarea id="exports" class="field-textarea" rows="2" placeholder="Public classes, functions, hotkeys (one per line)">${escapeTextarea(metadata.exports)}</textarea>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="button-group">
      <vscode-button id="save-btn" appearance="primary">
        <span slot="start" class="codicon codicon-save"></span>
        Save Metadata
      </vscode-button>
      <vscode-button id="cancel-btn" appearance="secondary">
        Cancel
      </vscode-button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const originalMetadata = ${originalMetadataJson};
    const filePathValue = ${filePathJson};

    const backButton = document.getElementById('back-btn');
    backButton?.addEventListener('click', () => {
      vscode.postMessage({ type: 'showMain' });
    });

    const cancelButton = document.getElementById('cancel-btn');
    cancelButton?.addEventListener('click', () => {
      vscode.postMessage({ type: 'showMain' });
    });

    const saveButton = document.getElementById('save-btn');
    const getElementValue = (id) => {
      const element = document.getElementById(id);
      return element && 'value' in element ? element.value : '';
    };
    const getTrimmedValue = (id) => getElementValue(id).trim();
    const getMultilineValues = (id) => {
      const raw = getElementValue(id);
      if (!raw) {
        return [];
      }
      return raw
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    };
    const setValue = (target, key, value) => {
      if (value) {
        target[key] = value;
      } else {
        delete target[key];
      }
    };

    saveButton?.addEventListener('click', () => {
      const payload = { ...originalMetadata };

      setValue(payload, 'title', getTrimmedValue('title'));
      setValue(payload, 'description', getElementValue('description').trim());
      setValue(payload, 'abstract', getElementValue('abstract').trim());
      setValue(payload, 'author', getTrimmedValue('author'));
      setValue(payload, 'license', getTrimmedValue('license'));
      setValue(payload, 'version', getTrimmedValue('version'));
      setValue(payload, 'date', getTrimmedValue('date'));
      setValue(payload, 'since', getTrimmedValue('since'));
      setValue(payload, 'repository', getTrimmedValue('repository'));
      setValue(payload, 'homepage', getTrimmedValue('homepage'));
      setValue(payload, 'category', getElementValue('category'));
      setValue(payload, 'keywords', getTrimmedValue('keywords'));
      setValue(payload, 'ahk-version', getTrimmedValue('ahkVersion'));

      const requires = getMultilineValues('requires');
      const exportsValues = getMultilineValues('exports');

      if (requires.length) {
        payload.requires = requires;
      } else {
        delete payload.requires;
      }

      if (exportsValues.length) {
        payload.exports = exportsValues;
      } else {
        delete payload.exports;
      }

      vscode.postMessage({
        type: 'saveMetadata',
        filePath: filePathValue,
        metadata: payload
      });
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveButton?.click();
      }
    });
  </script>
</body>
</html>`;
  }
}


