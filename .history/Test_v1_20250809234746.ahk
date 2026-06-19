; REMOVED: #NoEnv
#NoTrayIcon
SetWorkingDir(A_ScriptDir)

oSciTE := GetSciTEInstance()
if !oSciTE
{
	MsgBox("Cannot find SciTE!", "SciTE4AutoHotkey", 16)
	ExitApp()
}

UserAutorun := oSciTE.UserDir "\Autorun.ahk"

bUpdatesEnabled := oSciTE.ResolveProp("automatic.updates") + 0
bTillaGotoEnabled := oSciTE.ResolveProp("tillagoto.enable") + 0

if bUpdatesEnabled
	Run("`"" A_AhkPath "`" SciTEUpdate.ahk /silent")

if bTillaGotoEnabled
	Run("`"" A_AhkPath "`" TillaGoto.ahk")

if FileExist(UserAutorun)
	Run("`"" A_AhkPath "`" `"" UserAutorun "`"")
﻿; REMOVED: #NoEnv
#NoTrayIcon
SetWorkingDir(A_ScriptDir)

oSciTE := GetSciTEInstance()
if !oSciTE
{
	MsgBox("Cannot find SciTE!", "SciTE4AutoHotkey", 16)
	ExitApp()
}

UserAutorun := oSciTE.UserDir "\Autorun.ahk"

bUpdatesEnabled := oSciTE.ResolveProp("automatic.updates") + 0
bTillaGotoEnabled := oSciTE.ResolveProp("tillagoto.enable") + 0

if bUpdatesEnabled
	Run("`"" A_AhkPath "`" SciTEUpdate.ahk /silent")

if bTillaGotoEnabled
	Run("`"" A_AhkPath "`" TillaGoto.ahk")

if FileExist(UserAutorun)
	Run("`"" A_AhkPath "`" `"" UserAutorun "`"")