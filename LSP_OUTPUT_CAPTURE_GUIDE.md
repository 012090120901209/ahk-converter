# LSP Output Capture - Setup Guide

## 🎯 What This Does

Automatically captures **runtime errors** from the AutoHotkey v2 LSP extension so your chat participant can see them without manual copying!

## ✅ Requirements

- AutoHotkey v2 LSP extension (`thqby.vscode-autohotkey2-lsp`)
- Your AHKv2 Toolbox extension active

## 🚀 How It Works

### **Automatic Capture** (Preferred)

The extension now automatically monitors:

1. **File Saves** - When you save an `.ahk` file, it checks for runtime errors
2. **Diagnostics Changes** - When LSP updates diagnostics, it captures them
3. **Terminal Output** - (Future: when VS Code API supports it)

**No manual copying needed!** Just:
1. Write/edit your AHK script
2. Save it (`Ctrl+S`)
3. If there's an error, it's automatically captured
4. Ask the chat: `@ahk /fix`

### **Manual Capture** (Backup Method)

If automatic capture doesn't work or you want to add output manually:

1. Run your AHK script
2. See error in Output window
3. Copy the error output (`Ctrl+A`, `Ctrl+C`)
4. Run command: `AHK: Add Output to Chat Monitor`
5. See confirmation with stats

## 📊 Check if It's Working

Run command: **`AHK: Show Output Capture Stats`**

You should see:
```
📊 Output Capture Stats:
• Channels: 1
• Total Lines: 15
• Recent Errors: 2
• LSP Integration: ✅ Active
```

If LSP Integration shows `❌ Not Available`, the AutoHotkey LSP extension might not be installed or active.

## 🧪 Test It

### Test File: `Object_Literal_Error.ahk`

This file has a known error on line 7-8:

```ahk
#Requires AutoHotkey v2.1-alpha.17
#SingleInstance Force

; Object Literal Test

; Incorrect - arrow with curly braces
obj.DefineProp("property", {
    set: (this, value) => {           ; ERROR: => with { }
        if (value < 0)
            throw ValueError("Invalid")
        this._value := value
    }
})
```

**Test Steps:**

1. Open `Object_Literal_Error.ahk`
2. Save the file (`Ctrl+S`)
3. The LSP will detect the error
4. Check capture stats: `AHK: Show Output Capture Stats`
5. Should show `Recent Errors: 1`
6. Ask chat: `@ahk /fix`
7. Chat should mention the error on line 7!

## 🔍 What Gets Captured

### Automatically:
- ✅ Runtime errors from script execution
- ✅ LSP diagnostic errors with `==>`
- ✅ File path, line number, error message
- ✅ Timestamp (for recency filtering)

### Stored For:
- 🕐 **5 minutes** (errors older than 5 min are auto-cleaned)
- 📦 **Last 20 errors** (circular buffer)
- 📄 **200 lines per channel** (keeps memory low)

## 💡 Usage Tips

### In Chat:

**With automatic capture:**
```
You: @ahk /fix
Assistant: I can see a runtime error from the Output window:

🔴 Runtime Error (Line 7) *just now*
Missing "propertyname:" in object literal.

The issue is you're using fat arrow syntax => with curly braces { }...
```

**Manual trigger:**
```
You: @ahk why is my script broken?
Assistant: Looking at the recent runtime errors, I see...
```

### Check What's Captured:

```
Command: AHK: Show Output Capture Stats
Result: Shows channels, lines, errors, and LSP status
```

### Clear Old Data:

Errors automatically expire after 5 minutes, but you can restart the extension to clear everything.

## 🐛 Troubleshooting

### LSP Integration shows "Not Available"

**Check:**
1. Is AutoHotkey LSP installed? (`thqby.vscode-autohotkey2-lsp`)
2. Is it enabled in Extensions view?
3. Try reloading window: `Developer: Reload Window`

**In Debug Console:**
```
Look for: "AHK LSP extension integration enabled"
```

### No Errors Captured

**Try:**
1. Save the file after editing (`Ctrl+S`)
2. Check if error appears in Problems panel
3. Use manual capture as backup
4. Check stats to see if anything was captured

### Errors Not Showing in Chat

**Check:**
1. Run stats command - are errors tracked?
2. Is the error less than 5 minutes old?
3. Is it for the currently active file?
4. Try using `/fix` command explicitly

## 🔧 Advanced Configuration

### Disable Automatic Capture

If you only want manual capture:

```typescript
// In extension.ts, comment out:
// activateLSPCapture(ctx);
```

### Adjust Error Expiration

Edit `src/utils/outputChannelMonitor.ts`:

```typescript
private errorMaxAge: number = 10 * 60 * 1000; // 10 minutes instead of 5
```

### Increase Error Buffer

Edit `src/utils/outputChannelMonitor.ts`:

```typescript
private maxErrors: number = 50; // Store 50 errors instead of 20
```

## 📈 Performance Impact

**Minimal:**
- Monitors only AHK files
- Activates only on save/diagnostic change
- Cleanup runs automatically
- Memory: ~50KB for 20 errors

## 🎉 Expected Results

**Before LSP Capture:**
- ❌ Manual copy/paste required
- ❌ Chat can't see runtime errors
- ❌ Only static diagnostics visible

**After LSP Capture:**
- ✅ Automatic error detection
- ✅ Chat sees runtime + static errors
- ✅ Smarter debugging assistance
- ✅ No manual steps needed

## 📝 Commands Reference

| Command | What It Does |
|---------|-------------|
| `AHK: Add Output to Chat Monitor` | Manually add clipboard output |
| `AHK: Show Output Capture Stats` | Show capture statistics |
| `@ahk /fix` | Debug with full error context |
| `@ahk why is my script broken?` | Auto-includes errors |

## 🚀 Next Steps

1. **Test with `Object_Literal_Error.ahk`**
2. **Check stats** to confirm it's working
3. **Try chat** with a broken script
4. **Report any issues** you find!

---

**Questions?** Check the main README or create an issue!
