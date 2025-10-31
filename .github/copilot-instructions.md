# AHKv2 Toolbox - AI Agent Instructions

## Project Overview

**AHKv2 Toolbox** is a VS Code extension for AutoHotkey v2 development. It provides:
- AHK v1→v2 script conversion using AutoHotkey's community converter
- LSP integration with thqby's `vscode-autohotkey2-lsp` extension
- Function metadata extraction and code analysis
- Dependency tree visualization for `#Include` directives
- GitHub Copilot Chat participant (`@ahk`) for AHK v2 assistance

## Architecture

### Dual-Parser System
- **Primary**: LSP integration (`lspIntegration.ts`) - uses thqby's extension when available
- **Fallback**: Regex-based parser (`functionAnalyzer.ts`) - works offline
- Always check `isLSPAvailable()` before attempting LSP operations

### Key Components
```
src/extension.ts           → Main activation, command registration
src/lspIntegration.ts      → LSP symbol provider integration
src/functionAnalyzer.ts    → Fallback regex-based parser
src/dependencyTreeProvider.ts → #Include dependency visualization (TreeDataProvider)
src/chatParticipant.ts     → @ahk Copilot chat integration
src/functionMetadataHandler.ts → Function signature extraction
```

### Tree Views (VS Code Native)
All tree views use **TreeDataProvider** (NOT WebviewViewProvider):
- `ahkDependencyTree` - Dependency Map with `#Include` relationships
- `codeMap` - Code structure explorer (functions, classes, variables)
- `ahkPackageManager` - Dependency manager

**Why TreeDataProvider**: Native theming, better performance, cross-platform compatibility. Previous webview implementation had rendering issues.

## Development Workflows

### Build & Test
```powershell
npm run compile          # TypeScript compilation to dist/
npm run watch            # Auto-compile on changes
npm run package          # Build .vsix for distribution
```

### Debugging
**Quick reload during development**:
1. Press `Ctrl+Shift+F5` to restart debugger (recommended)
2. Or press `Ctrl+R` in Extension Dev Host window
3. Task: "Compile and Reload Debugger" (`Ctrl+Shift+P` → Run Task)

See `docs/AUTO_RELOAD_DEBUGGER.md` for details.

### Publishing
- Package: `npm run package` → produces `.vsix`
- Publish: Set `VSCE_PAT` env var, run task "Publish latest VSIX to VS Code Marketplace"
- GitHub Actions: Push tag `v0.x.x` to auto-publish via workflow

## Project Conventions

### Error Handling Pattern
Use typed error classes with user-friendly messages:
```typescript
class ValidationError extends AHKConverterError {
  constructor(message: string, details?: any) {
    const userMessage = 'The AHK file could not be validated for conversion.';
    const learnMoreUrl = 'https://www.autohotkey.com/docs/v2/v1-to-v2.htm';
    const recoveryActions = ['Check file syntax', 'Ensure file contains AHK v1 code'];
    super(message, 'VALIDATION_ERROR', details, userMessage, learnMoreUrl, recoveryActions);
  }
}
```
Always show actionable error messages via `NotificationManager.getInstance()`.

### Dependency Tree Path Resolution
**Critical**: Normalize all path separators to forward slashes before resolution:
```typescript
const normalizedInclude = includePath.replace(/\\/g, '/');
```
Resolution order for `#Include`:
1. Library includes `<LibName>` → `Lib/LibName.ahk`, `vendor/LibName.ahk`
2. Quoted paths `"path.ahk"` → relative or absolute
3. Variable paths `%A_ScriptDir%\file.ahk` → substitute and resolve

See `docs/DEPENDENCY_TREE.md` for algorithm details.

### UI Components (Webviews)
Use `@vscode/webview-ui-toolkit` for all webview UIs:
```html
<script type="module" src="@vscode/webview-ui-toolkit/dist/toolkit.js"></script>
<vscode-button>Primary Action</vscode-button>
```
See `Style_Guide.md` for component patterns. This ensures theme consistency.

### Function Metadata Extraction
The system detects AHK v2 parameter features:
- **ByRef**: `&param` → `isByRef: true`
- **Optional**: `param?` → `isOptional: true`
- **Default Values**: Classified as `Constant` (literals) or `Expression` (computed)
- **Type Hints**: `param: String` → parsed from AHK v2.1+ syntax

See `docs/FUNCTION_METADATA_EXTRACTION.md` for implementation details.

### Chat Participant (@ahk)
Commands available: `/convert`, `/explain`, `/fix`, `/optimize`, `/example`

Base system prompt emphasizes AHK v2 rules:
- Use `:=` for ALL assignments (never `=`)
- Arrays are 1-indexed
- String concatenation uses `.` operator
- `ComObject()` not `ComObjCreate()`
- Modern function syntax with parentheses

Implementation in `chatParticipant.ts` uses `vscode.LanguageModelChatSelector.copilot`.

## Critical File Locations

- **Converter script**: `vendor/v2converter.ahk` (community converter)
- **Extension manifest**: `package.json` (759 lines - defines commands, views, settings)
- **TypeScript config**: `tsconfig.json` (target ES2020, output to `dist/`)
- **Documentation hub**: `README.md`, `docs/` folder

## Common Pitfalls

1. **Don't mix TreeDataProvider and WebviewViewProvider** - Use TreeDataProvider for tree views
2. **Always normalize path separators** before `#Include` resolution (Windows uses `\`, normalize to `/`)
3. **Check LSP availability** before calling LSP methods - gracefully fall back to regex parser
4. **Use NotificationManager** for user-facing errors - not raw `vscode.window.showErrorMessage`
5. **Webview CSP**: Use `@vscode/webview-ui-toolkit` for components, set proper CSP in webview HTML

## Testing

No automated test suite currently exists. Manual testing workflow:
1. Open `.ahk` files in test/ directory
2. Test conversion via context menu or command palette
3. Verify tree views populate correctly
4. Test `@ahk` chat participant with sample queries

## AHK v2 Knowledge (for context)

When working on conversion or chat features, remember these v1→v2 changes:
- `MsgBox, text` → `MsgBox(text)`
- `IfEqual, var, value` → `if (var == value)`
- `StringSplit` → `StrSplit()`
- `ComObjCreate()` → `ComObject()`
- No `%var%` wrapping in expressions
- Control flow requires parentheses: `if condition` → `if (condition)`

## Next Steps for Contributors

1. Read `docs/DEPENDENCY_TREE.md` for dependency visualization internals
2. Check `docs/FUNCTION_METADATA_EXTRACTION.md` for parameter parsing
3. Review `Style_Guide.md` for UI component patterns
4. See `ROADMAP.md` for planned features (if exists)
