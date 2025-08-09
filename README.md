# AHK v1 to v2 Converter

Convert AutoHotkey v1 scripts to v2 inside VS Code. Works offline.

![AHK Converter](media/AHK_Convert.png)

## What this does

* Reads the open editor text and writes a temp file.
* Runs the community converter script using AutoHotkey v2.
* Loads the generated output file and shows it to you.

## Commands

* AHK: Convert v1 to v2 - open in new tab
* AHK: Convert v1 to v2 - replace current file
* AHK: Convert v1 to v2 - show diff

## Settings

* `ahkConverter.autoHotkeyV2Path` path to AutoHotkey v2 exe. Leave empty to use AutoHotkey64.exe on PATH.
* `ahkConverter.converterScriptPath` path to v2converter.ahk. Defaults to the bundled vendor file.
* `ahkConverter.strictWindowsOnly` warn if not on Windows.

## Requirements

* Windows and AutoHotkey v2 installed or set a full path.
* The real converter script file. Replace `vendor/v2converter.ahk` with the official version or point the setting to it.

## Related projects and examples

* CloudAHK code runner repo: [https://github.com/G33kDude/CloudAHK](https://github.com/G33kDude/CloudAHK)
* AHK v1 to v2 converter repo: [https://github.com/mmikeww/AHK-v2-script-converter](https://github.com/mmikeww/AHK-v2-script-converter)
* Converter example on the wiki: [https://autohotkey.wiki/guides%3Av1_v2_cheat_sheet](https://autohotkey.wiki/guides%3Av1_v2_cheat_sheet)
* Geek’s wiki page: [https://autohotkey.wiki/user%3Ageek](https://autohotkey.wiki/user%3Ageek)

## Notes

* The converter writes `<input>_newV2.ahk` next to the input. The extension uses a temp folder so your files are not touched unless you choose Replace.



