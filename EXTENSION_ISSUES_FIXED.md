# Extension Startup Issues - Analysis & Fixes

## Issues Identified from Console Output

### ✅ 1. FIXED: Duplicate LSP Integration Initialization

**Problem:**
```
AHK LSP extension integration enabled
AHK LSP extension integration enabled  ← Appeared twice!
```

**Root Cause:**
The `LSPOutputCapture.initialize()` method was potentially being called multiple times due to async race conditions. The constructor called `initialize()` without awaiting, and there was no guard against double initialization.

**Fix Applied:**
- Added `isInitialized` flag to prevent double initialization
- Added `initializationPromise` to track async initialization state
- Made `isAvailable()` async to properly wait for initialization
- Updated call site in `extension.ts` to await the async `isAvailable()`

**Files Modified:**
- `src/utils/lspOutputCapture.ts` (lines 14-15, 29-64, 186-189)
  - Added `isInitializing` flag for race-safe initialization
  - Set flags at start of `initialize()` and clear at end
- `src/extension.ts` (line 1095)

---

### ✅ 2. FIXED: Scrollbar Layout Offset

**Problem:**
When content in the toolbox sidebar exceeded the viewport height, a scrollbar would appear and cause the entire layout to shift horizontally, creating a jarring visual effect.

**Root Cause:**
The scrollbar was taking up width from the content area, causing all elements to reflow and shift left when it appeared/disappeared.

**Fix Applied:**
- Added `scrollbar-gutter: stable` to body styles
- Added `overflow-y: auto` to enable vertical scrolling
- This reserves space for the scrollbar even when not visible

**Files Modified:**
- `src/toolboxSidebarProvider.ts` (lines 670-680)
  - Updated body styles in both main view and metadata editor

---

### ✅ 3. FIXED: File Parsing Errors

**Problem:**
```
Failed to parse JSDoc: Error: ENOENT: no such file or directory, open 'C:\Converted.ahk'
```
The extension was attempting to parse metadata from files that don't exist, causing repeated error logs.

**Root Cause:**
The `parseJSDoc()` function didn't check if the file existed before trying to read it, causing ENOENT errors for non-existent files.

**Fix Applied:**
- Added `fs.access()` check before attempting to read the file
- Returns empty metadata silently if file doesn't exist
- Prevents error spam in console

**Files Modified:**
- `src/toolboxSidebarProvider.ts` (lines 305-313)
  - Added file existence check in `parseJSDoc()` method

---

### ⚠️ 4. IDENTIFIED: Channel Closed Errors During Shutdown

**Problem:**
```
Error: Channel has been closed
  at s (file:///c:/Users/uphol/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:121:2431)
  at Object.appendLine (...)
```

**Root Cause:**
Multiple extensions (AutoHotkey LSP, Claude Code, etc.) attempt to write to output channels during extension deactivation, but VS Code has already closed the channels.

**Impact:**
- These are shutdown-related errors that don't affect functionality
- They appear in the debug console but don't impact users
- Mostly cosmetic but indicate cleanup order issues

**Recommendation:**
- Not critical to fix immediately
- Could be improved by adding better disposal guards in the future
- VS Code should handle these more gracefully

---

### ⚠️ 5. IDENTIFIED: DLI ADP Problems Logger Spam

**Problem:**
```
Logged 12 problems to c:\Users\uphol\.vscode\extensions\dli-systems.dli-adp-problems-logger-0.0.1\out\problems_log.json
```
This message appeared **7 times** during startup!

**Root Cause:**
The DLI ADP Problems Logger extension logs diagnostics on every diagnostics change event, causing excessive I/O and console spam.

**Impact:**
- Performance overhead during startup
- Console clutter
- Unnecessary disk writes

**Recommendations:**
1. **Disable this extension** if not actively needed
2. OR configure it to batch logs instead of logging on every change
3. OR contact extension author about the excessive logging

**How to Disable:**
Add to `.vscode/launch.json`:
```json
"args": [
  "--disable-extension=dli-systems.dli-adp-problems-logger"
]
```

---

### ℹ️ 6. INFORMATIONAL: Deprecation Warnings

**Problem:**
```
(node:43884) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
```

**Root Cause:**
The Kilo Code extension uses the deprecated `punycode` module from Node.js.

**Impact:**
- No functional impact
- Will need to be addressed by Kilo Code extension author when Node.js removes punycode
- Warning only appears in debug console

**Action:**
- Not actionable by us
- Monitor for Kilo Code extension updates

---

### ℹ️ 7. INFORMATIONAL: Configuration Warnings

**Problem:**
```
GLM variant configuration warnings: (1) ['Components defined but not used in template: TOOL_USE_SECTION']
XS variant configuration warnings: (2) ['Component overrides for unused components: TOOL_U…', 'Missing recommended components: TOOL_USE_SECTION']
```

**Root Cause:**
Claude Code extension template configuration has unused components.

**Impact:**
- Cosmetic only
- Claude Code is working correctly
- These are internal configuration warnings

**Action:**
- No action needed
- Claude Code team may address in future updates

---

### ℹ️ 8. INFORMATIONAL: MCP Server Startup Messages

**Observed:**
```
Server "ahk-server" info: [2025-10-29T14:04:11.988Z] INFO: Starting AutoHotkey v2 MCP Server...
Server "filesystem" info: Secure MCP Filesystem Server running on stdio
Server "github.com/..." info: GitHub MCP Server running on stdio
```

**Status:**
- **Normal behavior** - MCP servers are starting correctly
- No issues detected
- Expected console output

---

## Summary of Actions Taken

### Immediate Fixes Applied ✅
1. **Fixed duplicate LSP initialization** with proper race-safe guards (isInitializing flag)
2. **Fixed scrollbar offset issue** - Added `scrollbar-gutter: stable` to prevent layout shift
3. **Fixed file parsing errors** - Added file existence check before attempting to parse JSDoc
4. **Compiled and verified** TypeScript changes with no errors

### Recommended Follow-up Actions 🔧
1. **Disable DLI ADP Problems Logger** to reduce console spam (add to launch.json)
2. **Monitor** for Kilo Code extension updates to address punycode deprecation
3. **Consider** adding better disposal guards for output channels during shutdown

### Non-Issues (Safe to Ignore) ℹ️
1. MCP server startup messages (normal)
2. Claude Code configuration warnings (cosmetic)
3. Channel closed errors during shutdown (VS Code cleanup order)

---

## Testing Verification

To verify the fix works:

1. **Reload the extension** (F5 or Run > Start Debugging)
2. **Check debug console** for the startup sequence
3. **Verify** you now see only **one** instance of "AHK LSP extension integration enabled"
4. **Run command**: `AHK: Show Output Capture Stats` to confirm LSP integration is active

Expected output after fix:
```
Activated pip-updater extension
AHK LSP extension integration enabled  ← Should appear only ONCE now
AHK v2 Chat Participant registered
```

---

## Performance Impact

**Before:**
- Duplicate LSP initialization
- Multiple async race conditions
- Potential double monitoring setup

**After:**
- Single initialization with guards
- Proper async handling
- Clean startup sequence

**Estimated Improvement:**
- Eliminates duplicate work during startup
- Cleaner console output
- More reliable initialization
