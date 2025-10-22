
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface FormattingRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  replacement: string;
  priority: number;
}

export interface FormattingOptions {
  fixObjectLiterals: boolean;
  fixArrowFunctions: boolean;
  fixInconsistentSpacing: boolean;
  fixMissingBraces: boolean;
  normalizeIndentation: boolean;
}

export class AHKCodeFormatter {
  private static readonly DEFAULT_OPTIONS: FormattingOptions = {
    fixObjectLiterals: true,
    fixArrowFunctions: true,
    fixInconsistentSpacing: true,
    fixMissingBraces: true,
    normalizeIndentation: true
  };

  private static readonly FORMATTING_RULES: FormattingRule[] = [
    {
      id: 'object-literal-spacing',
      name: 'Fix Object Literal Spacing',
      description: 'Fixes incorrect spacing around object literals and fat arrows',
      pattern: /\s*=>\s*(?=\{[^}]*\n)/g,
      replacement: ' => ',
      priority: 1
    },
    {
      id: 'arrow-function-spacing',
      name: 'Fix Arrow Function Spacing',
      description: 'Fixes spacing around arrow functions',
      pattern: /\s*=>\s*/g,
      replacement: ' => ',
      priority: 2
    },
    {
      id: 'inconsistent-braces',
      name: 'Fix Inconsistent Braces',
      description: 'Adds missing braces for multi-line object literals',
      pattern: /=>\s*\{([^}]*)\}/g,
      replacement: ' => {\n    $1\n}',
      priority: 3
    },
    {
      id: 'normalize-indentation',
      name: 'Normalize Indentation',
      description: 'Normalizes indentation to 4 spaces',
      pattern: /^(\s*)/gm,
      replacement: '    ',
      priority: 4
    }
  ];

  static formatCode(code: string, options: Partial<FormattingOptions> = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let formattedCode = code;

    // Apply formatting rules based on options
    if (opts.fixObjectLiterals) {
      formattedCode = this.fixObjectLiterals(formattedCode);
    }

    if (opts.fixArrowFunctions) {
      formattedCode = this.fixArrowFunctions(formattedCode);
    }

    if (opts.fixInconsistentSpacing) {
      formattedCode = this.fixInconsistentSpacing(formattedCode);
    }

    if (opts.fixMissingBraces) {
      formattedCode = this.fixMissingBraces(formattedCode);
    }

    if (opts.normalizeIndentation) {
      formattedCode = this.normalizeIndentation(formattedCode);
    }

    return formattedCode;
  }

  private static fixObjectLiterals(code: string): string {
    // Fix object literals with incorrect spacing
    return code.replace(/\s*=>\s*(?=\{[^}]*\n)/g, ' => ');
  }

  private static fixArrowFunctions(code: string): string {
    // Fix arrow functions with inconsistent spacing
    return code.replace(/\s*=>\s*/g, ' => ');
  }

  private static fixInconsistentSpacing(code: string): string {
    // Fix multiple consecutive spaces
    return code.replace(/ {2,}/g, ' ');
  }

  private static fixMissingBraces(code: string): string {
    // Add missing braces for multi-line object literals
    return code.replace(/=>\s*\{([^}]*)\}/g, ' => {\n    $1\n}');
  }

