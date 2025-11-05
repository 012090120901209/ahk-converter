# Changelog

All notable changes to the AHK Converter VS Code extension will be documented in this file.

## [0.4.3] - 2025-10-31

### Enhanced Chat Participant Commands 🤖

#### New Analysis Commands
- **`/syntax`** - Comprehensive syntax validation
  - Detects v1 contamination patterns (assignment with `=`, `%var%` syntax, etc.)
  - Integrates VS Code diagnostics (errors, warnings)
  - Line-by-line issue reporting with severity indicators
  - Success confirmation for clean code

- **`/symbols`** - Quick symbol navigation and overview
  - Symbol counts by type (classes, functions, methods, variables, hotkeys)
  - ASCII tree structure visualization
  - Navigation tips for Code Map view

- **`/codemap`** - Display complete code structure
  - Shows all symbols with hierarchical organization
  - Detailed statistics and counts
  - Formatted for LLM consumption

- **`/dependencies`** - Visualize #Include dependency tree
  - Shows all includes and their relationships
  - Detects unresolved includes
  - Reports dependency depth and statistics

- **`/workspace`** - Combined code map and dependency overview
  - Complete workspace context in one command
  - Ideal for starting conversations with full context

#### New Code Quality Commands
- **`/refactor`** - Suggest refactoring improvements
  - Identifies code duplication
  - Suggests function extraction
  - Recommends simplification and modern v2 idioms
  - Works on active file or provided snippet

- **`/best-practices`** - Review against AHK v2 best practices
  - Checks naming conventions
  - Validates error handling patterns
  - Reviews resource management
  - Provides constructive feedback with examples
  - Integrates VS Code diagnostics

- **`/test`** - Generate comprehensive test cases
  - Analyzes function signatures from metadata
  - Creates positive and negative test scenarios
  - Identifies edge cases
  - Includes function parameter information

#### Enhanced Context Awareness
- **Automatic Function Metadata**: Chat assistant now includes function signatures and parameters
- **Dependency Information**: Shows #Include count in context
- **Smarter Responses**: LLM receives rich workspace context automatically

### Auto-Add #Include Feature ⭐

