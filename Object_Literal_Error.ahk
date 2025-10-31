/**
 * @file Window.ahk
 * @description Class to manage windows and monitors
 * @author TrueCrimeAudit
 * @date 2024-06-10
 * @version 1.0.0
 * @requires AHK2
 * @keywords windows, monitors, window-management
 * @category Utility
 * @example Window.GetActiveWindow()
 */

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
