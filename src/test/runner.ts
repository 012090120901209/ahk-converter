import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { validateAHKFile, validateConversionResult } from '../extension';

interface TestCase {
  name: string;
  input: string;
  expectedOutput?: string;
  shouldPass: boolean;
  expectedWarnings?: string[];
  expectedErrors?: string[];
}

interface TestResult {
  name: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  actualOutput?: string;
  expectedOutput?: string;
}

class TestRunner {
  private testResults: TestResult[] = [];
  private testDir: string;

  constructor(testDir: string) {
    this.testDir = testDir;
  }

  async runTests(): Promise<TestResult[]> {
    this.testResults = [];
    
    try {
      // Load test cases
      const testCases = await this.loadTestCases();
      
      // Run each test case
      for (const testCase of testCases) {
        const result = await this.runSingleTest(testCase);
        this.testResults.push(result);
      }

      // Display results
      this.displayResults();
      
      return this.testResults;
    } catch (error) {
      console.error('Test runner failed:', error);
      throw error;
    }
  }

  private async loadTestCases(): Promise<TestCase[]> {
    const testCases: TestCase[] = [];
    
    // Load test files from test directory
    const testFiles = await fs.promises.readdir(this.testDir);
    
    for (const file of testFiles) {
      if (file.endsWith('.test.ahk')) {
        const filePath = path.join(this.testDir, file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        // Parse test file for metadata
        const testCase = this.parseTestFile(file, content);
        testCases.push(testCase);
      }
    }

    // Add built-in test cases
    testCases.push(...this.getBuiltinTestCases());
    
    return testCases;
  }

  private parseTestFile(fileName: string, content: string): TestCase {
    const lines = content.split('\n');
    const metadata: any = {};
    let testContent: string[] = [];
    let inMetadata = false;

    for (const line of lines) {
      if (line.trim() === ';===TEST METADATA===') {
        inMetadata = true;
        continue;
      }
      
      if (line.trim() === ';===END METADATA===') {
        inMetadata = false;
        continue;
      }
      
      if (inMetadata && line.startsWith(';')) {
        const metaLine = line.substring(1).trim();
        const [key, ...valueParts] = metaLine.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      } else if (!inMetadata) {
        testContent.push(line);
      }
    }

    return {
      name: metadata.name || fileName,
      input: testContent.join('\n'),
      expectedOutput: metadata.expectedOutput,
      shouldPass: metadata.shouldPass !== 'false',
      expectedWarnings: metadata.expectedWarnings ? metadata.expectedWarnings.split(',').map((w: string) => w.trim()) : [],
      expectedErrors: metadata.expectedErrors ? metadata.expectedErrors.split(',').map((e: string) => e.trim()) : []
    };
  }

  private getBuiltinTestCases(): TestCase[] {
    return [
      {
        name: 'Simple MsgBox v1',
        input: `#NoEnv
#SingleInstance Force

MsgBox, Hello from AHK v1!
if (A_IsAdmin)
{
    MsgBox, Running as administrator
}

myVar := "test value"
MsgBox, Variable value: %myVar%`,
        shouldPass: true,
        expectedWarnings: ['Old MsgBox syntax detected', 'Legacy If statement detected']
      },
      {
        name: 'Empty file',
        input: '',
        shouldPass: false,
        expectedErrors: ['File is empty']
      },
      {
        name: 'Binary content',
        input: '\x00\x01\x02\x03',
        shouldPass: false,
        expectedErrors: ['File appears to contain binary content']
      },
      {
        name: 'Non-AHK content',
        input: `This is just plain text
without any AHK syntax
or commands.`,
        shouldPass: true,
        expectedWarnings: ['File may not contain AHK v1 syntax patterns']
      },
      {
        name: 'Complex AHK v1',
        input: `#NoEnv
#SingleInstance Force

; Test hotkey
^!s::
    Send, This is a test
return

; Test function
TestFunction(param1, param2) {
    if (param1 = param2) {
        MsgBox, Parameters are equal
        return true
    }
    return false
}

; Test loop
Loop, 10 {
    MsgBox, Iteration %A_Index%
}`,
        shouldPass: true,
        expectedWarnings: ['Old MsgBox syntax detected', 'Legacy If statement detected']
      }
    ];
  }

  private async runSingleTest(testCase: TestCase): Promise<TestResult> {
    const result: TestResult = {
      name: testCase.name,
      passed: true,
      errors: [],
      warnings: [],
      actualOutput: undefined,
      expectedOutput: testCase.expectedOutput
    };

    try {
      // Test input validation
      const validation = validateAHKFile(testCase.input);
      
      // Check expected errors
      if (testCase.expectedErrors) {
        for (const expectedError of testCase.expectedErrors) {
          if (!validation.errors.some((error: string) => error.includes(expectedError))) {
            result.passed = false;
            result.errors.push(`Expected error not found: ${expectedError}`);
          }
        }
      }

      // Check unexpected errors
      for (const error of validation.errors) {
        if (!testCase.expectedErrors || !testCase.expectedErrors.some(expected => error.includes(expected))) {
          result.passed = false;
          result.errors.push(`Unexpected error: ${error}`);
        }
      }

      // Check expected warnings
      if (testCase.expectedWarnings) {
        for (const expectedWarning of testCase.expectedWarnings) {
          if (!validation.warnings.some((warning: string) => warning.includes(expectedWarning))) {
            result.passed = false;
            result.errors.push(`Expected warning not found: ${expectedWarning}`);
          }
        }
      }

      // If validation should pass but doesn't
      if (testCase.shouldPass && !validation.isValid) {
        result.passed = false;
        result.errors.push('Test case should pass but validation failed');
      }

      // If validation should fail but passes
      if (!testCase.shouldPass && validation.isValid) {
        result.passed = false;
        result.errors.push('Test case should fail but validation passed');
      }

      result.warnings = validation.warnings;

    } catch (error) {
      result.passed = false;
      result.errors.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  private displayResults(): void {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passed}/${total}`);
    
    for (const result of this.testResults) {
      const status = result.passed ? '✓' : '✗';
      console.log(`\n${status} ${result.name}`);
      
      if (result.errors.length > 0) {
        console.log('  Errors:');
        result.errors.forEach(error => console.log(`    - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('  Warnings:');
        result.warnings.forEach(warning => console.log(`    - ${warning}`));
      }
    }
  }
}

// Export for use in extension
export { TestRunner, TestCase, TestResult };