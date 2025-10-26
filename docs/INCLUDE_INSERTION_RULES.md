# #Include Line Insertion Rules

## Overview

This document defines the precise rules for automatically inserting `#Include` lines into AutoHotkey v2 files when installing packages via the Dependency Manager.

## Core Principles

1. **Never sort** - Always append to the end of the include block
2. **Preserve formatting** - Maintain EOL style and column-zero alignment
3. **Prevent duplicates** - Normalize and check before inserting
4. **Smart placement** - Find appropriate anchor and maintain spacing

---

## Rule 1: Find the Directive Anchor

The anchor determines where to begin looking for or creating the include block.

**Priority order:**

1. **If `#SingleInstance` exists** → Anchor just after it
2. **Else if `#Requires AutoHotkey v2` exists** → Anchor just after it
3. **Else** → Anchor at top of file
   - If "insert headers" setting is ON, add headers first in configured order, then anchor after the last added header

**Important:** Only one anchor is used. If both directives exist, `#SingleInstance` takes precedence.

---

## Rule 2: Find the Include Block

Starting from the anchor line:

1. **Skip at most one blank line** after the anchor
2. **Collect the first contiguous run** of lines matching `^\s*#Include\b.*$` (case insensitive)
3. **Ignore pure comment lines** when determining the end of the run
4. **Stop at the first non-include code line**

**Include block definition:**
- Starts with first `#Include` line after anchor (with ≤1 blank line gap)
- Continues through consecutive `#Include` lines
- Comments within the block don't break continuity
- Ends at first non-include, non-comment line

---

## Rule 3: Append Behavior

### If an include block exists:
- **Append the new line immediately after the last `#Include`** in that block
- Do not add extra blank lines inside the block
- Maintain the existing formatting

### If no include block exists:
- **Create one:**
  1. Ensure exactly **one blank line** after the anchor
  2. Place the new `#Include` line
  3. No trailing blank line after the include

---

## Rule 4: Duplicate Prevention

**Normalization:**
- Extract the base filename from the include path
- Remove the `.ahk` extension
- Compare case-insensitively

**Examples:**
```ahk
#Include Lib/MyLib.ahk       → "MyLib"
#Include <MyLib>             → "MyLib"
#Include ../shared/MyLib.ahk → "MyLib"
```

**Action:**
- If the normalized name already exists in any `#Include` line, **no-op** (do nothing)
- Return status: "already included"

---

## Rule 5: Spacing and EOL

1. **Exactly one blank line** between directives and the include block
2. **No extra blank lines** inside the include block
3. **Preserve the file's EOL style** (CRLF on Windows, LF on Unix)
4. **Preserve column-zero alignment** (no indentation for directives/includes)

---

## Rule 6: Format

**Default format:**
```ahk
#Include Lib/{filename}.ahk
```

Where `{filename}` is the package name (e.g., `JSON`, `WinClip`, etc.)

**User template override:**
- If a user-defined template exists, use it instead
- Template variables: `{name}`, `{path}`, `{extension}`

---

## Examples

### Example A: Append to Existing Block Under Both Directives

**BEFORE:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk
#Include Lib/Strings.ahk

; Code
MsgBox("Hi")
```

**Action:** Append `Colors.ahk`

**AFTER:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk
#Include Lib/Strings.ahk
#Include Lib/Colors.ahk

; Code
MsgBox("Hi")
```

**Notes:**
- Anchor: `#SingleInstance Force` (takes precedence)
- Existing block found after 1 blank line
- New include appended to end of block

---

### Example B: Only #Requires, No Include Block Yet

**BEFORE:**
```ahk
#Requires AutoHotkey v2

; Code
MsgBox("Hello World")
```

**Action:** Append `MyLib2.ahk`

**AFTER:**
```ahk
#Requires AutoHotkey v2

#Include Lib/MyLib2.ahk

; Code
MsgBox("Hello World")
```

**Notes:**
- Anchor: `#Requires AutoHotkey v2`
- No include block exists
- Created block with exactly 1 blank line after anchor

