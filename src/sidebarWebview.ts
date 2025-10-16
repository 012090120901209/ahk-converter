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

    this._panel = vscode.window.createWebviewPanel(
      'ahkv2Toolbox',
      'AHKv2 Toolbox',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this._context.extensionPath, 'media'))
        ]
      }
    );

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

  private getWebviewContent(): string {
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
          .tool-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .tool-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px;
            text-align: center;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .tool-button:hover {
            background-color: var(--vscode-button-hoverBackground);
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