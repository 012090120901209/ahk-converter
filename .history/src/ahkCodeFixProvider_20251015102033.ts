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
                new vscode.Range(range.start, range.end),
                fixedText
            ),
            priority: this.FIXES.OBJECT_LITERAL_SPACING.priority
        };
    }

    private static createArrowFunctionSpacingFix(document: vscode.TextDocument, range: vscode.Range): CodeFix {
        const text = document.getText(range);
        const fixedText = text.replace(/\s*=>\s*/g, ' => ');
        
        return {
            title: this.FIXES.ARROW_FUNCTION_SPACING.title,
            kind: this.FIXES.ARROW_FUNCTION_SPACING.kind,
            edit: new vscode.WorkspaceEdit().replace(
                document.uri,
                new vscode.Range(range.start, range.end),
                fixedText
            ),
            priority: this.FIXES.ARROW_FUNCTION_SPACING.priority
        };
    }

    private static createMissingBracesFix(document: vscode.TextDocument, range: vscode.Range): CodeFix {
        const text = document.getText(range);
        const fixedText = text.replace(/=>\s*\{([^}]*)\}/g, ' => {\n    $1\n}');
        
        return {
            title: this.FIXES.MISSING_BRACES.title,
            kind: this.FIXES.MISSING_BRACES.kind,
            edit: new vscode.WorkspaceEdit().replace(
                document.uri,
                new vscode.Range(range.start, range.end),
                fixedText
            ),
            priority: this.FIXES.MISSING_BRACES.priority
        };
    }

    static registerCodeActionProvider(): vscode.Disposable {
        return vscode.languages.registerCodeActionsProvider(
            { language: 'ahk' },
            {
                provideCodeActions: (document, range) => {
                    const fixes = this.provideCodeActions(document, range);
                    
                    return fixes.map(fix => {
                        const action = new vscode.CodeAction(
                            fix.title,
                            fix.kind
                        );
                        
                        if (fix.edit) {
                            action.edit = fix.edit;
                        } else {
                            action.command = {
                                command: 'ahk-converter.applyCodeFix',
                                title: fix.title,
                                arguments: [document, range, fix.title]
                            };
                        }
                        
                        return action;
                    });
                }
            }
        );
    }

    static applyCodeFix(document: vscode.TextDocument, range: vscode.Range, fixTitle: string): void {
        const fixes = this.provideCodeActions(document, range);
        const fix = fixes.find(f => f.title === fixTitle);
        
        if (fix && fix.edit) {
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, fix.edit);
            vscode.workspace.applyEdit(workspaceEdit);
        }
    }
}