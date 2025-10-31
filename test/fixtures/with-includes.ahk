; Test file with various #Include patterns
#Requires AutoHotkey v2.0
#SingleInstance Force

; Library include (angle brackets)
#Include <JSON>

; Relative path include
#Include Lib\MyLibrary.ahk

; Quoted path include
#Include "utils\helpers.ahk"

; Another relative include
#Include ..\SharedLib.ahk

MainFunction() {
  MsgBox("This file has dependencies")
}
