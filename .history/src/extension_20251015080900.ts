import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerTestCommand } from './test/testCommand';

type RunResult = { stdout: string; stderr: string; code: number };

// Enhanced error types for better error handling with user-friendly messages
class AHKConverterError extends Error {
  constructor(
    message: string, 
    public readonly code: string, 
    public readonly details?: any,
    public readonly userMessage?: string,
    public readonly learnMoreUrl?: string,
    public readonly recoveryActions?: string[]
  ) {
    super(message);
    this.name = 'AHKConverterError';
  }
}

class ValidationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    const userMessage = 'The AHK file could not be validated for conversion.';
    const learnMoreUrl = 'https://www.autohotkey.com/docs/v2/v1-to-v2.htm';
    const recoveryActions = ['Check file syntax', 'Ensure file contains AHK v1 code', 'View error details'];
    super(message, 'VALIDATION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
    this.name = 'ValidationError';
  }
}

class ConversionError extends AHKConverterError {
  constructor(message: string, details?: any) {
    const userMessage = 'The conversion process encountered an error.';
    const learnMoreUrl = 'https://www.autohotkey.com/docs/v2/v1-to-v2.htm#common-issues';
    const recoveryActions = ['Check AHK v2 installation', 'Try simpler conversion', 'View error details'];
    super(message, 'CONVERSION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
    this.name = 'ConversionError';
  }
}

class FileOperationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    const userMessage = 'File operation failed during conversion.';
    const recoveryActions = ['Check file permissions', 'Ensure file is not locked', 'Try saving file first'];
    super(message, 'FILE_OPERATION_ERROR', details, userMessage, undefined, recoveryActions);
    this.name = 'FileOperationError';
  }
}

class ConfigurationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    const userMessage = 'Extension configuration is incomplete or incorrect.';
    const learnMoreUrl = 'https://github.com/TrueCrimeAudit/ahk-converter#configuration';
    const recoveryActions = ['Open Settings', 'Check AHK v2 path', 'Reset to defaults'];
    super(message, 'CONFIGURATION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
    this.name = 'ConfigurationError';
  }
}

// Enhanced notification system
interface NotificationOptions {
  type: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
  actions?: string[];
  learnMoreUrl?: string;
  showOutputChannel?: boolean;
}

class NotificationManager {
  private static instance: NotificationManager;
  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('AHK Converter');
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async showNotification(options: NotificationOptions): Promise<string | undefined> {
    const { type, message, details, actions = [], learnMoreUrl, showOutputChannel = false } = options;
    
    // Log to output channel
    this.outputChannel.appendLine(`[${type.toUpperCase()}] ${message}`);
    if (details) {
      this.outputChannel.appendLine(`Details: ${details}`);
    }

    // Prepare actions
    const notificationActions = [...actions];
    if (learnMoreUrl) {
      notificationActions.push('Learn More');
    }
    if (showOutputChannel) {
      notificationActions.push('Show Details');
    }

    let result: string | undefined;
    
    switch (type) {
      case 'error':
        result = await vscode.window.showErrorMessage(message, ...notificationActions);
        break;
      case 'warning':
        result = await vscode.window.showWarningMessage(message, ...notificationActions);
        break;
      case 'info':
        result = await vscode.window.showInformationMessage(message, ...notificationActions);
        break;
    }

    // Handle actions
    if (result === 'Learn More' && learnMoreUrl) {
      await vscode.env.openExternal(vscode.Uri.parse(learnMoreUrl));
    } else if (result === 'Show Details' || showOutputChannel) {
      this.outputChannel.show();
    }

    return result;
  }

  getOutputChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  appendLine(message: string): void {
    this.outputChannel.appendLine(message);
  }

  show(): void {
    this.outputChannel.show();
  }
}

// Conversion statistics interface
interface ConversionStats {
  linesProcessed: number;
  warnings: number;
  errors: number;
  conversionTime: number;
}

