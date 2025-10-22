{ ;FILE_NAME  v2converter_silent.ahk - v2 -
   ; Language:       English
   ; Platform:       Windows11
   ; Author:         guest3456 (modified for silent operation)
   ; Update to v2converter.ahk (DrReflex)
   ; Script Function: AHK version 1 to version 2 converter - SILENT VERSION
   ;
   ; Use:
   ;       Run the script.  Accepts arguments
   ;         Formats:  1. v2converter_silent.ahk with parameter 1 set to "MyV1ScriptFullPath.ahk" (quotes required)
   ;                   2. v2converter_silent.ahk with parameter 1 set to
   ;       Chose the file you want to convert in the file select dialog
   ;       NO GUI dialogs - runs silently
   ;       If you gave the file MyScript.ahk, the output file will be MyScript_newV2.ahk
   ;
   ; Uses format.ahk
   ; =============================================================================
   ; OTHER THINGS TO ADD:
   ;
}
{ ;REFERENCES:
   ; Feel free to add to this program.  Post changes here: http://www.autohotkey.com/forum/viewtopic.php?t=70266
}
{ ;DIRECTIVES AND SETTINGS
   #Requires AutoHotkey >=2.0-<2.1  ; Requires AHK v2 to run this script
   ; CONVERSION-STATUS: NATIVE - AutoHotkey v2 Native
   ; This file was already written in AutoHotkey v2 syntax


   #SingleInstance Force			      ; Recommended so only one copy is runnnig at a time
   SendMode "Input"  				        ; Recommended for new scripts due to its superior speed and reliability.
   SetWorkingDir A_ScriptDir  	    ; Ensures a consistent starting directory.
}
{ ;CLASSES:
}
{ ;VARIABLES:
   global dbg := 0
}
{ ;INCLUDES:
   #Include lib/ClassOrderedMap.ahk
   #Include Convert/1Commands.ahk
   #Include Convert/2Functions.ahk
   #Include Convert/3Methods.ahk
   #Include Convert/4ArrayMethods.ahk
   #Include Convert/5Keywords.ahk
}
{ ;MAIN PROGRAM - BEGINS HERE *****************************************************************************************
   ;   Many changes can be made here to affect loading and processing
   ; =============================================================================
   MyOutExt := "_newV2.ahk"    ;***ADDED OUTPUT EXTENSION OPTION***

   FN := ""
   FNOut := ""

   ;USE SWITCH CASE TO DEAL WITH COMMAND LINE ARGUMENTS
   switch A_Args.Length
   {
      case 0:  ;IF NO ARGUMENTS THEN LOOK UP SOURCE FILE AND USE DEFAULT OUTPUT FILE
      {
         FN := FileSelect("", A_ScriptDir, "Choose an AHK v1 file to convert to v2")
      }
         case 1: ;IF ONE ARGUMENT THEN ASSUME THE ARUGMENT IS THE SOURCE FILE (FN) AND USE DEFAULT OUTPUT FILE
         {
            FN := A_Args[1]
         }
            case 2: ;IF ONLY TWO ARGUMENTS THEN IF A_Args[1] IS NOT input THEN ERROR
            {       ;ELSE A_Args[2] IS FN
               if (A_Args[1] = "-i" || A_Args[1] = "--input")
                  FN := A_Args[2]
            }
               case 4:
               {  ;IF A_Args[1] IS input AND A_Args[3] IS output
                  ; THEN A_Args[2] IS FN AND A_Args[4] IS FNOut
                  if ((A_Args[1] = "-i" || A_Args[1] = "--input") && (A_Args[3] = "-o" || A_Args[3] = "--output"))
                  {
                     FN := A_Args[2]
                     FNOut := A_Args[4]
                  } else
                  {
                     ;IF A_Args[1] IS output AND A_Args[3] IS input
                     ;   THEN A_Args[2] IS FNOut AND A_Args[4] IS FN
                     if ((A_Args[1] = "-o" || A_Args[1] = "--output") && (A_Args[3] = "-i" || A_Args[3] = "--input"))
                     {
                        FN := A_Args[4]
                        FNOut := A_Args[2]
                     }
                  }
               }
   }

   FN := Trim(FN)
   FNOut := Trim(FNOut)

   If !FN
   {
      ; Silent mode - write error to log file instead of showing msgbox
      errorMsg := ""
      if A_Args.Length > 0 {
         errorMsg := "Invalid command line parameters. Error 48"
      } else {
         errorMsg := "No source file specified. Error AA"
      }
      FileAppend(errorMsg . "`n", A_ScriptDir "\conversion_errors.log")
      ExitApp
   }

   If !FNOut
   {
      FNOut := SubStr(FN, 1, StrLen(FN) - 4) . MyOutExt   ;***USE OUTPUT EXTENSION OPTION***
   }

   if (!FileExist(FN))
   {
      errorMsg := "Source file not found: " . FN . " Error BB"
      FileAppend(errorMsg . "`n", A_ScriptDir "\conversion_errors.log")
      ExitApp
   }

   try {
      inscript := FileRead(FN)
      outscript := Convert(inscript)
      outfile := FileOpen(FNOut, "w", "utf-8")
      outfile.Write(outscript)
      outfile.Close()

      ; Log success instead of showing dialog
      successMsg := "Conversion complete: " . FN . " -> " . FNOut
      FileAppend(successMsg . "`n", A_ScriptDir "\conversion_log.txt")
   }
   catch Error as err {
      errorMsg := "Conversion failed for " . FN . ": " . err.Message
      FileAppend(errorMsg . "`n", A_ScriptDir "\conversion_errors.log")
   }

   ExitApp
} ;MAIN PROGRAM - ENDS HERE *******************************************************************************************
;######################################################################################################################
;##### FUNCTIONS(): #####
;######################################################################################################################
#Include ConvertFuncs.ahk
;######################################################################################################################
;##### HOTKEYS: #####
;######################################################################################################################
; EXIT APPLICATION; EXIT APPLICATION; EXIT APPLICATION
Esc::
{ ;Exit application - Using either <Esc> Hotkey or Goto("MyExit")
   ExitApp
   Return
}