# VisualDiff Utility - v1 to v2 Conversion Notes

## Status: NEEDS COMPLETE REWRITE

The VisualDiff utility requires extensive conversion from AutoHotkey v1 to v2 syntax. While some fixes have been applied, the remaining issues are substantial enough to warrant a complete rewrite.

## Issues Fixed
- ✅ Return statement syntax (line 330 in VisualDiff_v1.ahk)
- ✅ FileObject.ahk parameter defaults (`Advanced=0` → `Advanced:=0`)
- ✅ API.ahk parameter defaults (mass replacement of `="` → `:="`)
- ✅ SplitPath command syntax conversion
- ✅ StringLower command conversion

## Remaining Issues in API.ahk

### Critical v1 Commands Requiring Conversion
1. **Loop Commands** (lines 704, 711, 720, 1611)
   ```ahk
   ; v1 syntax:
   Loop, %Param1%, %Param2%
   
   ; v2 needed:
   Loop Param1, Param2
   ```

2. **MsgBox Commands** (line 813)
   ```ahk
   ; v1 syntax:
   MsgBox, %Param1%
   
   ; v2 needed:
   MsgBox(Param1)
   ```

3. **Random Commands** (line 926)
   ```ahk
   ; v1 syntax:
   Random,,%NewSeed%
   
   ; v2 needed:
   Random(,NewSeed)
   ```

4. **FileRead Commands** (line 1042)
   ```ahk
   ; v1 syntax:
   FileRead, content, %path%
   
   ; v2 needed:
   content := FileRead(path)
   ```

### Function Implementation Issues
- Many functions use v1 command syntax internally
- Parameter handling uses legacy patterns
- Variable dereferencing with `%` needs removal
- Output variable patterns need conversion to return values

## Recommended Approach

### Option 1: Complete Rewrite (Recommended)
Rewrite the entire API.ahk file using AutoHotkey v2 patterns:
- Convert all v1 commands to v2 functions
- Implement proper return value handling
- Use modern object-oriented patterns
- Remove legacy variable dereferencing

### Option 2: Incremental Conversion
Continue fixing individual commands, but this will be time-intensive given the scale.

## Files Affected
- `VisualDiff_v1.ahk` - Main file (partially converted)
- `lib/Exo/API.ahk` - Core API wrapper (extensive v1 syntax)
- `lib/Exo/FileObject.ahk` - Fixed parameter defaults

## Impact on Main Application
This utility is **NOT CRITICAL** to the main AutoGUI functionality. The core application works without it.

## Next Steps
1. Decide whether to fully convert or mark as deprecated
2. If converting, allocate significant time for complete rewrite
3. Consider creating a v2-native visual diff utility instead