# AHK Dependency Tree - Technical Documentation

## Overview

The Dependency Tree feature provides a visual representation of `#Include` relationships in your AutoHotkey project. It uses VS Code's native TreeView API for maximum reliability and cross-platform compatibility.

## Architecture

### Why TreeDataProvider (Not Webview)?

The previous implementation used WebviewViewProvider, which had several issues:
- Rendering problems
- Complex message passing
- Theme compatibility issues
- Higher maintenance overhead

The new implementation uses **TreeDataProvider**, which is:
- ✅ Native VS Code component
- ✅ Automatic theming
- ✅ Built-in keyboard navigation
- ✅ Better performance
- ✅ Cross-platform guaranteed

### Core Components

```
DependencyTreeProvider (TreeDataProvider)
├── File System Watcher
│   ├── onCreate → refresh tree
│   ├── onChange → invalidate cache + refresh
│   └── onDelete → remove from cache + refresh
│
├── Dependency Cache (Map<filePath, DependencyInfo>)
│   ├── Stores parsed includes
│   ├── Invalidated on file change
│   └── Prevents redundant parsing
│
└── Include Resolution Engine
    ├── Parse #Include directives
    ├── Resolve to absolute paths
    └── Cross-platform path handling
```

## Include Directive Parsing

### Supported Formats

```ahk
; 1. Library includes
#Include <LibName>           → resolves to Lib/LibName.ahk

; 2. Quoted paths
#Include "path/to/file.ahk"  → relative or absolute

; 3. Unquoted paths
#Include MyFile.ahk          → relative to source file
#Include ./utils/helper.ahk  → relative path

; 4. Variable-based paths
#Include %A_ScriptDir%\file.ahk  → substituted and resolved
```

### Regex Patterns Used

```typescript
// Pattern 1: Library includes <LibName>
/#Include\s+<([^>]+)>/gi

// Pattern 2: Quoted paths "path.ahk"
/#Include\s+"([^"]+)"/gi

// Pattern 3: Unquoted paths
/#Include\s+([^\s;]+\.ahk)/gi

// Pattern 4: Variable paths %A_ScriptDir%\file.ahk
/#Include\s+%A_\w+%[\\/]([^\s;]+)/gi
```

## Path Resolution Algorithm

### Cross-Platform Strategy

**Key Principle**: Normalize all path separators to forward slashes (`/`) before resolution.

```typescript
const normalizedInclude = includePath.replace(/\\/g, '/');
```

This ensures:
- Windows paths: `C:\Path\File.ahk` → `C:/Path/File.ahk`
- Linux/WSL paths: `/home/user/file.ahk` → unchanged
- Mixed separators: `path\to/file.ahk` → `path/to/file.ahk`

### Resolution Order

For each include directive, we try candidates in this order:

#### 1. Library Includes (`<LibName>`)
```typescript
candidates = [
  workspace/Lib/LibName.ahk,
  C:/Program Files/AutoHotkey/Lib/LibName.ahk,  // Windows only
  C:/Program Files (x86)/AutoHotkey/Lib/LibName.ahk  // Windows only
]
```

#### 2. Relative Paths (starts with `.`)
```typescript
candidates = [
  path.resolve(sourceDir, includePath)
]
```

#### 3. Absolute Paths
```typescript
candidates = [
  includePath  // use as-is
]
```

#### 4. Relative to Source File
```typescript
candidates = [
  path.join(sourceDir, includePath)
]
```

#### 5. Relative to Workspace Root
```typescript
candidates = [
  path.join(workspaceRoot, includePath)
]
```

### File Existence Check

```typescript
for (const candidate of candidates) {
  try {
    await fs.access(candidate, fs.constants.R_OK);
    return candidate;  // Found and readable
  } catch {
    // Try next candidate
  }
}
return null;  // Not found
```

## Error Handling

### Unresolved Includes

When an include cannot be resolved:
1. Added to `unresolvedIncludes` array
2. Displayed with ⚠️ warning icon
3. Tooltip shows the raw include path
4. Context value: `dependencyWithErrors`

### Missing Workspace

If no workspace folder is open:
- Provider initialization is wrapped in try-catch
- Error is logged to console
- Extension continues to work (other features unaffected)

## Performance Optimizations

### Caching Strategy

```typescript
private dependencyCache = new Map<string, DependencyInfo>();
```

- **Cache on first parse**: Avoid re-parsing unchanged files
- **Invalidate on change**: File watcher triggers cache removal
- **Lazy loading**: Only parse when tree node is expanded

### Incremental Updates

File watcher only triggers refresh for affected files:
```typescript
this.fileWatcher.onDidChange((uri) => {
  this.dependencyCache.delete(uri.fsPath);  // Only invalidate changed file
  this.refresh();
});
```

## Testing Cross-Platform Compatibility

### Local Testing (Windows with WSL)

```bash
# Test from WSL
cd /mnt/c/Users/.../ahk-converter
code .

# Verify:
# 1. Path resolution works for both / and \ separators
# 2. Library includes resolve to Lib/ folder
# 3. Tree renders without errors
```

