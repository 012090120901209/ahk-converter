#Requires AutoHotkey v2.0
; Logging library

class Logger {
    static Info(message) {
        FileAppend(A_Now " [INFO] " message "`n", "app.log")
    }

    static Error(message) {
        FileAppend(A_Now " [ERROR] " message "`n", "app.log")
    }
}
