/**
 * AutoHotkey v2 Import Library Manager
 *
 * Provides comprehensive import statement management and IntelliSense support
 * for AHK v2 module system.
 *
 * Features:
 * - Import statement detection and parsing
 * - Module resolution with AhkImportPath support
 * - IntelliSense for modules and symbols
 * - Import validation and diagnostics
 * - Code actions and quick fixes
 * - Go to definition and find references
 * - Symbol indexing across workspace
 */

export { ImportManager } from './importManager';
export { ModuleResolver } from './moduleResolver';
export { SymbolIndex, ModuleInfo, SymbolInfo } from './symbolIndex';
export {
  ImportParser,
  ImportStatement,
  ImportType,
  ImportedSymbol,
  ExportStatement,
  ExportSymbolType
} from './importParser';
export { ImportCompletionProvider } from './completionProvider';
export { ImportHoverProvider } from './hoverProvider';
export { ImportDiagnosticProvider } from './diagnosticProvider';
export { ImportCodeActionProvider } from './codeActionProvider';
export {
  ImportDefinitionProvider,
  ImportReferenceProvider,
  ImportPeekDefinitionProvider
} from './definitionProvider';