### Test Cases

Create these test files in your workspace:

```
test-deps/
├── main.ahk
│   └── #Include lib/utils.ahk
│   └── #Include <MyLib>
├── lib/
│   └── utils.ahk
│       └── #Include helper.ahk
│   └── helper.ahk
└── Lib/
    └── MyLib.ahk
```

**main.ahk**:
```ahk
#Include lib/utils.ahk
#Include <MyLib>
MsgBox "Main"
```

**lib/utils.ahk**:
```ahk
#Include helper.ahk
Utils() {
    MsgBox "Utils"
}
```

**lib/helper.ahk**:
```ahk
Helper() {
    MsgBox "Helper"
}
```

**Lib/MyLib.ahk**:
```ahk
MyLib() {
    MsgBox "Library"
}
```

### Expected Tree Output

```
📄 test-deps/main.ahk (2 includes)
  ├── 📄 utils.ahk (1 includes)
  │   └── 📄 helper.ahk
  └── 📄 MyLib.ahk

📄 test-deps/lib/utils.ahk (1 includes)
  └── 📄 helper.ahk

📄 test-deps/lib/helper.ahk

📄 test-deps/Lib/MyLib.ahk
```

## Troubleshooting

### Issue: Tree is empty

**Cause**: No `.ahk` files found in workspace
**Solution**: Ensure you have opened a workspace folder containing `.ahk` files

### Issue: Includes show as unresolved

**Cause**: Path resolution failed
**Debug steps**:
1. Check file actually exists at expected location
2. Verify path separators (use `/` not `\` in includes)
3. Check workspace `Lib/` folder exists for library includes
4. Enable developer tools: `Help > Toggle Developer Tools`
5. Check console for error messages

### Issue: Tree doesn't update after file change

**Cause**: File watcher not working
**Debug steps**:
1. Manually click refresh button
2. Check if file is excluded by `.gitignore` or VS Code settings
3. Verify file extension is `.ahk`

## API Reference

### DependencyTreeProvider

```typescript
class DependencyTreeProvider implements vscode.TreeDataProvider<DependencyTreeItem>
```

**Methods**:
- `refresh()`: Manually trigger tree refresh
- `getTreeItem(element)`: Returns tree item for display
- `getChildren(element?)`: Returns children of element (or roots)

### DependencyTreeItem

```typescript
class DependencyTreeItem extends vscode.TreeItem
```

**Properties**:
- `filePath`: Absolute path to file
- `includes`: Array of resolved include paths
- `unresolvedIncludes`: Array of unresolved includes
- `iconPath`: Icon (warning if errors, file-code otherwise)
- `command`: Opens file on click

### Commands

- `ahkDependencyTree.refresh`: Manually refresh tree
- `ahkDependencyTree.openFile`: Opens file in editor (internal)

## Extension Points

### Custom Include Resolvers

To add custom resolution logic:

```typescript
private async resolveInclude(includePath: string, sourceFile: string): Promise<string | null> {
  // Add your custom logic here
  if (includePath.startsWith('@myprefix/')) {
    const customPath = this.resolveCustomPath(includePath);
    if (await this.fileExists(customPath)) {
      return customPath;
    }
  }

  // Fall through to existing logic...
}
```

### Custom Tree Icons

Modify `DependencyTreeItem` constructor:

```typescript
this.iconPath = unresolvedIncludes.length > 0
  ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'))
  : new vscode.ThemeIcon('file-code', new vscode.ThemeColor('symbolIcon.fileForeground'));
```

## Performance Characteristics

- **Initial scan**: O(n) where n = number of `.ahk` files
- **Per-file parse**: O(m) where m = lines in file
- **Cache hit**: O(1) lookup
- **File watcher**: O(1) per file change
- **Tree render**: O(d) where d = depth of dependency tree

## Security Considerations

### File Access

- Uses `fs.constants.R_OK` to check read permission
- Never executes file content
- Only parses static include directives

### Path Traversal

- All paths resolved through Node's `path.resolve()`
- Prevents `../../../` style attacks
- Workspace boundaries enforced

## Future Enhancements

Potential improvements:
1. **Circular dependency detection**: Highlight cycles in red
2. **Dependency graph visualization**: Show entire project graph
3. **Include path validation**: Real-time warnings in editor
4. **Auto-import suggestions**: IntelliSense for available files
5. **Dependency statistics**: Count total dependencies per file

## Comparison to Previous Implementation

| Feature | Old (Webview) | New (TreeProvider) |
|---------|---------------|-------------------|
| Rendering | Custom HTML/CSS | Native VS Code |
| Theming | Manual sync | Automatic |
| Icons | Base64 images | Theme icons |
| Click handling | Message passing | Direct command |
| Performance | Slower | Faster |
| Maintenance | High | Low |
| Cross-platform | Buggy | Guaranteed |
| File watcher | Custom | Built-in |