// Batch conversion result interface
interface BatchConversionResult {
  file: string;
  success: boolean;
  result?: string;
  error?: string;
  stats?: ConversionStats;
}

// Enhanced diff view options
interface DiffViewOptions {
  showLineNumbers: boolean;
  highlightChanges: boolean;
  ignoreWhitespace: boolean;
  contextLines: number;
}

let output: vscode.OutputChannel | undefined;
let lastDiffLeftUri: vscode.Uri | undefined;
let lastDiffRightUri: vscode.Uri | undefined;
let notificationManager: NotificationManager;

function getOutput(): vscode.OutputChannel {
  if (!output) output = vscode.window.createOutputChannel('AHK Converter');
  return output;
}

function getNotificationManager(): NotificationManager {
  if (!notificationManager) notificationManager = NotificationManager.getInstance();
  return notificationManager;
}

function spawnRun(cmd: string, args: string[], cwd?: string): Promise<RunResult> {
  return new Promise((resolve) => {
    getOutput().appendLine(`[spawn] ${cmd} ${args.map(a => (a.includes(' ') ? '"' + a + '"' : a)).join(' ')}${cwd ? ` (cwd=${cwd})` : ''}`);
    const child = cp.spawn(cmd, args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('error', (err) => {
      stderr += String(err);
      getOutput().appendLine(`[error] ${String(err)}`);
      resolve({ stdout, stderr, code: -1 });
    });
    child.on('close', code => {
      if (stderr.trim()) getOutput().appendLine(`[stderr] ${stderr.trim()}`);
      if (stdout.trim()) getOutput().appendLine(`[stdout] ${stdout.trim()}`);
      getOutput().appendLine(`[exit] code=${code ?? -1}`);
      resolve({ stdout, stderr, code: code ?? -1 });
    });
  });
}

async function ensureWindowsIfStrict(): Promise<boolean> {
  try {
    const cfg = vscode.workspace.getConfiguration('ahkConverter');
    if (cfg.get<boolean>('strictWindowsOnly') && process.platform !== 'win32') {
      const choice = await vscode.window.showWarningMessage(
        'AHK v1 to v2 Converter is designed for Windows. Continue anyway?',
        'Continue',
        'Cancel'
      );
      return choice === 'Continue';
    }
    return true;
  } catch (error) {
    throw new ConfigurationError('Failed to check Windows strict mode setting', error);
  }
}

async function getPaths(ctx: vscode.ExtensionContext) {
  try {
    const cfg = vscode.workspace.getConfiguration('ahkConverter');
    const configuredAhk = (cfg.get<string>('autoHotkeyV2Path') || '').replace(/"/g, '');
    const ahkCandidates: string[] = [];
    if (configuredAhk) ahkCandidates.push(configuredAhk);
    // Common installs
    ahkCandidates.push(
      'AutoHotkey64.exe',
      path.join(process.env['ProgramFiles'] || 'C:/Program Files', 'AutoHotkey', 'v2', 'AutoHotkey64.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'AutoHotkey', 'v2', 'AutoHotkey64.exe'),
      path.join(process.env['LOCALAPPDATA'] || 'C:/Users/Default/AppData/Local', 'Programs', 'AutoHotkey', 'v2', 'AutoHotkey64.exe')
    );

    async function promptForAhkExe(suggest: string): Promise<string | undefined> {
      try {
        const defaultUri = vscode.Uri.file(path.isAbsolute(suggest) ? path.dirname(suggest) : suggest);
        const picks = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          defaultUri,
          filters: { Executable: ['exe'] },
          openLabel: 'Use this AutoHotkey64.exe',
          title: 'Select AutoHotkey v2 executable (AutoHotkey64.exe)'
        });
        if (picks && picks[0]) {
          const selected = picks[0].fsPath;
          await cfg.update('autoHotkeyV2Path', selected, vscode.ConfigurationTarget.Workspace);
          return selected;
        }
        return undefined;
      } catch (error) {
        throw new ConfigurationError('Failed to prompt for AutoHotkey executable', error);
      }
    }

    async function findExisting(exes: string[]): Promise<string | undefined> {
      for (const exe of exes) {
        try {
          // If it is not an absolute path, rely on PATH resolution by trying to spawn "where"
          if (!path.isAbsolute(exe)) {
            const whereCmd = process.platform === 'win32' ? 'where' : 'which';
            const result = await spawnRun(whereCmd, [exe]);
            if (result.code === 0 && result.stdout.trim()) return exe;
          } else {
            await fs.promises.access(exe, fs.constants.X_OK | fs.constants.F_OK);
            return exe;
          }
        } catch {
          // try next
        }
      }
      return undefined;
    }

    let ahkExe = await findExisting(ahkCandidates);
    if (!ahkExe) {
      const suggested = ahkCandidates.find(p => path.isAbsolute(p)) || 'C:/Program Files/AutoHotkey/v2/AutoHotkey64.exe';
      const picked = await promptForAhkExe(suggested);
      if (picked) {
        ahkExe = picked;
      } else {
        const choice = await vscode.window.showErrorMessage(
          'AutoHotkey v2 executable not found. Set "ahkConverter.autoHotkeyV2Path" to your AutoHotkey64.exe.',
          'Open Settings'
        );
        if (choice === 'Open Settings') {
          await vscode.commands.executeCommand('workbench.action.openSettings', 'ahkConverter.autoHotkeyV2Path');
        }
        throw new ConfigurationError('AutoHotkey v2 not found');
      }
    }

    const configuredConverter = (cfg.get<string>('converterScriptPath') || '').replace(/"/g, '');
    let resolvedConverter = configuredConverter
      ? configuredConverter.replace('${extensionPath}', ctx.extensionPath)
      : path.join(ctx.extensionPath, 'vendor', 'v2converter.ahk');
    try {
      await fs.promises.access(resolvedConverter, fs.constants.F_OK);
    } catch {
      const fallback = path.join(ctx.extensionPath, 'vendor', 'v2converter_silent.ahk');
      try {
        await fs.promises.access(fallback, fs.constants.F_OK);
        resolvedConverter = fallback;
      } catch {
        throw new ConfigurationError(`Converter script not found at: ${resolvedConverter} or ${fallback}`);
      }
    }
    return { ahkExe, converter: resolvedConverter };
  } catch (error) {
    if (error instanceof AHKConverterError) {
      throw error;
    }
    throw new ConfigurationError('Failed to get paths configuration', error);
  }
}

// Input validation for AHK files
function validateAHKFile(content: string, filePath?: string): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Check if file is empty
    if (!content || content.trim().length === 0) {
      errors.push('File is empty');
      return { isValid: false, warnings, errors };
    }

    // Check for binary content
    const hasBinaryContent = /[\x00-\x08\x0E-\x1F\x7F]/.test(content);
    if (hasBinaryContent) {
      errors.push('File appears to contain binary content');
      return { isValid: false, warnings, errors };
    }

    // Check for common AHK v1 patterns
    const lines = content.split('\n');
    let hasAHKPatterns = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith(';') || line === '') continue;

      // Check for AHK v1 specific patterns
      if (/#NoEnv/i.test(line) || 
          /MsgBox,\s*/.test(line) ||
          /If\s+/i.test(line) ||
          /%\w+%/.test(line) ||
          /:=\s*/.test(line) ||
          /Return\s*/.test(line)) {
        hasAHKPatterns = true;
      }

      // Check for potential issues
      if (line.includes('MsgBox,') && !line.includes('MsgBox(')) {
        warnings.push(`Line ${i + 1}: Old MsgBox syntax detected - should be converted to function call`);
      }
      
      if (line.includes('If ') && !line.includes('If (')) {
        warnings.push(`Line ${i + 1}: Legacy If statement detected - may need conversion`);
      }
    }

    if (!hasAHKPatterns) {
      warnings.push('File may not contain AHK v1 syntax patterns');
    }

    return { isValid: errors.length === 0, warnings, errors };
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    return { isValid: false, warnings, errors };
  }
}

