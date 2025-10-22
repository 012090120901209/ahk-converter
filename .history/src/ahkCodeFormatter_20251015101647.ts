
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
