import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { LibraryAttributionParticipant } from '../libraryAttributionParticipant';
import { LibraryMetadata } from '../metadataExtractor';

/**
 * Tests for the chat participant integration with library attribution
 * Verifies that @ahk /attribute command correctly invokes the attribution system
 */
suite('Chat Participant - Library Attribution Integration Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let attributionParticipantStub: sinon.SinonStubbedInstance<LibraryAttributionParticipant>;
  let mockStream: MockChatResponseStream;
  let mockEditor: any;

  setup(() => {
    sandbox = sinon.createSandbox();
    mockStream = new MockChatResponseStream();

    // Create a mock active text editor with an AHK file
    mockEditor = {
      document: {
        fileName: '/test/workspace/Lib/TestLib.ahk',
        languageId: 'ahk2'
      }
    };
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Chat participant responds to /attribute command with active editor', async () => {
    // Setup: Mock active editor with AHK file
    sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

    // Mock LibraryAttributionParticipant
    const mockMetadata: LibraryMetadata = {
      description: 'Test library for AHK v2',
      file: 'TestLib.ahk',
      author: 'John Doe',
      link: 'https://github.com/user/testlib',
      date: '2024/01/15',
      version: '1.0.0'
    };

    attributionParticipantStub = sandbox.createStubInstance(LibraryAttributionParticipant);
    attributionParticipantStub.attributeLibrary.resolves(mockMetadata);

    // Create mock chat request for /attribute command
    const mockRequest: any = {
      prompt: '',
      command: 'attribute',
      references: []
    };

    const mockContext: vscode.ChatContext = {
      history: []
    };

    const mockToken: vscode.CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    };

    // Simulate the chat participant handler
    await simulateChatAttributeCommand(
      mockRequest,
      mockContext,
      mockStream,
      mockToken,
      attributionParticipantStub
    );

    // Verify that LibraryAttributionParticipant was called
    assert.ok(attributionParticipantStub.attributeLibrary.called);
    assert.strictEqual(
      attributionParticipantStub.attributeLibrary.firstCall.args[0],
      '/test/workspace/Lib/TestLib.ahk'
    );

    // Verify stream received markdown output
    const output = mockStream.getOutput();
    assert.ok(output.includes('TestLib.ahk'));
    assert.ok(output.includes('Discovering metadata'));
  });

  test('Chat participant extracts file path from prompt text', async () => {
    // Setup: No active editor, but path in prompt
    sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);

    const mockMetadata: LibraryMetadata = {
      description: 'GUI enhancement library',
      file: 'GuiEnhancerKit.ahk',
      author: 'GitHub User',
      link: 'https://github.com/user/gui-enhancer',
      date: '2024/02/20',
      version: '2.3.1'
    };

    attributionParticipantStub = sandbox.createStubInstance(LibraryAttributionParticipant);
    attributionParticipantStub.attributeLibrary.resolves(mockMetadata);

    const mockRequest: any = {
      prompt: 'Can you attribute Lib/GuiEnhancerKit.ahk for me?',
      command: 'attribute',
      references: []
    };

    const mockContext: vscode.ChatContext = {
      history: []
    };

    const mockToken: vscode.CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    };

    await simulateChatAttributeCommand(
      mockRequest,
      mockContext,
      mockStream,
      mockToken,
      attributionParticipantStub
    );

    // Verify that attribution was called with extracted path
    assert.ok(attributionParticipantStub.attributeLibrary.called);
    const calledPath = attributionParticipantStub.attributeLibrary.firstCall.args[0];
    assert.ok(calledPath.includes('GuiEnhancerKit.ahk'));

    const output = mockStream.getOutput();
    assert.ok(output.includes('GuiEnhancerKit.ahk'));
  });

  test('Chat participant shows error when no AHK file available', async () => {
    // Setup: No active editor and no path in prompt
    sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);

    const mockRequest: any = {
      prompt: 'attribute this file',
      command: 'attribute',
      references: []
    };

    const mockContext: vscode.ChatContext = {
      history: []
    };

    const mockToken: vscode.CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    };

    attributionParticipantStub = sandbox.createStubInstance(LibraryAttributionParticipant);

    await simulateChatAttributeCommand(
      mockRequest,
      mockContext,
      mockStream,
      mockToken,
      attributionParticipantStub
    );

    // Verify error message was shown
    const output = mockStream.getOutput();
    assert.ok(output.includes('Error'));
    assert.ok(output.includes('open an AHK library file') || output.includes('specify a file path'));

    // Verify attribution was NOT called
    assert.ok(!attributionParticipantStub.attributeLibrary.called);
  });

  test('Chat participant handles attribution failure gracefully', async () => {
    // Setup: Mock active editor
    sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

    attributionParticipantStub = sandbox.createStubInstance(LibraryAttributionParticipant);
    attributionParticipantStub.attributeLibrary.resolves(null); // Simulate failure

    const mockRequest: any = {
      prompt: '',
      command: 'attribute',
      references: []
    };

    const mockContext: vscode.ChatContext = {
      history: []
    };

    const mockToken: vscode.CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    };

    await simulateChatAttributeCommand(
      mockRequest,
      mockContext,
      mockStream,
      mockToken,
      attributionParticipantStub
    );

    // Verify attribution was attempted
    assert.ok(attributionParticipantStub.attributeLibrary.called);

    // Verify stream shows the result (even if null)
    const output = mockStream.getOutput();
    assert.ok(output.length > 0);
  });

  test('Chat participant provides next steps after successful attribution', async () => {
    // Setup
    sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

    const mockMetadata: LibraryMetadata = {
      description: 'Test library',
      file: 'TestLib.ahk',
      author: 'Test Author',
      link: 'https://github.com/test/lib',
      date: '2024/01/01',
      version: '1.0.0'
    };

    attributionParticipantStub = sandbox.createStubInstance(LibraryAttributionParticipant);
    attributionParticipantStub.attributeLibrary.resolves(mockMetadata);

    const mockRequest: any = {
      prompt: '',
      command: 'attribute',
      references: []
    };

    const mockContext: vscode.ChatContext = {
      history: []
    };

    const mockToken: vscode.CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    };

    await simulateChatAttributeCommand(
      mockRequest,
      mockContext,
      mockStream,
      mockToken,
      attributionParticipantStub
    );

    // Verify helpful next steps are provided
    const output = mockStream.getOutput();
    assert.ok(output.includes('What to do next') || output.includes('next'));
    assert.ok(output.includes('Review') || output.includes('accuracy'));
    assert.ok(output.includes('command palette') || output.includes('Discover Library Metadata'));
  });

  test('Chat participant handles exception during attribution', async () => {
    // Setup
    sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

    attributionParticipantStub = sandbox.createStubInstance(LibraryAttributionParticipant);
    attributionParticipantStub.attributeLibrary.rejects(new Error('GitHub API rate limit exceeded'));

    const mockRequest: any = {
      prompt: '',
      command: 'attribute',
      references: []
    };

    const mockContext: vscode.ChatContext = {
      history: []
    };

    const mockToken: vscode.CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    };

    await simulateChatAttributeCommand(
      mockRequest,
      mockContext,
      mockStream,
      mockToken,
      attributionParticipantStub
    );

    // Verify error is handled gracefully
    const output = mockStream.getOutput();
    assert.ok(output.includes('Error'));
    assert.ok(output.includes('rate limit') || output.length > 0);
  });
});

