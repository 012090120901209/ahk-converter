# Dependency Tree Bug Fixes

## Overview
Fixed critical bugs preventing the AHK Dependency Explorer from properly resolving `#Include` directives, especially library includes using the `<LibName>` syntax.

## Bugs Fixed

### 1. Cross-Platform Path Separator Bug (CRITICAL)
**Location**: `src/dependencyExplorerProvider.ts:272-273`

**Issue**: The code used Windows-style backslashes when parsing library includes:
```typescript
// BEFORE (broken on Linux/WSL):
includes.push(`Lib\\${libName}.ahk`);
```

**Problem**: On Unix-based systems (Linux, WSL, macOS), Node.js path functions treat `\\` as literal characters, not path separators. This caused all library includes to fail resolution.

**Fix**: Use forward slashes which work cross-platform:
```typescript
// AFTER (works everywhere):
includes.push(`Lib/${libName}.ahk`);
```

**Impact**: All `#Include <LibName>` directives now resolve correctly on all platforms.

---

### 2. Path Normalization in Resolution
**Location**: `src/dependencyExplorerProvider.ts:310`

**Issue**: The path resolution logic didn't normalize separators before attempting to resolve files, causing mismatches between different path formats.

**Fix**: Added path normalization at the start of resolution:
```typescript
// Normalize path separators for cross-platform compatibility
const normalizedIncludePath = includePath.replace(/\\/g, '/');
```

**Impact**: Handles both user-typed backslashes and forward slashes consistently.

---

### 3. Duplicate Path Candidates
**Location**: `src/dependencyExplorerProvider.ts:326-331` (removed)

**Issue**: Special-case code for `Lib\\` paths created duplicate candidate paths, causing unnecessary file system checks.

**Fix**: Removed the duplicate code block since normalized paths are handled by the main resolution logic.

**Impact**: Improved performance by eliminating redundant file system checks.

---

### 4. Missing Activation Event
**Location**: `package.json:16`

**Issue**: The dependency explorer view was not listed in activation events, potentially preventing the extension from activating when the view was opened.

**Fix**: Added activation event:
```json
"activationEvents": [
  "onView:ahkv2Toolbox",
  "onView:ahkDependencyExplorer",  // Added
  ...
]
```

**Impact**: Ensures extension activates when dependency explorer is opened.

---

## Testing

### Test Files Created

Created a comprehensive test suite to verify all include patterns:

1. **test_dependencies.ahk** - Entry point with 4 different include patterns
   - `#Include <Database>` - Library include
   - `#Include <Logger>` - Library include
   - `#Include "config.ahk"` - Quoted relative include
   - `#Include Test_v1.ahk` - Unquoted relative include

2. **Lib/Database.ahk** - Demonstrates nested library dependencies
   - `#Include <Logger>`

3. **Lib/Logger.ahk** - Multi-level nesting
   - `#Include <Utils>`

4. **Lib/Utils.ahk** - Leaf dependency (no further includes)

5. **config.ahk** - Leaf dependency

### Expected Dependency Tree

```
test_dependencies.ahk (4 dependencies)
  ├── Lib/Database.ahk (1 dependency)
  │   └── Lib/Logger.ahk (1 dependency)
  │       └── Lib/Utils.ahk
  ├── Lib/Logger.ahk (1 dependency)
  │   └── Lib/Utils.ahk
  ├── config.ahk
  └── Test_v1.ahk
```

### How to Test

1. **Open the test file**:
   - Open `test_dependencies.ahk` in VS Code

2. **Open the Dependency Explorer**:
   - Click the "AHKv2 Toolbox" icon in the Activity Bar
   - Look for the "Dependencies" view

3. **Verify the tree**:
   - Should show `test_dependencies.ahk` as the root
   - Should display all 4 direct dependencies
   - Clicking the arrow next to `Lib/Database.ahk` should expand to show `Lib/Logger.ahk`
   - Clicking `Lib/Logger.ahk` should show `Lib/Utils.ahk`
   - All files should be clickable and open in the editor

4. **Test missing dependencies**:
   - Add `#Include <NonExistent>` to `test_dependencies.ahk`
   - Save the file
   - Dependency tree should show red error badge (!) next to the missing file
   - Should offer "Create" and "Search" buttons

### Verification Results

All parsing and resolution tests passed:
- ✓ Library includes `<LibName>` parse to `Lib/LibName.ahk`
- ✓ Quoted includes work: `#Include "path"`
- ✓ Unquoted includes work: `#Include path`
- ✓ Nested dependencies traverse correctly up to MAX_DEPTH (6 levels)
- ✓ Path resolution finds all files in workspace
- ✓ Cross-platform compatible (tested on WSL)

## Technical Details

### Path Resolution Algorithm

The fixed algorithm now works as follows:

1. **Parse** `#Include` directive and extract path
2. **Normalize** path separators (`\` → `/`)
3. **Try candidate paths** in order:
   - Relative to source file
   - Relative to source file + `.ahk` extension
   - Relative to workspace root
   - Relative to workspace root + `.ahk` extension
4. **Check** each candidate for existence and file type
5. **Return** first valid file path or `null`

### Supported Include Formats

```ahk
; Library includes (angle brackets)
#Include <MyLib>              → Lib/MyLib.ahk

; Quoted includes
#Include "path/to/file.ahk"   → path/to/file.ahk
#Include "utils.ahk"          → utils.ahk

; Unquoted includes
#Include utils.ahk            → utils.ahk
#Include C:\full\path.ahk     → C:\full\path.ahk

; Relative paths
#Include ..\parent\file.ahk   → ../parent/file.ahk
#Include sub\file.ahk         → sub/file.ahk
```

### Performance Optimizations

The dependency explorer includes several optimizations:

- **Depth limiting**: Max 6 levels deep (configurable via `MAX_DEPTH`)
- **Circular dependency detection**: Tracks visited files
- **Debounced refresh**: 300ms debounce on file watcher events
- **Concurrent refresh prevention**: Only one scan at a time
- **Active file focus**: Only scans from currently open file

## Known Limitations

1. **Static analysis only**: Cannot resolve dynamic includes with variables
2. **Variable substitution limited**: Only `A_ScriptDir` and `A_WorkingDir` supported
3. **Conditional includes**: All branches detected regardless of conditions
4. **Single workspace**: Only scans first workspace folder

## Future Improvements

Potential enhancements:
- [ ] Workspace-wide entry point detection
- [ ] Circular dependency warnings
- [ ] Unused file detection
- [ ] Export to JSON/Markdown
- [ ] Graph visualization
- [ ] Real-time error checking in editor

## Files Modified

- `src/dependencyExplorerProvider.ts` - Main bug fixes
- `package.json` - Added activation event
- `test_dependencies.ahk` - Test file (new)
- `Lib/Database.ahk` - Test file (new)
- `Lib/Logger.ahk` - Test file (new)
- `Lib/Utils.ahk` - Test file (new)
- `config.ahk` - Test file (new)

## Compilation

TypeScript compilation successful with no errors:
```bash
node ./node_modules/typescript/lib/tsc.js -p ./
```

Output verified in `dist/dependencyExplorerProvider.js`.
