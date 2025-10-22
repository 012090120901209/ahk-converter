#Requires AutoHotkey v2.0
; Application logic module

#Include %A_ScriptDir%\..\utils\helpers.ahk

class AppLogic {
    static Run() {
        Helper.Initialize()
        MsgBox("App is running")
    }
}
