#Requires AutoHotkey v2.0
; Logger library
; Provides logging functionality

#Include <Utils>

class Logger {
    static logFile := A_ScriptDir . "\app.log"

    static Log(message, level := "INFO") {
        timestamp := FormatTime(, "yyyy-MM-dd HH:mm:ss")
        entry := timestamp . " [" . level . "] " . message . "`n"
        FileAppend(entry, this.logFile)
    }

    static Info(message) {
        this.Log(message, "INFO")
    }

    static Error(message) {
        this.Log(message, "ERROR")
    }

    static Debug(message) {
        this.Log(message, "DEBUG")
    }
}
