
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
      throw new Error('AutoHotkey v2 not found');
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
      // leave as-is; convertText will surface a clear error later
    }
  }
  return { ahkExe, converter: resolvedConverter };
}

async function convertText(ctx: vscode.ExtensionContext, srcText: string) {
  if (!srcText.trim()) {
    throw new Error('File is empty');
  }
  const { ahkExe, converter } = await getPaths(ctx);

  // Ensure converter exists
  try {
    await fs.promises.access(converter, fs.constants.F_OK);
  } catch {
    throw new Error(`Converter script not found at: ${converter}`);
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
      throw new Error(`Converter failed with code ${code}${stderr ? ': ' + stderr : ''}`);
    }
    // Wait for output file to appear; the converter writes alongside input
    try {
      const outText = await fs.promises.readFile(expectedOut, 'utf8');
      return outText;
    } catch {
      throw new Error(`Expected output not found: ${expectedOut}${stderr ? '\n' + stderr : ''}`);
    }
  });
}

async function openInNewTab(outText: string) {
  const doc = await vscode.workspace.openTextDocument({ language: 'ahk', content: outText });
  await vscode.window.showTextDocument(doc, { preview: false });
}

async function replaceCurrentEditor(outText: string, editor: vscode.TextEditor) {
  const start = new vscode.Position(0, 0);
  const end = new vscode.Position(editor.document.lineCount, 0);
  const fullRange = new vscode.Range(start, end);
  await editor.edit(e => e.replace(fullRange, outText));
}

async function showDiff(outText: string, left: vscode.TextDocument) {
  const rightUri = vscode.Uri.parse('untitled:Converted.ahk');
  const rightDoc = await vscode.workspace.openTextDocument(rightUri);
  await vscode.window.showTextDocument(rightDoc, { preview: true });
  const edit = new vscode.WorkspaceEdit();
  edit.insert(rightUri, new vscode.Position(0, 0), outText);
  await vscode.workspace.applyEdit(edit);
  await vscode.commands.executeCommand('vscode.diff', left.uri, rightUri, 'AHK v1 ↔ v2');
  lastDiffLeftUri = left.uri;
  lastDiffRightUri = rightUri;
}

export function activate(ctx: vscode.ExtensionContext) {
  output = vscode.window.createOutputChannel('AHK Converter');
  const doConvert = async (mode: 'new' | 'replace' | 'diff') => {
    if (!(await ensureWindowsIfStrict())) return;

    const ed = vscode.window.activeTextEditor;
    if (!ed) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    try {
      const outText = await convertText(ctx, ed.document.getText());
      if (mode === 'replace') {
        await replaceCurrentEditor(outText, ed);
        vscode.window.setStatusBarMessage('AHK Converter: replaced with v2 output', 3000);
      } else if (mode === 'diff') {
        await showDiff(outText, ed.document);
        vscode.window.setStatusBarMessage('AHK Converter: opened diff (v1 ↔ v2)', 3000);
      } else {
        await openInNewTab(outText);
        vscode.window.setStatusBarMessage('AHK Converter: opened v2 output in new tab', 3000);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(err?.message || String(err));
    }
  };

  ctx.subscriptions.push(
    vscode.commands.registerCommand('ahk.convertV1toV2', () => doConvert('new')),
    vscode.commands.registerCommand('ahk.convertV1toV2.replace', () => doConvert('replace')),
    vscode.commands.registerCommand('ahk.convertV1toV2.diff', () => doConvert('diff')),
    vscode.commands.registerCommand('ahk.convertV1toV2.acceptDiff', async () => {
      try {
        if (!lastDiffLeftUri || !lastDiffRightUri) {
          vscode.window.showErrorMessage('No conversion diff to accept.');
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
          vscode.window.setStatusBarMessage('AHK Converter: accepted conversion into file', 3000);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(err?.message || String(err));
      }
    }),
    vscode.commands.registerCommand('ahk.launchDebugReader', async () => {
      try {
        if (!(await ensureWindowsIfStrict())) return;
        const readerPath = path.join(ctx.extensionPath, 'resources', 'DebuggerWindowReader.ahk');
        const { ahkExe } = await getPaths(ctx);
        await spawnRun(ahkExe, [readerPath]);
      } catch (err: any) {
        vscode.window.showErrorMessage(err?.message || String(err));
      }
    })
  );
}

export function deactivate() {}
