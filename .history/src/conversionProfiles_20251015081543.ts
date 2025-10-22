
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Conversion profile interface
export interface ConversionProfile {
  name: string;
  description: string;
  rules: ConversionRule[];
  preserveSyntax: string[];
  selectiveConversion: SelectiveConversionOptions;
  performance: PerformanceOptions;
  validation: ValidationOptions;
}

export interface ConversionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  category: 'syntax' | 'functions' | 'variables' | 'commands' | 'directives';
  pattern?: string;
  replacement?: string;
  customLogic?: string;
}

export interface SelectiveConversionOptions {
  enabled: boolean;
  constructs: {
    functions: boolean;
    variables: boolean;
    commands: boolean;
    directives: boolean;
    hotkeys: boolean;
    hotstrings: boolean;
  };
  excludePatterns: string[];
  includePatterns: string[];
}

