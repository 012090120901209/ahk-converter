# AutoHotkey v2 Import Feature

## Overview

The AHKv2 Toolbox extension provides comprehensive support for AutoHotkey v2's module system, including intelligent import statement management, IntelliSense, diagnostics, and code actions.

## Features

### 1. Import Statement Detection and Parsing

The extension automatically detects and parses all import statement variations:

```ahk
; Default import
import MyModule

; Named imports
import {FunctionA, ClassB} from MyModule

; Named imports with aliases
import {FunctionA as Func, ClassB as CB} from MyModule

; Wildcard imports
import * from MyModule
```

### 2. Module Resolution

The extension implements the full AHK v2 module resolution logic:

- Searches in order: `ModuleName`, `ModuleName\__Init.ahk`, `ModuleName.ahk`
- Supports `AhkImportPath` environment variable
- Default search path: `.;%A_MyDocuments%\AutoHotkey;%A_AhkPath%\..`
- Resolves relative imports from `A_ScriptDir`
- Caches resolved paths for performance

### 3. IntelliSense Support

#### Module Completions

When typing `import `, the extension suggests available modules:

```ahk
import |  ← Shows all modules in workspace
```

#### Symbol Completions

When typing `import {`, the extension suggests exported symbols:

```ahk
import {|} from MyModule  ← Shows all exports from MyModule
```

#### Dot Notation

For default imports, get completions when accessing module properties:

```ahk
import MyModule

MyModule.|  ← Shows all exports from MyModule
```

### 4. Hover Information

Hover over any import or imported symbol to see:

- Module location and path
- List of all exports
- Symbol type and definition
- Module dependencies

**Example:**

```ahk
import {MyFunction} from MyModule
       ^^^^^^^^^^
       Hover shows: function type, module source, definition location
```

### 5. Diagnostics

The extension provides real-time validation:

#### Module Not Found

```ahk
import NonExistent  ← Error: Module 'NonExistent' not found
```

#### Symbol Not Exported

```ahk
import {UndefinedFunc} from MyModule
       ^^^^^^^^^^^^^
       Error: 'UndefinedFunc' is not exported by module 'MyModule'
```

#### Unused Imports

```ahk
import {UnusedFunction} from MyModule  ← Hint: Unused import (grayed out)
```

#### Circular Dependencies

```ahk
Module A imports B, B imports C, C imports A
↑ Warning: Circular dependency detected: A → B → C → A
```

#### Symbol Conflicts

```ahk
import {MyFunc} from ModuleA
import {MyFunc} from ModuleB  ← Warning: Symbol 'MyFunc' is imported multiple times
```

#### Symbol Shadowing

```ahk
import {MyFunc} from MyModule

MyFunc() {  ← Warning: Function 'MyFunc' shadows imported symbol
    ; Local declaration conflicts with import
}
```

### 6. Code Actions and Quick Fixes

#### Add Missing Import

Place cursor on an undefined symbol and get a quick fix:

```ahk
result := UndefinedFunction()  ← 💡 Quick Fix: Import 'UndefinedFunction' from 'Module'
```

#### Remove Unused Import

```ahk
import {UnusedFunc} from MyModule  ← 💡 Quick Fix: Remove unused import
```

#### Remove Invalid Symbol

```ahk
import {ValidFunc, InvalidFunc} from MyModule
                   ^^^^^^^^^^^
                   💡 Quick Fix: Remove undefined symbol from import
```

#### Organize Imports

Right-click or use Command Palette:
- **Organize Imports**: Removes unused imports and sorts alphabetically
- **Sort Imports**: Sorts imports by module name

#### Convert Import Styles

```ahk
import {Func1, Func2} from MyModule
       💡 Refactor: Convert to wildcard import

import * from MyModule
       💡 Refactor: Convert to named imports
```

### 7. Symbol Navigation

#### Go to Definition

Click on any import or symbol to navigate:

```ahk
import {MyFunction} from MyModule
       ^^^^^^^^^^
       F12: Go to definition of MyFunction

import MyModule
       ^^^^^^^^
       F12: Go to MyModule file
```

#### Peek Definition

Use `Alt+F12` to peek at definitions without leaving your file.

#### Find All References

