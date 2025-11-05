# Chat Participant Usage Examples

This guide demonstrates practical usage scenarios for the AHKv2 Toolbox chat participant.

---

## 🎯 Quick Reference

| Command | When to Use | Example |
|---------|-------------|---------|
| `/convert` | Converting v1 code | `@ahk /convert MsgBox % "Hello"` |
| `/explain` | Learning concepts | `@ahk /explain What are classes?` |
| `/fix` | Debugging errors | `@ahk /fix Why does this crash?` |
| `/optimize` | Performance tuning | `@ahk /optimize This loop is slow` |
| `/example` | Need code sample | `@ahk /example GUI with buttons` |
| `/syntax` | Validate code | `@ahk /syntax` |
| `/symbols` | View structure | `@ahk /symbols` |
| `/codemap` | File overview | `@ahk /codemap` |
| `/dependencies` | Check includes | `@ahk /dependencies` |
| `/workspace` | Full context | `@ahk /workspace` |
| `/attribute` | Library credits | `@ahk /attribute` |
| `/refactor` | Code refactoring | `@ahk /refactor` |
| `/best-practices` | Code review | `@ahk /best-practices` |
| `/test` | Generate tests | `@ahk /test` |

---

## 📚 Scenario-Based Examples

### Scenario 1: Starting a New Project

**Situation:** You're creating a new AHK script and want to understand best practices.

```
User: @ahk /workspace
```

**What you get:**
- Code structure of your current file
- All dependencies
- Symbol overview
- Context for follow-up questions

**Follow-up:**
```
User: @ahk /example How do I create a modern GUI with tabs?
```

---

### Scenario 2: Converting Old Code

**Situation:** You have a v1 script that needs updating.

**Step 1: Check for v1 patterns**
```
User: @ahk /syntax
```

**Output:**
```markdown
### Syntax Validation
**Issues Found:** 8

#### v1 Syntax Contamination
**Line 5:**
- ❌ Assignment using `=` instead of `:=`

**Line 12:**
- ⚠️ v1-style variable deref `%var%` - use `var` directly

**Line 20:**
- ⚠️ Legacy MsgBox syntax - use `MsgBox("text")`
```

**Step 2: Convert each issue**
```
User: @ahk /convert MsgBox, % "Hello " . name
```

**Output:**
```ahk
MsgBox("Hello " . name)
```

**Step 3: Verify clean syntax**
```
User: @ahk /syntax
```

**Output:**
```markdown
✅ **No syntax issues found!**
Your code appears to use proper AHK v2 syntax.
```

---

### Scenario 3: Debugging Complex Code

**Situation:** Your script throws an error but you're not sure why.

**Step 1: Get workspace context**
```
User: @ahk /workspace
```

**Step 2: Ask with error details**
```
User: @ahk /fix Getting "Invalid memory access" error when clicking button
```

**What happens:**
- LLM receives automatic context:
  - Your file structure
  - Function signatures
  - Current diagnostics
  - Recent errors from output channel
- Provides targeted fix

**Example response:**
```markdown
The error suggests you're accessing a freed object. Looking at your code:

```ahk
; Problem: myGui is freed before button is clicked
myGui := Gui()
myGui.Add("Button", "x10 y10", "Click").OnEvent("Click", ButtonClicked)
myGui.Show()
myGui := ""  ; ⚠️ This frees the GUI!

ButtonClicked(*) {
    MsgBox("Clicked")  ; ❌ Error here - GUI is freed
}
```

**Fix:** Don't reassign myGui to empty string, or make it persistent.
```

---

### Scenario 4: Understanding Project Structure

**Situation:** You've inherited a codebase and need to understand it.

**Step 1: View dependencies**
```
User: @ahk /dependencies
```

**Output:**
```markdown
### Dependency Map Snapshot
**Root:** `Main.ahk`

```text
[Root] Main.ahk
├── [Inc] Lib/Database.ahk
│   └── [Inc] Lib/SqlHelper.ahk
├── [Inc] Lib/GuiFramework.ahk
│   ├── [Inc] Lib/Controls.ahk
│   └── [Inc] Lib/Themes.ahk
└── [Missing] Lib/Logger.ahk
```

**Summary**
- Unique dependency files: 5
- Total resolved #Include links: 6
- Maximum include depth: 2
- Unresolved includes (1):
  - Lib/Logger.ahk
```

