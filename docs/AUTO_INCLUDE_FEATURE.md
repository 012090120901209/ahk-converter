# Auto-Add #Include Feature

## Overview

The Auto-Add #Include feature automatically inserts `#Include` statements into your AutoHotkey v2 files when installing packages through the Dependency Manager. This streamlines the workflow of adding libraries to your projects by eliminating manual file editing.

## Implementation Status

✅ **IMPLEMENTED** - Version 0.4.2+

## How It Works

### User Workflow

1. **Install a Package**
   - Navigate to the Dependency Manager sidebar
   - Find a package in "Available Libraries" or "Installed Libraries"
   - Click the install button or use the context menu

2. **Installation Complete**
   - Package is installed to the `Lib/` folder
   - Success notification appears with three options:
     - **Add #Include** - Automatically add the include line
     - **Open** - Open the installed library file
     - **Dismiss** - Close notification

3. **Add #Include**
   - If you click "Add #Include":
     - If an .ahk file is currently active → Include is added to that file
     - If no .ahk file is active → Quick Pick menu shows all workspace .ahk files
   - Select target file (if prompted)
   - Include line is inserted following the documented rules

4. **Confirmation**
   - Success message shows: "✓ Added #Include for PackageName at line X"
   - If package was already included: "PackageName is already included in this file (line X)"
   - If headers were added: "✓ Added headers and #Include for PackageName"

### Insertion Rules

The feature follows the comprehensive rules documented in [INCLUDE_INSERTION_RULES.md](INCLUDE_INSERTION_RULES.md):