// Conversion validation
function validateConversionResult(originalContent: string, convertedContent: string): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    if (!convertedContent || convertedContent.trim().length === 0) {
      errors.push('Conversion resulted in empty content');
      return { isValid: false, warnings, errors };
    }

    // Check for common conversion errors
    if (convertedContent.includes('MsgBox,')) {
      warnings.push('Converted file still contains old MsgBox syntax');
    }

    if (convertedContent.includes('#NoEnv')) {
      warnings.push('Converted file still contains deprecated #NoEnv directive');
    }

    // Check for syntax validation patterns
    const lines = convertedContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith(';') || line === '') continue;

      // Basic syntax checks
      if (line.includes('If ') && !line.includes('If (') && !line.includes('{')) {
        warnings.push(`Line ${i + 1}: Potential syntax issue with If statement`);
      }
    }

    return { isValid: errors.length === 0, warnings, errors };
  } catch (error) {
    errors.push(`Conversion validation error: ${error instanceof Error ? error.message : String(error)}`);
    return { isValid: false, warnings, errors };
  }
}

async function convertText(ctx: vscode.ExtensionContext, srcText: string): Promise<{ result: string; stats: ConversionStats }> {
  const startTime = Date.now();
  const stats: ConversionStats = {
    linesProcessed: 0,
    warnings: 0,
    errors: 0,
    conversionTime: 0
  };

  try {
    // Input validation
    const validation = validateAHKFile(srcText);
    stats.warnings += validation.warnings.length;
    stats.errors += validation.errors.length;

    if (!validation.isValid) {
      throw new ValidationError('Input validation failed', { errors: validation.errors, warnings: validation.warnings });
    }

    if (validation.warnings.length > 0) {
      getOutput().appendLine('[validation] Warnings:');
      validation.warnings.forEach(warning => getOutput().appendLine(`  - ${warning}`));
    }

    if (!srcText.trim()) {
      throw new ValidationError('File is empty');
    }

    stats.linesProcessed = srcText.split('\n').length;

    const { ahkExe, converter } = await getPaths(ctx);

    // Ensure converter exists
    try {
      await fs.promises.access(converter, fs.constants.F_OK);
    } catch {
      throw new ConfigurationError(`Converter script not found at: ${converter}`);
    }

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ahkconv-'));
    const inPath = path.join(tmpDir, 'input.ahk');
    await fs.promises.writeFile(inPath, srcText, 'utf8');

    const expectedOut = path.join(tmpDir, 'input_newV2.ahk');

    const progressOpts = { location: vscode.ProgressLocation.Window, title: 'Converting to AHK v2...' };
    return await vscode.window.withProgress(progressOpts, async () => {
      const args = ['/ErrorStdOut', converter, inPath];
      const { code, stderr } = await spawnRun(ahkExe, args, tmpDir);
      
      if (code !== 0) {
        throw new ConversionError(`Converter failed with code ${code}${stderr ? ': ' + stderr : ''}`, { code, stderr });
      }
      
      // Wait for output file to appear; the converter writes alongside input
      try {
        const outText = await fs.promises.readFile(expectedOut, 'utf8');
        
        // Validate conversion result
        const conversionValidation = validateConversionResult(srcText, outText);
        stats.warnings += conversionValidation.warnings.length;
        stats.errors += conversionValidation.errors.length;

        if (!conversionValidation.isValid) {
          throw new ConversionError('Conversion validation failed', { errors: conversionValidation.errors, warnings: conversionValidation.warnings });
        }

        if (conversionValidation.warnings.length > 0) {
          getOutput().appendLine('[conversion-validation] Warnings:');
          conversionValidation.warnings.forEach(warning => getOutput().appendLine(`  - ${warning}`));
        }

        stats.conversionTime = Date.now() - startTime;
        
        // Clean up temp directory
        try {
          await fs.promises.rm(tmpDir, { recursive: true, force: true });
        } catch (cleanupError) {
          getOutput().appendLine(`[cleanup] Failed to clean up temp directory: ${cleanupError}`);
        }

        return { result: outText, stats };
      } catch {
        throw new ConversionError(`Expected output not found: ${expectedOut}${stderr ? '\n' + stderr : ''}`);
      }
    });
  } catch (error) {
    stats.conversionTime = Date.now() - startTime;
    if (error instanceof AHKConverterError) {
      throw error;
    }
    throw new ConversionError('Unexpected error during conversion', error);
  }
}