**Step 2: View symbols**
```
User: @ahk /symbols
```

**Output:**
```markdown
**Symbol Counts:**
- 🏛️ Classes: 3
- 🔧 Functions: 12
- ⚙️ Methods: 24
- 📦 Variables: 8
```

**Step 3: Ask specific questions**
```
User: @ahk What does the Database class do?
```

**What happens:**
- LLM has full context from `/workspace` and `/symbols`
- Can provide accurate answer about the Database class
- Includes information about its dependencies

---

### Scenario 5: Refactoring Code

**Situation:** Your code works but is getting messy and hard to maintain.

**Step 1: Analyze for refactoring**
```
User: @ahk /refactor
```

**Output:**
```markdown
### Refactoring Suggestions

**1. Extract Repeated Logic**
Lines 15-23 and 45-53 have duplicated validation logic. Extract to a function:

```ahk
ValidateUserInput(input) {
    if !IsObject(input) {
        throw ValueError("Input must be an object")
    }
    if !input.HasProp("name") || !input.HasProp("email") {
        throw ValueError("Missing required properties")
    }
    return true
}
```

**2. Simplify Nested Conditionals**
The nested if statements on lines 30-42 can be simplified using guard clauses:

```ahk
; Before (nested)
if condition1 {
    if condition2 {
        if condition3 {
            ; do work
        }
    }
}

; After (guard clauses)
if !condition1
    return
if !condition2
    return
if !condition3
    return
; do work
```

**3. Use Modern v2 Idioms**
Replace manual array building with Map for better performance:

```ahk
; Before
items := []
for key, value in data {
    items.Push(key)
}

; After
items := Map()
for key, value in data {
    items[key] := value
}
```
```

**Step 2: Apply suggestions**
Implement the refactorings one by one

**Step 3: Verify improvements**
```
User: @ahk /best-practices
```

---

### Scenario 6: Code Review

**Situation:** You want to review code before committing.

**Step 1: Syntax check**
```
User: @ahk /syntax
```

**Step 2: Get full overview**
```
User: @ahk /workspace
```

**Step 3: Best practices review**
```
User: @ahk /best-practices
```

**Output:**
```markdown
### Code Review: Best Practices

**✅ Good Practices Found:**
- Proper use of := for assignments
- Modern GUI object syntax
- Good error handling with try/catch

**⚠️ Improvement Opportunities:**

**1. Naming Conventions**
- Line 12: Variable `x` should be descriptive (e.g., `buttonXPosition`)
- Line 25: Function `proc` should use PascalCase (e.g., `ProcessData`)

**2. Error Handling**
- Lines 30-45: Add specific error types instead of generic Error
- Consider adding error recovery or cleanup in catch blocks

**3. Resource Management**
- Line 50: GUI object not explicitly destroyed
- Add cleanup in function exit or use proper object lifetime management

**4. Code Organization**
- Consider grouping related functions into a class
- Separate UI code from business logic

**Recommended Changes:**
```ahk
; Better naming
buttonXPosition := 10

; Specific error types
try {
    ProcessData(input)
} catch ValueError as err {
    ; Handle validation errors
} catch IOError as err {
    ; Handle file errors
}

; Proper cleanup
class MyApp {
    __Delete() {
        if this.HasProp("gui") {
            this.gui.Destroy()
        }
    }
}
```
```

---

### Scenario 7: Generating Tests

**Situation:** You want to ensure your functions are well-tested.

**Step 1: Generate test cases**
```
User: @ahk /test
```

**Output:**
```markdown
### Test Cases for Your Functions

**Functions to test:**
- ValidateEmail(email)
- ProcessUserData(userData, options)
- SaveToDatabase(record)

**Test Suite for ValidateEmail:**

```ahk
; Positive Test Cases
TestValidateEmail_ValidFormat() {
    assert ValidateEmail("user@example.com") == true
    assert ValidateEmail("test.user+tag@domain.co.uk") == true
}

