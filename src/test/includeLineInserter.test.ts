import * as assert from 'assert';
import * as vscode from 'vscode';
import { insertIncludeLine, InsertIncludeOptions } from '../includeLineInserter';

/**
 * Helper function to create a mock document from text content
 */
async function createTestDocument(content: string, languageId: string = 'ahk2'): Promise<vscode.TextDocument> {
  // Create a new untitled document
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: languageId
  });
  return doc;
}

/**
 * Helper to get document text after insertion
 */
function getDocumentText(doc: vscode.TextDocument): string {
  return doc.getText();
}

suite('IncludeLineInserter Test Suite', () => {

  suite('Directive Anchor Detection', () => {
    test('Should find #SingleInstance as anchor when both directives exist', async () => {
      const content = `#Requires AutoHotkey v2.1
#SingleInstance Force

; Code
MsgBox("Hi")`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'TestLib'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Should insert after #SingleInstance
      assert.ok(text.includes('#SingleInstance Force\n\n#Include Lib/TestLib.ahk'));
    });

    test('Should find #Requires as anchor when only it exists', async () => {
      const content = `#Requires AutoHotkey v2

; Code
MsgBox("Hello World")`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'MyLib'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Should insert after #Requires
      assert.ok(text.includes('#Requires AutoHotkey v2\n\n#Include Lib/MyLib.ahk'));
    });
  });

  suite('Appending to Existing Include Block', () => {
    test('Should append to end of existing include block', async () => {
      const content = `#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Arrays.ahk
#Include Lib/Strings.ahk

; Code
MsgBox("Hi")`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Colors'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Should append after last include
      const lines = text.split('\n');
      const includeLines = lines.filter(l => l.trim().startsWith('#Include'));

      assert.strictEqual(includeLines.length, 3);
      assert.strictEqual(includeLines[2], '#Include Lib/Colors.ahk');
    });

    test('Should preserve comments within include block', async () => {
      const content = `#SingleInstance Force

#Include Lib/Net.ahk
; This is a comment
#Include Lib/IO.ahk

; Code`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Comment should still be there
      assert.ok(text.includes('; This is a comment'));

      // New include should be at the end
      assert.ok(text.includes('#Include Lib/IO.ahk\n#Include Lib/Utils.ahk'));
    });
  });

  suite('Creating New Include Block', () => {
    test('Should create include block with exactly one blank line', async () => {
      const content = `#Requires AutoHotkey v2

; Code
MsgBox("X")`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'MyLib2'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Should have exactly one blank line between #Requires and #Include
      assert.ok(text.includes('#Requires AutoHotkey v2\n\n#Include Lib/MyLib2.ahk'));
    });

    test('Should not add extra blank line if one already exists', async () => {
      const content = `#SingleInstance Force

; Code starts immediately after blank line
x := 1`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Net'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Should use the existing blank line
      const lines = text.split('\n');
      let blankLineCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '' && lines[i - 1]?.includes('#SingleInstance')) {
          blankLineCount++;
        }
      }

      assert.ok(blankLineCount <= 2); // One after #SingleInstance, one after #Include
    });
  });

  suite('Duplicate Detection', () => {
    test('Should detect exact duplicate and not insert', async () => {
      const content = `#Requires AutoHotkey v2.1
#SingleInstance Force

#Include Lib/Strings.ahk

; Code`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Strings'
      });

      assert.strictEqual(result.status, 'already_included');
      assert.ok(result.message.includes('already included'));
    });

    test('Should detect duplicate with different path format', async () => {
      const content = `#Include <MyLib>`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'MyLib'
      });

      assert.strictEqual(result.status, 'already_included');
    });

    test('Should detect duplicate with relative path', async () => {
      const content = `#Include ../shared/TestLib.ahk`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'TestLib'
      });

      assert.strictEqual(result.status, 'already_included');
    });

    test('Should be case-insensitive when detecting duplicates', async () => {
      const content = `#Include Lib/mylib.ahk`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'MyLib'
      });

      assert.strictEqual(result.status, 'already_included');
    });
  });

  suite('Header Auto-Insertion', () => {
    test('Should add headers when autoInsertHeaders is true and no headers exist', async () => {
      const content = `; Code
MsgBox("X")`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils',
        autoInsertHeaders: true,
        headerOrder: ['#Requires AutoHotkey v2.1', '#SingleInstance Force']
      });

      assert.strictEqual(result.status, 'headers_added');
      const text = getDocumentText(doc);

      // Both headers should be present
      assert.ok(text.includes('#Requires AutoHotkey v2.1'));
      assert.ok(text.includes('#SingleInstance Force'));
      assert.ok(text.includes('#Include Lib/Utils.ahk'));
    });

    test('Should not add headers when autoInsertHeaders is false', async () => {
      const content = `; Code
MsgBox("X")`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils',
        autoInsertHeaders: false
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Headers should not be added
      assert.ok(!text.includes('#Requires'));
      assert.ok(!text.includes('#SingleInstance'));
      assert.ok(text.includes('#Include Lib/Utils.ahk'));
    });

    test('Should only add missing headers', async () => {
      const content = `#Requires AutoHotkey v2.1

; Code`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils',
        autoInsertHeaders: true,
        headerOrder: ['#Requires AutoHotkey v2.1', '#SingleInstance Force']
      });

      // Should add #SingleInstance since #Requires already exists
      const text = getDocumentText(doc);

      assert.ok(text.includes('#Requires AutoHotkey v2.1'));
      assert.ok(text.includes('#SingleInstance Force'));
    });
  });

  suite('Custom Include Format', () => {
    test('Should use custom include format template', async () => {
      const content = `#Requires AutoHotkey v2.1`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'MyLib',
        includeFormat: '<{name}>'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      assert.ok(text.includes('#Include <MyLib>'));
      assert.ok(!text.includes('Lib/'));
    });

    test('Should use vendor folder format', async () => {
      const content = `#SingleInstance Force`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'ThirdParty',
        includeFormat: 'vendor/{name}.ahk'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      assert.ok(text.includes('#Include vendor/ThirdParty.ahk'));
    });
  });

  suite('Edge Cases', () => {
    test('Should handle empty file', async () => {
      const content = ``;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils',
        autoInsertHeaders: false
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      assert.ok(text.includes('#Include Lib/Utils.ahk'));
    });

    test('Should handle file with only comments', async () => {
      const content = `; This is my script
; Author: Me

; More comments`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils',
        autoInsertHeaders: true,
        headerOrder: ['#Requires AutoHotkey v2']
      });

      const text = getDocumentText(doc);

      // Headers should be inserted after comments
      assert.ok(text.includes('#Requires AutoHotkey v2'));
      assert.ok(text.includes('#Include Lib/Utils.ahk'));
    });

    test('Should handle include with inline comment', async () => {
      const content = `#Include Lib/Utils.ahk  ; Utility functions`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils'
      });

      assert.strictEqual(result.status, 'already_included');
    });

    test('Should preserve CRLF line endings', async () => {
      const content = `#Requires AutoHotkey v2.1\r\n#SingleInstance Force\r\n\r\n; Code`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils'
      });

      assert.strictEqual(result.status, 'inserted');
      const text = getDocumentText(doc);

      // Should preserve CRLF
      assert.ok(text.includes('\r\n'));
    });

    test('Should handle multiple #Requires directives (use first)', async () => {
      const content = `#Requires AutoHotkey v2.0
#Requires SomeLib v1.0

; Code`;

      const doc = await createTestDocument(content);
      const result = await insertIncludeLine(doc, {
        packageName: 'Utils'
      });

      assert.strictEqual(result.status, 'inserted');

      // Should use first #Requires as anchor
      const text = getDocumentText(doc);
      const lines = text.split('\n');
      const requiresIndex = lines.findIndex(l => l.includes('#Requires AutoHotkey'));
      const includeIndex = lines.findIndex(l => l.includes('#Include Lib/Utils'));

      assert.ok(includeIndex > requiresIndex);
    });
  });
});
