import * as vscode from 'vscode';
import * as path from 'path';
import { FunctionMetadataHandler } from './functionMetadataHandler';
import { FunctionAnalyzer } from './functionAnalyzer';
import { ConversionProfileManager } from './conversionProfiles';
import { getOutputChannelMonitor, RuntimeError } from './utils/outputChannelMonitor';
import { LibraryAttributionParticipant } from './libraryAttributionParticipant';

/**
 * AHK v2 Chat Participant
 * Provides intelligent assistance for AutoHotkey v2 development through GitHub Copilot Chat
 */
export class AHKChatParticipant {
  private context: vscode.ExtensionContext;
  private metadataHandler: FunctionMetadataHandler | undefined;
  private functionAnalyzer: FunctionAnalyzer | undefined;
  private conversionProfileManager: ConversionProfileManager | undefined;

  // Base system prompt for AHK v2 assistant
  private readonly BASE_PROMPT = `You are an expert AutoHotkey v2 coding assistant. You help developers write, debug, and optimize AHK v2 scripts.

KEY AHK V2 RULES YOU MUST FOLLOW:
- Use := for ALL assignments (never use = for assignment)
- Arrays are 1-indexed (not 0-indexed like other languages)
- All control flow uses expressions (no legacy command syntax)
- String concatenation uses the . operator
- Use ComObject() not ComObjCreate()
- Classes use modern OOP syntax with __New() constructor
- GUI uses object-based approach with Gui() constructor
- Use modern function syntax with parentheses
- String literals use quotes, variables don't need %
- Use A_ScriptDir, A_WorkingDir instead of %A_ScriptDir%

Provide clear, concise code with v2 syntax. Keep responses focused and practical.`;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Set references to extension services for context-aware assistance
   */
  public setServices(
    metadataHandler?: FunctionMetadataHandler,
    functionAnalyzer?: FunctionAnalyzer,
    conversionProfileManager?: ConversionProfileManager
  ) {
    this.metadataHandler = metadataHandler;
    this.functionAnalyzer = functionAnalyzer;
    this.conversionProfileManager = conversionProfileManager;
  }

