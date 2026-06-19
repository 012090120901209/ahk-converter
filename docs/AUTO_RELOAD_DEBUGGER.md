# Auto-Reload Debugger Guide

## Overview

When developing VS Code extensions, you need to reload the Extension Development Host to see your changes. This guide provides multiple methods to streamline this workflow.

## Quick Reference

| Method | Keyboard Shortcut | When to Use |
|--------|------------------|-------------|
| **Restart Debugging** | `Ctrl+Shift+F5` | Debugger is running |
| **Reload Window** | `Ctrl+R` | In Extension Dev Host |
| **Compile + Reload Task** | `Ctrl+Shift+P` → "Compile and Reload" | From main VS Code |
| **Auto-Reload Script** | `./scripts/auto-reload.sh` | From terminal |

## Method 1: Restart Debugging (Recommended)

**Best for**: Quick iterations while debugging

### Steps:
1. Make your changes to TypeScript files
2. Press `Ctrl+Shift+B` to compile (or it auto-compiles if watch is running)
3. Press `Ctrl+Shift+F5` to restart debugging

**Keyboard shortcut**:
- `Ctrl+Shift+F5` - Restarts the debugger with fresh code

### What it does:
- Stops the current debug session
- Recompiles your code (if needed)
- Starts a fresh debug session
- Automatically reloads the Extension Development Host

## Method 2: Reload Window in Extension Host

**Best for**: When debugger is already running and you just need to reload

### Steps:
1. Make your changes and compile (`Ctrl+Shift+B`)
2. In the **Extension Development Host** window:
   - Press `Ctrl+R`
   - Or: `Ctrl+Shift+P` → "Developer: Reload Window"

**Keyboard shortcut**:
- `Ctrl+R` - Reloads the Extension Development Host window

### What it does:
- Reloads the window with the new compiled code
- Faster than restarting debugger
- Preserves debug session state

## Method 3: Compile and Reload Task

**Best for**: Automated workflow with reminder

### Steps:
1. Press `Ctrl+Shift+P`
2. Type: "Run Task"
3. Select: "Compile and Reload Debugger"
4. Wait for compilation
5. Press `F5` to start/restart debugger

**What it does**:
- Compiles all TypeScript files
- Shows success/error messages
- Reminds you to restart debugger

### Task configuration:
Located in `.vscode/tasks.json`:
```json
{
  "label": "Compile and Reload Debugger",
  "type": "shell",
  "command": "npm run compile && echo 'Compilation complete! Now restart debugger with F5'"
}
```

## Method 4: Auto-Reload Script

**Best for**: Terminal-based workflow

### Usage:
```bash
# From project root
./scripts/auto-reload.sh
```

### What it does:
1. Compiles TypeScript
2. Shows success/failure
3. Provides clear instructions for next steps
4. Includes multiple reload options

### Output example:
```
🔨 Compiling TypeScript...
✅ Compilation successful!

📋 Next steps to reload debugger:

  Option 1 (Recommended):
    • Press Ctrl+Shift+F5 to restart debugging

  Option 2:
    • Stop debugger (Shift+F5)
    • Start debugger (F5)

  Option 3 (In Extension Development Host):
    • Press Ctrl+R to reload window

💡 Your changes are compiled and ready!
```

## Watch Mode (Automatic Compilation)

**Best for**: Continuous development

### Setup:
```bash
npm run watch
```

### What it does:
- Automatically recompiles when you save TypeScript files
- Runs in background
- You only need to reload the debugger (no manual compile step)

### Workflow with watch mode:
1. Start watch: `npm run watch`
2. Start debugging: `F5`
3. Make changes to `.ts` files
4. Save files (auto-compiles)
5. Reload: `Ctrl+Shift+F5` or `Ctrl+R`

## Comparison of Methods

### Speed
1. **Fastest**: `Ctrl+R` in Extension Host (1-2 seconds)
2. **Fast**: `Ctrl+Shift+F5` restart debugger (3-5 seconds)
3. **Medium**: Compile task + F5 (5-10 seconds)
4. **Slower**: Stop + Compile + Start (10-15 seconds)

### When to Use Each

**Use `Ctrl+R` when**:
- You just need to reload extension code
- Debugger is already running
- Making quick UI/logic changes

**Use `Ctrl+Shift+F5` when**:
- You want a fresh debug session
- Previous session had errors
- Testing initialization logic

**Use Compile Task when**:
- You want explicit compile step
- Not using watch mode
- Want confirmation of successful compile

**Use Auto-Reload Script when**:
- Working from terminal
- Want clear instructions
- Teaching someone the workflow

## Troubleshooting

### Issue: Changes not appearing after reload

**Cause**: TypeScript not compiled
**Solution**: Run `npm run compile` or check watch mode is running

### Issue: Extension Host doesn't reload

**Cause**: Wrong window focused
**Solution**: Make sure Extension Development Host window is focused when pressing `Ctrl+R`

### Issue: Debugger won't restart

**Cause**: Previous session crashed
**Solution**:
1. Fully stop debugger (`Shift+F5`)
2. Close Extension Development Host window
3. Start fresh (`F5`)

### Issue: Compilation errors prevent reload

**Cause**: TypeScript errors
**Solution**:
1. Check terminal output for errors
2. Fix TypeScript errors
3. Recompile
4. Try again

## Best Practice Workflow

### Recommended Development Flow:

```
┌─────────────────────────────────────────┐
│ 1. Start watch mode                     │
│    $ npm run watch                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 2. Start debugging                       │
│    Press F5                              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 3. Make changes to TypeScript files     │
│    Save files (auto-compiles)            │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 4. Quick reload                          │
│    Press Ctrl+R in Extension Host        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 5. Test changes                          │
│    Verify functionality                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  More changes?          Done?
        │                     │
        └──────> Loop ────────┘
```

## Keyboard Shortcuts Summary

### Main VS Code Window
- `F5` - Start debugging
- `Shift+F5` - Stop debugging
- `Ctrl+Shift+F5` - Restart debugging
- `Ctrl+Shift+B` - Build/Compile

### Extension Development Host Window
- `Ctrl+R` - Reload window
- `Ctrl+Shift+P` - Command palette
  - "Developer: Reload Window"
  - "Developer: Show Running Extensions"

## Advanced: Custom Keybindings

You can customize keybindings in `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+f5",
    "command": "workbench.action.debug.restart",
    "when": "inDebugMode"
  },
  {
    "key": "ctrl+shift+r",
    "command": "workbench.action.debug.restart",
    "when": "inDebugMode"
  }
]
```

## Tips and Tricks

### Tip 1: Use Multi-Root Workspace
Keep both main VS Code and Extension Host visible side-by-side to quickly switch contexts.

### Tip 2: Auto-Save
Enable auto-save in VS Code:
- `File > Auto Save`
- Or set `"files.autoSave": "afterDelay"` in settings

### Tip 3: Terminal Integration
Add an npm script for quick reload:
```json
"scripts": {
  "reload": "npm run compile && echo 'Ready to reload!'"
}
```

Then: `npm run reload` from terminal

### Tip 4: Watch Compilation Errors
Keep terminal visible to catch compilation errors immediately:
- Split terminal panel
- One for watch mode
- One for commands

## Summary

**Fastest workflow**:
1. `npm run watch` (once at start)
2. `F5` (start debugging)
3. Make changes
4. `Ctrl+R` (reload)
5. Repeat steps 3-4

**Most reliable workflow**:
1. Make changes
2. `Ctrl+Shift+B` (compile)
3. `Ctrl+Shift+F5` (restart debugger)

Choose the method that fits your development style!
