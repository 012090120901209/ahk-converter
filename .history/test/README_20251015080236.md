# AHK Converter Test Framework

This directory contains test files and utilities for testing the AHK Converter extension.

## Test File Format

Test files use the `.test.ahk` extension and contain metadata in a specific format:

```
;===TEST METADATA===
;name: Test Name
;shouldPass: true|false
;expectedWarnings: warning1,warning2
;expectedErrors: error1,error2
;===END METADATA===

; AHK v1 code to test goes here
```

## Running Tests

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "AHK: Run Tests"
3. Press Enter

Test results will be displayed in the "AHK Converter Tests" output channel.

## Test Cases

### Current Test Files

- `simple-msgbox.test.ahk` - Tests basic MsgBox v1 syntax
- `empty-file.test.ahk` - Tests empty file validation
- `complex-syntax.test.ahk` - Tests complex AHK v1 syntax patterns

### Built-in Test Cases

The test runner also includes built-in test cases that don't require separate files:
- Simple MsgBox v1 conversion
- Empty file validation
- Binary content detection
- Non-AHK content handling
- Complex AHK v1 syntax

## Test Categories

### Validation Tests
- Empty file detection
- Binary content detection
- AHK v1 pattern recognition
- Syntax validation

### Conversion Tests
- MsgBox syntax conversion
- If statement conversion
- Variable reference conversion
- Function definition conversion

### Error Handling Tests
- Invalid file paths
- Missing converter script
- Permission errors
- Network failures

## Adding New Tests

To add a new test case:

1. Create a new `.test.ahk` file in this directory
2. Add the metadata section at the top
3. Include the AHK v1 code to test
4. Run the test suite

The test framework will automatically discover and run all `.test.ahk` files.