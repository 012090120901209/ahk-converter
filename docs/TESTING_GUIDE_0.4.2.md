# Testing Guide - AHKv2 Toolbox v0.4.2

This guide provides step-by-step instructions for testing all new features in version 0.4.2.

---

## Prerequisites

1. **VS Code** with AHKv2 Toolbox extension installed
2. **Workspace** opened (not just individual files)
3. **AutoHotkey v2** installed (for conversion features)

---

## Test Suite 1: AutoHotkey Dependency Explorer

### Test 1.1: Basic Dependency Detection

**Setup:**
1. Open workspace: `test/dependency-test/`
2. Ensure all test files are present (main.ahk, config.ahk, etc.)

**Steps:**
1. Click **AHKv2 Toolbox** icon in Activity Bar
2. Navigate to **"Dependencies"** view
3. Verify dependency tree appears

**Expected Result:**
```
📄 main.ahk (4)
  📄 utils\helpers.ahk
  📄 config.ahk (1)
    📄 Lib\Validator.ahk
  📄 Lib\Logger.ahk
  📄 modules\app-logic.ahk (1)
    📄 utils\helpers.ahk
```

**✅ Pass Criteria:**
- Tree structure matches expected layout
- All files are detected
- Dependency counts are correct
- No error badges appear

---

### Test 1.2: Interactive File Opening

**Steps:**
1. Click on **`config.ahk`** in the dependency tree
2. Verify file opens in editor
3. Click on **`Lib\Logger.ahk`**
4. Verify library file opens

**✅ Pass Criteria:**
- Clicking opens correct file
- Cursor positioned at start of file
- No error messages

---

### Test 1.3: Collapsible Nodes

**Steps:**
1. Click the **▼** arrow next to `main.ahk`
2. Verify dependencies collapse
3. Click again to expand

**✅ Pass Criteria:**
- Arrow rotates to ▶ when collapsed
- Nested items hide/show correctly
- No UI glitches

---

### Test 1.4: Real-Time Updates

**Steps:**
1. Open `test/dependency-test/main.ahk`
2. Add new include: `#Include new-file.ahk`
3. Save file
4. Observe dependency tree

**Expected Result:**
- New entry appears: `📄 new-file.ahk ! (File not found)`
- Error badge (!) is visible
- Hover shows error tooltip

