import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Handles module resolution for AutoHotkey v2 import statements
 * Implements the search path logic from AHK v2 documentation
 */
export class ModuleResolver {
  private static instance: ModuleResolver;
  private resolutionCache: Map<string, string | null> = new Map();
  private searchPaths: string[] = [];

  private constructor() {
    this.initializeSearchPaths();
  }

  public static getInstance(): ModuleResolver {
    if (!ModuleResolver.instance) {
      ModuleResolver.instance = new ModuleResolver();
    }
    return ModuleResolver.instance;
  }

  /**
   * Initialize search paths based on AhkImportPath environment variable
   * Falls back to default: .;%A_MyDocuments%\AutoHotkey;%A_AhkPath%\..
   */
  private initializeSearchPaths(): void {
    const searchPath = process.env.AhkImportPath;

    if (searchPath) {
      this.searchPaths = searchPath.split(';').map(p => this.expandPath(p));
    } else {
      // Default search paths
      this.searchPaths = [
        '.', // Current directory
        path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents', 'AutoHotkey'),
        // AHK installation directory would be determined at runtime
      ];
    }

    // Add workspace folders
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        this.searchPaths.push(folder.uri.fsPath);
      }
    }
  }

  /**
   * Expand environment variables in path
   */
  private expandPath(pathStr: string): string {
    return pathStr.replace(/%([^%]+)%/g, (_, varName) => {
      return process.env[varName] || '';
    });
  }

  /**
   * Clear the resolution cache
   */
  public clearCache(): void {
    this.resolutionCache.clear();
  }

  /**
   * Resolve a module name to its file path
   * Implements: ModuleName, ModuleName\__Init.ahk, ModuleName.ahk
   *
   * @param moduleName The module name from import statement
   * @param importerPath The path of the file containing the import
   * @returns Resolved file path or null if not found
   */
  public resolveModule(moduleName: string, importerPath: string): string | null {
    const cacheKey = `${moduleName}|${importerPath}`;

    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey) || null;
    }

    const resolved = this.resolveModuleInternal(moduleName, importerPath);
    this.resolutionCache.set(cacheKey, resolved);
    return resolved;
  }

  private resolveModuleInternal(moduleName: string, importerPath: string): string | null {
    // Remove quotes if present
    moduleName = moduleName.replace(/^["']|["']$/g, '');

    // Get base search paths
    const importerDir = path.dirname(importerPath);
    const searchPaths = [importerDir, ...this.searchPaths];

    // Try each search path
    for (const basePath of searchPaths) {
      // Attempt 1: ModuleName (directory with __Init.ahk)
      const dirPath = path.join(basePath, moduleName);
      const initPath = path.join(dirPath, '__Init.ahk');
      if (this.fileExists(initPath)) {
        return initPath;
      }

      // Attempt 2: ModuleName.ahk
      const filePath = path.join(basePath, `${moduleName}.ahk`);
      if (this.fileExists(filePath)) {
        return filePath;
      }

      // Attempt 3: Direct path (relative or absolute)
      const directPath = path.isAbsolute(moduleName)
        ? moduleName
        : path.join(basePath, moduleName);
      if (this.fileExists(directPath)) {
        return directPath;
      }

      // Attempt 4: With .ahk extension if not present
      if (!moduleName.endsWith('.ahk')) {
        const withExt = `${directPath}.ahk`;
        if (this.fileExists(withExt)) {
          return withExt;
        }
      }
    }

    return null;
  }

  /**
   * Resolve a module from A_ScriptDir (for relative imports)
   */
  public resolveRelativeModule(moduleName: string, scriptDir: string): string | null {
    moduleName = moduleName.replace(/^["']|["']$/g, '');

    // Try as relative path from script directory
    const relativePath = path.join(scriptDir, moduleName);

    // Try with __Init.ahk
    const initPath = path.join(relativePath, '__Init.ahk');
    if (this.fileExists(initPath)) {
      return initPath;
    }

    // Try as direct file
    if (this.fileExists(relativePath)) {
      return relativePath;
    }

    // Try with .ahk extension
    if (!relativePath.endsWith('.ahk')) {
      const withExt = `${relativePath}.ahk`;
      if (this.fileExists(withExt)) {
        return withExt;
      }
    }

    return null;
  }

  /**
   * Check if a file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Get all possible module candidates for a given name
   * Useful for completion suggestions
   */
  public getModuleCandidates(importerPath: string): string[] {
    const importerDir = path.dirname(importerPath);
    const searchPaths = [importerDir, ...this.searchPaths];
    const candidates: Set<string> = new Set();

    for (const basePath of searchPaths) {
      try {
        if (!fs.existsSync(basePath)) continue;

        const entries = fs.readdirSync(basePath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            // Check if directory has __Init.ahk
            const initPath = path.join(basePath, entry.name, '__Init.ahk');
            if (this.fileExists(initPath)) {
              candidates.add(entry.name);
            }
          } else if (entry.isFile() && entry.name.endsWith('.ahk')) {
            // Add .ahk files without extension
            const moduleName = entry.name.slice(0, -4);
            if (moduleName !== '__Init') {
              candidates.add(moduleName);
            }
          }
        }
      } catch (error) {
        // Ignore errors for inaccessible directories
        console.error(`Failed to read directory ${basePath}:`, error);
      }
    }

    return Array.from(candidates).sort();
  }

  /**
   * Get the module name from a file path
   */
  public getModuleName(filePath: string): string {
    const basename = path.basename(filePath);

    if (basename === '__Init.ahk') {
      // For __Init.ahk, the module name is the parent directory
      return path.basename(path.dirname(filePath));
    }

    // Remove .ahk extension
    return basename.endsWith('.ahk') ? basename.slice(0, -4) : basename;
  }

  /**
   * Check if a file is a module (has #Module directive)
   */
  public async isModule(document: vscode.TextDocument): Promise<boolean> {
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#Module')) {
        return true;
      }
      // Stop checking after non-directive, non-comment lines
      if (trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('#')) {
        break;
      }
    }

    return false;
  }

  /**
   * Get module name from #Module directive
   */
  public getModuleDirectiveName(document: vscode.TextDocument): string | null {
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^#Module\s+([^\s;]+)/);
      if (match) {
        return match[1];
      }
      // Stop checking after non-directive, non-comment lines
      if (trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('#')) {
        break;
      }
    }

    return null;
  }
}
