
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type RunResult = { stdout: string; stderr: string; code: number };

// Error types for better error handling
class AHKConverterError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: any) {
    super(message);
    this.name = 'AHKConverterError';
  }
}

class ValidationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class ConversionError extends AHKConverterError {
  constructor(message: string, details?: any) {
    super(message, 'CONVERSION_ERROR', details);
    this.name = 'ConversionError';
  }
}

class FileOperationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    super(message, 'FILE_OPERATION_ERROR', details);
    this.name = 'FileOperationError';
  }
}

class ConfigurationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

// Conversion statistics interface
interface ConversionStats {
  linesProcessed: number;
  warnings: number;
  errors: number;
  conversionTime: number;
}

let output: vscode.OutputChannel | undefined;
let lastDiffLeftUri: vscode.Uri | undefined;
let lastDiffRightUri: vscode.Uri | undefined;

function getOutput(): vscode.OutputChannel {
  if (!output) output = vscode.window.createOutputChannel('AHK Converter');
  return output;
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
