# AutoHotkey Dependency Explorer

The Dependency Explorer is a powerful view in the AHKv2 Toolbox that visualizes and analyzes #Include dependencies across your AutoHotkey scripts.

## Features

### 1. **Automatic Workspace Scanning**

The Dependency Explorer automatically scans your entire workspace for `.ahk` files and builds a complete dependency graph.

```ahk
; main.ahk
#Include Lib\MyLibrary.ahk
#Include utils.ahk

; The explorer will detect both dependencies
```

### 2. **#Include Directive Support**

The parser recognizes all forms of AHK #Include directives:

#### Standard Includes
```ahk
#Include MyFile.ahk
#Include "MyFile.ahk"
#Include C:\Full\Path\To\File.ahk
```

#### Library Includes
```ahk
#Include <MyLibrary>
; Resolves to Lib\MyLibrary.ahk
```

#### Variable Includes
```ahk
#Include %A_ScriptDir%\MyFile.ahk
#Include %A_WorkingDir%\utils\helper.ahk
```

The explorer automatically resolves:
- `A_ScriptDir` → Directory of the including file
- `A_WorkingDir` → Workspace root directory

### 3. **Real-Time Updates**

The dependency graph updates automatically when:
- A new `.ahk` file is created
- An existing `.ahk` file is modified
- A file is deleted
- #Include directives are added/removed

### 4. **Interactive Tree View**

**Click to Open**: Click any file in the tree to open it in the editor

**Collapsible Nodes**: Click the arrow (▼) to expand/collapse dependencies

**Dependency Count**: See how many files each script includes

**Error Indicators**: Red badge (!) for unresolved dependencies

### 5. **Hierarchical Display**

The explorer shows only top-level files (entry points) and nests their dependencies:

```
📄 main.ahk (3)
  📄 Lib\database.ahk (2)
    📄 Lib\connection.ahk
    📄 Lib\query.ahk
  📄 utils\helpers.ahk
  📄 config.ahk
```

### 6. **Dependency Resolution**

The explorer intelligently resolves include paths:

1. **Absolute paths**: Used as-is
2. **Relative paths**: Resolved relative to the including file
3. **Library paths**: Searches in `Lib\` subdirectory
4. **Workspace fallback**: Searches workspace root if not found

## UI Elements

### Header Bar
- **Title**: "Dependencies"
- **Refresh Button** (⟳): Manually refresh the dependency graph

### File Nodes
Each file node displays:
- 📄 **Icon**: File icon
- **Filename**: Name of the file
- **(count)**: Number of dependencies (if any)
- **!** badge: Error indicator (hover for details)

### Visual States
- **Normal**: Standard text color
- **Hover**: Highlighted background
- **Error**: Red text with error badge
- **Collapsed**: Hidden nested dependencies

## Usage Examples

### Example 1: Simple Project Structure

```
MyProject/
├── main.ahk          → #Include Lib\core.ahk
├── Lib/
│   └── core.ahk      → #Include utils.ahk
└── utils.ahk
```

**Dependency Explorer shows:**
```
📄 main.ahk (1)
  📄 Lib\core.ahk (1)
    📄 utils.ahk
```

### Example 2: Complex Dependencies

```ahk
; app.ahk
#Include %A_ScriptDir%\config.ahk
#Include <Database>
#Include "ui\main-window.ahk"

; config.ahk
#Include <Logger>

; Lib\Database.ahk
#Include <Connection>
```

**Dependency Explorer shows:**
```
📄 app.ahk (3)
  📄 config.ahk (1)
    📄 Lib\Logger.ahk
  📄 Lib\Database.ahk (1)
    📄 Lib\Connection.ahk
  📄 ui\main-window.ahk
```

### Example 3: Unresolved Dependencies

```ahk
#Include MissingFile.ahk
#Include C:\NonExistent\File.ahk
```

**Shows as:**
```
📄 script.ahk (2)
  📄 MissingFile.ahk ! (File not found)
  📄 C:\NonExistent\File.ahk ! (File not found)
```

## Commands

### Refresh Dependencies
- **Command**: `AHKv2 Toolbox: Refresh Dependencies`
- **Shortcut**: Click the ⟳ button
- **When to use**: Force a manual refresh if auto-update seems delayed

## Technical Details

### Parsing Rules

The explorer uses regex patterns to detect #Include directives:

1. **Library includes**: `#Include <LibraryName>`
2. **Quoted includes**: `#Include "path/to/file.ahk"`
3. **Unquoted includes**: `#Include path/to/file.ahk`

### Resolution Algorithm

```
1. Parse include path from directive
2. Replace A_ScriptDir with parent file directory
3. Replace A_WorkingDir with workspace root
4. If absolute path → use directly
5. If relative path → resolve from parent file
6. If still not found → try workspace/Lib/ folder
7. If .ahk extension missing → add it
8. Mark as unresolved if not found
```

### Performance Optimizations

- **Incremental scanning**: Only rescans changed files
- **Circular dependency prevention**: Tracks processed files to avoid infinite loops
- **Lazy rendering**: Only renders visible nodes in the tree
- **Debounced updates**: File watcher events are debounced to prevent excessive refreshes

### Data Structure

```typescript
interface DependencyNode {
  filePath: string;          // Absolute path
  fileName: string;          // Display name
  dependencies: DependencyNode[];  // Child dependencies
  isResolved: boolean;       // Whether file exists
  error?: string;            // Error message if unresolved
}
```

## Limitations

### 1. **Static Analysis Only**
- Cannot resolve dynamic includes (e.g., `#Include %variable%`)
- Variable substitution limited to `A_ScriptDir` and `A_WorkingDir`

### 2. **No Runtime Resolution**
- Conditional includes are all detected regardless of conditions:
  ```ahk
  if (condition)
      #Include file1.ahk  ; Always shown
  else
      #Include file2.ahk  ; Always shown
  ```

### 3. **File System Based**
- Only detects files that physically exist in workspace
- No support for virtual files or in-memory includes

### 4. **AHK v2 Focus**
- Primarily designed for AHK v2 syntax
- May have limited support for v1-specific include patterns

## Troubleshooting

### Dependencies Not Showing

**Check:**
1. Workspace is opened (not just a single file)
2. Files have `.ahk` extension
3. Click the refresh button
4. Check VS Code output for errors

### File Not Opening on Click

**Solutions:**
- Ensure file exists at the path shown
- Check file permissions
- Try right-clicking and using "Open File" from context menu

### Incorrect Dependency Resolution

**Common causes:**
- Typo in include path
- Missing `.ahk` extension in source file
- File in unexpected location (check Lib folder)
- Case-sensitivity on Linux/Mac

### Performance Issues with Large Projects

**Optimizations:**
- Exclude build/dist folders in `.gitignore`
- Use workspace-specific settings to exclude folders
- Reduce number of watched files

## Future Enhancements

Potential improvements:
1. **Dependency graph visualization**: Visual node/edge graph
2. **Circular dependency detection**: Warning for circular includes
3. **Unused file detection**: Find files not included anywhere
4. **Include path validation**: Real-time error checking in editor
5. **Refactoring support**: Update includes when files move
6. **Export functionality**: Export dependency tree to JSON/Markdown

## Related Features

- **Code Map**: Explore function structure within files
- **Function Metadata**: Analyze function signatures and parameters
- **LSP Integration**: Enhanced parsing with AutoHotkey LSP

## Feedback

Found a bug or have a feature request?
- [Report an issue](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)
- Contribute to the [project repository](https://github.com/TrueCrimeAudit/ahkv2-toolbox)
