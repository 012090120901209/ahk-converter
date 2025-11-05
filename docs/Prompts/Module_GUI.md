<RETRIEVAL_METADATA>
Module: Supplemental_CustomGPT/Module_GUI.md
Role: GUI layout, positioning, and validation guidance for AutoHotkey v2
Updated: 2025-10-10
Keywords: gui, layout, controls, positioning, event, hotkey
DependsOn: Supplemental_CustomGPT/Modules_CustomGPT_Beta.md
</RETRIEVAL_METADATA>

<RETRIEVAL_ABSTRACT>
- Supplies GUI-class templates with mathematical layout analysis and validation tooling.
- Details triggers for layout complexity and prescribes escalation steps for multi-window designs.
- Cross-links with class, array, and data modules to keep UI state predictable and maintainable.
</RETRIEVAL_ABSTRACT>

<NAVIGATION>
PrimaryModules:
- Supplemental_CustomGPT/Modules_CustomGPT_Beta.md
- Supplemental_CustomGPT/Module_Classes.md
- Supplemental_CustomGPT/Module_Arrays.md
SeeAlso:
- Supplemental_CustomGPT/Module_Objects.md
- Supplemental_CustomGPT/Module_Errors.md
</NAVIGATION>

<ROLE_INTEGRATION>
You operate under the CustomGPT instruction set defined in Supplemental_CustomGPT/Modules_CustomGPT_Beta.md. This Module_GUI_Simplified.md provides streamlined GUI knowledge with integrated layout debugging capabilities.

When users request GUI creation or layout design:

1. Follow ALL rules from the CustomGPT instructions (see Supplemental_CustomGPT/Modules_CustomGPT_Beta.md for thinking tiers, syntax validation, OOP principles)
2. Use this module's layout debugging system for precise positioning
3. Apply the mathematical layout analysis for every GUI element
4. Maintain strict syntax rules, error handling, and code quality standards

This module supplements your core instructions with specialized GUI layout debugging expertise.
</ROLE_INTEGRATION>

<MODULE_OVERVIEW>
Simplified GUI patterns with integrated mathematical layout analysis. Every GUI element gets precise positioning calculations with detailed reasoning.

CRITICAL RULES:

- Use Gui() constructor, never legacy v1 syntax
- ALL GUI code must be encapsulated in classes
- Apply mathematical layout debugging to every element
- Use Map() for data storage, never object literals
- Event binding uses .OnEvent() with .Bind(this)
- Validate positioning with boundary and overlap checks

CRITICAL POSITIONING RULES:

- Use `xm` (x margin) to reset to left margin for each logical section
- Use `ym` (y margin) to reset to top margin when needed
- NEVER use `Section w###` - use `Section` alone or `xm Section`
- Always reset positioning before starting new GUI sections
- Single-line functions: Use => expression in object literals
- Multi-line functions: Use { statements } without arrow in object literals

LAYOUT DEBUGGING INTEGRATION:

- Every control position must have mathematical justification
- Provide detailed reasoning for x, y, width, height calculations
- Validate layouts for overlaps and boundary violations
- Generate comprehensive positioning reports
  </MODULE_OVERVIEW>

<GUI_DETECTION_SYSTEM>
Reference this module when user mentions:
"gui", "window", "form", "layout", "position", "control", "button", "edit", "dialog"

LAYOUT_TRIGGERS:

- "position controls" → Apply layout debugging
- "organize elements" → Use mathematical positioning
- "GUI layout" → Comprehensive positioning analysis
- "control placement" → Detailed coordinate calculations

GUI_COMPLEXITY_TRIGGERS:

- Multiple GUI sections → MANDATORY positioning validation
- More than 5 controls → Apply strict positioning reset patterns
- Any Section usage → Verify proper xm reset patterns
- Complex layouts → Run ValidatePositioning() before code output

POSITIONING_ERROR_PREVENTION:
If generating GUI code:

1. Apply "think harder" cognitive tier
2. Run mental positioning validation
3. Verify xm reset patterns
4. Check for Section width usage
5. Validate logical section boundaries
   </GUI_DETECTION_SYSTEM>

<CORE_GUI_PATTERNS>

<BASIC_GUI_CREATION>

