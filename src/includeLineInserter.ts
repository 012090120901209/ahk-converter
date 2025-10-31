import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Result of an include line insertion operation
 */
export interface InsertIncludeResult {
  status: 'inserted' | 'already_included' | 'headers_added' | 'error';
  message: string;
  lineNumber?: number;
}

/**
 * Options for inserting include lines
 */
export interface InsertIncludeOptions {
  /** Package name to include (e.g., "JSON") */
  packageName: string;
  /** Format template for the include path (default: "Lib/{name}.ahk") */
  includeFormat?: string;
  /** Whether to auto-insert headers if missing (default: false) */
  autoInsertHeaders?: boolean;
  /** Order of headers to insert */
  headerOrder?: string[];
  /** Default #Requires value */
  defaultRequires?: string;
  /** Default #SingleInstance value */
  defaultSingleInstance?: string;
}

/**
 * Inserts an #Include line into an AutoHotkey v2 file following the documented rules
 * See: docs/INCLUDE_INSERTION_RULES.md
 */
export async function insertIncludeLine(
  document: vscode.TextDocument,
  options: InsertIncludeOptions
): Promise<InsertIncludeResult> {
  try {
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const eol = detectEOL(text);

    // Get configuration
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
    const includeFormat = options.includeFormat || config.get<string>('includeFormat', 'Lib/{name}.ahk');
    const autoInsertHeaders = options.autoInsertHeaders ?? config.get<boolean>('autoInsertHeaders', false);
    const headerOrder = options.headerOrder || config.get<string[]>('headerOrder', [
      '#Requires AutoHotkey v2.1',
      '#SingleInstance Force'
    ]);

    // Create the include line to insert
    const includePath = includeFormat.replace('{name}', options.packageName);
    const includeLineToInsert = `#Include ${includePath}`;

    // Check for duplicates first
    const normalizedName = normalizeIncludeName(includePath);
    const existingIncludeIndex = findExistingInclude(lines, normalizedName);

    if (existingIncludeIndex !== -1) {
      return {
        status: 'already_included',
        message: `${options.packageName} is already included in this file`,
        lineNumber: existingIncludeIndex + 1
      };
    }

    // Track if headers were added
    let headersAdded = false;

    // Rule 1: Find the directive anchor
    let anchorLine = findDirectiveAnchor(lines);

    // If no anchor found and autoInsertHeaders is enabled, add headers
    if (anchorLine === -1 && autoInsertHeaders) {
      const insertedHeaders = insertHeaders(lines, headerOrder, eol);
      if (insertedHeaders.length > 0) {
        headersAdded = true;
        // The anchor is now the last inserted header
        anchorLine = insertedHeaders.length - 1;
      }
    }

    // If still no anchor, insert at top of file
    if (anchorLine === -1) {
      anchorLine = 0;
    }

    // Rule 2: Find the include block
    const includeBlock = findIncludeBlock(lines, anchorLine);

    // Rule 3: Insert the include line
    const insertionIndex = includeBlock.endLine !== -1
      ? includeBlock.endLine + 1  // Append after last include
      : anchorLine + 1;           // Create new block

    // Build the new content
    const newLines = [...lines];

    if (includeBlock.startLine === -1) {
      // No include block exists - create one
      // Ensure exactly one blank line after anchor
      const lineAfterAnchor = anchorLine + 1;

      if (lineAfterAnchor < newLines.length) {
        const nextLine = newLines[lineAfterAnchor].trim();

        if (nextLine === '') {
          // Already have a blank line, insert include after it
          newLines.splice(lineAfterAnchor + 1, 0, includeLineToInsert);
        } else {
          // No blank line, add one then the include
          newLines.splice(lineAfterAnchor, 0, '', includeLineToInsert);
        }
      } else {
        // End of file, add blank line then include
        newLines.push('', includeLineToInsert);
      }
    } else {
      // Include block exists - append to it
      newLines.splice(includeBlock.endLine + 1, 0, includeLineToInsert);
    }

    // Apply the edit
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    edit.replace(document.uri, fullRange, newLines.join(eol));

    const success = await vscode.workspace.applyEdit(edit);

    if (success) {
      // Save the document
      await document.save();

      return {
        status: headersAdded ? 'headers_added' : 'inserted',
        message: headersAdded
          ? `Added headers and included ${options.packageName}`
          : `Successfully included ${options.packageName}`,
        lineNumber: insertionIndex + 1
      };
    } else {
      return {
        status: 'error',
        message: 'Failed to apply edit to document'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Detects the EOL style used in the document (CRLF or LF)
 */
function detectEOL(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

/**
 * Normalizes an include path to just the base filename without extension
 * Examples:
 *   "Lib/MyLib.ahk" -> "mylib"
 *   "<MyLib>" -> "mylib"
 *   "../shared/MyLib.ahk" -> "mylib"
 */
function normalizeIncludeName(includePath: string): string {
  // Remove angle brackets if present
  let cleaned = includePath.replace(/<|>/g, '');

  // Get the base filename
  const baseName = path.basename(cleaned, '.ahk');

  // Return lowercase for case-insensitive comparison
  return baseName.toLowerCase();
}

/**
 * Finds an existing #Include line that matches the normalized name
 * Returns the line index (0-based) or -1 if not found
 */
function findExistingInclude(lines: string[], normalizedName: string): number {
  const includePattern = /^\s*#Include\s+(.+?)(?:\s*;.*)?$/i;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(includePattern);
    if (match) {
      const existingPath = match[1].trim();
      const existingNormalized = normalizeIncludeName(existingPath);

      if (existingNormalized === normalizedName) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Finds the directive anchor line following priority order:
 * 1. #SingleInstance (takes precedence)
 * 2. #Requires AutoHotkey v2
 * 3. Returns -1 if neither found
 *
 * Returns the 0-based line index
 */
function findDirectiveAnchor(lines: string[]): number {
  let requiresLine = -1;
  let singleInstanceLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for #SingleInstance (case insensitive)
    if (/^#SingleInstance\b/i.test(line)) {
      singleInstanceLine = i;
      break; // #SingleInstance takes precedence, so we can stop
    }

    // Check for #Requires AutoHotkey v2
    if (/^#Requires\s+AutoHotkey\s+v2/i.test(line)) {
      if (requiresLine === -1) {
        requiresLine = i;
      }
    }
  }

  // Priority: #SingleInstance > #Requires
  if (singleInstanceLine !== -1) {
    return singleInstanceLine;
  }

  return requiresLine;
}

/**
 * Finds the include block starting from the anchor line
 * Returns { startLine, endLine } (0-based indices)
 * Both are -1 if no include block exists
 */
function findIncludeBlock(lines: string[], anchorLine: number): { startLine: number; endLine: number } {
  let searchStart = anchorLine + 1;

  // Skip at most one blank line after the anchor
  if (searchStart < lines.length && lines[searchStart].trim() === '') {
    searchStart++;
  }

  // Now look for the first #Include line
  let startLine = -1;
  let endLine = -1;

  const includePattern = /^\s*#Include\b/i;
  const commentPattern = /^\s*;/;

  for (let i = searchStart; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if it's an include line
    if (includePattern.test(line)) {
      if (startLine === -1) {
        startLine = i;
      }
      endLine = i;
    }
    // Check if it's a pure comment line (doesn't break continuity)
    else if (commentPattern.test(line)) {
      continue;
    }
    // If it's not empty, include, or comment, the block ends
    else if (line !== '') {
      break;
    }
  }

  return { startLine, endLine };
}

/**
 * Inserts headers at the top of the file
 * Returns the modified lines and the indices of inserted headers
 */
function insertHeaders(lines: string[], headerOrder: string[], eol: string): string[] {
  const headersToAdd: string[] = [];

  // Check which headers are missing
  for (const header of headerOrder) {
    const headerPattern = new RegExp(`^${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const exists = lines.some(line => headerPattern.test(line.trim()));

    if (!exists) {
      headersToAdd.push(header);
    }
  }

  if (headersToAdd.length === 0) {
    return [];
  }

  // Find where to insert (skip leading comment block if any)
  let insertIndex = 0;

  // Skip leading comments and blank lines
  while (insertIndex < lines.length) {
    const line = lines[insertIndex].trim();
    if (line === '' || line.startsWith(';')) {
      insertIndex++;
    } else {
      break;
    }
  }

  // Insert headers at the found position
  lines.splice(insertIndex, 0, ...headersToAdd);

  return headersToAdd;
}

/**
 * Shows a preview dialog before inserting the include line
 */
export async function previewIncludeInsertion(
  document: vscode.TextDocument,
  options: InsertIncludeOptions
): Promise<boolean> {
  const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
  const includeFormat = options.includeFormat || config.get<string>('includeFormat', 'Lib/{name}.ahk');
  const includePath = includeFormat.replace('{name}', options.packageName);

  const answer = await vscode.window.showInformationMessage(
    `Add #Include ${includePath} to ${path.basename(document.fileName)}?`,
    'Yes',
    'No'
  );

  return answer === 'Yes';
}
