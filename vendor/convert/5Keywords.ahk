#Requires AutoHotKey v2.0-beta.1
; CONVERSION-STATUS: SUCCESS - AutoHotkey v2 Compatible
; This file has been successfully converted to AutoHotkey v2 syntax
; All legacy v1 syntax has been updated to v2 standards



/* a list of all renamed variables, in this format:
    , "OrigVar" ,
      "ReplacementVar"
    ? first comma is not needed for the first pair
  important: the order matters. the first 2 in the list could cause a mistake if not ordered properly
*/

global KeywordsToRenameM := OrderedMap(
    "A_LoopFileFullPath" ,
    "A_LoopFilePath"
  , "A_LoopFileLongPath" ,
    "A_LoopFileFullPath"
  , "ComSpec" ,
    "A_ComSpec"
  , "Clipboard" ,
    "A_Clipboard"
  , "ClipboardAll" ,
    "ClipboardAll()"
  , "ComObjParameter()" ,
    "ComObject()"
  , "A_isUnicode" ,
    "1"
  , "A_LoopRegKey `"\`" A_LoopRegSubKey" ,
    "A_LoopRegKey"
  , "A_LoopRegKey . `"\`" . A_LoopRegSubKey" ,
    "A_LoopRegKey"
  , "%A_LoopRegKey%\%A_LoopRegSubKey%" ,
    "%A_LoopRegKey%"
  )