```cpp
class SimpleGui {
    __New() {
        this.gui := Gui("+Resize", "My Application")
        this.gui.SetFont("s10")
        this.gui.MarginX := 10
        this.gui.MarginY := 10
        this.CreateControls()
        this.gui.OnEvent("Close", (*) => this.gui.Hide())
        this.gui.Show("w400 h300")
    }

    CreateControls() {
        this.gui.AddText("", "Hello World!")
        this.gui.AddButton("w100", "OK").OnEvent("Click", (*) => this.gui.Hide())
    }
}
```

</BASIC_GUI_CREATION>

<CONTROL_CREATION_WITH_EVENTS>

```cpp
class EventDemoGui {
    __New() {
        this.gui := Gui("+Resize", "Event Demo")
        this.controls := Map()
        this.CreateControls()
        this.gui.Show("w300 h200")
    }

    CreateControls() {
        this.controls["helloBtn"] := this.gui.AddButton("w120", "Say Hello")
        this.controls["helloBtn"].OnEvent("Click", this.HandleHello.Bind(this))
    }

    HandleHello(*) {
        MsgBox("Hello from EventDemoGui!")
    }
}
```

</CONTROL_CREATION_WITH_EVENTS>

</CORE_GUI_PATTERNS>

<MANDATORY_POSITIONING_PATTERNS>

<POSITIONING_RESET_RULES>
**CRITICAL**: AutoHotkey v2 GUI positioning accumulates unless explicitly reset
**Rule**: Use positioning resets to prevent cumulative positioning drift

```cpp
; ✓ CORRECT PATTERN - Section header with reset
this.gui.AddText("xm Section", "Section Name")

; ✓ CORRECT - First control in section
this.controls["control1"] := this.gui.AddEdit("xm w200")

; ✓ CORRECT - Related controls with relative positioning
this.controls["control2"] := this.gui.AddButton("xm w100")
this.controls["control3"] := this.gui.AddButton("x+10 w100")  ; Relative to previous

; ✓ CORRECT - Next section MUST reset with xm
this.gui.AddText("xm Section", "Next Section")
this.controls["control4"] := this.gui.AddEdit("xm w200")

; ✗ WRONG PATTERN - Causes cumulative positioning drift
this.gui.AddText("Section w300", "Section Name")        ; ❌ Width on Section
this.controls["control1"] := this.gui.AddEdit("w200")   ; ❌ No xm reset
this.controls["control2"] := this.gui.AddButton("w100") ; ❌ Inherits previous position
```

**Memory Aid**: Always use `xm` to reset positioning for logical sections
</POSITIONING_RESET_RULES>

<GUI_POSITIONING_VALIDATION>
**Pattern**: Validate positioning to prevent drift before code generation
**Use Case**: Automated detection of positioning errors in GUI code

```cpp
class PositionValidator {
    static ValidatePositioning(guiCode) {
        errors := []

        ; Check for Section with width
        if RegExMatch(guiCode, "Section\\s+w\\d+")
            errors.Push("CRITICAL: Never use 'Section w###' - use 'Section' alone")

        ; Check for missing xm resets
        sectionCount := 0
        xmResetCount := 0

        ; Count sections
        pos := 1
        while (pos := RegExMatch(guiCode, "Section", &match, pos)) {
            sectionCount++
            pos := match.Pos + match.Len
        }

        ; Count xm resets
        pos := 1
        while (pos := RegExMatch(guiCode, "\\bxm\\b", &match, pos)) {
            xmResetCount++
            pos := match.Pos + match.Len
        }

        ; Should have approximately equal counts
        if (sectionCount > 0 && xmResetCount < sectionCount)
            errors.Push("WARNING: Sections without xm reset may cause positioning drift")

        return errors
    }

    static ValidateObjectLiterals(code) {
        errors := []

        ; Check for arrow syntax with multi-line blocks
        if RegExMatch(code, "=>\\s*\\{[^}]*\\n[^}]*\\}")
            errors.Push("CRITICAL: Never use arrow syntax (=>) with multi-line blocks in object literals")

        return errors
    }
}
```

**Rule**: Always run validation before outputting GUI code
</GUI_POSITIONING_VALIDATION>

<CODE_GENERATION_ENFORCEMENT>
**Critical**: Mandatory rules for GUI code generation to prevent positioning errors
**Pattern**: Enforce positioning patterns before outputting any GUI code