; Negative Test Cases
TestValidateEmail_InvalidFormat() {
    assert ValidateEmail("invalid") == false
    assert ValidateEmail("@example.com") == false
    assert ValidateEmail("user@") == false
}

; Edge Cases
TestValidateEmail_EdgeCases() {
    assert ValidateEmail("") == false
    assert ValidateEmail(unset) throws ValueError
    assert ValidateEmail(123) throws TypeError
}
```

**Test Suite for ProcessUserData:**

```ahk
; Setup test data
TestProcessUserData_Setup() {
    global testUser := {name: "John", age: 30}
    global testOptions := {validate: true, sanitize: true}
}

; Positive Tests
TestProcessUserData_ValidInput() {
    result := ProcessUserData(testUser, testOptions)
    assert result.HasProp("name")
    assert result.name == "John"
}

; Error Handling Tests
TestProcessUserData_MissingOptions() {
    try {
        ProcessUserData(testUser, {})
        assert false, "Should have thrown error"
    } catch ValueError {
        ; Expected
    }
}
```

**Recommended Testing Framework:**
- Use a simple assert function or AHK testing library
- Run tests before commits
- Add tests to CI/CD pipeline
```

**Step 2: Implement tests**
Create test file and run tests

---

### Scenario 8: Learning AHK v2

**Situation:** You're new to AHK v2 and learning the differences from v1.

**Learning about classes:**
```
User: @ahk /explain How do classes work in v2?
```

**Getting examples:**
```
User: @ahk /example Create a simple class with properties and methods
```

**Understanding syntax:**
```
User: @ahk /explain What's the difference between := and = in v2?
```

**Checking your practice code:**
```
User: @ahk /syntax
```

---

### Scenario 7: Optimizing Performance

**Situation:** Your script is slow and you want to improve it.

**Step 1: Get current state**
```
User: @ahk /codemap
```

**Step 2: Ask for optimization**
```
User: @ahk /optimize This loop processes 10,000 items slowly:

Loop 10000 {
    result := ProcessItem(A_Index)
    SaveToFile(result)
}
```

**Example response:**
```markdown
Several optimizations:

1. **Batch file operations** - Don't save on every iteration
2. **Pre-allocate arrays** - Use Array() with capacity
3. **Cache repeated calculations** - Store results

**Optimized version:**
```ahk
results := Array()
results.Capacity := 10000  ; Pre-allocate

Loop 10000 {
    result := ProcessItem(A_Index)
    results.Push(result)
}

; Save once, not 10,000 times
SaveToFile(results)
```

**Performance gain:** ~100x faster by eliminating file I/O in loop
```

---

### Scenario 8: Working with Libraries

**Situation:** You're using a library and want to credit the author.

**Step 1: Attribute the library**
```
User: @ahk /attribute Lib/JsonParser.ahk
```

**Output:**
```markdown
🔍 Discovering metadata for `JsonParser.ahk`...

📦 **Library Information**

**Name:** JsonParser
**Author:** John Smith (@jsmith)
**Repository:** https://github.com/jsmith/ahk-json
**License:** MIT
**Version:** 2.1.0

**Description:**
High-performance JSON parser and serializer for AHK v2

**Key Functions:**
- JsonParse(str) - Parse JSON string
- JsonStringify(obj) - Convert object to JSON

💡 **What to do next:**
1. Review the metadata above for accuracy
2. Use the command palette: **AHKv2 Toolbox: Discover Library Metadata**
3. Choose to insert the header or copy to clipboard
```

---

## 💡 Pro Tips

### Tip 1: Combine Commands
```
User: @ahk /workspace

[Wait for response]

User: @ahk Now optimize the ProcessData function
```

The LLM has full context from `/workspace` and can provide targeted optimization.

### Tip 2: Reference Symbols
```
User: @ahk /symbols

[Review the output]

User: @ahk Explain how the ValidateInput function works
```

