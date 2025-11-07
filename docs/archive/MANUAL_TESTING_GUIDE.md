# Manual Testing Guide - Auto-Add #Include Feature

## Prerequisites

1. Install the extension:
   ```bash
   code --install-extension ahkv2-toolbox-0.4.3.vsix
   ```

2. Have test AHK files ready:
   - `test-include-insertion.ahk` (with headers)
   - `test-include-no-headers.ahk` (without headers)
   - `test-include-existing.ahk` (with existing includes)

## Test Scenarios

### Test 1: Basic Include Insertion (With Headers)

**Setup:**
1. Open `test-include-insertion.ahk` in VS Code
2. Ensure file contains:
   ```ahk
   #Requires AutoHotkey v2.1
   #SingleInstance Force

   MsgBox("Test script loaded")
   ```

**Steps:**
1. Open AHKv2 Toolbox sidebar
2. Navigate to Dependency Manager
3. Find any package in "Available Libraries"
4. Click install button
5. When notification appears, click "Add #Include"

**Expected Result:**
- Include line inserted after `#SingleInstance Force`
- Exactly one blank line before include
- Format: `#Include Lib/PackageName.ahk`
- Success message shows line number
- File is automatically saved

**Verification:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/PackageName.ahk

MsgBox("Test script loaded")
```

---

### Test 2: No Headers - Auto-Insert Headers

**Setup:**
1. Open `test-include-no-headers.ahk`
2. Set configuration:
   ```json
   {
     "ahkv2Toolbox.autoInsertHeaders": true
   }
   ```

**Steps:**
1. Install a package
2. Click "Add #Include"

**Expected Result:**
- Headers added in order: #Requires, then #SingleInstance
- Include line added after headers
- Success message: "Added headers and #Include for PackageName"

**Verification:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/PackageName.ahk

; Test script without headers
MsgBox("Test script without headers")
```

---

### Test 3: Append to Existing Includes

**Setup:**
1. Open `test-include-existing.ahk`
2. Verify it has existing includes

**Steps:**
1. Install a package (e.g., "JSON")
2. Click "Add #Include"

**Expected Result:**
- New include appended to end of block
- No blank lines within include block
- Order preserved (never sorted)

**Verification:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk
#Include Lib/Strings.ahk
#Include Lib/JSON.ahk      ← New

; Test script with existing includes
MsgBox("Test script with existing includes")
```

---

### Test 4: Duplicate Detection

**Setup:**
1. Open file with `#Include Lib/Arrays.ahk`

**Steps:**
1. Try to install "Arrays" package again
2. Click "Add #Include"

**Expected Result:**
- Message: "Arrays is already included in this file (line X)"
- No duplicate include added
- File unchanged

---

### Test 5: No Active File - File Picker

**Setup:**
1. Close all AHK files
2. Have multiple AHK files in workspace

**Steps:**
1. Install a package
2. Click "Add #Include"

**Expected Result:**
- Quick Pick menu appears
- Shows all workspace .ahk files
- Excludes Lib/ and vendor/ folders
- Shows relative paths
- After selection, include is inserted

---

### Test 6: Custom Include Format

**Setup:**
1. Set configuration:
   ```json
   {
     "ahkv2Toolbox.includeFormat": "vendor/{name}.ahk"
   }
   ```

**Steps:**
1. Install a package
2. Click "Add #Include"

**Expected Result:**
- Include uses vendor format: `#Include vendor/PackageName.ahk`

---

### Test 7: Different Path Formats (Duplicate Detection)

**Setup:**
1. Create file with: `#Include <MyLib>`

**Steps:**
1. Try to install "MyLib" with default format
2. Click "Add #Include"

**Expected Result:**
- Duplicate detected despite different format
- Message shows existing include line number

---

### Test 8: CRLF/LF Preservation

**Setup (Windows):**
1. Create file with CRLF line endings
2. Verify with: File → Preferences → Settings → End of Line

**Steps:**
1. Install package and add include

**Expected Result:**
- Line endings remain CRLF
- No LF mixed in

**Setup (Unix/Mac):**
1. Create file with LF line endings

**Steps:**
1. Install package and add include

**Expected Result:**
- Line endings remain LF
- No CRLF mixed in

---

### Test 9: Comments in Include Block

**Setup:**
1. Create file:
   ```ahk
   #SingleInstance Force

   #Include Lib/Net.ahk
   ; Important library
   #Include Lib/IO.ahk

   ; Code
   ```

**Steps:**
1. Install "Utils" package
2. Click "Add #Include"

**Expected Result:**
- Include added after IO.ahk
- Comment preserved
- Include block continuity maintained

---

### Test 10: Multiple Test Files

**Steps:**
1. Create 3 .ahk files in workspace
2. Install package with no active file
3. Select each file from picker
4. Verify include inserted correctly in each

---

## Configuration Testing

### Test Default Settings

**Verify defaults:**
```json
{
  "ahkv2Toolbox.includeFormat": "Lib/{name}.ahk",
  "ahkv2Toolbox.autoInsertHeaders": false,
  "ahkv2Toolbox.headerOrder": [
    "#Requires AutoHotkey v2.1",
    "#SingleInstance Force"
  ],
  "ahkv2Toolbox.defaultRequires": "AutoHotkey v2.1",
  "ahkv2Toolbox.defaultSingleInstance": "Force"
}
```

### Test Custom Settings

**Change each setting:**
1. `includeFormat`: `"<{name}>"`
2. `autoInsertHeaders`: `true`
3. `headerOrder`: Reverse order
4. `defaultSingleInstance`: `"Ignore"`

**Verify behavior changes accordingly**

---

## Edge Cases

### Test Empty File
1. Create completely empty .ahk file
2. Install package with `autoInsertHeaders: false`
3. Verify include added at top

### Test Only Comments
1. Create file with only comment lines
2. Install package
3. Verify headers/includes go after comments

### Test Multiple #Requires
1. Create file with multiple #Requires lines
2. Install package
3. Verify uses first #Requires as anchor

---

## Error Handling

### Test Invalid File
1. Try to add include to non-.ahk file
2. Verify appropriate error message

### Test Read-Only File
1. Make file read-only
2. Try to add include
3. Verify error message

---

## Performance Testing

### Test Large File
1. Create file with 1000+ lines
2. Install package and add include
3. Verify operation completes quickly (<1 second)

### Test Many Includes
1. Create file with 50 existing includes
2. Add one more
3. Verify appends correctly

---

## Checklist

- [ ] Test 1: Basic insertion with headers
- [ ] Test 2: Auto-insert headers
- [ ] Test 3: Append to existing
- [ ] Test 4: Duplicate detection
- [ ] Test 5: File picker
- [ ] Test 6: Custom format
- [ ] Test 7: Different path formats
- [ ] Test 8: CRLF/LF preservation
- [ ] Test 9: Comments in block
- [ ] Test 10: Multiple files
- [ ] Configuration: Default settings
- [ ] Configuration: Custom settings
- [ ] Edge case: Empty file
- [ ] Edge case: Only comments
- [ ] Edge case: Multiple #Requires
- [ ] Error: Invalid file
- [ ] Error: Read-only file
- [ ] Performance: Large file
- [ ] Performance: Many includes

---

**Testing Completed:** _______
**Issues Found:** _______
**Status:** _______