**Steps (cont'd):**
5. Create file: `test/dependency-test/new-file.ahk`
6. Add content: `; New file`
7. Save file
8. Observe dependency tree

**Expected Result:**
- Error badge disappears
- File now shown as normal node

**✅ Pass Criteria:**
- Updates happen automatically within 1-2 seconds
- Error states reflect actual file system
- No manual refresh needed

---

### Test 1.5: Manual Refresh

**Steps:**
1. Click **⟳** refresh button in Dependencies view
2. Observe loading/update behavior

**✅ Pass Criteria:**
- Tree refreshes successfully
- No errors in console
- Visual feedback during refresh

---

### Test 1.6: Library Include Resolution

**Steps:**
1. Verify `Lib\Logger.ahk` appears under main.ahk
2. Verify `Lib\Validator.ahk` appears under config.ahk

**✅ Pass Criteria:**
- Library files detected from `<LibraryName>` syntax
- Paths correctly resolved to `Lib\` folder

---

### Test 1.7: Variable Path Resolution

**Steps:**
1. Open `test/dependency-test/main.ahk`
2. Find line with `#Include %A_ScriptDir%\modules\app-logic.ahk`
3. Verify `modules\app-logic.ahk` appears in tree

**✅ Pass Criteria:**
- `A_ScriptDir` correctly substituted
- Relative path from main.ahk resolved
- File located successfully

---

### Test 1.8: Unresolved Dependencies

**Steps:**
1. Open any `.ahk` file
2. Add: `#Include NonExistent.ahk`
3. Save file
4. Check dependency tree

**Expected Result:**
- Red text for unresolved file
- `!` badge visible
- Hover shows: "File not found"

**✅ Pass Criteria:**
- Error visual indicators present
- Tooltip provides useful info
- No crash or exception

---

## Test Suite 2: Enhanced Function Metadata Extraction

### Test 2.1: Default Value Type Detection

**Setup:**
1. Open `test/enhanced-metadata.test.ahk`

**Steps:**
1. Position cursor in `TargetFunction`
2. Run command: `AHK: Extract Function Metadata`
3. Review output in Output panel

**Expected Output:**
```json
{
  "parameters": [
    {
      "name": "p1",
      "defaultType": 0,  // None
      "hasDefault": false
    },
    {
      "name": "p2",
      "defaultType": 1,  // Constant
      "defaultValue": "\"default\"",
      "hasDefault": true
    },
    {
      "name": "p4",
      "defaultType": 2,  // Expression
      "defaultValue": "Random(1, 6)",
      "hasDefault": true
    }
  ]
}
```

**✅ Pass Criteria:**
- Constants identified correctly (type: 1)
- Expressions identified correctly (type: 2)
- Default values captured accurately

---

### Test 2.2: Assignment Chain Detection

**Steps:**
1. Check `TargetFunction` metadata
2. Look for local variables section

**Expected Output:**
```json
{
  "localVariables": [
    { "name": "d", "initializerValue": "0" },
    { "name": "e", "initializerValue": "0" },
    { "name": "f", "initializerValue": "0" }
  ]
}
```

**✅ Pass Criteria:**
- All three variables (d, e, f) detected
- All marked as local scope
- Initializer value shown as "0"

---

### Test 2.3: Static Variable Detection

**Steps:**
1. Check `TargetFunction` metadata
2. Look for static variables section

**Expected Output:**
```json
{
  "staticVariables": [
    { "name": "a", "hasInitializer": false },
    { "name": "b", "hasInitializer": true, "initializerValue": "10" },
    { "name": "c", "hasInitializer": true, "initializerValue": "\"initialized\"" }
  ]
}
```

**✅ Pass Criteria:**
- All statics detected from one declaration line
- Initializer status correct
- Initializer values captured

---

### Test 2.4: Optional Parameter Detection

**Steps:**
1. Position cursor in `TargetFunction`
2. Check parameter `p5?`

**Expected Output:**
```json
{
  "name": "p5",
  "isOptional": true,
  "hasDefault": false
}
```

**✅ Pass Criteria:**
- Optional flag set to true
- Question mark syntax recognized

---

### Test 2.5: Type Hint Parsing

**Setup:**
1. Position cursor in `TypedFunction`

**Expected Output:**
```json
{
  "parameters": [
    { "name": "name", "typeHint": "String" },
    { "name": "count", "typeHint": "Integer" }
  ]
}
```

**✅ Pass Criteria:**
- Type hints captured
- Both `:` and `as` syntax supported

---

### Test 2.6: Variadic Parameter Detection

**Setup:**
1. Position cursor in `TargetFunction`

**Expected Output:**
```json
{
  "isVariadic": true,
  "maxParams": "variadic",
  "parameters": [
    // ... other params
    { "name": "*", "position": 5 }
  ]
}
```

**✅ Pass Criteria:**
- Variadic flag set
- maxParams shows "variadic"
- Asterisk parameter detected

---

## Test Suite 3: Profile Management

### Test 3.1: Profile Editor Access

**Steps:**
1. Open Command Palette (Ctrl+Shift+P)
2. Run: `AHK: Manage Conversion Profiles`
3. Select: `Edit Existing Profile`
4. Choose any custom profile (or create one first)

**Expected Result:**
- Profile editor menu appears with options:
  - Edit Name & Description
  - Manage Rules
  - Selective Conversion
  - Performance Settings
  - Validation Settings
  - Save & Exit
  - Cancel

**✅ Pass Criteria:**
- Menu displays correctly
- All options selectable
- Icons display properly

---

### Test 3.2: Predefined Profile Protection

**Steps:**
1. Try to edit `conservative` profile
2. Observe warning message

**Expected Result:**
- Warning: "Cannot edit predefined profile"
- Offered: "Create Copy" option
- Cancel option available

**Steps (cont'd):**
3. Choose "Create Copy"
4. Enter name: "my-conservative"
5. Verify copy created

**✅ Pass Criteria:**
- Warning appears for predefined profiles
- Copy creation works
- New profile is editable

---

### Test 3.3: Edit Name & Description

**Steps:**
1. In profile editor, select `Edit Name & Description`
2. Choose `Edit Name`
3. Enter new name: "test-profile"
4. Verify name updated
5. Choose `Edit Description`
6. Enter: "Test profile for validation"
7. Verify description updated

**✅ Pass Criteria:**
- Name changes reflected immediately
- Duplicate name validation works
- Description updates saved

---

### Test 3.4: Manage Rules

**Steps:**
1. Select `Manage Rules`
2. View list of existing rules
3. Select a rule to edit
4. Toggle it disabled
5. Verify icon changes to ⊘

**Steps (Add New Rule):**
6. Select `Add New Rule`
7. Enter ID: "test-rule"
8. Enter name: "Test Rule"
9. Enter description: "Testing rule management"
10. Select category: "syntax"
11. Enter priority: 50
12. Verify rule appears in list

**✅ Pass Criteria:**
- All fields validated
- Rule added successfully
- List updates in real-time

---

### Test 3.5: Edit Rule Details

**Steps:**
1. Select an existing rule
2. Choose `Edit Priority`
3. Enter: 75
4. Verify priority updated
5. Choose `Edit Pattern`
6. Enter regex: `test.*pattern`
7. Choose `Edit Replacement`
8. Enter: `replacement`
9. Verify changes saved

**✅ Pass Criteria:**
- All edits applied
- Validation prevents invalid input
- Changes persist

---

### Test 3.6: Selective Conversion

**Steps:**
1. Select `Selective Conversion`
2. Toggle `Selective Conversion: Enabled`
3. Toggle individual constructs (Functions, Variables, etc.)
4. Observe checkmarks (✓) and slashes (⊘)
5. Select `Manage Include Patterns`
6. Add pattern: `.*@keep.*`
7. Verify pattern appears
8. Remove pattern
9. Verify pattern removed

**✅ Pass Criteria:**
- Toggle states save correctly
- Pattern regex validated
- Add/remove operations work

---

### Test 3.7: Performance Settings

**Steps:**
1. Select `Performance Settings`
2. Toggle `Streaming: Enabled`
3. Select `Chunk Size`
4. Enter: 1000
5. Select `Max Memory`
6. Enter: 200
7. Verify all changes

**✅ Pass Criteria:**
- Numeric validation (ranges enforced)
- Values update correctly
- Toggles work

---

### Test 3.8: Validation Settings

**Steps:**
1. Select `Validation Settings`
2. Select `Validation Level`
3. Choose: `strict`
4. Toggle syntax/semantic/performance checks
5. Select `Custom Rules`
6. Add new validation rule:
   - ID: "no-goto"
   - Name: "No Goto Statements"
   - Pattern: `\\bGoto\\b`
   - Severity: "warning"
   - Message: "Avoid using Goto"
7. Verify rule added

**✅ Pass Criteria:**
- Level selection works
- Toggles functional
- Custom rule validated and saved

---

### Test 3.9: Save & Exit

**Steps:**
1. Make several changes to a profile
2. Select `Save & Exit`
3. Verify notification: "Saved profile: [name]"
4. Re-open profile editor
5. Verify all changes persisted

**✅ Pass Criteria:**
- Save notification appears
- Changes persist after close
- Profile file updated

---

### Test 3.10: Cancel Without Saving

**Steps:**
1. Open profile editor
2. Make changes
3. Select `Cancel`
4. Re-open profile editor
5. Verify changes NOT saved

**✅ Pass Criteria:**
- Cancel discards changes
- No unwanted persistence
- Original values retained

---

## Regression Testing

### Test R.1: Existing Features Still Work

**Code Map:**
- ✅ Refresh works
- ✅ Jump to definition works
- ✅ Filters work (classes, functions, variables)

**Conversion:**
- ✅ Convert v1 to v2 - new tab works
- ✅ Convert v1 to v2 - replace works
- ✅ Enhanced diff works
- ✅ Batch conversion works

**Other:**
- ✅ Function metadata extraction works
- ✅ Toolbox webview displays
- ✅ Settings apply correctly

---

## Performance Testing

### Test P.1: Large Workspace Performance

**Setup:**
1. Create workspace with 100+ `.ahk` files
2. Include complex dependency chains

**Metrics to Check:**
- Initial scan time: < 5 seconds
- Refresh time: < 2 seconds
- UI responsiveness: No freezing
- Memory usage: Stable (no leaks)

**✅ Pass Criteria:**
- Fast initial load
- Smooth interactions
- No performance degradation over time

---

### Test P.2: File Watcher Performance

**Steps:**
1. Make rapid changes to multiple files
2. Observe update behavior

**✅ Pass Criteria:**
- Updates debounced (not excessive)
- No duplicate refreshes
- System remains responsive

---

## Error Handling Testing

### Test E.1: Missing Workspace

**Steps:**
1. Open single file (not workspace)
2. Check Dependency Explorer

**Expected:**
- Empty state message
- No errors in console
- Graceful handling

---

### Test E.2: Corrupted File

**Steps:**
1. Create binary file with `.ahk` extension
2. Include it in another script
3. Observe dependency tree

**Expected:**
- Error indicator shown
- No crash
- Meaningful error message

---

### Test E.3: Permission Denied

**Steps:**
1. Create read-only `.ahk` file
2. Include it in script
3. Observe behavior

**Expected:**
- File detected
- Dependency shown
- No write errors (read-only is fine)

---

## Accessibility Testing

### Test A.1: Keyboard Navigation

**Steps:**
1. Navigate dependency tree with keyboard only
2. Open files with Enter key
3. Collapse/expand with arrow keys

**✅ Pass Criteria:**
- Full keyboard access
- Logical tab order
- Clear focus indicators

---

## Documentation Verification

### Test D.1: Documentation Accuracy

**Steps:**
1. Follow examples in `docs/DEPENDENCY_EXPLORER.md`
2. Verify all examples work as described
3. Check `docs/FUNCTION_METADATA_EXTRACTION.md`
4. Verify metadata examples accurate

**✅ Pass Criteria:**
- All examples functional
- No outdated information
- Screenshots/diagrams accurate

---

## Clean Installation Test

### Test CI.1: Fresh Install

**Steps:**
1. Uninstall extension
2. Delete extension data directory
3. Reinstall extension
4. Test all features

**✅ Pass Criteria:**
- Clean install works
- No dependency on old data
- All features functional

---

## Test Summary Checklist

Use this checklist to track testing progress:

**Dependency Explorer:**
- [ ] Test 1.1: Basic detection
- [ ] Test 1.2: File opening
- [ ] Test 1.3: Collapsible nodes
- [ ] Test 1.4: Real-time updates
- [ ] Test 1.5: Manual refresh
- [ ] Test 1.6: Library resolution
- [ ] Test 1.7: Variable paths
- [ ] Test 1.8: Unresolved deps

**Function Metadata:**
- [ ] Test 2.1: Default value types
- [ ] Test 2.2: Assignment chains
- [ ] Test 2.3: Static variables
- [ ] Test 2.4: Optional parameters
- [ ] Test 2.5: Type hints
- [ ] Test 2.6: Variadic parameters

**Profile Management:**
- [ ] Test 3.1: Editor access
- [ ] Test 3.2: Protection
- [ ] Test 3.3: Name/description
- [ ] Test 3.4: Manage rules
- [ ] Test 3.5: Edit rule details
- [ ] Test 3.6: Selective conversion
- [ ] Test 3.7: Performance settings
- [ ] Test 3.8: Validation settings
- [ ] Test 3.9: Save & exit
- [ ] Test 3.10: Cancel

**Regression:**
- [ ] Test R.1: Existing features

**Performance:**
- [ ] Test P.1: Large workspace
- [ ] Test P.2: File watcher

**Error Handling:**
- [ ] Test E.1: Missing workspace
- [ ] Test E.2: Corrupted file
- [ ] Test E.3: Permission denied

**Accessibility:**
- [ ] Test A.1: Keyboard navigation

**Documentation:**
- [ ] Test D.1: Accuracy

**Installation:**
- [ ] Test CI.1: Fresh install

---

## Reporting Issues

If any test fails, report with:
1. Test number (e.g., "Test 1.4 failed")
2. Expected vs actual result
3. Steps to reproduce
4. VS Code version
5. Extension version
6. Console error messages (if any)

---

## Success Criteria

All tests must pass for release approval:
- ✅ All feature tests pass
- ✅ No regressions detected
- ✅ Performance acceptable
- ✅ Error handling graceful
- ✅ Documentation accurate

---

**Testing Complete: [ ] Yes [ ] No**

**Tested By: _________________**

**Date: _________________**
