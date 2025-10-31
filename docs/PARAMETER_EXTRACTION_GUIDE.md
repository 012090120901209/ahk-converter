# Parameter Extraction in Code Map: Technical Guide

## Overview

The AHKv2 Toolbox Code Map extracts function parameters using a **dual-strategy approach**: a primary LSP-based parser and a fallback regex-based parser. This document explains how parameters are discovered, parsed, and displayed in the Code Map view.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Extraction Strategies](#extraction-strategies)
3. [Parameter Parsing Details](#parameter-parsing-details)
4. [Data Flow](#data-flow)
5. [Parameter Features](#parameter-features)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Dual-Strategy Parsing

```
┌─────────────────────┐
│  Code Map Request   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AHKLSPIntegration  │──── Is thqby LSP available?
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
   YES           NO
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│   LSP   │  │   Regex      │
│ Parser  │  │   Parser     │
│(Primary)│  │  (Fallback)  │
└────┬────┘  └──────┬───────┘
     │              │
     └──────┬───────┘
            ▼
    ┌──────────────┐
    │  Parameters  │
    │  Extracted   │
    └──────────────┘
```

### Key Components

1. **AHKLSPIntegration** (`src/lspIntegration.ts`)
   - Interfaces with thqby's AutoHotkey v2 LSP extension
   - Uses proper lexer/parser for accurate parsing
   - Provides `DocumentSymbol` objects with parameter info

2. **FunctionAnalyzer** (`src/functionAnalyzer.ts`)
   - Fallback regex-based parser
   - Extracts parameters when LSP is unavailable
   - Provides detailed parameter metadata

3. **FunctionTreeProvider** (`src/functionTreeProvider.ts`)
   - Displays parameters in the Code Map UI
   - Shows parameters inline or as child nodes
   - Adds hover tooltips with parameter details

## Extraction Strategies

### Strategy 1: LSP-Based Extraction (Primary)

**When Used**: When thqby's `vscode-autohotkey2-lsp` extension is installed and active

**How It Works**:

```typescript
// Step 1: Check if LSP is available
const lspIntegration = AHKLSPIntegration.getInstance();
const isAvailable = await lspIntegration.isLSPAvailable();

// Step 2: Get document symbols from LSP
const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
  'vscode.executeDocumentSymbolProvider',
  document.uri
);

// Step 3: LSP returns DocumentSymbol objects
// Each symbol has a 'detail' property with signature
// Example detail: "(param1: String, &param2, param3 := 10)"
```

**Advantages**:
- ✅ Uses proper lexer/parser (no regex limitations)
- ✅ Handles complex syntax correctly
- ✅ Includes type hints and annotations
- ✅ Respects AHK v2 language server logic

**Data Structure** (from LSP):

```typescript
interface DocumentSymbol {
  name: string;              // Function name
  detail: string;            // Full signature: "(param1, param2)"
  kind: SymbolKind;          // Function, Method, etc.
  range: Range;              // Location in document
  children?: DocumentSymbol[]; // Nested symbols
}
```

### Strategy 2: Regex-Based Extraction (Fallback)

**When Used**: When LSP is not available or fails

**How It Works**:

The `FunctionAnalyzer` class uses sophisticated regex patterns to parse function declarations:

```typescript
// Function declaration regex
private static functionRegex = /^(\w+)\s*\(([^)]*)\)\s*(?:=>\s*(\w+))?\s*{/;

// Matches patterns like:
// MyFunction(param1, param2) {           ← Basic
// Calculate(x, y) => Number {            ← With return type
// ProcessData(&data, count := 0) {       ← Byref + default
```

**Parsing Flow**:

```
1. Find function declaration line
2. Extract parameter string: "param1, param2, &param3?"
3. Split by comma: ["param1", "param2", "&param3?"]
4. Parse each parameter individually
5. Build Parameter objects with metadata
```

**Advantages**:
- ✅ Works without external dependencies
- ✅ Provides detailed metadata (byref, optional, defaults)
- ✅ Classifies default value types
- ✅ Handles edge cases like variadic parameters

## Parameter Parsing Details

### Parameter String Parsing

The `parseParameters()` method in `FunctionAnalyzer` processes each parameter:

```typescript
private static parseParameters(paramsStr: string): Parameter[] {
  return paramsStr.split(',').map((param, position) => {
    param = param.trim();

    // Step 1: Check for byref (&)
    const isByRef = param.startsWith('&');
    if (isByRef) param = param.slice(1).trim();

    // Step 2: Check for variadic (*)
    if (param.startsWith('*')) {
      return { name: '*', isByRef: false, isOptional: false, ... };
    }

    // Step 3: Check for optional (?)
    let isOptional = false;
    if (param.endsWith('?')) {
      isOptional = true;
      param = param.slice(0, -1).trim();
    }

    // Step 4: Parse type hint (name: Type or name as Type)
    const typeHintMatch = param.match(/^(\w+)\s*(?::|as)\s*(\w+)/);

    // Step 5: Parse default value (name := value)
    const defaultValueMatch = param.match(/^(\w+)\s*:=\s*(.+)$/);

    // Step 6: Determine default value type
    const defaultValueType = detectDefaultValueType(defaultValue);

    return { name, isByRef, isOptional, hasDefault, ... };
  });
}
```

### Supported Parameter Patterns

| Pattern | Example | Detection |
|---------|---------|-----------|
| **Simple** | `name` | Base case |
| **ByRef** | `&name` | Starts with `&` |
| **Optional** | `name?` | Ends with `?` |
| **Default** | `name := 10` | Contains `:=` |
| **Type Hint** | `name: String` or `name as String` | Contains `:` or `as` |
| **Combined** | `&name?: String := ""` | All modifiers together |
| **Variadic** | `*` or `*args` | Starts with `*` |

### Default Value Type Classification

The `detectDefaultValueType()` method categorizes default values:

```typescript
enum DefaultValueType {
  None = 0,           // No default value
  Constant = 1,       // Literal: "string", 123, true, false, unset
  Expression = 2,     // Function call: Random(1, 6), obj.method()
  Unresolvable = 3    // Cannot determine
}
```

**Classification Rules**:

```typescript
// String literals
"Hello"      → Constant
'World'      → Constant

// Numeric literals
42           → Constant
3.14         → Constant
-99          → Constant

// Boolean literals
true         → Constant
false        → Constant

// Special values
unset        → Constant
""           → Constant (empty string)

// Expressions (contain operators/function calls)
Random(1, 6) → Expression
obj.prop     → Expression
x + y        → Expression
func()       → Expression

// Arrays/objects (treated as expressions for safety)
[]           → Expression
{}           → Expression
[1, 2, 3]    → Expression

// Simple identifiers (treated as expressions)
someVar      → Expression (could be variable reference)
```

**Why Classify?**:
- **Helps with documentation generation**: Constants can be shown directly, expressions need context
- **Useful for validation**: Expressions may have runtime errors
- **Informs code completion**: Different suggestions for constants vs expressions

## Data Flow

### Complete Extraction Flow

```
┌──────────────────────────────────────────────────────┐
│ 1. User Opens AHK File or Code Map Refreshes        │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│ 2. FunctionTreeProvider.refresh() Called             │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│ 3. LSP Available? Check thqby Extension             │
└────────┬───────────────────────────┬─────────────────┘
         │ YES                       │ NO
         ▼                           ▼
┌─────────────────────┐    ┌─────────────────────────┐
│ 4a. Use LSP Parser  │    │ 4b. Use Regex Parser    │
│                     │    │                         │
│ • Get DocumentSymbol│    │ • Scan file line by line│
│ • Parse 'detail'    │    │ • Match function regex  │
│ • Extract params    │    │ • Parse params string   │
└──────────┬──────────┘    └───────────┬─────────────┘
           │                           │
           └────────────┬──────────────┘
                        ▼
┌──────────────────────────────────────────────────────┐
│ 5. Build Parameter[] Array                           │
│                                                      │
│    [                                                 │
│      { name: "x", isByRef: false, ... },            │
│      { name: "y", isByRef: true, ... },             │
│      { name: "count", hasDefault: true, ... }       │
│    ]                                                 │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│ 6. Create FunctionTreeItem                           │
│                                                      │
│    • Label: Function name                           │
│    • Description: Parameter list (if enabled)       │
│    • Tooltip: Detailed hover info                   │
│    • Children: Parameter nodes (if expanded)        │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│ 7. Display in Code Map View                         │
│                                                      │
│    ⚡ MyFunction                static (x, &y)      │
│      ├─ x: Number                                   │
│      └─ y: String (byref)                           │
└──────────────────────────────────────────────────────┘
```

## Parameter Features

### 1. Parameter Metadata

Each parameter includes rich metadata:

```typescript
interface Parameter {
  name: string;              // Parameter name
  isByRef: boolean;          // Is this &parameter?
  isOptional: boolean;       // Has ? suffix (v2.1+)
  hasDefault: boolean;       // Has default value
  defaultValue?: string;     // The default value string
  defaultValueType: DefaultValueType; // Constant or Expression
  typeHint?: string;         // Type annotation (v2.1+)
  position: number;          // 0-based position
}
```

### 2. Display Options

**Inline Display** (configurable):

```
⚡ Calculate     local (x: Number, &result?, count := 0)
```

**Expanded Display**:

```
⚡ Calculate
  ├─ x: Number
  ├─ result (byref, optional)
  └─ count (default: 0)
```

### 3. Hover Information

Rich tooltips show complete parameter details:

```markdown
**function** Calculate

**Parameters:**
- `x: Number` - Input value
- `&result?` - Output parameter (byref, optional)
- `count := 0` - Iteration count (default: 0)

**Returns:** `Number`
```

### 4. Visual Indicators

Parameters are shown with contextual icons:

| Type | Icon | Color |
|------|------|-------|
| Regular param | `$(symbol-parameter)` | Default |
| ByRef param | `$(arrow-both)` | Blue |
| Optional param | `$(question)` | Yellow |
| Variadic param | `$(ellipsis)` | Purple |

## Examples

### Example 1: Simple Parameters

**Code**:
```autohotkey
Add(x, y) {
  return x + y
}
```

**Extracted Data**:
```json
{
  "name": "Add",
  "parameters": [
    { "name": "x", "isByRef": false, "isOptional": false, "hasDefault": false, "position": 0 },
    { "name": "y", "isByRef": false, "isOptional": false, "hasDefault": false, "position": 1 }
  ],
  "minParams": 2,
  "maxParams": 2
}
```

**Code Map Display**:
```
⚡ Add          local (x, y)
```

### Example 2: ByRef Parameter

**Code**:
```autohotkey
Swap(&a, &b) {
  temp := a
  a := b
  b := temp
}
```

**Extracted Data**:
```json
{
  "parameters": [
    { "name": "a", "isByRef": true, "position": 0 },
    { "name": "b", "isByRef": true, "position": 1 }
  ]
}
```

**Code Map Display**:
```
⚡ Swap         local (&a, &b)
  ├─ a (byref)
  └─ b (byref)
```

### Example 3: Default Values

**Code**:
```autohotkey
Greet(name, greeting := "Hello", punct := "!") {
  MsgBox(greeting " " name punct)
}
```

**Extracted Data**:
```json
{
  "parameters": [
    { "name": "name", "hasDefault": false, "position": 0 },
    { "name": "greeting", "hasDefault": true, "defaultValue": "\"Hello\"", "defaultValueType": 1, "position": 1 },
    { "name": "punct", "hasDefault": true, "defaultValue": "\"!\"", "defaultValueType": 1, "position": 2 }
  ],
  "minParams": 1,
  "maxParams": 3
}
```

**Code Map Display**:
```
⚡ Greet        local (name, greeting := "Hello", punct := "!")
  ├─ name
  ├─ greeting (default: "Hello")
  └─ punct (default: "!")
```

### Example 4: Type Hints (AHK v2.1+)

**Code**:
```autohotkey
Calculate(x: Number, y: Number) => Number {
  return x * y
}
```

**Extracted Data**:
```json
{
  "parameters": [
    { "name": "x", "typeHint": "Number", "position": 0 },
    { "name": "y", "typeHint": "Number", "position": 1 }
  ],
  "returnType": "Number"
}
```

**Code Map Display**:
```
⚡ Calculate    local (x: Number, y: Number) => Number
  ├─ x: Number
  └─ y: Number
```

### Example 5: Optional Parameters (AHK v2.1+)

**Code**:
```autohotkey
Process(data, &result?, timeout := 1000) {
  ; Process data
}
```

**Extracted Data**:
```json
{
  "parameters": [
    { "name": "data", "isOptional": false, "position": 0 },
    { "name": "result", "isByRef": true, "isOptional": true, "position": 1 },
    { "name": "timeout", "hasDefault": true, "defaultValue": "1000", "defaultValueType": 1, "position": 2 }
  ],
  "minParams": 1,
  "maxParams": 3
}
```

**Code Map Display**:
```
⚡ Process      local (data, &result?, timeout := 1000)
  ├─ data
  ├─ result (byref, optional)
  └─ timeout (default: 1000)
```

### Example 6: Variadic Parameters

**Code**:
```autohotkey
Log(level, message, *args) {
  output := Format(message, args*)
  FileAppend(output, "log.txt")
}
```

**Extracted Data**:
```json
{
  "parameters": [
    { "name": "level", "position": 0 },
    { "name": "message", "position": 1 },
    { "name": "*", "position": 2 }
  ],
  "minParams": 2,
  "maxParams": "variadic",
  "isVariadic": true
}
```

**Code Map Display**:
```
⚡ Log          local (level, message, *args)
  ├─ level
  ├─ message
  └─ *args (variadic)
```

### Example 7: Complex Expression Defaults

**Code**:
```autohotkey
Shuffle(array, seed := Random(1, 1000)) {
  ; Shuffle algorithm
}
```

**Extracted Data**:
```json
{
  "parameters": [
    { "name": "array", "hasDefault": false, "position": 0 },
    {
      "name": "seed",
      "hasDefault": true,
      "defaultValue": "Random(1, 1000)",
      "defaultValueType": 2,  // Expression
      "position": 1
    }
  ]
}
```

**Code Map Display**:
```
⚡ Shuffle      local (array, seed := Random(1, 1000))
  ├─ array
  └─ seed (default: Random(1, 1000) ⚠️ expression)
```

### Example 8: Combined Modifiers

**Code**:
```autohotkey
Update(&target?: Map, source := Map(), merge := true) {
  ; Complex update logic
}
```

**Extracted Data**:
```json
{
  "parameters": [
    {
      "name": "target",
      "isByRef": true,
      "isOptional": true,
      "typeHint": "Map",
      "position": 0
    },
    {
      "name": "source",
      "hasDefault": true,
      "defaultValue": "Map()",
      "defaultValueType": 2,
      "position": 1
    },
    {
      "name": "merge",
      "hasDefault": true,
      "defaultValue": "true",
      "defaultValueType": 1,
      "position": 2
    }
  ],
  "minParams": 0,
  "maxParams": 3
}
```

**Code Map Display**:
```
⚡ Update       local (&target?: Map, source := Map(), merge := true)
  ├─ target: Map (byref, optional)
  ├─ source (default: Map() ⚠️ expression)
  └─ merge (default: true)
```

## Troubleshooting

### Issue 1: Parameters Not Showing

**Symptoms**: Function appears in Code Map but shows no parameters

**Possible Causes**:
1. LSP not installed or not active
2. Regex parser failed to match function signature
3. Syntax error in function declaration

**Solutions**:
1. Install thqby's `vscode-autohotkey2-lsp` extension
2. Check function syntax matches AHK v2 format
3. Look for unclosed parentheses or unusual formatting

### Issue 2: Incorrect Parameter Count

**Symptoms**: Code Map shows wrong number of parameters

**Possible Causes**:
1. Multi-line function declarations (not fully supported by regex)
2. Comments inside parameter list
3. Complex nested parentheses

**Solutions**:
1. Use single-line function declarations when possible
2. Avoid comments in parameter list
3. Simplify complex parameter expressions

### Issue 3: Type Hints Not Displayed

**Symptoms**: Type hints are not shown in Code Map

**Possible Causes**:
1. Using AHK v2.0 (type hints are v2.1+)
2. LSP doesn't support type hints yet
3. Invalid type hint syntax

**Solutions**:
1. Upgrade to AHK v2.1+
2. Ensure LSP extension is up to date
3. Check type hint syntax: `param: Type` or `param as Type`

### Issue 4: Default Values Truncated

**Symptoms**: Default values are cut off or incomplete

**Possible Causes**:
1. Complex expressions with nested parentheses
2. String literals with special characters
3. Array/object literals

**Solutions**:
1. Extract complex defaults to constants
2. Use simpler default expressions
3. Check for proper quote escaping

## Performance Considerations

### LSP vs Regex Performance

| Metric | LSP | Regex |
|--------|-----|-------|
| **Speed** | Fast (cached) | Very Fast (direct) |
| **Accuracy** | Excellent | Good |
| **Overhead** | Extension required | None |
| **Complex syntax** | Handles perfectly | May miss edge cases |

**Recommendation**: Always use LSP when available for best results.

### Caching

The Code Map caches parsed results:
- **Document changes**: Re-parse affected functions only
- **File switches**: Parse new file, keep old in memory
- **Bulk operations**: Batch parse multiple files

## API Reference

### FunctionAnalyzer.parseParameters()

```typescript
/**
 * Parse a parameter string into structured Parameter objects
 * @param paramsStr - The parameter string: "x, &y, z := 10"
 * @returns Array of Parameter objects with metadata
 */
private static parseParameters(paramsStr: string): Parameter[]
```

### FunctionAnalyzer.detectDefaultValueType()

```typescript
/**
 * Classify a default value as Constant or Expression
 * @param value - The default value string
 * @returns DefaultValueType enum value
 */
private static detectDefaultValueType(value: string): DefaultValueType
```

### AHKLSPIntegration.getDocumentSymbols()

```typescript
/**
 * Get document symbols from LSP
 * @param document - The text document to parse
 * @returns Array of DocumentSymbol objects from LSP
 */
public async getDocumentSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]>
```

## Further Reading

- [Function Metadata Extraction Guide](FUNCTION_METADATA_EXTRACTION.md)
- [Code Map User Guide](../README.md#code-map-features)
- [AHK v2 Parameter Syntax](https://www.autohotkey.com/docs/v2/Functions.htm)
- [VS Code DocumentSymbol API](https://code.visualstudio.com/api/references/vscode-api#DocumentSymbol)

## Contributing

Found an edge case where parameter extraction fails? Please:
1. Create a minimal test case
2. File an issue with the function signature
3. Include expected vs actual behavior
4. Mention whether you're using LSP or fallback parser

We're always working to improve parameter extraction accuracy!

