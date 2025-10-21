# How to Test the Dependency Tree Fixes

## Quick Start

1. **Reload VS Code Extension**:
   ```
   Press F5 in VS Code (or Run > Start Debugging)
   ```
   This launches a new Extension Development Host window.

2. **Open the test file**:
   - In the Extension Development Host, open this folder
   - Open `test_dependencies.ahk`

3. **View Dependencies**:
   - Click the AHKv2 Toolbox icon in the Activity Bar (left sidebar)
   - Look for the "Dependencies" panel
   - You should see a tree showing all includes

## What You Should See

### Expected Tree Structure:
```
📄 test_dependencies.ahk (4)
  📄 Lib/Database.ahk (1)
    📄 Lib/Logger.ahk (1)
      📄 Lib/Utils.ahk
  📄 Lib/Logger.ahk (1)
    📄 Lib/Utils.ahk
  📄 config.ahk
  📄 Test_v1.ahk
```

### Test Interactions:

1. **Click any file** → Should open in editor
2. **Click the arrow (▼)** → Expands/collapses dependencies
3. **Hover over files** → Shows full path tooltip
4. **Check dependency counts** → Numbers in parentheses show child count

## Testing Error Handling

1. **Add a missing include**:
   ```ahk
   #Include <NonExistent>
   ```

2. **Save the file**

3. **Check the tree**:
   - Should show `📄 Lib/NonExistent.ahk !` with error badge
   - Should show "File not found" on hover
   - Should display "Create" and "Search" buttons

4. **Click "Create"**:
   - Should create the missing file
   - Should open it in editor
   - Tree should update and remove error badge

## Testing Different Include Patterns

Edit `test_dependencies.ahk` and try:

```ahk
; These should all resolve correctly:
#Include <Database>           ✓ Library include
#Include "config.ahk"         ✓ Quoted path
#Include Test_v1.ahk          ✓ Unquoted path
#Include Lib/Utils.ahk        ✓ Forward slash
#Include Lib\Utils.ahk        ✓ Backslash (normalized to forward slash)
```

## Verifying the Fixes

### Fix #1: Library Includes
- Open `test_dependencies.ahk`
- Verify `#Include <Database>` and `#Include <Logger>` resolve to `Lib/Database.ahk` and `Lib/Logger.ahk`
- **Before fix**: Would show as missing
- **After fix**: Should display correctly

### Fix #2: Nested Dependencies
- Expand `Lib/Database.ahk`
- Should show `Lib/Logger.ahk` nested underneath
- Expand `Lib/Logger.ahk`
- Should show `Lib/Utils.ahk`
- **Before fix**: Nested libs might not resolve
- **After fix**: Full tree displays correctly

### Fix #3: Cross-Platform Paths
- Check that both forward slashes and backslashes work
- Tree should normalize all paths consistently
- **Before fix**: Mixed separators could break resolution
- **After fix**: All separator types work

## Troubleshooting

### Dependencies Not Showing
1. Check that extension is activated (look for AHKv2 Toolbox icon)
2. Make sure you have an `.ahk` file open
3. Click the refresh button (⟳) in the Dependencies panel
4. Check VS Code Developer Tools (Help > Toggle Developer Tools) for errors

### Files Not Resolving
1. Verify files exist in the workspace
2. Check file extensions (must be `.ahk`)
3. Ensure paths are relative to workspace or source file
4. Look for typos in `#Include` directives

### View Not Appearing
1. Reload the window (Ctrl+R or Cmd+R)
2. Check that `activationEvents` includes `onView:ahkDependencyExplorer` in package.json
3. Reinstall the extension

## Success Criteria

✓ All test files resolve without errors
✓ Library includes `<Name>` resolve to `Lib/Name.ahk`
✓ Nested dependencies display in tree
✓ Clicking files opens them in editor
✓ Missing files show error badges
✓ Tree updates when files change
✓ Works on Windows, Linux, and WSL

## Next Steps

If all tests pass:
1. Delete test files (or keep for future reference):
   - `test_dependencies.ahk`
   - `Lib/Database.ahk`
   - `Lib/Logger.ahk`
   - `Lib/Utils.ahk`
   - `config.ahk`

2. Test with your real AHK projects

3. Report any issues found

## Test Files Created

All test files are in the root of the workspace:
- `test_dependencies.ahk` - Main test entry point
- `Lib/` - Directory containing library files
  - `Database.ahk` - Depends on Logger
  - `Logger.ahk` - Depends on Utils
  - `Utils.ahk` - No dependencies
- `config.ahk` - Standalone config file

You can safely delete these after testing is complete.