Right-click on any imported symbol:
- Shows all usages in the current file
- Includes the import statement itself

### 8. Commands

Access via Command Palette (`Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| `AHK: Organize Imports` | Remove unused imports and sort alphabetically |
| `AHK: Reindex Workspace` | Rebuild the module and symbol index |
| `AHK: Show Module Exports` | Browse all exports from any module |
| `AHK: Add Import` | Interactively add an import statement |
| `AHK: Include User Library` | Pick a library from `%USERPROFILE%/AutoHotkey/**/Lib` (configurable) and auto-insert the `#Include` plus optional export stubs |

### User Library Integration

- Configure additional search paths with `ahkv2Toolbox.userLibraryPaths` (defaults to `~/AutoHotkey/v2/Lib`, `~/AutoHotkey/Lib`, and their Documents variants). Libraries found there are indexed just like workspace modules, so completions and diagnostics work for files such as `ArrayHelpers.ahk` or `StringHelpers.ahk`.
- Run **AHK: Include User Library** to insert a user-friendly `#Include` line. The template used for the include statement is configurable via `ahkv2Toolbox.userLibraryIncludeFormat` and supports both `{name}` and `{filePath}` placeholders so paths remain username-agnostic (default uses `%A_AppData%/../../AutoHotkey/v2/Lib/{name}.ahk`).
- After choosing a library, the command surfaces its exports (functions, classes, variables) and can insert ready-to-edit stubs for the selected symbols directly into the current script.

## Module System Basics

### Creating a Module

Any AHK file with a `#Module` directive is a module:

```ahk
#Module MyModule

; All top-level functions and classes are automatically exported

MyFunction() {
    MsgBox "Hello from MyModule"
}

class MyClass {
    static Prop := "value"
}
```

### Importing a Module

```ahk
; Default import - access via module name
import MyModule
MyModule.MyFunction()

; Named import - direct access to specific symbols
import {MyFunction, MyClass} from MyModule
MyFunction()

; Named import with alias - rename on import
import {MyFunction as Func} from MyModule
Func()

; Wildcard import - import all exports
import * from MyModule
MyFunction()
```

### Module Resolution Examples

Given this directory structure:
```
project/
├── Main.ahk
├── Lib/
│   ├── StringUtils.ahk
│   ├── FileUtils/
│   │   └── __Init.ahk
│   └── Math.ahk
```

Resolution works as follows:

```ahk
; In Main.ahk

import StringUtils        ; → Lib/StringUtils.ahk
import FileUtils          ; → Lib/FileUtils/__Init.ahk
import Math              ; → Lib/Math.ahk
```

### Best Practices

#### 1. Use Named Imports

```ahk
; ✅ Good - explicit and clear
import {StrPad, StrTrunc} from StringUtils

; ❌ Avoid - imports everything
import * from StringUtils
```

#### 2. Group Related Imports

```ahk
; ✅ Good - organized
import {FileRead, FileWrite} from FileUtils
import {StrPad, StrTrunc} from StringUtils
import {Add, Multiply} from Math

; ❌ Avoid - scattered
import {FileRead} from FileUtils
import {StrPad} from StringUtils
import {FileWrite} from FileUtils
```

#### 3. Use Aliases for Conflicts

```ahk
; When importing symbols with same name from different modules
import {Parse as ParseJSON} from JSON
import {Parse as ParseXML} from XML

result1 := ParseJSON(jsonString)
result2 := ParseXML(xmlString)
```

#### 4. Keep Module Scope Clean

```ahk
#Module MyModule

; ✅ Good - only export what's needed
PublicFunction() {
    return PrivateHelper()
}

; Private function (not exported automatically in true modules)
PrivateHelper() {
    return "internal"
}
```

#### 5. Avoid Circular Dependencies

```ahk
; ❌ Bad
; ModuleA imports ModuleB
; ModuleB imports ModuleA

; ✅ Good - extract shared code
; ModuleA imports Common
; ModuleB imports Common
; Common has shared functionality
```

## Configuration

No configuration needed! The import feature works out of the box with:

- Automatic workspace indexing
- Standard AHK v2 module resolution
- Real-time diagnostics
- IntelliSense suggestions

### Optional: Set AhkImportPath

To customize module search paths, set the `AhkImportPath` environment variable:

```
AhkImportPath=C:\MyLibs;D:\SharedModules;.
```

## Troubleshooting

### Module Not Found

**Problem:** `import MyModule` shows "Module not found"

**Solutions:**
1. Check the module file exists
2. Verify the file is named correctly (`.ahk` extension)
3. Check `AhkImportPath` if using custom paths
4. Run `AHK: Reindex Workspace` command

### Symbol Not Exported

**Problem:** `import {MyFunc} from Module` shows "Symbol not exported"

**Solutions:**
1. Verify the function/class is at module scope (not nested)
2. Check the symbol name spelling
3. Ensure the target file is a proper module with `#Module` directive
4. Run `AHK: Show Module Exports` to see what's actually exported

### IntelliSense Not Working

**Problem:** No completions appearing

**Solutions:**
1. Ensure file is saved (indexing happens on save)
2. Run `AHK: Reindex Workspace` command
3. Check the file has `.ahk` extension
4. Verify VS Code language mode is set to `ahk` or `ahk2`

### Slow Performance

**Problem:** Extension feels sluggish

**Solutions:**
1. The first indexing may take time for large workspaces
2. Subsequent operations use cached data
3. Close unused workspace folders
4. Exclude non-AHK directories in `.gitignore`

## Technical Details

### Architecture

The import feature consists of several components:

1. **ModuleResolver**: Implements AHK v2 module resolution logic
2. **ImportParser**: Parses import/export statements using regex
3. **SymbolIndex**: Maintains workspace-wide symbol index
4. **Providers**: VS Code language server protocol implementations
   - CompletionProvider (IntelliSense)
   - HoverProvider (hover tooltips)
   - DiagnosticProvider (validation)
   - CodeActionProvider (quick fixes)
   - DefinitionProvider (go to definition)
   - ReferenceProvider (find references)

### Performance

- Module resolution results are cached
- Symbol index updates incrementally on file changes
- Diagnostics run debounced (500ms delay after typing)
- Workspace indexing is asynchronous

### Limitations

- Does not parse AHK v1 `#Include` directives
- Symbol detection is heuristic-based (complements LSP)
- Circular dependency detection within workspace only
- No support for dynamic imports

## Examples

### Example 1: Simple Library

**StringUtils.ahk**:
```ahk
#Module StringUtils

StrPad(str, length, char := " ") {
    while (StrLen(str) < length) {
        str .= char
    }
    return str
}

StrTrunc(str, maxLen) {
    return (StrLen(str) > maxLen) ? SubStr(str, 1, maxLen) "..." : str
}
```

**Main.ahk**:
```ahk
import {StrPad, StrTrunc} from StringUtils

padded := StrPad("Hello", 10)       ; "Hello     "
truncated := StrTrunc("Long text", 5) ; "Long..."
```

### Example 2: Class Module

**Logger.ahk**:
```ahk
#Module Logger

class Logger {
    static LogFile := A_ScriptDir "\app.log"

    static Info(msg) {
        this.Write("[INFO] " msg)
    }

    static Error(msg) {
        this.Write("[ERROR] " msg)
    }

    static Write(msg) {
        FileAppend msg "`n", this.LogFile
    }
}
```

**Main.ahk**:
```ahk
import {Logger} from Logger

Logger.Info("Application started")
Logger.Error("Something went wrong")
```

### Example 3: Module with Dependencies

**MathUtils.ahk**:
```ahk
#Module MathUtils

Add(a, b) => a + b
Multiply(a, b) => a * b
```

**Calculator.ahk**:
```ahk
#Module Calculator
import {Add, Multiply} from MathUtils

Calculate(operation, a, b) {
    switch operation {
        case "add": return Add(a, b)
        case "mul": return Multiply(a, b)
    }
}
```

**Main.ahk**:
```ahk
import {Calculate} from Calculator

result := Calculate("add", 5, 3)  ; Uses MathUtils internally
MsgBox result  ; 8
```

## See Also

- [AutoHotkey v2 Documentation: Modules](https://www.autohotkey.com/docs/v2/Concepts.htm#modules)
- [AHKv2 Toolbox Documentation](../README.md)
- [VS Code Language Extensions](https://code.visualstudio.com/api/language-extensions/overview)