  /**
   * Main request handler for chat participant
   */
  public async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      // Determine which handler to use based on command
      if (request.command) {
        await this.handleSlashCommand(request, context, stream, token);
      } else {
        await this.handleGeneralQuery(request, context, stream, token);
      }
    } catch (error) {
      if (error instanceof Error) {
        stream.markdown(`\n\n❌ **Error**: ${error.message}\n\n`);

        if (error.message.includes('language model')) {
          stream.markdown('💡 **Tip**: Make sure GitHub Copilot extension is installed and active.\n\n');
        }
      }
    }
  }

  /**
   * Handle slash commands (/convert, /explain, /fix, /optimize, /example)
   */
  private async handleSlashCommand(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    const command = request.command;
    const userPrompt = request.prompt;

    let systemPrompt = this.BASE_PROMPT;
    let enhancedPrompt = '';

    switch (command) {
      case 'convert':
        systemPrompt += '\n\nYou are specifically helping convert AutoHotkey v1 code to v2. Focus on identifying v1 patterns and providing accurate v2 equivalents.';
        enhancedPrompt = `Convert this AHK v1 code to v2:\n\n${userPrompt}`;
        break;

      case 'explain':
        systemPrompt += '\n\nYou are teaching AutoHotkey v2 concepts. Be clear, educational, and provide examples. Reference official v2 documentation when relevant.';
        enhancedPrompt = `Explain this AHK v2 concept:\n\n${userPrompt}`;
        break;

      case 'fix':
        systemPrompt += '\n\nYou are debugging AutoHotkey v2 code. Identify syntax errors, logic issues, and anti-patterns. Provide corrected code with explanations.';
        enhancedPrompt = `Analyze and fix this AHK v2 code:\n\n${userPrompt}`;

        // Add combined errors (runtime errors + diagnostics)
        const combinedErrors = this.getCombinedErrorContext();
        if (combinedErrors) {
          enhancedPrompt += `\n\n${combinedErrors}`;
        }

        // Add context from active editor if available
        const activeCode = this.getActiveEditorCode();
        if (activeCode && userPrompt.length < 100) {
          enhancedPrompt += `\n\nCurrent file context:\n\`\`\`ahk\n${activeCode}\n\`\`\``;
        }
        break;

      case 'optimize':
        systemPrompt += '\n\nYou are optimizing AutoHotkey v2 code. Suggest performance improvements, modern v2 idioms, and best practices. Explain the benefits of each optimization.';
        enhancedPrompt = `Optimize this AHK v2 code:\n\n${userPrompt}`;
        break;

      case 'example':
        systemPrompt += '\n\nYou are generating practical AutoHotkey v2 code examples. Provide working, ready-to-use code snippets with clear comments.';
        enhancedPrompt = `Generate an AHK v2 example for:\n\n${userPrompt}`;
        break;

      case 'attribute':
        // Handle library attribution directly, don't use LLM
        await this.handleLibraryAttribution(request, context, stream, token);
        return; // Early return since we handled it directly

      default:
        enhancedPrompt = userPrompt;
    }

    await this.sendToLanguageModel(systemPrompt, enhancedPrompt, stream, token);
  }

  /**
   * Handle library attribution command
   */
  private async handleLibraryAttribution(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      const userPrompt = request.prompt;

      // Get the active file or parse file path from prompt
      const editor = vscode.window.activeTextEditor;
      let filePath: string | undefined;

      if (editor && (editor.document.languageId === 'ahk' || editor.document.languageId === 'ahk2')) {
        filePath = editor.document.fileName;
      } else if (userPrompt) {
        // Try to extract file path from prompt
        const pathMatch = userPrompt.match(/([^\s]+\.ahk2?)/i);
        if (pathMatch) {
          filePath = pathMatch[1];
        }
      }

      if (!filePath) {
        stream.markdown('❌ **Error**: Please open an AHK library file or specify a file path.\n\n');
        stream.markdown('**Usage**: `@ahk /attribute` (with library file open) or `@ahk /attribute path/to/Library.ahk`\n\n');
        return;
      }

      // Check if it's in a Lib folder
      if (!filePath.includes('/Lib/') && !filePath.includes('\\Lib\\')) {
        stream.markdown('⚠️ **Warning**: This file is not in a Lib folder.\n\n');
      }

      stream.markdown(`🔍 Discovering metadata for \`${path.basename(filePath)}\`...\n\n`);

      // Use the LibraryAttributionParticipant
      const participant = new LibraryAttributionParticipant();
      const metadata = await participant.attributeLibrary(filePath, stream);

      if (metadata) {
        stream.markdown('\n\n💡 **What to do next:**\n');
        stream.markdown('1. Review the metadata above for accuracy\n');
        stream.markdown('2. Use the command palette: **AHKv2 Toolbox: Discover Library Metadata**\n');
        stream.markdown('3. Choose to insert the header or copy to clipboard\n\n');
      }
    } catch (error) {
      stream.markdown(`\n\n❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);

      if (error instanceof Error && error.message.includes('rate limit')) {
        stream.markdown('💡 **Tip**: Configure a GitHub Personal Access Token in settings to increase rate limits.\n\n');
        stream.markdown('Settings → AHKv2 Toolbox → GitHub Token\n\n');
      }
    }
  }

  /**
   * Handle general queries without slash commands
   */
  private async handleGeneralQuery(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    const userPrompt = request.prompt;
    let enhancedPrompt = `User question: ${userPrompt}`;

    // Add workspace context if relevant
    const workspaceContext = this.getWorkspaceContext();
    if (workspaceContext) {
      enhancedPrompt += `\n\n${workspaceContext}`;
    }

    // Add combined errors if the query is about errors/issues/problems
    const errorKeywords = ['error', 'issue', 'problem', 'bug', 'fix', 'wrong', 'broken', 'not working', "doesn't work", 'fail'];
    const isAboutErrors = errorKeywords.some(keyword =>
      userPrompt.toLowerCase().includes(keyword)
    );

    if (isAboutErrors) {
      const combinedErrors = this.getCombinedErrorContext();
      if (combinedErrors) {
        enhancedPrompt += `\n\n${combinedErrors}`;
      }
    }

    await this.sendToLanguageModel(this.BASE_PROMPT, enhancedPrompt, stream, token);
  }

  /**
   * Send prompt to language model and stream response
   */
  private async sendToLanguageModel(
    systemPrompt: string,
    userPrompt: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Combine prompts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Get available language models
    const models = await vscode.lm.selectChatModels({
      vendor: 'copilot',
      family: 'gpt-4'
    });

    if (models.length === 0) {
      throw new Error('No language model available. Please ensure GitHub Copilot is installed and active.');
    }

    // Use the first available model
    const model = models[0];

    // Send request to language model
    const response = await model.sendRequest(
      [
        vscode.LanguageModelChatMessage.User(fullPrompt)
      ],
      {},
      token
    );

    // Stream the response
    for await (const fragment of response.text) {
      stream.markdown(fragment);

      // Check for cancellation
      if (token.isCancellationRequested) {
        break;
      }
    }
  }

  /**
   * Get code from active editor for context
   */
  private getActiveEditorCode(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    // Only include if it's an AHK file and not too large
    const doc = editor.document;
    if (doc.languageId !== 'ahk' && doc.languageId !== 'ahk2') {
      return undefined;
    }

    const text = doc.getText();
    const maxLength = 2000; // Limit context size

    if (text.length > maxLength) {
      // If file is large, get selection or current function
      const selection = editor.selection;
      if (!selection.isEmpty) {
        return doc.getText(selection);
      }
      // Otherwise, return first part of file
      return text.substring(0, maxLength) + '\n... (file truncated)';
    }

    return text;
  }

  /**
   * Get workspace context for more informed responses
   */
  private getWorkspaceContext(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    const doc = editor.document;
    if (doc.languageId !== 'ahk' && doc.languageId !== 'ahk2') {
      return undefined;
    }

    let context = '';

    // Add file info
    const fileName = doc.fileName.split(/[\\/]/).pop();
    context += `Working in file: ${fileName}\n`;

    // Add language version
    context += `Language: AutoHotkey v2\n`;

    // TODO: Add function metadata context if available
    // TODO: Add dependency information if available

    return context.length > 0 ? context : undefined;
  }

  /**
   * Get diagnostics (problems) from the active document
   */
  private getDiagnostics(uri?: vscode.Uri): string | undefined {
    const editor = vscode.window.activeTextEditor;
    const targetUri = uri || editor?.document.uri;

    if (!targetUri) {
      return undefined;
    }

    // Get all diagnostics for this document
    const diagnostics = vscode.languages.getDiagnostics(targetUri);

    if (diagnostics.length === 0) {
      return undefined;
    }

    // Separate by severity
    const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
    const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);
    const infos = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Information);

    let output = '**Problems detected in this file:**\n\n';

    // Format errors
    if (errors.length > 0) {
      output += `❌ **Errors (${errors.length}):**\n`;
      errors.forEach((diag, idx) => {
        output += `${idx + 1}. Line ${diag.range.start.line + 1}: ${diag.message}\n`;
        if (diag.source) {
          output += `   Source: ${diag.source}\n`;
        }
      });
      output += '\n';
    }

    // Format warnings
    if (warnings.length > 0) {
      output += `⚠️ **Warnings (${warnings.length}):**\n`;
      warnings.forEach((diag, idx) => {
        output += `${idx + 1}. Line ${diag.range.start.line + 1}: ${diag.message}\n`;
        if (diag.source) {
          output += `   Source: ${diag.source}\n`;
        }
      });
      output += '\n';
    }

    // Format info messages (limit to 5 to avoid overwhelming)
    if (infos.length > 0) {
      output += `ℹ️ **Info (${infos.length}):**\n`;
      infos.slice(0, 5).forEach((diag, idx) => {
        output += `${idx + 1}. Line ${diag.range.start.line + 1}: ${diag.message}\n`;
      });
      if (infos.length > 5) {
        output += `   ... and ${infos.length - 5} more\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Get code snippet around a specific line for context
   */
  private getCodeSnippetAtLine(lineNumber: number, contextLines: number = 3): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    const doc = editor.document;
    const totalLines = doc.lineCount;

    // Calculate range
    const startLine = Math.max(0, lineNumber - contextLines);
    const endLine = Math.min(totalLines - 1, lineNumber + contextLines);

    let snippet = '';
    for (let i = startLine; i <= endLine; i++) {
      const line = doc.lineAt(i);
      const marker = i === lineNumber ? '→ ' : '  ';
      snippet += `${marker}${i + 1}: ${line.text}\n`;
    }

    return snippet;
  }

  /**
   * Get runtime errors from output channels
   */
  private getOutputErrors(filePath?: string): string | undefined {
    const monitor = getOutputChannelMonitor();

    // Get errors for the active file if no path specified
    let targetPath = filePath;
    if (!targetPath) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        targetPath = editor.document.fileName;
      }
    }

    // Get recent errors (filtered by file if specified)
    const errors = monitor.getRecentErrors(targetPath);

    if (errors.length === 0) {
      return undefined;
    }

    // Format errors for chat
    return monitor.formatErrorsForChat(errors);
  }

  /**
   * Get combined error context (diagnostics + output errors)
   */
  private getCombinedErrorContext(): string | undefined {
    const diagnostics = this.getDiagnostics();
    const outputErrors = this.getOutputErrors();

    if (!diagnostics && !outputErrors) {
      return undefined;
    }

    let combined = '';

    // Runtime errors first (they're usually more critical)
    if (outputErrors) {
      combined += outputErrors + '\n';
    }

    // Then static diagnostics
    if (diagnostics) {
      combined += diagnostics;
    }

    return combined;
  }

  /**
   * Create follow-up suggestions for the user
   */
  private addFollowUpSuggestions(
    stream: vscode.ChatResponseStream,
    command?: string
  ): void {
    // Add helpful follow-up prompts based on command
    const followUps: vscode.ChatFollowup[] = [];

    if (command === 'convert') {
      followUps.push({
        prompt: 'Explain the key differences between v1 and v2',
        label: '📚 v1 vs v2 differences'
      });
      followUps.push({
        prompt: 'Show me more v1 to v2 conversion examples',
        label: '💡 More examples'
      });
    } else if (command === 'explain') {
      followUps.push({
        prompt: 'Give me a code example',
        label: '💻 Show code example',
        command: 'example'
      });
    } else if (command === 'fix') {
      followUps.push({
        prompt: 'Explain best practices to avoid this issue',
        label: '📖 Best practices'
      });
    } else if (command === 'optimize') {
      followUps.push({
        prompt: 'What are other common AHK v2 performance tips?',
        label: '⚡ Performance tips'
      });
    } else {
      followUps.push({
        prompt: 'Convert v1 code to v2',
        label: '🔄 Convert code',
        command: 'convert'
      });
      followUps.push({
        prompt: 'Explain a v2 concept',
        label: '📚 Explain concept',
        command: 'explain'
      });
    }

    // Note: Follow-ups are added automatically by VS Code based on conversation context
    // This method is here for future extensibility
  }
}

/**
 * Register the AHK v2 chat participant
 */
export function registerAHKChatParticipant(
  context: vscode.ExtensionContext,
  metadataHandler?: FunctionMetadataHandler,
  functionAnalyzer?: FunctionAnalyzer,
  conversionProfileManager?: ConversionProfileManager
): vscode.Disposable {
  const participant = new AHKChatParticipant(context);
  participant.setServices(metadataHandler, functionAnalyzer, conversionProfileManager);

  const chatParticipant = vscode.chat.createChatParticipant(
    'ahkv2-toolbox.ahk-assistant',
    async (request, context, stream, token) => {
      await participant.handleRequest(request, context, stream, token);
    }
  );

  // Set icon for the participant (optional)
  chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'AHK_Code.svg');

  return chatParticipant;
}