// Enhanced diff view with better options
async function showEnhancedDiff(outText: string, left: vscode.TextDocument, options?: Partial<DiffViewOptions>): Promise<void> {
  try {
    const defaultOptions: DiffViewOptions = {
      showLineNumbers: true,
      highlightChanges: true,
      ignoreWhitespace: false,
      contextLines: 3
    };
    
    const diffOptions = { ...defaultOptions, ...options };
    
    const rightUri = vscode.Uri.parse('untitled:Converted.ahk');
    const rightDoc = await vscode.workspace.openTextDocument(rightUri);
    await vscode.window.showTextDocument(rightDoc, { preview: true });
    const edit = new vscode.WorkspaceEdit();
    edit.insert(rightUri, new vscode.Position(0, 0), outText);
    await vscode.workspace.applyEdit(edit);
    
    const title = 'AHK v1 ↔ v2 Conversion Preview';
    await vscode.commands.executeCommand('vscode.diff', left.uri, rightUri, title);
    
    lastDiffLeftUri = left.uri;
    lastDiffRightUri = rightUri;
    
    // Show diff options notification
    const notificationManager = getNotificationManager();
    await notificationManager.showNotification({
      type: 'info',
      message: 'Review the conversion changes in the diff view',
      actions: ['Accept All', 'Accept Selected', 'Reject'],
      showOutputChannel: true
    });
  } catch (error) {
    throw new FileOperationError('Failed to show enhanced diff view', error);
  }
}

