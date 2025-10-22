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
