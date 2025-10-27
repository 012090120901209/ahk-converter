"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.validateAHKFile = validateAHKFile;
exports.validateConversionResult = validateConversionResult;
exports.deactivate = deactivate;
const vscode = require("vscode");
const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const conversionProfiles_1 = require("./conversionProfiles");
const performanceOptimizer_1 = require("./performanceOptimizer");
const telemetry_1 = require("./telemetry");
const debuggerIntegration_1 = require("./debuggerIntegration");
const functionHoverProvider_1 = require("./functionHoverProvider");
const toolboxSidebarProvider_1 = require("./toolboxSidebarProvider");
const functionMetadataHandler_1 = require("./functionMetadataHandler");
const functionAnalyzer_1 = require("./functionAnalyzer");
const testCommand_1 = require("./test/testCommand");
const ahkCodeFormatter_1 = require("./ahkCodeFormatter");
const ahkCodeFixProvider_1 = require("./ahkCodeFixProvider");
const functionTreeProvider_1 = require("./functionTreeProvider");
const lspIntegration_1 = require("./lspIntegration");
const dependencyTreeProvider_1 = require("./dependencyTreeProvider");
const packageManagerProvider_1 = require("./packageManagerProvider");
const settingsWebviewProvider_1 = require("./settingsWebviewProvider");
const metadataEditorProvider_1 = require("./metadataEditorProvider");
// Enhanced error types for better error handling with user-friendly messages
class AHKConverterError extends Error {
    constructor(message, code, details, userMessage, learnMoreUrl, recoveryActions) {
        super(message);
        this.code = code;
        this.details = details;
        this.userMessage = userMessage;
        this.learnMoreUrl = learnMoreUrl;
        this.recoveryActions = recoveryActions;
        this.name = 'AHKConverterError';
    }
}
class ValidationError extends AHKConverterError {
    constructor(message, details) {
        const userMessage = 'The AHK file could not be validated for conversion.';
        const learnMoreUrl = 'https://www.autohotkey.com/docs/v2/v1-to-v2.htm';
        const recoveryActions = ['Check file syntax', 'Ensure file contains AHK v1 code', 'View error details'];
        super(message, 'VALIDATION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
        this.name = 'ValidationError';
    }
}
class ConversionError extends AHKConverterError {
    constructor(message, details) {
        const userMessage = 'The conversion process encountered an error.';
        const learnMoreUrl = 'https://www.autohotkey.com/docs/v2/v1-to-v2.htm#common-issues';
        const recoveryActions = ['Check AHK v2 installation', 'Try simpler conversion', 'View error details'];
        super(message, 'CONVERSION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
        this.name = 'ConversionError';
    }
}
class FileOperationError extends AHKConverterError {
    constructor(message, details) {
        const userMessage = 'File operation failed during conversion.';
        const recoveryActions = ['Check file permissions', 'Ensure file is not locked', 'Try saving file first'];
        super(message, 'FILE_OPERATION_ERROR', details, userMessage, undefined, recoveryActions);
        this.name = 'FileOperationError';
    }
}
class ConfigurationError extends AHKConverterError {
    constructor(message, details) {
        const userMessage = 'Extension configuration is incomplete or incorrect.';
        const learnMoreUrl = 'https://github.com/TrueCrimeAudit/ahk-converter#configuration';
        const recoveryActions = ['Open Settings', 'Check AHK v2 path', 'Reset to defaults'];
        super(message, 'CONFIGURATION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
        this.name = 'ConfigurationError';
    }
}
class NotificationManager {
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('AHKv2 Toolbox');
    }
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
    async showNotification(options) {
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
        let result;
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
        }
        else if (result === 'Show Details' || showOutputChannel) {
            this.outputChannel.show();
        }
        return result;
    }
    getOutputChannel() {
        return this.outputChannel;
    }
    appendLine(message) {
        this.outputChannel.appendLine(message);
    }
    show() {
        this.outputChannel.show();
    }
}
let output;
let lastDiffLeftUri;
let lastDiffRightUri;
let notificationManager;
let profileManager;
let telemetryManager;
let debuggerIntegration;
function getOutput() {
    if (!output)
        output = vscode.window.createOutputChannel('AHKv2 Toolbox');
    return output;
}
function getNotificationManager() {
    if (!notificationManager)
        notificationManager = NotificationManager.getInstance();
    return notificationManager;
}
function spawnRun(cmd, args, cwd) {
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
            if (stderr.trim())
                getOutput().appendLine(`[stderr] ${stderr.trim()}`);
            if (stdout.trim())
                getOutput().appendLine(`[stdout] ${stdout.trim()}`);
            getOutput().appendLine(`[exit] code=${code ?? -1}`);
            resolve({ stdout, stderr, code: code ?? -1 });
        });
    });
}
async function ensureWindowsIfStrict() {
    try {
        const cfg = vscode.workspace.getConfiguration('ahkConverter');
        if (cfg.get('strictWindowsOnly') && process.platform !== 'win32') {
            const choice = await vscode.window.showWarningMessage('AHK v1 to v2 Converter is designed for Windows. Continue anyway?', 'Continue', 'Cancel');
            return choice === 'Continue';
        }
        return true;
    }
    catch (error) {
        throw new ConfigurationError('Failed to check Windows strict mode setting', error);
    }
}
async function getPaths(ctx) {
    try {
        const cfg = vscode.workspace.getConfiguration('ahkConverter');
        const configuredAhk = (cfg.get('autoHotkeyV2Path') || '').replace(/"/g, '');
        const ahkCandidates = [];
        if (configuredAhk)
            ahkCandidates.push(configuredAhk);
        // Common installs
        ahkCandidates.push('AutoHotkey64.exe', path.join(process.env['ProgramFiles'] || 'C:/Program Files', 'AutoHotkey', 'v2', 'AutoHotkey64.exe'), path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'AutoHotkey', 'v2', 'AutoHotkey64.exe'), path.join(process.env['LOCALAPPDATA'] || 'C:/Users/Default/AppData/Local', 'Programs', 'AutoHotkey', 'v2', 'AutoHotkey64.exe'));
        async function promptForAhkExe(suggest) {
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
            }
            catch (error) {
                throw new ConfigurationError('Failed to prompt for AutoHotkey executable', error);
            }
        }
        async function findExisting(exes) {
            for (const exe of exes) {
                try {
                    // If it is not an absolute path, rely on PATH resolution by trying to spawn "where"
                    if (!path.isAbsolute(exe)) {
                        const whereCmd = process.platform === 'win32' ? 'where' : 'which';
                        const result = await spawnRun(whereCmd, [exe]);
                        if (result.code === 0 && result.stdout.trim())
                            return exe;
                    }
                    else {
                        await fs.promises.access(exe, fs.constants.X_OK | fs.constants.F_OK);
                        return exe;
                    }
                }
                catch {
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
            }
            else {
                const choice = await vscode.window.showErrorMessage('AutoHotkey v2 executable not found. Set "ahkConverter.autoHotkeyV2Path" to your AutoHotkey64.exe.', 'Open Settings');
                if (choice === 'Open Settings') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'ahkConverter.autoHotkeyV2Path');
                }
                throw new ConfigurationError('AutoHotkey v2 not found');
            }
        }
        const configuredConverter = (cfg.get('converterScriptPath') || '').replace(/"/g, '');
        let resolvedConverter = configuredConverter
            ? configuredConverter.replace('${extensionPath}', ctx.extensionPath)
            : path.join(ctx.extensionPath, 'vendor', 'v2converter.ahk');
        try {
            await fs.promises.access(resolvedConverter, fs.constants.F_OK);
        }
        catch {
            const fallback = path.join(ctx.extensionPath, 'vendor', 'v2converter_silent.ahk');
            try {
                await fs.promises.access(fallback, fs.constants.F_OK);
                resolvedConverter = fallback;
            }
            catch {
                throw new ConfigurationError(`Converter script not found at: ${resolvedConverter} or ${fallback}`);
            }
        }
        return { ahkExe, converter: resolvedConverter };
    }
    catch (error) {
        if (error instanceof AHKConverterError) {
            throw error;
        }
        throw new ConfigurationError('Failed to get paths configuration', error);
    }
}
// Input validation for AHK files
function validateAHKFile(content, filePath) {
    const warnings = [];
    const errors = [];
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
            if (line.startsWith(';') || line === '')
                continue;
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
    }
    catch (error) {
        errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
        return { isValid: false, warnings, errors };
    }
}
// Conversion validation
function validateConversionResult(originalContent, convertedContent) {
    const warnings = [];
    const errors = [];
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
            if (line.startsWith(';') || line === '')
                continue;
            // Basic syntax checks
            if (line.includes('If ') && !line.includes('If (') && !line.includes('{')) {
                warnings.push(`Line ${i + 1}: Potential syntax issue with If statement`);
            }
        }
        return { isValid: errors.length === 0, warnings, errors };
    }
    catch (error) {
        errors.push(`Conversion validation error: ${error instanceof Error ? error.message : String(error)}`);
        return { isValid: false, warnings, errors };
    }
}
async function convertText(ctx, srcText) {
    const startTime = Date.now();
    const stats = {
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
        }
        catch {
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
                }
                catch (cleanupError) {
                    getOutput().appendLine(`[cleanup] Failed to clean up temp directory: ${cleanupError}`);
                }
                return { result: outText, stats };
            }
            catch {
                throw new ConversionError(`Expected output not found: ${expectedOut}${stderr ? '\n' + stderr : ''}`);
            }
        });
    }
    catch (error) {
        stats.conversionTime = Date.now() - startTime;
        if (error instanceof AHKConverterError) {
            throw error;
        }
        throw new ConversionError('Unexpected error during conversion', error);
    }
}
// Enhanced diff view with better options
async function showEnhancedDiff(outText, left, options) {
    try {
        const defaultOptions = {
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
    }
    catch (error) {
        throw new FileOperationError('Failed to show enhanced diff view', error);
    }
}
async function openInNewTab(outText) {
    try {
        const doc = await vscode.workspace.openTextDocument({ language: 'ahk', content: outText });
        await vscode.window.showTextDocument(doc, { preview: false });
    }
    catch (error) {
        throw new FileOperationError('Failed to open converted file in new tab', error);
    }
}
async function replaceCurrentEditor(outText, editor) {
    try {
        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(editor.document.lineCount, 0);
        const fullRange = new vscode.Range(start, end);
        await editor.edit(e => e.replace(fullRange, outText));
    }
    catch (error) {
        throw new FileOperationError('Failed to replace current editor content', error);
    }
}
async function showDiff(outText, left) {
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
    }
    catch (error) {
        throw new FileOperationError('Failed to show diff view', error);
    }
}
function showConversionStats(stats) {
    const message = `Conversion completed: ${stats.linesProcessed} lines processed, ${stats.warnings} warnings, ${stats.errors} errors (${stats.conversionTime}ms)`;
    vscode.window.setStatusBarMessage(`AHKv2 Toolbox: ${message}`, 5000);
    getOutput().appendLine(`[stats] ${message}`);
}
// Enhanced error handling with user-friendly messages
async function handleError(error, context) {
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
    }
    else if (error instanceof ConversionError) {
        await notificationManager.showNotification({
            type: 'error',
            message: error.userMessage || 'Conversion failed',
            details: error.message,
            actions: error.recoveryActions,
            learnMoreUrl: error.learnMoreUrl,
            showOutputChannel: true
        });
    }
    else if (error instanceof FileOperationError) {
        await notificationManager.showNotification({
            type: 'error',
            message: error.userMessage || 'File operation failed',
            details: error.message,
            actions: error.recoveryActions,
            showOutputChannel: true
        });
    }
    else if (error instanceof ConfigurationError) {
        await notificationManager.showNotification({
            type: 'error',
            message: error.userMessage || 'Configuration error',
            details: error.message,
            actions: error.recoveryActions,
            learnMoreUrl: error.learnMoreUrl,
            showOutputChannel: true
        });
    }
    else {
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
async function convertMultipleFiles(ctx, uris) {
    const results = [];
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
            }
            catch (error) {
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
async function saveBatchResults(results, outputDirectory) {
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
        await fs.promises.writeFile(outputPath, result.result, 'utf8');
    }
    const notificationManager = getNotificationManager();
    await notificationManager.showNotification({
        type: 'info',
        message: `Saved ${successfulResults.length} converted files to ${outputDirectory}`,
        actions: ['Open Folder']
    });
}
function activate(ctx) {
    // Check for LSP extension and show notification if not found
    const lspIntegration = lspIntegration_1.AHKLSPIntegration.getInstance();
    // Check LSP availability after a short delay to let other extensions activate
    setTimeout(async () => {
        const isAvailable = await lspIntegration.isLSPAvailable();
        if (!isAvailable) {
            // Check if user has dismissed this warning before
            const dontShowAgain = ctx.globalState.get('ahkv2-toolbox.dontShowLSPWarning', false);
            if (!dontShowAgain) {
                const choice = await vscode.window.showInformationMessage('AHKv2 Toolbox works best with the "AutoHotkey v2 Language Support" extension by thqby for accurate parsing and IntelliSense.', 'Install Extension', 'Don\'t Show Again', 'Dismiss');
                if (choice === 'Install Extension') {
                    try {
                        await vscode.commands.executeCommand('workbench.extensions.installExtension', 'thqby.vscode-autohotkey2-lsp');
                        vscode.window.showInformationMessage('AutoHotkey v2 LSP extension installed! Please reload VS Code to activate it.', 'Reload Now').then(reload => {
                            if (reload === 'Reload Now') {
                                vscode.commands.executeCommand('workbench.action.reloadWindow');
                            }
                        });
                    }
                    catch (error) {
                        vscode.window.showErrorMessage('Failed to install extension. Please install manually from the Extensions view.');
                    }
                }
                else if (choice === 'Don\'t Show Again') {
                    await ctx.globalState.update('ahkv2-toolbox.dontShowLSPWarning', true);
                }
            }
        }
    }, 2000);
    // Initialize Toolbox Sidebar Provider
    const toolboxProvider = new toolboxSidebarProvider_1.ToolboxSidebarProvider(ctx.extensionUri);
    ctx.subscriptions.push(vscode.window.registerWebviewViewProvider('ahkv2Toolbox', toolboxProvider));
    // Initialize Code Map Tree Provider
    const codeMapProvider = new functionTreeProvider_1.FunctionTreeProvider(ctx);
    const codeMapView = vscode.window.createTreeView('codeMap', {
        treeDataProvider: codeMapProvider,
        showCollapseAll: true,
        canSelectMany: true, // Enable multi-select
        dragAndDropController: codeMapProvider, // Enable drag & drop
    });
    ctx.subscriptions.push(codeMapView, vscode.commands.registerCommand('codeMap.refresh', () => {
        codeMapProvider.refresh();
    }), vscode.commands.registerCommand('codeMap.jumpToDefinition', (item) => {
        codeMapProvider.jumpToDefinition(item);
    }), vscode.commands.registerCommand('codeMap.jumpToInclude', (item) => {
        codeMapProvider.jumpToInclude(item);
    }), 
    // Filter commands
    vscode.commands.registerCommand('codeMap.showAll', () => {
        codeMapProvider.showAll();
        vscode.window.showInformationMessage('Code Map: Showing all items');
    }), vscode.commands.registerCommand('codeMap.showOnlyClasses', () => {
        codeMapProvider.showOnly('class');
        vscode.window.showInformationMessage('Code Map: Showing only classes');
    }), vscode.commands.registerCommand('codeMap.showOnlyFunctions', () => {
        codeMapProvider.showOnly('function');
        codeMapProvider.toggleFilter('method'); // Include methods with functions
        vscode.window.showInformationMessage('Code Map: Showing only functions and methods');
    }), vscode.commands.registerCommand('codeMap.showOnlyVariables', () => {
        codeMapProvider.showOnly('variable');
        vscode.window.showInformationMessage('Code Map: Showing only variables');
    }), vscode.commands.registerCommand('codeMap.toggleClasses', () => {
        codeMapProvider.toggleFilter('class');
    }), vscode.commands.registerCommand('codeMap.toggleFunctions', () => {
        codeMapProvider.toggleFilter('function');
    }), vscode.commands.registerCommand('codeMap.toggleMethods', () => {
        codeMapProvider.toggleFilter('method');
    }), vscode.commands.registerCommand('codeMap.toggleVariables', () => {
        codeMapProvider.toggleFilter('variable');
    }), 
    // Scoping commands
    vscode.commands.registerCommand('codeMap.scopeToItem', (item) => {
        codeMapProvider.scopeToItem(item);
        vscode.window.showInformationMessage(`Code Map: Scoped to ${item.label}`);
    }), vscode.commands.registerCommand('codeMap.clearScope', () => {
        codeMapProvider.clearScope();
        vscode.window.showInformationMessage('Code Map: Scope cleared');
    }), 
    // Export command
    vscode.commands.registerCommand('codeMap.exportAsAsciiTree', async () => {
        await codeMapProvider.exportAsAsciiTree();
    }), vscode.commands.registerCommand('ahkv2Toolbox.installLSP', async () => {
        await lspIntegration.showLSPNotInstalledWarning();
    }));
    // Initialize Dependency Tree Provider
    try {
        const dependencyTreeProvider = new dependencyTreeProvider_1.DependencyTreeProvider(ctx);
        const dependencyTreeView = vscode.window.createTreeView('ahkDependencyTree', {
            treeDataProvider: dependencyTreeProvider,
            showCollapseAll: true
        });
        ctx.subscriptions.push(dependencyTreeView, vscode.commands.registerCommand('ahkDependencyTree.refresh', () => {
            dependencyTreeProvider.refresh();
        }), vscode.commands.registerCommand('ahkDependencyTree.openFile', async (filePath) => {
            try {
                // Open the clicked file
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
            }
        }), vscode.commands.registerCommand('ahkDependencyTree.pin', () => {
            dependencyTreeProvider.pinCurrentFile();
        }), vscode.commands.registerCommand('ahkDependencyTree.unpin', () => {
            dependencyTreeProvider.clearPin();
        }));
    }
    catch (error) {
        // If no workspace, dependency tree won't work - that's OK
        console.log('Dependency tree not initialized (no workspace folder)');
    }
    // Initialize Package Manager Provider
    try {
        const packageManagerProvider = new packageManagerProvider_1.PackageManagerProvider(ctx);
        const packageManagerView = vscode.window.createTreeView('ahkPackageManager', {
            treeDataProvider: packageManagerProvider,
            showCollapseAll: true
        });
        ctx.subscriptions.push(packageManagerView, vscode.commands.registerCommand('ahkPackageManager.refresh', () => {
            packageManagerProvider.refresh();
        }), vscode.commands.registerCommand('ahkPackageManager.installPackage', async (packageItem) => {
            if (packageItem) {
                await packageManagerProvider.installPackage(packageItem);
            }
        }), vscode.commands.registerCommand('ahkPackageManager.uninstallPackage', async (packageItem) => {
            if (packageItem) {
                await packageManagerProvider.uninstallPackage(packageItem);
            }
        }), vscode.commands.registerCommand('ahkPackageManager.updatePackage', async (packageItem) => {
            if (packageItem) {
                await packageManagerProvider.updatePackage(packageItem);
            }
        }), vscode.commands.registerCommand('ahkPackageManager.showPackageDetails', async (packageItem) => {
            if (packageItem) {
                await packageManagerProvider.showPackageDetails(packageItem);
            }
        }), vscode.commands.registerCommand('ahkPackageManager.searchPackages', async () => {
            const searchTerm = await vscode.window.showInputBox({
                prompt: 'Search for AHK packages',
                placeHolder: 'Enter package name or keyword...'
            });
            if (searchTerm) {
                vscode.window.showInformationMessage(`Searching for "${searchTerm}"...`);
                // TODO: Implement actual search functionality
            }
        }), vscode.commands.registerCommand('ahkPackageManager.editMetadata', async (packageItem) => {
            if (packageItem && packageItem.packagePath.endsWith('.ahk')) {
                await metadataEditorProvider_1.MetadataEditorProvider.show(ctx, packageItem.packagePath);
            }
        }), vscode.commands.registerCommand('ahkPackageManager.generateJSDocHeader', async (packageItem) => {
            if (packageItem && packageItem.packagePath.endsWith('.ahk')) {
                vscode.window.showInformationMessage('AI JSDoc generation coming soon! See docs/JSDOC_GENERATION_GUIDE.md for manual guidelines.', 'Open Guide').then(selection => {
                    if (selection === 'Open Guide') {
                        const guidePath = path.join(ctx.extensionPath, 'docs', 'JSDOC_GENERATION_GUIDE.md');
                        vscode.workspace.openTextDocument(guidePath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            }
        }));
    }
    catch (error) {
        console.log('Package Manager not initialized:', error);
    }
    // Initialize Settings Webview Provider
    try {
        const settingsProvider = new settingsWebviewProvider_1.SettingsWebviewProvider(ctx.extensionUri);
        ctx.subscriptions.push(vscode.window.registerWebviewViewProvider(settingsWebviewProvider_1.SettingsWebviewProvider.viewType, settingsProvider), vscode.commands.registerCommand('ahkv2Toolbox.openSettings', () => {
            vscode.commands.executeCommand('workbench.view.extension.ahkv2-toolbox');
            vscode.commands.executeCommand('ahkv2Toolbox.settings.focus');
        }));
    }
    catch (error) {
        console.log('Settings Provider not initialized:', error);
    }
    // Compile and Reload Debugger Command
    ctx.subscriptions.push(vscode.commands.registerCommand('ahk.compileAndReload', async () => {
        try {
            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Compiling and reloading...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Compiling TypeScript..." });
                // Run compile task
                const tasks = await vscode.tasks.fetchTasks();
                const compileTask = tasks.find(task => task.name === 'npm: compile' || task.name === 'compile');
                if (compileTask) {
                    await vscode.tasks.executeTask(compileTask);
                    // Wait for task to complete
                    await new Promise((resolve) => {
                        const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
                            if (e.execution.task === compileTask) {
                                disposable.dispose();
                                resolve();
                            }
                        });
                    });
                    progress.report({ increment: 50, message: "Restarting debugger..." });
                    // Restart debugger if running, otherwise just notify
                    const debugSession = vscode.debug.activeDebugSession;
                    if (debugSession) {
                        await vscode.commands.executeCommand('workbench.action.debug.restart');
                        vscode.window.showInformationMessage('✅ Compiled and debugger restarted!');
                    }
                    else {
                        vscode.window.showInformationMessage('✅ Compiled! Press F5 to start debugging.');
                    }
                }
                else {
                    vscode.window.showErrorMessage('Compile task not found!');
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to compile and reload: ${error}`);
        }
    }));
    // Function Metadata Extraction
    ctx.subscriptions.push(vscode.commands.registerCommand('ahk.extractFunctionMetadata', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'No active editor found',
                    details: 'Please open an AHK file before extracting metadata'
                });
                return;
            }
            const metadata = functionAnalyzer_1.FunctionAnalyzer.extractFunctionMetadata(editor.document);
            // Create a markdown view for the metadata
            const metadataContent = metadata.map(func => {
                return `## Function: ${func.name}

` +
                    `- **Parameters**: ${func.parameters.map(p => `${p.isByRef ? '&' : ''}${p.name}${p.hasDefault ? ` = ${p.defaultValue}` : ''}
            `).join(', ')}
` +
                    `- **Static Variables**: ${func.staticVariables.map(v => v.name).join(', ')}
` +
                    `- **Local Variables**: ${func.localVariables.map(v => v.name).join(', ')}
` +
                    `- **Location**: Line ${func.location.startLine + 1} - ${func.location.endLine + 1}
`;
            }).join('\n\n');
            const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: metadataContent });
            await vscode.window.showTextDocument(doc, { preview: false });
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Extracted metadata for ${metadata.length} function(s)`,
                details: `Found functions: ${metadata.map(f => f.name).join(', ')}`
            });
        }
        catch (error) {
            await handleError(error, 'Extract Function Metadata');
        }
    }));
    output = vscode.window.createOutputChannel('AHKv2 Toolbox');
    notificationManager = NotificationManager.getInstance();
    // Register test command
    (0, testCommand_1.registerTestCommand)(ctx);
    // Initialize advanced features
    profileManager = conversionProfiles_1.ConversionProfileManager.getInstance(ctx);
    telemetryManager = (0, telemetry_1.getTelemetryManager)(ctx);
    debuggerIntegration = debuggerIntegration_1.DebuggerIntegration.getInstance(ctx);
    const doConvert = async (mode) => {
        try {
            if (!(await ensureWindowsIfStrict()))
                return;
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
                vscode.window.setStatusBarMessage('AHKv2 Toolbox: replaced with v2 output', 3000);
            }
            else if (mode === 'diff') {
                await showEnhancedDiff(outText, ed.document);
                vscode.window.setStatusBarMessage('AHKv2 Toolbox: opened enhanced diff (v1 ↔ v2)', 3000);
            }
            else {
                await openInNewTab(outText);
                vscode.window.setStatusBarMessage('AHKv2 Toolbox: opened v2 output in new tab', 3000);
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
        }
        catch (error) {
            await handleError(error, 'Conversion');
        }
    };
    // Register formatting providers
    ctx.subscriptions.push(ahkCodeFormatter_1.AHKCodeFormatter.registerFormattingProvider(), ahkCodeFixProvider_1.AHKCodeFixProvider.registerCodeActionProvider(), vscode.languages.registerHoverProvider('ahk', new functionHoverProvider_1.FunctionHoverProvider()));
    // Register Function Metadata Handler
    functionMetadataHandler_1.FunctionMetadataHandler.registerFunctionMetadataRequest(ctx);
    ctx.subscriptions.push(vscode.commands.registerCommand('ahk.convertV1toV2', () => doConvert('new')), vscode.commands.registerCommand('ahk.convertV1toV2.replace', () => doConvert('replace')), vscode.commands.registerCommand('ahk.convertV1toV2.diff', () => doConvert('diff')), vscode.commands.registerCommand('ahk.convertV1toV2.acceptDiff', async () => {
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
        }
        catch (error) {
            await handleError(error, 'Accept Diff');
        }
    }), 
    // New batch conversion command
    vscode.commands.registerCommand('ahk.convertV1toV2.batch', async () => {
        try {
            if (!(await ensureWindowsIfStrict()))
                return;
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
            const saveChoice = await vscode.window.showInformationMessage('Do you want to save the converted files?', 'Save All', 'Save Successful Only', 'Cancel');
            if (saveChoice === 'Save All' || saveChoice === 'Save Successful Only') {
                await saveBatchResults(results);
            }
        }
        catch (error) {
            await handleError(error, 'Batch Conversion');
        }
    }), vscode.commands.registerCommand('ahk.launchDebugReader', async () => {
        try {
            if (!(await ensureWindowsIfStrict()))
                return;
            const readerPath = path.join(ctx.extensionPath, 'resources', 'DebuggerWindowReader.ahk');
            const { ahkExe } = await getPaths(ctx);
            await spawnRun(ahkExe, [readerPath]);
        }
        catch (error) {
            await handleError(error, 'Launch Debug Reader');
        }
    }), 
    // Advanced conversion profiles commands
    vscode.commands.registerCommand('ahk.selectProfile', async () => {
        try {
            const profiles = profileManager.getAllProfiles();
            const profileNames = profiles.map(p => p.name);
            const selected = await vscode.window.showQuickPick(profileNames, {
                placeHolder: 'Select conversion profile',
                title: 'AHK Conversion Profiles'
            });
            if (selected) {
                const config = vscode.workspace.getConfiguration('ahkConverter');
                await config.update('selectedProfile', selected, vscode.ConfigurationTarget.Workspace);
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: `Selected profile: ${selected}`,
                    details: `Profile: ${selected}`
                });
            }
        }
        catch (error) {
            await handleError(error, 'Select Profile');
        }
    }), vscode.commands.registerCommand('ahk.manageProfiles', async () => {
        try {
            const action = await vscode.window.showQuickPick(['Create New Profile', 'Edit Existing Profile', 'Delete Profile', 'Import Profile', 'Export Profile'], {
                placeHolder: 'Choose action',
                title: 'Manage Conversion Profiles'
            });
            switch (action) {
                case 'Create New Profile':
                    await showCreateProfileDialog();
                    break;
                case 'Edit Existing Profile':
                    await showEditProfileDialog();
                    break;
                case 'Delete Profile':
                    await showDeleteProfileDialog();
                    break;
                case 'Import Profile':
                    await showImportProfileDialog();
                    break;
                case 'Export Profile':
                    await showExportProfileDialog();
                    break;
            }
        }
        catch (error) {
            await handleError(error, 'Manage Profiles');
        }
    }), vscode.commands.registerCommand('ahk.convertWithProfile', async () => {
        try {
            if (!(await ensureWindowsIfStrict()))
                return;
            const ed = vscode.window.activeTextEditor;
            if (!ed) {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'No active editor found',
                    details: 'Please open an AHK file before attempting conversion'
                });
                return;
            }
            const config = vscode.workspace.getConfiguration('ahkConverter');
            const selectedProfile = config.get('selectedProfile', 'normal');
            const profile = profileManager.getProfile(selectedProfile);
            if (!profile) {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'Selected profile not found',
                    details: `Profile: ${selectedProfile}`
                });
                return;
            }
            const startTime = Date.now();
            telemetryManager.recordConversion({
                fileSize: ed.document.getText().length,
                lineCount: ed.document.lineCount,
                processingTime: 0,
                profileUsed: selectedProfile,
                success: false,
                warnings: 0,
                errors: 0,
                conversionMode: 'new'
            });
            const { result: outText, stats } = await convertWithProfile(ctx, ed.document.getText(), profile);
            stats.processingTime = Date.now() - startTime;
            telemetryManager.recordConversion({
                ...stats,
                profileUsed: selectedProfile,
                conversionMode: 'new'
            });
            showConversionStats(stats);
            await openInNewTab(outText);
            if (stats.warnings > 0) {
                await getNotificationManager().showNotification({
                    type: 'warning',
                    message: `Conversion completed with ${stats.warnings} warning(s)`,
                    details: 'Check the output channel for details',
                    actions: ['View Details'],
                    showOutputChannel: true
                });
            }
        }
        catch (error) {
            await handleError(error, 'Convert with Profile');
        }
    }), vscode.commands.registerCommand('ahk.showTelemetry', async () => {
        try {
            const stats = await telemetryManager.getConversionStats(7);
            const errorStats = await telemetryManager.getErrorStats(7);
            const perfStats = await telemetryManager.getPerformanceStats(7);
            const message = `
Conversion Statistics (7 days):
- Total conversions: ${stats?.total || 0}
- Success rate: ${stats?.successRate || 0}%
- Average processing time: ${stats?.avgProcessingTime || 0}ms

Error Statistics (7 days):
- Total errors: ${errorStats?.total || 0}
- Most common error: ${errorStats?.mostCommon || 'None'}

Performance Statistics (7 days):
- Average duration: ${perfStats?.avgDuration || 0}ms
- Average memory usage: ${perfStats?.avgMemoryUsage || 0}MB
        `;
            const doc = await vscode.workspace.openTextDocument({
                language: 'markdown',
                content: message
            });
            await vscode.window.showTextDocument(doc, { preview: false });
        }
        catch (error) {
            await handleError(error, 'Show Telemetry');
        }
    }), vscode.commands.registerCommand('ahk.clearTelemetry', async () => {
        try {
            const confirm = await vscode.window.showWarningMessage('Are you sure you want to clear all telemetry data?', 'Clear Data', 'Cancel');
            if (confirm === 'Clear Data') {
                await telemetryManager.clearData();
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Telemetry data cleared successfully'
                });
            }
        }
        catch (error) {
            await handleError(error, 'Clear Telemetry');
        }
    }), vscode.commands.registerCommand('ahk.exportTelemetry', async () => {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('ahk-telemetry-export.json'),
                filters: { 'JSON Files': ['json'] },
                saveLabel: 'Export Telemetry Data'
            });
            if (uri) {
                const success = await telemetryManager.exportData(uri.fsPath);
                if (success) {
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: 'Telemetry data exported successfully',
                        actions: ['Open Folder']
                    });
                }
                else {
                    await getNotificationManager().showNotification({
                        type: 'error',
                        message: 'Failed to export telemetry data'
                    });
                }
            }
        }
        catch (error) {
            await handleError(error, 'Export Telemetry');
        }
    }), vscode.commands.registerCommand('ahk.assistWithDebugging', async () => {
        try {
            if (!(await ensureWindowsIfStrict()))
                return;
            const ed = vscode.window.activeTextEditor;
            if (!ed) {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'No active editor found',
                    details: 'Please open an AHK file before attempting conversion'
                });
                return;
            }
            const originalCode = ed.document.getText();
            const { result: convertedCode } = await convertText(ctx, originalCode);
            const debugData = await debuggerIntegration.assistWithConversion(originalCode, convertedCode);
            // Show debug assistance
            const assistance = await debuggerIntegration.getDebuggingAssistance(convertedCode);
            const assistanceMessage = `
Debugging Assistance:
- Suggested breakpoints: ${assistance.breakpoints.join(', ')}
- Variables to watch: ${assistance.watchVariables.join(', ')}
- Recommendations: ${assistance.recommendations.join('\n')}

Issues Found: ${debugData.debugData.issues.length}
Suggestions: ${debugData.debugData.suggestions.length}
        `;
            await getNotificationManager().showNotification({
                type: 'info',
                message: 'Debugging assistance generated',
                details: assistanceMessage,
                actions: ['View Details'],
                showOutputChannel: true
            });
        }
        catch (error) {
            await handleError(error, 'Assist with Debugging');
        }
    }), vscode.commands.registerCommand('ahk.formatDocument', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'No active editor found',
                    details: 'Please open an AHK file before formatting'
                });
                return;
            }
            const edits = await ahkCodeFormatter_1.AHKCodeFormatter.formatDocument(editor.document);
            if (edits.length > 0) {
                await vscode.workspace.applyEdit(new vscode.WorkspaceEdit());
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Document formatted successfully'
                });
            }
            else {
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Document is already properly formatted'
                });
            }
        }
        catch (error) {
            await handleError(error, 'Format Document');
        }
    }), vscode.commands.registerCommand('ahk.applyFormattingFix', async (document, range, fixTitle) => {
        try {
            await ahkCodeFixProvider_1.AHKCodeFixProvider.applyCodeFix(document, range, fixTitle);
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Applied formatting fix: ${fixTitle}`
            });
        }
        catch (error) {
            await handleError(error, 'Apply Formatting Fix');
        }
    }), vscode.commands.registerCommand('ahk.updateHeader', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'No active editor found',
                    details: 'Please open an AHK file before updating header'
                });
                return;
            }
            const document = editor.document;
            const text = document.getText();
            const lines = text.split('\n');
            const targetRequires = '#Requires AutoHotkey v2.1-alpha.17';
            const targetSingleInstance = '#SingleInstance Force';
            // Find existing directives
            let requiresLineIndex = -1;
            let requiresVersion = '';
            let singleInstanceLineIndex = -1;
            let singleInstanceValue = '';
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // Check for #Requires directive
                const requiresMatch = line.match(/^#Requires\s+AutoHotkey\s+(.+)/i);
                if (requiresMatch && requiresLineIndex === -1) {
                    requiresLineIndex = i;
                    requiresVersion = requiresMatch[1].trim();
                }
                // Check for #SingleInstance directive
                const singleInstanceMatch = line.match(/^#SingleInstance\s+(.+)/i);
                if (singleInstanceMatch && singleInstanceLineIndex === -1) {
                    singleInstanceLineIndex = i;
                    singleInstanceValue = singleInstanceMatch[1].trim();
                }
            }
            const hasCorrectRequires = requiresVersion === 'v2.1-alpha.17';
            const hasCorrectSingleInstance = singleInstanceValue === 'Force';
            // Check if everything is already correct
            if (hasCorrectRequires && hasCorrectSingleInstance) {
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Header directives are already up to date'
                });
                return;
            }
            const edit = new vscode.WorkspaceEdit();
            let updateMessage = [];
            // Handle #Requires directive
            if (requiresLineIndex !== -1 && !hasCorrectRequires) {
                // Found an outdated version, ask to update
                const choice = await vscode.window.showInformationMessage(`Found outdated #Requires directive: AutoHotkey ${requiresVersion}. Update to v2.1-alpha.17?`, 'Update', 'Skip');
                if (choice === 'Update') {
                    const lineRange = new vscode.Range(new vscode.Position(requiresLineIndex, 0), new vscode.Position(requiresLineIndex, lines[requiresLineIndex].length));
                    edit.replace(document.uri, lineRange, targetRequires);
                    updateMessage.push('Updated #Requires to v2.1-alpha.17');
                }
            }
            else if (requiresLineIndex === -1) {
                // No #Requires directive found, add it
                edit.insert(document.uri, new vscode.Position(0, 0), targetRequires + '\n');
                updateMessage.push('Added #Requires AutoHotkey v2.1-alpha.17');
            }
            // Handle #SingleInstance directive
            if (singleInstanceLineIndex !== -1 && !hasCorrectSingleInstance) {
                // Found a different SingleInstance setting, ask to update
                const choice = await vscode.window.showInformationMessage(`Found #SingleInstance ${singleInstanceValue}. Update to Force?`, 'Update', 'Skip');
                if (choice === 'Update') {
                    const lineRange = new vscode.Range(new vscode.Position(singleInstanceLineIndex, 0), new vscode.Position(singleInstanceLineIndex, lines[singleInstanceLineIndex].length));
                    edit.replace(document.uri, lineRange, targetSingleInstance);
                    updateMessage.push('Updated #SingleInstance to Force');
                }
            }
            else if (singleInstanceLineIndex === -1) {
                // No #SingleInstance directive found, add it
                const insertPosition = requiresLineIndex !== -1 ? requiresLineIndex + 1 : 0;
                edit.insert(document.uri, new vscode.Position(insertPosition, 0), targetSingleInstance + '\n');
                updateMessage.push('Added #SingleInstance Force');
            }
            if (updateMessage.length === 0) {
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'No changes made'
                });
                return;
            }
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Header updated successfully',
                    details: updateMessage.join('\n')
                });
            }
            else {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'Failed to update header'
                });
            }
        }
        catch (error) {
            await handleError(error, 'Update Header');
        }
    }));
}
// Helper functions for profile management
async function showCreateProfileDialog() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter profile name',
        placeHolder: 'My Custom Profile',
        validateInput: (value) => value && value.trim().length > 0 ? null : 'Profile name is required'
    });
    if (name) {
        const baseProfile = await vscode.window.showQuickPick(['conservative', 'aggressive', 'custom'], {
            placeHolder: 'Select base profile',
            title: 'Base Profile'
        });
        if (baseProfile) {
            const profile = profileManager.createCustomProfile(name, baseProfile);
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Created profile: ${name}`,
                details: `Based on: ${baseProfile}`
            });
        }
    }
}
async function showEditProfileDialog() {
    const profiles = profileManager.getAllProfiles();
    const profileNames = profiles.map(p => p.name);
    const selected = await vscode.window.showQuickPick(profileNames, {
        placeHolder: 'Select profile to edit',
        title: 'Edit Profile'
    });
    if (selected) {
        const profile = profileManager.getProfile(selected);
        if (!profile) {
            await getNotificationManager().showNotification({
                type: 'error',
                message: 'Profile not found'
            });
            return;
        }
        // Check if it's a predefined profile - warn user they can't edit it directly
        const isPredefined = ['conservative', 'aggressive', 'custom'].includes(selected);
        if (isPredefined) {
            const action = await vscode.window.showWarningMessage(`Cannot edit predefined profile "${selected}". Would you like to create a copy to edit instead?`, 'Create Copy', 'Cancel');
            if (action === 'Create Copy') {
                const newName = await vscode.window.showInputBox({
                    prompt: `Enter name for copy of "${selected}"`,
                    placeHolder: `${selected}_copy`,
                    validateInput: (value) => value && value.trim().length > 0 ? null : 'Profile name is required'
                });
                if (newName) {
                    const newProfile = profileManager.createCustomProfile(newName, selected);
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: `Created copy: ${newName}`
                    });
                    // Continue editing the new profile
                    await showProfileEditorMenu(newProfile);
                }
            }
            return;
        }
        // Show editor menu for custom profiles
        await showProfileEditorMenu(profile);
    }
}
async function showProfileEditorMenu(profile) {
    while (true) {
        const action = await vscode.window.showQuickPick([
            { label: '$(edit) Edit Name & Description', value: 'name' },
            { label: '$(list-unordered) Manage Rules', value: 'rules' },
            { label: '$(settings-gear) Selective Conversion', value: 'selective' },
            { label: '$(dashboard) Performance Settings', value: 'performance' },
            { label: '$(checklist) Validation Settings', value: 'validation' },
            { label: '$(save) Save & Exit', value: 'save' },
            { label: '$(x) Cancel', value: 'cancel' }
        ], {
            placeHolder: `Editing: ${profile.name}`,
            title: 'Profile Editor'
        });
        if (!action || action.value === 'cancel') {
            return;
        }
        if (action.value === 'save') {
            profileManager.saveProfile(profile);
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Saved profile: ${profile.name}`
            });
            return;
        }
        switch (action.value) {
            case 'name':
                await editProfileNameDescription(profile);
                break;
            case 'rules':
                await editProfileRules(profile);
                break;
            case 'selective':
                await editSelectiveConversion(profile);
                break;
            case 'performance':
                await editPerformanceSettings(profile);
                break;
            case 'validation':
                await editValidationSettings(profile);
                break;
        }
    }
}
async function editProfileNameDescription(profile) {
    const action = await vscode.window.showQuickPick([
        { label: '$(edit) Edit Name', value: 'name' },
        { label: '$(note) Edit Description', value: 'description' },
        { label: '$(arrow-left) Back', value: 'back' }
    ], {
        placeHolder: 'What would you like to edit?',
        title: `Edit: ${profile.name}`
    });
    if (!action || action.value === 'back') {
        return;
    }
    if (action.value === 'name') {
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new profile name',
            value: profile.name,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Profile name is required';
                }
                // Check if name already exists (and it's not the current profile)
                const existing = profileManager.getProfile(value);
                if (existing && value !== profile.name) {
                    return 'A profile with this name already exists';
                }
                return null;
            }
        });
        if (newName && newName !== profile.name) {
            // Delete old profile and save with new name
            profileManager.deleteProfile(profile.name);
            profile.name = newName;
            profileManager.saveProfile(profile);
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Profile renamed to: ${newName}`
            });
        }
    }
    else if (action.value === 'description') {
        const newDescription = await vscode.window.showInputBox({
            prompt: 'Enter new description',
            value: profile.description,
            validateInput: (value) => value && value.trim().length > 0 ? null : 'Description cannot be empty'
        });
        if (newDescription && newDescription !== profile.description) {
            profile.description = newDescription;
            await getNotificationManager().showNotification({
                type: 'info',
                message: 'Description updated'
            });
        }
    }
}
async function editProfileRules(profile) {
    while (true) {
        const ruleItems = profile.rules.map(rule => ({
            label: `${rule.enabled ? '$(check)' : '$(circle-slash)'} ${rule.name}`,
            description: `Priority: ${rule.priority} | Category: ${rule.category}`,
            detail: rule.description,
            value: rule.id
        }));
        ruleItems.push({ label: '$(add) Add New Rule', description: '', detail: '', value: '__add__' }, { label: '$(arrow-left) Back', description: '', detail: '', value: '__back__' });
        const selected = await vscode.window.showQuickPick(ruleItems, {
            placeHolder: 'Select a rule to edit or add a new one',
            title: `Manage Rules: ${profile.name}`
        });
        if (!selected || selected.value === '__back__') {
            return;
        }
        if (selected.value === '__add__') {
            await addNewRule(profile);
            continue;
        }
        // Edit selected rule
        const rule = profile.rules.find(r => r.id === selected.value);
        if (rule) {
            await editSingleRule(profile, rule);
        }
    }
}
async function addNewRule(profile) {
    const id = await vscode.window.showInputBox({
        prompt: 'Enter rule ID (unique identifier)',
        placeHolder: 'my-custom-rule',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Rule ID is required';
            }
            if (profile.rules.some(r => r.id === value)) {
                return 'A rule with this ID already exists';
            }
            return null;
        }
    });
    if (!id)
        return;
    const name = await vscode.window.showInputBox({
        prompt: 'Enter rule name',
        placeHolder: 'My Custom Rule',
        validateInput: (value) => value && value.trim().length > 0 ? null : 'Rule name is required'
    });
    if (!name)
        return;
    const description = await vscode.window.showInputBox({
        prompt: 'Enter rule description',
        placeHolder: 'What does this rule do?',
        validateInput: (value) => value && value.trim().length > 0 ? null : 'Description is required'
    });
    if (!description)
        return;
    const category = await vscode.window.showQuickPick(['syntax', 'functions', 'variables', 'commands', 'directives'], {
        placeHolder: 'Select rule category',
        title: 'Rule Category'
    });
    if (!category)
        return;
    const priorityInput = await vscode.window.showInputBox({
        prompt: 'Enter rule priority (1-100, higher = runs first)',
        value: '50',
        validateInput: (value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 1 && num <= 100 ? null : 'Priority must be a number between 1 and 100';
        }
    });
    if (!priorityInput)
        return;
    const newRule = {
        id,
        name,
        description,
        enabled: true,
        priority: parseInt(priorityInput),
        category: category,
        pattern: '',
        replacement: ''
    };
    profile.rules.push(newRule);
    await getNotificationManager().showNotification({
        type: 'info',
        message: `Added rule: ${name}`
    });
}
async function editSingleRule(profile, rule) {
    while (true) {
        const action = await vscode.window.showQuickPick([
            { label: `$(${rule.enabled ? 'check' : 'circle-slash'}) ${rule.enabled ? 'Disable' : 'Enable'} Rule`, value: 'toggle' },
            { label: '$(edit) Edit Name', value: 'name' },
            { label: '$(note) Edit Description', value: 'description' },
            { label: '$(list-ordered) Edit Priority', value: 'priority' },
            { label: '$(symbol-string) Edit Pattern', value: 'pattern' },
            { label: '$(replace) Edit Replacement', value: 'replacement' },
            { label: '$(tag) Change Category', value: 'category' },
            { label: '$(trash) Remove Rule', value: 'remove' },
            { label: '$(arrow-left) Back', value: 'back' }
        ], {
            placeHolder: `Editing: ${rule.name}`,
            title: 'Edit Rule'
        });
        if (!action || action.value === 'back') {
            return;
        }
        switch (action.value) {
            case 'toggle':
                rule.enabled = !rule.enabled;
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: `Rule ${rule.enabled ? 'enabled' : 'disabled'}: ${rule.name}`
                });
                break;
            case 'name':
                const newName = await vscode.window.showInputBox({
                    prompt: 'Enter new rule name',
                    value: rule.name,
                    validateInput: (value) => value && value.trim().length > 0 ? null : 'Name is required'
                });
                if (newName) {
                    rule.name = newName;
                }
                break;
            case 'description':
                const newDesc = await vscode.window.showInputBox({
                    prompt: 'Enter new description',
                    value: rule.description,
                    validateInput: (value) => value && value.trim().length > 0 ? null : 'Description is required'
                });
                if (newDesc) {
                    rule.description = newDesc;
                }
                break;
            case 'priority':
                const newPriority = await vscode.window.showInputBox({
                    prompt: 'Enter new priority (1-100)',
                    value: rule.priority.toString(),
                    validateInput: (value) => {
                        const num = parseInt(value);
                        return !isNaN(num) && num >= 1 && num <= 100 ? null : 'Priority must be between 1 and 100';
                    }
                });
                if (newPriority) {
                    rule.priority = parseInt(newPriority);
                }
                break;
            case 'pattern':
                const newPattern = await vscode.window.showInputBox({
                    prompt: 'Enter regex pattern',
                    value: rule.pattern || '',
                    placeHolder: 'e.g., MsgBox,\\s*(.+)'
                });
                if (newPattern !== undefined) {
                    rule.pattern = newPattern;
                }
                break;
            case 'replacement':
                const newReplacement = await vscode.window.showInputBox({
                    prompt: 'Enter replacement string',
                    value: rule.replacement || '',
                    placeHolder: 'e.g., MsgBox($1)'
                });
                if (newReplacement !== undefined) {
                    rule.replacement = newReplacement;
                }
                break;
            case 'category':
                const newCategory = await vscode.window.showQuickPick(['syntax', 'functions', 'variables', 'commands', 'directives'], {
                    placeHolder: 'Select category',
                    title: 'Change Category'
                });
                if (newCategory) {
                    rule.category = newCategory;
                }
                break;
            case 'remove':
                const confirm = await vscode.window.showWarningMessage(`Remove rule "${rule.name}"?`, 'Remove', 'Cancel');
                if (confirm === 'Remove') {
                    profile.rules = profile.rules.filter(r => r.id !== rule.id);
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: `Removed rule: ${rule.name}`
                    });
                    return;
                }
                break;
        }
    }
}
async function editSelectiveConversion(profile) {
    while (true) {
        const enabled = profile.selectiveConversion.enabled;
        const constructs = profile.selectiveConversion.constructs;
        const items = [
            { label: `$(${enabled ? 'check' : 'circle-slash'}) Selective Conversion: ${enabled ? 'Enabled' : 'Disabled'}`, value: 'toggle' },
            { label: '--- Convert Constructs ---', value: 'separator', description: '(Only applies when enabled)' },
            { label: `$(${constructs.functions ? 'check' : 'circle-slash'}) Functions`, value: 'functions' },
            { label: `$(${constructs.variables ? 'check' : 'circle-slash'}) Variables`, value: 'variables' },
            { label: `$(${constructs.commands ? 'check' : 'circle-slash'}) Commands`, value: 'commands' },
            { label: `$(${constructs.directives ? 'check' : 'circle-slash'}) Directives`, value: 'directives' },
            { label: `$(${constructs.hotkeys ? 'check' : 'circle-slash'}) Hotkeys`, value: 'hotkeys' },
            { label: `$(${constructs.hotstrings ? 'check' : 'circle-slash'}) Hotstrings`, value: 'hotstrings' },
            { label: '--- Patterns ---', value: 'separator2' },
            { label: `$(add) Manage Include Patterns (${profile.selectiveConversion.includePatterns.length})`, value: 'include' },
            { label: `$(remove) Manage Exclude Patterns (${profile.selectiveConversion.excludePatterns.length})`, value: 'exclude' },
            { label: '$(arrow-left) Back', value: 'back' }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Configure selective conversion settings',
            title: `Selective Conversion: ${profile.name}`
        });
        if (!selected || selected.value === 'back' || selected.value === 'separator' || selected.value === 'separator2') {
            if (selected?.value === 'back' || !selected) {
                return;
            }
            continue;
        }
        switch (selected.value) {
            case 'toggle':
                profile.selectiveConversion.enabled = !profile.selectiveConversion.enabled;
                break;
            case 'functions':
            case 'variables':
            case 'commands':
            case 'directives':
            case 'hotkeys':
            case 'hotstrings':
                constructs[selected.value] = !constructs[selected.value];
                break;
            case 'include':
                await managePatterns(profile.selectiveConversion.includePatterns, 'Include Patterns');
                break;
            case 'exclude':
                await managePatterns(profile.selectiveConversion.excludePatterns, 'Exclude Patterns');
                break;
        }
    }
}
async function managePatterns(patterns, title) {
    while (true) {
        const items = patterns.map((pattern, index) => ({
            label: `$(regex) ${pattern}`,
            value: index.toString()
        }));
        items.push({ label: '$(add) Add Pattern', value: '__add__' }, { label: '$(arrow-left) Back', value: '__back__' });
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a pattern to remove or add a new one',
            title
        });
        if (!selected || selected.value === '__back__') {
            return;
        }
        if (selected.value === '__add__') {
            const newPattern = await vscode.window.showInputBox({
                prompt: 'Enter regex pattern',
                placeHolder: 'e.g., .*@preserve.*',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Pattern cannot be empty';
                    }
                    try {
                        new RegExp(value);
                        return null;
                    }
                    catch (e) {
                        return 'Invalid regex pattern';
                    }
                }
            });
            if (newPattern) {
                patterns.push(newPattern);
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Pattern added'
                });
            }
        }
        else {
            // Remove pattern
            const index = parseInt(selected.value);
            const confirm = await vscode.window.showWarningMessage(`Remove pattern "${patterns[index]}"?`, 'Remove', 'Cancel');
            if (confirm === 'Remove') {
                patterns.splice(index, 1);
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: 'Pattern removed'
                });
            }
        }
    }
}
async function editPerformanceSettings(profile) {
    while (true) {
        const perf = profile.performance;
        const items = [
            { label: `$(${perf.streamingEnabled ? 'check' : 'circle-slash'}) Streaming: ${perf.streamingEnabled ? 'Enabled' : 'Disabled'}`, value: 'streaming' },
            { label: `$(dashboard) Chunk Size: ${perf.chunkSize} lines`, value: 'chunkSize', description: 'Lines processed per chunk (100-5000)' },
            { label: `$(database) Max Memory: ${perf.maxMemoryUsage} MB`, value: 'memory', description: 'Maximum memory usage (50-1000 MB)' },
            { label: `$(${perf.enableProgressTracking ? 'check' : 'circle-slash'}) Progress Tracking: ${perf.enableProgressTracking ? 'Enabled' : 'Disabled'}`, value: 'progress' },
            { label: `$(${perf.enableCancellation ? 'check' : 'circle-slash'}) Cancellation: ${perf.enableCancellation ? 'Enabled' : 'Disabled'}`, value: 'cancellation' },
            { label: '$(arrow-left) Back', value: 'back' }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Configure performance settings',
            title: `Performance: ${profile.name}`
        });
        if (!selected || selected.value === 'back') {
            return;
        }
        switch (selected.value) {
            case 'streaming':
                perf.streamingEnabled = !perf.streamingEnabled;
                break;
            case 'chunkSize':
                const newChunkSize = await vscode.window.showInputBox({
                    prompt: 'Enter chunk size (100-5000 lines)',
                    value: perf.chunkSize.toString(),
                    validateInput: (value) => {
                        const num = parseInt(value);
                        return !isNaN(num) && num >= 100 && num <= 5000
                            ? null
                            : 'Chunk size must be between 100 and 5000';
                    }
                });
                if (newChunkSize) {
                    perf.chunkSize = parseInt(newChunkSize);
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: `Chunk size set to ${perf.chunkSize} lines`
                    });
                }
                break;
            case 'memory':
                const newMemory = await vscode.window.showInputBox({
                    prompt: 'Enter maximum memory usage (50-1000 MB)',
                    value: perf.maxMemoryUsage.toString(),
                    validateInput: (value) => {
                        const num = parseInt(value);
                        return !isNaN(num) && num >= 50 && num <= 1000
                            ? null
                            : 'Memory limit must be between 50 and 1000 MB';
                    }
                });
                if (newMemory) {
                    perf.maxMemoryUsage = parseInt(newMemory);
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: `Memory limit set to ${perf.maxMemoryUsage} MB`
                    });
                }
                break;
            case 'progress':
                perf.enableProgressTracking = !perf.enableProgressTracking;
                break;
            case 'cancellation':
                perf.enableCancellation = !perf.enableCancellation;
                break;
        }
    }
}
async function editValidationSettings(profile) {
    while (true) {
        const val = profile.validation;
        const items = [
            { label: `$(settings) Validation Level: ${val.level}`, value: 'level', description: 'Strict, Normal, or Lenient' },
            { label: `$(${val.enableSyntaxCheck ? 'check' : 'circle-slash'}) Syntax Check: ${val.enableSyntaxCheck ? 'Enabled' : 'Disabled'}`, value: 'syntax' },
            { label: `$(${val.enableSemanticCheck ? 'check' : 'circle-slash'}) Semantic Check: ${val.enableSemanticCheck ? 'Enabled' : 'Disabled'}`, value: 'semantic' },
            { label: `$(${val.enablePerformanceCheck ? 'check' : 'circle-slash'}) Performance Check: ${val.enablePerformanceCheck ? 'Enabled' : 'Disabled'}`, value: 'performance' },
            { label: `$(list-unordered) Custom Rules (${val.customRules.length})`, value: 'customRules', description: 'Manage custom validation rules' },
            { label: '$(arrow-left) Back', value: 'back' }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Configure validation settings',
            title: `Validation: ${profile.name}`
        });
        if (!selected || selected.value === 'back') {
            return;
        }
        switch (selected.value) {
            case 'level':
                const newLevel = await vscode.window.showQuickPick(['strict', 'normal', 'lenient'], {
                    placeHolder: 'Select validation level',
                    title: 'Validation Level'
                });
                if (newLevel) {
                    val.level = newLevel;
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: `Validation level set to: ${newLevel}`
                    });
                }
                break;
            case 'syntax':
                val.enableSyntaxCheck = !val.enableSyntaxCheck;
                break;
            case 'semantic':
                val.enableSemanticCheck = !val.enableSemanticCheck;
                break;
            case 'performance':
                val.enablePerformanceCheck = !val.enablePerformanceCheck;
                break;
            case 'customRules':
                await manageCustomValidationRules(val.customRules);
                break;
        }
    }
}
async function manageCustomValidationRules(rules) {
    while (true) {
        const items = rules.map((rule, index) => ({
            label: `$(${rule.enabled ? 'check' : 'circle-slash'}) ${rule.name}`,
            description: `Severity: ${rule.severity}`,
            detail: rule.message,
            value: index.toString()
        }));
        items.push({ label: '$(add) Add Custom Rule', description: '', detail: '', value: '__add__' }, { label: '$(arrow-left) Back', description: '', detail: '', value: '__back__' });
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a rule to edit or add a new one',
            title: 'Custom Validation Rules'
        });
        if (!selected || selected.value === '__back__') {
            return;
        }
        if (selected.value === '__add__') {
            const id = await vscode.window.showInputBox({
                prompt: 'Enter rule ID',
                placeHolder: 'custom-validation-rule',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'ID is required';
                    }
                    if (rules.some((r) => r.id === value)) {
                        return 'A rule with this ID already exists';
                    }
                    return null;
                }
            });
            if (!id)
                continue;
            const name = await vscode.window.showInputBox({
                prompt: 'Enter rule name',
                validateInput: (value) => value && value.trim().length > 0 ? null : 'Name is required'
            });
            if (!name)
                continue;
            const pattern = await vscode.window.showInputBox({
                prompt: 'Enter regex pattern to match',
                placeHolder: 'e.g., \\bGoto\\b',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Pattern is required';
                    }
                    try {
                        new RegExp(value);
                        return null;
                    }
                    catch (e) {
                        return 'Invalid regex pattern';
                    }
                }
            });
            if (!pattern)
                continue;
            const severity = await vscode.window.showQuickPick(['error', 'warning', 'info'], {
                placeHolder: 'Select severity level',
                title: 'Severity'
            });
            if (!severity)
                continue;
            const message = await vscode.window.showInputBox({
                prompt: 'Enter validation message',
                placeHolder: 'This pattern should be avoided',
                validateInput: (value) => value && value.trim().length > 0 ? null : 'Message is required'
            });
            if (!message)
                continue;
            rules.push({
                id,
                name,
                pattern,
                severity,
                message,
                enabled: true
            });
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Added validation rule: ${name}`
            });
        }
        else {
            // Edit or remove existing rule
            const index = parseInt(selected.value);
            const rule = rules[index];
            const action = await vscode.window.showQuickPick([
                { label: `$(${rule.enabled ? 'circle-slash' : 'check'}) ${rule.enabled ? 'Disable' : 'Enable'} Rule`, value: 'toggle' },
                { label: '$(trash) Remove Rule', value: 'remove' },
                { label: '$(arrow-left) Back', value: 'back' }
            ], {
                placeHolder: `Editing: ${rule.name}`,
                title: 'Edit Validation Rule'
            });
            if (action?.value === 'toggle') {
                rule.enabled = !rule.enabled;
            }
            else if (action?.value === 'remove') {
                const confirm = await vscode.window.showWarningMessage(`Remove validation rule "${rule.name}"?`, 'Remove', 'Cancel');
                if (confirm === 'Remove') {
                    rules.splice(index, 1);
                    await getNotificationManager().showNotification({
                        type: 'info',
                        message: `Removed validation rule: ${rule.name}`
                    });
                }
            }
        }
    }
}
async function showDeleteProfileDialog() {
    const profiles = profileManager.getCustomProfiles();
    const profileNames = profiles.map(p => p.name);
    const selected = await vscode.window.showQuickPick(profileNames, {
        placeHolder: 'Select profile to delete',
        title: 'Delete Profile'
    });
    if (selected) {
        const confirm = await vscode.window.showWarningMessage(`Are you sure you want to delete profile: ${selected}?`, 'Delete', 'Cancel');
        if (confirm === 'Delete') {
            const success = profileManager.deleteProfile(selected);
            if (success) {
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: `Deleted profile: ${selected}`
                });
            }
            else {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: `Cannot delete predefined profile: ${selected}`
                });
            }
        }
    }
}
async function showImportProfileDialog() {
    const uri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'JSON Files': ['json'] },
        openLabel: 'Import Profile'
    });
    if (uri && uri.length > 0) {
        const profile = profileManager.importProfile(uri[0].fsPath);
        if (profile) {
            await getNotificationManager().showNotification({
                type: 'info',
                message: `Imported profile: ${profile.name}`
            });
        }
        else {
            await getNotificationManager().showNotification({
                type: 'error',
                message: 'Failed to import profile'
            });
        }
    }
}
async function showExportProfileDialog() {
    const profiles = profileManager.getAllProfiles();
    const profileNames = profiles.map(p => p.name);
    const selected = await vscode.window.showQuickPick(profileNames, {
        placeHolder: 'Select profile to export',
        title: 'Export Profile'
    });
    if (selected) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${selected}-profile.json`),
            filters: { 'JSON Files': ['json'] },
            saveLabel: 'Export Profile'
        });
        if (uri) {
            const success = profileManager.exportProfile(selected, uri.fsPath);
            if (success) {
                await getNotificationManager().showNotification({
                    type: 'info',
                    message: `Exported profile: ${selected}`
                });
            }
            else {
                await getNotificationManager().showNotification({
                    type: 'error',
                    message: 'Failed to export profile'
                });
            }
        }
    }
}
// Enhanced conversion with profile support
async function convertWithProfile(ctx, content, profile) {
    const startTime = Date.now();
    // Use performance optimizer for large files
    const optimizer = new performanceOptimizer_1.PerformanceOptimizer(profile.performance, profile);
    const shouldUseOptimizer = content.split('\n').length > 1000;
    if (shouldUseOptimizer) {
        const progressOptions = {
            location: vscode.ProgressLocation.Window,
            title: 'Converting with performance optimization...',
            cancellable: true
        };
        const result = await vscode.window.withProgress(progressOptions, async (progress, token) => {
            return await optimizer.processLargeFile(content, progress, token);
        });
        return { result: result.result, stats: result.metrics };
    }
    else {
        // Use existing conversion logic for smaller files
        return await convertText(ctx, content);
    }
}
function deactivate() {
    // Clean up any resources if needed
}
//# sourceMappingURL=extension.js.map