"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTestCommand = registerTestCommand;
const vscode = require("vscode");
const path = require("path");
const runner_1 = require("./runner");
function registerTestCommand(context) {
    const disposable = vscode.commands.registerCommand('ahk.runTests', async () => {
        const outputChannel = vscode.window.createOutputChannel('AHK Converter Tests');
        outputChannel.show();
        try {
            outputChannel.appendLine('Starting AHK Converter tests...\n');
            const testDir = path.join(context.extensionPath, 'test');
            const runner = new runner_1.TestRunner(testDir);
            const results = await runner.runTests();
            const passed = results.filter(r => r.passed).length;
            const total = results.length;
            outputChannel.appendLine(`\n=== Test Summary ===`);
            outputChannel.appendLine(`Passed: ${passed}/${total}`);
            if (passed === total) {
                outputChannel.appendLine('✅ All tests passed!');
            }
            else {
                outputChannel.appendLine('❌ Some tests failed.');
            }
            // Show detailed results
            for (const result of results) {
                const status = result.passed ? '✓' : '✗';
                outputChannel.appendLine(`\n${status} ${result.name}`);
                if (result.errors.length > 0) {
                    outputChannel.appendLine('  Errors:');
                    result.errors.forEach(error => outputChannel.appendLine(`    - ${error}`));
                }
                if (result.warnings.length > 0) {
                    outputChannel.appendLine('  Warnings:');
                    result.warnings.forEach(warning => outputChannel.appendLine(`    - ${warning}`));
                }
            }
        }
        catch (error) {
            outputChannel.appendLine(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
            vscode.window.showErrorMessage('Test execution failed. See output for details.');
        }
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=testCommand.js.map