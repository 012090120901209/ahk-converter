# Dependency Tree - Active File Mode

## Overview

The Dependency Tree now shows dependencies **only for the currently active `.ahk` file** in the editor. This provides a focused view of what the current file includes.

## Behavior

### When an AHK file is open:
```
_Demo.ahk (1 include)
  └── Library_Lvl1.ahk (2 includes)
      ├── Library_Lvl2a.ahk
      └── Library_Lvl2b.ahk
```

The tree shows:
1. **Root node**: The currently active file
2. **Child nodes**: Files directly included by the active file
3. **Nested nodes**: Files included by those files (recursively)

### When no AHK file is open:
```
📄 Open an .ahk file to view dependencies
```

### Automatic Updates

The tree automatically refreshes when you:
- Switch to a different file (tab)
- Save a file (updates the dependency cache)
- Create/delete `.ahk` files

## Library Include Resolution

Library includes (those without path separators) are resolved in this order:

1. **Workspace `Lib/` folder** - `{workspace}/Lib/LibraryName.ahk`
2. **Source file's `Lib/` folder** - `{sourceDir}/Lib/LibraryName.ahk`
3. **System AutoHotkey Lib** - `C:/Program Files/AutoHotkey/Lib/LibraryName.ahk`

Example:
```ahk
#Include <Library_Lvl1>
```

Resolves to: `{workspace}/Lib/Library_Lvl1.ahk`

## Usage Tips

### Focus on One File
- Open the file you want to analyze
- The dependency tree shows only its includes
- No clutter from other workspace files

### Navigate Dependencies
- Click any file in the tree to open it
- The tree updates to show that file's dependencies
- Quickly explore nested include chains

### Find Missing Includes
- Unresolved includes show with ⚠️ icon
- Hover to see the raw include path
- Helps debug path issues

## Examples

### Example 1: Simple File

**main.ahk**:
```ahk
#Include utils.ahk
```

**Tree view**:
```
main.ahk (1 include)
  └── utils.ahk
```

### Example 2: Nested Dependencies

**_Demo.ahk**:
```ahk
#Include <Library_Lvl1>
```

**Library_Lvl1.ahk**:
```ahk
#Include <Library_Lvl2a>
#Include <Library_Lvl2b>
```

**Tree view when _Demo.ahk is active**:
```
_Demo.ahk (1 include)
  └── Library_Lvl1.ahk (2 includes)
      ├── Library_Lvl2a.ahk
      └── Library_Lvl2b.ahk
```

### Example 3: No Includes

**standalone.ahk**:
```ahk
MsgBox "Hello"
```

**Tree view**:
```
standalone.ahk
```

(No expansion arrow, no children)

### Example 4: Unresolved Include

**broken.ahk**:
```ahk
#Include missing.ahk
```

**Tree view**:
```
broken.ahk (1 include)
  └── ⚠️ missing.ahk
```

## Comparison to Previous Behavior

### Old Behavior (All Files)
```
Dependencies
├── _Demo.ahk
├── config.ahk
├── Lib\Database.ahk
├── Lib\Logger.ahk
├── test\simple.ahk
├── vendor\convert.ahk
└── ... (50+ files)
```
❌ Shows every `.ahk` file in workspace
❌ Cluttered and overwhelming
❌ Hard to find what you need

### New Behavior (Active File Only)
```
Dependencies
└── _Demo.ahk (1 include)
    └── Library_Lvl1.ahk (2 includes)
        ├── Library_Lvl2a.ahk
        └── Library_Lvl2b.ahk
```
✅ Shows only relevant includes
✅ Clean and focused
✅ Easy to understand

## Keyboard Shortcuts

While in the Dependency Tree view:
- `↑/↓` - Navigate items
- `→` - Expand node
- `←` - Collapse node
- `Enter` - Open file
- `Space` - Toggle expansion

## Refresh Behavior

The tree refreshes automatically when:
1. **Active editor changes** - Switch files/tabs
2. **File is saved** - Dependency cache is invalidated
3. **Files are created/deleted** - Workspace watcher triggers

Manual refresh:
- Click the refresh button (🔄) in the view title bar

## Technical Details

### Root Node Selection
```typescript
const activeEditor = vscode.window.activeTextEditor;
const filePath = activeEditor.document.fileName;
// Use this file as the tree root
```

### Active Editor Listener
```typescript
vscode.window.onDidChangeActiveTextEditor(() => {
  this.refresh(); // Update tree when switching files
});
```

### Library Include Detection
```typescript
// If no path separators, treat as library include
const isLibraryInclude = !normalizedInclude.includes('/')
  && !path.isAbsolute(includePath);
```

## Troubleshooting

**Issue**: Tree shows "Open an .ahk file to view dependencies"
- **Cause**: No active editor or active file is not `.ahk`
- **Solution**: Open an AutoHotkey file

**Issue**: Tree doesn't update when switching files
- **Cause**: Extension not loaded or error occurred
- **Solution**: Reload window (`Developer: Reload Window`)

**Issue**: Library includes don't resolve
- **Cause**: File not in `Lib/` folder or wrong name
- **Solution**: Ensure `{workspace}/Lib/LibraryName.ahk` exists

**Issue**: Tree is empty when file has includes
- **Cause**: Include paths cannot be resolved
- **Solution**: Check paths, look for ⚠️ icons, verify files exist
