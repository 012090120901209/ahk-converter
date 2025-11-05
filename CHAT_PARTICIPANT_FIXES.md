# @ahk Chat Participant - Implementation Fixes

## Overview
This document provides the exact code changes needed to fix the @ahk chat participant issues identified in the troubleshooting guide.

## Fix 1: Add Chat Participants Declaration to package.json

### Location: `package.json` - Add to `contributes` section

```json
{
  "name": "ahkv2-toolbox",
  "displayName": "AHKv2 Toolbox",
  "contributes": {
    "chatParticipants": [
      {
        "id": "ahkv2-toolbox.ahk-assistant",
        "name": "ahk",
        "fullName": "AHK v2 Assistant",
        "description": "AutoHotkey v2 development assistant with code conversion, debugging, and best practices",
        "isSticky": false
      }
    ],
    "commands": [
      // ... existing commands
      {
        "command": "ahkv2Toolbox.testChatParticipant",
        "title": "Test Chat Participant",
        "category": "AHKv2 Toolbox",
        "icon": "$(comment-discussion)"
      }
    ],
    "menus": {
      // ... existing menus
      "chatParticipants": [
        {
          "command": "ahkv2-toolbox.ahk-assistant",
          "when": "true"
        }
      ]
    }
  }
}
```

## Fix 2: Update VS Code Version Requirements

### Location: `package.json` - Update engines

```json
{
  "engines": {
    "vscode": "^1.90.0"
  },
  "activationEvents": [
    "onLanguage:ahk",
    "onLanguage:ahk2",
    "workspaceContains:**/*.ahk",
    "workspaceContains:**/*.ahk2",
    "onCommand:ahkv2Toolbox.open",
    "onCommand:ahkv2Toolbox.testChatParticipant",
    "onView:ahkv2Toolbox",
    "onView:ahkDependencyTree",
    "onView:codeMap"
  ]
}
```

## Fix 3: Improve Chat Participant Registration with Error Handling

### Location: `src/chatParticipant.ts` - Update sendToLanguageModel method

```typescript
/**
 * Send prompt to language model and stream response
 */
private async sendToLanguageModel(
  systemPrompt: string,
  userPrompt: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  try {
    // Check if GitHub Copilot is available
    const copilotExtension = vscode.extensions.getExtension('github.copilot');
    if (!copilotExtension) {
      stream.markdown('❌ **GitHub Copilot Not Found**\n\n');
      stream.markdown('The @ahk assistant requires GitHub Copilot to be installed and enabled.\n\n');
      stream.markdown('**To fix:**\n');
      stream.markdown('1. Install GitHub Copilot extension from VS Code marketplace\n');
      stream.markdown('2. Sign in to GitHub Copilot\n');
      stream.markdown('3. Enable Copilot Chat in settings\n\n');
      return;
    }

    if (!copilotExtension.isActive) {
      try {
        await copilotExtension.activate();
      } catch (error) {
        stream.markdown('❌ **GitHub Copilot Activation Failed**\n\n');
        stream.markdown('Please try reloading VS Code or reinstalling GitHub Copilot.\n\n');
        return;
      }
    }

    // Combine prompts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Get available language models with better error handling
    let models: vscode.ChatModel[] = [];
    try {
      models = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4'
      });

      // Fallback to any available model
      if (models.length === 0) {
        models = await vscode.lm.selectChatModels({
          vendor: 'copilot'
        });
      }
    } catch (error) {
      stream.markdown('❌ **Language Model Error**\n\n');
      stream.markdown('Unable to access GitHub Copilot language models.\n\n');
      stream.markdown('**Please check:**\n');
      stream.markdown('1. GitHub Copilot subscription is active\n');
      stream.markdown('2. You are signed in to GitHub in VS Code\n');
      stream.markdown('3. Copilot Chat is enabled in settings\n\n');
      return;
    }

    if (models.length === 0) {
      stream.markdown('❌ **No Language Models Available**\n\n');
      stream.markdown('GitHub Copilot Chat appears to be disabled or unavailable.\n\n');
      stream.markdown('**To fix:**\n');
      stream.markdown('1. Check GitHub Copilot settings in VS Code\n');
      stream.markdown('2. Ensure you have an active Copilot subscription\n');
      stream.markdown('3. Try signing out and back in to GitHub\n\n');
      return;
    }

    // Use the first available model
    const model = models[0];

    // Send request to language model with progress
    stream.progress('Processing your request...');

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
        stream.markdown('\n\n*Request cancelled by user*\n');
        break;
      }
    }

    // Add follow-up suggestions
    this.addFollowUpSuggestions(stream);

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('language model') || error.message.includes('chat')) {
        stream.markdown('❌ **Chat Service Error**\n\n');
        stream.markdown('GitHub Copilot Chat is not available. Please ensure:\n\n');
        stream.markdown('1. GitHub Copilot extension is installed\n');
        stream.markdown('2. You have an active Copilot subscription\n');
        stream.markdown('3. Copilot Chat feature is enabled\n\n');
        return;
      }
    }

    stream.markdown('❌ **Unexpected Error**\n\n');
    stream.markdown(`Error: ${error instanceof Error ? error.message : String(error)}\n\n`);
    stream.markdown('Please try again or check the extension logs for details.\n');
  }
}
```

