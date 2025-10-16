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
    
