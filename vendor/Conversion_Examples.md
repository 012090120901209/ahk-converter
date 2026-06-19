<AHK_VERSION_DIFFERENCES>
Never produce ANY Autohotkey v1 code, ever. This information needs to be used to check that the LLM knows the differences so it does not produce AHK v1 code under any circumstances. 
</AHK_VERSION_DIFFERENCES>

<BASIC_SYNTAX>
Script Structure: No more auto-execute section. Code executes from top to bottom, going around defined hotkeys.
Boilerplate: Removed need for `#NoEnv`, `SendMode Input`, `SetWorkingDir %A_ScriptDir%`, and `SetBatchLines, -1` as they're defaults in v2.

Command Syntax: Commands are now functions and don't support first comma.
```cpp
; v1
MsgBox, Hello World
Sleep, 1000

; v2
MsgBox "Hello World"
Sleep 1000
; OR
MsgBox("Hello World")
Sleep(1000)
```
Expression Handling: All parameters are expressions all the time - plain text requires quotes.
Multi-value Expressions: Return last value, not first value:
```cpp
; v1
return (varToReturn, tmp := 1234)  ; Returns varToReturn

; v2
return (tmp := 1234, varToReturn)  ; Returns varToReturn
```
Unset Variables: Variables start as `unset` (a state, not a value)
```cpp
; v1
if (param2 != "")

; v2
if IsSet(param2)
```
</BASIC_SYNTAX>

<VARIABLES_AND_ASSIGNMENTS>
Legacy Assignments: Removed. Use `:=` for all assignments.
```cpp
; v1
var = text

; v2
var := "text"
```
Variable Referencing: `%var%` syntax replaced with direct referencing.
```cpp
; v1
MsgBox, %var%

; v2
MsgBox var
```
Memory Allocation: `VarSetCapacity()` replaced with `Buffer()` objects.
```cpp
; v1
VarSetCapacity(var, 1024, 0)

; v2
var := Buffer(1024, 0)
```
Address Operator: Ampersand (`&`) is no longer the "address of" operator.
```cpp
; v1
DllCall("Function", "Ptr", &var)

; v2
DllCall("Function", "Ptr", var)  ; where var is a Buffer
```
Empty Variables: Unset is preferred over empty strings for clearing variables.
```cpp
; v1
var := ""

; v2
var := Unset  ; unless you specifically need an empty string
```
Default Parameters: Use `unset` for optional parameters.
```cpp
; v1
MyFunc(param1, param2 := "")

; v2
MyFunc(param1, param2 := unset)
```
</VARIABLES_AND_ASSIGNMENTS>

<FUNCTIONS_AND_COMMANDS>
Commands as Functions: All commands are now functions.
```cpp
; v1
FileAppend, Text, filename.txt

; v2
FileAppend("Text", "filename.txt")
```
Function Parameter Passing: `ByRef` is now done with ampersand (`&`), must be specified by both caller and callee.
```cpp
; v1
MyFunc(ByRef a) {
    a++
}
MyFunc(var)

; v2
MyFunc(&a) {
    a++
}
MyFunc(&var)
```
First-Class Functions: Functions can be passed directly as references.
```cpp
; v1
Execute(Func("MsgBox"))

; v2
Execute(MsgBox)
```
Fat Arrow Syntax: Enables concise function definition.
```cpp
; v1
ShowMsg(text) {
    MsgBox text
    return text
}

; v2
ShowMsg(text) => (MsgBox(text), text)
```
Closures: Functions can be defined inside other functions.
```cpp
; v2 only
CounterFactory(start) {
    count := start
    Counter() {
        count++
        return count
    }
    return Counter
}
myCounter := CounterFactory(0)
MsgBox myCounter()  ; 1
MsgBox myCounter()  ; 2
```
Global Variable Access: Functions can read globals by default but not write to them.
```cpp
; v2
global_var := 1

SomeFunc() {
    MsgBox global_var  ; Can read this
    global global_var  ; Declare global to modify
    global_var++       ; Now can modify
}
```
</FUNCTIONS_AND_COMMANDS>

<OBJECTS_AND_ARRAYS>
Object Types: Objects now have specific sub-types: Map, Array, etc.
```cpp
; v1
obj := {key: "value"}

; v2
obj := Map("key", "value")
```
Array Creation: Both bracket notation and Array() still work.
```cpp
; v1 and v2
arr := []
arr := Array()
```
Property vs. Item Store: Objects have two stores.
```cpp
; v2
obj := Map("name", "John")
obj.Count  ; Accesses property "Count" (built-in property)
obj["name"]  ; Accesses item "name" (user data)
```
Object Literal Restrictions: Don't use object literals for data storage in v2.
```cpp
; Incorrect in v2
config := {width: 800, height: 600}

; Correct in v2
config := Map("width", 800, "height", 600)
```
Accessing Map Items: Use square brackets instead of dot notation for map items.
```cpp
; v2
myMap := Map("name", "John")
name := myMap["name"]  ; Correct
name := myMap.name     ; Incorrect for map items
```
</OBJECTS_AND_ARRAYS>

