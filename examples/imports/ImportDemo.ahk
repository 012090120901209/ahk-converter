#Requires AutoHotkey v2.0
#SingleInstance Force

/**
 * Import Feature Demo
 *
 * This file demonstrates the AHKv2 Toolbox import management features:
 * - Named imports
 * - Import aliases
 * - IntelliSense support
 * - Hover information
 * - Go to definition
 * - Diagnostics and validation
 */

; Named imports - import specific functions
import {StrPad, StrTrunc, ToTitleCase} from StringUtils

; Import with alias to avoid naming conflicts
import {Logger} from Logger

; Import multiple math functions
import {Clamp, Average, IsPrime, Factorial} from MathUtils

/**
 * Demo: String utilities
 */
DemoStringUtils() {
    Logger.Info("Running String Utils Demo")

    ; Pad string to width
    padded := StrPad("Hello", 20, ".")
    Logger.Debug("Padded string: " padded)

    ; Truncate long text
    longText := "This is a very long string that needs to be truncated"
    truncated := StrTrunc(longText, 20)
    Logger.Debug("Truncated: " truncated)

    ; Title case conversion
    title := ToTitleCase("hello world from ahk")
    Logger.Debug("Title case: " title)

    MsgBox Format("String Utils Demo:`n`nPadded: {1}`nTruncated: {2}`nTitle: {3}",
        padded, truncated, title)
}

/**
 * Demo: Math utilities
 */
DemoMathUtils() {
    Logger.Info("Running Math Utils Demo")

    ; Clamp values
    value := 150
    clamped := Clamp(value, 0, 100)
    Logger.Debug("Clamped " value " to " clamped)

    ; Calculate average
    numbers := [10, 20, 30, 40, 50]
    avg := Average(numbers)
    Logger.Debug("Average of array: " avg)

    ; Check prime numbers
    testNum := 17
    isPrime := IsPrime(testNum)
    Logger.Debug(testNum " is prime: " isPrime)

    ; Calculate factorial
    factNum := 5
    fact := Factorial(factNum)
    Logger.Debug("Factorial of " factNum " is " fact)

    result := Format(
        "Math Utils Demo:`n`n"
        "Clamped 150 to [0-100]: {1}`n"
        "Average of [10,20,30,40,50]: {2}`n"
        "Is 17 prime?: {3}`n"
        "Factorial of 5: {4}",
        clamped, avg, isPrime, fact
    )

    MsgBox result
}

/**
 * Demo: Logger functionality
 */
DemoLogger() {
    ; Clear previous log
    Logger.Clear()

    ; Log at different levels
    Logger.Debug("This is a debug message")
    Logger.Info("Application started successfully")
    Logger.Warn("This is a warning message")
    Logger.Error("This is an error message")

    logPath := Logger.GetPath()
    MsgBox "Logged messages to:`n" logPath "`n`nCheck the file to see the log output."

    ; Open log file
    Run logPath
}

/**
 * Main entry point
 */
Main() {
    ; Initialize logger
    Logger.SetLevel("DEBUG")
    Logger.Info("========================================")
    Logger.Info("Import Feature Demo Started")
    Logger.Info("========================================")

    ; Show menu
    choice := MsgBox(
        "Import Feature Demo`n`n"
        "Choose a demo to run:`n`n"
        "Yes = String Utils`n"
        "No = Math Utils`n"
        "Cancel = Logger Demo",
        "Import Demo",
        "YesNoCancel"
    )

    switch choice {
        case "Yes":
            DemoStringUtils()
        case "No":
            DemoMathUtils()
        case "Cancel":
            DemoLogger()
        default:
            return
    }

    Logger.Info("Demo completed successfully")
    Logger.Info("========================================")
}

; Run the demo
Main()

/**
 * Try these features in VS Code:
 *
 * 1. INTELLISENSE:
 *    - Type "import {" and see suggested symbols
 *    - Type "Logger." and see available methods
 *
 * 2. HOVER:
 *    - Hover over "StrPad" to see its definition
 *    - Hover over "Logger" to see module info
 *    - Hover over "MathUtils" in import to see all exports
 *
 * 3. GO TO DEFINITION:
 *    - F12 on "StrPad" to jump to definition
 *    - F12 on "StringUtils" to open the module
 *    - Alt+F12 to peek definition
 *
 * 4. FIND REFERENCES:
 *    - Right-click on "Logger" and select "Find All References"
 *    - See everywhere Logger is used in this file
 *
 * 5. CODE ACTIONS:
 *    - Try importing a non-existent symbol to see diagnostics
 *    - Right-click on an import and select "Organize Imports"
 *    - Add a new symbol usage, get quick fix to add import
 *
 * 6. COMMANDS:
 *    - Ctrl+Shift+P: "AHK: Show Module Exports"
 *    - Ctrl+Shift+P: "AHK: Organize Imports"
 *    - Ctrl+Shift+P: "AHK: Add Import"
 */

/*
 * EXPERIMENT WITH THESE:
 *
 * Uncomment these lines one at a time to see diagnostics:
 */

; import {NonExistentFunc} from StringUtils  ; ← Error: symbol not exported
; import NonExistentModule                   ; ← Error: module not found
; import {UnusedSymbol} from MathUtils      ; ← Hint: unused import (if not used below)

/*
 * Try adding these imports and use the quick fixes:
 */

; Step 1: Uncomment this line
; result := IsPowerOfTwo(16)

; Step 2: Notice the error "IsPowerOfTwo is not defined"
; Step 3: Click the lightbulb or press Ctrl+. to see quick fixes
; Step 4: But this function doesn't exist in any module! (intentional demo)

/*
 * Module resolution examples:
 */

; These work because modules are in the same directory:
; import StringUtils           ; → Finds StringUtils.ahk
; import Logger               ; → Finds Logger.ahk
; import MathUtils           ; → Finds MathUtils.ahk

; If you had a module directory structure like:
; MyLib/
;   └── __Init.ahk
; You could import it with:
; import MyLib               ; → Would find MyLib/__Init.ahk
