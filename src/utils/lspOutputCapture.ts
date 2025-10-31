import * as vscode from 'vscode';
import { getOutputChannelMonitor } from './outputChannelMonitor';

/**
 * LSP Output Capture Service
 * Automatically captures output from AutoHotkey v2 LSP extension
 */
export class LSPOutputCapture {
  private static instance: LSPOutputCapture | undefined;
  private disposables: vscode.Disposable[] = [];
  private lspExtension: vscode.Extension<any> | undefined;
  private captureInterval: NodeJS.Timeout | undefined;
  private lastOutput: string = '';
  private isInitializing: boolean = false;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | undefined;

  private constructor() {
    // Don't await - let it initialize async
    this.initializationPromise = this.initialize();
  }

  public static getInstance(): LSPOutputCapture {
    if (!LSPOutputCapture.instance) {
      LSPOutputCapture.instance = new LSPOutputCapture();
    }
    return LSPOutputCapture.instance;
  }

  private async initialize(): Promise<void> {
    // Prevent double initialization (race-safe)
    if (this.isInitialized) {
      return;
    }
    if (this.isInitializing) {
      return;
    }

    // Set flags immediately to prevent race conditions
    this.isInitializing = true;

    // Find the AutoHotkey v2 LSP extension
    this.lspExtension = vscode.extensions.getExtension('thqby.vscode-autohotkey2-lsp');

    if (!this.lspExtension) {
      console.log('AutoHotkey v2 LSP extension not found');
      this.isInitializing = false;
      return;
    }

    // Wait for extension to activate
    if (!this.lspExtension.isActive) {
      await this.lspExtension.activate();
    }

    console.log('AHK LSP extension integration enabled');

    // Start monitoring
    this.startMonitoring();

    // Mark initialization complete
    this.isInitialized = true;
    this.isInitializing = false;
  }

  /**
   * Start monitoring LSP output
   * Since we can't directly access another extension's output channel,
   * we'll monitor for script execution and capture stderr/stdout
   */
  private startMonitoring() {
    // Method 1: Monitor for AHK file saves/runs
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === 'ahk2' || doc.languageId === 'ahk') {
          // Small delay to let the LSP run the script
          setTimeout(() => {
            this.checkForErrors(doc.uri);
          }, 500);
        }
      })
    );

    // Method 2: Monitor diagnostics changes (LSP updates)
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics((event) => {
        event.uris.forEach(uri => {
          if (uri.fsPath.endsWith('.ahk') || uri.fsPath.endsWith('.ahk2')) {
            this.checkForErrors(uri);
          }
        });
      })
    );

    // Method 3: Hook into terminal output if user runs script manually
    this.disposables.push(
      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal) {
          this.monitorTerminal(terminal);
        }
      })
    );
  }

  /**
   * Check for runtime errors from LSP
   */
  private async checkForErrors(uri: vscode.Uri) {
    const monitor = getOutputChannelMonitor();

    // Get diagnostics from LSP
    const diagnostics = vscode.languages.getDiagnostics(uri);

    // Look for runtime error diagnostics
    const runtimeErrors = diagnostics.filter(d =>
      d.source === 'AutoHotkey2' &&
      d.message.includes('==>')
    );

    // If we have runtime errors, parse them
    for (const diag of runtimeErrors) {
      const errorLine = `${uri.fsPath} (${diag.range.start.line + 1}) : ==> ${diag.message}`;
      monitor.addOutputLine('AutoHotkey v2 LSP', errorLine);
    }
  }

  /**
   * Monitor terminal for AHK script output
   */
  private monitorTerminal(terminal: vscode.Terminal) {
    // Unfortunately, VS Code doesn't provide API to read terminal output
    // This is a placeholder for when/if that API becomes available
  }

  /**
   * Manually capture output from a string (for testing or manual input)
   */
  public captureOutput(output: string): void {
    const monitor = getOutputChannelMonitor();
    const lines = output.split('\n');
    monitor.addOutputLines('AutoHotkey v2 LSP', lines);
  }

  /**
   * Watch for LSP log files if they exist
   */
  private async watchLogFiles() {
    // Check if LSP writes to a log file
    const logPatterns = [
      '**/ahk2-lsp*.log',
      '**/autohotkey*.log'
    ];

    for (const pattern of logPatterns) {
      const files = await vscode.workspace.findFiles(pattern, null, 1);
      if (files.length > 0) {
        this.watchFile(files[0]);
      }
    }
  }

  /**
   * Watch a log file for changes
   */
  private watchFile(uri: vscode.Uri) {
    const watcher = vscode.workspace.createFileSystemWatcher(uri.fsPath);

    watcher.onDidChange(async () => {
      try {
        const doc = await vscode.workspace.openTextDocument(uri);
        const content = doc.getText();

        // Only process new content
        if (content.length > this.lastOutput.length) {
          const newContent = content.substring(this.lastOutput.length);
          this.captureOutput(newContent);
          this.lastOutput = content;
        }
      } catch (error) {
        console.error('Error reading log file:', error);
      }
    });

    this.disposables.push(watcher);
  }

  /**
   * Get the LSP extension API if available
   */
  public getExtensionAPI(): any {
    return this.lspExtension?.exports;
  }

  /**
   * Check if LSP is available and active
   */
  public async isAvailable(): Promise<boolean> {
    // Wait for initialization to complete
    await this.initializationPromise;
    return this.lspExtension?.isActive ?? false;
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }
    LSPOutputCapture.instance = undefined;
  }
}

/**
 * Activate LSP output capture
 */
export function activateLSPCapture(context: vscode.ExtensionContext): LSPOutputCapture {
  const capture = LSPOutputCapture.getInstance();
  context.subscriptions.push({
    dispose: () => capture.dispose()
  });
  return capture;
}
