
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DebugSession {
  id: string;
  timestamp: number;
  variables: DebugVariable[];
  callStack: DebugFrame[];
  currentLine: string;
  errorInfo: string;
  breakpoints: string[];
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
}

export interface DebugFrame {
  frame: number;
  location: string;
}

export interface ConversionDebugData {
  originalCode: string;
  convertedCode: string;
  debugSessions: DebugSession[];
  issues: DebugIssue[];
  suggestions: DebugSuggestion[];
}

export interface DebugIssue {
  type: 'syntax' | 'runtime' | 'logic' | 'performance';
  severity: 'error' | 'warning' | 'info';
  line: number;
  message: string;
  suggestion?: string;
}

export interface DebugSuggestion {
  type: 'optimization' | 'fix' | 'improvement';
  priority: 'high' | 'medium' | 'low';
  line: number;
  message: string;
  code?: string;
}

export class DebuggerIntegration {
  private static instance: DebuggerIntegration;
  private debugSessions: DebugSession[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private debugOutputPath: string;
  private extensionPath: string;

  private constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath;
    this.debugOutputPath = path.join(context.globalStorageUri.fsPath, 'debug_output.json');
  }

  static getInstance(context?: vscode.ExtensionContext): DebuggerIntegration {
    if (!DebuggerIntegration.instance) {
      if (!context) {
        throw new Error('Extension context required for first initialization');
      }
      DebuggerIntegration.instance = new DebuggerIntegration(context);
    }
    return DebuggerIntegration.instance;
  }

  async launchDebuggerReader(ahkExe: string): Promise<boolean> {
    try {
      const readerPath = path.join(this.extensionPath, 'resources', 'DebuggerWindowReader.ahk');
      
      // Check if reader exists
      if (!fs.existsSync(readerPath)) {
        throw new Error(`Debugger reader not found at: ${readerPath}`);
      }

      // Launch the debugger reader
      const child = cp.spawn(ahkExe, [readerPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      child.unref();

      // Wait a bit for the reader to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;
    } catch (error) {
      console.error('Failed to launch debugger reader:', error);
      return false;
    }
  }

  async captureDebugSession(): Promise<DebugSession | null> {
    try {
      const debugDataPath = path.join(os.tmpdir(), 'debug_output.json');
      
      if (!fs.existsSync(debugDataPath)) {
        return null;
      }

      const data = fs.readFileSync(debugDataPath, 'utf8');
      const debugData = JSON.parse(data);

      const session: DebugSession = {
        id: this.generateSessionId(),
        timestamp: Date.now(),
        variables: debugData.variables || [],
        callStack: debugData.callStack || [],
        currentLine: debugData.currentLine || '',
        errorInfo: debugData.errorInfo || '',
        breakpoints: debugData.breakpoints || []
      };

      this.debugSessions.push(session);
      await this.saveDebugSession(session);

      return session;
    } catch (error) {
      console.error('Failed to capture debug session:', error);
      return null;
    }
  }

  async startMonitoring(intervalMs: number = 2000): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      const session = await this.captureDebugSession();
      if (session) {
        this.onDebugSessionCaptured(session);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  private async onDebugSessionCaptured(session: DebugSession): Promise<void> {
    // Emit event for other parts of the extension
    vscode.commands.executeCommand('ahk.onDebugSessionCaptured', session);
  }

  async analyzeConvertedCode(originalCode: string, convertedCode: string): Promise<ConversionDebugData> {
    const debugData: ConversionDebugData = {
      originalCode,
      convertedCode,
      debugSessions: [...this.debugSessions],
      issues: [],
      suggestions: []
    };

    // Analyze for common conversion issues
    debugData.issues = await this.detectConversionIssues(originalCode, convertedCode);
    
    // Generate suggestions based on debug sessions and issues
    debugData.suggestions = await this.generateSuggestions(debugData);

    return debugData;
  }

  private async detectConversionIssues(originalCode: string, convertedCode: string): Promise<DebugIssue[]> {
    const issues: DebugIssue[] = [];

    // Check for syntax issues
    const syntaxIssues = this.checkSyntaxIssues(convertedCode);
    issues.push(...syntaxIssues);

    // Check for runtime issues based on debug sessions
    const runtimeIssues = this.checkRuntimeIssues();
    issues.push(...runtimeIssues);

    // Check for logic issues
    const logicIssues = this.checkLogicIssues(originalCode, convertedCode);
    issues.push(...logicIssues);

    return issues;
  }

  private checkSyntaxIssues(code: string): DebugIssue[] {
    const issues: DebugIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for common v2 syntax issues
      if (trimmed.includes('MsgBox,')) {
        issues.push({
          type: 'syntax',
          severity: 'error',
          line: index + 1,
          message: 'Old MsgBox syntax detected',
          suggestion: 'Use MsgBox() function instead'
        });
      }

      if (trimmed.includes('If ') && !trimmed.includes('If (')) {
        issues.push({
          type: 'syntax',
          severity: 'warning',
          line: index + 1,
          message: 'Legacy If statement detected',
          suggestion: 'Use If (expression) syntax'
        });
      }

      if (trimmed.includes('#NoEnv')) {
        issues.push({
