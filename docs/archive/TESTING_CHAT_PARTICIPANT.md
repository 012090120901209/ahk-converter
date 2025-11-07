# Testing the Chat Participant

## Installation Instructions

The extension has been packaged as `ahkv2-toolbox-0.4.3.vsix`. To test it:

### 1. Install the Extension

```bash
# From VS Code Command Palette (Ctrl+Shift+P):
Extensions: Install from VSIX...
# Select: ahkv2-toolbox-0.4.3.vsix
```

Or via command line:
```bash
code --install-extension ahkv2-toolbox-0.4.3.vsix
```

### 2. Verify Requirements

- **VS Code**: Version 1.90+ (for chat participant support)
- **GitHub Copilot**: Must be installed and active
- **Active Subscription**: GitHub Copilot subscription required

### 3. Test Commands

Open an AHK file in your workspace, then open the Chat panel (Ctrl+Shift+I) and test:

#### Test 1: Code Map
```
@ahk /codemap
```

**Expected Output:**
- ASCII tree of the active file's structure
- Symbol counts (classes, functions, methods, etc.)
- Formatted markdown response

#### Test 2: Dependencies
```
@ahk /dependencies
```

**Expected Output:**
- ASCII tree of `#Include` relationships
- Resolved and unresolved includes
- Dependency statistics

#### Test 3: Workspace Overview
```
@ahk /workspace
```

**Expected Output:**
- Combined output of both code map and dependencies
- Comprehensive workspace context for the LLM

#### Test 4: Syntax Validation
```
@ahk /syntax
```

**Expected Output:**
- v1 contamination detection
- VS Code diagnostics integration
- Line-by-line issue reporting
- Success message if code is clean

#### Test 5: Symbol Overview
```
@ahk /symbols
```

**Expected Output:**
- Symbol counts by type
- ASCII tree structure
- Navigation tips

#### Test 6: Refactoring Suggestions
```
@ahk /refactor
```

**Expected Output:**
- Code analysis for improvements
- Specific refactoring suggestions
- Modern v2 idiom recommendations

#### Test 7: Best Practices Review
```
@ahk /best-practices
```

**Expected Output:**
- Naming convention checks
- Error handling review
- Resource management validation
- Code organization feedback

#### Test 8: Test Generation
```
@ahk /test
```

**Expected Output:**
- Test cases for functions
- Edge case identification
- Positive and negative tests

#### Test 9: General Query with Context
```
@ahk How can I refactor this code?
```

**Expected Output:**
- Response includes automatic workspace context
- Function metadata if available
- Dependency information if relevant

#### Test 10: Error Context
```
@ahk /fix this error
```

**Expected Output:**
- Response includes diagnostics from VS Code
- Runtime errors from output channel
- Code snippets around error locations

### 4. Verify Features

- [ ] Chat participant appears as `@ahk` in suggestions
- [ ] All slash commands work: `/convert`, `/explain`, `/fix`, `/optimize`, `/example`, `/attribute`
- [ ] `/codemap` shows current file structure
- [ ] `/dependencies` shows include tree
- [ ] `/workspace` combines both
- [ ] General queries receive automatic context
- [ ] Error messages are helpful and actionable
- [ ] Follow-up suggestions appear

### 5. Troubleshooting

If the chat participant doesn't appear:

1. **Check VS Code version**: `Help → About` (must be 1.90+)
2. **Check Copilot**: Verify GitHub Copilot extension is active
3. **Reload window**: `Developer: Reload Window` from Command Palette
4. **Check logs**: `Output → AHKv2 Toolbox` for errors
5. **Verify activation**: Open an `.ahk` file to trigger activation

### 6. Known Limitations

- Requires an active `.ahk` file for `/codemap` and `/dependencies`
- GitHub Copilot subscription required for LLM responses
- Large files may be truncated in context
- `/attribute` command requires file to be in a `Lib/` folder

## Testing Results

Document your test results here:

| Command | Status | Notes |
|---------|--------|-------|
| `/codemap` | ⬜ | |
| `/dependencies` | ⬜ | |
| `/workspace` | ⬜ | |
| `/convert` | ⬜ | |
| `/explain` | ⬜ | |
| `/fix` | ⬜ | |
| `/optimize` | ⬜ | |
| `/example` | ⬜ | |
| `/attribute` | ⬜ | |
| `/syntax` | ⬜ | |
| `/symbols` | ⬜ | |
| `/refactor` | ⬜ | |
| `/best-practices` | ⬜ | |
| `/test` | ⬜ | |
| General query | ⬜ | |
| Error context | ⬜ | |

✅ = Working | ⚠️ = Partial | ❌ = Not Working | ⬜ = Not Tested
