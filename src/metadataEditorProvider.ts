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
 * Metadata editor webview provider
 */
export class MetadataEditorProvider {
  private static currentPanel: vscode.WebviewPanel | undefined;

  public static async show(context: vscode.ExtensionContext, filePath: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (MetadataEditorProvider.currentPanel) {
      MetadataEditorProvider.currentPanel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'ahkMetadataEditor',
      `Edit Metadata - ${path.basename(filePath)}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri]
      }
    );

    MetadataEditorProvider.currentPanel = panel;

    // Load and parse the file
    const metadata = await MetadataEditorProvider.parseJSDoc(filePath);

    // Set the webview's initial html content
    panel.webview.html = MetadataEditorProvider.getWebviewContent(metadata, filePath);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'save':
            await MetadataEditorProvider.saveMetadata(filePath, message.metadata);
            vscode.window.showInformationMessage('Metadata saved successfully!');
            break;
          case 'generate':
            await MetadataEditorProvider.generateMetadata(filePath);
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    // Reset when the current panel is closed
    panel.onDidDispose(
      () => {
        MetadataEditorProvider.currentPanel = undefined;
      },
      null,
      context.subscriptions
    );
  }

  /**
   * Parse JSDoc header from AHK file
   */
  private static async parseJSDoc(filePath: string): Promise<JSDocMetadata> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      const metadata: JSDocMetadata = {};
      let inJSDoc = false;

      for (const line of lines) {
        const trimmed = line.trim();

        // Check for JSDoc start
        if (trimmed.startsWith('/**') || trimmed.startsWith('/***')) {
          inJSDoc = true;
          continue;
        }

        // Check for JSDoc end
        if (trimmed.endsWith('*/') || trimmed.endsWith('***/')) {
          break;
        }

        if (!inJSDoc) {
          continue;
        }

        // Parse JSDoc tags
        const tagMatch = trimmed.match(/^\*\s*@(\w+[-\w]*)\s*[:：]?\s*(.*)$/);
        if (tagMatch) {
          const tag = tagMatch[1];
          const value = tagMatch[2].trim();

          // Handle array tags
          if (['link', 'see', 'requires', 'imports', 'exports', 'todo', 'contributors'].includes(tag)) {
            if (!metadata[tag]) {
              metadata[tag] = [];
            }
            (metadata[tag] as string[]).push(value);
          } else {
            metadata[tag] = value;
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
  private static async saveMetadata(filePath: string, metadata: JSDocMetadata) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Find existing JSDoc header
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

      // Generate new JSDoc header
      const newJSDoc = MetadataEditorProvider.generateJSDocHeader(metadata);

      let newContent: string;
      if (jsdocStart !== -1 && jsdocEnd !== -1) {
        // Replace existing JSDoc
        const before = lines.slice(0, jsdocStart);
        const after = lines.slice(jsdocEnd + 1);
        newContent = [...before, ...newJSDoc.split('\n'), ...after].join('\n');
      } else {
        // Prepend new JSDoc
        newContent = newJSDoc + '\n\n' + content;
      }

      await fs.writeFile(filePath, newContent, 'utf-8');

      // Refresh the document if it's open
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
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save metadata: ${error}`);
    }
  }

  /**
   * Generate JSDoc header from metadata
   */
  private static generateJSDocHeader(metadata: JSDocMetadata): string {
    const lines: string[] = [];
    lines.push('/************************************************************************');

    // Ordered list of tags
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
        // Handle multiline values
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
   * Generate metadata automatically using LLM (future feature)
   */
  private static async generateMetadata(filePath: string) {
    vscode.window.showInformationMessage(
      'AI metadata generation coming soon! This will analyze your code and generate comprehensive JSDoc headers.'
    );
  }

  /**
   * Get webview HTML content
   */
  private static getWebviewContent(metadata: JSDocMetadata, filePath: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit Metadata - ${path.basename(filePath)}</title>
  <style>
    body {
      padding: 20px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 8px;
    }
    .file-path {
      color: var(--vscode-descriptionForeground);
      font-size: 0.9em;
      margin-bottom: 24px;
    }
    .section {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .section h2 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 1.1em;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
    }
    .field {
      margin-bottom: 12px;
    }
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      font-size: 0.9em;
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
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      box-sizing: border-box;
    }
    textarea {
      min-height: 80px;
      resize: vertical;
      font-family: var(--vscode-editor-font-family);
    }
    .help-text {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 2px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
      margin-right: 8px;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .button-group {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    .tag-input-group {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }
    .tag-input-group input {
      flex: 1;
    }
    .tag-input-group button {
      padding: 6px 12px;
    }
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    .tag {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 4px 8px;
      border-radius: 2px;
      font-size: 0.85em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tag button {
      background: transparent;
      border: none;
      color: inherit;
      padding: 0;
      margin: 0;
      cursor: pointer;
      font-size: 1.1em;
      line-height: 1;
    }
    .info-box {
      background: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding: 12px;
      margin: 16px 0;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>📝 Edit JSDoc Metadata</h1>
  <div class="file-path">${filePath}</div>

  <div class="info-box">
    💡 <strong>Tip:</strong> Fill in as many fields as possible to help LLMs and package managers understand your library. Leave fields empty if not applicable.
  </div>

  <!-- Basic Information -->
  <div class="section">
    <h2>📋 Basic Information</h2>

    <div class="field-row">
      <div class="field">
        <label for="file">File Name</label>
        <input type="text" id="file" value="${metadata.file || ''}" />
      </div>
      <div class="field">
        <label for="title">Title</label>
        <input type="text" id="title" value="${metadata.title || ''}" />
      </div>
    </div>

    <div class="field">
      <label for="fileoverview">File Overview (one sentence)</label>
      <input type="text" id="fileoverview" value="${metadata.fileoverview || ''}" />
      <div class="help-text">Concise one-sentence description</div>
    </div>

    <div class="field">
      <label for="abstract">Abstract (1-2 sentences)</label>
      <textarea id="abstract" rows="2">${metadata.abstract || ''}</textarea>
      <div class="help-text">Short high-level overview</div>
    </div>

    <div class="field">
      <label for="description">Description (2-6 sentences)</label>
      <textarea id="description" rows="4">${metadata.description || ''}</textarea>
      <div class="help-text">Include purpose, core features, I/O, and side effects</div>
    </div>
  </div>

  <!-- Authorship & Licensing -->
  <div class="section">
    <h2>👤 Authorship & Licensing</h2>

    <div class="field-row">
      <div class="field">
        <label for="author">Author</label>
        <input type="text" id="author" value="${metadata.author || ''}" placeholder="Name <email>" />
      </div>
      <div class="field">
        <label for="license">License</label>
        <input type="text" id="license" value="${metadata.license || ''}" placeholder="MIT, GPL, etc." />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="maintainer">Maintainer</label>
        <input type="text" id="maintainer" value="${metadata.maintainer || ''}" />
      </div>
      <div class="field">
        <label for="funding">Funding/Donation</label>
        <input type="url" id="funding" value="${metadata.funding || ''}" placeholder="https://..." />
      </div>
    </div>

    <div class="field">
      <label>Contributors</label>
      <div class="tag-input-group">
        <input type="text" id="contributorInput" placeholder="Contributor name" />
        <button onclick="addContributor()">Add</button>
      </div>
      <div class="tag-list" id="contributorsList"></div>
    </div>
  </div>

  <!-- Version & Dates -->
  <div class="section">
    <h2>📅 Version & Dates</h2>

    <div class="field-row">
      <div class="field">
        <label for="version">Version (semver)</label>
        <input type="text" id="version" value="${metadata.version || ''}" placeholder="1.0.0" />
      </div>
      <div class="field">
        <label for="date">Date (YYYY-MM-DD)</label>
        <input type="date" id="date" value="${metadata.date || ''}" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="since">Since (YYYY-MM-DD)</label>
        <input type="date" id="since" value="${metadata.since || ''}" />
        <div class="help-text">First known release date</div>
      </div>
      <div class="field">
        <label for="ahk-version">AHK Version</label>
        <input type="text" id="ahk-version" value="${metadata['ahk-version'] || ''}" placeholder="v2.0, v2.1" />
      </div>
    </div>
  </div>

  <!-- Links & References -->
  <div class="section">
    <h2>🔗 Links & References</h2>

    <div class="field">
      <label for="homepage">Homepage</label>
      <input type="url" id="homepage" value="${metadata.homepage || ''}" placeholder="https://..." />
    </div>

    <div class="field">
      <label for="repository">Repository</label>
      <input type="url" id="repository" value="${metadata.repository || ''}" placeholder="https://github.com/user/repo" />
    </div>

    <div class="field">
      <label for="bugs">Bug Tracker</label>
      <input type="url" id="bugs" value="${metadata.bugs || ''}" placeholder="https://github.com/user/repo/issues" />
    </div>

    <div class="field">
      <label>Additional Links</label>
      <div class="tag-input-group">
        <input type="url" id="linkInput" placeholder="https://..." />
        <button onclick="addLink()">Add</button>
      </div>
      <div class="tag-list" id="linksList"></div>
    </div>

    <div class="field">
      <label>See Also</label>
      <div class="tag-input-group">
        <input type="text" id="seeInput" placeholder="Related reference" />
        <button onclick="addSee()">Add</button>
      </div>
      <div class="tag-list" id="seeList"></div>
    </div>
  </div>

  <!-- Classification -->
  <div class="section">
    <h2>🏷️ Classification</h2>

    <div class="field-row">
      <div class="field">
        <label for="module">Module Name</label>
        <input type="text" id="module" value="${metadata.module || ''}" />
      </div>
      <div class="field">
        <label for="category">Category</label>
        <select id="category">
          <option value="">Select...</option>
          <option value="Automation" ${metadata.category === 'Automation' ? 'selected' : ''}>Automation</option>
          <option value="GUI" ${metadata.category === 'GUI' ? 'selected' : ''}>GUI</option>
          <option value="WinAPI" ${metadata.category === 'WinAPI' ? 'selected' : ''}>WinAPI</option>
          <option value="DevTools" ${metadata.category === 'DevTools' ? 'selected' : ''}>DevTools</option>
          <option value="Networking" ${metadata.category === 'Networking' ? 'selected' : ''}>Networking</option>
          <option value="FileSystem" ${metadata.category === 'FileSystem' ? 'selected' : ''}>FileSystem</option>
          <option value="DataParsing" ${metadata.category === 'DataParsing' ? 'selected' : ''}>DataParsing</option>
          <option value="Graphics" ${metadata.category === 'Graphics' ? 'selected' : ''}>Graphics</option>
          <option value="Other" ${metadata.category === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label for="keywords">Keywords (comma-separated)</label>
      <input type="text" id="keywords" value="${metadata.keywords || ''}" placeholder="json, parsing, serialization" />
    </div>
  </div>

  <!-- Dependencies & API -->
  <div class="section">
    <h2>📦 Dependencies & API</h2>

    <div class="field">
      <label>Requires</label>
      <div class="tag-input-group">
        <input type="text" id="requiresInput" placeholder="Library, DLL, or tool" />
        <button onclick="addRequires()">Add</button>
      </div>
      <div class="tag-list" id="requiresList"></div>
      <div class="help-text">Dependencies: libraries, DLLs, external tools</div>
    </div>

    <div class="field">
      <label>Imports</label>
      <div class="tag-input-group">
        <input type="text" id="importsInput" placeholder="Module or file" />
        <button onclick="addImports()">Add</button>
      </div>
      <div class="tag-list" id="importsList"></div>
    </div>

    <div class="field">
      <label>Exports</label>
      <div class="tag-input-group">
        <input type="text" id="exportsInput" placeholder="Class, function, or hotkey" />
        <button onclick="addExports()">Add</button>
      </div>
      <div class="tag-list" id="exportsList"></div>
      <div class="help-text">Main public classes, functions, hotkeys</div>
    </div>
  </div>

  <!-- Usage & Behavior -->
  <div class="section">
    <h2>⚙️ Usage & Behavior</h2>

    <div class="field">
      <label for="entrypoint">Entry Point</label>
      <input type="text" id="entrypoint" value="${metadata.entrypoint || ''}" placeholder="Auto-execute section, Main()" />
    </div>

    <div class="field">
      <label for="arguments">Arguments</label>
      <input type="text" id="arguments" value="${metadata.arguments || ''}" placeholder="CLI args or function params" />
    </div>

    <div class="field">
      <label for="returns">Returns</label>
      <input type="text" id="returns" value="${metadata.returns || ''}" placeholder="Output or artifacts" />
    </div>

    <div class="field">
      <label for="env">Environment</label>
      <textarea id="env" rows="2">${metadata.env || ''}</textarea>
      <div class="help-text">OS, bitness, admin rights, codepage assumptions</div>
    </div>

    <div class="field">
      <label for="permissions">Permissions</label>
      <textarea id="permissions" rows="2">${metadata.permissions || ''}</textarea>
      <div class="help-text">Registry, file system writes, network access, etc.</div>
    </div>

    <div class="field">
      <label for="config">Configuration</label>
      <textarea id="config" rows="2">${metadata.config || ''}</textarea>
      <div class="help-text">Configurable settings or INI keys</div>
    </div>

    <div class="field">
      <label for="sideEffects">Side Effects</label>
      <textarea id="sideEffects" rows="2">${metadata.sideEffects || ''}</textarea>
      <div class="help-text">System changes: registry edits, theme changes, etc.</div>
    </div>
  </div>

  <!-- Documentation -->
  <div class="section">
    <h2>📖 Documentation</h2>

    <div class="field">
      <label for="examples">Examples</label>
      <textarea id="examples" rows="4">${metadata.examples || ''}</textarea>
      <div class="help-text">Brief usage examples</div>
    </div>

    <div class="field">
      <label>TODO Items</label>
      <div class="tag-input-group">
        <input type="text" id="todoInput" placeholder="TODO item" />
        <button onclick="addTodo()">Add</button>
      </div>
      <div class="tag-list" id="todoList"></div>
    </div>

    <div class="field">
      <label for="changelog">Changelog</label>
      <textarea id="changelog" rows="3">${metadata.changelog || ''}</textarea>
      <div class="help-text">Recent noteworthy changes</div>
    </div>
  </div>

  <!-- Save Button -->
  <div class="button-group">
    <button onclick="saveMetadata()">💾 Save Metadata</button>
    <button class="secondary" onclick="generateMetadata()">🤖 AI Generate (Coming Soon)</button>
    <button class="secondary" onclick="resetForm()">🔄 Reset</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Initialize array fields
    const metadata = ${JSON.stringify(metadata)};

    function renderArrayField(fieldName, containerId) {
      const container = document.getElementById(containerId);
      const items = metadata[fieldName] || [];
      container.innerHTML = items.map(item =>
        \`<div class="tag">\${item}<button onclick="remove\${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}('\${item}')">×</button></div>\`
      ).join('');
    }

    function addArrayItem(fieldName, inputId, containerId) {
      const input = document.getElementById(inputId);
      const value = input.value.trim();
      if (!value) return;

      if (!metadata[fieldName]) metadata[fieldName] = [];
      if (!metadata[fieldName].includes(value)) {
        metadata[fieldName].push(value);
        renderArrayField(fieldName, containerId);
        input.value = '';
      }
    }

    function removeArrayItem(fieldName, containerId, value) {
      if (metadata[fieldName]) {
        metadata[fieldName] = metadata[fieldName].filter(item => item !== value);
        renderArrayField(fieldName, containerId);
      }
    }

    // Array field handlers
    function addLink() { addArrayItem('link', 'linkInput', 'linksList'); }
    function addSee() { addArrayItem('see', 'seeInput', 'seeList'); }
    function addRequires() { addArrayItem('requires', 'requiresInput', 'requiresList'); }
    function addImports() { addArrayItem('imports', 'importsInput', 'importsList'); }
    function addExports() { addArrayItem('exports', 'exportsInput', 'exportsList'); }
    function addTodo() { addArrayItem('todo', 'todoInput', 'todoList'); }
    function addContributor() { addArrayItem('contributors', 'contributorInput', 'contributorsList'); }

    function removeLink(v) { removeArrayItem('link', 'linksList', v); }
    function removeSee(v) { removeArrayItem('see', 'seeList', v); }
    function removeRequires(v) { removeArrayItem('requires', 'requiresList', v); }
    function removeImports(v) { removeArrayItem('imports', 'importsList', v); }
    function removeExports(v) { removeArrayItem('exports', 'exportsList', v); }
    function removeTodo(v) { removeArrayItem('todo', 'todoList', v); }
    function removeContributors(v) { removeArrayItem('contributors', 'contributorsList', v); }

    // Initialize
    renderArrayField('link', 'linksList');
    renderArrayField('see', 'seeList');
    renderArrayField('requires', 'requiresList');
    renderArrayField('imports', 'importsList');
    renderArrayField('exports', 'exportsList');
    renderArrayField('todo', 'todoList');
    renderArrayField('contributors', 'contributorsList');

    function saveMetadata() {
      const formData = {
        file: document.getElementById('file').value,
        title: document.getElementById('title').value,
        fileoverview: document.getElementById('fileoverview').value,
        abstract: document.getElementById('abstract').value,
        description: document.getElementById('description').value,
        module: document.getElementById('module').value,
        author: document.getElementById('author').value,
        license: document.getElementById('license').value,
        version: document.getElementById('version').value,
        since: document.getElementById('since').value,
        date: document.getElementById('date').value,
        homepage: document.getElementById('homepage').value,
        repository: document.getElementById('repository').value,
        bugs: document.getElementById('bugs').value,
        keywords: document.getElementById('keywords').value,
        category: document.getElementById('category').value,
        'ahk-version': document.getElementById('ahk-version').value,
        entrypoint: document.getElementById('entrypoint').value,
        env: document.getElementById('env').value,
        permissions: document.getElementById('permissions').value,
        config: document.getElementById('config').value,
        arguments: document.getElementById('arguments').value,
        returns: document.getElementById('returns').value,
        sideEffects: document.getElementById('sideEffects').value,
        examples: document.getElementById('examples').value,
        changelog: document.getElementById('changelog').value,
        funding: document.getElementById('funding').value,
        maintainer: document.getElementById('maintainer').value,
        link: metadata.link,
        see: metadata.see,
        requires: metadata.requires,
        imports: metadata.imports,
        exports: metadata.exports,
        todo: metadata.todo,
        contributors: metadata.contributors
      };

      vscode.postMessage({ type: 'save', metadata: formData });
    }

    function generateMetadata() {
      vscode.postMessage({ type: 'generate' });
    }

    function resetForm() {
      if (confirm('Reset all changes? This cannot be undone.')) {
        location.reload();
      }
    }
  </script>
</body>
</html>`;
  }
}
