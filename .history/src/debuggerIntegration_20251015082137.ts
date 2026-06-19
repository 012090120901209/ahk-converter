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
          type: 'syntax',
          severity: 'warning',
          line: index + 1,
          message: '#NoEnv directive is deprecated in v2',
          suggestion: 'Remove #NoEnv directive'
        });
      }
    });

    return issues;
  }

  private checkRuntimeIssues(): DebugIssue[] {
    const issues: DebugIssue[] = [];

    // Analyze recent debug sessions for runtime errors
    const recentSessions = this.debugSessions.slice(-5);
    
    recentSessions.forEach(session => {
      if (session.errorInfo) {
        issues.push({
          type: 'runtime',
          severity: 'error',
          line: this.extractLineNumberFromError(session.errorInfo),
          message: session.errorInfo,
          suggestion: 'Check variable types and function calls'
        });
      }
    });

    return issues;
  }

  private checkLogicIssues(originalCode: string, convertedCode: string): DebugIssue[] {
    const issues: DebugIssue[] = [];

    // Compare logic between original and converted
    const originalLines = originalCode.split('\n');
    const convertedLines = convertedCode.split('\n');

    // Check for missing conversions
    originalLines.forEach((line, index) => {
      if (line.includes('MsgBox,') && !convertedLines[index]?.includes('MsgBox(')) {
        issues.push({
          type: 'logic',
          severity: 'warning',
          line: index + 1,
          message: 'MsgBox conversion may be incomplete',
          suggestion: 'Verify MsgBox syntax conversion'
        });
      }
    });

    return issues;
  }

  private async generateSuggestions(debugData: ConversionDebugData): Promise<DebugSuggestion[]> {
    const suggestions: DebugSuggestion[] = [];

    // Performance suggestions
    const performanceSuggestions = this.generatePerformanceSuggestions(debugData);
    suggestions.push(...performanceSuggestions);

    // Code improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(debugData);
    suggestions.push(...improvementSuggestions);

    // Fix suggestions based on issues
    const fixSuggestions = this.generateFixSuggestions(debugData.issues);
    suggestions.push(...fixSuggestions);

    return suggestions;
  }

  private generatePerformanceSuggestions(debugData: ConversionDebugData): DebugSuggestion[] {
    const suggestions: DebugSuggestion[] = [];

    // Analyze debug sessions for performance patterns
    const slowOperations = this.analyzePerformancePatterns();
    
    slowOperations.forEach(op => {
      suggestions.push({
        type: 'optimization',
        priority: 'medium',
        line: op.line,
        message: `Consider optimizing this operation: ${op.description}`,
        code: op.suggestion
      });
    });

    return suggestions;
  }

  private generateImprovementSuggestions(debugData: ConversionDebugData): DebugSuggestion[] {
    const suggestions: DebugSuggestion[] = [];

    // Suggest modern v2 features
    if (debugData.convertedCode.includes('Loop,')) {
      suggestions.push({
        type: 'improvement',
        priority: 'medium',
        line: 0,
        message: 'Consider using For loops instead of Loop',
        code: 'For key, value in map'
      });
    }

    return suggestions;
  }

  private generateFixSuggestions(issues: DebugIssue[]): DebugSuggestion[] {
    const suggestions: DebugSuggestion[] = [];

    issues.forEach(issue => {
      if (issue.suggestion) {
        suggestions.push({
          type: 'fix',
          priority: issue.severity === 'error' ? 'high' : 'medium',
          line: issue.line,
          message: issue.suggestion,
          code: this.generateFixCode(issue)
        });
      }
    });

    return suggestions;
  }

  private analyzePerformancePatterns(): any[] {
    // This would analyze debug sessions for performance bottlenecks
    // For now, return empty array
    return [];
  }

  private extractLineNumberFromError(errorInfo: string): number {
    const match = errorInfo.match(/line (\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  private generateFixCode(issue: DebugIssue): string {
    switch (issue.type) {
      case 'syntax':
        if (issue.message.includes('MsgBox')) {
          return 'MsgBox("Your message here")';
        }
        break;
      case 'runtime':
        return '// Check variable types and function calls';
      default:
        return '// Review this line';
    }
    return '';
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async saveDebugSession(session: DebugSession): Promise<void> {
    try {
      const dir = path.dirname(this.debugOutputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let sessions: DebugSession[] = [];
      if (fs.existsSync(this.debugOutputPath)) {
        const data = fs.readFileSync(this.debugOutputPath, 'utf8');
        sessions = JSON.parse(data);
      }

      sessions.push(session);

      // Keep only last 50 sessions
      const trimmedSessions = sessions.slice(-50);
      fs.writeFileSync(this.debugOutputPath, JSON.stringify(trimmedSessions, null, 2));
    } catch (error) {
      console.error('Failed to save debug session:', error);
    }
  }

  async getDebugSessions(): Promise<DebugSession[]> {
    try {
      if (fs.existsSync(this.debugOutputPath)) {
        const data = fs.readFileSync(this.debugOutputPath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Failed to load debug sessions:', error);
      return [];
    }
  }

  async clearDebugSessions(): Promise<void> {
    try {
      this.debugSessions = [];
      
      if (fs.existsSync(this.debugOutputPath)) {
        fs.unlinkSync(this.debugOutputPath);
      }
    } catch (error) {
      console.error('Failed to clear debug sessions:', error);
    }
  }

  async exportDebugData(filePath: string): Promise<boolean> {
    try {
      const debugData = {
        exportedAt: Date.now(),
        sessions: await this.getDebugSessions(),
        analysis: await this.getRecentAnalysis()
      };

      fs.writeFileSync(filePath, JSON.stringify(debugData, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export debug data:', error);
      return false;
    }
  }

  private async getRecentAnalysis(): Promise<any> {
    // This would return recent analysis data
    // For now, return empty object
    return {};
  }

  // Integration with conversion process
  async assistWithConversion(originalCode: string, convertedCode: string): Promise<{
    enhancedCode: string;
    debugData: ConversionDebugData;
  }> {
    const debugData = await this.analyzeConvertedCode(originalCode, convertedCode);
    
    // Apply automatic fixes for low-risk issues
    let enhancedCode = convertedCode;
    
    debugData.issues.forEach(issue => {
      if (issue.type === 'syntax' && issue.severity === 'error' && issue.suggestion) {
        enhancedCode = this.applyAutomaticFix(enhancedCode, issue);
      }
    });

    return {
      enhancedCode,
      debugData
    };
  }

  private applyAutomaticFix(code: string, issue: DebugIssue): string {
    const lines = code.split('\n');
    
    if (issue.line > 0 && issue.line <= lines.length) {
      const lineIndex = issue.line - 1;
      const line = lines[lineIndex];
      
      if (issue.message.includes('MsgBox') && issue.suggestion) {
        lines[lineIndex] = line.replace(/MsgBox,\s*(.+)/, 'MsgBox($1)');
      }
    }
    
    return lines.join('\n');
  }

  // Method to get debugging assistance for converted code
  async getDebuggingAssistance(code: string): Promise<{
    breakpoints: number[];
    watchVariables: string[];
    recommendations: string[];
  }> {
    const assistance = {
      breakpoints: [] as number[],
      watchVariables: [] as string[],
      recommendations: [] as string[]
    };

    // Analyze code to suggest strategic breakpoints
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('If ') || line.includes('Loop') || line.includes('Function')) {
        assistance.breakpoints.push(index + 1);
      }
      
      // Extract variable names for watching
      const variableMatch = line.match(/(\w+)\s*[:=]/);
      if (variableMatch) {
        assistance.watchVariables.push(variableMatch[1]);
      }
    });

    // Generate recommendations
    assistance.recommendations = [
      'Set breakpoints at conditional statements',
      'Watch variables that change frequently',
      'Use step-by-step execution for complex logic',
      'Monitor call stack for function flow'
    ];

    return assistance;
  }
}