# @ahk Chat Participant Troubleshooting Guide

## Issue Summary
The @ahk chat participant is not working in your VS Code extension. After analyzing the implementation, I've identified several critical issues that need to be fixed.

## Root Causes Identified

### 1. **Missing Chat Participant Registration in package.json** ❌ CRITICAL
- **Problem**: The chat participant is implemented in TypeScript but not declared in the extension manifest
- **Location**: `package.json` is missing the `chatParticipants` declaration in the `contributes` section
- **Impact**: VS Code doesn't recognize the chat participant exists

### 2. **VS Code Version Compatibility** ❌ CRITICAL
- **Problem**: Extension requires VS Code 1.90+ for chat participants, but specifies `^1.84.0`
- **Location**: `package.json` engines.vscode
- **Impact**: Extension may not install or activate properly on newer VS Code versions

### 3. **GitHub Copilot Chat Dependency** ❌ CRITICAL
- **Problem**: Implementation assumes GitHub Copilot Chat is available
- **Location**: `src/chatParticipant.ts` lines 250-258
- **Impact**: Chat participant fails silently if Copilot isn't installed/active

### 4. **Extension Activation Logic** ⚠️ MEDIUM
- **Problem**: Extension activates on AHK files, but chat participants need broader activation
- **Location**: `src/extension.ts` activation events
- **Impact**: Chat participant may not register if no AHK files are open

### 5. **Inconsistent API Usage** ⚠️ MEDIUM
- **Problem**: Mix of old and new chat APIs
- **Location**: `src/chatParticipant.ts` vs official examples
- **Impact**: May not work reliably across VS Code versions

## Diagnostic Steps

### Step 1: Verify VS Code Version
```bash
# Check VS Code version
code --version
```
**Required**: Version 1.90.0 or later

### Step 2: Check GitHub Copilot Installation
1. Open Extensions view (`Ctrl+Shift+X`)
2. Search for "GitHub Copilot"
3. Verify it's installed and enabled
4. Check if Chat feature is available

### Step 3: Check Extension Activation
1. Open Developer Tools (`Help → Toggle Developer Tools`)
2. Check Console for errors
3. Look for "AHK v2 Chat Participant registered" message
4. Check Output panel → "AHKv2 Toolbox" for errors

### Step 4: Test Chat Participant Registration
1. Open Chat panel (`Ctrl+Shift+I` or `View → Open Chat`)
2. Type `@ahk` and press Tab
3. Should show participant suggestions
4. If not visible, registration failed

### Step 5: Check Extension Logs
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `Developer: Open Logs Folder`
3. Look for extension logs with "chat" or "participant" errors

## Fixes Required

### Fix 1: Add Chat Participant Declaration to package.json
Add this to the `contributes` section:
```json
"chatParticipants": [
  {
    "id": "ahkv2-toolbox.ahk-assistant",
    "name": "ahk",
    "fullName": "AHK v2 Assistant",
    "description": "AutoHotkey v2 development assistant with code conversion, debugging, and best practices"
  }
]
```

### Fix 2: Update VS Code Version Requirement
Change in `package.json`:
```json
"engines": {
  "vscode": "^1.90.0"
}
```

### Fix 3: Add Chat Participant Activation Event
Add to `activationEvents`:
```json
"onCommand:ahkv2Toolbox.testChatParticipant"
```

### Fix 4: Improve Error Handling
Add better error messages for missing dependencies:
```typescript
// In chatParticipant.ts
if (models.length === 0) {
  throw new Error('GitHub Copilot Chat is required. Please install and enable the GitHub Copilot extension.');
}
```

### Fix 5: Add Graceful Degradation
Handle cases where Copilot isn't available:
```typescript
// Check if Copilot is available before registration
const copilotExtension = vscode.extensions.getExtension('github.copilot');
if (!copilotExtension) {
  console.warn('GitHub Copilot not found, chat participant disabled');
  return;
}
```

## Testing Checklist

After applying fixes, verify:

- [ ] VS Code version 1.90+ installed
- [ ] GitHub Copilot Chat extension installed and active
- [ ] Chat panel shows @ahk participant suggestion
- [ ] Typing @ahk in chat opens the participant
- [ ] Basic commands work: `/convert`, `/explain`, `/fix`
- [ ] Error messages are helpful when dependencies missing
- [ ] Extension activates without AHK files open
- [ ] No console errors during registration

## Common Symptoms and Solutions

### Symptom: "@ahk not showing in chat suggestions"
**Solution**: Missing `chatParticipants` declaration in package.json

### Symptom: "No language model available" error
**Solution**: GitHub Copilot Chat not installed or not activated

### Symptom: Extension activates but chat doesn't work
**Solution**: Check VS Code version compatibility and API usage

### Symptom: Silent failure
**Solution**: Add proper error handling and logging

## Quick Test Commands

Run these in Command Palette to test:
1. `AHKv2 Toolbox: Test Chat Participant` - Opens test guide
2. `Developer: Reload Window` - Reload extension
3. `View: Open Chat` - Open chat panel
4. `Developer: Toggle Developer Tools` - Check console

## Next Steps

1. Apply Fix 1-5 above
2. Reload VS Code window
3. Test chat participant functionality
4. Check Developer Tools console for any remaining errors
5. Verify all test checklist items pass

If issues persist after applying fixes, check the extension output logs and provide specific error messages for further diagnosis.
