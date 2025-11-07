# Upgrade Notes - Version 0.4.3

**Release Date:** 2025-10-31
**Upgrading From:** v0.4.2 or earlier

---

## What's New

### Auto-Add #Include Feature

Version 0.4.3 introduces the **Auto-Add #Include** feature - the #1 priority enhancement from our roadmap. This feature streamlines your workflow by automatically inserting `#Include` statements when you install packages through the Dependency Manager.

---

## Breaking Changes

**None.** This release is fully backward compatible with v0.4.2.

---

## New Features

### 1. Automatic #Include Insertion

**What it does:**
- After installing a package, you now see an "Add #Include" button in the success notification
- Clicking it automatically inserts the include line at the optimal location in your AHK file
- Smart placement based on your file structure (#SingleInstance, #Requires directives)
- Prevents duplicate includes automatically

**How to use:**
1. Open Dependency Manager sidebar
2. Install any package
3. Click "Add #Include" in the success notification
4. If multiple .ahk files exist, select which file to update
5. Done! The include line is added automatically

**Example:**
```ahk
#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk
#Include Lib/JSON.ahk      ; ← Automatically added

; Your code
```

### 2. New Configuration Settings

Five new settings are available to customize the Auto-Add #Include behavior:

| Setting | Default | Description |
|---------|---------|-------------|
| `ahkv2Toolbox.includeFormat` | `Lib/{name}.ahk` | Template for include paths |
| `ahkv2Toolbox.autoInsertHeaders` | `false` | Auto-add missing #Requires and #SingleInstance |
| `ahkv2Toolbox.headerOrder` | `["#Requires AutoHotkey v2.1", "#SingleInstance Force"]` | Order of headers to insert |
| `ahkv2Toolbox.defaultRequires` | `AutoHotkey v2.1` | Default AutoHotkey version |
| `ahkv2Toolbox.defaultSingleInstance` | `Force` | Default SingleInstance mode |

**To configure:**
1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "ahkv2toolbox"
3. Adjust settings as needed

**Example custom configuration:**
```json
{
  "ahkv2Toolbox.includeFormat": "vendor/{name}.ahk",
  "ahkv2Toolbox.autoInsertHeaders": true
}
```

---

## Upgrade Steps

### For Extension Users

**Automatic Update (Recommended):**
1. VS Code will notify you of the update
2. Click "Update" to install v0.4.3
3. Reload VS Code when prompted

**Manual Update:**
1. Open Extensions view (`Ctrl+Shift+X`)
2. Find "AHKv2 Toolbox"
3. Click "Update" if available
4. Reload VS Code

**From VSIX:**
1. Download `ahkv2-toolbox-0.4.3.vsix`
2. Run: `code --install-extension ahkv2-toolbox-0.4.3.vsix`
3. Reload VS Code

### No Migration Required

Your existing configuration, installed packages, and workspace settings will work exactly as before. The new Auto-Add #Include feature is opt-in via the notification button.

---

## What to Test

After upgrading, try these features to ensure everything works:

1. **Basic Installation:**
   - Install a package from Dependency Manager
   - Verify success notification appears
   - Note the new "Add #Include" button

2. **Auto-Add #Include:**
   - Click "Add #Include" after installing
   - Check the include line was added to your .ahk file
   - Verify it's in the right location (after directives)

3. **Duplicate Detection:**
   - Try installing the same package again
   - Click "Add #Include"
   - Verify it shows "already included" message

4. **Existing Settings:**
   - Verify your previous settings still work
   - Check Dependency Manager still shows your packages
   - Ensure Code Map and other features work normally

---

## Known Issues in v0.4.3

1. **Manual Testing Pending**: The Auto-Add #Include feature has comprehensive automated tests but hasn't been manually tested in a live VS Code environment yet. Please report any issues you encounter.

2. **No Preview Dialog**: Include lines are inserted immediately without showing a preview. This will be added in a future release.

3. **No Test Runner**: Unit tests exist but cannot be run with standard npm commands. This doesn't affect extension functionality.

---

## Rollback Instructions

If you encounter issues, you can revert to v0.4.2:

1. Uninstall current version:
   ```bash
   code --uninstall-extension TrueCrimeAudit.ahkv2-toolbox
   ```

2. Install v0.4.2:
   ```bash
   code --install-extension ahkv2-toolbox-0.4.2.vsix
   ```

3. Reload VS Code

---

## Getting Help

If you encounter issues:

1. **Check Documentation:**
   - [Auto-Add #Include Guide](docs/AUTO_INCLUDE_FEATURE.md)
   - [Include Insertion Rules](docs/INCLUDE_INSERTION_RULES.md)
   - [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

2. **Report Issues:**
   - [GitHub Issues](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)
   - Include version number, error messages, and steps to reproduce

3. **Ask Questions:**
   - [GitHub Discussions](https://github.com/TrueCrimeAudit/ahkv2-toolbox/discussions)

---

## What's Next

**Version 0.5.0 Roadmap:**
- Real package downloads from GitHub (replacing mock installations)
- Functional package search
- Enhanced package details view
- Package manifest support

See [ROADMAP.md](ROADMAP.md) for full feature list.

---

## Thank You

Thank you for using AHKv2 Toolbox! This release represents significant progress toward a complete AutoHotkey v2 package management ecosystem.

**Feedback Welcome:** We'd love to hear your thoughts on the Auto-Add #Include feature. Share your experience in GitHub Discussions!

---

**Version:** 0.4.3
**Previous Version:** 0.4.2
**Release Type:** Feature Release
**Compatibility:** Fully backward compatible