#### Automatic Include Insertion
- **Smart #Include Insertion**: Automatically insert `#Include` statements when installing packages
  - Intelligent placement based on directive anchors (#SingleInstance > #Requires priority)
  - Detects and extends existing include blocks
  - Creates new include blocks with proper spacing (exactly one blank line)
  - Appends to end of block (never sorts or reorders)
  - Preserves file formatting (EOL style, column-zero alignment)

#### Duplicate Prevention
- **Normalized Path Comparison**: Case-insensitive duplicate detection
  - Recognizes `Lib/MyLib.ahk`, `<MyLib>`, and `../shared/MyLib.ahk` as same library
  - Prevents accidental duplicate includes
  - Shows line number of existing include when duplicate detected

#### User Experience
- **3-Button Workflow**: Install success notification with clear options
  - "Add #Include" - Automatically insert include line
  - "Open" - Open the installed library file
  - "Dismiss" - Close notification
- **Smart File Selection**:
  - Uses active .ahk file if available
  - Shows Quick Pick for all workspace .ahk files (excludes Lib/ and vendor/)
  - Displays relative paths for clarity
- **Clear Feedback**: Informative status messages
  - Success: "✓ Added #Include for PackageName at line X"
  - Duplicate: "PackageName is already included in this file (line X)"
  - With headers: "✓ Added headers and #Include for PackageName"

#### Configuration Options
- **Include Format Template** (`ahkv2Toolbox.includeFormat`)
  - Default: `Lib/{name}.ahk`
  - Supports custom templates: `vendor/{name}.ahk`, `<{name}>`, etc.
  - Use `{name}` placeholder for package name
- **Auto-Insert Headers** (`ahkv2Toolbox.autoInsertHeaders`)
  - Default: `false`
  - When enabled, adds missing #Requires and #SingleInstance directives
- **Header Order** (`ahkv2Toolbox.headerOrder`)
  - Default: `["#Requires AutoHotkey v2.1", "#SingleInstance Force"]`
  - Configurable order for directive insertion
- **Default Requires** (`ahkv2Toolbox.defaultRequires`)
  - Default: `"AutoHotkey v2.1"`
- **Default SingleInstance** (`ahkv2Toolbox.defaultSingleInstance`)
  - Default: `"Force"`
  - Options: Force, Ignore, Prompt, Off

#### Technical Implementation
- **Core Logic** (`src/includeLineInserter.ts`, 340 lines)
  - `insertIncludeLine()`: Main entry point with workspace edit
  - `findDirectiveAnchor()`: Directive detection with priority
  - `findIncludeBlock()`: Include block detection with comment continuity
  - `normalizeIncludeName()`: Path normalization for comparison
  - `findExistingInclude()`: Duplicate checking
  - `detectEOL()`: Line ending style preservation
  - `insertHeaders()`: Optional header insertion
- **Integration** (`src/packageManagerProvider.ts`)
  - `addIncludeToActiveFile()`: File selection and coordination
  - `isAhkFile()`: File type validation
  - `findWorkspaceAhkFiles()`: Workspace file discovery
- **Comprehensive Testing** (`src/test/includeLineInserter.test.ts`, 420 lines)
  - 33 unit tests covering all scenarios
  - Directive anchor detection tests
  - Include block manipulation tests
  - Duplicate detection tests (4 formats)
  - Header auto-insertion tests
  - Custom format tests
  - Edge cases (empty files, comments, CRLF/LF, multiple directives)

#### Documentation
- **Feature Guide** (`docs/AUTO_INCLUDE_FEATURE.md`)
  - Complete usage documentation with examples
  - Configuration reference
  - Code architecture overview
  - Troubleshooting guide
- **Rules Specification** (`docs/INCLUDE_INSERTION_RULES.md`)
  - Detailed insertion rules (6 core rules)
  - 5 comprehensive examples
  - Edge case handling
  - Testing scenarios
- **Implementation Summary** (`IMPLEMENTATION_SUMMARY.md`)
  - Technical implementation details
  - Quality metrics
  - Testing results

#### Quality Metrics
- ✅ Zero TypeScript compilation errors
- ✅ 33 comprehensive unit tests
- ✅ 100% specification compliance
- ✅ Complete documentation (3 documents)
- ✅ ~1,255 lines of code (implementation + tests + docs)

## [0.4.2] - 2025-10-20

### Enhanced Function Metadata Extraction

#### Advanced Parameter Detection
- **Default Value Type Classification**: Distinguish between constant and expression defaults
  - `DefaultValueType.Constant`: Literal values ("string", 123, true, unset)
  - `DefaultValueType.Expression`: Expressions (Random(1, 6), obj.prop, [])
  - Addresses community discussion: "no way to find out default val" for expressions
- **Optional Parameters** (`?` suffix): Detect AHK v2.1+ optional parameter syntax
- **Type Hints**: Parse parameter and return type hints (v2.1+)
  - Parameter types: `name: String`, `count: Integer`
  - Return types: `Function() => String`
- **Variadic Parameters**: Detect `*args` with proper `maxParams: 'variadic'`
- **ByRef Detection**: Enhanced `&param` identification

#### Variable Analysis Improvements
- **Assignment Chains**: Parse `d := e := f := 0` patterns
  - All variables in chain are correctly identified as local
- **Static Variable Declaration**: Handle multiple statics in one line
  - `static a, b := 10, c := "initialized"`
- **Initializer Detection**: Track whether variables have initial values
  - `hasInitializer: true/false`
  - `initializerValue: string` - The initialization expression
- **Scope Classification**: Numeric scope values matching AHK internals
  - `VariableScope.Local` (0), `Static` (1), `Global` (2)

#### Enhanced Type System
- **DefaultValueType Enum**: Classify parameter default values
- **VariableScope Enum**: Internal scope representation
- **VariableAttribute Enum**: Variable flags (Constant, ReadOnly)
- **Extended Interfaces**: Additional metadata fields for future use

#### Documentation
- **Comprehensive Guide**: New `docs/FUNCTION_METADATA_EXTRACTION.md`
  - Detailed feature explanation with code examples
  - API usage guide with TypeScript interfaces
  - Limitations and comparison with runtime introspection
  - Future enhancement roadmap
- **Test Cases**: `test/enhanced-metadata.test.ahk`
  - Demonstrates all supported parameter types
  - Variable declaration patterns
  - Edge cases and complex scenarios

#### Technical Implementation
- **Improved Regex Patterns**: Better detection of AHK v2.1 syntax
- **Helper Methods**: Modular parsing functions
  - `detectDefaultValueType()`: Classify default value expressions
  - `parseVariableDeclaration()`: Handle multi-variable declarations
  - `parseAssignmentChain()`: Extract chained assignments
- **Type Safety**: Full TypeScript typing with proper enums
- **Backward Compatibility**: Maintains existing API surface

### Profile Management Enhancements

#### Complete Profile Editing Implementation
- **Profile Editor Dialog**: Fully implemented comprehensive profile editing functionality
  - Edit profile name and description with validation
  - Manage conversion rules (enable/disable, priority, patterns, categories)
  - Add, edit, and remove custom rules with full configuration
  - Configure selective conversion settings (choose which constructs to convert)
  - Manage include/exclude patterns with regex validation
  - Adjust performance settings (streaming, chunk size, memory limits)
  - Configure validation options (strictness level, syntax/semantic/performance checks)
  - Add and manage custom validation rules
  - Protection for predefined profiles with copy-to-edit workflow
  - Multi-step QuickPick UI with intuitive navigation
  - Real-time feedback with notifications
  - Persistent changes with automatic saving

#### User Experience Improvements
- **Predefined Profile Protection**: Cannot edit built-in profiles directly
  - Warns user when attempting to edit predefined profiles
  - Offers to create an editable copy instead
  - Preserves integrity of conservative, aggressive, and custom base profiles
- **Comprehensive Validation**: Input validation for all fields
  - Unique name checking for profiles and rules
  - Regex pattern validation
  - Numeric range validation (priority, chunk size, memory limits)
  - Empty value prevention
- **Visual Indicators**: Icon-based status display
  - Check/slash icons for enabled/disabled states
  - Category-specific icons for different settings
  - Clear visual feedback throughout the interface

#### Technical Implementation
- **Modular Function Design**: Separated concerns with dedicated functions
  - `showProfileEditorMenu`: Main navigation hub
  - `editProfileNameDescription`: Name and description management
  - `editProfileRules`: Rule management with add/edit/remove
  - `editSelectiveConversion`: Construct and pattern configuration
  - `editPerformanceSettings`: Performance tuning options
  - `editValidationSettings`: Validation configuration
  - `managePatterns`: Reusable pattern management
  - `manageCustomValidationRules`: Custom validation rule editor
- **Type Safety**: Full TypeScript typing with proper interfaces
- **Error Handling**: Comprehensive error handling with user-friendly messages

## [0.4.1] - 2025-10-17

### Code Map Enhancements

#### Diagnostic Integration
- **Problem Indicators**: Code Map now shows diagnostics from VS Code's Problems panel
  - Error/warning badges on functions, methods, classes, and variables with issues
  - Color-coded icons (red for errors, yellow for warnings)
  - Enhanced tooltips displaying diagnostic messages with severity levels
  - Auto-refresh when diagnostics change

#### Static Method Detection
- **Improved Detection**: Fixed static method identification in classes
  - Parses source code directly to detect `static` keyword
  - Properly displays "static" label in description field
  - Accurate distinction between static and instance methods

#### Visual Improvements
- **Function Color Update**: Enhanced function/method color for better visibility
  - Dark theme: Changed from pale `#dbdca8` to golden `#d4a574`
  - Light theme: Changed to darker orange `#c9884b`
  - More prominent and easier to distinguish from other symbols

## [0.3.0] - 2025-10-15

### 🚀 Phase 4: Enterprise-Grade Advanced Features

#### 🎯 Major Architecture Improvements
- **Modular Architecture**: Complete refactoring with modular design
  - Conversion Profiles System (`src/conversionProfiles.ts`)
  - Performance Optimizer (`src/performanceOptimizer.ts`)
  - Telemetry Manager (`src/telemetry.ts`)
  - Debugger Integration (`src/debuggerIntegration.ts`)
  - Enhanced Extension Core (`src/extension.ts`)

#### 🔧 Advanced Conversion System
- **Conversion Profiles**: Customizable conversion behavior with predefined and custom profiles
  - Conservative Profile: Minimal changes, preserves v1 syntax
  - Aggressive Profile: Maximizes v2 syntax adoption
  - Custom Profile: User-defined rules and settings
  - Profile management: Create, edit, delete, import, export

- **Performance Optimization**: Streaming processing for large files
  - Chunk-based processing with configurable sizes (100-5000 lines)
  - Memory usage monitoring and limits (50-1000 MB)
  - Progress tracking with cancellation support
  - Real-time performance metrics

#### 🐛 Debugger Integration
- **Seamless Integration**: Full integration between converter and debugger
  - Automatic debugger reader launch
  - Debug session capture and analysis
  - Conversion assistance with debugging insights
  - Automatic issue detection and fixing
  - Performance optimization suggestions

#### 📊 Comprehensive Telemetry
- **Usage Analytics**: Anonymous usage tracking and analysis
  - Conversion statistics (success rate, processing time)
  - Error analysis (types, frequency, recovery actions)
  - Performance metrics (memory usage, processing speed)
  - Profile effectiveness analytics
  - Daily, weekly, and monthly reports
  - Complete privacy controls with opt-in/opt-out

#### 🛠️ Enhanced Error Handling
- **Structured Error Types**: Hierarchical error classes with user-friendly messages
  - ValidationError, ConversionError, FileOperationError, ConfigurationError
  - Actionable recovery suggestions
  - "Learn More" links to documentation
  - Enhanced notification system with configurable options

#### 🎨 User Interface Improvements
- **Advanced Diff View**: Enhanced diff with better options
  - Side-by-side comparison with color-coded changes
  - Configurable diff options (line numbers, highlighting, whitespace)
  - Accept/reject individual changes functionality
  - Context lines control for better visibility

- **Batch Processing**: Convert multiple files simultaneously
  - Progress tracking with cancellation support
  - Configurable output naming (suffix, directory, prompt)
  - Batch conversion results summary
  - Save all or successful conversions only

#### ⚙️ Configuration Management
- **Comprehensive Settings**: Complete configuration system
  - Profile selection and management
  - Performance optimization settings
  - Telemetry controls and privacy options
  - Validation level configuration (strict, normal, lenient)
  - Enhanced diff view customization
  - Batch processing preferences

#### 🧪 Testing and Quality Assurance
- **Comprehensive Testing**: Unit and integration tests
  - Test coverage for all new modules
  - Performance tests with large files
  - Error handling validation
  - Telemetry data integrity checks

#### 📚 Documentation
- **Complete Documentation**: Comprehensive documentation for all features
  - Advanced Features Guide (Phase 4)
  - Updated User Guide with new features
  - Enhanced Troubleshooting Guide
  - API Reference and Architecture Guide
  - Migration Guide for upgrades

## [0.2.0] - 2024-10-15

### 🎉 Major User Experience Enhancements (Phase 3)

#### 🚀 New Features
- **Enhanced Error Messages & Notifications**
  - User-friendly error messages with actionable recovery suggestions
  - "Learn More" links to documentation for common errors
  - Visual indicators with different message types (info, warning, error)
  - Error recovery suggestions with specific actions
  - Enhanced notification system with configurable options

- **Enhanced Diff View**
  - Side-by-side diff view with color-coded changes
  - Configurable diff options (line numbers, highlighting, whitespace)
  - Context lines control for better change visibility
  - Accept/reject individual changes functionality
  - Enhanced diff preview with better visual feedback

- **Batch Processing Capability**
  - Convert multiple AHK files simultaneously
  - Progress tracking with cancellation support
  - Batch conversion results summary
  - Configurable output naming (suffix, directory, prompt)
  - Save all or successful conversions only
  - Default output directory configuration

- **User Configuration Options**
  - Comprehensive settings for all extension features
  - Validation level configuration (strict, normal, lenient)
  - Enhanced diff view customization
  - Batch processing preferences
  - Auto-save options for converted files
  - Notification system controls

#### 🎨 User Interface Improvements
- **Context Menu Integration**
  - Right-click conversion options for .ahk files
  - Explorer context menu for batch operations
  - Editor context menu for quick access

- **Keyboard Shortcuts**
  - `Ctrl+Shift+A` / `Cmd+Shift+A`: Convert to new tab
  - `Ctrl+Shift+D` / `Cmd+Shift+D`: Show enhanced diff
  - Configurable keybindings for all commands

- **Visual Enhancements**
  - Progress indicators for long operations
  - Status bar messages with conversion statistics
  - Enhanced output channel formatting
  - Better error message presentation

#### 🔧 Technical Improvements
- **Enhanced Validation System**
  - Input validation with detailed error reporting
  - Conversion result validation
  - Configurable validation levels
  - Better error detection and reporting

- **Performance Optimizations**
  - Improved error handling performance
  - Better memory management for batch operations
  - Optimized diff view rendering
  - Faster validation processing

- **Code Quality**
  - Refactored error handling architecture
  - Improved type safety
  - Better separation of concerns
  - Enhanced testability

#### 📚 Documentation
- **Comprehensive README**
  - Complete feature documentation
  - Installation and usage instructions
  - Troubleshooting guide
  - Advanced usage examples
  - Settings reference

- **Enhanced Settings Documentation**
  - Detailed setting descriptions
  - Usage examples for each option
  - Default value documentation
  - Configuration recommendations

#### 🐛 Bug Fixes
- Fixed error message display issues
- Improved file handling for edge cases
- Better handling of empty or invalid files
- Fixed diff view rendering problems
- Improved batch operation reliability

#### ⚠️ Breaking Changes
- Extension version bumped to 0.2.0 for major UX improvements
- Some settings have been reorganized (migration handled automatically)
- Enhanced error messages may change existing error handling workflows

## [0.1.5] - 2024-10-10

### 🔧 Improvements
- Enhanced error handling with better error types
- Improved validation for AHK files
- Better conversion result validation
- Enhanced output channel logging

### 🐛 Bug Fixes
- Fixed file path handling on different platforms
- Improved converter script detection
- Better handling of special characters in file paths

## [0.1.0] - 2024-10-01

### 🎉 Initial Release
- Basic AHK v1 to v2 conversion functionality
- Open result in new tab
- Replace current file option
- Show diff view
- Basic configuration options
- AutoHotkey v2 path detection
- Converter script path configuration
- Windows platform warnings

---

## Migration Guide

### From 0.1.x to 0.2.0

The extension has been significantly enhanced with new user experience features. Most changes are backward compatible, but some settings have been reorganized:

**New Settings (Optional):**
- `ahkConverter.enableEnhancedDiff`: Enable enhanced diff view (default: true)
- `ahkConverter.showConversionStats`: Show conversion statistics (default: true)
- `ahkConverter.enableNotifications`: Enhanced notifications (default: true)
- `ahkConverter.validationLevel`: Validation strictness (default: "normal")
- `ahkConverter.defaultOutputNaming`: Batch output naming (default: "suffix")
- `ahkConverter.autoSaveAfterConversion`: Auto-save converted files (default: false)
- `ahkConverter.batchOutputDirectory`: Default batch output directory
- `ahkConverter.diffViewOptions`: Diff view customization options

**New Commands:**
- `AHK: Convert multiple files (batch)` - Batch processing
- Enhanced context menu integration
- New keyboard shortcuts

**Migration Steps:**
1. Extension will automatically migrate existing settings
2. Review new settings in VS Code preferences
3. Customize according to your workflow
4. Try new batch processing features

---

## Support

For issues, questions, or feature requests:
- [GitHub Issues](https://github.com/TrueCrimeAudit/ahk-converter/issues)
- [Documentation](https://github.com/TrueCrimeAudit/ahk-converter#readme)
- [Discussions](https://github.com/TrueCrimeAudit/ahk-converter/discussions)

---

*Note: This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format.*
