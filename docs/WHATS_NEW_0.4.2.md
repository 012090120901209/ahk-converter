# What's New in AHKv2 Toolbox v0.4.2

**🎉 Three Major Features Released!**

---

## 🔗 1. AutoHotkey Dependency Explorer

> **Visualize #Include relationships across your entire project**

### What It Does
Automatically scans your workspace and builds an interactive dependency tree showing which files include which other files.

### Quick Start
1. Open a workspace with `.ahk` files
2. Click **AHKv2 Toolbox** in sidebar
3. Navigate to **"Dependencies"** view
4. **Click any file** to open it

### Key Features
- 📄 **Auto-Discovery**: Finds all `.ahk` files instantly
- 🌳 **Tree View**: Hierarchical display with collapsible nodes
- 🔄 **Real-Time**: Updates when files change
- ⚠️ **Error Detection**: Visual warnings for missing files
- 📍 **Click to Open**: Jump to any file in your project

### Supported Include Patterns
```ahk
#Include MyFile.ahk                  ✅
#Include "path/to/file.ahk"          ✅
#Include <LibraryName>               ✅
#Include %A_ScriptDir%\file.ahk      ✅
```

### Example View
```
📄 main.ahk (3)
  📄 config.ahk (1)
    📄 Lib\Validator.ahk
  📄 utils\helpers.ahk
  📄 Lib\Logger.ahk
```

📖 [**Full Guide →**](DEPENDENCY_EXPLORER.md)

---

## 🔍 2. Enhanced Function Metadata Extraction

> **Advanced parameter and variable analysis**

### What's New

#### Default Value Type Detection
The system now distinguishes between **constants** and **expressions**:

```ahk
// These are CONSTANTS (can be determined at parse time)
Function(p1 := "text", p2 := 123, p3 := true)

// These are EXPRESSIONS (require runtime evaluation)
Function(p1 := Random(1, 6), p2 := obj.prop, p3 := [])
```

#### Enhanced Parameter Features
- **Optional Parameters** (`param?`) - AHK v2.1+
- **Type Hints** (`name: String`, `count: Integer`)
- **Variadic** (`*args`) with proper detection
- **ByRef** (`&param`) enhanced tracking

#### Variable Detection Improvements
```ahk
Function() {
    static a, b := 10, c := "init"  // All detected with initializers
    d := e := f := 0                 // Assignment chain detection
}
```

### Quick Example
```ahk
MyFunc(required, optional?, &byRef, default := "value", *rest) => String {
    static counter := 0
    local a, b := 5
    x := y := z := 0
}
```

**Detected:**
- 5 parameters with types
- 1 static variable with initializer
- 4 local variables (a, b, x, y, z)
- Return type hint: String

📖 [**Full Guide →**](FUNCTION_METADATA_EXTRACTION.md)

---

## ⚙️ 3. Complete Profile Management

> **Edit conversion profiles with intuitive multi-step interface**

### What It Does
Provides a comprehensive editor for customizing how the v1→v2 converter works.

### Quick Start
1. **Ctrl+Shift+P** → `AHK: Manage Conversion Profiles`
2. Choose **"Edit Existing Profile"**
3. Select a custom profile (or create copy of built-in)
4. Navigate through editor menu

### Editor Menu
```
📝 Edit Name & Description
📋 Manage Rules
  ├─ Add/Edit/Remove conversion rules
  ├─ Set priorities (1-100)
  └─ Configure patterns & replacements
⚙️ Selective Conversion
  ├─ Choose which constructs to convert
  └─ Manage include/exclude patterns
⚡ Performance Settings
  ├─ Streaming processing
  ├─ Chunk size (100-5000 lines)
  └─ Memory limits (50-1000 MB)
✅ Validation Settings
  ├─ Validation level (strict/normal/lenient)
  ├─ Syntax/semantic/performance checks
  └─ Custom validation rules
```

