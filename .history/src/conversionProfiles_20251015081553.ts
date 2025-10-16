
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

export interface PerformanceOptions {
  streamingEnabled: boolean;
  chunkSize: number;
  maxMemoryUsage: number; // in MB
  enableProgressTracking: boolean;
  enableCancellation: boolean;
}

export interface ValidationOptions {
  level: 'strict' | 'normal' | 'lenient';
  enableSyntaxCheck: boolean;
  enableSemanticCheck: boolean;
  enablePerformanceCheck: boolean;
  customRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  name: string;
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  enabled: boolean;
}

// Predefined profiles
export const PREDEFINED_PROFILES: ConversionProfile[] = [
  {
    name: 'conservative',
    description: 'Conservative conversion - preserves most v1 syntax, minimal changes',
    rules: [
      {
        id: 'msgbox-basic',
        name: 'Basic MsgBox conversion',
        description: 'Convert only basic MsgBox syntax',
        enabled: true,
        priority: 1,
        category: 'commands',
        pattern: 'MsgBox,\\s*(.+)',
        replacement: 'MsgBox($1)'
      },
      {
        id: 'if-basic',
        name: 'Basic If statement conversion',
        description: 'Convert only simple If statements',
        enabled: true,
        priority: 2,
        category: 'syntax',
        pattern: 'If\\s+([^=<>!]+)\\s*$',
        replacement: 'If ($1)'
      }
    ],
    preserveSyntax: [
      '#NoEnv',
      'SendMode',
      'SetWorkingDir',
      'old-style function calls'
    ],
    selectiveConversion: {
      enabled: false,
      constructs: {
        functions: true,
        variables: true,
        commands: true,
        directives: false,
        hotkeys: true,
        hotstrings: true
      },
      excludePatterns: [
        ';.*@preserve.*',
        '.*#pragma.*'
      ],
      includePatterns: []
    },
    performance: {
      streamingEnabled: false,
      chunkSize: 1000,
      maxMemoryUsage: 100,
      enableProgressTracking: true,
      enableCancellation: true
    },
    validation: {
      level: 'strict',
      enableSyntaxCheck: true,
      enableSemanticCheck: true,
      enablePerformanceCheck: false,
      customRules: []
    }
  },
  {
    name: 'aggressive',
