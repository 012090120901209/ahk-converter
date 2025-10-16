;===TEST METADATA===
;name: Complex AHK v1 Syntax Test
;shouldPass: true
;expectedWarnings: Old MsgBox syntax detected,Legacy If statement detected
;expectedErrors: 
;===END METADATA===

#NoEnv
#SingleInstance Force

; Test hotkey
^!s::
    Send, This is a test
return

; Test function
TestFunction(param1, param2) {
    if (param1 = param2) {
        MsgBox, Parameters are equal
        return true
    }
    return false
}

; Test loop
Loop, 10 {
    MsgBox, Iteration %A_Index%
}

; Test variable assignment
myVar := "test"
globalVar := 100

; Test command syntax
Run, notepad.exe
WinWait, Untitled - Notepad
Send, Hello World{!}