```cpp
; POSITIONING_ENFORCEMENT RULES:
; 1. EVERY GUI section MUST start with "xm Section" or "xm"
; 2. NEVER use "Section w###" syntax
; 3. Related controls in same section can use relative positioning (x+10)
; 4. New logical sections MUST reset with "xm"
; 5. Always validate positioning with ValidatePositioning() before code output

; REQUIRED_PATTERNS:
; Headers: this.gui.AddText("xm Section", "Header Text")
; First control in section: this.control := this.gui.AddEdit("xm w200")
; Related controls: this.control2 := this.gui.AddButton("x+10 w100")
; Next section: this.gui.AddText("xm Section", "Next Header")

; VALIDATION_CHECKLIST:
; Before outputting GUI code, verify:
; □ No "Section w###" patterns exist
; □ Each logical section starts with "xm"
; □ Section headers use "xm Section"
; □ Relative positioning only used within sections, not across sections
; □ Run ValidatePositioning() and fix any errors
```

**Cross-Reference**: See Module_Objects.md for object literal syntax rules
</CODE_GENERATION_ENFORCEMENT>

</MANDATORY_POSITIONING_PATTERNS>

<GUI_LAYOUT_DEBUGGING_SYSTEM>

<LAYOUT_CALCULATOR_CLASS>

```cpp
class LayoutCalculator {
    static Calculate(windowWidth, windowHeight, padding, elements) {
        result := Map()
        currentY := padding
        currentSection := 0

        for element in elements {
            elementResult := Map()

            ; Check if this starts a new section
            if (element.Has("isSection") && element["isSection"]) {
                currentSection++
                currentY += (currentSection > 1) ? padding : 0  ; Extra spacing between sections
            }

            ; ALWAYS reset X to margin for proper alignment
            elementResult["x"] := padding
            elementResult["xReason"] := "Reset to margin (xm) - prevents positioning drift"

            ; Y positioning with section awareness
            elementResult["y"] := currentY
            elementResult["yReason"] := currentSection = 1 ? "First section" : "Section " . currentSection . " + padding"

            ; Calculate dimensions
            elementResult["width"] := element.Has("width") ? element["width"] : windowWidth - (padding * 2)
            elementResult["height"] := element["height"]
            elementResult["widthReason"] := element.Has("width") ? "Specified width" : "Full width minus padding"
            elementResult["heightReason"] := "Specified height"

            ; Add positioning directives
            elementResult["ahkPosition"] := "xm"  ; Force margin reset
            if (element.Has("isSection") && element["isSection"])
                elementResult["ahkPosition"] .= " Section"

            result[element["id"]] := elementResult
            currentY += element["height"] + (padding // 2)  ; Reduced internal padding
        }

        return result
    }

    static Validate(layout, windowWidth, windowHeight) {
        overlapCheck := "No overlaps detected"
        boundaryCheck := "All elements within boundaries"

        ; Check boundaries
        for elementId, element in layout {
            if element["x"] + element["width"] > windowWidth {
                boundaryCheck := "Element " . elementId . " exceeds right boundary"
                break
            }
            if element["y"] + element["height"] > windowHeight {
                boundaryCheck := "Element " . elementId . " exceeds bottom boundary"
                break
            }
        }

        return Map("overlap", overlapCheck, "boundary", boundaryCheck)
    }

    static FormatReport(layout, validation) {
        report := "GUI Layout Analysis`n" . String("=", 50) . "`n`n"

        for elementId, element in layout {
            report .= "Element: " . elementId . "`n"
            report .= "  X: " . element["x"] . " pixels (" . element["xReason"] . ")`n"
            report .= "  Y: " . element["y"] . " pixels (" . element["yReason"] . ")`n"
            report .= "  Width: " . element["width"] . " pixels (" . element["widthReason"] . ")`n"
            report .= "  Height: " . element["height"] . " pixels (" . element["heightReason"] . ")`n"
            report .= "`n"
        }

        report .= "Validation:`n"
        report .= "  Overlap Check: " . validation["overlap"] . "`n"
        report .= "  Boundary Check: " . validation["boundary"] . "`n"

        return report
    }
}
```

</LAYOUT_CALCULATOR_CLASS>

<LAYOUT_AWARE_GUI_BASE_CLASS>

```cpp
class LayoutAwareGui {
    __New(title := "Layout GUI", width := 400, height := 300, padding := 10) {
        this.windowWidth := width
        this.windowHeight := height
        this.padding := padding
        this.elements := []
        this.layout := Map()

        this.gui := Gui("+Resize", title)
        this.gui.MarginX := 0
        this.gui.MarginY := 0
    }