## Fix 4: Improve Extension Activation Logic

### Location: `src/extension.ts` - Update chat participant registration

```typescript
// Register AHK v2 Chat Participant
try {
  // Check VS Code version for chat support
  const vscodeVersion = vscode.version;
  const majorVersion = parseInt(vscodeVersion.split('.')[0]);
  const minorVersion = parseInt(vscodeVersion.split('.')[1]);

  if (majorVersion < 1 || (majorVersion === 1 && minorVersion < 90)) {
    console.log('Chat Participant disabled: VS Code 1.90+ required');
  } else {
    const chatParticipant = registerAHKChatParticipant(
      ctx,
      // TODO: pass actual instances when available
      undefined, // metadataHandler
      undefined, // functionAnalyzer
      undefined  // conversionProfileManager
    );
    ctx.subscriptions.push(chatParticipant);
    console.log('AHK v2 Chat Participant registered successfully');

    // Show success message in output channel
    getOutput().appendLine('[chat] AHK v2 Chat Participant registered - Use @ahk in chat');
  }
} catch (error) {
  console.log('Chat Participant not initialized:', error);
  getOutput().appendLine(`[chat] Registration failed: ${error}`);
}
```

## Fix 5: Add Better Error Handling for Library Attribution

### Location: `src/libraryAttributionParticipant.ts` - Update constructor

```typescript
export class LibraryAttributionParticipant {
  private githubClient: GitHubCodeSearchClient;
  private cache: MetadataCache;
  private enabled: boolean = true;

  constructor() {
    this.githubClient = GitHubCodeSearchClient.getInstance();
    this.cache = MetadataCache.getInstance();
    this.loadConfiguration();

    // Check for GitHub token availability
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
    const githubToken = config.get<string>('githubToken');
    if (!githubToken) {
      console.log('[library-attribution] No GitHub token configured - using public API only');
    }
  }

  /**
   * Load configuration settings
   */
  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
    this.enabled = config.get<boolean>('libraryAttribution.enabled', true);

    if (!this.enabled) {
      console.log('[library-attribution] Feature disabled in settings');
    }
  }
}
```

## Fix 6: Add Configuration Validation

### Location: `src/extension.ts` - Add after activation events

```typescript
export async function activate(ctx: vscode.ExtensionContext) {
  // ... existing activation code ...

  // Validate chat participant requirements
  setTimeout(async () => {
    await validateChatParticipantRequirements();
  }, 1000);
}

async function validateChatParticipantRequirements(): Promise<void> {
  const issues: string[] = [];

  // Check VS Code version
  const vscodeVersion = vscode.version;
  const [major, minor] = vscodeVersion.split('.').map(Number);
  if (major < 1 || (major === 1 && minor < 90)) {
    issues.push(`VS Code 1.90+ required (current: ${vscodeVersion})`);
  }

  // Check GitHub Copilot
  const copilotExtension = vscode.extensions.getExtension('github.copilot');
  if (!copilotExtension) {
    issues.push('GitHub Copilot extension not found');
  } else if (!copilotExtension.isActive) {
    try {
      await copilotExtension.activate();
    } catch (error) {
      issues.push('Failed to activate GitHub Copilot');
    }
  }

  // Report issues if any
  if (issues.length > 0) {
    const output = vscode.window.createOutputChannel('AHKv2 Toolbox - Chat Requirements');
    output.appendLine('[Chat Participant] Requirements not met:');
    issues.forEach(issue => output.appendLine(`  - ${issue}`));
    output.appendLine('');
    output.appendLine('To fix these issues:');
    output.appendLine('1. Update VS Code to version 1.90 or later');
    output.appendLine('2. Install GitHub Copilot extension');
    output.appendLine('3. Reload VS Code window');
    output.show();
  } else {
    console.log('[Chat Participant] All requirements met');
  }
}
```

