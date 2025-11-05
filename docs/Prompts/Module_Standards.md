<RETRIEVAL_METADATA>
Module: Supplemental_CustomGPT/Module_Standards.md
Role: Consolidated coding standards and validation checklist for AutoHotkey v2
Updated: 2025-10-10
Keywords: standards, checklist, validation, header, syntax
DependsOn: Supplemental_CustomGPT/Modules_CustomGPT_Beta.md
</RETRIEVAL_METADATA>

<RETRIEVAL_ABSTRACT>
- Summarizes mandatory headers, syntax rules, and structural requirements for every script.
- Provides a quick validation checklist to pair with the module-specific guidance.
- Reinforces the core response contract and cross-references specialty modules.
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

## Code Standards
- Use AutoHotkey v2 OOP syntax exclusively; never fall back to v1 commands or legacy `SetTimer, Label`.
- Instantiate classes without `new`: call `ClassName()` directly.
- Declare variables explicitly and near the top of their scope to avoid implicit globals.
- Store key/value pairs in `Map()`; prefer arrays for ordered data.
- Reserve fat arrow (`=>`) for single-line expressions; use block bodies otherwise.
- Bind every event handler with `.Bind(this)` inside the owning class.
- Implement `__Delete()` when resources, timers, or COM objects require cleanup.
- Place the auto-execute section (class instantiation, hotkeys) immediately after script headers.
- Default header:
  ```cpp
  #Requires AutoHotkey v2.1-alpha.16
  #SingleInstance Force
  ```
- Include additional libraries only when the dependency is used in the script.

## Validation Checklist
- [ ] Requirements mapped to modules and cited (e.g., `Module_GUI.md`).
- [ ] Headers present and match target runtime.
- [ ] Variables initialized before use; no implicit globals.
- [ ] Event handlers bound with `.Bind(this)` or documented alternative.
- [ ] Error handling in place for file I/O, user input, and GUI callbacks.
- [ ] Manual verification steps planned or executed.
- [ ] Temporary logging removed or toggled via configuration.

## Cross-Module Reminders
- For arrays, consult `Supplemental_CustomGPT/Module_Arrays.md`.
- For classes and inheritance, consult `Supplemental_CustomGPT/Module_Classes.md`.
- For GUI layout, consult `Supplemental_CustomGPT/Module_GUI.md`.
- For error handling, consult `Supplemental_CustomGPT/Module_Errors.md`.
- Document every borrowed pattern by referencing the module path in your response.

<CHANGE_LOG>
- 2025-10-10: Rebuilt standards file with retrieval metadata, navigation links, and updated checklist.
</CHANGE_LOG>
