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
  [key: string]: any;
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
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'executeCommand':
          vscode.commands.executeCommand(data.command, ...(data.args || []));
          break;
        case 'editActiveFileMetadata':
          await this.editActiveFileMetadata();
          break;
        case 'showMetadataEditor':
          await this.showMetadataEditor(data.filePath);
          break;
        case 'showSettings':
          await this.showSettings();
          break;
        case 'showMain':
          this.showMainView();
          break;
        case 'saveMetadata':
          await this.saveMetadata(data.filePath, data.metadata);
          break;
        case 'saveSettings':
          await this.saveSettings(data.settings);
          break;
      }
    });
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
    this._view.webview.html = this.getSettingsHtml();
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
   * Parse JSDoc header from AHK file
   */
  private async parseJSDoc(filePath: string): Promise<JSDocMetadata> {
    try {
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

      await fs.writeFile(filePath, newContent, 'utf-8');

      const doc = vscode.workspace.textDocuments.find(d => d.fileName === filePath);
      if (doc) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          doc.uri,
          new vscode.Range(0, 0, doc.lineCount, 0),
          newContent
        );
        await vscode.workspace.applyEdit(edit);
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
  private async saveSettings(settings: any) {
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');

    try {
      if (settings.headerSettings) {
        await config.update('autoInsertHeaders', settings.headerSettings.autoInsert, vscode.ConfigurationTarget.Global);
        await config.update('headerOrder', settings.headerSettings.order, vscode.ConfigurationTarget.Global);
        await config.update('defaultRequires', settings.headerSettings.defaultRequires, vscode.ConfigurationTarget.Global);
        await config.update('defaultSingleInstance', settings.headerSettings.defaultSingleInstance, vscode.ConfigurationTarget.Global);
      }

      if (settings.libFolderSettings) {
        await config.update('libFolders', settings.libFolderSettings.folders, vscode.ConfigurationTarget.Global);
        await config.update('includeFormat', settings.libFolderSettings.includeFormat, vscode.ConfigurationTarget.Global);
      }

      if (settings.popularLibraries) {
        await config.update('popularLibraries', settings.popularLibraries, vscode.ConfigurationTarget.Global);
      }

      vscode.window.showInformationMessage('Settings saved successfully!');
      this.showMainView();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save settings: ${error}`);
    }
  }

  /**
   * Get main toolbox view HTML
   */
  private getMainViewHtml(): string {
    if (!this._view) {
      return '';
    }

    // Get the toolkit URI
    const toolkitUri = this._view.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js')
    );

    // Add cache-busting timestamp
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
      padding: 8px;
    }

    .section-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-sideBarTitle-foreground);
      margin: 0 0 8px 0;
      padding: 8px;
      opacity: 0.8;
    }

    vscode-button {
      width: 100%;
      margin-bottom: 4px;
    }

    vscode-divider {
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <section class="menu-section">
    <h3 class="section-header">Script Converter</h3>
    <vscode-button appearance="secondary" id="convertNewTab">
      <span slot="start" class="codicon codicon-new-file"></span>
      Convert to v2 (New Tab)
    </vscode-button>
    <vscode-button appearance="secondary" id="convertDiff">
      <span slot="start" class="codicon codicon-diff"></span>
      Convert to v2 (Show Diff)
    </vscode-button>
    <vscode-button appearance="secondary" id="convertReplace">
      <span slot="start" class="codicon codicon-replace"></span>
      Convert to v2 (Replace)
    </vscode-button>
    <vscode-button appearance="secondary" id="convertBatch">
      <span slot="start" class="codicon codicon-files"></span>
      Convert to v2 (Batch)
    </vscode-button>
  </section>

  <vscode-divider></vscode-divider>

  <section class="menu-section">
    <h3 class="section-header">Function Metadata</h3>
    <vscode-button appearance="secondary" id="extractMetadata">
      <span slot="start" class="codicon codicon-symbol-function"></span>
      Extract Metadata
    </vscode-button>
    <vscode-button appearance="secondary" id="editFileMetadata">
      <span slot="start" class="codicon codicon-edit"></span>
      Edit File Metadata
    </vscode-button>
  </section>

  <vscode-divider></vscode-divider>

  <section class="menu-section">
    <h3 class="section-header">Library Manager</h3>
    <vscode-button appearance="secondary" id="viewDependencies">
      <span slot="start" class="codicon codicon-list-tree"></span>
      View Dependencies
    </vscode-button>
    <vscode-button appearance="secondary" id="installPackage">
      <span slot="start" class="codicon codicon-cloud-download"></span>
      Install Package
    </vscode-button>
    <vscode-button appearance="secondary" id="updatePackages">
      <span slot="start" class="codicon codicon-sync"></span>
      Update Packages
    </vscode-button>
  </section>

  <vscode-divider></vscode-divider>

  <section class="menu-section">
    <h3 class="section-header">Update Header</h3>
    <vscode-button appearance="secondary" id="updateHeader">
      <span slot="start" class="codicon codicon-file-code"></span>
      Update Script Header
    </vscode-button>
    <vscode-button appearance="secondary" id="generateJSDoc">
      <span slot="start" class="codicon codicon-sparkle"></span>
      Generate JSDoc Header
    </vscode-button>
  </section>

  <vscode-divider></vscode-divider>

  <section class="menu-section">
    <h3 class="section-header">Settings</h3>
    <vscode-button appearance="secondary" id="toolboxSettings">
      <span slot="start" class="codicon codicon-settings-gear"></span>
      Toolbox Settings
    </vscode-button>
    <vscode-button appearance="secondary" id="extensionSettings">
      <span slot="start" class="codicon codicon-gear"></span>
      Extension Settings
    </vscode-button>
  </section>

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
  </script>
</body>
</html>`;
  }

  /**
   * Get settings view HTML
   */
  private getSettingsHtml(): string {
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
    :root {
      --section-spacing: 24px;
      --setting-spacing: 16px;
      --control-height: 26px;
    }

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
      gap: 12px;
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

    .settings-container {
      padding: 20px;
    }

    .settings-section {
      margin-bottom: var(--section-spacing);
    }

    .section-header {
      font-weight: 600;
      font-size: 13px;
      color: var(--vscode-settings-headerForeground);
      border-bottom: 1px solid var(--vscode-settings-headerBorder);
      padding-bottom: 8px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .setting-row {
      display: grid;
      grid-template-columns: 35% 65%;
      gap: 16px;
      align-items: start;
      margin-bottom: var(--setting-spacing);
    }

    .setting-label {
      font-weight: 500;
      padding-top: 4px;
      font-size: 13px;
    }

    .setting-control {
      width: 100%;
    }

    .setting-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
      line-height: 1.4;
    }

    .checkbox-row {
      grid-template-columns: 1fr;
      align-items: center;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-widget-border);
    }

    vscode-button {
      flex: 1;
    }

    vscode-text-field {
      width: 100%;
    }

    /* Custom styling for back button using vscode-button */
    .back-btn {
      --button-padding-horizontal: 8px;
      --button-padding-vertical: 4px;
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
      <h2 class="section-header">Header Configuration</h2>

      <div class="setting-row checkbox-row">
        <div class="checkbox-container">
          <vscode-checkbox id="auto-insert">
            Auto-insert headers when installing packages
          </vscode-checkbox>
        </div>
        <div class="setting-description">
          Automatically adds #Requires and #Include directives to your script
        </div>
      </div>

      <div class="setting-row">
        <label for="requires-version" class="setting-label">
          Default Version
        </label>
        <div>
          <vscode-text-field
            id="requires-version"
            value="AutoHotkey v2.1"
            placeholder="e.g., AutoHotkey v2.1"
            class="setting-control"
            aria-describedby="requires-version-desc">
          </vscode-text-field>
          <div class="setting-description" id="requires-version-desc">
            Version string for #Requires directive
          </div>
        </div>
      </div>

      <div class="setting-row">
        <label for="single-instance" class="setting-label">
          Single Instance Mode
        </label>
        <div>
          <vscode-dropdown id="single-instance" class="setting-control" aria-describedby="single-instance-desc">
            <vscode-option value="Force">Force</vscode-option>
            <vscode-option value="Ignore">Ignore</vscode-option>
            <vscode-option value="Prompt">Prompt</vscode-option>
            <vscode-option value="Off">Off</vscode-option>
          </vscode-dropdown>
          <div class="setting-description" id="single-instance-desc">
            Default #SingleInstance mode for new scripts
          </div>
        </div>
      </div>
    </section>

    <vscode-divider></vscode-divider>

    <!-- Library Folders Section -->
    <section class="settings-section" role="region" aria-label="Library Folders">
      <h2 class="section-header">Library Folders</h2>

      <div class="setting-row">
        <label for="include-format" class="setting-label">
          Include Path Format
        </label>
        <div>
          <vscode-text-field
            id="include-format"
            value="Lib/{name}.ahk"
            placeholder="Lib/{name}.ahk"
            class="setting-control"
            aria-describedby="include-format-desc">
          </vscode-text-field>
          <div class="setting-description" id="include-format-desc">
            Template for #Include paths. Use <code>{name}</code> as placeholder for package name
          </div>
        </div>
      </div>

      <div class="setting-row">
        <label for="lib-folders" class="setting-label">
          Search Folders
        </label>
        <div>
          <vscode-text-field
            id="lib-folders"
            value="Lib, vendor"
            placeholder="Lib, vendor"
            class="setting-control"
            aria-describedby="lib-folders-desc">
          </vscode-text-field>
          <div class="setting-description" id="lib-folders-desc">
            Comma-separated list of library search folders (relative to workspace)
          </div>
        </div>
      </div>
    </section>

    <vscode-divider></vscode-divider>

    <!-- Popular Libraries Section -->
    <section class="settings-section" role="region" aria-label="Popular Libraries">
      <h2 class="section-header">Popular AHK v2 Libraries</h2>

      <div class="setting-description" style="margin-bottom: 16px;">
        Quick access to commonly used AutoHotkey v2 libraries. Click to open in browser.
      </div>

      <div class="setting-row">
        <div class="setting-label">JSON Parser</div>
        <div>
          <vscode-link href="https://github.com/thqby/ahk2_lib">
            github.com/thqby/ahk2_lib
          </vscode-link>
          <div class="setting-description">
            JSON parsing and stringification for AHK v2
          </div>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">WinClip</div>
        <div>
          <vscode-link href="https://github.com/Clip-AHK/WinClip-v2">
            github.com/Clip-AHK/WinClip-v2
          </vscode-link>
          <div class="setting-description">
            Advanced clipboard manipulation library
          </div>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">Socket</div>
        <div>
          <vscode-link href="https://github.com/G33kDude/Socket.ahk">
            github.com/G33kDude/Socket.ahk
          </vscode-link>
          <div class="setting-description">
            TCP/UDP socket communication library
          </div>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">WebView2</div>
        <div>
          <vscode-link href="https://github.com/thqby/ahk2_lib">
            github.com/thqby/ahk2_lib
          </vscode-link>
          <div class="setting-description">
            Microsoft Edge WebView2 control for AHK v2
          </div>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">Gdip</div>
        <div>
          <vscode-link href="https://github.com/mmikeww/AHK-v2-Gdip">
            github.com/mmikeww/AHK-v2-Gdip
          </vscode-link>
          <div class="setting-description">
            GDI+ graphics library for advanced image manipulation
          </div>
        </div>
      </div>
    </section>

    <!-- Action Buttons -->
    <div class="button-group">
      <vscode-button id="save-btn" appearance="primary">
        Save Settings
      </vscode-button>
      <vscode-button id="reset-btn" appearance="secondary">
        Reset to Defaults
      </vscode-button>
    </div>
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
    const fileName = filePath.split(/[/\\]/).pop() || filePath;

    // Get the toolkit URI
    const toolkitUri = this._view!.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js')
    );

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
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header h2 {
      margin: 0 0 2px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-sideBarTitle-foreground);
      flex: 1;
    }

    .file-path {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content {
      padding: 16px;
      overflow-y: auto;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-sideBarTitle-foreground);
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .field {
      margin-bottom: 14px;
    }

    .field-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 11px;
      color: var(--vscode-settings-textInputForeground);
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
    <h2>
      <span class="codicon codicon-edit"></span>
      Edit Metadata
    </h2>
  </div>

  <div class="content">
    <div class="file-info">
      <div class="file-info-label">File:</div>
      <div class="file-info-path">${filePath}</div>
    </div>

    <div class="section">
      <div class="section-title">Basic Information</div>
      <div class="field">
        <label for="title" class="field-label">Title</label>
        <input type="text" id="title" class="field-input" value="${metadata.title || ''}" placeholder="Short module title" />
      </div>
      <div class="field">
        <label for="description" class="field-label">Description</label>
        <textarea id="description" class="field-textarea" rows="3" placeholder="Full explanation of purpose and features">${metadata.description || ''}</textarea>
      </div>
      <div class="field">
        <label for="abstract" class="field-label">Abstract</label>
        <textarea id="abstract" class="field-textarea" rows="2" placeholder="1-2 sentence overview">${metadata.abstract || ''}</textarea>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Authorship</div>
      <div class="field">
        <label for="author" class="field-label">Author</label>
        <input type="text" id="author" class="field-input" value="${metadata.author || ''}" placeholder="Name <email>" />
      </div>
      <div class="field">
        <label for="license" class="field-label">License</label>
        <input type="text" id="license" class="field-input" value="${metadata.license || ''}" placeholder="MIT, GPL, etc." />
      </div>
    </div>

    <div class="section">
      <div class="section-title">Version Information</div>
      <div class="field">
        <label for="version" class="field-label">Version</label>
        <input type="text" id="version" class="field-input" value="${metadata.version || ''}" placeholder="1.0.0" />
      </div>
      <div class="field">
        <label for="date" class="field-label">Date</label>
        <input type="date" id="date" class="field-input" value="${metadata.date || ''}" />
      </div>
      <div class="field">
        <label for="since" class="field-label">Since</label>
        <input type="date" id="since" class="field-input" value="${metadata.since || ''}" />
        <div class="field-help">First release date</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Links & References</div>
      <div class="field">
        <label for="repository" class="field-label">Repository</label>
        <input type="url" id="repository" class="field-input" value="${metadata.repository || ''}" placeholder="https://github.com/user/repo" />
      </div>
      <div class="field">
        <label for="homepage" class="field-label">Homepage</label>
        <input type="url" id="homepage" class="field-input" value="${metadata.homepage || ''}" placeholder="https://example.com" />
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
        <input type="text" id="keywords" class="field-input" value="${metadata.keywords || ''}" placeholder="json, parsing, data, autohotkey" />
        <div class="field-help">Comma-separated topical terms</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Technical Details</div>
      <div class="field">
        <label for="ahkVersion" class="field-label">AHK Version</label>
        <input type="text" id="ahkVersion" class="field-input" value="${metadata['ahk-version'] || ''}" placeholder="v2.0+" />
      </div>
      <div class="field">
        <label for="requires" class="field-label">Requires</label>
        <textarea id="requires" class="field-textarea" rows="2" placeholder="Library files, DLLs, or external tools (one per line)">${Array.isArray(metadata.requires) ? metadata.requires.join('\n') : (metadata.requires || '')}</textarea>
      </div>
      <div class="field">
        <label for="exports" class="field-label">Exports</label>
        <textarea id="exports" class="field-textarea" rows="2" placeholder="Public classes, functions, hotkeys (one per line)">${Array.isArray(metadata.exports) ? metadata.exports.join('\n') : (metadata.exports || '')}</textarea>
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

    // Back button handler
    document.getElementById('back-btn').addEventListener('click', () => {
      vscode.postMessage({ type: 'showMain' });
    });

    // Save button handler
    document.getElementById('save-btn').addEventListener('click', () => {
      const metadata = {
        title: document.getElementById('title').value,
        abstract: document.getElementById('abstract').value,
        description: document.getElementById('description').value,
        author: document.getElementById('author').value,
        license: document.getElementById('license').value,
        version: document.getElementById('version').value,
        date: document.getElementById('date').value,
        since: document.getElementById('since').value,
        repository: document.getElementById('repository').value,
        homepage: document.getElementById('homepage').value,
        category: document.getElementById('category').value,
        keywords: document.getElementById('keywords').value,
        'ahk-version': document.getElementById('ahkVersion').value,
        requires: document.getElementById('requires').value.split('\n').filter(line => line.trim()),
        exports: document.getElementById('exports').value.split('\n').filter(line => line.trim())
      };

      vscode.postMessage({
        type: 'saveMetadata',
        filePath: '${filePath}',
        metadata
      });
    });

    // Cancel button handler
    document.getElementById('cancel-btn').addEventListener('click', () => {
      vscode.postMessage({ type: 'showMain' });
    });

    // Add keyboard shortcuts
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
}
