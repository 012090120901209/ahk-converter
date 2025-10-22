
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
    description: 'Aggressive conversion - maximizes v2 syntax adoption',
    rules: [
      {
        id: 'msgbox-full',
        name: 'Full MsgBox conversion',
        description: 'Convert all MsgBox syntax variants',
        enabled: true,
        priority: 1,
        category: 'commands',
        pattern: 'MsgBox,\\s*(.+)',
        replacement: 'MsgBox($1)'
      },
      {
        id: 'if-full',
        name: 'Full If statement conversion',
        description: 'Convert all If statement variants',
        enabled: true,
        priority: 2,
        category: 'syntax',
        pattern: 'If\\s+(.+)',
        replacement: 'If ($1)'
      },
      {
        id: 'variables-full',
        name: 'Full variable conversion',
        description: 'Convert all variable syntax',
        enabled: true,
        priority: 3,
        category: 'variables',
        pattern: '%(\\w+)%',
        replacement: '%$1%'
      }
    ],
    preserveSyntax: [],
    selectiveConversion: {
      enabled: false,
      constructs: {
        functions: true,
        variables: true,
        commands: true,
        directives: true,
        hotkeys: true,
        hotstrings: true
      },
      excludePatterns: [],
      includePatterns: []
    },
    performance: {
      streamingEnabled: true,
      chunkSize: 500,
      maxMemoryUsage: 200,
      enableProgressTracking: true,
      enableCancellation: true
    },
    validation: {
      level: 'normal',
      enableSyntaxCheck: true,
      enableSemanticCheck: true,
      enablePerformanceCheck: true,
      customRules: []
    }
  },
  {
    name: 'custom',
    description: 'Custom profile - user-defined rules and settings',
    rules: [],
    preserveSyntax: [],
    selectiveConversion: {
      enabled: false,
      constructs: {
        functions: true,
        variables: true,
        commands: true,
        directives: true,
        hotkeys: true,
        hotstrings: true
      },
      excludePatterns: [],
      includePatterns: []
    },
    performance: {
      streamingEnabled: true,
      chunkSize: 750,
      maxMemoryUsage: 150,
      enableProgressTracking: true,
      enableCancellation: true
    },
    validation: {
      level: 'normal',
      enableSyntaxCheck: true,
      enableSemanticCheck: true,
      enablePerformanceCheck: false,
      customRules: []
    }
  }
];

export class ConversionProfileManager {
  private static instance: ConversionProfileManager;
  private profiles: Map<string, ConversionProfile> = new Map();
  private customProfilesPath: string;

  private constructor(context: vscode.ExtensionContext) {
    this.customProfilesPath = path.join(context.globalStorageUri.fsPath, 'customProfiles.json');
    this.loadProfiles();
  }

  static getInstance(context?: vscode.ExtensionContext): ConversionProfileManager {
    if (!ConversionProfileManager.instance) {
      if (!context) {
        throw new Error('Extension context required for first initialization');
      }
      ConversionProfileManager.instance = new ConversionProfileManager(context);
    }
    return ConversionProfileManager.instance;
  }

  private loadProfiles(): void {
    // Load predefined profiles
    PREDEFINED_PROFILES.forEach(profile => {
      this.profiles.set(profile.name, profile);
    });

    // Load custom profiles
    try {
      if (fs.existsSync(this.customProfilesPath)) {
        const customProfilesData = fs.readFileSync(this.customProfilesPath, 'utf8');
        const customProfiles = JSON.parse(customProfilesData) as ConversionProfile[];
        customProfiles.forEach(profile => {
          this.profiles.set(profile.name, profile);
        });
      }
    } catch (error) {
      console.error('Failed to load custom profiles:', error);
    }
  }

  private saveCustomProfiles(): void {
    try {
      const customProfiles = Array.from(this.profiles.values())
        .filter(profile => !PREDEFINED_PROFILES.some(p => p.name === profile.name));
      
      const dir = path.dirname(this.customProfilesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.customProfilesPath, JSON.stringify(customProfiles, null, 2));
    } catch (error) {
      console.error('Failed to save custom profiles:', error);
    }
  }

  getProfile(name: string): ConversionProfile | undefined {
    return this.profiles.get(name);
  }

  getAllProfiles(): ConversionProfile[] {
    return Array.from(this.profiles.values());
  }

  getPredefinedProfiles(): ConversionProfile[] {
    return PREDEFINED_PROFILES;
  }

  getCustomProfiles(): ConversionProfile[] {
    return Array.from(this.profiles.values())
      .filter(profile => !PREDEFINED_PROFILES.some(p => p.name === profile.name));
  }

  saveProfile(profile: ConversionProfile): void {
    this.profiles.set(profile.name, profile);
    this.saveCustomProfiles();
  }

  deleteProfile(name: string): boolean {
    if (PREDEFINED_PROFILES.some(p => p.name === name)) {
      return false; // Cannot delete predefined profiles
    }
    
    const deleted = this.profiles.delete(name);
    if (deleted) {
      this.saveCustomProfiles();
    }
    return deleted;
  }

  exportProfile(name: string, filePath: string): boolean {
    const profile = this.profiles.get(name);
    if (!profile) {
      return false;
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export profile:', error);
      return false;
    }
  }

  importProfile(filePath: string): ConversionProfile | null {
    try {
      const profileData = fs.readFileSync(filePath, 'utf8');
      const profile = JSON.parse(profileData) as ConversionProfile;
      
      // Validate profile structure
      if (!this.validateProfile(profile)) {
        throw new Error('Invalid profile structure');
      }

      // Ensure unique name
      let uniqueName = profile.name;
      let counter = 1;
      while (this.profiles.has(uniqueName)) {
