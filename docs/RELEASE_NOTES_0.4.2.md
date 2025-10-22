# Release Notes - AHKv2 Toolbox v0.4.2

**Release Date:** October 20, 2025

This major feature release introduces three significant enhancements to the AHKv2 Toolbox: a comprehensive AutoHotkey Dependency Explorer, enhanced function metadata extraction with advanced type detection, and complete profile management editing capabilities.

---

## 🎯 Highlights

### 🔗 AutoHotkey Dependency Explorer (NEW)
Visualize and navigate #Include dependencies across your entire AutoHotkey project with an intuitive tree view in the sidebar.

### 🔍 Enhanced Function Metadata Extraction
Advanced parameter and variable analysis with type classification, including detection of expression vs constant default values.

### ⚙️ Complete Profile Management
Full profile editing capabilities with multi-step UI for customizing conversion rules, performance settings, and validation options.

---

## 🆕 New Features

### AutoHotkey Dependency Explorer

#### Core Functionality
- **Automatic Workspace Scanning**: Instantly discovers all `.ahk` files in your workspace
- **Dependency Graph Visualization**: Hierarchical tree view showing #Include relationships
- **Real-Time Updates**: Automatically refreshes when files are created, modified, or deleted
- **Interactive Navigation**: Click any file to open it in the editor
- **Error Detection**: Visual indicators for unresolved dependencies with hover tooltips

#### #Include Directive Support
Comprehensive support for all AutoHotkey include patterns:

```ahk
#Include MyFile.ahk                    ✅ Standard include
#Include "path/to/file.ahk"            ✅ Quoted path
#Include <LibraryName>                 ✅ Library include
#Include %A_ScriptDir%\file.ahk        ✅ Script directory
#Include %A_WorkingDir%\utils\util.ahk ✅ Working directory
```