1. **Finds the directive anchor** (#SingleInstance or #Requires)
2. **Locates the include block** (if it exists)
3. **Appends to the end** of existing includes (never sorts)
4. **Creates new block** if needed (with exactly one blank line spacing)
5. **Prevents duplicates** using normalized filename comparison
6. **Preserves formatting** (EOL style, spacing, alignment)

### Example Results

#### Before:
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk

; Your code here
```

#### After Installing "JSON":
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk
#Include Lib/JSON.ahk

; Your code here
```

## Configuration

The feature uses these VS Code settings (already configured in `package.json`):

### `ahkv2Toolbox.includeFormat`
**Type:** `string`
**Default:** `"Lib/{name}.ahk"`
**Description:** Template for #Include paths. Use `{name}` for package name.

**Examples:**
```json
"ahkv2Toolbox.includeFormat": "Lib/{name}.ahk"    // Default
"ahkv2Toolbox.includeFormat": "vendor/{name}.ahk" // Vendor folder
"ahkv2Toolbox.includeFormat": "<{name}>"          // Angle brackets
```

### `ahkv2Toolbox.autoInsertHeaders`
**Type:** `boolean`
**Default:** `false`
**Description:** Automatically insert #Requires and #SingleInstance headers if missing.

When enabled, if your file has no directives, the feature will add them before the #Include:
```ahk
; Your file before (no headers):
MsgBox("Hello")

; After installing package with autoInsertHeaders: true:
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/PackageName.ahk

MsgBox("Hello")
```

### `ahkv2Toolbox.headerOrder`
**Type:** `array`
**Default:** `["#Requires AutoHotkey v2.1", "#SingleInstance Force"]`
**Description:** Order of headers to insert when `autoInsertHeaders` is enabled.

### `ahkv2Toolbox.defaultRequires`
**Type:** `string`
**Default:** `"AutoHotkey v2.1"`
**Description:** Default AutoHotkey version for #Requires directive.

### `ahkv2Toolbox.defaultSingleInstance`
**Type:** `string`
**Enum:** `["Force", "Ignore", "Prompt", "Off"]`
**Default:** `"Force"`
**Description:** Default #SingleInstance mode.

## Key Features

### 1. Smart Duplicate Detection
- Normalizes include paths to just the base filename
- Case-insensitive comparison
- Detects duplicates across different path formats:
  ```ahk
  #Include Lib/MyLib.ahk
  #Include <MyLib>
  #Include ../shared/MyLib.ahk
  ```
  All recognized as the same library.

### 2. Format Preservation
- Maintains your file's EOL style (CRLF on Windows, LF on Unix)
- Preserves column-zero alignment (no indentation)
- Keeps exactly one blank line between directives and includes
- No blank lines within the include block

### 3. Intelligent File Selection
- Automatically uses active .ahk file if available
- Excludes library files (Lib/, vendor/) from file picker
- Shows relative paths in Quick Pick for clarity
- Supports both .ahk and .ahk2 file extensions

### 4. Append-Only Strategy
- Always appends to the end of the include block
- Never sorts or reorders your includes
- Maintains the order you installed packages

## Code Architecture

### Core Module: `includeLineInserter.ts`

**Main Functions:**

- `insertIncludeLine(document, options)` - Main entry point
  - Analyzes document structure
  - Finds appropriate insertion point
  - Applies workspace edit
  - Returns status result

- `findDirectiveAnchor(lines)` - Locates #SingleInstance or #Requires
- `findIncludeBlock(lines, anchorLine)` - Finds existing include block
- `normalizeIncludeName(path)` - Extracts base filename for comparison
- `findExistingInclude(lines, normalizedName)` - Duplicate detection
- `detectEOL(text)` - Determines line ending style
- `insertHeaders(lines, headerOrder)` - Adds missing headers

**Return Status:**
```typescript
interface InsertIncludeResult {
  status: 'inserted' | 'already_included' | 'headers_added' | 'error';
  message: string;
  lineNumber?: number;
}
```

### Integration: `packageManagerProvider.ts`

**Modified Methods:**

- `installPackage(packageItem)` - Updated to offer "Add #Include" button
- `addIncludeToActiveFile(packageName)` - Handles file selection and insertion
- `isAhkFile(document)` - Validates file type
- `findWorkspaceAhkFiles()` - Locates target files

## Testing

### Unit Tests: `src/test/includeLineInserter.test.ts`

Comprehensive test coverage for:

- ✅ Directive anchor detection (priority: #SingleInstance > #Requires)
- ✅ Appending to existing include blocks
- ✅ Creating new include blocks
- ✅ Duplicate detection (case-insensitive, multiple formats)
- ✅ Header auto-insertion
- ✅ Custom include formats
- ✅ Edge cases (empty file, comments, CRLF, multiple directives)

**Run Tests:**
```bash
npm test
```

### Manual Testing Checklist

- [ ] Install package with active .ahk file → Include added
- [ ] Install package with no active file → File picker appears
- [ ] Install same package twice → Duplicate message appears
- [ ] Install with `autoInsertHeaders: true` on empty file → Headers added
- [ ] Install with custom `includeFormat` → Custom path used
- [ ] Install to file with existing includes → Appends to end
- [ ] Check CRLF preservation on Windows
- [ ] Check LF preservation on Unix/Mac

## Usage Examples

### Example 1: Basic Installation
```typescript
// User clicks "Install" on JSON package in Dependency Manager
// Notification appears: "JSON installed successfully!"
// User clicks "Add #Include"
// If Test.ahk is active:

// Before:
#Requires AutoHotkey v2.1
#SingleInstance Force

MsgBox("Starting...")

// After:
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/JSON.ahk

MsgBox("Starting...")
```

### Example 2: First Library in New File
```typescript
// User installs "Arrays" package
// File has no includes yet:

// Before:
#Requires AutoHotkey v2.1

; Initialize app
app := {}

// After:
#Requires AutoHotkey v2.1

#Include Lib/Arrays.ahk

; Initialize app
app := {}
```

### Example 3: With Auto-Insert Headers
```typescript
// Settings: { "ahkv2Toolbox.autoInsertHeaders": true }
// User installs "Strings" package
// File has no directives:

// Before:
MsgBox("Hello World")

// After:
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Strings.ahk

MsgBox("Hello World")
```

## Implementation Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/includeLineInserter.ts` | Core insertion logic | 340 | ✅ Complete |
| `src/packageManagerProvider.ts` | Integration with package manager | Modified | ✅ Complete |
| `src/test/includeLineInserter.test.ts` | Unit tests | 420 | ✅ Complete |
| `docs/INCLUDE_INSERTION_RULES.md` | Specification | - | ✅ Complete |
| `docs/AUTO_INCLUDE_FEATURE.md` | This document | - | ✅ Complete |

## Future Enhancements

Potential improvements for future versions:

- [ ] **Batch Insert** - Add includes for all installed packages at once
- [ ] **Include Preview** - Show diff preview before insertion
- [ ] **Undo Support** - Better integration with VS Code undo stack
- [ ] **Include Sorting** - Optional alphabetical sorting (off by default)
- [ ] **Custom Templates** - Per-workspace include format templates
- [ ] **Import from File** - Scan existing file for missing includes

## Troubleshooting

### Include Not Added
**Problem:** Clicking "Add #Include" does nothing

**Solutions:**
1. Check if file is saved (unsaved files may cause issues)
2. Verify file is recognized as .ahk or .ahk2
3. Check VS Code Output panel for errors: View → Output → "AHKv2 Toolbox"

### Wrong Include Path
**Problem:** Include uses wrong format (e.g., `Lib/` when you want `vendor/`)

**Solution:**
Update `ahkv2Toolbox.includeFormat` in settings:
```json
{
  "ahkv2Toolbox.includeFormat": "vendor/{name}.ahk"
}
```

### Duplicate Not Detected
**Problem:** Same library inserted twice

**Solution:**
This shouldn't happen - the feature uses normalized comparison. If it does:
1. Check both include lines - they might have different base names
2. Report as bug with file content example

### Headers Not Added
**Problem:** Expected headers to be added but they weren't

**Solution:**
Enable `autoInsertHeaders` in settings:
```json
{
  "ahkv2Toolbox.autoInsertHeaders": true
}
```

## Related Documentation

- [INCLUDE_INSERTION_RULES.md](INCLUDE_INSERTION_RULES.md) - Detailed insertion rules
- [ROADMAP.md](../ROADMAP.md) - Feature roadmap
- [Package Manager Guide](USER_GUIDE.md) - General package manager usage

## Contributing

To improve this feature:

1. Review the [rules specification](INCLUDE_INSERTION_RULES.md)
2. Check [existing tests](../src/test/includeLineInserter.test.ts)
3. Add tests for new scenarios
4. Update this documentation
5. Submit pull request

---

**Status:** ✅ Fully Implemented
**Version:** 0.4.2+
**Last Updated:** 2025-10-31
**Implementation:** [src/includeLineInserter.ts](../src/includeLineInserter.ts)
