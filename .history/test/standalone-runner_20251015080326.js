// Standalone test runner for validation functions
// This can run outside of VS Code environment

const fs = require('fs');
const path = require('path');

// Simplified validation functions (copied from extension.ts)
function validateAHKFile(content, filePath) {
  const warnings = [];
  const errors = [];

  try {
    // Check if file is empty
    if (!content || content.trim().length === 0) {
      errors.push('File is empty');
      return { isValid: false, warnings, errors };
    }

    // Check for binary content
    const hasBinaryContent = /[\x00-\x08\x0E-\x1F\x7F]/.test(content);
    if (hasBinaryContent) {
      errors.push('File appears to contain binary content');
      return { isValid: false, warnings, errors };
    }

    // Check for common AHK v1 patterns
    const lines = content.split('\n');
    let hasAHKPatterns = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith(';') || line === '') continue;

      // Check for AHK v1 specific patterns
      if (/#NoEnv/i.test(line) || 
          /MsgBox,\s*/.test(line) ||
          /If\s+/i.test(line) ||
          /%\w+%/.test(line) ||
          /:=\s*/.test(line) ||
          /Return\s*/.test(line)) {
        hasAHKPatterns = true;
      }

      // Check for potential issues
      if (line.includes('MsgBox,') && !line.includes('MsgBox(')) {
        warnings.push(`Line ${i + 1}: Old MsgBox syntax detected - should be converted to function call`);
      }
      
      if (line.includes('If ') && !line.includes('If (')) {
        warnings.push(`Line ${i + 1}: Legacy If statement detected - may need conversion`);
      }
    }

    if (!hasAHKPatterns) {
      warnings.push('File may not contain AHK v1 syntax patterns');
    }

    return { isValid: errors.length === 0, warnings, errors };
  } catch (error) {
    errors.push(`Validation error: ${error.message || String(error)}`);
    return { isValid: false, warnings, errors };
  }
}

// Test case parser
function parseTestFile(fileName, content) {
  const lines = content.split('\n');
  const metadata = {};
  let testContent = [];
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
    expectedWarnings: metadata.expectedWarnings ? metadata.expectedWarnings.split(',').map(w => w.trim()) : [],
    expectedErrors: metadata.expectedErrors ? metadata.expectedErrors.split(',').map(e => e.trim()) : []
  };
}

// Test runner
class TestRunner {
  constructor(testDir) {
    this.testDir = testDir;
    this.testResults = [];
  }

  async runTests() {
    this.testResults = [];
    
    try {
      // Load test cases
      const testCases = await this.loadTestCases();
      
      // Run each test case
      for (const testCase of testCases) {
        const result = this.runSingleTest(testCase);
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

  async loadTestCases() {
    const testCases = [];
    
    // Load test files from test directory
    const testFiles = fs.readdirSync(this.testDir);
    
    for (const file of testFiles) {
      if (file.endsWith('.test.ahk')) {
        const filePath = path.join(this.testDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse test file for metadata
        const testCase = parseTestFile(file, content);
        testCases.push(testCase);
      }
    }

    return testCases;
  }

  runSingleTest(testCase) {
    const result = {
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
          if (!validation.errors.some(error => error.includes(expectedError))) {
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
          if (!validation.warnings.some(warning => warning.includes(expectedWarning))) {
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
      result.errors.push(`Test execution error: ${error.message || String(error)}`);
    }

    return result;
  }

  displayResults() {
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

// Run tests if this file is executed directly
if (require.main === module) {
  const testDir = __dirname;
  const runner = new TestRunner(testDir);
  runner.runTests().catch(console.error);
}

module.exports = { TestRunner, validateAHKFile };