<CLASSES_AND_OOP>
Class Creation: No more `new` keyword.
```cpp
; v1
obj := new MyClass()

; v2
obj := MyClass()
```
Static vs Instance: Clear separation between static and instance members.
```cpp
; v2
class Example {
    static Config := "default"  ; Static property
    data := ""                  ; Instance property
    
    static ShowConfig() {       ; Static method
        MsgBox Example.Config   ; Access via class name
    }
    
    ShowData() {                ; Instance method
        MsgBox this.data        ; Access via this
    }
}
```
Object Initialization: Classes should be initialized at the top of the script.
```cpp
; v2
MyApp()  ; Initialize at the top

class MyApp {
    __New() {
        MsgBox "Application initialized"
    }
}
```
Properties: More concise property syntax with fat arrow.
```cpp
; v2
class Person {
    _name := ""
    
    name {
        get => this._name
        set => this._name := value
    }
    
    ; Or even shorter
    shortProp => Expression
}
```
Inheritance: Extends keyword for inheritance.
```cpp
; v2
class Child extends Parent {
    __New() {
        super.__New()  ; Call parent constructor
    }
}
```
Method Binding: Methods must be explicitly bound for callbacks.
```cpp
; v2
class MyClass {
    Setup() {
        button := this.gui.AddButton("Click Me")
        button.OnEvent("Click", this.HandleClick.Bind(this))
    }
    
    HandleClick(*) {
        MsgBox "Button clicked"
    }
}
```
</CLASSES_AND_OOP>

<GUI_SYSTEM>
Object-Oriented GUIs: GUIs are now fully object-oriented.
```cpp
; v1
Gui, Add, Button, gButtonClick, Click Me
Gui, Show

; v2
myGui := Gui()
myGui.AddButton("", "Click Me").OnEvent("Click", ButtonClick)
myGui.Show()
```
Event Handling: Uses OnEvent instead of labels.
```cpp
; v1
Gui, +Label MyGui
; ...
MyGuiClose:
ExitApp

; v2
myGui.OnEvent("Close", (*) => ExitApp())
```
Control References: Store control references for later access.
```cpp
; v2
myGui := Gui()
myEdit := myGui.AddEdit("w200")
myButton := myGui.AddButton("", "Submit")

; Later
textValue := myEdit.Value
```
Gui Structure: Preferred class-based approach.
```cpp
; v2
MyAppGui()

class MyAppGui {
    __New() {
        this.gui := Gui("+Resize", "My Application")
        this.gui.AddEdit("w200")
        this.gui.AddButton("", "OK").OnEvent("Click", this.HandleClick.Bind(this))
        this.gui.Show()
    }
    
    HandleClick(*) {
        this.gui.Hide()
    }
}
```
Maps for Control Storage: Use Maps for storing controls.
```cpp
; v2
class MyGui {
    __New() {
        this.gui := Gui()
        this.controls := Map()
        this.controls["edit"] := this.gui.AddEdit("w200")
        this.controls["button"] := this.gui.AddButton("", "Submit")
    }
}
```
</GUI_SYSTEM>

<ERROR_HANDLING>
Try-Catch Structure: Modern exception handling.
```cpp
; v2
try {
    FileRead("nonexistent.txt")
} catch OSError as err {
    MsgBox "File error: " err.Number ": " err.Message
} catch as err {
    MsgBox "Unknown error: " err.Message
}
```
Error Object Properties: Enhanced error information.
```cpp
; v2
try {
    ; Risky code
} catch as err {
    MsgBox "Error: " err.Message "`n"
          . "File: " err.File ":" err.Line "`n"
          . "What: " err.What
}
```
Custom Errors: Throw custom errors with context.
```cpp
; v2
ValidateInput(value) {
    if (value < 0)
        throw ValueError("Value must be positive", "ValidateInput", value)
}
```
Finally Block: For cleanup regardless of errors.
```cpp
; v2
file := 0
try {
    file := FileOpen("data.txt", "r")
    ; Process file
} catch as err {
    MsgBox "Error: " err.Message
} finally {
    if file
        file.Close()
}
```
</ERROR_HANDLING>

<HOTKEYS_AND_HOTSTRINGS>
Hotkey as Functions: Hotkeys are now functions.
```cpp
; v1
F1::
MsgBox Press F1
return

; v2
F1:: {
    MsgBox "Press F1"
}
; OR
F1::MsgBox "Press F1"
```
Global Variables in Hotkeys: Need to explicitly declare globals.
```cpp
; v2
counter := 0

F2:: {
    global counter
    counter++
    MsgBox "Counter: " counter
}
```
Multiple Hotkeys: Can share code via functions.
```cpp
; v2
HandleHotkey(key) {
    MsgBox "Pressed: " key
}