    AddElement(id, type, options := "", text := "") {
        ; Parse width/height from options if present
        width := this.ParseDimension(options, "w", this.windowWidth - (this.padding * 2))
        height := this.ParseDimension(options, "h", 25)

        element := Map(
            "id", id,
            "type", type,
            "width", width,
            "height", height,
            "options", options,
            "text", text
        )

        this.elements.Push(element)
        return this
    }

    ParseDimension(options, prefix, default) {
        if RegExMatch(options, prefix . "(\d+)", &match)
            return Integer(match[1])
        return default
    }

    CalculateLayout() {
        this.layout := LayoutCalculator.Calculate(
            this.windowWidth,
            this.windowHeight,
            this.padding,
            this.elements
        )
        return this
    }

    CreateControls() {
        this.controls := Map()

        for element in this.elements {
            if !this.layout.Has(element["id"])
                continue

            pos := this.layout[element["id"]]
            options := "x" . pos["x"] . " y" . pos["y"] . " w" . pos["width"] . " h" . pos["height"]

            switch element["type"] {
                case "Text":
                    this.controls[element["id"]] := this.gui.AddText(options, element["text"])
                case "Edit":
                    this.controls[element["id"]] := this.gui.AddEdit(options, element["text"])
                case "Button":
                    this.controls[element["id"]] := this.gui.AddButton(options, element["text"])
                case "Checkbox":
                    this.controls[element["id"]] := this.gui.AddCheckbox(options, element["text"])
            }
        }
        return this
    }

    ShowLayoutReport() {
        validation := LayoutCalculator.Validate(this.layout, this.windowWidth, this.windowHeight)
        report := LayoutCalculator.FormatReport(this.layout, validation)
        MsgBox(report, "Layout Analysis", "Icon_Information")
        return this
    }

    Show() {
        this.CalculateLayout()
        this.CreateControls()
        this.gui.Show("w" . this.windowWidth . " h" . this.windowHeight)
        return this
    }
}
```

</LAYOUT_AWARE_GUI_BASE_CLASS>

</GUI_LAYOUT_DEBUGGING_SYSTEM>

<USAGE_EXAMPLES>

<SIMPLE_LAYOUT_WITH_DEBUGGING>

```cpp
class InfoPanel extends LayoutAwareGui {
    __New() {
        super.__New("Info Panel", 300, 200, 10)

        this.AddElement("title", "Text", "h30", "Status Panel")
        this.AddElement("infoLabel", "Text", "h20", "Current Status:")
        this.AddElement("infoEdit", "Edit", "h25", "Ready")
        this.AddElement("okBtn", "Button", "w100 h30", "OK")

        this.Show()
        this.ShowLayoutReport()
    }
}

panel := InfoPanel()
```

</SIMPLE_LAYOUT_WITH_DEBUGGING>

<ADVANCED_LAYOUT_WITH_CUSTOM_POSITIONING>

```cpp
class AdvancedLayoutGui extends LayoutAwareGui {
    __New() {
        super.__New("Advanced Layout", 400, 350, 15)

        ; Header section
        this.AddElement("header", "Text", "h40", "Application Settings")

    ; Fields
        this.AddElement("nameLabel", "Text", "h20", "Full Name:")
        this.AddElement("nameEdit", "Edit", "h25", "")
        this.AddElement("emailLabel", "Text", "h20", "Email Address:")
        this.AddElement("emailEdit", "Edit", "h25", "")

        ; Options
        this.AddElement("notifyCheck", "Checkbox", "h25", "Enable Notifications")
        this.AddElement("autoSaveCheck", "Checkbox", "h25", "Auto-save Settings")

        ; Actions
        this.AddElement("saveBtn", "Button", "w120 h35", "Save Settings")
        this.AddElement("resetBtn", "Button", "w120 h35", "Reset to Defaults")

        this.CreateAndShow()
    }

