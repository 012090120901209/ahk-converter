; REMOVED: #NoEnv
#SingleInstance Force

; Simple AHK v1 test script
MsgBox("Hello from AHK v1!")
if (A_IsAdmin)
{
    MsgBox("Running as administrator")
}

; Test variable assignment
myVar := "test value"
MsgBox("Variable value: " myVar)

; Test function call
MyFunction("parameter")

return

MyFunction(param)
{
    MsgBox("Function called with: " param)
    return "success"
}