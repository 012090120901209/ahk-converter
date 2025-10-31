; AutoHotkey v1 Sample File for Testing
MsgBox, Hello World

IfEqual, var, value
{
    MsgBox, Equal
}

StringSplit, OutputArray, InputVar, `,

Loop, 5
{
    MsgBox, %A_Index%
}

; Function with old syntax
MyFunction(param1, param2)
{
    return param1 + param2
}
