<div align="center"><kbd></kbd>  <kbd>🧩 VS Code Extension</kbd> <kbd>🔁 AHK v1 → v2</kbd> <kbd>📂 Open Source</kbd>  <kbd></kbd></div>
<h1 align="center">AHK Converter <sup><sup><kbd>v0.1.5</kbd></sup></sup></h1>

<div align="center">
  <strong>Convert AutoHotkey v1 scripts to v2 inside VS Code</strong>
  <br>
  <p align="center"><img src="media/AHK_Convert_mini.png" alt="AHK Converter icon" width="96"></p>
</div>
<br>

<div align="center">
  <p>
    <a href="#features"><img src="https://img.shields.io/badge/Features-blue?style=for-the-badge" alt="Features"></a>
    <a href="#installation"><img src="https://img.shields.io/badge/Install-green?style=for-the-badge" alt="Installation"></a>
    <a href="#usage"><img src="https://img.shields.io/badge/Usage-purple?style=for-the-badge" alt="Usage"></a>
    <a href="#settings"><img src="https://img.shields.io/badge/Settings-orange?style=for-the-badge" alt="Settings"></a>
  </p>
</div>

## Features

- Convert an open AHK v1 script to v2 using the community converter
- Open the result in a new tab, replace the current file, or view a diff
- Works offline

## Installation

1. Install AutoHotkey v2.
2. Install this VS Code extension (from VSIX or by opening the folder in VS Code and pressing F5 to launch the Extension Host).
3. Optional: set the configuration values below.

## Usage

1. Open a v1 `.ahk` file in VS Code.
2. Run one of the commands:
   - AHK: Convert v1 to v2 - open in new tab
   - AHK: Convert v1 to v2 - replace current file
   - AHK: Convert v1 to v2 - show diff

## Settings

- `ahkConverter.autoHotkeyV2Path`: Path to the AutoHotkey v2 executable. If empty, uses `AutoHotkey64.exe` from PATH.
- `ahkConverter.converterScriptPath`: Path to `v2converter.ahk`. Defaults to the bundled file at `${extensionPath}/vendor/v2converter.ahk`.
- `ahkConverter.strictWindowsOnly`: If true, warn on non-Windows platforms.

## Notes

- The converter writes `<input>_newV2.ahk` next to the input. The extension uses a temp folder so your files are not touched unless you choose Replace.