## Fix 7: Update Test Command Implementation

### Location: `src/extension.ts` - Improve test command

```typescript
vscode.commands.registerCommand('ahkv2Toolbox.testChatParticipant', async () => {
  // Test command for chat participant functionality
  const testInstructions = [
    '# AHK Chat Participant Test Results',
    '',
    '## ✅ Pre-flight Checklist',
    '',
    '- [ ] VS Code version 1.90+',
    '- [ ] GitHub Copilot installed and active',
    '- [ ] Extension activated without errors',
    '- [ ] Chat participant registered in output',
    '',
    '## 🧪 Test Commands',
    '',
    '### 1. Basic Chat Test',
    '```',
    '@ahk Hello! Can you help me with AutoHotkey v2?',
    '```',
    '',
    '### 2. Test Commands',
    '',
    '**Convert Command:**',
    '```',
    '@ahk /convert MsgBox % "Hello"',
    '```',
    '',
    '**Explain Command:**',
    '```',
    '@ahk /explain What is the difference between := and = in v2?',
    '```',
    '',
    '**Fix Command:**',
    '```',
    '@ahk /fix My GUI is not showing up',
    '```',
    '',
    '**Attribution Command (requires Lib file open):**',
    '```',
    '@ahk /attribute',
    '```',
    '',
    '## 🔍 Diagnostic Information',
    '',
    `VS Code Version: ${vscode.version}`,
    `AHKv2 Toolbox Version: 0.4.3`,
    `GitHub Copilot: ${vscode.extensions.getExtension('github.copilot') ? 'Available' : 'Not Found'}`,
    '',
    '## 📋 Expected Results',
    '',
    '✅ Chat participant should respond with AHK v2-specific guidance',
    '✅ Commands should be recognized and handled appropriately',
    '✅ Responses should use modern v2 syntax (`:=`, not `=`)',
    '✅ Error context should be included when relevant',
    '',
    '## ❌ Troubleshooting',
    '',
    'If chat participant doesn\'t appear:',
    '1. Check GitHub Copilot Chat is installed and active',
    '2. Reload VS Code window (Ctrl+Shift+P → Developer: Reload Window)',
    '3. Check extension is activated (should activate when opening .ahk files)',
    '4. Check Output panel for errors (View → Output → AHKv2 Toolbox)',
    '5. Verify VS Code version is 1.90+'
  ].join('\n');

  // Show test instructions in a new document
  const doc = await vscode.workspace.openTextDocument({
    content: testInstructions,
    language: 'markdown'
  });
  await vscode.window.showTextDocument(doc, { preview: false });

  // Show info message with quick action
  const action = await vscode.window.showInformationMessage(
    'Chat Participant Test Guide opened. Open the chat panel to start testing.',
    'Open Chat Panel',
    'Run Diagnostics',
    'Dismiss'
  );

  if (action === 'Open Chat Panel') {
    await vscode.commands.executeCommand('workbench.action.chat.open');
  } else if (action === 'Run Diagnostics') {
    await validateChatParticipantRequirements();
  }
})
```

## Summary of Changes

### Critical Fixes Applied:
1. ✅ Added `chatParticipants` declaration to package.json
2. ✅ Updated VS Code version requirement to ^1.90.0
3. ✅ Added comprehensive error handling for missing GitHub Copilot
4. ✅ Improved extension activation with version checking
5. ✅ Enhanced test command with better diagnostics
6. ✅ Added graceful degradation when dependencies missing

### Testing Steps After Fixes:
1. Reload VS Code window
2. Run `AHKv2 Toolbox: Test Chat Participant` command
3. Open chat panel and type `@ahk`
4. Verify error messages are helpful if dependencies missing
5. Test basic functionality: `/convert`, `/explain`, `/attribute`

These fixes address all the critical issues identified in the troubleshooting guide and should resolve the @ahk chat participant functionality.
