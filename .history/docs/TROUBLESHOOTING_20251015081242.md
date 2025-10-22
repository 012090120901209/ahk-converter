# Troubleshooting Guide

This guide helps you resolve common issues with the AHK Converter VS Code extension.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Problems](#configuration-problems)
- [Conversion Errors](#conversion-errors)
- [Performance Issues](#performance-issues)
- [Batch Processing Problems](#batch-processing-problems)
- [Diff View Issues](#diff-view-issues)
- [File Operation Errors](#file-operation-errors)
- [Getting Help](#getting-help)

## Installation Issues

### "Extension not found in VS Code Marketplace"

**Symptoms:**
- Cannot find "AHK Converter" in VS Code extensions
- Extension installation fails

**Solutions:**
1. **Check VS Code version**: Ensure you're using VS Code 1.84.0 or later
2. **Manual installation**: 
   - Download the .vsix file from GitHub releases
   - In VS Code: Extensions → ... → Install from VSIX
3. **Alternative sources**: Try installing from Open VSX Marketplace

### "Extension activation failed"

**Symptoms:**
- Extension shows as disabled
- Error messages about activation

**Solutions:**
1. **Restart VS Code**: File → Exit and restart
2. **Check compatibility**: Verify VS Code version meets requirements
3. **Disable conflicting extensions**: Temporarily disable other AHK extensions
4. **Reinstall extension**: Uninstall and reinstall the extension

### "AutoHotkey v2 not found"

**Symptoms:**
- Error message about missing AutoHotkey v2
- Conversion fails immediately

**Solutions:**
1. **Install AutoHotkey v2**:
   - Download from [autohotkey.com](https://www.autohotkey.com/)
   - Choose v2 (not v1) during installation
2. **Set custom path**:
   ```json
   "ahkConverter.autoHotkeyV2Path": "C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe"
   ```
3. **Add to PATH**: Ensure AutoHotkey v2 directory is in system PATH

## Configuration Problems

### Settings not taking effect

**Symptoms:**
- Changed settings but no effect
- Extension uses default values

**Solutions:**
1. **Check settings scope**: Ensure settings are in correct scope (User vs Workspace)
2. **Validate JSON**: Check for syntax errors in settings.json
3. **Reload VS Code**: Use `Developer: Reload Window` command
4. **Check setting names**: Verify exact setting names from documentation

### "Converter script not found"

**Symptoms:**
- Error about missing v2converter.ahk
- Extension cannot locate converter

**Solutions:**
1. **Reinstall extension**: Ensures all files are present
2. **Check file permissions**: Ensure extension directory is readable
3. **Set custom path**:
   ```json
   "ahkConverter.converterScriptPath": "C:\\path\\to\\v2converter.ahk"
   ```
4. **Verify extension integrity**: Check if extension is properly installed

## Conversion Errors

### "Validation failed"

**Symptoms:**
- File validation errors
- Conversion doesn't start

**Common Causes and Solutions:**

**Empty File:**
- Ensure file contains AHK code
- Check for hidden characters
- Verify file encoding (UTF-8 recommended)

**Binary Content:**
- File contains non-text data
- Open file in text editor to verify
- Save as plain text file

**No AHK v1 Patterns:**
- File might already be v2 format
- Check for AHK v1 syntax like `MsgBox,` or `#NoEnv`
- Try with a known v1 file to test

### "Conversion failed with code X"

**Symptoms:**
- Converter process exits with error code
- No output file generated

**Solutions:**
1. **Check AutoHotkey v2 installation**:
   - Run AutoHotkey v2 directly to test
   - Verify installation integrity
2. **Examine error details**:
   - Open Output Channel: View → Output → "AHK Converter"
   - Look for specific error messages
3. **Try simpler file**:
   - Test with basic AHK v1 code
   - Gradually increase complexity
4. **Check file permissions**:
   - Ensure input file is readable
   - Verify write permissions for output directory

### "Conversion validation failed"

**Symptoms:**
- Conversion completes but validation fails
- Output contains v1 syntax

**Solutions:**
1. **Review validation warnings**:
   - Check Output Channel for specific issues
   - Look for unconverted syntax patterns
2. **Adjust validation level**:
   ```json
   "ahkConverter.validationLevel": "lenient"
   ```
3. **Manual review**: Check converted code for obvious issues
4. **Report issue**: If converter fails consistently

## Performance Issues

### Slow conversion on large files

**Symptoms:**
- Conversion takes very long time
- VS Code becomes unresponsive

**Solutions:**
1. **Use batch mode**: More efficient for multiple files
2. **Adjust validation level**:
   ```json
   "ahkConverter.validationLevel": "lenient"
   ```
3. **Disable enhanced features**:
   ```json
   "ahkConverter.enableEnhancedDiff": false
   "ahkConverter.showConversionStats": false
   ```
4. **Split large files**: Break into smaller chunks if possible

### Memory issues during batch processing

**Symptoms:**
- VS Code crashes during batch operations
- Out of memory errors

**Solutions:**
1. **Process in smaller batches**: Select fewer files at once
2. **Close other applications**: Free up system memory
3. **Restart VS Code**: Clear memory before batch operations
4. **Disable unnecessary extensions**: Reduce memory usage

## Batch Processing Problems

### "No files selected for batch conversion"

**Symptoms:**
- Batch conversion dialog shows no files
- Cannot select multiple files

**Solutions:**
1. **Check file filter**: Ensure selecting .ahk files
2. **Use correct dialog**: Use the file picker, not explorer
3. **Verify file permissions**: Ensure files are accessible
4. **Check file extensions**: Confirm files have .ahk extension

### Batch conversion saves to wrong location

**Symptoms:**
- Output files in unexpected directory
- Cannot find converted files

**Solutions:**
1. **Check output naming setting**:
   ```json
   "ahkConverter.defaultOutputNaming": "directory"
   ```
2. **Set default output directory**:
   ```json
   "ahkConverter.batchOutputDirectory": "C:\\path\\to\\output"
   ```
3. **Use explicit save**: Choose directory when prompted
4. **Check file naming**: Look for `_v2` suffix in filenames

## Diff View Issues

### Diff view not showing changes

**Symptoms:**
- Diff view shows identical files
- No highlighting of changes

**Solutions:**
1. **Enable enhanced diff**:
   ```json
   "ahkConverter.enableEnhancedDiff": true
   ```
2. **Check diff options**:
   ```json
   "ahkConverter.diffViewOptions": {
     "highlightChanges": true,
     "ignoreWhitespace": false
   }
   ```
3. **Refresh diff view**: Close and reopen diff
4. **Check file content**: Ensure there are actual differences

### Cannot accept diff changes

**Symptoms:**
- "Accept Diff" command disabled
- Changes not applied to original file

**Solutions:**
1. **Ensure diff is active**: Diff view must be open
2. **Check file permissions**: Original file must be writable
3. **Save original file**: Ensure original file is saved
4. **Use manual copy**: Copy-paste changes if needed

## File Operation Errors

### "File operation failed"

**Symptoms:**
- Cannot read input files
- Cannot write output files

**Solutions:**
1. **Check file permissions**:
   - Ensure read access to input files
   - Ensure write access to output directory
2. **Check file locks**:
   - Close files in other editors
   - Ensure no processes are using files
3. **Check disk space**: Ensure sufficient space for output
4. **Verify file paths**: Check for invalid characters

### "Cannot replace current editor"

**Symptoms:**
- Replace operation fails
- Original file unchanged

**Solutions:**
1. **Save file first**: Ensure original file is saved
2. **Check file permissions**: File must be writable
3. **Close other editors**: Ensure file not open elsewhere
4. **Use new tab mode**: Open in new tab instead

## Getting Help

### Collecting Diagnostic Information

When reporting issues, please provide:

1. **Extension version**: Check in Extensions panel
2. **VS Code version**: Help → About
3. **Operating system**: Windows version
4. **AutoHotkey version**: v2.x.x
5. **Error messages**: Full text of any error messages
6. **Steps to reproduce**: Detailed reproduction steps
7. **Sample file**: Minimal file that reproduces the issue

### Debug Information

Enable debug mode for detailed logging:

1. **Open Output Channel**: View → Output → "AHK Converter"
2. **Enable verbose logging**:
   ```json
   "ahkConverter.enableNotifications": true
   "ahkConverter.showConversionStats": true
   ```
3. **Reproduce issue**: Perform the failing operation
4. **Copy logs**: Select all text in output channel
5. **Include in issue**: Paste logs in GitHub issue

### Contact Options

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/TrueCrimeAudit/ahk-converter/issues)
- **GitHub Discussions**: [Community support](https://github.com/TrueCrimeAudit/ahk-converter/discussions)
- **Documentation**: [Full documentation](https://github.com/TrueCrimeAudit/ahk-converter#readme)

### Common Workarounds

If you encounter persistent issues:

1. **Use external converter**: Run v2converter.ahk directly
2. **Manual conversion**: Convert files one by one
3. **Simplify code**: Remove complex syntax before conversion
4. **Update everything**: Ensure latest versions of VS Code, extension, and AutoHotkey v2

---

## Advanced Troubleshooting

### Registry Issues (Windows)

If AutoHotkey v2 path detection fails:

1. **Check registry entries**:
   - `HKEY_LOCAL_MACHINE\SOFTWARE\AutoHotkey`
   - Verify v2 installation paths
2. **Reinstall AutoHotkey v2**: Use official installer
3. **Use explicit path**: Set full path in settings

### Antivirus Interference

If antivirus blocks conversion:

1. **Add exceptions**: Exclude VS Code and AutoHotkey v2
2. **Disable real-time protection**: Temporarily for testing
3. **Use different antivirus**: If issues persist

### Network Issues

For documentation links and updates:

1. **Check internet connection**: Required for "Learn More" links
2. **Firewall settings**: Allow VS Code network access
3. **Proxy settings**: Configure if behind corporate firewall

---

*Last updated: 2024-10-15*