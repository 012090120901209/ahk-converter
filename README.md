<div align="center"><kbd></kbd><kbd>🧩 VS Code Extension</kbd> <kbd>🔁 AHK v1 → v2</kbd> <kbd>📂 Open Source</kbd><kbd></kbd></div>
<h1 align="center">AHKv2 Toolbox <sup><sup><kbd>v0.4.2</kbd></sup></sup></h1>

<div align="center">
    <strong>Comprehensive AutoHotkey v2 development toolbox with v1→v2 conversion, function metadata, and productivity tools inside VS Code</strong>
  <img src="src/AHK_Code.svg" alt="AHKv2 Toolbox icon">
</div>
<div align="center">
  <p>
    <a href="#features"><img src="https://img.shields.io/badge/Features-blue?style=for-the-badge" alt="Features"></a>
    <a href="#installation"><img src="https://img.shields.io/badge/Install-green?style=for-the-badge" alt="Installation"></a>
    <a href="#usage"><img src="https://img.shields.io/badge/Usage-purple?style=for-the-badge" alt="Usage"></a>
    <a href="#settings"><img src="https://img.shields.io/badge/Settings-orange?style=for-the-badge" alt="Settings"></a>
    <a href="#troubleshooting"><img src="https://img.shields.io/badge/Troubleshooting-red?style=for-the-badge" alt="Troubleshooting"></a>
  </p>
</div>

## Features

### Language Support
- **Integrated LSP Parsing** - Uses thqby's AutoHotkey v2 LSP extension for accurate parsing
- **Code Map Explorer** - Enhanced tree view with advanced features:
  - Shows all functions, classes, methods, and variables with proper static detection
  - Diagnostic integration: displays errors/warnings from Problems panel with badges
  - Color-coded icons (red for errors, yellow for warnings)
  - Enhanced tooltips showing diagnostic messages
  - Golden/orange color scheme for better function visibility
- **Enhanced Function Metadata Extraction** - Advanced introspection system:
  - **Parameter Analysis**: Detects byref (`&`), optional (`?`), variadic (`*`), and type hints
  - **Default Value Classification**: Distinguishes constants from expressions (e.g., `Random(1, 6)`)
  - **Variable Detection**: Captures static/local/global variables, assignment chains
  - **Type Hints Support**: Parses AHK v2.1+ type annotations for parameters and return values
  - See [Function Metadata Guide](docs/FUNCTION_METADATA_EXTRACTION.md) for details
- **Smart Code Navigation** - Jump to definition, hover information, and symbol outline
- **Fallback Parser** - Works without LSP using built-in regex parser

### Core Conversion Features
- **Convert AHK v1 to v2** using the community converter and AutoHotkey v2
- **Multiple output options**: open in new tab, replace current file, or show enhanced diff
- **Batch processing**: convert multiple files at once with progress tracking
- **Enhanced diff view**: side-by-side comparison with color-coded changes
- **Works offline** once AutoHotkey v2 is installed

### User Experience Enhancements
- **Enhanced error messages** with actionable recovery suggestions
- **"Learn More" links** to documentation for common errors
- **Visual indicators** with different message types (info, warning, error)
- **Conversion statistics** showing lines processed, warnings, errors, and timing
- **Progress indicators** for long-running operations
- **Context menu integration** for quick access
- **Keyboard shortcuts** for power users

### Advanced Features
- **Input validation** with detailed warnings and error reporting
- **Conversion validation** to ensure output quality
- **Configurable validation levels** (strict, normal, lenient)
- **Customizable diff view options**
- **Batch output directory management**
- **Auto-save options** for converted files

## Installation

