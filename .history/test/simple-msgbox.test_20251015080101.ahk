;===TEST METADATA===
;name: Simple MsgBox Test
;shouldPass: true
;expectedWarnings: Old MsgBox syntax detected,Legacy If statement detected
;expectedErrors: 
;===END METADATA===

#NoEnv
#SingleInstance Force

MsgBox, Hello from AHK v1!
if (A_IsAdmin)
{
    MsgBox, Running as administrator
}

myVar := "test value"
MsgBox, Variable value: %myVar%