#### Smart Path Resolution
- Automatic variable substitution (`A_ScriptDir`, `A_WorkingDir`)
- Relative path resolution from including file
- Absolute path support
- Library folder fallback (`Lib\` subdirectory)
- Automatic `.ahk` extension addition

#### User Interface
- **File Icons** (📄): Visual indicators for all nodes
- **Dependency Count**: Shows number of includes per file `(n)`
- **Collapsible Nodes**: Expand/collapse with arrow (▼) indicators
- **Error Badges**: Red `!` indicator for unresolved files
- **Refresh Button** (⟳): Manual refresh option
- **Hover Tooltips**: Full file paths and error details

#### Technical Implementation
- Custom WebviewViewProvider with embedded HTML/CSS/JS
- File system watcher for `.ahk` files
- Circular dependency prevention
- Message passing for webview-to-extension communication
- Incremental updates for performance

#### Documentation & Testing
- **Comprehensive Guide**: `docs/DEPENDENCY_EXPLORER.md` (400+ lines)
- **Test Suite**: Sample project in `test/dependency-test/`
  - Demonstrates all include patterns
  - Multi-level dependency chains
  - Library includes
  - Variable-based paths

---

### Enhanced Function Metadata Extraction

#### Advanced Parameter Detection

**Default Value Type Classification**
The system now distinguishes between constants and expressions:

```typescript
// Constant (DefaultValueType.Constant)
Function(p1 := "string", p2 := 123, p3 := true)

// Expression (DefaultValueType.Expression)
Function(p1 := Random(1, 6), p2 := obj.prop, p3 := [])
```

This addresses the community discussion about determining default values:
> "no way to find out default val" for expressions like `Random(1, 6)`

**Type System Enhancements**
```typescript
enum DefaultValueType {
  None = 0,           // No default value
  Constant = 1,       // Literal value
  Expression = 2,     // Requires evaluation
  Unresolvable = 3    // Cannot determine
}

enum VariableScope {
  Local = 0,
  Static = 1,
  Global = 2,
  BuiltIn = 3,
  Assume = 4
}

enum VariableAttribute {
  None = 0,
  Constant = 1,
  ReadOnly = 2
}
```

**Enhanced Parameter Features**
- **Optional Parameters** (`?`): AHK v2.1+ syntax support
- **Type Hints**: Parse parameter and return type annotations
  - `Function(name: String, count: Integer) => String`
- **Variadic Detection**: Proper `*args` handling with `maxParams: 'variadic'`
- **ByRef Enhancement**: Improved `&param` identification

#### Variable Analysis Improvements

**Assignment Chains**
```ahk
Function() {
    d := e := f := 0  // All three detected as local
}
```

**Static Variable Declaration**
```ahk
Function() {
    static a, b := 10, c := "initialized"
    // All three properly parsed with initializers
}
```

**Enhanced Variable Metadata**
```typescript
interface VariableInfo {
  name: string;
  scope: 'static' | 'local' | 'global';
  scopeValue?: VariableScope;      // Numeric value
  hasInitializer: boolean;
  initializerValue?: string;
  attribute?: VariableAttribute;
  // ... additional fields
}
```

#### Documentation
- **New Guide**: `docs/FUNCTION_METADATA_EXTRACTION.md`
  - Detailed feature explanations with code examples
  - API usage guide with TypeScript interfaces
  - Limitations and comparison with runtime introspection
  - Future enhancement roadmap
- **Test Cases**: `test/enhanced-metadata.test.ahk`
  - All parameter types demonstrated
  - Variable declaration patterns
  - Edge cases and complex scenarios

---

### Profile Management Enhancements

#### Complete Profile Editing Implementation

**Multi-Step Editor Interface**
```
Profile Editor Menu
├── Edit Name & Description
├── Manage Rules
│   ├── Add New Rule
│   ├── Edit Existing Rule
│   │   ├── Toggle Enable/Disable
│   │   ├── Edit Name & Description
│   │   ├── Edit Priority (1-100)
│   │   ├── Edit Pattern & Replacement
│   │   ├── Change Category
│   │   └── Remove Rule
│   └── Back
├── Selective Conversion
│   ├── Toggle Selective Conversion
│   ├── Configure Constructs
│   │   ├── Functions
│   │   ├── Variables
│   │   ├── Commands
│   │   ├── Directives
│   │   ├── Hotkeys
│   │   └── Hotstrings
│   ├── Manage Include Patterns
│   ├── Manage Exclude Patterns
│   └── Back
├── Performance Settings
│   ├── Toggle Streaming
│   ├── Set Chunk Size (100-5000)
│   ├── Set Memory Limit (50-1000 MB)
│   ├── Toggle Progress Tracking
│   ├── Toggle Cancellation
│   └── Back
├── Validation Settings
│   ├── Set Validation Level (strict/normal/lenient)
│   ├── Toggle Syntax Check
│   ├── Toggle Semantic Check
│   ├── Toggle Performance Check
│   ├── Manage Custom Validation Rules
│   └── Back
├── Save & Exit
└── Cancel
```

#### Key Features
- **Predefined Profile Protection**: Cannot edit built-in profiles
  - Offers to create editable copy instead
- **Comprehensive Validation**: All inputs validated
  - Unique name checking
  - Regex pattern validation
  - Numeric range validation
- **Visual Indicators**: Icon-based status display
  - Check/slash icons for enabled/disabled
  - Category-specific icons

#### Supported Operations
- Edit profile name and description
- Add, edit, remove conversion rules
- Configure rule priority, patterns, categories
- Toggle selective conversion settings
- Manage include/exclude patterns
- Adjust performance settings
- Configure validation options
- Add custom validation rules

---

## 🔧 Technical Improvements

### Architecture Enhancements
- **Modular Design**: Separated concerns with dedicated functions
- **Type Safety**: Full TypeScript typing with proper enums
- **Error Handling**: Comprehensive with user-friendly messages
- **Performance**: Optimized scanning and rendering

### New Files & Modules
```
src/
├── dependencyExplorerProvider.ts    [NEW] 480 lines
└── models/functionMetadata.ts       [ENHANCED] New enums & interfaces

docs/
├── DEPENDENCY_EXPLORER.md           [NEW] 400+ lines
├── FUNCTION_METADATA_EXTRACTION.md  [NEW] 350+ lines
└── RELEASE_NOTES_0.4.2.md          [NEW] This file

test/
├── dependency-test/                 [NEW] Sample project
│   ├── main.ahk
│   ├── config.ahk
│   ├── utils/helpers.ahk
│   ├── modules/app-logic.ahk
│   └── Lib/Logger.ahk, Validator.ahk
└── enhanced-metadata.test.ahk      [NEW] Test cases
```

### Code Quality
- ✅ TypeScript compilation: No errors
- ✅ Full type coverage
- ✅ Comprehensive documentation
- ✅ Test suites provided
- ✅ Backward compatible

---

## 📊 Statistics

### Code Changes
- **New Files**: 5
- **Modified Files**: 6
- **Total Lines Added**: ~2,500
- **Documentation**: ~1,200 lines

### Features Summary
- **3 Major Features**: Dependency Explorer, Enhanced Metadata, Profile Editing
- **15+ New Functions**: Parsing, resolution, validation
- **8 New Commands**: Refresh, manage profiles, etc.
- **3 New Enums**: Type classification systems
- **2 Comprehensive Guides**: With examples and API docs

---

## 🚀 Getting Started

### Using the Dependency Explorer

1. **Open Workspace** containing `.ahk` files
2. **Click** AHKv2 Toolbox icon in Activity Bar
3. **Navigate** to "Dependencies" view
4. **Explore** the dependency tree
5. **Click** any file to open

### Testing Enhanced Metadata

1. **Open** `test/enhanced-metadata.test.ahk`
2. **Run** `AHK: Extract Function Metadata`
3. **Review** detected parameters and variables

### Managing Profiles

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run** `AHK: Manage Conversion Profiles`
3. **Select** "Edit Existing Profile"
4. **Choose** a custom profile (or create copy of predefined)
5. **Navigate** through editor options

---

## 🔮 Future Enhancements

### Dependency Explorer
- Dependency graph visualization (visual nodes/edges)
- Circular dependency detection warnings
- Unused file detection
- Include path validation in editor
- Refactoring support for moved files

### Function Metadata
- LSP integration for semantic analysis
- AST-based parsing
- Type inference from usage
- Limited constant folding for expressions

### Profile Management
- Visual rule editor
- Profile marketplace/sharing
- Import/export profiles
- Profile templates

---

## 🙏 Acknowledgments

This release incorporates ideas and feedback from:
- AutoHotkey community discussions on Discord
- User requests for dependency visualization
- Runtime introspection discussions (0w0Demonic)
- VS Code extension best practices

---

## 📝 Upgrade Notes

### From v0.4.1

**No Breaking Changes**
- All existing functionality preserved
- New features are additions only
- Settings backward compatible

**New Settings** (all optional):
- No new settings required
- Dependency Explorer works out-of-the-box
- Profile editing uses existing profile system

**Recommended Actions**:
1. Open a workspace with `.ahk` files to try Dependency Explorer
2. Review enhanced metadata in your functions
3. Explore profile editing with custom profiles

---

## 🐛 Bug Fixes

None specific to this release - focused on new features.

---

## 📚 Documentation

All features fully documented:
- [Dependency Explorer Guide](DEPENDENCY_EXPLORER.md)
- [Function Metadata Guide](FUNCTION_METADATA_EXTRACTION.md)
- [Advanced Features](ADVANCED_FEATURES.md)
- [User Guide](USER_GUIDE.md)

---

## 🤝 Contributing

Contributions welcome! See issues for:
- Feature requests
- Bug reports
- Documentation improvements
- Test case additions

---

**Full Changelog**: [CHANGELOG.md](../CHANGELOG.md)
