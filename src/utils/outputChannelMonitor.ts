import * as vscode from 'vscode';

/**
 * Represents a parsed runtime error from output
 */
export interface RuntimeError {
  filePath: string;
  line: number;
  message: string;
  timestamp: Date;
  source: string;
  fullOutput?: string;
}

/**
 * Error pattern definitions for different AHK error formats
 */
const AHK_ERROR_PATTERNS = [
  // AHK v2 format: filepath (line) : ==> error message
  {
    regex: /^(.+\.ahk)\s+\((\d+)\)\s*:\s*==>\s*(.+)$/,
    groups: { file: 1, line: 2, message: 3 }
  },
  // Generic format: filepath:line: error message
  {
    regex: /^(.+\.ahk):(\d+):\s*(.+)$/,
    groups: { file: 1, line: 2, message: 3 }
  },
  // Windows path format with line: C:\path\file.ahk(line): error
  {
    regex: /^([a-zA-Z]:[^(]+\.ahk)\((\d+)\):\s*(.+)$/,
    groups: { file: 1, line: 2, message: 3 }
  }
];

/**
 * Output Channel Monitor
 * Captures and parses output from VS Code output channels
 */
export class OutputChannelMonitor {
  private recentOutput: Map<string, string[]> = new Map();
  private maxLines: number = 200; // Store last 200 lines per channel
  private recentErrors: RuntimeError[] = [];
  private maxErrors: number = 20; // Store last 20 parsed errors
  private errorMaxAge: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Add a line of output to the monitor
   */
  public addOutputLine(channelName: string, line: string): void {
    // Get or create output buffer for this channel
    let buffer = this.recentOutput.get(channelName);
    if (!buffer) {
      buffer = [];
      this.recentOutput.set(channelName, buffer);
    }

    // Add line to buffer
    buffer.push(line);

    // Maintain max size (circular buffer behavior)
    if (buffer.length > this.maxLines) {
      buffer.shift();
    }

    // Try to parse error from this line
    const error = this.parseErrorFromLine(line, channelName);
    if (error) {
      this.addError(error);
    }
  }

  /**
   * Add multiple lines of output
   */
  public addOutputLines(channelName: string, lines: string[]): void {
    lines.forEach(line => this.addOutputLine(channelName, line));
  }

  /**
   * Parse an error from a single line of output
   */
  private parseErrorFromLine(line: string, source: string): RuntimeError | null {
    // Try each pattern
    for (const pattern of AHK_ERROR_PATTERNS) {
      const match = line.match(pattern.regex);
      if (match) {
        return {
          filePath: match[pattern.groups.file],
          line: parseInt(match[pattern.groups.line], 10),
          message: match[pattern.groups.message].trim(),
          timestamp: new Date(),
          source: source,
          fullOutput: line
        };
      }
    }

    return null;
  }

  /**
   * Add an error to the recent errors list
   */
  private addError(error: RuntimeError): void {
    // Add to front of array
    this.recentErrors.unshift(error);

    // Maintain max size
    if (this.recentErrors.length > this.maxErrors) {
      this.recentErrors.pop();
    }

    // Clean old errors
    this.cleanOldErrors();
  }

  /**
   * Remove errors older than maxAge
   */
  private cleanOldErrors(): void {
    const now = Date.now();
    this.recentErrors = this.recentErrors.filter(
      error => (now - error.timestamp.getTime()) < this.errorMaxAge
    );
  }

  /**
   * Get recent errors, optionally filtered by file path
   */
  public getRecentErrors(filePath?: string): RuntimeError[] {
    this.cleanOldErrors();

    if (!filePath) {
      return this.recentErrors;
    }

    // Normalize path for comparison (handle Windows path variations)
    const normalizedPath = this.normalizePath(filePath);

    return this.recentErrors.filter(error => {
      const errorPath = this.normalizePath(error.filePath);
      return errorPath === normalizedPath ||
             errorPath.endsWith(normalizedPath) ||
             normalizedPath.endsWith(errorPath);
    });
  }

  /**
   * Normalize file path for comparison
   */
  private normalizePath(path: string): string {
    return path.toLowerCase().replace(/\\/g, '/');
  }

  /**
   * Get recent output lines from a specific channel
   */
  public getRecentOutput(channelName: string, lineCount?: number): string[] {
    const buffer = this.recentOutput.get(channelName);
    if (!buffer || buffer.length === 0) {
      return [];
    }

    if (lineCount) {
      return buffer.slice(-lineCount);
    }

    return [...buffer];
  }

  /**
   * Parse all errors from recent output of a channel
   */
  public parseErrorsFromOutput(channelName: string): RuntimeError[] {
    const output = this.getRecentOutput(channelName);
    const errors: RuntimeError[] = [];

    for (const line of output) {
      const error = this.parseErrorFromLine(line, channelName);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Clear all stored output and errors
   */
  public clear(): void {
    this.recentOutput.clear();
    this.recentErrors = [];
  }

  /**
   * Clear output for a specific channel
   */
  public clearChannel(channelName: string): void {
    this.recentOutput.delete(channelName);
  }

  /**
   * Format errors for display in chat
   */
  public formatErrorsForChat(errors: RuntimeError[]): string | undefined {
    if (errors.length === 0) {
      return undefined;
    }

    let output = '**Runtime Errors from Output Window:**\n\n';

    errors.forEach((error, idx) => {
      const fileName = error.filePath.split(/[\\/]/).pop();
      const age = this.getErrorAge(error);

      output += `${idx + 1}. 🔴 **${fileName}** (Line ${error.line}) ${age}\n`;
      output += `   \`\`\`\n   ${error.message}\n   \`\`\`\n`;
      output += `   Source: ${error.source}\n\n`;
    });

    return output;
  }

  /**
   * Get human-readable error age
   */
  private getErrorAge(error: RuntimeError): string {
    const seconds = Math.floor((Date.now() - error.timestamp.getTime()) / 1000);

    if (seconds < 10) {
      return '*just now*';
    } else if (seconds < 60) {
      return `*${seconds}s ago*`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `*${minutes}m ago*`;
    }
  }

  /**
   * Get statistics about monitored channels
   */
  public getStats(): {
    channels: number;
    totalLines: number;
    recentErrors: number;
  } {
    let totalLines = 0;
    this.recentOutput.forEach(buffer => {
      totalLines += buffer.length;
    });

    return {
      channels: this.recentOutput.size,
      totalLines: totalLines,
      recentErrors: this.recentErrors.length
    };
  }
}

/**
 * Global singleton instance
 */
let globalMonitor: OutputChannelMonitor | undefined;

/**
 * Get or create the global output channel monitor
 */
export function getOutputChannelMonitor(): OutputChannelMonitor {
  if (!globalMonitor) {
    globalMonitor = new OutputChannelMonitor();
  }
  return globalMonitor;
}
