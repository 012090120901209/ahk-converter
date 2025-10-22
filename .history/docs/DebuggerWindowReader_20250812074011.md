# AHK v2 Debugger Window Reader

## Overview

The AHK v2 Debugger Window Reader is a standalone utility that captures debugging information from AutoHotkey v2's built-in debugger and formats it for LLM consumption. This tool enables AI-assisted code analysis and troubleshooting by providing structured debug data.

## Outstanding Issues in Current Project

| Issue | Priority | Description | Solution |
|-------|----------|-------------|----------|
| Missing `dist/` directory | High | Extension build output missing - prevents installation | Run `npm run compile` to generate dist files |
| Incomplete CHANGELOG | Medium | Only shows v0.1.0, current version is 0.1.5 | Update CHANGELOG.md with version history |
| Missing error handling | Medium | No validation for malformed AHK files | Add try-catch blocks in conversion functions |
| Platform dependency | Low | Windows-only limitation could be better documented | Add platform requirements to README |
| Missing tests | Medium | No automated testing for conversion functionality | Create test suite for conversion scenarios |

## Debugger Window Reader Implementation

### Complete AHK v2 Code

```cpp
#Requires AutoHotkey v2.1-alpha.16
#SingleInstance Force

debugReader := DebuggerWindowReader()

class DebuggerWindowReader {
    __New() {
        this.SetupProperties()
        this.SetupHotkeys()
        this.CreateGui()
    }
    
    SetupProperties() {
        this.DebuggerTitle := "AutoHotkey v2 Debugger"
        this.MonitorActive := false
        this.LastCapture := ""
        this.OutputFile := A_ScriptDir "\debug_output.json"
        this.SessionCount := 0
    }
    
    SetupHotkeys() {
        HotKey("F9", this.CaptureDebugInfo.Bind(this))
        HotKey("F10", this.ToggleMonitoring.Bind(this))
        HotKey("F11", this.ShowGui.Bind(this))
        HotKey("F12", this.ExportToClipboard.Bind(this))
    }
    
    CreateGui() {
        this.gui := Gui("+Resize", "AHK v2 Debugger Reader")
        this.gui.SetFont("s10")
        this.gui.OnEvent("Close", (*) => this.gui.Hide())
        this.gui.OnEvent("Escape", (*) => this.gui.Hide())
        
        this.gui.AddText("", "AHK v2 Debugger Window Reader")
        this.gui.AddText("", "F9: Capture Debug Info | F10: Toggle Monitor | F11: Show GUI | F12: Export")
        
        this.statusText := this.gui.AddText("w400 h20", "Status: Ready")
        this.gui.AddText("", "Debug Output:")
        
        this.outputEdit := this.gui.AddEdit("ReadOnly w500 h300 VScroll")
        
        this.gui.AddButton("w100 h30", "Capture").OnEvent("Click", this.CaptureDebugInfo.Bind(this))
        this.gui.AddButton("w100 h30 x+10", "Monitor").OnEvent("Click", this.ToggleMonitoring.Bind(this))
        this.gui.AddButton("w100 h30 x+10", "Clear").OnEvent("Click", this.ClearOutput.Bind(this))
        this.gui.AddButton("w100 h30 x+10", "Export").OnEvent("Click", this.ExportToClipboard.Bind(this))
    }
    
    ShowGui(*) {
        this.gui.Show()
    }
    
    CaptureDebugInfo(*) {
        if !WinExist(this.DebuggerTitle) {
            this.UpdateStatus("AHK v2 Debugger window not found")
            return
        }
        
        this.SessionCount++
        debugData := this.ExtractDebuggerData()
        formattedData := this.FormatForLLM(debugData)
        this.SaveToFile(formattedData)
        this.UpdateOutput(formattedData)
        this.UpdateStatus("Debug data captured - Session " . this.SessionCount)
    }
    
    ExtractDebuggerData() {
        debugInfo := Map()
        debugInfo["timestamp"] := A_Now
        debugInfo["session"] := this.SessionCount
        debugInfo["variables"] := this.GetVariableStates()
        debugInfo["callStack"] := this.GetCallStack()
        debugInfo["currentLine"] := this.GetCurrentLine()
        debugInfo["errorInfo"] := this.GetErrorInfo()
        debugInfo["breakpoints"] := this.GetBreakpoints()
        return debugInfo
    }
    
    GetVariableStates() {
        try {
            variableText := ControlGetText("Edit1", this.DebuggerTitle)
            return this.ParseVariables(variableText)
        } catch {
            return []
        }
    }
    
    GetCallStack() {
        try {
            stackText := ControlGetText("ListBox1", this.DebuggerTitle)
            return this.ParseCallStack(stackText)
        } catch {
            return []
        }
    }
    
    GetCurrentLine() {
        try {
            return ControlGetText("Edit2", this.DebuggerTitle)
        } catch {
            return "Unable to retrieve current line"
        }
    }
    
    GetErrorInfo() {
        try {
            errorText := ControlGetText("Edit3", this.DebuggerTitle)
            return errorText
        } catch {
            return ""
        }
    }
    
    GetBreakpoints() {
        try {
            bpText := ControlGetText("ListBox2", this.DebuggerTitle)
            return this.ParseBreakpoints(bpText)
        } catch {
            return []
        }
    }
    
    ParseVariables(text) {
        variables := []
        if !text
            return variables
            
        lines := StrSplit(text, "`n")
        for line in lines {
            line := Trim(line)
            if line == ""
                continue
                
            if RegExMatch(line, "(\w+)\s*[=:]\s*(.+)", &match) {
                variables.Push({
                    name: match[1], 
                    value: match[2],
                    type: this.DetermineType(match[2])
                })
            }
        }
        return variables
    }
    
    ParseCallStack(text) {
        stack := []
        if !text
            return stack
            
        lines := StrSplit(text, "`n")
        for line in lines {
            line := Trim(line)
            if line != "" {
                stack.Push({
                    frame: stack.Length + 1,
                    location: line
                })
            }
        }
        return stack
    }
    
    ParseBreakpoints(text) {
        breakpoints := []
        if !text
            return breakpoints
            
        lines := StrSplit(text, "`n")
        for line in lines {
            line := Trim(line)
            if line != "" {
                breakpoints.Push(line)
            }
        }
        return breakpoints
    }
    
    DetermineType(value) {
        if IsNumber(value)
            return "Number"
        if value == "true" || value == "false"
            return "Boolean"
        if RegExMatch(value, "^[\[\{].*[\]\}]$")
            return "Object/Array"
        return "String"
    }
    
    FormatForLLM(debugData) {
        output := "=== AHK v2 Debug Session #" . debugData["session"] . " ===`n"
        output .= "Timestamp: " . debugData["timestamp"] . "`n"
        output .= "Captured: " . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . "`n`n"
        
        output .= "CURRENT EXECUTION:`n"
        output .= "  Line: " . debugData["currentLine"] . "`n`n"
        
        output .= "VARIABLES (" . debugData["variables"].Length . " found):`n"
        for variable in debugData["variables"] {
            output .= "  " . variable.name . " (" . variable.type . ") = " . variable.value . "`n"
        }
        
        output .= "`nCALL STACK (" . debugData["callStack"].Length . " frames):`n"
        for frame in debugData["callStack"] {
            output .= "  Frame " . frame.frame . ": " . frame.location . "`n"
        }
        
        if debugData["breakpoints"].Length > 0 {
            output .= "`nBREAKPOINTS (" . debugData["breakpoints"].Length . " active):`n"
            for i, bp in debugData["breakpoints"] {
                output .= "  " . i . ": " . bp . "`n"
            }
        }
        
        if debugData["errorInfo"] != "" {
            output .= "`nERROR INFORMATION:`n"
            output .= "  " . debugData["errorInfo"] . "`n"
        }
        
        output .= "`nLLM ANALYSIS CONTEXT:`n"
        output .= "  - This debug session shows the current state of an AHK v2 script`n"
        output .= "  - Variable types have been inferred for better analysis`n"
        output .= "  - Call stack shows execution flow and current position`n"
        output .= "  - Use this data to identify issues, suggest fixes, or explain behavior`n"
        
        return output
    }
    
    SaveToFile(data) {
        try {
            FileAppend(data . "`n" . "=".Repeat(80) . "`n", this.OutputFile)
        } catch as err {
            this.UpdateStatus("Error saving to file: " . err.message)
        }
    }
    
    UpdateOutput(data) {
        if HasProp(this, "outputEdit") {
            this.outputEdit.Text := data
        }
    }
    
    UpdateStatus(message) {
        if HasProp(this, "statusText") {
            this.statusText.Text := "Status: " . message
        }
    }
    
    ClearOutput(*) {
        if HasProp(this, "outputEdit") {
            this.outputEdit.Text := ""
        }
        this.UpdateStatus("Output cleared")
    }
    
    ExportToClipboard(*) {
        if HasProp(this, "outputEdit") && this.outputEdit.Text != "" {
            A_Clipboard := this.outputEdit.Text
            this.UpdateStatus("Debug data copied to clipboard")
        } else {
            this.UpdateStatus("No data to export")
        }
    }
    
    ToggleMonitoring(*) {
        this.MonitorActive := !this.MonitorActive
        if this.MonitorActive {
            SetTimer(this.MonitorDebugger.Bind(this), 2000)
            this.UpdateStatus("Debug monitoring started (2s interval)")
        } else {
            SetTimer(this.MonitorDebugger.Bind(this), 0)
            this.UpdateStatus("Debug monitoring stopped")
        }
    }
    
    MonitorDebugger() {
        if WinExist(this.DebuggerTitle) {
            currentCapture := this.ExtractDebuggerData()
            if this.HasChanged(currentCapture) {
                formattedData := this.FormatForLLM(currentCapture)
                this.SaveToFile(formattedData)
                this.UpdateOutput(formattedData)
                this.LastCapture := formattedData
                this.UpdateStatus("Auto-captured debug state change")
            }
        } else {
            this.UpdateStatus("Debugger window not found - monitoring continues")
        }
    }
    
    HasChanged(newData) {
        newFormatted := this.FormatForLLM(newData)
        return newFormatted != this.LastCapture
    }
}
```

## Key Features

| Feature | Description | Hotkey |
|---------|-------------|--------|
| Manual Capture | Capture current debug state | F9 |
| Auto-Monitor | Toggle continuous monitoring | F10 |
| GUI Interface | Show/hide control panel | F11 |
| Export Data | Copy to clipboard for LLM | F12 |
| Variable Analysis | Type inference and parsing | - |
| Call Stack Tracking | Execution flow analysis | - |
| Breakpoint Detection | Active breakpoint listing | - |
| Error Information | Exception and error details | - |

## Integration with AHK Converter Project

### File Structure
```
ahk-converter/
├── src/
│   ├── extension.ts
│   └── DebuggerWindowReader.ahk  # New file
├── docs/
│   └── DebuggerWindowReader.md   # This documentation
└── vendor/
    └── (existing converter files)
```

### VS Code Extension Integration

The debugger reader can be integrated into the existing VS Code extension by:

1. **Adding a new command** in `package.json`:
```json
{
  "command": "ahk.launchDebugReader",
  "title": "AHK: Launch Debugger Window Reader"
}
```

2. **Extending the TypeScript extension** in `src/extension.ts`:
```typescript
vscode.commands.registerCommand('ahk.launchDebugReader', async () => {
  const readerPath = path.join(ctx.extensionPath, 'src', 'DebuggerWindowReader.ahk');
  const { ahkExe } = await getPaths(ctx);
  await spawnRun(ahkExe, [readerPath]);
});
```

## Usage Instructions

### Basic Usage
1. Run your AHK v2 script with debugging enabled
2. Launch the Debugger Window Reader
3. Press F9 to capture current debug state
4. Press F12 to copy formatted data to clipboard
5. Paste into your preferred LLM tool for analysis

### Advanced Usage
1. Press F10 to enable auto-monitoring
2. The tool will automatically capture state changes
