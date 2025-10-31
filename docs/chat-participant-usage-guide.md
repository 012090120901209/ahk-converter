# Chat Participant Usage Guide - Library Attribution

## Prerequisites

- VS Code with GitHub Copilot Chat extension installed
- AHKv2 Toolbox extension installed
- GitHub Personal Access Token (optional, for higher rate limits)

## Setting Up

### 1. Configure GitHub Token (Optional but Recommended)

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for `ahkv2Toolbox.githubToken`
3. Enter your GitHub Personal Access Token
   - Create token at: https://github.com/settings/tokens
   - Required scope: `public_repo` (read access)
   - This increases API rate limit from 10 to 5000 requests/hour

### 2. Enable Library Attribution

Ensure the feature is enabled in settings:
- `ahkv2Toolbox.libraryAttribution.enabled`: ✅ true (default)
- `ahkv2Toolbox.libraryAttribution.autoValidate`: ✅ true (default)

## Usage Methods

### Method 1: Using Chat with Active File

**Scenario**: You have a library file open that's missing metadata

1. Open an AHK library file (e.g., `Lib/GuiEnhancerKit.ahk`)
2. Open GitHub Copilot Chat panel (View → Open Chat)
3. Type: `@ahk /attribute`
4. Press Enter

**Expected Result**:
```markdown
🔍 Discovering metadata for `GuiEnhancerKit.ahk`...

Missing fields: `version`, `date`, `link`

📦 Found match: user/gui-enhancer

✅ Metadata discovered!

/**
 * @description GUI enhancement utilities for AutoHotkey v2
 * @file GuiEnhancerKit.ahk
 * @author GitHub User
 * @link https://github.com/user/gui-enhancer
 * @date 2024/02/20
 * @version 2.3.1
 */

**Fields filled:**
- `version`: 2.3.1
- `date`: 2024/02/20
- `link`: https://github.com/user/gui-enhancer

---

**📋 Provenance:**
- GitHub Code Search
- https://github.com/user/gui-enhancer

💡 *Please verify accuracy before using.*

💡 **What to do next:**
1. Review the metadata above for accuracy
2. Use the command palette: **AHKv2 Toolbox: Discover Library Metadata**
```

### Method 2: Using Chat with File Path

**Scenario**: You want to check metadata without opening the file

1. Open GitHub Copilot Chat
2. Type: `@ahk /attribute Lib/MyLibrary.ahk`
3. Press Enter

**Expected Result**: Same as Method 1, but extracts path from your message

### Method 3: Using Context Menu

**Scenario**: Right-click integration

1. Right-click on an AHK file in Explorer or in Editor
2. Select "Discover Library Metadata"
3. View results in a notification and clipboard

### Method 4: Using Command Palette

**Scenario**: Direct command invocation

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type: `AHKv2 Toolbox: Discover Library Metadata`
3. Select command
4. View results

## Example Conversations

### Example 1: Basic Attribution

**You**: `@ahk /attribute`

**Response**: Discovers metadata, shows formatted header, lists sources

### Example 2: Attribution with Path

**You**: `@ahk /attribute Can you check the metadata for Lib/StringUtils.ahk?`

**Response**: Extracts path, performs attribution, shows results

### Example 3: Already Complete

**You**: `@ahk /attribute`

**Response**:
```markdown
✅ All metadata fields are already complete!
```

### Example 4: Not Found

**You**: `@ahk /attribute`

**Response**:
```markdown
❌ Could not find metadata for this library.
```

## Validation Diagnostics

If auto-validation is enabled, VS Code will automatically:

1. **Detect missing metadata** when you open library files
2. **Show information diagnostic** at the top of the file
3. **Offer quick fix**: "Discover library metadata from GitHub"

**To use the quick fix**:
1. Click the lightbulb 💡 icon on the diagnostic
2. Select "Discover library metadata from GitHub"
3. Metadata discovered and shown in chat

**To disable for specific file**:
1. Click lightbulb 💡
2. Select "Disable metadata validation for this file"
3. File added to exclusion list

## Manual Testing Checklist

Use this checklist to verify the chat participant is working:

### Basic Functionality
- [ ] `/attribute` command recognized
- [ ] File path extracted from active editor
- [ ] File path extracted from prompt text
- [ ] Metadata discovery runs
- [ ] Results shown in chat stream
- [ ] Provenance information displayed

### Error Handling
- [ ] Error shown when no file specified
- [ ] Error handled when file not found
- [ ] Error handled when GitHub API fails
- [ ] Error handled when rate limited

### Integration
- [ ] Works with `.ahk` files
- [ ] Works with `.ahk2` files
- [ ] Works in Lib folders
- [ ] Cache reduces API calls on repeat
- [ ] Telemetry recorded (check output)

### UI/UX
- [ ] Progress shown during search
- [ ] Missing fields listed
- [ ] Formatted header displayed
- [ ] Sources listed at bottom
- [ ] Next steps provided
- [ ] Markdown formatting correct

## Troubleshooting

### Issue: "Error: Please open an AHK library file"

**Solution**:
- Open an AHK file in the editor first, OR
- Specify the file path in your message: `@ahk /attribute Lib/MyLib.ahk`

### Issue: "GitHub API rate limit exceeded"

**Solution**:
- Add GitHub Personal Access Token in settings
- Wait for rate limit to reset (shown in error message)
- Check cache for previously discovered libraries

### Issue: "Could not find metadata for this library"

**Possible reasons**:
- Library not on GitHub
- Library has different name on GitHub
- Network connectivity issue

**Solutions**:
- Try searching GitHub manually
- Check library filename matches repository
- Verify internet connection

### Issue: No response in chat

**Solutions**:
- Check VS Code output panel for errors
- Verify GitHub Copilot Chat is active
- Try reloading VS Code window
- Check extension logs

## Advanced Usage

### Batch Attribution

To attribute multiple files:

1. Use chat for first file: `@ahk /attribute`
2. Switch to second file
3. Repeat: `@ahk /attribute`
4. Cache speeds up repeated queries

### Custom Workflows

Combine with other chat commands:

```
@ahk /attribute first, then /explain how to use this library
```

### Export Statistics

View telemetry data:
1. Check extension storage for `telemetry.json`
2. Look for `library_attribution` events
3. See cache hit rates, API usage, etc.

## Tips for Best Results

1. **Use descriptive filenames**: GitHub searches by filename
2. **Check Lib folders**: Works best with standard library structure
3. **Verify results**: Always review discovered metadata for accuracy
4. **Use cache**: Repeated queries for same library are instant
5. **Add token**: Increases rate limit 500x

## Related Documentation

- [Library Attribution Plan](library-attribution-participant-plan.md)
- [Chat Participant Integration Test](chat-participant-integration-test.md)
- [Library Attribution Features](library-attribution.md)

## Support

If you encounter issues:
1. Check VS Code Developer Tools Console (`Help → Toggle Developer Tools`)
2. Check Output panel (`View → Output` → Select "AHKv2 Toolbox")
3. Report issues at: https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues
