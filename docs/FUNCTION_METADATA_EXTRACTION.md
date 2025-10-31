# Enhanced Function Metadata Extraction

The AHKv2 Toolbox includes a powerful function introspection system that can extract detailed metadata from AutoHotkey v2 functions through static code analysis.

## Features

### Parameter Analysis

The metadata extractor can identify and classify:

#### 1. **ByRef Parameters** (`&param`)
```ahk
Function(&byRefParam, normalParam) {
    ; byRefParam is passed by reference
}
```

**Metadata:**
- `isByRef: true`

#### 2. **Optional Parameters** (`param?`) - AHK v2.1+
```ahk
Function(required, optional?) {
    ; optional can be omitted
}
```

**Metadata:**
- `isOptional: true`
- Does not count toward `minParams`

#### 3. **Default Values**

The system distinguishes between **constants** and **expressions**:

**Constants** (DefaultValueType.Constant):
```ahk
Function(p1 := "string", p2 := 123, p3 := true, p4 := unset) {
    ; Literal values that can be statically determined
}
```

**Expressions** (DefaultValueType.Expression):
```ahk
Function(p1 := Random(1, 6), p2 := obj.prop, p3 := [], p4 := 2 + 2) {
    ; Complex expressions that require evaluation
}
```

**Metadata:**
- `hasDefault: true/false`
- `defaultValue: string` - The raw default value text
- `defaultValueType: DefaultValueType` - Constant, Expression, or None

**Note:** As discussed in the AHK community, when a default value is an expression like `Random(1, 6)`, it's impossible to determine the actual runtime value through static analysis. The system correctly identifies this as `DefaultValueType.Expression`.

#### 4. **Type Hints** - AHK v2.1+
```ahk
Function(name: String, count: Integer, arr: Array) {
    ; Parameters with type annotations
}
```

**Metadata:**
- `typeHint: string` - The declared type (e.g., "String", "Integer")

#### 5. **Variadic Parameters** (`*args`)
```ahk
Function(first, second, *rest) {
    ; rest contains all additional arguments
}
```

**Metadata:**
- `name: "*"` for the variadic param
- `maxParams: "variadic"`
- `isVariadic: true` on function metadata

### Variable Detection

#### 1. **Static Variables**
```ahk
Function() {
    static a, b := 10, c := "initialized"
    ; Multiple static variables in one declaration
}
```

**Metadata:**
- `scope: "static"`
- `scopeValue: VariableScope.Static` (1)
- `hasInitializer: true/false`
- `initializerValue: string` - The initialization expression

#### 2. **Assignment Chains**
```ahk
Function() {
    d := e := f := 0
    ; All three variables are detected as local
}
```

**Metadata:**
- All variables in the chain are captured
- `scope: "local"`
- `initializerValue: "0"` - The final value in the chain

#### 3. **Local Variables**
```ahk
Function() {
    local g, h := "value"
    x := 5  ; Implicit local
}
```

**Metadata:**
- `scope: "local"`
- `scopeValue: VariableScope.Local` (0)

#### 4. **Global Variables**
```ahk
Function() {
    global i, j
}
```

**Metadata:**
- `scope: "global"`
- `scopeValue: VariableScope.Global` (2)

### Function-Level Metadata

#### Return Type Hints - AHK v2.1+
```ahk
Function(x, y) => Integer {
    return x + y
}
```

**Metadata:**
- `returnType: "Integer"`

#### Parameter Counts
```ahk
Function(required, optional := "default", *args) {
}
```

**Metadata:**
- `minParams: 1` - Only required parameters
- `maxParams: "variadic"` - Has variadic parameter
- `isVariadic: true`

## API Usage

### Extracting Metadata

```typescript
import { FunctionAnalyzer } from './functionAnalyzer';

// Get all function metadata from a document
const metadata = FunctionAnalyzer.extractFunctionMetadata(document);

// Get metadata for function at cursor position
const funcMetadata = FunctionAnalyzer.getFunctionMetadataAtPosition(document, position);
```

### Metadata Structure

```typescript
interface FunctionMetadata {
  name: string;
  parameters: Parameter[];
  staticVariables: VariableInfo[];
  localVariables: VariableInfo[];
  minParams: number;
  maxParams: number | 'variadic';
  isVariadic: boolean;
  returnType?: string;
  location: {
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  };
}

interface Parameter {
  name: string;
  isByRef: boolean;
  isOptional: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  defaultValueType: DefaultValueType;
  typeHint?: string;
  position: number;
}

enum DefaultValueType {
  None = 0,           // No default value
  Constant = 1,       // Literal value
  Expression = 2,     // Requires evaluation
  Unresolvable = 3    // Cannot determine
}

interface VariableInfo {
  name: string;
  scope: 'static' | 'local' | 'global';
  scopeValue?: VariableScope;
  hasInitializer: boolean;
  initializerValue?: string;
  declarationLine: number;
  declarationCharacter: number;
}
```

## Limitations

### 1. **Static Analysis Only**

The metadata extraction uses regex-based static analysis, not runtime introspection. This means:

- ✅ Can detect parameter structure and types
- ✅ Can identify constants vs expressions
- ❌ Cannot evaluate expressions or determine runtime values
- ❌ Cannot access AHK's internal function structures

### 2. **Expression Default Values**

When a default value is an expression like `Random(1, 6)`:
- The system correctly identifies it as `DefaultValueType.Expression`
- The raw expression text is stored in `defaultValue`
- The actual runtime value cannot be determined through static analysis

This aligns with the community discussion:
> "What I'm wondering is whether it's possible to determine the default value that's being used. But probably not since it's some kind of expression like... `DoSomething(Param := Random(1, 6))` - no way to find out default val"

### 3. **Complex Scenarios**

Some advanced patterns may not be fully captured:
- Dynamic function definitions
- Meta-programming with `Call()`
- Functions defined in strings or loaded at runtime
- Extremely complex nesting or multi-line declarations

## Comparison with Runtime Introspection

The Discord conversation showed a runtime introspection approach using AHK's internal pointers:

```ahk
// Runtime approach (AHK v2 script)
info := FunctionInfo.Collect(TargetFunction)
// Accesses internal structures via pointers
```

**Runtime Introspection:**
- ✅ Can access exact internal structures
- ✅ Gets actual compiled representation
- ❌ Requires running the script
- ❌ AHK-version dependent
- ❌ Uses undocumented internal structures

**Static Analysis (This Extension):**
- ✅ Works without running code
- ✅ Fast and safe
- ✅ Version-independent parsing
- ✅ Integrates with VS Code features
- ❌ Cannot evaluate expressions
- ❌ Limited to source-level information

## Future Enhancements

Potential improvements:
1. **LSP Integration**: Use thqby's AHK v2 LSP for semantic analysis
2. **AST Parsing**: More robust parsing with proper AST
3. **Type Inference**: Infer types from usage patterns
4. **Expression Evaluation**: Limited constant folding for simple expressions
5. **Documentation Comments**: Extract JSDoc-style comments

## Examples

See `test/enhanced-metadata.test.ahk` for comprehensive examples demonstrating all supported features.

## Related Documentation

- [Code Map](../README.md#language-support) - Visual function tree with metadata
- [Function Analyzer API](../src/functionAnalyzer.ts) - Implementation details
- [Metadata Types](../src/models/functionMetadata.ts) - TypeScript interfaces

