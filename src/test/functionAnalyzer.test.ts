import * as assert from 'assert';
import * as vscode from 'vscode';
import { FunctionAnalyzer } from '../functionAnalyzer';
import { FunctionMetadataHandler } from '../functionMetadataHandler';

suite('AHK Function Analyzer', () => {
  test('Extract function metadata from simple function', async () => {
    const content = `
MyFunction(param1, param2 = 'default') {
  local x = 10
  static y = 20
  ; Some function body
}
`;
    const doc = await vscode.workspace.openTextDocument({ content, language: 'ahk' });
    const metadata = FunctionAnalyzer.extractFunctionMetadata(doc);

    assert.strictEqual(metadata.length, 1, 'Should extract one function');
    
    const func = metadata[0];
    assert.strictEqual(func.name, 'MyFunction', 'Function name should match');
    
    // Parameters
    assert.strictEqual(func.parameters.length, 2, 'Should have 2 parameters');
    assert.strictEqual(func.parameters[0].name, 'param1', 'First parameter name');
    assert.strictEqual(func.parameters[1].name, 'param2', 'Second parameter name');
    assert.strictEqual(func.parameters[1].hasDefault, true, 'Second parameter should have default');
    assert.strictEqual(func.parameters[1].defaultValue, "'default'", 'Default value should match');
    
    // Local and Static Variables
    assert.strictEqual(func.localVariables.length, 1, 'Should have 1 local variable');
    assert.strictEqual(func.localVariables[0].name, 'x', 'Local variable name');
    
    assert.strictEqual(func.staticVariables.length, 1, 'Should have 1 static variable');
    assert.strictEqual(func.staticVariables[0].name, 'y', 'Static variable name');
  });

  test('Extract metadata from function with by-ref parameters', async () => {
    const content = `
ProcessData(&input, &output = null) {
  local result
  ; Process some data
}
`;
    const doc = await vscode.workspace.openTextDocument({ content, language: 'ahk' });
    const metadata = FunctionAnalyzer.extractFunctionMetadata(doc);

    assert.strictEqual(metadata.length, 1, 'Should extract one function');
    
    const func = metadata[0];
    assert.strictEqual(func.name, 'ProcessData', 'Function name should match');
    
    // Parameters
    assert.strictEqual(func.parameters.length, 2, 'Should have 2 parameters');
    assert.strictEqual(func.parameters[0].name, 'input', 'First parameter name');
    assert.strictEqual(func.parameters[0].isByRef, true, 'First parameter should be by-ref');
    
    assert.strictEqual(func.parameters[1].name, 'output', 'Second parameter name');
    assert.strictEqual(func.parameters[1].isByRef, true, 'Second parameter should be by-ref');
    assert.strictEqual(func.parameters[1].hasDefault, true, 'Second parameter should have default');
    assert.strictEqual(func.parameters[1].defaultValue, 'null', 'Default value should match');
  });

  test('Get function metadata at specific position', async () => {
    const content = `
FirstFunction() {
  ; Some code
}

SecondFunction(param) {
  local x = 10
}
`;
    const doc = await vscode.workspace.openTextDocument({ content, language: 'ahk' });
    
    // Test first function
    const firstFuncMetadata = FunctionAnalyzer.getFunctionMetadataAtPosition(
      doc, 
      new vscode.Position(1, 0)
    );
    assert.strictEqual(firstFuncMetadata?.name, 'FirstFunction', 'Should find first function');
    
    // Test second function
    const secondFuncMetadata = FunctionAnalyzer.getFunctionMetadataAtPosition(
      doc, 
      new vscode.Position(5, 0)
    );
    assert.strictEqual(secondFuncMetadata?.name, 'SecondFunction', 'Should find second function');
  });

  test('Metadata Handler Caching', async () => {
    const content = `
SimpleFunction(x, y = 0) {
  local z = x + y
}
`;
    const doc = await vscode.workspace.openTextDocument({ content, language: 'ahk' });
    const handler = FunctionMetadataHandler.getInstance();

    // First call should extract metadata
    const firstMetadata = handler.getFunctionMetadata(doc.uri);
    assert.strictEqual(firstMetadata.length, 1, 'Should extract metadata');

    // Second call should use cached metadata
    const cachedMetadata = handler.getFunctionMetadata(doc.uri);
    assert.strictEqual(cachedMetadata.length, 1, 'Should return cached metadata');
  });
});