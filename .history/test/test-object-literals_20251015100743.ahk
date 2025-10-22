#Requires AutoHotkey v2.1-alpha.16
#SingleInstance Force

; ============================================================================
; SECTION 1: Arrow Syntax - Single Line vs Multi-Line
; ============================================================================

; ❌ WRONG: Arrow syntax with multi-line block
WrongArrowMultiline() {
    calculator := {
        add: (a, b) => a + b,
        divide: (a, b)  {
            if (b = 0)
                throw ValueError("Division by zero")
            return a / b
        }
    }
    return calculator
}

; ✅ CORRECT: Multi-line uses regular function syntax
CorrectArrowMultiline() {
    calculator := {
        add: (a, b) => a + b,
        divide: (a, b) {
            if (b = 0)
                throw ValueError("Division by zero")
            return a / b
        }
    }
    return calculator
}

; ============================================================================
; SECTION 2: Data Storage - Object Literal vs Map
; ============================================================================

; ❌ WRONG: Using object literal for configuration data
WrongDataStorage() {
    settings := {
        width: 800,
        height: 600,
        theme: "dark",
        fontSize: 12
    }
    
    settings.width := 1024
    MsgBox("Width: " . settings.width)
}

; ✅ CORRECT: Using Map for configuration data
CorrectDataStorage() {
    settings := Map(
        "width", 800,
        "height", 600,
        "theme", "dark",
        "fontSize", 12
    )
    
    settings["width"] := 1024
    MsgBox("Width: " . settings["width"])
}

; ============================================================================
; SECTION 3: DefineProp - Property Descriptors
; ============================================================================

; ❌ WRONG: Arrow syntax with multi-line block in DefineProp
WrongDefineProp() {
    person := {}
    person.DefineProp("age", {
        get: (this) => this._age ?? 0,
        set: (this, value) => {
            if (value < 0 || value > 150)
                throw ValueError("Age must be 0-150")
            this._age := value
        }
    })
    
    person.age := 25
    MsgBox("Age: " . person.age)
}

; ✅ CORRECT: Multi-line set descriptor uses regular syntax
CorrectDefineProp() {
    person := {}
    person.DefineProp("age", {
        get: (this) => this._age ?? 0,
        set: (this, value) {
            if (value < 0 || value > 150)
                throw ValueError("Age must be 0-150")
            this._age := value
        }
    })
    
    person.age := 25
    MsgBox("Age: " . person.age)
}

; ============================================================================
; SECTION 4: GUI Event Handlers - Inline vs Method
; ============================================================================

; ❌ WRONG: Multi-line arrow function in event handler
class WrongGuiPattern {
    __New() {
        this.gui := Gui("+Resize", "Wrong Pattern")
        this.nameEdit := this.gui.AddEdit("w200")
        this.submitBtn := this.gui.AddButton("w100", "Submit")
        
        this.submitBtn.OnEvent("Click", (*) => {
            name := this.nameEdit.Value
            if (name.Length > 0) {
                MsgBox("Hello " . name)
                this.nameEdit.Value := ""
            }
        })
        
        this.gui.Show("w300 h150")
    }
}

; ✅ CORRECT: Extract to method with .Bind(this)
class CorrectGuiPattern {
    __New() {
        this.gui := Gui("+Resize", "Correct Pattern")
        this.nameEdit := this.gui.AddEdit("w200")
        this.submitBtn := this.gui.AddButton("w100", "Submit")
        this.submitBtn.OnEvent("Click", this.HandleSubmit.Bind(this))
        this.gui.Show("w300 h150")
    }
    
    HandleSubmit(*) {
        name := this.nameEdit.Value
        if (name.Length > 0) {
            MsgBox("Hello " . name)
            this.nameEdit.Value := ""
        }
    }
}

; ============================================================================
; SECTION 5: Class Properties - Arrow vs Block
; ============================================================================

; ❌ WRONG: Arrow syntax with multi-line block in class property
class WrongClassProperty {
    __New(width, height) {
        this._width := width
        this._height := height
    }
    
    Width {
        get => this._width
        set => {
            if (value <= 0)
                throw ValueError("Width must be positive")
            this._width := value
        }
    }
    
    Area {
        get => this._width * this._height
    }
}

; ✅ CORRECT: Multi-line set uses block syntax without arrow
class CorrectClassProperty {
    __New(width, height) {
        this._width := width
        this._height := height
    }
    
    Width {
        get => this._width
        set {
            if (value <= 0)
                throw ValueError("Width must be positive")
            this._width := value
        }
    }
    
    Area {
        get => this._width * this._height
    }
}

; ============================================================================
; SECTION 6: Complex Validator Object
; ============================================================================

; ❌ WRONG: Mixed arrow/block patterns
WrongValidator() {
    validator := {
        isPositive: (n) => n > 0,
        isInRange: (n, min, max) => {
            if (n < min)
                return false
            if (n > max)
                return false
            return true
        },
        isEmail: (str) => RegExMatch(str, "^[^@]+@[^@]+\.[^@]+$")
    }
    return validator
}

; ✅ CORRECT: Consistent syntax usage
CorrectValidator() {
    validator := {
        isPositive: (n) => n > 0,
        isInRange: (n, min, max) {
            if (n < min)
                return false
            if (n > max)
                return false
            return true
        },
        isEmail: (str) => RegExMatch(str, "^[^@]+@[^@]+\.[^@]+$")
    }
    return validator
}

; ============================================================================
; DEMONSTRATION MENU
; ============================================================================

DemoMenu()

class DemoMenu {
    __New() {
        this.gui := Gui("+Resize", "Object Literal Patterns Demo")
        this.gui.SetFont("s10")
        
        this.gui.AddText("xm Section", "Select a demonstration:")
        
        this.gui.AddButton("xm w250", "1. Arrow Syntax (Correct)").OnEvent("Click", (*) => CorrectArrowMultiline())
        this.gui.AddButton("xm w250", "2. Data Storage (Correct)").OnEvent("Click", (*) => CorrectDataStorage())
        this.gui.AddButton("xm w250", "3. DefineProp (Correct)").OnEvent("Click", (*) => CorrectDefineProp())
        this.gui.AddButton("xm w250", "4. GUI Pattern (Correct)").OnEvent("Click", (*) => CorrectGuiPattern())
        this.gui.AddButton("xm w250", "5. Class Property (Correct)").OnEvent("Click", this.DemoClassProperty.Bind(this))
        this.gui.AddButton("xm w250", "6. Validator (Correct)").OnEvent("Click", this.DemoValidator.Bind(this))
        
        this.gui.AddText("xm Section", "Note: Wrong patterns are commented in code")
        this.gui.AddButton("xm w250", "Close").OnEvent("Click", (*) => this.gui.Hide())
        
        this.gui.Show("w300 h300")
    }
    
    DemoClassProperty(*) {
        rect := CorrectClassProperty(10, 5)
        MsgBox("Rectangle Area: " . rect.Area . "`nWidth: " . rect.Width)
    }
    
    DemoValidator(*) {
        validator := CorrectValidator()
        result1 := validator.isPositive(5) ? "Valid" : "Invalid"
        result2 := validator.isInRange(50, 0, 100) ? "Valid" : "Invalid"
        result3 := validator.isEmail("test@example.com") ? "Valid" : "Invalid"
        
        MsgBox("Validator Results:`n"
            . "isPositive(5): " . result1 . "`n"
            . "isInRange(50, 0, 100): " . result2 . "`n"
            . "isEmail(test@example.com): " . result3)
    }
}