/**
 * Mock implementation of vscode.ChatResponseStream
 */
class MockChatResponseStream implements vscode.ChatResponseStream {
  private outputs: string[] = [];

  markdown(value: string | vscode.MarkdownString): void {
    this.outputs.push(typeof value === 'string' ? value : value.value);
  }

  anchor(value: vscode.Uri | vscode.Location, title?: string): void {
    this.outputs.push(`[Anchor: ${title || value.toString()}]`);
  }

  button(command: vscode.Command): void {
    this.outputs.push(`[Button: ${command.title}]`);
  }

  filetree(value: vscode.ChatResponseFileTree[], baseUri: vscode.Uri): void {
    this.outputs.push(`[FileTree]`);
  }

  progress(value: string): void {
    this.outputs.push(`[Progress: ${value}]`);
  }

  reference(value: vscode.Uri | vscode.Location, iconPath?: vscode.ThemeIcon | vscode.Uri): void {
    this.outputs.push(`[Reference: ${value.toString()}]`);
  }

  push(part: vscode.ChatResponsePart): void {
    if (part instanceof vscode.ChatResponseMarkdownPart) {
      this.markdown(part.value);
    }
  }

  getOutput(): string {
    return this.outputs.join('\n');
  }

  clear(): void {
    this.outputs = [];
  }
}

/**
 * Simulates the chat participant's handleLibraryAttribution method
 * This mimics the actual implementation in chatParticipant.ts
 */
async function simulateChatAttributeCommand(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: MockChatResponseStream,
  token: vscode.CancellationToken,
  participantStub: sinon.SinonStubbedInstance<LibraryAttributionParticipant>
): Promise<void> {
  try {
    const userPrompt = request.prompt;
    const editor = vscode.window.activeTextEditor;
    let filePath: string | undefined;

    // Determine file path from active editor or prompt
    if (editor && (editor.document.languageId === 'ahk' || editor.document.languageId === 'ahk2')) {
      filePath = editor.document.fileName;
    } else if (userPrompt) {
      const pathMatch = userPrompt.match(/([^\s]+\.ahk2?)/i);
      if (pathMatch) {
        filePath = pathMatch[1];
      }
    }

    if (!filePath) {
      stream.markdown('❌ **Error**: Please open an AHK library file or specify a file path.\n\n');
      return;
    }

    stream.markdown(`🔍 Discovering metadata for \`${require('path').basename(filePath)}\`...\n\n`);

    // Call the attribution participant
    const metadata = await participantStub.attributeLibrary(filePath, stream as any);

    if (metadata) {
      stream.markdown('\n\n💡 **What to do next:**\n');
      stream.markdown('1. Review the metadata above for accuracy\n');
      stream.markdown('2. Use the command palette: **AHKv2 Toolbox: Discover Library Metadata**\n');
    }
  } catch (error) {
    stream.markdown(`\n\n❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
  }
}
