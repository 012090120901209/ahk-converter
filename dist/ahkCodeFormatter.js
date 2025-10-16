"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AHKCodeFormatter = void 0;
const vscode = require("vscode");
class AHKCodeFormatter {
    static formatCode(code, options = {}) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        let formattedCode = code;
        // Apply formatting rules based on options
        if (opts.fixObjectLiterals) {
            formattedCode = this.fixObjectLiterals(formattedCode);
        }
        if (opts.fixArrowFunctions) {
            formattedCode = this.fixArrowFunctions(formattedCode);
        }
        if (opts.fixInconsistentSpacing) {
            formattedCode = this.fixInconsistentSpacing(formattedCode);
        }
        if (opts.fixMissingBraces) {
            formattedCode = this.fixMissingBraces(formattedCode);
        }
        if (opts.normalizeIndentation) {
            formattedCode = this.normalizeIndentation(formattedCode);
        }
        return formattedCode;
    }
    static fixObjectLiterals(code) {
        // Fix object literals with incorrect spacing
        return code.replace(/\s*=>\s*(?=\{[^}]*\n)/g, ' => ');
    }
    static fixArrowFunctions(code) {
        // Fix arrow functions with inconsistent spacing
        return code.replace(/\s*=>\s*/g, ' => ');
    }
    static fixInconsistentSpacing(code) {
        // Fix multiple consecutive spaces
        return code.replace(/ {2,}/g, ' ');
    }
    static fixMissingBraces(code) {
        // Add missing braces for multi-line object literals
        return code.replace(/=>\s*\{([^}]*)\}/g, ' => {\n    $1\n}');
    }
    static normalizeIndentation(code) {
        const lines = code.split('\n');
        const formattedLines = lines.map(line => {
            // Replace leading tabs/spaces with 4 spaces
            return line.replace(/^(\s*)/, '    ');
        });
        return formattedLines.join('\n');
    }
    static getFormattingIssues(code) {
        const issues = [];
        const suggestions = [];
        // Check for object literal spacing issues
        const objectLiteralMatches = code.match(/\s*=>\s*(?=\{[^}]*\n)/g);
        if (objectLiteralMatches) {
            issues.push('Incorrect spacing around object literals');
            suggestions.push('Use consistent spacing: `=> {` instead of `=> {` with extra whitespace');
        }
        // Check for arrow function spacing issues
        const arrowMatches = code.match(/\s*=>\s*/g);
        if (arrowMatches) {
            issues.push('Inconsistent arrow function spacing');
            suggestions.push('Use consistent spacing around `=>` operator');
        }
        // Check for missing braces
        const missingBraceMatches = code.match(/=>\s*\{([^}]*)\}/g);
        if (missingBraceMatches) {
            issues.push('Missing braces in multi-line object literals');
            suggestions.push('Add proper braces for multi-line object literals');
        }
        return { issues, suggestions };
    }
    static createDiagnostic(document, range, message, severity = vscode.DiagnosticSeverity.Warning) {
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.source = 'AHK Code Formatter';
        diagnostic.code = 'formatting-issue';
        return diagnostic;
    }
    static async formatDocument(document, options = {}) {
        const text = document.getText();
        const formattedText = this.formatCode(text, options);
        if (text === formattedText) {
            return []; // No changes needed
        }
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
        return [vscode.TextEdit.replace(fullRange, formattedText)];
    }
    static registerFormattingProvider() {
        return vscode.languages.registerDocumentFormattingEditProvider({ language: 'ahk' }, {
            provideDocumentFormattingEdits: (document, options, token) => {
                return this.formatDocument(document, options);
            }
        });
    }
    static registerCodeActionProvider() {
        return vscode.languages.registerCodeActionsProvider({ language: 'ahk' }, {
            provideCodeActions: (document, range) => {
                const text = document.getText(range);
                const issues = this.getFormattingIssues(text);
                const actions = [];
                issues.issues.forEach((issue, index) => {
                    const action = new vscode.CodeAction(`Fix: ${issue}`, vscode.CodeActionKind.QuickFix);
                    action.command = {
                        command: 'ahk-converter.applyFormattingFix',
                        title: `Fix: ${issue}`,
                        arguments: [document, range, issue]
                    };
                    actions.push(action);
                });
                return actions;
            }
        });
    }
}
exports.AHKCodeFormatter = AHKCodeFormatter;
AHKCodeFormatter.DEFAULT_OPTIONS = {
    fixObjectLiterals: true,
    fixArrowFunctions: true,
    fixInconsistentSpacing: true,
    fixMissingBraces: true,
    normalizeIndentation: true
};
AHKCodeFormatter.FORMATTING_RULES = [
    {
        id: 'object-literal-spacing',
        name: 'Fix Object Literal Spacing',
        description: 'Fixes incorrect spacing around object literals and fat arrows',
        pattern: /\s*=>\s*(?=\{[^}]*\n)/g,
        replacement: ' => ',
        priority: 1
    },
    {
        id: 'arrow-function-spacing',
        name: 'Fix Arrow Function Spacing',
        description: 'Fixes spacing around arrow functions',
        pattern: /\s*=>\s*/g,
        replacement: ' => ',
        priority: 2
    },
    {
        id: 'inconsistent-braces',
        name: 'Fix Inconsistent Braces',
        description: 'Adds missing braces for multi-line object literals',
        pattern: /=>\s*\{([^}]*)\}/g,
        replacement: ' => {\n    $1\n}',
        priority: 3
    },
    {
        id: 'normalize-indentation',
        name: 'Normalize Indentation',
        description: 'Normalizes indentation to 4 spaces',
        pattern: /^(\s*)/gm,
        replacement: '    ',
        priority: 4
    }
];
//# sourceMappingURL=ahkCodeFormatter.js.map