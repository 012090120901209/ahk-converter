
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CodeFix {
    title: string;
    kind: vscode.CodeActionKind;
    command?: vscode.Command;
    edit?: vscode.WorkspaceEdit;
    priority?: number;
}

export class AHKCodeFixProvider {
    private static readonly FIXES = {
        OBJECT_LITERAL_SPACING: {
            title: 'Fix object literal spacing',
            kind: vscode.CodeActionKind.QuickFix,
            priority: 1
        },
        ARROW_FUNCTION_SPACING: {
            title: 'Fix arrow function spacing', 
            kind: vscode.CodeActionKind.QuickFix,
            priority: 2
        },
        MISSING_BRACES: {
            title: 'Add missing braces',
            kind: vscode.CodeActionKind.QuickFix,
            priority: 3
        }
    };

    static provideCodeActions(document: vscode.TextDocument, range: vscode.Range): CodeFix[] {
        const text = document.getText(range);
        const fixes: CodeFix[] = [];

        // Check for object literal spacing issues
        const objectLiteralMatch = text.match(/\s*=>\s*(?=\{[^}]*\n)/);
        if (objectLiteralMatch) {
            const fix = this.createObjectLiteralSpacingFix(document, range);
            fixes.push(fix);
        }

        // Check for arrow function spacing issues
        const arrowMatch = text.match(/\s*=>\s*/);
        if (arrowMatch) {
            const fix = this.createArrowFunctionSpacingFix(document, range);
            fixes.push(fix);
        }

        // Check for missing braces in multi-line object literals
        const missingBracesMatch = text.match(/=>\s*\{([^}]*)\}/);
        if (missingBracesMatch) {
            const fix = this.createMissingBracesFix(document, range);
            fixes.push(fix);
        }

        return fixes.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    }

    private static createObjectLiteralSpacingFix(document: vscode.TextDocument, range: vscode.Range): CodeFix {
        const text = document.getText(range);
        const fixedText = text.replace(/\s*=>\s*(?=\{[^}]*\n)/g, ' => ');
        
        return {
            title: this.FIXES.OBJECT_LITERAL_SPACING.title,
            kind: this.FIXES.OBJECT_LITERAL_SPACING.kind,
            edit: new vscode.WorkspaceEdit().replace(
                document.uri,