### Tip 3: Iterative Development
```
User: @ahk /example Create a GUI with a ListView

[Implement the code]

User: @ahk /syntax

[Fix any issues]

User: @ahk /optimize Can this be more efficient?
```

### Tip 4: Error Context is Automatic
When you use `/fix`, the chat participant automatically includes:
- Current diagnostics
- Runtime errors from output channel
- Code snippets around error locations
- Function signatures

So you can simply type:
```
User: @ahk /fix
```

And it will have all the context it needs!

### Tip 5: Use Natural Language
You don't always need commands:
```
User: @ahk Why isn't my hotkey working?
```

The chat participant will:
- Check your current file automatically
- Look for function definitions
- Check for syntax issues
- Provide relevant answer

---

## 🚀 Advanced Workflows

### Workflow 1: Full Code Audit
```
1. @ahk /workspace          # Get full context
2. @ahk /syntax             # Check for v1 contamination
3. @ahk /dependencies       # Verify includes are resolved
4. @ahk Review for security and best practices
5. @ahk /optimize Any performance issues?
```

### Workflow 2: Rapid Prototyping
```
1. @ahk /example Create [feature description]
2. [Paste code into editor]
3. @ahk /syntax             # Validate
4. @ahk /fix [any issues]
5. @ahk /optimize
```

### Workflow 3: Legacy Migration
```
1. Open v1 script
2. @ahk /syntax             # List all v1 patterns
3. @ahk /convert [each pattern]
4. @ahk /fix [resulting errors]
5. @ahk /syntax             # Verify clean
```

---

## 🎓 Learning Scenarios

### For Beginners
1. Start with `/explain` to learn concepts
2. Use `/example` to see working code
3. Practice and check with `/syntax`
4. Ask follow-up questions naturally

### For v1 Developers
1. Use `/syntax` to find v1 habits
2. Use `/convert` for each pattern
3. Use `/explain` for new v2 concepts
4. Use `/workspace` to understand project context

### For Advanced Users
1. Use `/workspace` for project overview
2. Use `/optimize` for performance tuning
3. Use `/symbols` for quick navigation
4. Combine commands for complex workflows

---

## 📊 Command Selection Guide

**Choose `/syntax` when:**
- ✅ You want to validate v2 syntax
- ✅ Checking for v1 contamination
- ✅ Quick syntax review before commit

**Choose `/symbols` when:**
- ✅ You want a quick structure overview
- ✅ Need to see all functions/classes
- ✅ Want symbol counts

**Choose `/codemap` when:**
- ✅ You need detailed structure
- ✅ Want to see nested relationships
- ✅ Need to share structure with LLM

**Choose `/dependencies` when:**
- ✅ Investigating include issues
- ✅ Understanding project dependencies
- ✅ Finding circular dependencies

**Choose `/workspace` when:**
- ✅ Starting a new conversation
- ✅ Want complete context
- ✅ Asking complex questions

---

## 🔗 Related Documentation

- [Testing Guide](../TESTING_CHAT_PARTICIPANT.md) - How to test all features
- [Implementation Summary](../CHAT_PARTICIPANT_IMPLEMENTATION_SUMMARY.md) - Technical details
- [Feature Roadmap](../NEW_CHAT_FEATURES_PLAN.md) - Planned enhancements
- [Chat Workspace Summaries](CHAT_WORKSPACE_SUMMARIES.md) - Original feature docs

---

## ❓ Troubleshooting

### "Chat participant not appearing"
- Check VS Code version (1.90+ required)
- Verify GitHub Copilot is installed and active
- Reload VS Code window
- See `TESTING_CHAT_PARTICIPANT.md`

### "No response from commands"
- Ensure an `.ahk` file is open and active
- Check Output panel for errors
- Verify GitHub Copilot subscription is active

### "Context seems incomplete"
- Use `/workspace` to force full context refresh
- Check that providers are loaded (Code Map and Dependency Map views)
- Verify file is saved (unsaved changes may not be reflected)

---

**Happy Coding with AHKv2 Toolbox! 🚀**
