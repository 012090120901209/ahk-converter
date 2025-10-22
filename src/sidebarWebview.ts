import * as vscode from 'vscode';
import * as path from 'path';

export class AHKv2ToolboxWebview {
  private static instance: AHKv2ToolboxWebview;
  private _panel: vscode.WebviewPanel | undefined;
  private _context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  public static getInstance(context: vscode.ExtensionContext): AHKv2ToolboxWebview {
    if (!this.instance) {
      this.instance = new AHKv2ToolboxWebview(context);
    }
    return this.instance;
  }

  public createOrShowPanel() {
    if (this._panel) {
      this._panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const iconPath = vscode.Uri.file(path.join(this._context.extensionPath, 'src', 'AHK_Code.svg'));
    this._panel = vscode.window.createWebviewPanel(
      'ahkv2Toolbox',
      'AHKv2 Toolbox',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this._context.extensionPath, 'media')),
          vscode.Uri.file(path.join(this._context.extensionPath, 'src'))
        ]
      }
    );
    
    // Set the webview panel's icon
    this._panel.iconPath = {
      light: iconPath,
      dark: iconPath
    };

    this._panel.webview.html = this.getWebviewContent();

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'scriptConverter':
            vscode.commands.executeCommand('ahk.convertV1toV2');
            return;
          case 'functionMetadata':
            vscode.commands.executeCommand('ahk.extractFunctionMetadata');
            return;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:TrueCrimeAudit.ahkv2-toolbox');
            return;
          case 'libraryManager':
            vscode.window.showInformationMessage('Library Manager - Coming soon!');
            return;
          case 'updateHeader':
            vscode.commands.executeCommand('ahk.updateHeader');
            return;
          case 'settings':
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:TrueCrimeAudit.ahkv2-toolbox');
            return;
          case 'quickFixes':
            vscode.window.showInformationMessage('Quick Fixes - Coming soon!');
            return;
        }
      },
      undefined,
      this._context.subscriptions
    );

    this._panel.onDidDispose(
      () => {
        this._panel = undefined;
      },
      null,
      this._context.subscriptions
    );
  }

  public getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AHKv2 Toolbox</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          h1 {
            text-align: center;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .tool-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .tool-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 8px;
            padding: 16px 12px;
            text-align: center;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .tool-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }
          .tool-button:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
        </style>
      </head>
      <body>
        <h1>AHKv2 Toolbox</h1>
        <div class="tool-grid">
          <button class="tool-button" onclick="vscode.postMessage({command: 'scriptConverter'})">
            Script Converter
          </button>
          <button class="tool-button" onclick="vscode.postMessage({command: 'functionMetadata'})">
            Function Metadata
          </button>
          <button class="tool-button" onclick="vscode.postMessage({command: 'libraryManager'})">
            Library Manager
          </button>
          <button class="tool-button" onclick="vscode.postMessage({command: 'updateHeader'})">
            Update Header
          </button>
          <button class="tool-button" onclick="vscode.postMessage({command: 'settings'})">
            Settings
          </button>
          <button class="tool-button" onclick="vscode.postMessage({command: 'quickFixes'})">
            Quick Fixes
          </button>
          <button class="tool-button" onclick="vscode.postMessage({command: 'openSettings'})">
            Extension Settings
          </button>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
        </script>
      </body>
      </html>
    `;
  }
}