1. **Install AutoHotkey v2** from [autohotkey.com](https://www.autohotkey.com/)
2. **Install the AutoHotkey v2 LSP extension** (recommended):
   - Search for "AutoHotkey v2 Language Support" by thqby
   - This provides accurate parsing, IntelliSense, and syntax highlighting
   - AHKv2 Toolbox will automatically detect and use it
3. **Install this VS Code extension**:
   - From VS Code Marketplace: Search for "AHKv2 Toolbox"
   - From VSIX: Download and install the .vsix file
   - From source: Open this folder in VS Code and press F5 to launch the Extension Host
4. **Configure settings** (optional) - see Settings section below

**Note:** The extension will work without the LSP extension, but with limited parsing capabilities.

## Usage

### Single File Conversion

1. Open a v1 `.ahk` file in VS Code
2. Use one of the following methods:

**Command Palette** (Ctrl+Shift+P / Cmd+Shift+P):
- `AHK: Convert v1 to v2 - open in new tab`
- `AHK: Convert v1 to v2 - replace current file`
- `AHK: Convert v1 to v2 - show enhanced diff`

**Context Menu** (right-click on .ahk file):
- Convert v1 to v2 - open in new tab
- Convert v1 to v2 - replace current file
- Convert v1 to v2 - show enhanced diff

**Keyboard Shortcuts**:
- `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac): Convert to new tab
- `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac): Show diff

### Batch Conversion

