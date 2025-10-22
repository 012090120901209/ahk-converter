#Requires AutoHotkey v2.0
; Main entry point demonstrating dependency resolution

; Standard includes
#Include utils\helpers.ahk
#Include config.ahk

; Library include
#Include <Logger>

; Relative include with A_ScriptDir
#Include %A_ScriptDir%\modules\app-logic.ahk

Main() {
    Logger.Info("Application started")
    Config := LoadConfig()
    Helper.Initialize()
    AppLogic.Run()
}

Main()
