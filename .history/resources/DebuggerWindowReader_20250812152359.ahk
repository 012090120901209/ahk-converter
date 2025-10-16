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