1. **From Command Palette**: Run `AHK: Convert multiple files (batch)`
2. **From Explorer**: Select multiple .ahk files, right-click, choose batch conversion
3. **Select files** in the file picker dialog
4. **Monitor progress** with the progress indicator
5. **Review results** and choose save options:
   - Save All (including failed conversions with error logs)
   - Save Successful Only
   - Cancel (don't save)

### Enhanced Diff View

The enhanced diff view provides:
- **Side-by-side comparison** of original vs converted code
- **Color-coded changes** for easy identification
- **Line numbers** for reference
- **Context lines** around changes
- **Accept/Reject options** for individual changes
- **Action buttons** for accepting all or selected changes

### Profile Management

The extension includes a comprehensive profile management system for customizing conversion behavior:

**Built-in Profiles:**
- **Conservative**: Minimal changes, preserves most v1 syntax
- **Aggressive**: Maximizes v2 syntax adoption
- **Custom**: Fully customizable base profile

**Managing Profiles:**
1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Run: `AHK: Manage Conversion Profiles`
3. Choose from:
   - **Create New Profile**: Build custom profile from a base
   - **Edit Existing Profile**: Modify profile settings
   - **Delete Profile**: Remove custom profiles
   - **Import Profile**: Load profile from JSON file
   - **Export Profile**: Save profile to JSON file

**Profile Editor Features:**
- **Name & Description**: Rename and document your profiles
- **Manage Rules**: Add, edit, enable/disable conversion rules
  - Configure rule priority, patterns, and replacements
  - Organize by category (syntax, functions, variables, commands, directives)
- **Selective Conversion**: Choose which constructs to convert
  - Toggle individual construct types (functions, variables, commands, etc.)
  - Manage include/exclude patterns with regex
- **Performance Settings**: Tune for large files
  - Enable/disable streaming processing
  - Adjust chunk size (100-5000 lines)
  - Set memory limits (50-1000 MB)
  - Control progress tracking and cancellation
- **Validation Settings**: Configure quality checks
  - Set validation level (strict, normal, lenient)
  - Enable/disable syntax, semantic, and performance checks
  - Add custom validation rules with patterns and severity levels

**Note**: Predefined profiles (conservative, aggressive, custom) cannot be edited directly. The editor will offer to create an editable copy instead.

### Error Handling

When errors occur, you'll see:
- **User-friendly error messages** explaining what went wrong
- **Recovery suggestions** with actionable steps
- **"Learn More" links** to relevant documentation
- **"Show Details" option** to view technical information in output channel

## Settings

### Core Settings

- `ahkConverter.autoHotkeyV2Path`: Path to AutoHotkey v2 executable. If empty, uses `AutoHotkey64.exe` from PATH.
- `ahkConverter.converterScriptPath`: Path to `v2converter.ahk`. Defaults to the bundled file at `${extensionPath}/vendor/v2converter.ahk`.
- `ahkConverter.strictWindowsOnly`: If true, warn on non-Windows platforms.

### User Experience Settings

- `ahkConverter.enableEnhancedDiff`: Enable enhanced diff view with better highlighting and options. (Default: true)
- `ahkConverter.showConversionStats`: Show detailed conversion statistics in status bar. (Default: true)
- `ahkConverter.enableNotifications`: Show enhanced notifications with actionable options. (Default: true)

### Batch Processing Settings

- `ahkConverter.defaultOutputNaming`: How to name converted files in batch mode.
  - `suffix`: Add '_v2' suffix to original filename (default)
  - `directory`: Save to a separate 'v2' subdirectory
  - `prompt`: Prompt for filename each time
- `ahkConverter.batchOutputDirectory`: Default output directory for batch conversions. If empty, prompts for directory.
- `ahkConverter.autoSaveAfterConversion`: Automatically save files after successful conversion. (Default: false)

### Validation Settings

- `ahkConverter.validationLevel`: Level of validation to perform on AHK files.
  - `strict`: Strict validation with detailed checks
  - `normal`: Normal validation with standard checks (default)
  - `lenient`: Lenient validation with minimal checks

### Diff View Settings

- `ahkConverter.diffViewOptions`: Options for diff view display.
  - `showLineNumbers`: Show line numbers in diff view. (Default: true)
  - `highlightChanges`: Highlight changes with color coding. (Default: true)
  - `ignoreWhitespace`: Ignore whitespace changes in diff. (Default: false)
  - `contextLines`: Number of context lines to show around changes. (Default: 3, range: 0-10)

## Troubleshooting

### Common Issues

**"AutoHotkey v2 executable not found"**
- Ensure AutoHotkey v2 is installed
- Set the correct path in `ahkConverter.autoHotkeyV2Path` setting
- Try using the "Open Settings" action in the error notification

**"Converter script not found"**
- Verify the extension is properly installed
- Check `ahkConverter.converterScriptPath` setting
- Reinstall the extension if the file is missing

**"Validation failed"**
- Check if the file contains AHK v1 syntax
- Ensure the file is not empty or corrupted
- Try with a simpler AHK file first

**"Conversion failed"**
- Check the output channel for detailed error information
- Verify AutoHotkey v2 is working correctly
- Try converting a simpler file first

### Performance Issues

**Slow conversion on large files**
- Consider using batch mode for multiple files
- Disable enhanced diff view if not needed
- Increase validation level to "lenient" for faster processing

**Memory issues with batch processing**
- Process files in smaller batches
- Close other applications to free memory
- Restart VS Code if needed

### Getting Help

1. **Check the output channel**: View → Output → "AHKv2 Toolbox"
2. **Review error notifications**: Click "Show Details" for technical information
3. **Visit documentation**: Use "Learn More" links in error messages
4. **Report issues**: [GitHub Issues](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)

## Advanced Usage

### Custom Validation

You can adjust the validation level based on your needs:
- **Strict**: Best for critical production code
- **Normal**: Good balance of safety and performance
- **Lenient**: Fastest, minimal checks

### Batch Workflow

For large projects:
1. Organize AHK files in logical groups
2. Use batch conversion with directory output naming
3. Review conversion statistics for quality assessment
4. Test converted files before deployment

### Integration with Other Tools

The extension works well with:
- **AutoHotkey LSP** for syntax highlighting and IntelliSense
- **Git** for version control of converted files
- **Build tools** for automated conversion workflows

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **AutoHotkey Community** for the v2 converter script
- **AutoHotkey Team** for the v2 language and tools
- **VS Code Team** for the extension API and platform

## Support

- 📖 [Documentation](https://github.com/TrueCrimeAudit/ahkv2-toolbox#readme)
- 🐛 [Issue Tracker](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)
- 💬 [Discussions](https://github.com/TrueCrimeAudit/ahkv2-toolbox/discussions)
- 📧 [Email Support](mailto:support@example.com)

---

<div align="center">
  <strong>Enjoy converting your AHK scripts! 🚀</strong>
</div>