async function openInNewTab(outText: string) {
  try {
    const doc = await vscode.workspace.openTextDocument({ language: 'ahk', content: outText });
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch (error) {
    throw new FileOperationError('Failed to open converted file in new tab', error);
  }
}

async function replaceCurrentEditor(outText: string, editor: vscode.TextEditor) {
  try {
    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(editor.document.lineCount, 0);
    const fullRange = new vscode.Range(start, end);
    await editor.edit(e => e.replace(fullRange, outText));
  } catch (error) {
    throw new FileOperationError('Failed to replace current editor content', error);
  }
}

async function showDiff(outText: string, left: vscode.TextDocument) {
  try {
    const rightUri = vscode.Uri.parse('untitled:Converted.ahk');
    const rightDoc = await vscode.workspace.openTextDocument(rightUri);
    await vscode.window.showTextDocument(rightDoc, { preview: true });
    const edit = new vscode.WorkspaceEdit();
    edit.insert(rightUri, new vscode.Position(0, 0), outText);
    await vscode.workspace.applyEdit(edit);
    await vscode.commands.executeCommand('vscode.diff', left.uri, rightUri, 'AHK v1 ↔ v2');
    lastDiffLeftUri = left.uri;
    lastDiffRightUri = rightUri;
  } catch (error) {
    throw new FileOperationError('Failed to show diff view', error);
  }
}

function showConversionStats(stats: ConversionStats) {
  const message = `Conversion completed: ${stats.linesProcessed} lines processed, ${stats.warnings} warnings, ${stats.errors} errors (${stats.conversionTime}ms)`;
  vscode.window.setStatusBarMessage(`AHK Converter: ${message}`, 5000);
  getOutput().appendLine(`[stats] ${message}`);
}

// Enhanced error handling with user-friendly messages
async function handleError(error: any, context: string): Promise<void> {
  const notificationManager = getNotificationManager();
  
  if (error instanceof ValidationError) {
    await notificationManager.showNotification({
      type: 'error',
      message: error.userMessage || 'Validation failed',
      details: error.message,
      actions: error.recoveryActions,
      learnMoreUrl: error.learnMoreUrl,
      showOutputChannel: true
    });
  } else if (error instanceof ConversionError) {
    await notificationManager.showNotification({
      type: 'error',
      message: error.userMessage || 'Conversion failed',
      details: error.message,
      actions: error.recoveryActions,
      learnMoreUrl: error.learnMoreUrl,
      showOutputChannel: true
    });
  } else if (error instanceof FileOperationError) {
    await notificationManager.showNotification({
      type: 'error',
      message: error.userMessage || 'File operation failed',
      details: error.message,
      actions: error.recoveryActions,
      showOutputChannel: true
    });
  } else if (error instanceof ConfigurationError) {
    await notificationManager.showNotification({
      type: 'error',
      message: error.userMessage || 'Configuration error',
      details: error.message,
      actions: error.recoveryActions,
      learnMoreUrl: error.learnMoreUrl,
      showOutputChannel: true
    });
  } else {
    await notificationManager.showNotification({
      type: 'error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error),
      actions: ['Show Details'],
      showOutputChannel: true
    });
  }
}

// Batch processing functionality
async function convertMultipleFiles(ctx: vscode.ExtensionContext, uris: vscode.Uri[]): Promise<BatchConversionResult[]> {
  const results: BatchConversionResult[] = [];
  const notificationManager = getNotificationManager();
  
  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: 'Converting multiple AHK files...',
    cancellable: true
  };

  await vscode.window.withProgress(progressOptions, async (progress, token) => {
    for (let i = 0; i < uris.length; i++) {
      if (token.isCancellationRequested) {
        break;
      }

      const uri = uris[i];
      const fileName = path.basename(uri.fsPath);
      
      progress.report({
        increment: (100 / uris.length),
        message: `Converting ${fileName} (${i + 1}/${uris.length})`
      });

      try {
        const content = await fs.promises.readFile(uri.fsPath, 'utf8');
        const { result, stats } = await convertText(ctx, content);
        
        results.push({
          file: fileName,
          success: true,
          result,
          stats
        });
      } catch (error) {
        results.push({
          file: fileName,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Show batch conversion summary
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  await notificationManager.showNotification({
    type: failed > 0 ? 'warning' : 'info',
    message: `Batch conversion completed: ${successful} successful, ${failed} failed`,
    details: `Processed ${results.length} files total`,
    actions: ['View Results', 'Save Successful'],
    showOutputChannel: true
  });

  return results;
}

// Save batch conversion results
async function saveBatchResults(results: BatchConversionResult[], outputDirectory?: string): Promise<void> {
  if (!outputDirectory) {
    const uri = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select output directory',
      title: 'Choose where to save converted files'
    });
    
    if (!uri || uri.length === 0) {
      return;
    }
    
    outputDirectory = uri[0].fsPath;
  }

  const successfulResults = results.filter(r => r.success && r.result);
  
  for (const result of successfulResults) {
    const outputPath = path.join(outputDirectory, result.file.replace('.ahk', '_v2.ahk'));
    await fs.promises.writeFile(outputPath, result.result!, 'utf8');
  }

  const notificationManager = getNotificationManager();
  await notificationManager.showNotification({
    type: 'info',
    message: `Saved ${successfulResults.length} converted files to ${outputDirectory}`,
    actions: ['Open Folder']
  });
}

export function activate(ctx: vscode.ExtensionContext) {
  output = vscode.window.createOutputChannel('AHK Converter');
  notificationManager = NotificationManager.getInstance();
  
  // Register test command
  registerTestCommand(ctx);
  
  const doConvert = async (mode: 'new' | 'replace' | 'diff') => {
    try {
      if (!(await ensureWindowsIfStrict())) return;

      const ed = vscode.window.activeTextEditor;
      if (!ed) {
        await getNotificationManager().showNotification({
          type: 'error',
          message: 'No active editor found',
          details: 'Please open an AHK file before attempting conversion'
        });
        return;
      }

      const { result: outText, stats } = await convertText(ctx, ed.document.getText());
      
      showConversionStats(stats);

      if (mode === 'replace') {
        await replaceCurrentEditor(outText, ed);
        vscode.window.setStatusBarMessage('AHK Converter: replaced with v2 output', 3000);
      } else if (mode === 'diff') {
        await showEnhancedDiff(outText, ed.document);
        vscode.window.setStatusBarMessage('AHK Converter: opened enhanced diff (v1 ↔ v2)', 3000);
      } else {
        await openInNewTab(outText);
        vscode.window.setStatusBarMessage('AHK Converter: opened v2 output in new tab', 3000);
      }

      // Show warnings if any
      if (stats.warnings > 0) {
        await getNotificationManager().showNotification({
          type: 'warning',
          message: `Conversion completed with ${stats.warnings} warning(s)`,
          details: 'Check the output channel for details',
          actions: ['View Details'],
          showOutputChannel: true
        });
      }
    } catch (error) {
      await handleError(error, 'Conversion');
    }
  };

  ctx.subscriptions.push(
    vscode.commands.registerCommand('ahk.convertV1toV2', () => doConvert('new')),
    vscode.commands.registerCommand('ahk.convertV1toV2.replace', () => doConvert('replace')),
    vscode.commands.registerCommand('ahk.convertV1toV2.diff', () => doConvert('diff')),
    vscode.commands.registerCommand('ahk.convertV1toV2.acceptDiff', async () => {
      try {
        if (!lastDiffLeftUri || !lastDiffRightUri) {
          await getNotificationManager().showNotification({
            type: 'error',
            message: 'No conversion diff to accept',
            details: 'Please run a conversion with diff view first'
          });
          return;
        }
        const leftDoc = await vscode.workspace.openTextDocument(lastDiffLeftUri);
        const rightDoc = await vscode.workspace.openTextDocument(lastDiffRightUri);
        const replaceRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(leftDoc.lineCount, 0));
        const we = new vscode.WorkspaceEdit();
        we.replace(leftDoc.uri, replaceRange, rightDoc.getText());
        const ok = await vscode.workspace.applyEdit(we);
        if (ok) {
          await leftDoc.save();
          await getNotificationManager().showNotification({
            type: 'info',
            message: 'Successfully accepted conversion into file',
            actions: ['Open File']
          });
        }
      } catch (error) {
        await handleError(error, 'Accept Diff');
      }
    }),
    // New batch conversion command
    vscode.commands.registerCommand('ahk.convertV1toV2.batch', async () => {
      try {
        if (!(await ensureWindowsIfStrict())) return;

        const uris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: true,
          filters: { 'AutoHotkey Files': ['ahk'] },
          openLabel: 'Convert selected files',
          title: 'Select AHK v1 files to convert'
        });

        if (!uris || uris.length === 0) {
          return;
        }

        const results = await convertMultipleFiles(ctx, uris);
        
        // Ask if user wants to save results
        const saveChoice = await vscode.window.showInformationMessage(
          'Do you want to save the converted files?',
          'Save All', 'Save Successful Only', 'Cancel'
        );

        if (saveChoice === 'Save All' || saveChoice === 'Save Successful Only') {
          await saveBatchResults(results);
        }
      } catch (error) {
        await handleError(error, 'Batch Conversion');
      }
    }),
    vscode.commands.registerCommand('ahk.launchDebugReader', async () => {
      try {
        if (!(await ensureWindowsIfStrict())) return;
        const readerPath = path.join(ctx.extensionPath, 'resources', 'DebuggerWindowReader.ahk');
        const { ahkExe } = await getPaths(ctx);
        await spawnRun(ahkExe, [readerPath]);
      } catch (error) {
        await handleError(error, 'Launch Debug Reader');
      }
    })
  );
}

// Export validation functions for testing
export { validateAHKFile, validateConversionResult };

export function deactivate() {}