F1::HandleHotkey("F1")
F2::HandleHotkey("F2")
```
Context-Sensitive Hotkeys: Same approach but with cleaner syntax.
```cpp
; v2
#HotIf WinActive("ahk_class Notepad")
^s::MsgBox "Save in Notepad"
#HotIf
```
</HOTKEYS_AND_HOTSTRINGS>

<LOOPS_AND_FLOW_CONTROL>
For Loops: Direct value iteration.
```cpp
; v1
For i, v in ["a", "b", "c"]
    MsgBox % v

; v2
For v in ["a", "b", "c"]
    MsgBox v
```
For Each Equivalent: Key-value iteration.
```cpp
; v2
data := Map("name", "John", "age", 30)
For key, value in data
    MsgBox key ": " value
```
Until Loops: Combined with Do.
```cpp
; v1
Loop {
    i++
} Until (i >= 10)

; v2
Do {
    i++
} Until (i >= 10)
```
Continue and Break: Work the same way.
```cpp
; v2
Loop 10 {
    if (A_Index = 5)
        continue
    if (A_Index = 8)
        break
    MsgBox A_Index
}
```
</LOOPS_AND_FLOW_CONTROL>

<STRINGS_AND_TEXT>
String Concatenation: `.=` operator and concatenation with `.`.
```cpp
; v2
str := "Hello"
str .= " World"  ; str now "Hello World"
fullName := firstName . " " . lastName
```
Escape Sequences: Back-tick (\`) still used as escape character.
```cpp
; v2
str := "Line 1`nLine 2"    ; Newline
str := "Tab`tafter"        ; Tab
str := "Escaped `"quotes`"" ; Quotes
```
Single-Quoted Strings: Can contain double quotes without escaping.
```cpp
; v2
str := 'He said "hello" to me'  ; No need to escape double quotes
```
String Joining: Methods for array-to-string conversion.
```cpp
; v2
arr := ["apple", "banana", "orange"]
result := ""
For item in arr
    result .= item (A_Index < arr.Length ? ", " : "")

; Or alternative
result := ""
For item in arr
    result .= item ", "
result := RTrim(result, ", ")
```
</STRINGS_AND_TEXT>

<MISCELLANEOUS>
ComCall: Simplifies COM object method calls.
```cpp
; v2
obj := ComObject("{00000000-0000-0000-0000-000000000000}")
ComCall(3, obj)  ; Call the 3rd method in the vtable
```
OwnProps Method: Get object's own property names.
```cpp
; v2
obj := {prop1: 1, prop2: 2}
For propName in obj.OwnProps()
    MsgBox propName ": " obj.%propName%
```
Include Directive: Similar but with more features.
```cpp
; v2
#Include Lib/All.ahk  ; Include a file
```
Built-in Variables: Most are still available but accessed directly.
```cpp
; v1
MsgBox, %A_ScriptDir%

; v2
MsgBox A_ScriptDir
```
DllCall Return Type: Simpler syntax.
```cpp
; v2
result := DllCall("User32\MessageBox", "Ptr", 0, "Str", "Text", "Str", "Title", "UInt", 0)
```
</MISCELLANEOUS>

<BEST_PRACTICES>
Use Maps for Data: Always use Map() for key-value data structures.
```cpp
; Correct
config := Map("width", 800, "height", 600)

; Incorrect
config := {width: 800, height: 600}
```
Class-Based Architecture: Use classes for organizing code.
```cpp
MyApp()  ; Initialize

class MyApp {
    __New() {
        this.Initialize()
    }
    
    Initialize() {
        ; Setup code
    }
}
```
Chaining Methods: Fluent interfaces are supported.
```cpp
myGui.AddButton("w200", "OK")
      .OnEvent("Click", this.HandleClick.Bind(this))
      .Focus()
```
Explicit Variable Declaration: Helps avoid scope issues.
```cpp
global globalVar := "Global scope"

SomeFunction() {
    local localVar := "Function scope"
    static staticVar := "Persistent across calls"
}
```
Method Binding: Always bind methods for callbacks.
```cpp
button.OnEvent("Click", this.HandleClick.Bind(this))
```
</BEST_PRACTICES>

<CONVERSION_STRATEGIES>
Step-by-Step Approach: Convert scripts in stages.
1. Fix variable assignments (= to :=)
2. Update command syntax to function calls
3. Restructure objects and arrays
4. Update GUI code to OOP style
5. Rewrite hotkeys as functions

Automated Tools: Use AHK-v2-script-converter for initial conversion.

Testing Strategy: Test each component after conversion.

Keep Common Patterns in Mind:
- v1: Legacy variables with %var%
- v2: Direct variable references

Debugging Tips:
- Use Try-Catch to catch conversion issues
- Leverage ListVars command to inspect variables
- Use OutputDebug for logging
</CONVERSION_STRATEGIES>