### Key Features
- 🔒 **Protected Profiles**: Built-in profiles can't be edited (copy instead)
- ✓ **Validation**: All inputs validated before saving
- 💾 **Auto-Save**: Changes persist automatically
- 🎨 **Visual Indicators**: Icons show enabled/disabled states

### Example Use Case
Create a custom profile that:
1. Only converts functions and commands (skip variables)
2. Uses aggressive performance settings
3. Adds custom validation rule to warn about `Goto`

📖 [**Full Guide →**](ADVANCED_FEATURES.md#profile-management)

---

## 📊 By the Numbers

### Code
- **2,500+** lines of new code
- **5** new files
- **3** new TypeScript enums
- **15+** new functions

### Documentation
- **1,200+** lines of documentation
- **3** comprehensive guides
- **2** test suites
- **1** testing guide with 40+ tests

### Features
- **3** major features
- **8** new commands
- **6** new UI elements
- **0** breaking changes

---

## 🚀 Quick Tips

### Dependency Explorer
- **Tip 1**: Click the ⟳ button to force refresh
- **Tip 2**: Hover over error badges to see why files aren't found
- **Tip 3**: Collapse large trees by clicking the ▼ arrow

### Function Metadata
- **Tip 1**: Expression defaults show as `DefaultValueType.Expression`
- **Tip 2**: Check `hasInitializer` to see if variables have default values
- **Tip 3**: `scopeValue` contains numeric scope codes (0=Local, 1=Static, 2=Global)

### Profile Management
- **Tip 1**: Can't edit built-in profiles? Create a copy!
- **Tip 2**: Set rule priority high (80-100) to run it first
- **Tip 3**: Use regex patterns in exclude/include for flexible filtering

---

## 🎯 Most Requested Features

These features were implemented based on user feedback:

### ✅ Dependency Visualization
**Request**: "Can we see which files include which?"
**Solution**: Full dependency explorer with tree view

### ✅ Default Value Analysis
**Request**: "How do I know if a default value is constant or expression?"
**Solution**: `DefaultValueType` enum with classification

### ✅ Profile Editing
**Request**: "I want to customize conversion profiles"
**Solution**: Complete multi-step editor with all settings

---

## 📚 Where to Learn More

### Comprehensive Guides
- [Dependency Explorer Guide](DEPENDENCY_EXPLORER.md) - 400+ lines
- [Function Metadata Guide](FUNCTION_METADATA_EXTRACTION.md) - 350+ lines
- [Advanced Features](ADVANCED_FEATURES.md) - Profile management details

### Quick References
- [Release Notes](RELEASE_NOTES_0.4.2.md) - Full feature list
- [Testing Guide](TESTING_GUIDE_0.4.2.md) - 40+ test cases
- [Changelog](../CHANGELOG.md) - Technical details

### Getting Help
- [User Guide](USER_GUIDE.md) - General usage
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [GitHub Issues](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues) - Report bugs

---

## 🔮 What's Next?

### Planned Enhancements

**Dependency Explorer:**
- Visual graph view (nodes & edges)
- Circular dependency warnings
- Unused file detection

**Function Metadata:**
- LSP integration for semantic analysis
- Type inference from usage patterns
- Constant folding for simple expressions

**Profile Management:**
- Visual rule editor
- Profile marketplace
- Profile templates

---

## 💬 Feedback Welcome!

We'd love to hear from you:
- 🐛 **Found a bug?** [Report it](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)
- 💡 **Have an idea?** [Suggest a feature](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)
- ⭐ **Like it?** Star the repository!

---

## 🙏 Thank You

Special thanks to:
- AutoHotkey community on Discord
- Contributors and testers
- Everyone who provided feedback

---

**Enjoy the new features!** 🎉

---

<div align="center">

**[📖 Documentation](../README.md)** •
**[📝 Changelog](../CHANGELOG.md)** •
**[🐛 Issues](https://github.com/TrueCrimeAudit/ahkv2-toolbox/issues)** •
**[⭐ GitHub](https://github.com/TrueCrimeAudit/ahkv2-toolbox)**

</div>
