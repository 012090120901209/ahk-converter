---
description: AutoHotkey v2 coding standards and best practices
applyTo: "**/*.ahk,**/*.ahk2"
---

# AutoHotkey v2 Development Standards

You are an expert AutoHotkey v2 developer. Follow these standards strictly when writing or reviewing AHK v2 code.

## Critical AHK v2 Syntax Rules

- All scripts use `.ahk` or `.ahk2` extensions (never `.ahv`)
- Everything is an expression - no v1 statement mode exists
- Always use `:=` for assignment (never use `=` for assignment)
- Arrays are 1-indexed (not 0-indexed like JavaScript)
- COM objects use `ComObject()` function (not `ComObjCreate()` from v1)
- String concatenation uses `.` operator (e.g., `str := "Hello" . " World"`)
- All function calls require parentheses, even with no arguments (e.g., `A_Now()`)

## Common v1 to v2 Migration Pitfalls

**Never use these v1 patterns:**
- `=` for assignment → Use `:=`
- `ComObjCreate()` → Use `ComObject()`
- `if var =` → Use `if (var ==` or `if (var)`
- `StringReplace` command → Use `StrReplace()` function
- `StringSplit` command → Use `StrSplit()` function
- `MsgBox, text` → Use `MsgBox(text)`
- Expression-less `if` statements → Always use parentheses: `if (condition)`

## File Paths and String Escaping

- Use `\\` or `/` for path separators (backslash requires escaping in strings)
- Prefer forward slashes `/` for cross-platform compatibility
- Use raw strings for regex patterns: ``r"regex\d+"``
- Escape special characters in normal strings: `"C:\\Users\\Name"`

## Functions and Methods

- Always use `()` in function definitions: `MyFunc() { }`
- Use descriptive parameter names (no single letters except loop indices `i`, `j`, `k`)
- ByRef parameters use `&var` syntax: `MyFunc(&outputVar)`
- Optional parameters use default values: `MyFunc(required, optional := "default")`
- Return values explicitly with `return` statement
- Use early returns to reduce nesting depth

## Classes and Objects

- Always use `this.` prefix for class properties and methods
- Class names use PascalCase: `class MyClassName`
- Method names use PascalCase: `MyMethod()`
- Property names use PascalCase: `this.PropertyName`
- Use `__New()` for constructors (double underscore)
- Use `__Delete()` for cleanup/destructors
- Prefer composition over deep inheritance hierarchies

## GUI Development

- Use object syntax: `myGui := Gui()`
- Never use v1 GUI commands (`Gui, Add, ...`)
- Set GUI options via object methods: `myGui.Opt("+Resize")`
- Add controls via object methods: `myGui.Add("Button", "x10 y10", "Click Me")`
- Bind event handlers properly: `.OnEvent("Click", this.MyHandler.Bind(this))`
- Always call `myGui.Show()` to display
- Store control references for later access: `this.myButton := myGui.Add("Button", ...)`

## Error Handling

- Use `try/catch` blocks for risky operations
- Include error handling for all file operations
- Include error handling for all COM object operations
- Catch specific error types when possible
- Always clean up resources in `finally` blocks or destructors

## Code Style and Best Practices

- Prefer early returns over deep nesting (max 3 levels)
- Use descriptive variable names (no abbreviations unless standard)
- Add comments only for complex logic (code should be self-documenting)
- Use blank lines to separate logical sections
- Indent with 4 spaces or 1 tab (be consistent)
- Break long lines at logical points (after operators, before parameters)

## Variable Scope

- Declare global variables explicitly: `global myVar := value`
- Declare static variables explicitly: `static counter := 0`
- Local variables are default in functions (no declaration needed)
- Avoid global variables when possible (use class properties or parameters)
- Use `super` keyword to access parent class methods: `super.MethodName()`

## Common Patterns

**Ternary operator:**
```ahk
result := (condition) ? valueIfTrue : valueIfFalse
```

**String formatting:**
```ahk
text := Format("Value: {1}, Name: {2}", value, name)
```

**Array iteration:**
```ahk
for index, value in myArray {
    ; index starts at 1
}
```

**Object property iteration:**
```ahk
for key, value in myObject.OwnProps() {
    ; iterate properties
}
```

**File read:**
```ahk
content := FileRead("path/to/file.txt")
```

**File write:**
```ahk
FileAppend(content, "path/to/file.txt")  ; append
FileDelete("path/to/file.txt")           ; delete first
FileAppend(content, "path/to/file.txt")  ; then write
```

## Testing and Validation

- Test window detection with proper timeouts
- Validate all file paths exist before operations
- Check return values from API calls
- Test with both 32-bit and 64-bit AHK v2 when relevant
- Include cleanup/exit handlers for production scripts

## Headers and Directives

- Use `#Requires AutoHotkey v2.0` or higher at the top
- Use `#SingleInstance Force` for single-instance scripts
- Place all directives before any code
- Common directives: `#NoTrayIcon`, `#Warn All`, `#ErrorStdOut`

## Never Do These Things

- Mix v1 and v2 syntax (always pure v2)
- Use global variables without explicit declaration
- Forget to escape backslashes in paths: `"C:\Users"` → ERROR
- Assume 0-indexed arrays (always 1-indexed)
- Use old command syntax instead of function calls
- Create GUI elements without storing references
- Forget `.Bind(this)` when passing method callbacks
- Use blocking operations in GUI event handlers (use `SetTimer` instead)

## When Uncertain

- Check the official AutoHotkey v2 documentation at https://www.autohotkey.com/docs/v2/
- Prefer function calls over commands
- Prefer object-oriented approaches for complex scripts
- When converting v1 code, rewrite entirely rather than patch
- Test all GUI code thoroughly with user interactions