---

### Example C: Only #SingleInstance, Create Block Then Append Later

**Step 1:** Insert `Net.ahk`

**BEFORE:**
```ahk
#SingleInstance Force

; Code
```

**AFTER:**
```ahk
#SingleInstance Force

#Include Lib/Net.ahk

; Code
```

**Step 2:** Insert `IO.ahk`

**AFTER:**
```ahk
#SingleInstance Force

#Include Lib/Net.ahk
#Include Lib/IO.ahk

; Code
```

**Notes:**
- First insert creates the block
- Second insert appends to existing block
- No extra blank lines between includes

---

### Example D: Missing Both Headers, Headers Setting ON

**Configuration:** Add `#Requires` then `#SingleInstance` (in that order)

**BEFORE:**
```ahk
; Code
MsgBox("X")
```

**Action:** Insert `Utils.ahk`

**AFTER:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Utils.ahk

; Code
MsgBox("X")
```

**Notes:**
- Both headers added in configured order
- Anchor becomes last added header (`#SingleInstance Force`)
- Include block created with 1 blank line gap

---

### Example E: Duplicate Attempt

**BEFORE:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Strings.ahk

; Code
```

**Action:** Insert `Strings.ahk` again

**AFTER:** *(No change)*
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Strings.ahk

; Code
```

**Result:** Return status "already included" - no modification made

**Notes:**
- Normalized name "Strings" matches existing include
- File remains unchanged
- User notification: "Strings is already included"

---

## Implementation Checklist

When implementing this feature, ensure:

- [ ] Regex pattern for `#Include` is case-insensitive
- [ ] Only one blank line is inserted/maintained between anchor and includes
- [ ] No blank lines inserted within the include block
- [ ] Duplicate check uses normalized filename (base name, no extension)
- [ ] Original file EOL style is preserved
- [ ] No indentation added to directive/include lines
- [ ] Pure comment lines don't break include block continuity
- [ ] Headers are added in configured order if "insert headers" is enabled
- [ ] Always append to end (never sort)
- [ ] Return clear status (success, already included, error)

---

## Edge Cases

### Empty File
- Add headers (if configured)
- Add include block
- No code afterward is fine

### File Starts with Comment Block
```ahk
; This is my script
; Author: Me

#Requires AutoHotkey v2
```
- Headers/includes go before comments? **No.**
- Comments are preserved at top
- Directives/includes inserted after directive anchor

### Multiple #Requires or #SingleInstance
- Use the **first occurrence** as anchor
- Ignore subsequent duplicates

### Include with Inline Comment
```ahk
#Include Lib/Utils.ahk  ; Utility functions
```
- Treat as valid include line
- Preserve inline comment when checking for duplicates

### Unusual Whitespace
```ahk
#SingleInstance    Force

  #Include Lib/Foo.ahk
```
- Normalize when inserting new lines (no leading/trailing spaces)
- Don't modify existing include formatting

---

## Configuration Options (Future)

Potential user settings:

- **includeFormat**: Template string (default: `Lib/{name}.ahk`)
- **insertHeaders**: Boolean (default: false)
- **headerOrder**: Array (default: `["#Requires AutoHotkey v2.1", "#SingleInstance Force"]`)
- **preventDuplicates**: Boolean (default: true)
- **appendLocation**: "end" | "alphabetical" (default: "end")

---

## Status Return Values

The insert function should return one of:

- `"inserted"` - Successfully added new include
- `"already_included"` - Duplicate detected, no change made
- `"headers_added"` - Headers were added before include
- `"error"` - Failed to parse or modify file

---

## Testing Scenarios

Test with:
1. Empty file
2. File with only `#Requires`
3. File with only `#SingleInstance`
4. File with both directives
5. File with existing includes
6. File with comments before code
7. File with inline comments on includes
8. File with unusual spacing/formatting
9. Duplicate insertion attempts
10. Files with CRLF vs LF line endings

---

**Last Updated:** 2025-10-25
**Related Feature:** Dependency Manager Auto-Add #Include