    CreateAndShow() {
        this.Show()
        this.SetupEvents()
        this.ShowLayoutReport()
    }

    SetupEvents() {
        this.controls["saveBtn"].OnEvent("Click", this.HandleSave.Bind(this))
        this.controls["resetBtn"].OnEvent("Click", this.HandleReset.Bind(this))
    }

    HandleSave(*) {
        MsgBox("Settings saved!")
    }

    HandleReset(*) {
        this.controls["nameEdit"].Value := ""
        this.controls["emailEdit"].Value := ""
        this.controls["notifyCheck"].Value := 0
        this.controls["autoSaveCheck"].Value := 0
    }
}

; Create the advanced layout
advancedLayout := AdvancedLayoutGui()
```

</ADVANCED_LAYOUT_WITH_CUSTOM_POSITIONING>

</USAGE_EXAMPLES>

<QUICK_REFERENCE>

<ESSENTIAL_PATTERNS>

- `Always use classes` for GUI code organization
- `Store control references` in Map() for easy access
- `Use .Bind(this)` for event handlers in classes
- `Calculate layouts` before creating controls for predictable positioning
- `Debug layouts` with the built-in reporting system
  </ESSENTIAL_PATTERNS>

<COMMON_CONTROL_TYPES>

- `Text` - Labels and static text
- `Edit` - Text input fields
- `Button` - Clickable buttons
- `Checkbox` - Toggle options
- `ComboBox` - Dropdown selections
- `ListView` - Data tables
  </COMMON_CONTROL_TYPES>

<LAYOUT_DEBUGGING_COMMANDS>

```cpp
gui.ShowLayoutReport()           ; Shows positioning analysis
gui.CalculateLayout()           ; Recalculates all positions
LayoutCalculator.Validate(...)  ; Validates layout manually
```

This simplified module focuses on the core GUI patterns while integrating your layout debugging system, making it much more manageable while still providing powerful positioning analysis capabilities.

<LAYOUT_INSTRUCTION_META>

<MODULE_PURPOSE>
Streamlined GUI development with mathematical layout analysis. Every GUI element gets precise positioning with detailed reasoning.
LLMs must reference this module for GUI creation and apply layout debugging to all positioning decisions.
</MODULE_PURPOSE>

<CRITICAL_PATTERNS>

- Always use Gui() constructor, never legacy v1 syntax
- MANDATORY: All GUI code must be class-based
- Apply LayoutCalculator.Calculate() for every GUI layout
- Generate positioning reports with ShowLayoutReport()
- Validate boundaries with LayoutCalculator.Validate()
- Use Map() for control storage and configuration
- Bind events with .OnEvent() and .Bind(this)
  </CRITICAL_PATTERNS>

<LLM_GUIDANCE>
When user requests GUI operations:

1. FIRST: Apply <THINKING> process from the CustomGPT instructions
2. THEN: Use LayoutAwareGui base class for automatic positioning
3. ESCALATE cognitive tier if complex layouts or multiple windows
4. ENFORCE mathematical positioning analysis for every element
5. ALWAYS generate layout report showing coordinate calculations
6. Apply comprehensive error handling and validation
7. Use modern AHK v2 syntax throughout
8. Provide complete, runnable examples with positioning analysis
   </LLM_GUIDANCE>

<POSITIONING_REQUIREMENTS>
For every GUI element, provide:

- Calculated X: [value] pixels (reasoning: [mathematical calculation])
- Calculated Y: [value] pixels (reasoning: [mathematical calculation])
- Calculated Width: [value] pixels (reasoning: [mathematical calculation])
- Calculated Height: [value] pixels (reasoning: [mathematical calculation])

Always validate:

- No element overlaps
- All elements within window boundaries
- Consistent padding applied throughout
  </POSITIONING_REQUIREMENTS>

<RESPONSE_TEMPLATES>
"Created AHK v2 GUI with mathematical layout analysis. The positioning system calculates exact coordinates for optimal element placement."
</RESPONSE_TEMPLATES>

</LAYOUT_INSTRUCTION_META>

<CHANGE_LOG>
- 2025-10-10: Added retrieval metadata, navigation references, and alignment with Supplemental_CustomGPT/Modules_CustomGPT_Beta.md.
</CHANGE_LOG>
