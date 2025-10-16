 Visual Studio Code
Docs
Updates
Blog
API
Extensions
MCP
FAQ
Dev Days
Switch to the dark theme
Search Docs
Ctrl+Shift+P
Download
Join a VS Code Dev Days event near you to learn about AI-assisted development in VS Code.

Dismiss this update
Overview
Get Started
Extension Capabilities
Extension Guides
UX Guidelines
Language Extensions
Testing and Publishing
Advanced Topics
References
VS Code API
Contribution Points
Activation Events
Extension Manifest
Built-in Commands
When clause contexts
Theme Color
Product Icon Reference
Document Selector
VS Code API
VS Code API is a set of JavaScript APIs that you can invoke in your Visual Studio Code extension. This page lists all VS Code APIs available to extension authors.

API namespaces and classes
This listing is compiled from the vscode.d.ts file from the VS Code repository.

authentication
Namespace for authentication.

Events
onDidChangeSessions: Event<AuthenticationSessionsChangeEvent>

Functions
getAccounts(providerId: string): Thenable<readonly AuthenticationSessionAccountInformation[]>

getSession(providerId: string, scopeListOrRequest: readonly string[] | AuthenticationWwwAuthenticateRequest, options: AuthenticationGetSessionOptions & {createIfNone: true | AuthenticationGetSessionPresentationOptions}): Thenable<AuthenticationSession>

getSession(providerId: string, scopeListOrRequest: readonly string[] | AuthenticationWwwAuthenticateRequest, options: AuthenticationGetSessionOptions & {forceNewSession: true | AuthenticationGetSessionPresentationOptions}): Thenable<AuthenticationSession>

getSession(providerId: string, scopeListOrRequest: readonly string[] | AuthenticationWwwAuthenticateRequest, options?: AuthenticationGetSessionOptions): Thenable<AuthenticationSession | undefined>

registerAuthenticationProvider(id: string, label: string, provider: AuthenticationProvider, options?: AuthenticationProviderOptions): Disposable

chat
Namespace for chat functionality. Users interact with chat participants by sending messages to them in the chat view. Chat participants can respond with markdown or other types of content via the ChatResponseStream.

Functions
createChatParticipant(id: string, handler: ChatRequestHandler): ChatParticipant

commands
Namespace for dealing with commands. In short, a command is a function with a unique identifier. The function is sometimes also called command handler.

Commands can be added to the editor using the registerCommand and registerTextEditorCommand functions. Commands can be executed manually or from a UI gesture. Those are:

palette - Use the commands-section in package.json to make a command show in the command palette.
keybinding - Use the keybindings-section in package.json to enable keybindings for your extension.
Commands from other extensions and from the editor itself are accessible to an extension. However, when invoking an editor command not all argument types are supported.

This is a sample that registers a command handler and adds an entry for that command to the palette. First register a command handler with the identifier extension.sayHello.

JavaScript

commands.registerCommand('extension.sayHello', () => {
  window.showInformationMessage('Hello World!');
});
Second, bind the command identifier to a title under which it will show in the palette (package.json).

JSON

{
  "contributes": {
    "commands": [
      {
        "command": "extension.sayHello",
        "title": "Hello World"
      }
    ]
  }
}
Functions
executeCommand<T>(command: string, ...rest: any[]): Thenable<T>

getCommands(filterInternal?: boolean): Thenable<string[]>

registerCommand(command: string, callback: (args: any[]) => any, thisArg?: any): Disposable

registerTextEditorCommand(command: string, callback: (textEditor: TextEditor, edit: TextEditorEdit, args: any[]) => void, thisArg?: any): Disposable

comments
Functions
createCommentController(id: string, label: string): CommentController

debug
Namespace for debug functionality.

Variables
activeDebugConsole: DebugConsole

activeDebugSession: DebugSession | undefined

activeStackItem: DebugThread | DebugStackFrame | undefined

breakpoints: readonly Breakpoint[]

Events
onDidChangeActiveDebugSession: Event<DebugSession | undefined>

onDidChangeActiveStackItem: Event<DebugThread | DebugStackFrame | undefined>

onDidChangeBreakpoints: Event<BreakpointsChangeEvent>

onDidReceiveDebugSessionCustomEvent: Event<DebugSessionCustomEvent>

onDidStartDebugSession: Event<DebugSession>

onDidTerminateDebugSession: Event<DebugSession>

Functions
addBreakpoints(breakpoints: readonly Breakpoint[]): void

asDebugSourceUri(source: DebugProtocolSource, session?: DebugSession): Uri

registerDebugAdapterDescriptorFactory(debugType: string, factory: DebugAdapterDescriptorFactory): Disposable

registerDebugAdapterTrackerFactory(debugType: string, factory: DebugAdapterTrackerFactory): Disposable

registerDebugConfigurationProvider(debugType: string, provider: DebugConfigurationProvider, triggerKind?: DebugConfigurationProviderTriggerKind): Disposable

removeBreakpoints(breakpoints: readonly Breakpoint[]): void

startDebugging(folder: WorkspaceFolder, nameOrConfiguration: string | DebugConfiguration, parentSessionOrOptions?: DebugSession | DebugSessionOptions): Thenable<boolean>

stopDebugging(session?: DebugSession): Thenable<void>

env
Namespace describing the environment the editor runs in.

Variables
appHost: string

appName: string

appRoot: string

clipboard: Clipboard

isNewAppInstall: boolean

isTelemetryEnabled: boolean

language: string

logLevel: LogLevel

machineId: string

remoteName: string | undefined

sessionId: string

shell: string

uiKind: UIKind

uriScheme: string

Events
onDidChangeLogLevel: Event<LogLevel>

onDidChangeShell: Event<string>

onDidChangeTelemetryEnabled: Event<boolean>

Functions
asExternalUri(target: Uri): Thenable<Uri>

createTelemetryLogger(sender: TelemetrySender, options?: TelemetryLoggerOptions): TelemetryLogger

openExternal(target: Uri): Thenable<boolean>

extensions
Namespace for dealing with installed extensions. Extensions are represented by an Extension-interface which enables reflection on them.

Extension writers can provide APIs to other extensions by returning their API public surface from the activate-call.

JavaScript

export function activate(context: vscode.ExtensionContext) {
  let api = {
    sum(a, b) {
      return a + b;
    },
    mul(a, b) {
      return a * b;
    }
  };
  // 'export' public api-surface
  return api;
}
When depending on the API of another extension add an extensionDependencies-entry to package.json, and use the getExtension-function and the exports-property, like below:

JavaScript

let mathExt = extensions.getExtension('genius.math');
let importedApi = mathExt.exports;

console.log(importedApi.mul(42, 1));
Variables
all: readonly Extension<any>[]

Events
onDidChange: Event<void>

Functions
getExtension<T>(extensionId: string): Extension<T> | undefined

l10n
Namespace for localization-related functionality in the extension API. To use this properly, you must have l10n defined in your extension manifest and have bundle.l10n..json files. For more information on how to generate bundle.l10n..json files, check out the vscode-l10n repo.

Note: Built-in extensions (for example, Git, TypeScript Language Features, GitHub Authentication) are excluded from the l10n property requirement. In other words, they do not need to specify a l10n in the extension manifest because their translated strings come from Language Packs.

Variables
bundle: | undefined

uri: Uri | undefined

Functions
t(message: string, ...args: Array<string | number | boolean>): string

t(message: string, args: Record<string, any>): string

t(options: {args: Array<string | number | boolean> | Record<string, any>, comment: string | string[], message: string}): string

languages
Namespace for participating in language-specific editor features, like IntelliSense, code actions, diagnostics etc.

Many programming languages exist and there is huge variety in syntaxes, semantics, and paradigms. Despite that, features like automatic word-completion, code navigation, or code checking have become popular across different tools for different programming languages.

The editor provides an API that makes it simple to provide such common features by having all UI and actions already in place and by allowing you to participate by providing data only. For instance, to contribute a hover all you have to do is provide a function that can be called with a TextDocument and a Position returning hover info. The rest, like tracking the mouse, positioning the hover, keeping the hover stable etc. is taken care of by the editor.

JavaScript

languages.registerHoverProvider('javascript', {
  provideHover(document, position, token) {
    return new Hover('I am a hover!');
  }
});
Registration is done using a document selector which is either a language id, like javascript or a more complex filter like { language: 'typescript', scheme: 'file' }. Matching a document against such a selector will result in a score that is used to determine if and how a provider shall be used. When scores are equal the provider that came last wins. For features that allow full arity, like hover, the score is only checked to be >0, for other features, like IntelliSense the score is used for determining the order in which providers are asked to participate.

Events
onDidChangeDiagnostics: Event<DiagnosticChangeEvent>

Functions
createDiagnosticCollection(name?: string): DiagnosticCollection

createLanguageStatusItem(id: string, selector: DocumentSelector): LanguageStatusItem

getDiagnostics(resource: Uri): Diagnostic[]

getDiagnostics(): Array<[Uri, Diagnostic[]]>

getLanguages(): Thenable<string[]>

match(selector: DocumentSelector, document: TextDocument): number

registerCallHierarchyProvider(selector: DocumentSelector, provider: CallHierarchyProvider): Disposable

registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider<CodeAction>, metadata?: CodeActionProviderMetadata): Disposable

registerCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider<CodeLens>): Disposable

registerColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): Disposable

registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider<CompletionItem>, ...triggerCharacters: string[]): Disposable

registerDeclarationProvider(selector: DocumentSelector, provider: DeclarationProvider): Disposable

registerDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): Disposable

registerDocumentDropEditProvider(selector: DocumentSelector, provider: DocumentDropEditProvider<DocumentDropEdit>, metadata?: DocumentDropEditProviderMetadata): Disposable

registerDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): Disposable

registerDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): Disposable

registerDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider<DocumentLink>): Disposable

registerDocumentPasteEditProvider(selector: DocumentSelector, provider: DocumentPasteEditProvider<DocumentPasteEdit>, metadata: DocumentPasteProviderMetadata): Disposable

registerDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): Disposable

registerDocumentRangeSemanticTokensProvider(selector: DocumentSelector, provider: DocumentRangeSemanticTokensProvider, legend: SemanticTokensLegend): Disposable

registerDocumentSemanticTokensProvider(selector: DocumentSelector, provider: DocumentSemanticTokensProvider, legend: SemanticTokensLegend): Disposable

registerDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider, metaData?: DocumentSymbolProviderMetadata): Disposable

registerEvaluatableExpressionProvider(selector: DocumentSelector, provider: EvaluatableExpressionProvider): Disposable

registerFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): Disposable

registerHoverProvider(selector: DocumentSelector, provider: HoverProvider): Disposable

registerImplementationProvider(selector: DocumentSelector, provider: ImplementationProvider): Disposable

registerInlayHintsProvider(selector: DocumentSelector, provider: InlayHintsProvider<InlayHint>): Disposable

registerInlineCompletionItemProvider(selector: DocumentSelector, provider: InlineCompletionItemProvider): Disposable

registerInlineValuesProvider(selector: DocumentSelector, provider: InlineValuesProvider): Disposable

registerLinkedEditingRangeProvider(selector: DocumentSelector, provider: LinkedEditingRangeProvider): Disposable

registerOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): Disposable

registerReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): Disposable

registerRenameProvider(selector: DocumentSelector, provider: RenameProvider): Disposable

registerSelectionRangeProvider(selector: DocumentSelector, provider: SelectionRangeProvider): Disposable

registerSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): Disposable

registerSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, metadata: SignatureHelpProviderMetadata): Disposable

registerTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): Disposable

registerTypeHierarchyProvider(selector: DocumentSelector, provider: TypeHierarchyProvider): Disposable

registerWorkspaceSymbolProvider(provider: WorkspaceSymbolProvider<SymbolInformation>): Disposable

setLanguageConfiguration(language: string, configuration: LanguageConfiguration): Disposable

setTextDocumentLanguage(document: TextDocument, languageId: string): Thenable<TextDocument>

lm
Namespace for language model related functionality.

Variables
tools: readonly LanguageModelToolInformation[]

Events
onDidChangeChatModels: Event<void>

Functions
invokeTool(name: string, options: LanguageModelToolInvocationOptions<object>, token?: CancellationToken): Thenable<LanguageModelToolResult>

registerLanguageModelChatProvider(vendor: string, provider: LanguageModelChatProvider<LanguageModelChatInformation>): Disposable

registerMcpServerDefinitionProvider(id: string, provider: McpServerDefinitionProvider<McpServerDefinition>): Disposable

registerTool<T>(name: string, tool: LanguageModelTool<T>): Disposable

selectChatModels(selector?: LanguageModelChatSelector): Thenable<LanguageModelChat[]>

notebooks
Namespace for notebooks.

The notebooks functionality is composed of three loosely coupled components:

NotebookSerializer enable the editor to open, show, and save notebooks
NotebookController own the execution of notebooks, e.g they create output from code cells.
NotebookRenderer present notebook output in the editor. They run in a separate context.
Functions
createNotebookController(id: string, notebookType: string, label: string, handler?: (cells: NotebookCell[], notebook: NotebookDocument, controller: NotebookController) => void | Thenable<void>): NotebookController

createRendererMessaging(rendererId: string): NotebookRendererMessaging

registerNotebookCellStatusBarItemProvider(notebookType: string, provider: NotebookCellStatusBarItemProvider): Disposable

scm
Namespace for source control management.

Variables
inputBox: SourceControlInputBox

Functions
createSourceControl(id: string, label: string, rootUri?: Uri): SourceControl

tasks
Namespace for tasks functionality.

Variables
taskExecutions: readonly TaskExecution[]

Events
onDidEndTask: Event<TaskEndEvent>

onDidEndTaskProcess: Event<TaskProcessEndEvent>

onDidStartTask: Event<TaskStartEvent>

onDidStartTaskProcess: Event<TaskProcessStartEvent>

Functions
executeTask(task: Task): Thenable<TaskExecution>

fetchTasks(filter?: TaskFilter): Thenable<Task[]>

registerTaskProvider(type: string, provider: TaskProvider<Task>): Disposable

tests
Namespace for testing functionality. Tests are published by registering TestController instances, then adding TestItems. Controllers may also describe how to run tests by creating one or more TestRunProfile instances.

Functions
createTestController(id: string, label: string): TestController

window
Namespace for dealing with the current window of the editor. That is visible and active editors, as well as, UI elements to show messages, selections, and asking for user input.

Variables
activeColorTheme: ColorTheme

activeNotebookEditor: NotebookEditor | undefined

activeTerminal: Terminal | undefined

activeTextEditor: TextEditor | undefined

state: WindowState

tabGroups: TabGroups

terminals: readonly Terminal[]

visibleNotebookEditors: readonly NotebookEditor[]

visibleTextEditors: readonly TextEditor[]

Events
onDidChangeActiveColorTheme: Event<ColorTheme>

onDidChangeActiveNotebookEditor: Event<NotebookEditor | undefined>

onDidChangeActiveTerminal: Event<Terminal | undefined>

onDidChangeActiveTextEditor: Event<TextEditor | undefined>

onDidChangeNotebookEditorSelection: Event<NotebookEditorSelectionChangeEvent>

onDidChangeNotebookEditorVisibleRanges: Event<NotebookEditorVisibleRangesChangeEvent>

onDidChangeTerminalShellIntegration: Event<TerminalShellIntegrationChangeEvent>

onDidChangeTerminalState: Event<Terminal>

onDidChangeTextEditorOptions: Event<TextEditorOptionsChangeEvent>

onDidChangeTextEditorSelection: Event<TextEditorSelectionChangeEvent>

onDidChangeTextEditorViewColumn: Event<TextEditorViewColumnChangeEvent>

onDidChangeTextEditorVisibleRanges: Event<TextEditorVisibleRangesChangeEvent>

onDidChangeVisibleNotebookEditors: Event<readonly NotebookEditor[]>

onDidChangeVisibleTextEditors: Event<readonly TextEditor[]>

onDidChangeWindowState: Event<WindowState>

onDidCloseTerminal: Event<Terminal>

onDidEndTerminalShellExecution: Event<TerminalShellExecutionEndEvent>

onDidOpenTerminal: Event<Terminal>

onDidStartTerminalShellExecution: Event<TerminalShellExecutionStartEvent>

Functions
createInputBox(): InputBox

createOutputChannel(name: string, languageId?: string): OutputChannel

createOutputChannel(name: string, options: {log: true}): LogOutputChannel

createQuickPick<T extends QuickPickItem>(): QuickPick<T>

createStatusBarItem(id: string, alignment?: StatusBarAlignment, priority?: number): StatusBarItem

createStatusBarItem(alignment?: StatusBarAlignment, priority?: number): StatusBarItem

createTerminal(name?: string, shellPath?: string, shellArgs?: string | readonly string[]): Terminal

createTerminal(options: TerminalOptions): Terminal

createTerminal(options: ExtensionTerminalOptions): Terminal

createTextEditorDecorationType(options: DecorationRenderOptions): TextEditorDecorationType

createTreeView<T>(viewId: string, options: TreeViewOptions<T>): TreeView<T>

createWebviewPanel(viewType: string, title: string, showOptions: ViewColumn | {preserveFocus: boolean, viewColumn: ViewColumn}, options?: WebviewPanelOptions & WebviewOptions): WebviewPanel

registerCustomEditorProvider(viewType: string, provider: CustomTextEditorProvider | CustomReadonlyEditorProvider<CustomDocument> | CustomEditorProvider<CustomDocument>, options?: {supportsMultipleEditorsPerDocument: boolean, webviewOptions: WebviewPanelOptions}): Disposable

registerFileDecorationProvider(provider: FileDecorationProvider): Disposable

registerTerminalLinkProvider(provider: TerminalLinkProvider<TerminalLink>): Disposable

registerTerminalProfileProvider(id: string, provider: TerminalProfileProvider): Disposable

registerTreeDataProvider<T>(viewId: string, treeDataProvider: TreeDataProvider<T>): Disposable

registerUriHandler(handler: UriHandler): Disposable

registerWebviewPanelSerializer(viewType: string, serializer: WebviewPanelSerializer<unknown>): Disposable

registerWebviewViewProvider(viewId: string, provider: WebviewViewProvider, options?: {webviewOptions: {retainContextWhenHidden: boolean}}): Disposable

setStatusBarMessage(text: string, hideAfterTimeout: number): Disposable

setStatusBarMessage(text: string, hideWhenDone: Thenable<any>): Disposable

setStatusBarMessage(text: string): Disposable

showErrorMessage<T extends string>(message: string, ...items: T[]): Thenable<T | undefined>

showErrorMessage<T extends string>(message: string, options: MessageOptions, ...items: T[]): Thenable<T | undefined>

showErrorMessage<T extends MessageItem>(message: string, ...items: T[]): Thenable<T | undefined>

showErrorMessage<T extends MessageItem>(message: string, options: MessageOptions, ...items: T[]): Thenable<T | undefined>

showInformationMessage<T extends string>(message: string, ...items: T[]): Thenable<T | undefined>

showInformationMessage<T extends string>(message: string, options: MessageOptions, ...items: T[]): Thenable<T | undefined>

showInformationMessage<T extends MessageItem>(message: string, ...items: T[]): Thenable<T | undefined>

showInformationMessage<T extends MessageItem>(message: string, options: MessageOptions, ...items: T[]): Thenable<T | undefined>

showInputBox(options?: InputBoxOptions, token?: CancellationToken): Thenable<string | undefined>

showNotebookDocument(document: NotebookDocument, options?: NotebookDocumentShowOptions): Thenable<NotebookEditor>

showOpenDialog(options?: OpenDialogOptions): Thenable<Uri[] | undefined>

showQuickPick(items: readonly string[] | Thenable<readonly string[]>, options: QuickPickOptions & {canPickMany: true}, token?: CancellationToken): Thenable<string[] | undefined>

showQuickPick(items: readonly string[] | Thenable<readonly string[]>, options?: QuickPickOptions, token?: CancellationToken): Thenable<string | undefined>

showQuickPick<T extends QuickPickItem>(items: readonly T[] | Thenable<readonly T[]>, options: QuickPickOptions & {canPickMany: true}, token?: CancellationToken): Thenable<T[] | undefined>

showQuickPick<T extends QuickPickItem>(items: readonly T[] | Thenable<readonly T[]>, options?: QuickPickOptions, token?: CancellationToken): Thenable<T | undefined>

showSaveDialog(options?: SaveDialogOptions): Thenable<Uri | undefined>

showTextDocument(document: TextDocument, column?: ViewColumn, preserveFocus?: boolean): Thenable<TextEditor>

showTextDocument(document: TextDocument, options?: TextDocumentShowOptions): Thenable<TextEditor>

showTextDocument(uri: Uri, options?: TextDocumentShowOptions): Thenable<TextEditor>

showWarningMessage<T extends string>(message: string, ...items: T[]): Thenable<T | undefined>

showWarningMessage<T extends string>(message: string, options: MessageOptions, ...items: T[]): Thenable<T | undefined>

showWarningMessage<T extends MessageItem>(message: string, ...items: T[]): Thenable<T | undefined>

showWarningMessage<T extends MessageItem>(message: string, options: MessageOptions, ...items: T[]): Thenable<T | undefined>

showWorkspaceFolderPick(options?: WorkspaceFolderPickOptions): Thenable<WorkspaceFolder | undefined>

withProgress<R>(options: ProgressOptions, task: (progress: Progress<{increment: number, message: string}>, token: CancellationToken) => Thenable<R>): Thenable<R>

withScmProgress<R>(task: (progress: Progress<number>) => Thenable<R>): Thenable<R>

workspace
Namespace for dealing with the current workspace. A workspace is the collection of one or more folders that are opened in an editor window (instance).

It is also possible to open an editor without a workspace. For example, when you open a new editor window by selecting a file from your platform's File menu, you will not be inside a workspace. In this mode, some of the editor's capabilities are reduced but you can still open text files and edit them.

Refer to https://code.visualstudio.com/docs/editor/workspaces for more information on the concept of workspaces.

The workspace offers support for listening to fs events and for finding files. Both perform well and run outside the editor-process so that they should be always used instead of nodejs-equivalents.

Variables
fs: FileSystem

isTrusted: boolean

name: string | undefined

notebookDocuments: readonly NotebookDocument[]

rootPath: string | undefined

textDocuments: readonly TextDocument[]

workspaceFile: Uri | undefined

workspaceFolders: readonly WorkspaceFolder[] | undefined

Events
onDidChangeConfiguration: Event<ConfigurationChangeEvent>

onDidChangeNotebookDocument: Event<NotebookDocumentChangeEvent>

onDidChangeTextDocument: Event<TextDocumentChangeEvent>

onDidChangeWorkspaceFolders: Event<WorkspaceFoldersChangeEvent>

onDidCloseNotebookDocument: Event<NotebookDocument>

onDidCloseTextDocument: Event<TextDocument>

onDidCreateFiles: Event<FileCreateEvent>

onDidDeleteFiles: Event<FileDeleteEvent>

onDidGrantWorkspaceTrust: Event<void>

onDidOpenNotebookDocument: Event<NotebookDocument>

onDidOpenTextDocument: Event<TextDocument>

onDidRenameFiles: Event<FileRenameEvent>

onDidSaveNotebookDocument: Event<NotebookDocument>

onDidSaveTextDocument: Event<TextDocument>

onWillCreateFiles: Event<FileWillCreateEvent>

onWillDeleteFiles: Event<FileWillDeleteEvent>

onWillRenameFiles: Event<FileWillRenameEvent>

onWillSaveNotebookDocument: Event<NotebookDocumentWillSaveEvent>

onWillSaveTextDocument: Event<TextDocumentWillSaveEvent>

Functions
applyEdit(edit: WorkspaceEdit, metadata?: WorkspaceEditMetadata): Thenable<boolean>

asRelativePath(pathOrUri: string | Uri, includeWorkspaceFolder?: boolean): string

createFileSystemWatcher(globPattern: GlobPattern, ignoreCreateEvents?: boolean, ignoreChangeEvents?: boolean, ignoreDeleteEvents?: boolean): FileSystemWatcher

decode(content: Uint8Array): Thenable<string>

decode(content: Uint8Array, options: {encoding: string}): Thenable<string>

decode(content: Uint8Array, options: {uri: Uri}): Thenable<string>

encode(content: string): Thenable<Uint8Array>

encode(content: string, options: {encoding: string}): Thenable<Uint8Array>

encode(content: string, options: {uri: Uri}): Thenable<Uint8Array>

findFiles(include: GlobPattern, exclude?: GlobPattern, maxResults?: number, token?: CancellationToken): Thenable<Uri[]>

getConfiguration(section?: string, scope?: ConfigurationScope): WorkspaceConfiguration

getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined

openNotebookDocument(uri: Uri): Thenable<NotebookDocument>

openNotebookDocument(notebookType: string, content?: NotebookData): Thenable<NotebookDocument>

openTextDocument(uri: Uri, options?: {encoding: string}): Thenable<TextDocument>

openTextDocument(path: string, options?: {encoding: string}): Thenable<TextDocument>

openTextDocument(options?: {content: string, encoding: string, language: string}): Thenable<TextDocument>

registerFileSystemProvider(scheme: string, provider: FileSystemProvider, options?: {isCaseSensitive: boolean, isReadonly: boolean | MarkdownString}): Disposable

registerNotebookSerializer(notebookType: string, serializer: NotebookSerializer, options?: NotebookDocumentContentOptions): Disposable

registerTaskProvider(type: string, provider: TaskProvider<Task>): Disposable

registerTextDocumentContentProvider(scheme: string, provider: TextDocumentContentProvider): Disposable

save(uri: Uri): Thenable<Uri | undefined>

saveAll(includeUntitled?: boolean): Thenable<boolean>

saveAs(uri: Uri): Thenable<Uri | undefined>

updateWorkspaceFolders(start: number, deleteCount: number, ...workspaceFoldersToAdd: Array<{name: string, uri: Uri}>): boolean

AccessibilityInformation
Accessibility information which controls screen reader behavior.

Properties
label: string

role?: string

AuthenticationForceNewSessionOptions
Optional options to be used when calling authentication.getSession with the flag forceNewSession.

deprecated - Use AuthenticationGetSessionPresentationOptions instead.
AuthenticationForceNewSessionOptions: AuthenticationGetSessionPresentationOptions

AuthenticationGetSessionOptions
Options to be used when getting an AuthenticationSession from an AuthenticationProvider.

Properties
account?: AuthenticationSessionAccountInformation

clearSessionPreference?: boolean

createIfNone?: boolean | AuthenticationGetSessionPresentationOptions

forceNewSession?: boolean | AuthenticationGetSessionPresentationOptions

silent?: boolean

AuthenticationGetSessionPresentationOptions
Optional options to be used when calling authentication.getSession with interactive options forceNewSession & createIfNone.

Properties
detail?: string

AuthenticationProvider
A provider for performing authentication to a service.

Events
onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent>

Methods
createSession(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession>

getSessions(scopes: readonly string[], options: AuthenticationProviderSessionOptions): Thenable<AuthenticationSession[]>

removeSession(sessionId: string): Thenable<void>

AuthenticationProviderAuthenticationSessionsChangeEvent
An Event which fires when an AuthenticationSession is added, removed, or changed.

Properties
added: readonly AuthenticationSession[]

changed: readonly AuthenticationSession[]

removed: readonly AuthenticationSession[]

AuthenticationProviderInformation
Basic information about an AuthenticationProvider

Properties
id: string

label: string

AuthenticationProviderOptions
Options for creating an AuthenticationProvider.

Properties
supportsMultipleAccounts?: boolean

AuthenticationProviderSessionOptions
The options passed in to the AuthenticationProvider.getSessions and AuthenticationProvider.createSession call.

Properties
account?: AuthenticationSessionAccountInformation

AuthenticationSession
Represents a session of a currently logged in user.

Properties
accessToken: string

account: AuthenticationSessionAccountInformation

id: string

scopes: readonly string[]

AuthenticationSessionAccountInformation
The information of an account associated with an AuthenticationSession.

Properties
id: string

label: string

AuthenticationSessionsChangeEvent
An Event which fires when an AuthenticationSession is added, removed, or changed.

Properties
provider: AuthenticationProviderInformation

AuthenticationWwwAuthenticateRequest
Represents parameters for creating a session based on a WWW-Authenticate header value. This is used when an API returns a 401 with a WWW-Authenticate header indicating that additional authentication is required. The details of which will be passed down to the authentication provider to create a session.

note - The authorization provider must support handling challenges and specifically the challenges in this WWW-Authenticate value.
note - For more information on WWW-Authenticate please see https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/WWW-Authenticate
Properties
fallbackScopes?: readonly string[]

wwwAuthenticate: string

AutoClosingPair
Describes pairs of strings where the close string will be automatically inserted when typing the opening string.

Properties
close: string

notIn?: SyntaxTokenType[]

open: string

BranchCoverage
Contains coverage information for a branch of a StatementCoverage.

Constructors
new BranchCoverage(executed: number | boolean, location?: Range | Position, label?: string): BranchCoverage

Properties
executed: number | boolean

label?: string

location?: Range | Position

Breakpoint
The base class of all breakpoint types.

Constructors
new Breakpoint(enabled?: boolean, condition?: string, hitCondition?: string, logMessage?: string): Breakpoint

Properties
condition?: string

enabled: boolean

hitCondition?: string

id: string

logMessage?: string

BreakpointsChangeEvent
An event describing the changes to the set of breakpoints.

Properties
added: readonly Breakpoint[]

changed: readonly Breakpoint[]

removed: readonly Breakpoint[]

CallHierarchyIncomingCall
Represents an incoming call, e.g. a caller of a method or constructor.

Constructors
new CallHierarchyIncomingCall(item: CallHierarchyItem, fromRanges: Range[]): CallHierarchyIncomingCall

Properties
from: CallHierarchyItem

fromRanges: Range[]

CallHierarchyItem
Represents programming constructs like functions or constructors in the context of call hierarchy.

Constructors
new CallHierarchyItem(kind: SymbolKind, name: string, detail: string, uri: Uri, range: Range, selectionRange: Range): CallHierarchyItem

Properties
detail?: string

kind: SymbolKind

name: string

range: Range

selectionRange: Range

tags?: readonly SymbolTag[]

uri: Uri

CallHierarchyOutgoingCall
Represents an outgoing call, e.g. calling a getter from a method or a method from a constructor etc.

Constructors
new CallHierarchyOutgoingCall(item: CallHierarchyItem, fromRanges: Range[]): CallHierarchyOutgoingCall

Properties
fromRanges: Range[]

to: CallHierarchyItem

CallHierarchyProvider
The call hierarchy provider interface describes the contract between extensions and the call hierarchy feature which allows to browse calls and caller of function, methods, constructor etc.

Methods
prepareCallHierarchy(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CallHierarchyItem | CallHierarchyItem[]>

provideCallHierarchyIncomingCalls(item: CallHierarchyItem, token: CancellationToken): ProviderResult<CallHierarchyIncomingCall[]>

provideCallHierarchyOutgoingCalls(item: CallHierarchyItem, token: CancellationToken): ProviderResult<CallHierarchyOutgoingCall[]>

CancellationError
An error type that should be used to signal cancellation of an operation.

This type can be used in response to a cancellation token being cancelled or when an operation is being cancelled by the executor of that operation.

Constructors
new CancellationError(): CancellationError

CancellationToken
A cancellation token is passed to an asynchronous or long running operation to request cancellation, like cancelling a request for completion items because the user continued to type.

To get an instance of a CancellationToken use a CancellationTokenSource.

Properties
isCancellationRequested: boolean

onCancellationRequested: Event<any>

CancellationTokenSource
A cancellation source creates and controls a cancellation token.

Constructors
new CancellationTokenSource(): CancellationTokenSource

Properties
token: CancellationToken

Methods
cancel(): void

dispose(): void

CharacterPair
A tuple of two characters, like a pair of opening and closing brackets.

CharacterPair: [string, string]

ChatContext
Extra context passed to a participant.

Properties
history: ReadonlyArray<ChatRequestTurn | ChatResponseTurn>

ChatErrorDetails
Represents an error result from a chat request.

Properties
message: string

responseIsFiltered?: boolean

ChatFollowup
A followup question suggested by the participant.

Properties
command?: string

label?: string

participant?: string

prompt: string

ChatFollowupProvider
Will be invoked once after each request to get suggested followup questions to show the user. The user can click the followup to send it to the chat.

Methods
provideFollowups(result: ChatResult, context: ChatContext, token: CancellationToken): ProviderResult<ChatFollowup[]>

ChatLanguageModelToolReference
A reference to a tool that the user manually attached to their request, either using the #-syntax inline, or as an attachment via the paperclip button.

Properties
name: string

range?: [start: number, end: number]

ChatParticipant
A chat participant can be invoked by the user in a chat session, using the prefix. When it is invoked, it handles the chat request and is solely responsible for providing a response to the user. A ChatParticipant is created using chat.createChatParticipant.

Events
onDidReceiveFeedback: Event<ChatResultFeedback>

Properties
followupProvider?: ChatFollowupProvider

iconPath?: IconPath

id: string

requestHandler: ChatRequestHandler

Methods
dispose(): void

ChatParticipantToolToken
A token that can be passed to lm.invokeTool when invoking a tool inside the context of handling a chat request.

ChatParticipantToolToken: never

ChatPromptReference
A reference to a value that the user added to their chat request.

Properties
id: string

modelDescription?: string

range?: [start: number, end: number]

value: unknown

ChatRequest
A request to a chat participant.

Properties
command: string

model: LanguageModelChat

prompt: string

references: readonly ChatPromptReference[]

toolInvocationToken: never

toolReferences: readonly ChatLanguageModelToolReference[]

ChatRequestHandler
ChatRequestHandler: (request: ChatRequest, context: ChatContext, response: ChatResponseStream, token: CancellationToken) => ProviderResult<ChatResult | void>

ChatRequestTurn
Represents a user request in chat history.

Properties
command?: string

participant: string

prompt: string

references: ChatPromptReference[]

toolReferences: readonly ChatLanguageModelToolReference[]

ChatResponseAnchorPart
Represents a part of a chat response that is an anchor, that is rendered as a link to a target.

Constructors
new ChatResponseAnchorPart(value: Uri | Location, title?: string): ChatResponseAnchorPart

Properties
title?: string

value: Uri | Location

ChatResponseCommandButtonPart
Represents a part of a chat response that is a button that executes a command.

Constructors
new ChatResponseCommandButtonPart(value: Command): ChatResponseCommandButtonPart

Properties
value: Command

ChatResponseFileTree
Represents a file tree structure in a chat response.

Properties
children?: ChatResponseFileTree[]

name: string

ChatResponseFileTreePart
Represents a part of a chat response that is a file tree.

Constructors
new ChatResponseFileTreePart(value: ChatResponseFileTree[], baseUri: Uri): ChatResponseFileTreePart

Properties
baseUri: Uri

value: ChatResponseFileTree[]

ChatResponseMarkdownPart
Represents a part of a chat response that is formatted as Markdown.

Constructors
new ChatResponseMarkdownPart(value: string | MarkdownString): ChatResponseMarkdownPart

Properties
value: MarkdownString

ChatResponsePart
Represents the different chat response types.

ChatResponsePart: ChatResponseMarkdownPart | ChatResponseFileTreePart | ChatResponseAnchorPart | ChatResponseProgressPart | ChatResponseReferencePart | ChatResponseCommandButtonPart

ChatResponseProgressPart
Represents a part of a chat response that is a progress message.

Constructors
new ChatResponseProgressPart(value: string): ChatResponseProgressPart

Properties
value: string

ChatResponseReferencePart
Represents a part of a chat response that is a reference, rendered separately from the content.

Constructors
new ChatResponseReferencePart(value: Uri | Location, iconPath?: IconPath): ChatResponseReferencePart

Properties
iconPath?: IconPath

value: Uri | Location

ChatResponseStream
The ChatResponseStream is how a participant is able to return content to the chat view. It provides several methods for streaming different types of content which will be rendered in an appropriate way in the chat view. A participant can use the helper method for the type of content it wants to return, or it can instantiate a ChatResponsePart and use the generic ChatResponseStream.push method to return it.

Methods
anchor(value: Uri | Location, title?: string): void

button(command: Command): void

filetree(value: ChatResponseFileTree[], baseUri: Uri): void

markdown(value: string | MarkdownString): void

progress(value: string): void

push(part: ChatResponsePart): void

reference(value: Uri | Location, iconPath?: IconPath): void

ChatResponseTurn
Represents a chat participant's response in chat history.

Properties
command?: string

participant: string

response: ReadonlyArray<ChatResponseMarkdownPart | ChatResponseFileTreePart | ChatResponseAnchorPart | ChatResponseCommandButtonPart>

result: ChatResult

ChatResult
The result of a chat request.

Properties
errorDetails?: ChatErrorDetails

metadata?:

ChatResultFeedback
Represents user feedback for a result.

Properties
kind: ChatResultFeedbackKind

result: ChatResult

ChatResultFeedbackKind
Represents the type of user feedback received.

Enumeration Members
Unhelpful: 0

Helpful: 1

Clipboard
The clipboard provides read and write access to the system's clipboard.

Methods
readText(): Thenable<string>

writeText(value: string): Thenable<void>

CodeAction
A code action represents a change that can be performed in code, e.g. to fix a problem or to refactor code.

A CodeAction must set either edit and/or a command. If both are supplied, the edit is applied first, then the command is executed.

Constructors
new CodeAction(title: string, kind?: CodeActionKind): CodeAction

Properties
command?: Command

diagnostics?: Diagnostic[]

disabled?: {reason: string}

edit?: WorkspaceEdit

isPreferred?: boolean

kind?: CodeActionKind

title: string

CodeActionContext
Contains additional diagnostic information about the context in which a code action is run.

Properties
diagnostics: readonly Diagnostic[]

only: CodeActionKind

triggerKind: CodeActionTriggerKind

CodeActionKind
Kind of a code action.

Kinds are a hierarchical list of identifiers separated by ., e.g. "refactor.extract.function".

Code action kinds are used by the editor for UI elements such as the refactoring context menu. Users can also trigger code actions with a specific kind with the editor.action.codeAction command.

Static
Empty: CodeActionKind

Notebook: CodeActionKind

QuickFix: CodeActionKind

Refactor: CodeActionKind

RefactorExtract: CodeActionKind

RefactorInline: CodeActionKind

RefactorMove: CodeActionKind

RefactorRewrite: CodeActionKind

Source: CodeActionKind

SourceFixAll: CodeActionKind

SourceOrganizeImports: CodeActionKind

Constructors
new CodeActionKind(value: string): CodeActionKind

Properties
value: string

Methods
append(parts: string): CodeActionKind

contains(other: CodeActionKind): boolean

intersects(other: CodeActionKind): boolean

CodeActionProvider<T>
Provides contextual actions for code. Code actions typically either fix problems or beautify/refactor code.

Code actions are surfaced to users in a few different ways:

The lightbulb feature, which shows a list of code actions at the current cursor position. The lightbulb's list of actions includes both quick fixes and refactorings.
As commands that users can run, such as Refactor. Users can run these from the command palette or with keybindings.
As source actions, such Organize Imports.
Quick fixes are shown in the problems view.
Change applied on save by the editor.codeActionsOnSave setting.
Methods
provideCodeActions(document: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): ProviderResult<Array<Command | T>>

resolveCodeAction(codeAction: T, token: CancellationToken): ProviderResult<T>

CodeActionProviderMetadata
Metadata about the type of code actions that a CodeActionProvider provides.

Properties
documentation?: ReadonlyArray<{command: Command, kind: CodeActionKind}>

providedCodeActionKinds?: readonly CodeActionKind[]

CodeActionTriggerKind
The reason why code actions were requested.

Enumeration Members
Invoke: 1

Automatic: 2

CodeLens
A code lens represents a Command that should be shown along with source text, like the number of references, a way to run tests, etc.

A code lens is unresolved when no command is associated to it. For performance reasons the creation of a code lens and resolving should be done to two stages.

See also

CodeLensProvider.provideCodeLenses
CodeLensProvider.resolveCodeLens
Constructors
new CodeLens(range: Range, command?: Command): CodeLens

Properties
command?: Command

isResolved: boolean

range: Range

CodeLensProvider<T>
A code lens provider adds commands to source text. The commands will be shown as dedicated horizontal lines in between the source text.

Events
onDidChangeCodeLenses?: Event<void>

Methods
provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<T[]>

resolveCodeLens(codeLens: T, token: CancellationToken): ProviderResult<T>

Color
Represents a color in RGBA space.

Constructors
new Color(red: number, green: number, blue: number, alpha: number): Color

Properties
alpha: number

blue: number

green: number

red: number

ColorInformation
Represents a color range from a document.

Constructors
new ColorInformation(range: Range, color: Color): ColorInformation

Properties
color: Color

range: Range

ColorPresentation
A color presentation object describes how a Color should be represented as text and what edits are required to refer to it from source code.

For some languages one color can have multiple presentations, e.g. css can represent the color red with the constant Red, the hex-value #ff0000, or in rgba and hsla forms. In csharp other representations apply, e.g. System.Drawing.Color.Red.

Constructors
new ColorPresentation(label: string): ColorPresentation

Properties
additionalTextEdits?: TextEdit[]

label: string

textEdit?: TextEdit

ColorTheme
Represents a color theme.

Properties
kind: ColorThemeKind

ColorThemeKind
Represents a color theme kind.

Enumeration Members
Light: 1

Dark: 2

HighContrast: 3

HighContrastLight: 4

Command
Represents a reference to a command. Provides a title which will be used to represent a command in the UI and, optionally, an array of arguments which will be passed to the command handler function when invoked.

Properties
arguments?: any[]

command: string

title: string

tooltip?: string

Comment
A comment is displayed within the editor or the Comments Panel, depending on how it is provided.

Properties
author: CommentAuthorInformation

body: string | MarkdownString

contextValue?: string

label?: string

mode: CommentMode

reactions?: CommentReaction[]

timestamp?: Date

CommentAuthorInformation
Author information of a Comment

Properties
iconPath?: Uri

name: string

CommentController
A comment controller is able to provide comments support to the editor and provide users various ways to interact with comments.

Properties
commentingRangeProvider?: CommentingRangeProvider

id: string

label: string

options?: CommentOptions

reactionHandler?: (comment: Comment, reaction: CommentReaction) => Thenable<void>

Methods
createCommentThread(uri: Uri, range: Range, comments: readonly Comment[]): CommentThread

dispose(): void

CommentingRangeProvider
Commenting range provider for a comment controller.

Methods
provideCommentingRanges(document: TextDocument, token: CancellationToken): ProviderResult<Range[] | CommentingRanges>

CommentingRanges
The ranges a CommentingRangeProvider enables commenting on.

Properties
enableFileComments: boolean

ranges?: Range[]

CommentMode
Comment mode of a Comment

Enumeration Members
Editing: 0

Preview: 1

CommentOptions
Represents a comment controller's options.

Properties
placeHolder?: string

prompt?: string

CommentReaction
Reactions of a Comment

Properties
authorHasReacted: boolean

count: number

iconPath: string | Uri

label: string

CommentReply
Command argument for actions registered in comments/commentThread/context.

Properties
text: string

thread: CommentThread

CommentRule
Describes how comments for a language work.

Properties
blockComment?: CharacterPair

lineComment?: string

CommentThread
A collection of comments representing a conversation at a particular range in a document.

Properties
canReply: boolean | CommentAuthorInformation

collapsibleState: CommentThreadCollapsibleState

comments: readonly Comment[]

contextValue?: string

label?: string

range: Range

state?: CommentThreadState

uri: Uri

Methods
dispose(): void

CommentThreadCollapsibleState
Collapsible state of a comment thread

Enumeration Members
Collapsed: 0

Expanded: 1

CommentThreadState
The state of a comment thread.

Enumeration Members
Unresolved: 0

Resolved: 1

CompletionContext
Contains additional information about the context in which completion provider is triggered.

Properties
triggerCharacter: string

triggerKind: CompletionTriggerKind

CompletionItem
A completion item represents a text snippet that is proposed to complete text that is being typed.

It is sufficient to create a completion item from just a label. In that case the completion item will replace the word until the cursor with the given label or insertText. Otherwise the given edit is used.

When selecting a completion item in the editor its defined or synthesized text edit will be applied to all cursors/selections whereas additionalTextEdits will be applied as provided.

See also

CompletionItemProvider.provideCompletionItems
CompletionItemProvider.resolveCompletionItem
Constructors
new CompletionItem(label: string | CompletionItemLabel, kind?: CompletionItemKind): CompletionItem

Properties
additionalTextEdits?: TextEdit[]

command?: Command

commitCharacters?: string[]

detail?: string

documentation?: string | MarkdownString

filterText?: string

insertText?: string | SnippetString

keepWhitespace?: boolean

kind?: CompletionItemKind

label: string | CompletionItemLabel

preselect?: boolean

range?: Range | {inserting: Range, replacing: Range}

sortText?: string

tags?: readonly CompletionItemTag[]

textEdit?: TextEdit

CompletionItemKind
Completion item kinds.

Enumeration Members
Text: 0

Method: 1

Function: 2

Constructor: 3

Field: 4

Variable: 5

Class: 6

Interface: 7

Module: 8

Property: 9

Unit: 10

Value: 11

Enum: 12

Keyword: 13

Snippet: 14

Color: 15

File: 16

Reference: 17

Folder: 18

EnumMember: 19

Constant: 20

Struct: 21

Event: 22

Operator: 23

TypeParameter: 24

User: 25

Issue: 26

CompletionItemLabel
A structured label for a completion item.

Properties
description?: string

detail?: string

label: string

CompletionItemProvider<T>
The completion item provider interface defines the contract between extensions and IntelliSense.

Providers can delay the computation of the detail and documentation properties by implementing the resolveCompletionItem-function. However, properties that are needed for the initial sorting and filtering, like sortText, filterText, insertText, and range, must not be changed during resolve.

Providers are asked for completions either explicitly by a user gesture or -depending on the configuration- implicitly when typing words or trigger characters.

Methods
provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionList<T> | T[]>

resolveCompletionItem(item: T, token: CancellationToken): ProviderResult<T>

CompletionItemTag
Completion item tags are extra annotations that tweak the rendering of a completion item.

Enumeration Members
Deprecated: 1

CompletionList<T>
Represents a collection of completion items to be presented in the editor.

Constructors
new CompletionList<T extends CompletionItem>(items?: T[], isIncomplete?: boolean): CompletionList<T>

Properties
isIncomplete?: boolean

items: T[]

CompletionTriggerKind
How a completion provider was triggered

Enumeration Members
Invoke: 0

TriggerCharacter: 1

TriggerForIncompleteCompletions: 2

ConfigurationChangeEvent
An event describing the change in Configuration

Methods
affectsConfiguration(section: string, scope?: ConfigurationScope): boolean

ConfigurationScope
The configuration scope which can be:

a Uri representing a resource
a TextDocument representing an open text document
a WorkspaceFolder representing a workspace folder
an object containing:
uri: an optional Uri of a text document
languageId: the language identifier of a text document
ConfigurationScope: Uri | TextDocument | WorkspaceFolder | {languageId: string, uri: Uri}

ConfigurationTarget
The configuration target

Enumeration Members
Global: 1

Workspace: 2

WorkspaceFolder: 3

CustomDocument
Represents a custom document used by a CustomEditorProvider.

Custom documents are only used within a given CustomEditorProvider. The lifecycle of a CustomDocument is managed by the editor. When no more references remain to a CustomDocument, it is disposed of.

Properties
uri: Uri

Methods
dispose(): void

CustomDocumentBackup
A backup for an CustomDocument.

Properties
id: string

Methods
delete(): void

CustomDocumentBackupContext
Additional information used to implement CustomDocumentBackup.

Properties
destination: Uri

CustomDocumentContentChangeEvent<T>
Event triggered by extensions to signal to the editor that the content of a CustomDocument has changed.

See also CustomEditorProvider.onDidChangeCustomDocument.

Properties
document: T

CustomDocumentEditEvent<T>
Event triggered by extensions to signal to the editor that an edit has occurred on an CustomDocument.

See also CustomEditorProvider.onDidChangeCustomDocument.

Properties
document: T

label?: string

Methods
redo(): void | Thenable<void>

undo(): void | Thenable<void>

CustomDocumentOpenContext
Additional information about the opening custom document.

Properties
backupId: string

untitledDocumentData: Uint8Array

CustomEditorProvider<T>
Provider for editable custom editors that use a custom document model.

Custom editors use CustomDocument as their document model instead of a TextDocument. This gives extensions full control over actions such as edit, save, and backup.

You should use this type of custom editor when dealing with binary files or more complex scenarios. For simple text based documents, use CustomTextEditorProvider instead.

Events
onDidChangeCustomDocument: Event<CustomDocumentEditEvent<T>> | Event<CustomDocumentContentChangeEvent<T>>

Methods
backupCustomDocument(document: T, context: CustomDocumentBackupContext, cancellation: CancellationToken): Thenable<CustomDocumentBackup>

openCustomDocument(uri: Uri, openContext: CustomDocumentOpenContext, token: CancellationToken): T | Thenable<T>

resolveCustomEditor(document: T, webviewPanel: WebviewPanel, token: CancellationToken): void | Thenable<void>

revertCustomDocument(document: T, cancellation: CancellationToken): Thenable<void>

saveCustomDocument(document: T, cancellation: CancellationToken): Thenable<void>

saveCustomDocumentAs(document: T, destination: Uri, cancellation: CancellationToken): Thenable<void>

CustomExecution
Class used to execute an extension callback as a task.

Constructors
new CustomExecution(callback: (resolvedDefinition: TaskDefinition) => Thenable<Pseudoterminal>): CustomExecution

CustomReadonlyEditorProvider<T>
Provider for readonly custom editors that use a custom document model.

Custom editors use CustomDocument as their document model instead of a TextDocument.

You should use this type of custom editor when dealing with binary files or more complex scenarios. For simple text based documents, use CustomTextEditorProvider instead.

Methods
openCustomDocument(uri: Uri, openContext: CustomDocumentOpenContext, token: CancellationToken): T | Thenable<T>

resolveCustomEditor(document: T, webviewPanel: WebviewPanel, token: CancellationToken): void | Thenable<void>

CustomTextEditorProvider
Provider for text based custom editors.

Text based custom editors use a TextDocument as their data model. This considerably simplifies implementing a custom editor as it allows the editor to handle many common operations such as undo and backup. The provider is responsible for synchronizing text changes between the webview and the TextDocument.

Methods
resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel, token: CancellationToken): void | Thenable<void>

DataTransfer
A map containing a mapping of the mime type of the corresponding transferred data.

Drag and drop controllers that implement handleDrag can add additional mime types to the data transfer. These additional mime types will only be included in the handleDrop when the drag was initiated from an element in the same drag and drop controller.

Constructors
new DataTransfer(): DataTransfer

Methods
[iterator](): IterableIterator<[mimeType: string, item: DataTransferItem]>

forEach(callbackfn: (item: DataTransferItem, mimeType: string, dataTransfer: DataTransfer) => void, thisArg?: any): void

get(mimeType: string): DataTransferItem

set(mimeType: string, value: DataTransferItem): void

DataTransferFile
A file associated with a DataTransferItem.

Instances of this type can only be created by the editor and not by extensions.

Properties
name: string

uri?: Uri

Methods
data(): Thenable<Uint8Array>

DataTransferItem
Encapsulates data transferred during drag and drop operations.

Constructors
new DataTransferItem(value: any): DataTransferItem

Properties
value: any

Methods
asFile(): DataTransferFile

asString(): Thenable<string>

DebugAdapter
A debug adapter that implements the Debug Adapter Protocol can be registered with the editor if it implements the DebugAdapter interface.

Events
onDidSendMessage: Event<DebugProtocolMessage>

Methods
dispose(): any

handleMessage(message: DebugProtocolMessage): void

DebugAdapterDescriptor
Represents the different types of debug adapters

DebugAdapterDescriptor: DebugAdapterExecutable | DebugAdapterServer | DebugAdapterNamedPipeServer | DebugAdapterInlineImplementation

DebugAdapterDescriptorFactory
A debug adapter factory that creates debug adapter descriptors.

Methods
createDebugAdapterDescriptor(session: DebugSession, executable: DebugAdapterExecutable): ProviderResult<DebugAdapterDescriptor>

DebugAdapterExecutable
Represents a debug adapter executable and optional arguments and runtime options passed to it.

Constructors
new DebugAdapterExecutable(command: string, args?: string[], options?: DebugAdapterExecutableOptions): DebugAdapterExecutable

Properties
args: string[]

command: string

options?: DebugAdapterExecutableOptions

DebugAdapterExecutableOptions
Options for a debug adapter executable.

Properties
cwd?: string

env?:

DebugAdapterInlineImplementation
A debug adapter descriptor for an inline implementation.

Constructors
new DebugAdapterInlineImplementation(implementation: DebugAdapter): DebugAdapterInlineImplementation

DebugAdapterNamedPipeServer
Represents a debug adapter running as a Named Pipe (on Windows)/UNIX Domain Socket (on non-Windows) based server.

Constructors
new DebugAdapterNamedPipeServer(path: string): DebugAdapterNamedPipeServer

Properties
path: string

DebugAdapterServer
Represents a debug adapter running as a socket based server.

Constructors
new DebugAdapterServer(port: number, host?: string): DebugAdapterServer

Properties
host?: string

port: number

DebugAdapterTracker
A Debug Adapter Tracker is a means to track the communication between the editor and a Debug Adapter.

Events
onDidSendMessage(message: any): void

onWillReceiveMessage(message: any): void

onWillStartSession(): void

onWillStopSession(): void

Methods
onError(error: Error): void

onExit(code: number, signal: string): void

DebugAdapterTrackerFactory
A debug adapter factory that creates debug adapter trackers.

Methods
createDebugAdapterTracker(session: DebugSession): ProviderResult<DebugAdapterTracker>

DebugConfiguration
Configuration for a debug session.

Properties
name: string

request: string

type: string

DebugConfigurationProvider
A debug configuration provider allows to add debug configurations to the debug service and to resolve launch configurations before they are used to start a debug session. A debug configuration provider is registered via debug.registerDebugConfigurationProvider.

Methods
provideDebugConfigurations(folder: WorkspaceFolder, token?: CancellationToken): ProviderResult<DebugConfiguration[]>

resolveDebugConfiguration(folder: WorkspaceFolder, debugConfiguration: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration>

resolveDebugConfigurationWithSubstitutedVariables(folder: WorkspaceFolder, debugConfiguration: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration>

DebugConfigurationProviderTriggerKind
A DebugConfigurationProviderTriggerKind specifies when the provideDebugConfigurations method of a DebugConfigurationProvider is triggered. Currently there are two situations: to provide the initial debug configurations for a newly created launch.json or to provide dynamically generated debug configurations when the user asks for them through the UI (e.g. via the "Select and Start Debugging" command). A trigger kind is used when registering a DebugConfigurationProvider with debug.registerDebugConfigurationProvider.

Enumeration Members
Initial: 1

Dynamic: 2

DebugConsole
Represents the debug console.

Methods
append(value: string): void

appendLine(value: string): void

DebugConsoleMode
Debug console mode used by debug session, see options.

Enumeration Members
Separate: 0

MergeWithParent: 1

DebugProtocolBreakpoint
A DebugProtocolBreakpoint is an opaque stand-in type for the Breakpoint type defined in the Debug Adapter Protocol.

DebugProtocolMessage
A DebugProtocolMessage is an opaque stand-in type for the ProtocolMessage type defined in the Debug Adapter Protocol.

DebugProtocolSource
A DebugProtocolSource is an opaque stand-in type for the Source type defined in the Debug Adapter Protocol.

DebugSession
A debug session.

Properties
configuration: DebugConfiguration

id: string

name: string

parentSession?: DebugSession

type: string

workspaceFolder: WorkspaceFolder

Methods
customRequest(command: string, args?: any): Thenable<any>

getDebugProtocolBreakpoint(breakpoint: Breakpoint): Thenable<DebugProtocolBreakpoint>

DebugSessionCustomEvent
A custom Debug Adapter Protocol event received from a debug session.

Properties
body: any

event: string

session: DebugSession

DebugSessionOptions
Options for starting a debug session.

Properties
compact?: boolean

consoleMode?: DebugConsoleMode

lifecycleManagedByParent?: boolean

noDebug?: boolean

parentSession?: DebugSession

suppressDebugStatusbar?: boolean

suppressDebugToolbar?: boolean

suppressDebugView?: boolean

suppressSaveBeforeStart?: boolean

testRun?: TestRun

DebugStackFrame
Represents a stack frame in a debug session.

Properties
frameId: number

session: DebugSession

threadId: number

DebugThread
Represents a thread in a debug session.

Properties
session: DebugSession

threadId: number

Declaration
The declaration of a symbol representation as one or many locations or location links.

Declaration: Location | Location[] | LocationLink[]

DeclarationCoverage
Contains coverage information for a declaration. Depending on the reporter and language, this may be types such as functions, methods, or namespaces.

Constructors
new DeclarationCoverage(name: string, executed: number | boolean, location: Range | Position): DeclarationCoverage

Properties
executed: number | boolean

location: Range | Position

name: string

DeclarationProvider
The declaration provider interface defines the contract between extensions and the go to declaration feature.

Methods
provideDeclaration(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Declaration>

DecorationInstanceRenderOptions
Represents render options for decoration instances. See DecorationOptions.renderOptions.

Properties
after?: ThemableDecorationAttachmentRenderOptions

before?: ThemableDecorationAttachmentRenderOptions

dark?: ThemableDecorationInstanceRenderOptions

light?: ThemableDecorationInstanceRenderOptions

DecorationOptions
Represents options for a specific decoration in a decoration set.

Properties
hoverMessage?: MarkdownString | MarkedString | Array<MarkdownString | MarkedString>

range: Range

renderOptions?: DecorationInstanceRenderOptions

DecorationRangeBehavior
Describes the behavior of decorations when typing/editing at their edges.

Enumeration Members
OpenOpen: 0

ClosedClosed: 1

OpenClosed: 2

ClosedOpen: 3

DecorationRenderOptions
Represents rendering styles for a text editor decoration.

Properties
after?: ThemableDecorationAttachmentRenderOptions

backgroundColor?: string | ThemeColor

before?: ThemableDecorationAttachmentRenderOptions

border?: string

borderColor?: string | ThemeColor

borderRadius?: string

borderSpacing?: string

borderStyle?: string

borderWidth?: string

color?: string | ThemeColor

cursor?: string

dark?: ThemableDecorationRenderOptions

fontStyle?: string

fontWeight?: string

gutterIconPath?: string | Uri

gutterIconSize?: string

isWholeLine?: boolean

letterSpacing?: string

light?: ThemableDecorationRenderOptions

opacity?: string

outline?: string

outlineColor?: string | ThemeColor

outlineStyle?: string

outlineWidth?: string

overviewRulerColor?: string | ThemeColor

overviewRulerLane?: OverviewRulerLane

rangeBehavior?: DecorationRangeBehavior

textDecoration?: string

Definition
The definition of a symbol represented as one or many locations. For most programming languages there is only one location at which a symbol is defined.

Definition: Location | Location[]

DefinitionLink
Information about where a symbol is defined.

Provides additional metadata over normal Location definitions, including the range of the defining symbol

DefinitionLink: LocationLink

DefinitionProvider
The definition provider interface defines the contract between extensions and the go to definition and peek definition features.

Methods
provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition | LocationLink[]>

Diagnostic
Represents a diagnostic, such as a compiler error or warning. Diagnostic objects are only valid in the scope of a file.

Constructors
new Diagnostic(range: Range, message: string, severity?: DiagnosticSeverity): Diagnostic

Properties
code?: string | number | {target: Uri, value: string | number}

message: string

range: Range

relatedInformation?: DiagnosticRelatedInformation[]

severity: DiagnosticSeverity

source?: string

tags?: DiagnosticTag[]

DiagnosticChangeEvent
The event that is fired when diagnostics change.

Properties
uris: readonly Uri[]

DiagnosticCollection
A diagnostics collection is a container that manages a set of diagnostics. Diagnostics are always scopes to a diagnostics collection and a resource.

To get an instance of a DiagnosticCollection use createDiagnosticCollection.

Properties
name: string

Methods
clear(): void

delete(uri: Uri): void

dispose(): void

forEach(callback: (uri: Uri, diagnostics: readonly Diagnostic[], collection: DiagnosticCollection) => any, thisArg?: any): void

get(uri: Uri): readonly Diagnostic[]

has(uri: Uri): boolean

set(uri: Uri, diagnostics: readonly Diagnostic[]): void

set(entries: ReadonlyArray<[Uri, readonly Diagnostic[]]>): void

DiagnosticRelatedInformation
Represents a related message and source code location for a diagnostic. This should be used to point to code locations that cause or related to a diagnostics, e.g. when duplicating a symbol in a scope.

Constructors
new DiagnosticRelatedInformation(location: Location, message: string): DiagnosticRelatedInformation

Properties
location: Location

message: string

DiagnosticSeverity
Represents the severity of diagnostics.

Enumeration Members
Error: 0

Warning: 1

Information: 2

Hint: 3

DiagnosticTag
Additional metadata about the type of a diagnostic.

Enumeration Members
Unnecessary: 1

Deprecated: 2

Disposable
Represents a type which can release resources, such as event listening or a timer.

Static
from(...disposableLikes: Array<{dispose: () => any}>): Disposable

Constructors
new Disposable(callOnDispose: () => any): Disposable

Methods
dispose(): any

DocumentColorProvider
The document color provider defines the contract between extensions and feature of picking and modifying colors in the editor.

Methods
provideColorPresentations(color: Color, context: {document: TextDocument, range: Range}, token: CancellationToken): ProviderResult<ColorPresentation[]>

provideDocumentColors(document: TextDocument, token: CancellationToken): ProviderResult<ColorInformation[]>

DocumentDropEdit
An edit operation applied on drop.

Constructors
new DocumentDropEdit(insertText: string | SnippetString, title?: string, kind?: DocumentDropOrPasteEditKind): DocumentDropEdit

Properties
additionalEdit?: WorkspaceEdit

insertText: string | SnippetString

kind?: DocumentDropOrPasteEditKind

title?: string

yieldTo?: readonly DocumentDropOrPasteEditKind[]

DocumentDropEditProvider<T>
Provider which handles dropping of resources into a text editor.

This allows users to drag and drop resources (including resources from external apps) into the editor. While dragging and dropping files, users can hold down shift to drop the file into the editor instead of opening it. Requires editor.dropIntoEditor.enabled to be on.

Methods
provideDocumentDropEdits(document: TextDocument, position: Position, dataTransfer: DataTransfer, token: CancellationToken): ProviderResult<T | T[]>

resolveDocumentDropEdit(edit: T, token: CancellationToken): ProviderResult<T>

DocumentDropEditProviderMetadata
Provides additional metadata about how a DocumentDropEditProvider works.

Properties
dropMimeTypes: readonly string[]

providedDropEditKinds?: readonly DocumentDropOrPasteEditKind[]

DocumentDropOrPasteEditKind
Identifies a DocumentDropEdit or DocumentPasteEdit

Static
Empty: DocumentDropOrPasteEditKind

Text: DocumentDropOrPasteEditKind

TextUpdateImports: DocumentDropOrPasteEditKind

Constructors
new DocumentDropOrPasteEditKind(value: string): DocumentDropOrPasteEditKind

Properties
value: string

Methods
append(...parts: string[]): DocumentDropOrPasteEditKind

contains(other: DocumentDropOrPasteEditKind): boolean

intersects(other: DocumentDropOrPasteEditKind): boolean

DocumentFilter
A document filter denotes a document by different properties like the language, the scheme of its resource, or a glob-pattern that is applied to the path.

Example A language filter that applies to typescript files on disk

TypeScript

{ language: 'typescript', scheme: 'file' }
Example A language filter that applies to all package.json paths

TypeScript

{ language: 'json', pattern: '**/package.json' }
Properties
language?: string

notebookType?: string

pattern?: GlobPattern

scheme?: string

DocumentFormattingEditProvider
The document formatting provider interface defines the contract between extensions and the formatting-feature.

Methods
provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]>

DocumentHighlight
A document highlight is a range inside a text document which deserves special attention. Usually a document highlight is visualized by changing the background color of its range.

Constructors
new DocumentHighlight(range: Range, kind?: DocumentHighlightKind): DocumentHighlight

Properties
kind?: DocumentHighlightKind

range: Range

DocumentHighlightKind
A document highlight kind.

Enumeration Members
Text: 0

Read: 1

Write: 2

DocumentHighlightProvider
The document highlight provider interface defines the contract between extensions and the word-highlight-feature.

Methods
provideDocumentHighlights(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<DocumentHighlight[]>

DocumentLink
A document link is a range in a text document that links to an internal or external resource, like another text document or a web site.

Constructors
new DocumentLink(range: Range, target?: Uri): DocumentLink

Properties
range: Range

target?: Uri

tooltip?: string

DocumentLinkProvider<T>
The document link provider defines the contract between extensions and feature of showing links in the editor.

Methods
provideDocumentLinks(document: TextDocument, token: CancellationToken): ProviderResult<T[]>

resolveDocumentLink(link: T, token: CancellationToken): ProviderResult<T>

DocumentPasteEdit
An edit the applies a paste operation.

Constructors
new DocumentPasteEdit(insertText: string | SnippetString, title: string, kind: DocumentDropOrPasteEditKind): DocumentPasteEdit

Properties
additionalEdit?: WorkspaceEdit

insertText: string | SnippetString

kind: DocumentDropOrPasteEditKind

title: string

yieldTo?: readonly DocumentDropOrPasteEditKind[]

DocumentPasteEditContext
Additional information about the paste operation.

Properties
only: DocumentDropOrPasteEditKind

triggerKind: DocumentPasteTriggerKind

DocumentPasteEditProvider<T>
Provider invoked when the user copies or pastes in a TextDocument.

Methods
prepareDocumentPaste(document: TextDocument, ranges: readonly Range[], dataTransfer: DataTransfer, token: CancellationToken): void | Thenable<void>

provideDocumentPasteEdits(document: TextDocument, ranges: readonly Range[], dataTransfer: DataTransfer, context: DocumentPasteEditContext, token: CancellationToken): ProviderResult<T[]>

resolveDocumentPasteEdit(pasteEdit: T, token: CancellationToken): ProviderResult<T>

DocumentPasteProviderMetadata
Provides additional metadata about how a DocumentPasteEditProvider works.

Properties
copyMimeTypes?: readonly string[]

pasteMimeTypes?: readonly string[]

providedPasteEditKinds: readonly DocumentDropOrPasteEditKind[]

DocumentPasteTriggerKind
The reason why paste edits were requested.

Enumeration Members
Automatic: 0

PasteAs: 1

DocumentRangeFormattingEditProvider
The document formatting provider interface defines the contract between extensions and the formatting-feature.

Methods
provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]>

provideDocumentRangesFormattingEdits(document: TextDocument, ranges: Range[], options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]>

DocumentRangeSemanticTokensProvider
The document range semantic tokens provider interface defines the contract between extensions and semantic tokens.

Methods
provideDocumentRangeSemanticTokens(document: TextDocument, range: Range, token: CancellationToken): ProviderResult<SemanticTokens>

DocumentSelector
A language selector is the combination of one or many language identifiers and language filters.

Note that a document selector that is just a language identifier selects all documents, even those that are not saved on disk. Only use such selectors when a feature works without further context, e.g. without the need to resolve related 'files'.

Example

TypeScript

let sel: DocumentSelector = { scheme: 'file', language: 'typescript' };
DocumentSelector: DocumentFilter | string | ReadonlyArray<DocumentFilter | string>

DocumentSemanticTokensProvider
The document semantic tokens provider interface defines the contract between extensions and semantic tokens.

Events
onDidChangeSemanticTokens?: Event<void>

Methods
provideDocumentSemanticTokens(document: TextDocument, token: CancellationToken): ProviderResult<SemanticTokens>

provideDocumentSemanticTokensEdits(document: TextDocument, previousResultId: string, token: CancellationToken): ProviderResult<SemanticTokens | SemanticTokensEdits>

DocumentSymbol
Represents programming constructs like variables, classes, interfaces etc. that appear in a document. Document symbols can be hierarchical and they have two ranges: one that encloses its definition and one that points to its most interesting range, e.g. the range of an identifier.

Constructors
new DocumentSymbol(name: string, detail: string, kind: SymbolKind, range: Range, selectionRange: Range): DocumentSymbol

Properties
children: DocumentSymbol[]

detail: string

kind: SymbolKind

name: string

range: Range

selectionRange: Range

tags?: readonly SymbolTag[]

DocumentSymbolProvider
The document symbol provider interface defines the contract between extensions and the go to symbol-feature.

Methods
provideDocumentSymbols(document: TextDocument, token: CancellationToken): ProviderResult<DocumentSymbol[] | SymbolInformation[]>

DocumentSymbolProviderMetadata
Metadata about a document symbol provider.

Properties
label?: string

EndOfLine
Represents an end of line character sequence in a document.

Enumeration Members
LF: 1

CRLF: 2

EnterAction
Describes what to do when pressing Enter.

Properties
appendText?: string

indentAction: IndentAction

removeText?: number

EnvironmentVariableCollection
A collection of mutations that an extension can apply to a process environment.

Properties
description: string | MarkdownString

persistent: boolean

Methods
append(variable: string, value: string, options?: EnvironmentVariableMutatorOptions): void

clear(): void

delete(variable: string): void

forEach(callback: (variable: string, mutator: EnvironmentVariableMutator, collection: EnvironmentVariableCollection) => any, thisArg?: any): void

get(variable: string): EnvironmentVariableMutator

prepend(variable: string, value: string, options?: EnvironmentVariableMutatorOptions): void

replace(variable: string, value: string, options?: EnvironmentVariableMutatorOptions): void

EnvironmentVariableMutator
A type of mutation and its value to be applied to an environment variable.

Properties
options: EnvironmentVariableMutatorOptions

type: EnvironmentVariableMutatorType

value: string

EnvironmentVariableMutatorOptions
Options applied to the mutator.

Properties
applyAtProcessCreation?: boolean

applyAtShellIntegration?: boolean

EnvironmentVariableMutatorType
A type of mutation that can be applied to an environment variable.

Enumeration Members
Replace: 1

Append: 2

Prepend: 3

EnvironmentVariableScope
The scope object to which the environment variable collection applies.

Properties
workspaceFolder?: WorkspaceFolder

EvaluatableExpression
An EvaluatableExpression represents an expression in a document that can be evaluated by an active debugger or runtime. The result of this evaluation is shown in a tooltip-like widget. If only a range is specified, the expression will be extracted from the underlying document. An optional expression can be used to override the extracted expression. In this case the range is still used to highlight the range in the document.

Constructors
new EvaluatableExpression(range: Range, expression?: string): EvaluatableExpression

Properties
expression?: string

range: Range

EvaluatableExpressionProvider
The evaluatable expression provider interface defines the contract between extensions and the debug hover. In this contract the provider returns an evaluatable expression for a given position in a document and the editor evaluates this expression in the active debug session and shows the result in a debug hover.

Methods
provideEvaluatableExpression(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<EvaluatableExpression>

Event<T>
Represents a typed event.

A function that represents an event to which you subscribe by calling it with a listener function as argument.

Example

TypeScript

item.onDidChange(function(event) {
  console.log('Event happened: ' + event);
});
(listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]): Disposable

EventEmitter<T>
An event emitter can be used to create and manage an Event for others to subscribe to. One emitter always owns one event.

Use this class if you want to provide event from within your extension, for instance inside a TextDocumentContentProvider or when providing API to other extensions.

Constructors
new EventEmitter<T>(): EventEmitter<T>

Properties
event: Event<T>

Methods
dispose(): void

fire(data: T): void

Extension<T>
Represents an extension.

To get an instance of an Extension use getExtension.

Properties
exports: T

extensionKind: ExtensionKind

extensionPath: string

extensionUri: Uri

id: string

isActive: boolean

packageJSON: any

Methods
activate(): Thenable<T>

ExtensionContext
An extension context is a collection of utilities private to an extension.

An instance of an ExtensionContext is provided as the first parameter to the activate-call of an extension.

Properties
environmentVariableCollection: GlobalEnvironmentVariableCollection

extension: Extension<any>

extensionMode: ExtensionMode

extensionPath: string

extensionUri: Uri

globalState: Memento & {setKeysForSync}

globalStoragePath: string

globalStorageUri: Uri

languageModelAccessInformation: LanguageModelAccessInformation

logPath: string

logUri: Uri

secrets: SecretStorage

storagePath: string

storageUri: Uri

subscriptions: Array<{dispose}>

workspaceState: Memento

Methods
asAbsolutePath(relativePath: string): string

ExtensionKind
In a remote window the extension kind describes if an extension runs where the UI (window) runs or if an extension runs remotely.

Enumeration Members
UI: 1

Workspace: 2

ExtensionMode
The ExtensionMode is provided on the ExtensionContext and indicates the mode the specific extension is running in.

Enumeration Members
Production: 1

Development: 2

Test: 3

ExtensionTerminalOptions
Value-object describing what options a virtual process terminal should use.

Properties
color?: ThemeColor

iconPath?: IconPath

isTransient?: boolean

location?: TerminalEditorLocationOptions | TerminalSplitLocationOptions | TerminalLocation

name: string

pty: Pseudoterminal

shellIntegrationNonce?: string

FileChangeEvent
The event filesystem providers must use to signal a file change.

Properties
type: FileChangeType

uri: Uri

FileChangeType
Enumeration of file change types.

Enumeration Members
Changed: 1

Created: 2

Deleted: 3

FileCoverage
Contains coverage metadata for a file.

Static
fromDetails(uri: Uri, details: readonly FileCoverageDetail[]): FileCoverage

Constructors
new FileCoverage(uri: Uri, statementCoverage: TestCoverageCount, branchCoverage?: TestCoverageCount, declarationCoverage?: TestCoverageCount, includesTests?: TestItem[]): FileCoverage

Properties
branchCoverage?: TestCoverageCount

declarationCoverage?: TestCoverageCount

includesTests?: TestItem[]

statementCoverage: TestCoverageCount

uri: Uri

FileCoverageDetail
Coverage details returned from TestRunProfile.loadDetailedCoverage.

FileCoverageDetail: StatementCoverage | DeclarationCoverage

FileCreateEvent
An event that is fired after files are created.

Properties
files: readonly Uri[]

FileDecoration
A file decoration represents metadata that can be rendered with a file.

Constructors
new FileDecoration(badge?: string, tooltip?: string, color?: ThemeColor): FileDecoration

Properties
badge?: string

color?: ThemeColor

propagate?: boolean

tooltip?: string

FileDecorationProvider
The decoration provider interfaces defines the contract between extensions and file decorations.

Events
onDidChangeFileDecorations?: Event<Uri | Uri[]>

Methods
provideFileDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration>

FileDeleteEvent
An event that is fired after files are deleted.

Properties
files: readonly Uri[]

FilePermission
Permissions of a file.

Enumeration Members
Readonly: 1

FileRenameEvent
An event that is fired after files are renamed.

Properties
files: ReadonlyArray<{newUri: Uri, oldUri: Uri}>

FileStat
The FileStat-type represents metadata about a file

Properties
ctime: number

mtime: number

permissions?: FilePermission

size: number

type: FileType

FileSystem
The file system interface exposes the editor's built-in and contributed file system providers. It allows extensions to work with files from the local disk as well as files from remote places, like the remote extension host or ftp-servers.

Note that an instance of this interface is available as workspace.fs.

Methods
copy(source: Uri, target: Uri, options?: {overwrite: boolean}): Thenable<void>

createDirectory(uri: Uri): Thenable<void>

delete(uri: Uri, options?: {recursive: boolean, useTrash: boolean}): Thenable<void>

isWritableFileSystem(scheme: string): boolean

readDirectory(uri: Uri): Thenable<Array<[string, FileType]>>

readFile(uri: Uri): Thenable<Uint8Array>

rename(source: Uri, target: Uri, options?: {overwrite: boolean}): Thenable<void>

stat(uri: Uri): Thenable<FileStat>

writeFile(uri: Uri, content: Uint8Array): Thenable<void>

FileSystemError
A type that filesystem providers should use to signal errors.

This class has factory methods for common error-cases, like FileNotFound when a file or folder doesn't exist, use them like so: throw vscode.FileSystemError.FileNotFound(someUri);

Static
FileExists(messageOrUri?: string | Uri): FileSystemError

FileIsADirectory(messageOrUri?: string | Uri): FileSystemError

FileNotADirectory(messageOrUri?: string | Uri): FileSystemError

FileNotFound(messageOrUri?: string | Uri): FileSystemError

NoPermissions(messageOrUri?: string | Uri): FileSystemError

Unavailable(messageOrUri?: string | Uri): FileSystemError

Constructors
new FileSystemError(messageOrUri?: string | Uri): FileSystemError

Properties
code: string

FileSystemProvider
The filesystem provider defines what the editor needs to read, write, discover, and to manage files and folders. It allows extensions to serve files from remote places, like ftp-servers, and to seamlessly integrate those into the editor.

Note 1: The filesystem provider API works with uris and assumes hierarchical paths, e.g. foo:/my/path is a child of foo:/my/ and a parent of foo:/my/path/deeper.
Note 2: There is an activation event onFileSystem:<scheme> that fires when a file or folder is being accessed.
Note 3: The word 'file' is often used to denote all kinds of files, e.g. folders, symbolic links, and regular files.
Events
onDidChangeFile: Event<FileChangeEvent[]>

Methods
copy(source: Uri, destination: Uri, options: {overwrite: boolean}): void | Thenable<void>

createDirectory(uri: Uri): void | Thenable<void>

delete(uri: Uri, options: {recursive: boolean}): void | Thenable<void>

readDirectory(uri: Uri): Array<[string, FileType]> | Thenable<Array<[string, FileType]>>

readFile(uri: Uri): Uint8Array | Thenable<Uint8Array>

rename(oldUri: Uri, newUri: Uri, options: {overwrite: boolean}): void | Thenable<void>

stat(uri: Uri): FileStat | Thenable<FileStat>

watch(uri: Uri, options: {excludes: readonly string[], recursive: boolean}): Disposable

writeFile(uri: Uri, content: Uint8Array, options: {create: boolean, overwrite: boolean}): void | Thenable<void>

FileSystemWatcher
A file system watcher notifies about changes to files and folders on disk or from other FileSystemProviders.

To get an instance of a FileSystemWatcher use createFileSystemWatcher.

Events
onDidChange: Event<Uri>

onDidCreate: Event<Uri>

onDidDelete: Event<Uri>

Properties
ignoreChangeEvents: boolean

ignoreCreateEvents: boolean

ignoreDeleteEvents: boolean

Methods
dispose(): any

FileType
Enumeration of file types. The types File and Directory can also be a symbolic links, in that case use FileType.File | FileType.SymbolicLink and FileType.Directory | FileType.SymbolicLink.

Enumeration Members
Unknown: 0

File: 1

Directory: 2

SymbolicLink: 64

FileWillCreateEvent
An event that is fired when files are going to be created.

To make modifications to the workspace before the files are created, call the waitUntil-function with a thenable that resolves to a workspace edit.

Properties
files: readonly Uri[]

token: CancellationToken

Methods
waitUntil(thenable: Thenable<WorkspaceEdit>): void

waitUntil(thenable: Thenable<any>): void

FileWillDeleteEvent
An event that is fired when files are going to be deleted.

To make modifications to the workspace before the files are deleted, call the waitUntil-function with a thenable that resolves to a workspace edit.

Properties
files: readonly Uri[]

token: CancellationToken

Methods
waitUntil(thenable: Thenable<WorkspaceEdit>): void

waitUntil(thenable: Thenable<any>): void

FileWillRenameEvent
An event that is fired when files are going to be renamed.

To make modifications to the workspace before the files are renamed, call the waitUntil-function with a thenable that resolves to a workspace edit.

Properties
files: ReadonlyArray<{newUri: Uri, oldUri: Uri}>

token: CancellationToken

Methods
waitUntil(thenable: Thenable<WorkspaceEdit>): void

waitUntil(thenable: Thenable<any>): void

FoldingContext
Folding context (for future use)

FoldingRange
A line based folding range. To be valid, start and end line must be bigger than zero and smaller than the number of lines in the document. Invalid ranges will be ignored.

Constructors
new FoldingRange(start: number, end: number, kind?: FoldingRangeKind): FoldingRange

Properties
end: number

kind?: FoldingRangeKind

start: number

FoldingRangeKind
An enumeration of specific folding range kinds. The kind is an optional field of a FoldingRange and is used to distinguish specific folding ranges such as ranges originated from comments. The kind is used by commands like Fold all comments or Fold all regions. If the kind is not set on the range, the range originated from a syntax element other than comments, imports or region markers.

Enumeration Members
Comment: 1

Imports: 2

Region: 3

FoldingRangeProvider
The folding range provider interface defines the contract between extensions and Folding in the editor.

Events
onDidChangeFoldingRanges?: Event<void>

Methods
provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]>

FormattingOptions
Value-object describing what options formatting should use.

Properties
insertSpaces: boolean

tabSize: number

FunctionBreakpoint
A breakpoint specified by a function name.

Constructors
new FunctionBreakpoint(functionName: string, enabled?: boolean, condition?: string, hitCondition?: string, logMessage?: string): FunctionBreakpoint

Properties
condition?: string

enabled: boolean

functionName: string

hitCondition?: string

id: string

logMessage?: string

GlobalEnvironmentVariableCollection
A collection of mutations that an extension can apply to a process environment. Applies to all scopes.

Properties
description: string | MarkdownString

persistent: boolean

Methods
append(variable: string, value: string, options?: EnvironmentVariableMutatorOptions): void

clear(): void

delete(variable: string): void

forEach(callback: (variable: string, mutator: EnvironmentVariableMutator, collection: EnvironmentVariableCollection) => any, thisArg?: any): void

get(variable: string): EnvironmentVariableMutator

getScoped(scope: EnvironmentVariableScope): EnvironmentVariableCollection

prepend(variable: string, value: string, options?: EnvironmentVariableMutatorOptions): void

replace(variable: string, value: string, options?: EnvironmentVariableMutatorOptions): void

GlobPattern
A file glob pattern to match file paths against. This can either be a glob pattern string (like **/*.{ts,js} or *.{ts,js}) or a relative pattern.

Glob patterns can have the following syntax:

* to match zero or more characters in a path segment
? to match on one character in a path segment
** to match any number of path segments, including none
{} to group conditions (e.g. **/*.{ts,js} matches all TypeScript and JavaScript files)
[] to declare a range of characters to match in a path segment (e.g., example.[0-9] to match on example.0, example.1, …)
[!...] to negate a range of characters to match in a path segment (e.g., example.[!0-9] to match on example.a, example.b, but not example.0)
Note: a backslash (``) is not valid within a glob pattern. If you have an existing file path to match against, consider to use the relative pattern support that takes care of converting any backslash into slash. Otherwise, make sure to convert any backslash to slash when creating the glob pattern.

GlobPattern: string | RelativePattern

Hover
A hover represents additional information for a symbol or word. Hovers are rendered in a tooltip-like widget.

Constructors
new Hover(contents: MarkdownString | MarkedString | Array<MarkdownString | MarkedString>, range?: Range): Hover

Properties
contents: Array<MarkdownString | MarkedString>

range?: Range

HoverProvider
The hover provider interface defines the contract between extensions and the hover-feature.

Methods
provideHover(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover>

IconPath
Represents an icon in the UI. This is either an uri, separate uris for the light- and dark-themes, or a theme icon.

IconPath: Uri | {dark: Uri, light: Uri} | ThemeIcon

ImplementationProvider
The implementation provider interface defines the contract between extensions and the go to implementation feature.

Methods
provideImplementation(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition | LocationLink[]>

IndentAction
Describes what to do with the indentation when pressing Enter.

Enumeration Members
None: 0

Indent: 1

IndentOutdent: 2

Outdent: 3

IndentationRule
Describes indentation rules for a language.

Properties
decreaseIndentPattern: RegExp

increaseIndentPattern: RegExp

indentNextLinePattern?: RegExp

unIndentedLinePattern?: RegExp

InlayHint
Inlay hint information.

Constructors
new InlayHint(position: Position, label: string | InlayHintLabelPart[], kind?: InlayHintKind): InlayHint

Properties
kind?: InlayHintKind

label: string | InlayHintLabelPart[]

paddingLeft?: boolean

paddingRight?: boolean

position: Position

textEdits?: TextEdit[]

tooltip?: string | MarkdownString

InlayHintKind
Inlay hint kinds.

The kind of an inline hint defines its appearance, e.g the corresponding foreground and background colors are being used.

Enumeration Members
Type: 1

Parameter: 2

InlayHintLabelPart
An inlay hint label part allows for interactive and composite labels of inlay hints.

Constructors
new InlayHintLabelPart(value: string): InlayHintLabelPart

Properties
command?: Command

location?: Location

tooltip?: string | MarkdownString

value: string

InlayHintsProvider<T>
The inlay hints provider interface defines the contract between extensions and the inlay hints feature.

Events
onDidChangeInlayHints?: Event<void>

Methods
provideInlayHints(document: TextDocument, range: Range, token: CancellationToken): ProviderResult<T[]>

resolveInlayHint(hint: T, token: CancellationToken): ProviderResult<T>

InlineCompletionContext
Provides information about the context in which an inline completion was requested.

Properties
selectedCompletionInfo: SelectedCompletionInfo

triggerKind: InlineCompletionTriggerKind

InlineCompletionItem
An inline completion item represents a text snippet that is proposed inline to complete text that is being typed.

See also InlineCompletionItemProvider.provideInlineCompletionItems

Constructors
new InlineCompletionItem(insertText: string | SnippetString, range?: Range, command?: Command): InlineCompletionItem

Properties
command?: Command

filterText?: string

insertText: string | SnippetString

range?: Range

InlineCompletionItemProvider
The inline completion item provider interface defines the contract between extensions and the inline completion feature.

Providers are asked for completions either explicitly by a user gesture or implicitly when typing.

Methods
provideInlineCompletionItems(document: TextDocument, position: Position, context: InlineCompletionContext, token: CancellationToken): ProviderResult<InlineCompletionList | InlineCompletionItem[]>

InlineCompletionList
Represents a collection of inline completion items to be presented in the editor.

Constructors
new InlineCompletionList(items: InlineCompletionItem[]): InlineCompletionList

Properties
items: InlineCompletionItem[]

InlineCompletionTriggerKind
Describes how an inline completion provider was triggered.

Enumeration Members
Invoke: 0

Automatic: 1

InlineValue
Inline value information can be provided by different means:

directly as a text value (class InlineValueText).
as a name to use for a variable lookup (class InlineValueVariableLookup)
as an evaluatable expression (class InlineValueEvaluatableExpression) The InlineValue types combines all inline value types into one type.
InlineValue: InlineValueText | InlineValueVariableLookup | InlineValueEvaluatableExpression

InlineValueContext
A value-object that contains contextual information when requesting inline values from a InlineValuesProvider.

Properties
frameId: number

stoppedLocation: Range

InlineValueEvaluatableExpression
Provide an inline value through an expression evaluation. If only a range is specified, the expression will be extracted from the underlying document. An optional expression can be used to override the extracted expression.

Constructors
new InlineValueEvaluatableExpression(range: Range, expression?: string): InlineValueEvaluatableExpression

Properties
expression?: string

range: Range

InlineValuesProvider
The inline values provider interface defines the contract between extensions and the editor's debugger inline values feature. In this contract the provider returns inline value information for a given document range and the editor shows this information in the editor at the end of lines.

Events
onDidChangeInlineValues?: Event<void>

Methods
provideInlineValues(document: TextDocument, viewPort: Range, context: InlineValueContext, token: CancellationToken): ProviderResult<InlineValue[]>

InlineValueText
Provide inline value as text.

Constructors
new InlineValueText(range: Range, text: string): InlineValueText

Properties
range: Range

text: string

InlineValueVariableLookup
Provide inline value through a variable lookup. If only a range is specified, the variable name will be extracted from the underlying document. An optional variable name can be used to override the extracted name.

Constructors
new InlineValueVariableLookup(range: Range, variableName?: string, caseSensitiveLookup?: boolean): InlineValueVariableLookup

Properties
caseSensitiveLookup: boolean

range: Range

variableName?: string

InputBox
A concrete QuickInput to let the user input a text value.

Note that in many cases the more convenient window.showInputBox is easier to use. window.createInputBox should be used when window.showInputBox does not offer the required flexibility.

Events
onDidAccept: Event<void>

onDidChangeValue: Event<string>

onDidHide: Event<void>

onDidTriggerButton: Event<QuickInputButton>

Properties
busy: boolean

buttons: readonly QuickInputButton[]

enabled: boolean

ignoreFocusOut: boolean

password: boolean

placeholder: string

prompt: string

step: number

title: string

totalSteps: number

validationMessage: string | InputBoxValidationMessage

value: string

valueSelection: readonly [number, number]

Methods
dispose(): void

hide(): void

show(): void

InputBoxOptions
Options to configure the behavior of the input box UI.

Properties
ignoreFocusOut?: boolean

password?: boolean

placeHolder?: string

prompt?: string

title?: string

value?: string

valueSelection?: [number, number]

Methods
validateInput(value: string): string | InputBoxValidationMessage | Thenable<string | InputBoxValidationMessage>

InputBoxValidationMessage
Object to configure the behavior of the validation message.

Properties
message: string

severity: InputBoxValidationSeverity

InputBoxValidationSeverity
The severity level for input box validation.

Enumeration Members
Info: 1

Warning: 2

Error: 3

LanguageConfiguration
The language configuration interfaces defines the contract between extensions and various editor features, like automatic bracket insertion, automatic indentation etc.

Properties
__characterPairSupport?: {autoClosingPairs: Array<{close: string, notIn: string[], open: string}>}

__electricCharacterSupport?: {brackets: any, docComment: {close: string, lineStart: string, open: string, scope: string}}

autoClosingPairs?: AutoClosingPair[]

brackets?: CharacterPair[]

comments?: CommentRule

indentationRules?: IndentationRule

onEnterRules?: OnEnterRule[]

wordPattern?: RegExp

LanguageModelAccessInformation
Represents extension specific information about the access to language models.

Events
onDidChange: Event<void>

Methods
canSendRequest(chat: LanguageModelChat): boolean

LanguageModelChat
Represents a language model for making chat requests.

See also lm.selectChatModels

Properties
family: string

id: string

maxInputTokens: number

name: string

vendor: string

version: string

Methods
countTokens(text: string | LanguageModelChatMessage, token?: CancellationToken): Thenable<number>

sendRequest(messages: LanguageModelChatMessage[], options?: LanguageModelChatRequestOptions, token?: CancellationToken): Thenable<LanguageModelChatResponse>

LanguageModelChatCapabilities
Various features that the LanguageModelChatInformation supports such as tool calling or image input.

Properties
imageInput?: boolean

toolCalling?: number | boolean

LanguageModelChatInformation
Represents a language model provided by a LanguageModelChatProvider.

Properties
capabilities: LanguageModelChatCapabilities

detail?: string

family: string

id: string

maxInputTokens: number

maxOutputTokens: number

name: string

tooltip?: string

version: string

LanguageModelChatMessage
Represents a message in a chat. Can assume different roles, like user or assistant.

Static
Assistant(content: string | Array<LanguageModelTextPart | LanguageModelToolCallPart>, name?: string): LanguageModelChatMessage

User(content: string | Array<LanguageModelTextPart | LanguageModelToolResultPart>, name?: string): LanguageModelChatMessage

Constructors
new LanguageModelChatMessage(role: LanguageModelChatMessageRole, content: string | LanguageModelInputPart[], name?: string): LanguageModelChatMessage

Properties
content: LanguageModelInputPart[]

name: string

role: LanguageModelChatMessageRole

LanguageModelChatMessageRole
Represents the role of a chat message. This is either the user or the assistant.

Enumeration Members
User: 1

Assistant: 2

LanguageModelChatProvider<T>
A LanguageModelChatProvider implements access to language models, which users can then use through the chat view, or through extension API by acquiring a LanguageModelChat. An example of this would be an OpenAI provider that provides models like gpt-5, o3, etc.

Events
onDidChangeLanguageModelChatInformation?: Event<void>

Methods
provideLanguageModelChatInformation(options: PrepareLanguageModelChatModelOptions, token: CancellationToken): ProviderResult<T[]>

provideLanguageModelChatResponse(model: T, messages: readonly LanguageModelChatRequestMessage[], options: ProvideLanguageModelChatResponseOptions, progress: Progress<LanguageModelResponsePart>, token: CancellationToken): Thenable<void>

provideTokenCount(model: T, text: string | LanguageModelChatRequestMessage, token: CancellationToken): Thenable<number>

LanguageModelChatRequestMessage
The provider version of LanguageModelChatMessage.

Properties
content: readonly unknown[]

name: string

role: LanguageModelChatMessageRole

LanguageModelChatRequestOptions
Options for making a chat request using a language model.

See also LanguageModelChat.sendRequest

Properties
justification?: string

modelOptions?:

toolMode?: LanguageModelChatToolMode

tools?: LanguageModelChatTool[]

LanguageModelChatResponse
Represents a language model response.

See also ChatRequest

Properties
stream: AsyncIterable<unknown>

text: AsyncIterable<string>

LanguageModelChatSelector
Describes how to select language models for chat requests.

See also lm.selectChatModels

Properties
family?: string

id?: string

vendor?: string

version?: string

LanguageModelChatTool
A tool that is available to the language model via LanguageModelChatRequestOptions. A language model uses all the properties of this interface to decide which tool to call, and how to call it.

Properties
description: string

inputSchema?: object

name: string

LanguageModelChatToolMode
A tool-calling mode for the language model to use.

Enumeration Members
Auto: 1

Required: 2

LanguageModelError
An error type for language model specific errors.

Consumers of language models should check the code property to determine specific failure causes, like if(someError.code === vscode.LanguageModelError.NotFound.name) {...} for the case of referring to an unknown language model. For unspecified errors the cause-property will contain the actual error.

Static
Blocked(message?: string): LanguageModelError

NoPermissions(message?: string): LanguageModelError

NotFound(message?: string): LanguageModelError

Constructors
new LanguageModelError(message?: string): LanguageModelError

Properties
code: string

LanguageModelInputPart
The various message types which can be sent via LanguageModelChat.sendRequest and processed by a LanguageModelChatProvider

LanguageModelInputPart: LanguageModelTextPart | LanguageModelToolResultPart | LanguageModelToolCallPart

LanguageModelPromptTsxPart
A language model response part containing a PromptElementJSON from vscode/prompt-tsx.

See also LanguageModelToolResult

Constructors
new LanguageModelPromptTsxPart(value: unknown): LanguageModelPromptTsxPart

Properties
value: unknown

LanguageModelResponsePart
The various message types which a LanguageModelChatProvider can emit in the chat response stream

LanguageModelResponsePart: LanguageModelTextPart | LanguageModelToolResultPart | LanguageModelToolCallPart

LanguageModelTextPart
A language model response part containing a piece of text, returned from a LanguageModelChatResponse.

Constructors
new LanguageModelTextPart(value: string): LanguageModelTextPart

Properties
value: string

LanguageModelTool<T>
A tool that can be invoked by a call to a LanguageModelChat.

Methods
invoke(options: LanguageModelToolInvocationOptions<T>, token: CancellationToken): ProviderResult<LanguageModelToolResult>

prepareInvocation(options: LanguageModelToolInvocationPrepareOptions<T>, token: CancellationToken): ProviderResult<PreparedToolInvocation>

LanguageModelToolCallPart
A language model response part indicating a tool call, returned from a LanguageModelChatResponse, and also can be included as a content part on a LanguageModelChatMessage, to represent a previous tool call in a chat request.

Constructors
new LanguageModelToolCallPart(callId: string, name: string, input: object): LanguageModelToolCallPart

Properties
callId: string

input: object

name: string

LanguageModelToolConfirmationMessages
When this is returned in PreparedToolInvocation, the user will be asked to confirm before running the tool. These messages will be shown with buttons that say "Continue" and "Cancel".

Properties
message: string | MarkdownString

title: string

LanguageModelToolInformation
Information about a registered tool available in lm.tools.

Properties
description: string

inputSchema: object

name: string

tags: readonly string[]

LanguageModelToolInvocationOptions<T>
Options provided for tool invocation.

Properties
input: T

tokenizationOptions?: LanguageModelToolTokenizationOptions

toolInvocationToken: undefined

LanguageModelToolInvocationPrepareOptions<T>
Options for LanguageModelTool.prepareInvocation.

Properties
input: T

LanguageModelToolResult
A result returned from a tool invocation. If using vscode/prompt-tsx, this result may be rendered using a ToolResult.

Constructors
new LanguageModelToolResult(content: Array<LanguageModelTextPart | LanguageModelPromptTsxPart>): LanguageModelToolResult

Properties
content: unknown[]

LanguageModelToolResultPart
The result of a tool call. This is the counterpart of a tool call and it can only be included in the content of a User message

Constructors
new LanguageModelToolResultPart(callId: string, content: unknown[]): LanguageModelToolResultPart

Properties
callId: string

content: unknown[]

LanguageModelToolTokenizationOptions
Options related to tokenization for a tool invocation.

Properties
tokenBudget: number

Methods
countTokens(text: string, token?: CancellationToken): Thenable<number>

LanguageStatusItem
A language status item is the preferred way to present language status reports for the active text editors, such as selected linter or notifying about a configuration problem.

Properties
accessibilityInformation?: AccessibilityInformation

busy: boolean

command: Command

detail?: string

id: string

name: string

selector: DocumentSelector

severity: LanguageStatusSeverity

text: string

Methods
dispose(): void

LanguageStatusSeverity
Represents the severity level of a language status.

Enumeration Members
Information: 0

Warning: 1

Error: 2

LinkedEditingRangeProvider
The linked editing range provider interface defines the contract between extensions and the linked editing feature.

Methods
provideLinkedEditingRanges(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<LinkedEditingRanges>

LinkedEditingRanges
Represents a list of ranges that can be edited together along with a word pattern to describe valid range contents.

Constructors
new LinkedEditingRanges(ranges: Range[], wordPattern?: RegExp): LinkedEditingRanges

Properties
ranges: Range[]

wordPattern: RegExp

Location
Represents a location inside a resource, such as a line inside a text file.

Constructors
new Location(uri: Uri, rangeOrPosition: Range | Position): Location

Properties
range: Range

uri: Uri

LocationLink
Represents the connection of two locations. Provides additional metadata over normal locations, including an origin range.

Properties
originSelectionRange?: Range

targetRange: Range

targetSelectionRange?: Range

targetUri: Uri

LogLevel
Log levels

Enumeration Members
Off: 0

Trace: 1

Debug: 2

Info: 3

Warning: 4

Error: 5

LogOutputChannel
A channel for containing log output.

To get an instance of a LogOutputChannel use createOutputChannel.

Events
onDidChangeLogLevel: Event<LogLevel>

Properties
logLevel: LogLevel

name: string

Methods
append(value: string): void

appendLine(value: string): void

clear(): void

debug(message: string, ...args: any[]): void

dispose(): void

error(error: string | Error, ...args: any[]): void

hide(): void

info(message: string, ...args: any[]): void

replace(value: string): void

show(preserveFocus?: boolean): void

show(column?: ViewColumn, preserveFocus?: boolean): void

trace(message: string, ...args: any[]): void

warn(message: string, ...args: any[]): void

MarkdownString
Human-readable text that supports formatting via the markdown syntax.

Rendering of theme icons via the $(<name>)-syntax is supported when the supportThemeIcons is set to true.

Rendering of embedded html is supported when supportHtml is set to true.

Constructors
new MarkdownString(value?: string, supportThemeIcons?: boolean): MarkdownString

Properties
baseUri?: Uri

isTrusted?: boolean | {enabledCommands: readonly string[]}

supportHtml?: boolean

supportThemeIcons?: boolean

value: string

Methods
appendCodeblock(value: string, language?: string): MarkdownString

appendMarkdown(value: string): MarkdownString

appendText(value: string): MarkdownString

MarkedString
MarkedString can be used to render human-readable text. It is either a markdown string or a code-block that provides a language and a code snippet. Note that markdown strings will be sanitized - that means html will be escaped.

deprecated - This type is deprecated, please use MarkdownString instead.
MarkedString: string | {language: string, value: string}

McpHttpServerDefinition
McpHttpServerDefinition represents an MCP server available using the Streamable HTTP transport.

Constructors
new McpHttpServerDefinition(label: string, uri: Uri, headers?: Record<string, string>, version?: string): McpHttpServerDefinition

Properties
headers: Record<string, string>

label: string

uri: Uri

version?: string

McpServerDefinition
Definitions that describe different types of Model Context Protocol servers, which can be returned from the McpServerDefinitionProvider.

McpServerDefinition: McpStdioServerDefinition | McpHttpServerDefinition

McpServerDefinitionProvider<T>
A type that can provide Model Context Protocol server definitions. This should be registered using lm.registerMcpServerDefinitionProvider during extension activation.

Events
onDidChangeMcpServerDefinitions?: Event<void>

Methods
provideMcpServerDefinitions(token: CancellationToken): ProviderResult<T[]>

resolveMcpServerDefinition(server: T, token: CancellationToken): ProviderResult<T>

McpStdioServerDefinition
McpStdioServerDefinition represents an MCP server available by running a local process and operating on its stdin and stdout streams. The process will be spawned as a child process of the extension host and by default will not run in a shell environment.

Constructors
new McpStdioServerDefinition(label: string, command: string, args?: string[], env?: Record<string, string | number>, version?: string): McpStdioServerDefinition

Properties
args: string[]

command: string

cwd?: Uri

env: Record<string, string | number>

label: string

version?: string

Memento
A memento represents a storage utility. It can store and retrieve values.

Methods
get<T>(key: string): T

get<T>(key: string, defaultValue: T): T

keys(): readonly string[]

update(key: string, value: any): Thenable<void>

MessageItem
Represents an action that is shown with an information, warning, or error message.

See also

showInformationMessage
showWarningMessage
showErrorMessage
Properties
isCloseAffordance?: boolean

title: string

MessageOptions
Options to configure the behavior of the message.

See also

showInformationMessage
showWarningMessage
showErrorMessage
Properties
detail?: string

modal?: boolean

NotebookCell
Represents a cell of a notebook, either a code-cell or markup-cell.

NotebookCell instances are immutable and are kept in sync for as long as they are part of their notebook.

Properties
document: TextDocument

executionSummary: NotebookCellExecutionSummary

index: number

kind: NotebookCellKind

metadata:

notebook: NotebookDocument

outputs: readonly NotebookCellOutput[]

NotebookCellData
NotebookCellData is the raw representation of notebook cells. Its is part of NotebookData.

Constructors
new NotebookCellData(kind: NotebookCellKind, value: string, languageId: string): NotebookCellData

Properties
executionSummary?: NotebookCellExecutionSummary

kind: NotebookCellKind

languageId: string

metadata?:

outputs?: NotebookCellOutput[]

value: string

NotebookCellExecution
A NotebookCellExecution is how notebook controller modify a notebook cell as it is executing.

When a cell execution object is created, the cell enters the [NotebookCellExecutionState.Pending Pending](#NotebookCellExecutionState.Pending Pending) state. When start(...) is called on the execution task, it enters the [NotebookCellExecutionState.Executing Executing](#NotebookCellExecutionState.Executing Executing) state. When end(...) is called, it enters the [NotebookCellExecutionState.Idle Idle](#NotebookCellExecutionState.Idle Idle) state.

Properties
cell: NotebookCell

executionOrder: number

token: CancellationToken

Methods
appendOutput(out: NotebookCellOutput | readonly NotebookCellOutput[], cell?: NotebookCell): Thenable<void>

appendOutputItems(items: NotebookCellOutputItem | readonly NotebookCellOutputItem[], output: NotebookCellOutput): Thenable<void>

clearOutput(cell?: NotebookCell): Thenable<void>

end(success: boolean, endTime?: number): void

replaceOutput(out: NotebookCellOutput | readonly NotebookCellOutput[], cell?: NotebookCell): Thenable<void>

replaceOutputItems(items: NotebookCellOutputItem | readonly NotebookCellOutputItem[], output: NotebookCellOutput): Thenable<void>

start(startTime?: number): void

NotebookCellExecutionSummary
The summary of a notebook cell execution.

Properties
executionOrder?: number

success?: boolean

timing?: {endTime: number, startTime: number}

NotebookCellKind
A notebook cell kind.

Enumeration Members
Markup: 1

Code: 2

NotebookCellOutput
Notebook cell output represents a result of executing a cell. It is a container type for multiple output items where contained items represent the same result but use different MIME types.

Constructors
new NotebookCellOutput(items: NotebookCellOutputItem[], metadata?: ): NotebookCellOutput

Properties
items: NotebookCellOutputItem[]

metadata?:

NotebookCellOutputItem
One representation of a notebook output, defined by MIME type and data.

Static
error(value: Error): NotebookCellOutputItem

json(value: any, mime?: string): NotebookCellOutputItem

stderr(value: string): NotebookCellOutputItem

stdout(value: string): NotebookCellOutputItem

text(value: string, mime?: string): NotebookCellOutputItem

Constructors
new NotebookCellOutputItem(data: Uint8Array, mime: string): NotebookCellOutputItem

Properties
data: Uint8Array

mime: string

NotebookCellStatusBarAlignment
Represents the alignment of status bar items.

Enumeration Members
Left: 1

Right: 2

NotebookCellStatusBarItem
A contribution to a cell's status bar

Constructors
new NotebookCellStatusBarItem(text: string, alignment: NotebookCellStatusBarAlignment): NotebookCellStatusBarItem

Properties
accessibilityInformation?: AccessibilityInformation

alignment: NotebookCellStatusBarAlignment

command?: string | Command

priority?: number

text: string

tooltip?: string

NotebookCellStatusBarItemProvider
A provider that can contribute items to the status bar that appears below a cell's editor.

Events
onDidChangeCellStatusBarItems?: Event<void>

Methods
provideCellStatusBarItems(cell: NotebookCell, token: CancellationToken): ProviderResult<NotebookCellStatusBarItem | NotebookCellStatusBarItem[]>

NotebookController
A notebook controller represents an entity that can execute notebook cells. This is often referred to as a kernel.

There can be multiple controllers and the editor will let users choose which controller to use for a certain notebook. The notebookType-property defines for what kind of notebooks a controller is for and the updateNotebookAffinity-function allows controllers to set a preference for specific notebook documents. When a controller has been selected its onDidChangeSelectedNotebooks-event fires.

When a cell is being run the editor will invoke the executeHandler and a controller is expected to create and finalize a notebook cell execution. However, controllers are also free to create executions by themselves.

Events
onDidChangeSelectedNotebooks: Event<{notebook: NotebookDocument, selected: boolean}>

Properties
description?: string

detail?: string

executeHandler: (cells: NotebookCell[], notebook: NotebookDocument, controller: NotebookController) => void | Thenable<void>

id: string

interruptHandler?: (notebook: NotebookDocument) => void | Thenable<void>

label: string

notebookType: string

supportedLanguages?: string[]

supportsExecutionOrder?: boolean

Methods
createNotebookCellExecution(cell: NotebookCell): NotebookCellExecution

dispose(): void

updateNotebookAffinity(notebook: NotebookDocument, affinity: NotebookControllerAffinity): void

NotebookControllerAffinity
Notebook controller affinity for notebook documents.

See also NotebookController.updateNotebookAffinity

Enumeration Members
Default: 1

Preferred: 2

NotebookData
Raw representation of a notebook.

Extensions are responsible for creating NotebookData so that the editor can create a NotebookDocument.

See also NotebookSerializer

Constructors
new NotebookData(cells: NotebookCellData[]): NotebookData

Properties
cells: NotebookCellData[]

metadata?:

NotebookDocument
Represents a notebook which itself is a sequence of code or markup cells. Notebook documents are created from notebook data.

Properties
cellCount: number

isClosed: boolean

isDirty: boolean

isUntitled: boolean

metadata:

notebookType: string

uri: Uri

version: number

Methods
cellAt(index: number): NotebookCell

getCells(range?: NotebookRange): NotebookCell[]

save(): Thenable<boolean>

NotebookDocumentCellChange
Describes a change to a notebook cell.

See also NotebookDocumentChangeEvent

Properties
cell: NotebookCell

document: TextDocument

executionSummary: NotebookCellExecutionSummary

metadata:

outputs: readonly NotebookCellOutput[]

NotebookDocumentChangeEvent
An event describing a transactional notebook change.

Properties
cellChanges: readonly NotebookDocumentCellChange[]

contentChanges: readonly NotebookDocumentContentChange[]

metadata:

notebook: NotebookDocument

NotebookDocumentContentChange
Describes a structural change to a notebook document, e.g newly added and removed cells.

See also NotebookDocumentChangeEvent

Properties
addedCells: readonly NotebookCell[]

range: NotebookRange

removedCells: readonly NotebookCell[]

NotebookDocumentContentOptions
Notebook content options define what parts of a notebook are persisted. Note

For instance, a notebook serializer can opt-out of saving outputs and in that case the editor doesn't mark a notebooks as dirty when its output has changed.

Properties
transientCellMetadata?:

transientDocumentMetadata?:

transientOutputs?: boolean

NotebookDocumentShowOptions
Represents options to configure the behavior of showing a notebook document in an notebook editor.

Properties
preserveFocus?: boolean

preview?: boolean

selections?: readonly NotebookRange[]

viewColumn?: ViewColumn

NotebookDocumentWillSaveEvent
An event that is fired when a notebook document will be saved.

To make modifications to the document before it is being saved, call the waitUntil-function with a thenable that resolves to a workspace edit.

Properties
notebook: NotebookDocument

reason: TextDocumentSaveReason

token: CancellationToken

Methods
waitUntil(thenable: Thenable<WorkspaceEdit>): void

waitUntil(thenable: Thenable<any>): void

NotebookEdit
A notebook edit represents edits that should be applied to the contents of a notebook.

Static
deleteCells(range: NotebookRange): NotebookEdit

insertCells(index: number, newCells: NotebookCellData[]): NotebookEdit

replaceCells(range: NotebookRange, newCells: NotebookCellData[]): NotebookEdit

updateCellMetadata(index: number, newCellMetadata: ): NotebookEdit

updateNotebookMetadata(newNotebookMetadata: ): NotebookEdit

Constructors
new NotebookEdit(range: NotebookRange, newCells: NotebookCellData[]): NotebookEdit

Properties
newCellMetadata?:

newCells: NotebookCellData[]

newNotebookMetadata?:

range: NotebookRange

NotebookEditor
Represents a notebook editor that is attached to a notebook. Additional properties of the NotebookEditor are available in the proposed API, which will be finalized later.

Properties
notebook: NotebookDocument

selection: NotebookRange

selections: readonly NotebookRange[]

viewColumn?: ViewColumn

visibleRanges: readonly NotebookRange[]

Methods
revealRange(range: NotebookRange, revealType?: NotebookEditorRevealType): void

NotebookEditorRevealType
Represents a notebook editor that is attached to a notebook.

Enumeration Members
Default: 0

InCenter: 1

InCenterIfOutsideViewport: 2

AtTop: 3

NotebookEditorSelectionChangeEvent
Represents an event describing the change in a notebook editor's selections.

Properties
notebookEditor: NotebookEditor

selections: readonly NotebookRange[]

NotebookEditorVisibleRangesChangeEvent
Represents an event describing the change in a notebook editor's visibleRanges.

Properties
notebookEditor: NotebookEditor

visibleRanges: readonly NotebookRange[]

NotebookRange
A notebook range represents an ordered pair of two cell indices. It is guaranteed that start is less than or equal to end.

Constructors
new NotebookRange(start: number, end: number): NotebookRange

Properties
end: number

isEmpty: boolean

start: number

Methods
with(change: {end: number, start: number}): NotebookRange

NotebookRendererMessaging
Renderer messaging is used to communicate with a single renderer. It's returned from notebooks.createRendererMessaging.

Events
onDidReceiveMessage: Event<{editor: NotebookEditor, message: any}>

Methods
postMessage(message: any, editor?: NotebookEditor): Thenable<boolean>

NotebookSerializer
The notebook serializer enables the editor to open notebook files.

At its core the editor only knows a notebook data structure but not how that data structure is written to a file, nor how it is read from a file. The notebook serializer bridges this gap by deserializing bytes into notebook data and vice versa.

Methods
deserializeNotebook(content: Uint8Array, token: CancellationToken): NotebookData | Thenable<NotebookData>

serializeNotebook(data: NotebookData, token: CancellationToken): Uint8Array | Thenable<Uint8Array>

OnEnterRule
Describes a rule to be evaluated when pressing Enter.

Properties
action: EnterAction

afterText?: RegExp

beforeText: RegExp

previousLineText?: RegExp

OnTypeFormattingEditProvider
The document formatting provider interface defines the contract between extensions and the formatting-feature.

Methods
provideOnTypeFormattingEdits(document: TextDocument, position: Position, ch: string, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]>

OpenDialogOptions
Options to configure the behaviour of a file open dialog.

Note 1: On Windows and Linux, a file dialog cannot be both a file selector and a folder selector, so if you set both canSelectFiles and canSelectFolders to true on these platforms, a folder selector will be shown.
Note 2: Explicitly setting canSelectFiles and canSelectFolders to false is futile and the editor then silently adjusts the options to select files.
Properties
canSelectFiles?: boolean

canSelectFolders?: boolean

canSelectMany?: boolean

defaultUri?: Uri

filters?:

openLabel?: string

title?: string

OutputChannel
An output channel is a container for readonly textual information.

To get an instance of an OutputChannel use createOutputChannel.

Properties
name: string

Methods
append(value: string): void

appendLine(value: string): void

clear(): void

dispose(): void

hide(): void

replace(value: string): void

show(preserveFocus?: boolean): void

show(column?: ViewColumn, preserveFocus?: boolean): void

OverviewRulerLane
Represents different positions for rendering a decoration in an overview ruler. The overview ruler supports three lanes.

Enumeration Members
Left: 1

Center: 2

Right: 4

Full: 7

ParameterInformation
Represents a parameter of a callable-signature. A parameter can have a label and a doc-comment.

Constructors
new ParameterInformation(label: string | [number, number], documentation?: string | MarkdownString): ParameterInformation

Properties
documentation?: string | MarkdownString

label: string | [number, number]

Position
Represents a line and character position, such as the position of the cursor.

Position objects are immutable. Use the with or translate methods to derive new positions from an existing position.

Constructors
new Position(line: number, character: number): Position

Properties
character: number

line: number

Methods
compareTo(other: Position): number

isAfter(other: Position): boolean

isAfterOrEqual(other: Position): boolean

isBefore(other: Position): boolean

isBeforeOrEqual(other: Position): boolean

isEqual(other: Position): boolean

translate(lineDelta?: number, characterDelta?: number): Position

translate(change: {characterDelta: number, lineDelta: number}): Position

with(line?: number, character?: number): Position

with(change: {character: number, line: number}): Position

PreparedToolInvocation
The result of a call to LanguageModelTool.prepareInvocation.

Properties
confirmationMessages?: LanguageModelToolConfirmationMessages

invocationMessage?: string | MarkdownString

PrepareLanguageModelChatModelOptions
The list of options passed into LanguageModelChatProvider.provideLanguageModelChatInformation

Properties
silent: boolean

ProcessExecution
The execution of a task happens as an external process without shell interaction.

Constructors
new ProcessExecution(process: string, options?: ProcessExecutionOptions): ProcessExecution

new ProcessExecution(process: string, args: string[], options?: ProcessExecutionOptions): ProcessExecution

Properties
args: string[]

options?: ProcessExecutionOptions

process: string

ProcessExecutionOptions
Options for a process execution

Properties
cwd?: string

env?:

Progress<T>
Defines a generalized way of reporting progress updates.

Methods
report(value: T): void

ProgressLocation
A location in the editor at which progress information can be shown. It depends on the location how progress is visually represented.

Enumeration Members
SourceControl: 1

Window: 10

Notification: 15

ProgressOptions
Value-object describing where and how progress should show.

Properties
cancellable?: boolean

location: ProgressLocation | {viewId: string}

title?: string

ProvideLanguageModelChatResponseOptions
The provider version of LanguageModelChatRequestOptions

Properties
modelOptions?:

toolMode: LanguageModelChatToolMode

tools?: readonly LanguageModelChatTool[]

ProviderResult<T>
A provider result represents the values a provider, like the HoverProvider, may return. For once this is the actual result type T, like Hover, or a thenable that resolves to that type T. In addition, null and undefined can be returned - either directly or from a thenable.

The snippets below are all valid implementations of the HoverProvider:

TypeScript

let a: HoverProvider = {
  provideHover(doc, pos, token): ProviderResult<Hover> {
    return new Hover('Hello World');
  }
};

let b: HoverProvider = {
  provideHover(doc, pos, token): ProviderResult<Hover> {
    return new Promise(resolve => {
      resolve(new Hover('Hello World'));
    });
  }
};

let c: HoverProvider = {
  provideHover(doc, pos, token): ProviderResult<Hover> {
    return; // undefined
  }
};
ProviderResult: T | undefined | null | Thenable<T | undefined | null>

Pseudoterminal
Defines the interface of a terminal pty, enabling extensions to control a terminal.

Events
onDidChangeName?: Event<string>

onDidClose?: Event<number | void>

onDidOverrideDimensions?: Event<TerminalDimensions>

onDidWrite: Event<string>

Methods
close(): void

handleInput(data: string): void

open(initialDimensions: TerminalDimensions): void

setDimensions(dimensions: TerminalDimensions): void

QuickDiffProvider
A quick diff provider provides a uri to the original state of a modified resource. The editor will use this information to render ad'hoc diffs within the text.

Methods
provideOriginalResource(uri: Uri, token: CancellationToken): ProviderResult<Uri>

QuickInput
A light-weight user input UI that is initially not visible. After configuring it through its properties the extension can make it visible by calling QuickInput.show.

There are several reasons why this UI might have to be hidden and the extension will be notified through QuickInput.onDidHide. (Examples include: an explicit call to QuickInput.hide, the user pressing Esc, some other input UI opening, etc.)

A user pressing Enter or some other gesture implying acceptance of the current state does not automatically hide this UI component. It is up to the extension to decide whether to accept the user's input and if the UI should indeed be hidden through a call to QuickInput.hide.

When the extension no longer needs this input UI, it should QuickInput.dispose it to allow for freeing up any resources associated with it.

See QuickPick and InputBox for concrete UIs.

Events
onDidHide: Event<void>

Properties
busy: boolean

enabled: boolean

ignoreFocusOut: boolean

step: number

title: string

totalSteps: number

Methods
dispose(): void

hide(): void

show(): void

QuickInputButton
Button for an action in a QuickPick or InputBox.

Properties
iconPath: IconPath

tooltip?: string

QuickInputButtons
Predefined buttons for QuickPick and InputBox.

Static
Back: QuickInputButton

QuickPick<T>
A concrete QuickInput to let the user pick an item from a list of items of type T. The items can be filtered through a filter text field and there is an option canSelectMany to allow for selecting multiple items.

Note that in many cases the more convenient window.showQuickPick is easier to use. window.createQuickPick should be used when window.showQuickPick does not offer the required flexibility.

Events
onDidAccept: Event<void>

onDidChangeActive: Event<readonly T[]>

onDidChangeSelection: Event<readonly T[]>

onDidChangeValue: Event<string>

onDidHide: Event<void>

onDidTriggerButton: Event<QuickInputButton>

onDidTriggerItemButton: Event<QuickPickItemButtonEvent<T>>

Properties
activeItems: readonly T[]

busy: boolean

buttons: readonly QuickInputButton[]

canSelectMany: boolean

enabled: boolean

ignoreFocusOut: boolean

items: readonly T[]

keepScrollPosition?: boolean

matchOnDescription: boolean

matchOnDetail: boolean

placeholder: string

selectedItems: readonly T[]

step: number

title: string

totalSteps: number

value: string

Methods
dispose(): void

hide(): void

show(): void

QuickPickItem
Represents an item that can be selected from a list of items.

Properties
alwaysShow?: boolean

buttons?: readonly QuickInputButton[]

description?: string

detail?: string

iconPath?: IconPath

kind?: QuickPickItemKind

label: string

picked?: boolean

QuickPickItemButtonEvent<T>
An event signaling when a button in a particular QuickPickItem was triggered. This event does not fire for buttons in the title bar.

Properties
button: QuickInputButton

item: T

QuickPickItemKind
The kind of quick pick item.

Enumeration Members
Separator: -1

Default: 0

QuickPickOptions
Options to configure the behavior of the quick pick UI.

Events
onDidSelectItem(item: string | QuickPickItem): any

Properties
canPickMany?: boolean

ignoreFocusOut?: boolean

matchOnDescription?: boolean

matchOnDetail?: boolean

placeHolder?: string

title?: string

Range
A range represents an ordered pair of two positions. It is guaranteed that start.isBeforeOrEqual(end)

Range objects are immutable. Use the with, intersection, or union methods to derive new ranges from an existing range.

Constructors
new Range(start: Position, end: Position): Range

new Range(startLine: number, startCharacter: number, endLine: number, endCharacter: number): Range

Properties
end: Position

isEmpty: boolean

isSingleLine: boolean

start: Position

Methods
contains(positionOrRange: Range | Position): boolean

intersection(range: Range): Range

isEqual(other: Range): boolean

union(other: Range): Range

with(start?: Position, end?: Position): Range

with(change: {end: Position, start: Position}): Range

ReferenceContext
Value-object that contains additional information when requesting references.

Properties
includeDeclaration: boolean

ReferenceProvider
The reference provider interface defines the contract between extensions and the find references-feature.

Methods
provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): ProviderResult<Location[]>

RelativePattern
A relative pattern is a helper to construct glob patterns that are matched relatively to a base file path. The base path can either be an absolute file path as string or uri or a workspace folder, which is the preferred way of creating the relative pattern.

Constructors
new RelativePattern(base: string | Uri | WorkspaceFolder, pattern: string): RelativePattern

Properties
base: string

baseUri: Uri

pattern: string

RenameProvider
The rename provider interface defines the contract between extensions and the rename-feature.

Methods
prepareRename(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Range | {placeholder: string, range: Range}>

provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken): ProviderResult<WorkspaceEdit>

RunOptions
Run options for a task.

Properties
reevaluateOnRerun?: boolean

SaveDialogOptions
Options to configure the behaviour of a file save dialog.

Properties
defaultUri?: Uri

filters?:

saveLabel?: string

title?: string

SecretStorage
Represents a storage utility for secrets (or any information that is sensitive) that will be stored encrypted. The implementation of the secret storage will be different on each platform and the secrets will not be synced across machines.

Events
onDidChange: Event<SecretStorageChangeEvent>

Methods
delete(key: string): Thenable<void>

get(key: string): Thenable<string>

keys(): Thenable<string[]>

store(key: string, value: string): Thenable<void>

SecretStorageChangeEvent
The event data that is fired when a secret is added or removed.

Properties
key: string

SelectedCompletionInfo
Describes the currently selected completion item.

Properties
range: Range

text: string

Selection
Represents a text selection in an editor.

Constructors
new Selection(anchor: Position, active: Position): Selection

new Selection(anchorLine: number, anchorCharacter: number, activeLine: number, activeCharacter: number): Selection

Properties
active: Position

anchor: Position

end: Position

isEmpty: boolean

isReversed: boolean

isSingleLine: boolean

start: Position

Methods
contains(positionOrRange: Range | Position): boolean

intersection(range: Range): Range

isEqual(other: Range): boolean

union(other: Range): Range

with(start?: Position, end?: Position): Range

with(change: {end: Position, start: Position}): Range

SelectionRange
A selection range represents a part of a selection hierarchy. A selection range may have a parent selection range that contains it.

Constructors
new SelectionRange(range: Range, parent?: SelectionRange): SelectionRange

Properties
parent?: SelectionRange

range: Range

SelectionRangeProvider
The selection range provider interface defines the contract between extensions and the "Expand and Shrink Selection" feature.

Methods
provideSelectionRanges(document: TextDocument, positions: readonly Position[], token: CancellationToken): ProviderResult<SelectionRange[]>

SemanticTokens
Represents semantic tokens, either in a range or in an entire document.

See also

provideDocumentSemanticTokens for an explanation of the format.
SemanticTokensBuilder for a helper to create an instance.
Constructors
new SemanticTokens(data: Uint32Array, resultId?: string): SemanticTokens

Properties
data: Uint32Array

resultId: string

SemanticTokensBuilder
A semantic tokens builder can help with creating a SemanticTokens instance which contains delta encoded semantic tokens.

Constructors
new SemanticTokensBuilder(legend?: SemanticTokensLegend): SemanticTokensBuilder

Methods
build(resultId?: string): SemanticTokens

push(line: number, char: number, length: number, tokenType: number, tokenModifiers?: number): void

push(range: Range, tokenType: string, tokenModifiers?: readonly string[]): void

SemanticTokensEdit
Represents an edit to semantic tokens.

See also provideDocumentSemanticTokensEdits for an explanation of the format.

Constructors
new SemanticTokensEdit(start: number, deleteCount: number, data?: Uint32Array): SemanticTokensEdit

Properties
data: Uint32Array

deleteCount: number

start: number

SemanticTokensEdits
Represents edits to semantic tokens.

See also provideDocumentSemanticTokensEdits for an explanation of the format.

Constructors
new SemanticTokensEdits(edits: SemanticTokensEdit[], resultId?: string): SemanticTokensEdits

Properties
edits: SemanticTokensEdit[]

resultId: string

SemanticTokensLegend
A semantic tokens legend contains the needed information to decipher the integer encoded representation of semantic tokens.

Constructors
new SemanticTokensLegend(tokenTypes: string[], tokenModifiers?: string[]): SemanticTokensLegend

Properties
tokenModifiers: string[]

tokenTypes: string[]

ShellExecution
Represents a task execution that happens inside a shell.

Constructors
new ShellExecution(commandLine: string, options?: ShellExecutionOptions): ShellExecution

new ShellExecution(command: string | ShellQuotedString, args: Array<string | ShellQuotedString>, options?: ShellExecutionOptions): ShellExecution

Properties
args: Array<string | ShellQuotedString>

command: string | ShellQuotedString

commandLine: string

options?: ShellExecutionOptions

ShellExecutionOptions
Options for a shell execution

Properties
cwd?: string

env?:

executable?: string

shellArgs?: string[]

shellQuoting?: ShellQuotingOptions

ShellQuotedString
A string that will be quoted depending on the used shell.

Properties
quoting: ShellQuoting

value: string

ShellQuoting
Defines how an argument should be quoted if it contains spaces or unsupported characters.

Enumeration Members
Escape: 1

Strong: 2

Weak: 3

ShellQuotingOptions
The shell quoting options.

Properties
escape?: string | {charsToEscape: string, escapeChar: string}

strong?: string

weak?: string

SignatureHelp
Signature help represents the signature of something callable. There can be multiple signatures but only one active and only one active parameter.

Constructors
new SignatureHelp(): SignatureHelp

Properties
activeParameter: number

activeSignature: number

signatures: SignatureInformation[]

SignatureHelpContext
Additional information about the context in which a SignatureHelpProvider was triggered.

Properties
activeSignatureHelp: SignatureHelp

isRetrigger: boolean

triggerCharacter: string

triggerKind: SignatureHelpTriggerKind

SignatureHelpProvider
The signature help provider interface defines the contract between extensions and the parameter hints-feature.

Methods
provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken, context: SignatureHelpContext): ProviderResult<SignatureHelp>

SignatureHelpProviderMetadata
Metadata about a registered SignatureHelpProvider.

Properties
retriggerCharacters: readonly string[]

triggerCharacters: readonly string[]

SignatureHelpTriggerKind
How a SignatureHelpProvider was triggered.

Enumeration Members
Invoke: 1

TriggerCharacter: 2

ContentChange: 3

SignatureInformation
Represents the signature of something callable. A signature can have a label, like a function-name, a doc-comment, and a set of parameters.

Constructors
new SignatureInformation(label: string, documentation?: string | MarkdownString): SignatureInformation

Properties
activeParameter?: number

documentation?: string | MarkdownString

label: string

parameters: ParameterInformation[]

SnippetString
A snippet string is a template which allows to insert text and to control the editor cursor when insertion happens.

A snippet can define tab stops and placeholders with $1, $2 and ${3:foo}. $0 defines the final tab stop, it defaults to the end of the snippet. Variables are defined with $name and ${name:default value}. Also see the full snippet syntax.

Constructors
new SnippetString(value?: string): SnippetString

Properties
value: string

Methods
appendChoice(values: readonly string[], number?: number): SnippetString

appendPlaceholder(value: string | (snippet: SnippetString) => any, number?: number): SnippetString

appendTabstop(number?: number): SnippetString

appendText(string: string): SnippetString

appendVariable(name: string, defaultValue: string | (snippet: SnippetString) => any): SnippetString

SnippetTextEdit
A snippet edit represents an interactive edit that is performed by the editor.

Note that a snippet edit can always be performed as a normal text edit. This will happen when no matching editor is open or when a workspace edit contains snippet edits for multiple files. In that case only those that match the active editor will be performed as snippet edits and the others as normal text edits.

Static
insert(position: Position, snippet: SnippetString): SnippetTextEdit

replace(range: Range, snippet: SnippetString): SnippetTextEdit

Constructors
new SnippetTextEdit(range: Range, snippet: SnippetString): SnippetTextEdit

Properties
keepWhitespace?: boolean

range: Range

snippet: SnippetString

SourceBreakpoint
A breakpoint specified by a source location.

Constructors
new SourceBreakpoint(location: Location, enabled?: boolean, condition?: string, hitCondition?: string, logMessage?: string): SourceBreakpoint

Properties
condition?: string

enabled: boolean

hitCondition?: string

id: string

location: Location

logMessage?: string

SourceControl
An source control is able to provide resource states to the editor and interact with the editor in several source control related ways.

Properties
acceptInputCommand?: Command

commitTemplate?: string

count?: number

id: string

inputBox: SourceControlInputBox

label: string

quickDiffProvider?: QuickDiffProvider

rootUri: Uri

statusBarCommands?: Command[]

Methods
createResourceGroup(id: string, label: string): SourceControlResourceGroup

dispose(): void

SourceControlInputBox
Represents the input box in the Source Control viewlet.

Properties
enabled: boolean

placeholder: string

value: string

visible: boolean

SourceControlResourceDecorations
The decorations for a source control resource state. Can be independently specified for light and dark themes.

Properties
dark?: SourceControlResourceThemableDecorations

faded?: boolean

iconPath?: string | Uri | ThemeIcon

light?: SourceControlResourceThemableDecorations

strikeThrough?: boolean

tooltip?: string

SourceControlResourceGroup
A source control resource group is a collection of source control resource states.

Properties
contextValue?: string

hideWhenEmpty?: boolean

id: string

label: string

resourceStates: SourceControlResourceState[]

Methods
dispose(): void

SourceControlResourceState
An source control resource state represents the state of an underlying workspace resource within a certain source control group.

Properties
command?: Command

contextValue?: string

decorations?: SourceControlResourceDecorations

resourceUri: Uri

SourceControlResourceThemableDecorations
The theme-aware decorations for a source control resource state.

Properties
iconPath?: string | Uri | ThemeIcon

StatementCoverage
Contains coverage information for a single statement or line.

Constructors
new StatementCoverage(executed: number | boolean, location: Range | Position, branches?: BranchCoverage[]): StatementCoverage

Properties
branches: BranchCoverage[]

executed: number | boolean

location: Range | Position

StatusBarAlignment
Represents the alignment of status bar items.

Enumeration Members
Left: 1

Right: 2

StatusBarItem
A status bar item is a status bar contribution that can show text and icons and run a command on click.

Properties
accessibilityInformation: AccessibilityInformation

alignment: StatusBarAlignment

backgroundColor: ThemeColor

color: string | ThemeColor

command: string | Command

id: string

name: string

priority: number

text: string

tooltip: string | MarkdownString

Methods
dispose(): void

hide(): void

show(): void

SymbolInformation
Represents information about programming constructs like variables, classes, interfaces etc.

Constructors
new SymbolInformation(name: string, kind: SymbolKind, containerName: string, location: Location): SymbolInformation

new SymbolInformation(name: string, kind: SymbolKind, range: Range, uri?: Uri, containerName?: string): SymbolInformation

Properties
containerName: string

kind: SymbolKind

location: Location

name: string

tags?: readonly SymbolTag[]

SymbolKind
A symbol kind.

Enumeration Members
File: 0

Module: 1

Namespace: 2

Package: 3

Class: 4

Method: 5

Property: 6

Field: 7

Constructor: 8

Enum: 9

Interface: 10

Function: 11

Variable: 12

Constant: 13

String: 14

Number: 15

Boolean: 16

Array: 17

Object: 18

Key: 19

Null: 20

EnumMember: 21

Struct: 22

Event: 23

Operator: 24

TypeParameter: 25

SymbolTag
Symbol tags are extra annotations that tweak the rendering of a symbol.

Enumeration Members
Deprecated: 1

SyntaxTokenType
Enumeration of commonly encountered syntax token types.

Enumeration Members
Other: 0

Comment: 1

String: 2

RegEx: 3

Tab
Represents a tab within a group of tabs. Tabs are merely the graphical representation within the editor area. A backing editor is not a guarantee.

Properties
group: TabGroup

input: unknown

isActive: boolean

isDirty: boolean

isPinned: boolean

isPreview: boolean

label: string

TabChangeEvent
An event describing change to tabs.

Properties
changed: readonly Tab[]

closed: readonly Tab[]

opened: readonly Tab[]

TabGroup
Represents a group of tabs. A tab group itself consists of multiple tabs.

Properties
activeTab: Tab

isActive: boolean

tabs: readonly Tab[]

viewColumn: ViewColumn

TabGroupChangeEvent
An event describing changes to tab groups.

Properties
changed: readonly TabGroup[]

closed: readonly TabGroup[]

opened: readonly TabGroup[]

TabGroups
Represents the main editor area which consists of multiple groups which contain tabs.

Events
onDidChangeTabGroups: Event<TabGroupChangeEvent>

onDidChangeTabs: Event<TabChangeEvent>

Properties
activeTabGroup: TabGroup

all: readonly TabGroup[]

Methods
close(tab: Tab | readonly Tab[], preserveFocus?: boolean): Thenable<boolean>

close(tabGroup: TabGroup | readonly TabGroup[], preserveFocus?: boolean): Thenable<boolean>

TabInputCustom
The tab represents a custom editor.

Constructors
new TabInputCustom(uri: Uri, viewType: string): TabInputCustom

Properties
uri: Uri

viewType: string

TabInputNotebook
The tab represents a notebook.

Constructors
new TabInputNotebook(uri: Uri, notebookType: string): TabInputNotebook

Properties
notebookType: string

uri: Uri

TabInputNotebookDiff
The tabs represents two notebooks in a diff configuration.

Constructors
new TabInputNotebookDiff(original: Uri, modified: Uri, notebookType: string): TabInputNotebookDiff

Properties
modified: Uri

notebookType: string

original: Uri

TabInputTerminal
The tab represents a terminal in the editor area.

Constructors
new TabInputTerminal(): TabInputTerminal

TabInputText
The tab represents a single text based resource.

Constructors
new TabInputText(uri: Uri): TabInputText

Properties
uri: Uri

TabInputTextDiff
The tab represents two text based resources being rendered as a diff.

Constructors
new TabInputTextDiff(original: Uri, modified: Uri): TabInputTextDiff

Properties
modified: Uri

original: Uri

TabInputWebview
The tab represents a webview.

Constructors
new TabInputWebview(viewType: string): TabInputWebview

Properties
viewType: string

Task
A task to execute

Constructors
new Task(taskDefinition: TaskDefinition, scope: WorkspaceFolder | Global | Workspace, name: string, source: string, execution?: ProcessExecution | ShellExecution | CustomExecution, problemMatchers?: string | string[]): Task

new Task(taskDefinition: TaskDefinition, name: string, source: string, execution?: ProcessExecution | ShellExecution, problemMatchers?: string | string[]): Task

Properties
definition: TaskDefinition

detail?: string

execution?: ProcessExecution | ShellExecution | CustomExecution

group?: TaskGroup

isBackground: boolean

name: string

presentationOptions: TaskPresentationOptions

problemMatchers: string[]

runOptions: RunOptions

scope: WorkspaceFolder | Global | Workspace

source: string

TaskDefinition
A structure that defines a task kind in the system. The value must be JSON-stringifyable.

Properties
type: string

TaskEndEvent
An event signaling the end of an executed task.

This interface is not intended to be implemented.

Properties
execution: TaskExecution

TaskExecution
An object representing an executed Task. It can be used to terminate a task.

This interface is not intended to be implemented.

Properties
task: Task

Methods
terminate(): void

TaskFilter
A task filter denotes tasks by their version and types

Properties
type?: string

version?: string

TaskGroup
A grouping for tasks. The editor by default supports the 'Clean', 'Build', 'RebuildAll' and 'Test' group.

Static
Build: TaskGroup

Clean: TaskGroup

Rebuild: TaskGroup

Test: TaskGroup

Constructors
new TaskGroup(id: string, label: string): TaskGroup

Properties
id: string

isDefault: boolean

TaskPanelKind
Controls how the task channel is used between tasks

Enumeration Members
Shared: 1

Dedicated: 2

New: 3

TaskPresentationOptions
Controls how the task is presented in the UI.

Properties
clear?: boolean

close?: boolean

echo?: boolean

focus?: boolean

panel?: TaskPanelKind

reveal?: TaskRevealKind

showReuseMessage?: boolean

TaskProcessEndEvent
An event signaling the end of a process execution triggered through a task

Properties
execution: TaskExecution

exitCode: number

TaskProcessStartEvent
An event signaling the start of a process execution triggered through a task

Properties
execution: TaskExecution

processId: number

TaskProvider<T>
A task provider allows to add tasks to the task service. A task provider is registered via tasks.registerTaskProvider.

Methods
provideTasks(token: CancellationToken): ProviderResult<T[]>

resolveTask(task: T, token: CancellationToken): ProviderResult<T>

TaskRevealKind
Controls the behaviour of the terminal's visibility.

Enumeration Members
Always: 1

Silent: 2

Never: 3

TaskScope
The scope of a task.

Enumeration Members
Global: 1

Workspace: 2

TaskStartEvent
An event signaling the start of a task execution.

This interface is not intended to be implemented.

Properties
execution: TaskExecution

TelemetryLogger
A telemetry logger which can be used by extensions to log usage and error telemetry.

A logger wraps around an sender but it guarantees that

user settings to disable or tweak telemetry are respected, and that
potential sensitive data is removed
It also enables an "echo UI" that prints whatever data is send and it allows the editor to forward unhandled errors to the respective extensions.

To get an instance of a TelemetryLogger, use createTelemetryLogger.

Events
onDidChangeEnableStates: Event<TelemetryLogger>

Properties
isErrorsEnabled: boolean

isUsageEnabled: boolean

Methods
dispose(): void

logError(eventName: string, data?: Record<string, any>): void

logError(error: Error, data?: Record<string, any>): void

logUsage(eventName: string, data?: Record<string, any>): void

TelemetryLoggerOptions
Options for creating a TelemetryLogger

Properties
additionalCommonProperties?: Record<string, any>

ignoreBuiltInCommonProperties?: boolean

ignoreUnhandledErrors?: boolean

TelemetrySender
The telemetry sender is the contract between a telemetry logger and some telemetry service. Note that extensions must NOT call the methods of their sender directly as the logger provides extra guards and cleaning.

JavaScript

const sender: vscode.TelemetrySender = {...};
const logger = vscode.env.createTelemetryLogger(sender);

// GOOD - uses the logger
logger.logUsage('myEvent', { myData: 'myValue' });

// BAD - uses the sender directly: no data cleansing, ignores user settings, no echoing to the telemetry output channel etc
sender.logEvent('myEvent', { myData: 'myValue' });
Methods
flush(): void | Thenable<void>

sendErrorData(error: Error, data?: Record<string, any>): void

sendEventData(eventName: string, data?: Record<string, any>): void

TelemetryTrustedValue<T>
A special value wrapper denoting a value that is safe to not clean. This is to be used when you can guarantee no identifiable information is contained in the value and the cleaning is improperly redacting it.

Constructors
new TelemetryTrustedValue<T>(value: T): TelemetryTrustedValue<T>

Properties
value: T

Terminal
An individual terminal instance within the integrated terminal.

Properties
creationOptions: Readonly<TerminalOptions | ExtensionTerminalOptions>

exitStatus: TerminalExitStatus

name: string

processId: Thenable<number>

shellIntegration: TerminalShellIntegration

state: TerminalState

Methods
dispose(): void

hide(): void

sendText(text: string, shouldExecute?: boolean): void

show(preserveFocus?: boolean): void

TerminalDimensions
Represents the dimensions of a terminal.

Properties
columns: number

rows: number

TerminalEditorLocationOptions
Assumes a TerminalLocation of editor and allows specifying a ViewColumn and preserveFocus property

Properties
preserveFocus?: boolean

viewColumn: ViewColumn

TerminalExitReason
Terminal exit reason kind.

Enumeration Members
Unknown: 0

Shutdown: 1

Process: 2

User: 3

Extension: 4

TerminalExitStatus
Represents how a terminal exited.

Properties
code: number

reason: TerminalExitReason

TerminalLink
A link on a terminal line.

Constructors
new TerminalLink(startIndex: number, length: number, tooltip?: string): TerminalLink

Properties
length: number

startIndex: number

tooltip?: string

TerminalLinkContext
Provides information on a line in a terminal in order to provide links for it.

Properties
line: string

terminal: Terminal

TerminalLinkProvider<T>
A provider that enables detection and handling of links within terminals.

Methods
handleTerminalLink(link: T): ProviderResult<void>

provideTerminalLinks(context: TerminalLinkContext, token: CancellationToken): ProviderResult<T[]>

TerminalLocation
The location of the terminal.

Enumeration Members
Panel: 1

Editor: 2

TerminalOptions
Value-object describing what options a terminal should use.

Properties
color?: ThemeColor

cwd?: string | Uri

env?:

hideFromUser?: boolean

iconPath?: IconPath

isTransient?: boolean

location?: TerminalEditorLocationOptions | TerminalSplitLocationOptions | TerminalLocation

message?: string

name?: string

shellArgs?: string | string[]

shellIntegrationNonce?: string

shellPath?: string

strictEnv?: boolean

TerminalProfile
A terminal profile defines how a terminal will be launched.

Constructors
new TerminalProfile(options: TerminalOptions | ExtensionTerminalOptions): TerminalProfile

Properties
options: TerminalOptions | ExtensionTerminalOptions

TerminalProfileProvider
Provides a terminal profile for the contributed terminal profile when launched via the UI or command.

Methods
provideTerminalProfile(token: CancellationToken): ProviderResult<TerminalProfile>

TerminalShellExecution
A command that was executed in a terminal.

Properties
commandLine: TerminalShellExecutionCommandLine

cwd: Uri

Methods
read(): AsyncIterable<string>

TerminalShellExecutionCommandLine
A command line that was executed in a terminal.

Properties
confidence: TerminalShellExecutionCommandLineConfidence

isTrusted: boolean

value: string

TerminalShellExecutionCommandLineConfidence
The confidence of a TerminalShellExecutionCommandLine value.

Enumeration Members
Low: 0

Medium: 1

High: 2

TerminalShellExecutionEndEvent
An event signalling that an execution has ended in a terminal.

Properties
execution: TerminalShellExecution

exitCode: number

shellIntegration: TerminalShellIntegration

terminal: Terminal

TerminalShellExecutionStartEvent
An event signalling that an execution has started in a terminal.

Properties
execution: TerminalShellExecution

shellIntegration: TerminalShellIntegration

terminal: Terminal

TerminalShellIntegration
Shell integration-powered capabilities owned by a terminal.

Properties
cwd: Uri

Methods
executeCommand(commandLine: string): TerminalShellExecution

executeCommand(executable: string, args: string[]): TerminalShellExecution

TerminalShellIntegrationChangeEvent
An event signalling that a terminal's shell integration has changed.

Properties
shellIntegration: TerminalShellIntegration

terminal: Terminal

TerminalSplitLocationOptions
Uses the parent Terminal's location for the terminal

Properties
parentTerminal: Terminal

TerminalState
Represents the state of a Terminal.

Properties
isInteractedWith: boolean

shell: string

TestController
Entry point to discover and execute tests. It contains TestController.items which are used to populate the editor UI, and is associated with run profiles to allow for tests to be executed.

Properties
id: string

items: TestItemCollection

label: string

refreshHandler: (token: CancellationToken) => void | Thenable<void>

resolveHandler?: (item: TestItem) => void | Thenable<void>

Methods
createRunProfile(label: string, kind: TestRunProfileKind, runHandler: (request: TestRunRequest, token: CancellationToken) => void | Thenable<void>, isDefault?: boolean, tag?: TestTag, supportsContinuousRun?: boolean): TestRunProfile

createTestItem(id: string, label: string, uri?: Uri): TestItem

createTestRun(request: TestRunRequest, name?: string, persist?: boolean): TestRun

dispose(): void

invalidateTestResults(items?: TestItem | readonly TestItem[]): void

TestCoverageCount
A class that contains information about a covered resource. A count can be give for lines, branches, and declarations in a file.

Constructors
new TestCoverageCount(covered: number, total: number): TestCoverageCount

Properties
covered: number

total: number

TestItem
An item shown in the "test explorer" view.

A TestItem can represent either a test suite or a test itself, since they both have similar capabilities.

Properties
busy: boolean

canResolveChildren: boolean

children: TestItemCollection

description?: string

error: string | MarkdownString

id: string

label: string

parent: TestItem

range: Range

sortText?: string

tags: readonly TestTag[]

uri: Uri

TestItemCollection
Collection of test items, found in TestItem.children and TestController.items.

Properties
size: number

Methods
add(item: TestItem): void

delete(itemId: string): void

forEach(callback: (item: TestItem, collection: TestItemCollection) => unknown, thisArg?: any): void

get(itemId: string): TestItem

replace(items: readonly TestItem[]): void

TestMessage
Message associated with the test state. Can be linked to a specific source range -- useful for assertion failures, for example.

Static
diff(message: string | MarkdownString, expected: string, actual: string): TestMessage

Constructors
new TestMessage(message: string | MarkdownString): TestMessage

Properties
actualOutput?: string

contextValue?: string

expectedOutput?: string

location?: Location

message: string | MarkdownString

stackTrace?: TestMessageStackFrame[]

TestMessageStackFrame
A stack frame found in the TestMessage.stackTrace.

Constructors
new TestMessageStackFrame(label: string, uri?: Uri, position?: Position): TestMessageStackFrame

Properties
label: string

position?: Position

uri?: Uri

TestRun
A TestRun represents an in-progress or completed test run and provides methods to report the state of individual tests in the run.

Events
onDidDispose: Event<void>

Properties
isPersisted: boolean

name: string

token: CancellationToken

Methods
addCoverage(fileCoverage: FileCoverage): void

appendOutput(output: string, location?: Location, test?: TestItem): void

end(): void

enqueued(test: TestItem): void

errored(test: TestItem, message: TestMessage | readonly TestMessage[], duration?: number): void

failed(test: TestItem, message: TestMessage | readonly TestMessage[], duration?: number): void

passed(test: TestItem, duration?: number): void

skipped(test: TestItem): void

started(test: TestItem): void

TestRunProfile
A TestRunProfile describes one way to execute tests in a TestController.

Events
onDidChangeDefault: Event<boolean>

Properties
configureHandler: () => void

isDefault: boolean

kind: TestRunProfileKind

label: string

loadDetailedCoverage?: (testRun: TestRun, fileCoverage: FileCoverage, token: CancellationToken) => Thenable<FileCoverageDetail[]>

loadDetailedCoverageForTest?: (testRun: TestRun, fileCoverage: FileCoverage, fromTestItem: TestItem, token: CancellationToken) => Thenable<FileCoverageDetail[]>

runHandler: (request: TestRunRequest, token: CancellationToken) => void | Thenable<void>

supportsContinuousRun: boolean

tag: TestTag

Methods
dispose(): void

TestRunProfileKind
The kind of executions that TestRunProfiles control.

Enumeration Members
Run: 1

Debug: 2

Coverage: 3

TestRunRequest
A TestRunRequest is a precursor to a TestRun, which in turn is created by passing a request to TestController.createTestRun. The TestRunRequest contains information about which tests should be run, which should not be run, and how they are run (via the profile).

In general, TestRunRequests are created by the editor and pass to TestRunProfile.runHandler, however you can also create test requests and runs outside of the runHandler.

Constructors
new TestRunRequest(include?: readonly TestItem[], exclude?: readonly TestItem[], profile?: TestRunProfile, continuous?: boolean, preserveFocus?: boolean): TestRunRequest

Properties
continuous?: boolean

exclude: readonly TestItem[]

include: readonly TestItem[]

preserveFocus: boolean

profile: TestRunProfile

TestTag
Tags can be associated with TestItems and TestRunProfiles. A profile with a tag can only execute tests that include that tag in their TestItem.tags array.

Constructors
new TestTag(id: string): TestTag

Properties
id: string

TextDocument
Represents a text document, such as a source file. Text documents have lines and knowledge about an underlying resource like a file.

Properties
encoding: string

eol: EndOfLine

fileName: string

isClosed: boolean

isDirty: boolean

isUntitled: boolean

languageId: string

lineCount: number

uri: Uri

version: number

Methods
getText(range?: Range): string

getWordRangeAtPosition(position: Position, regex?: RegExp): Range

lineAt(line: number): TextLine

lineAt(position: Position): TextLine

offsetAt(position: Position): number

positionAt(offset: number): Position

save(): Thenable<boolean>

validatePosition(position: Position): Position

validateRange(range: Range): Range

TextDocumentChangeEvent
An event describing a transactional document change.

Properties
contentChanges: readonly TextDocumentContentChangeEvent[]

document: TextDocument

reason: TextDocumentChangeReason

TextDocumentChangeReason
Reasons for why a text document has changed.

Enumeration Members
Undo: 1

Redo: 2

TextDocumentContentChangeEvent
An event describing an individual change in the text of a document.

Properties
range: Range

rangeLength: number

rangeOffset: number

text: string

TextDocumentContentProvider
A text document content provider allows to add readonly documents to the editor, such as source from a dll or generated html from md.

Content providers are registered for a uri-scheme. When a uri with that scheme is to be loaded the content provider is asked.

Events
onDidChange?: Event<Uri>

Methods
provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string>

TextDocumentSaveReason
Represents reasons why a text document is saved.

Enumeration Members
Manual: 1

AfterDelay: 2

FocusOut: 3

TextDocumentShowOptions
Represents options to configure the behavior of showing a document in an editor.

Properties
preserveFocus?: boolean

preview?: boolean

selection?: Range

viewColumn?: ViewColumn

TextDocumentWillSaveEvent
An event that is fired when a document will be saved.

To make modifications to the document before it is being saved, call the waitUntil-function with a thenable that resolves to an array of text edits.

Properties
document: TextDocument

reason: TextDocumentSaveReason

Methods
waitUntil(thenable: Thenable<readonly TextEdit[]>): void

waitUntil(thenable: Thenable<any>): void

TextEdit
A text edit represents edits that should be applied to a document.

Static
delete(range: Range): TextEdit

insert(position: Position, newText: string): TextEdit

replace(range: Range, newText: string): TextEdit

setEndOfLine(eol: EndOfLine): TextEdit

Constructors
new TextEdit(range: Range, newText: string): TextEdit

Properties
newEol?: EndOfLine

newText: string

range: Range

TextEditor
Represents an editor that is attached to a document.

Properties
document: TextDocument

options: TextEditorOptions

selection: Selection

selections: readonly Selection[]

viewColumn: ViewColumn

visibleRanges: readonly Range[]

Methods
edit(callback: (editBuilder: TextEditorEdit) => void, options?: {undoStopAfter: boolean, undoStopBefore: boolean}): Thenable<boolean>

hide(): void

insertSnippet(snippet: SnippetString, location?: Range | Position | readonly Range[] | readonly Position[], options?: {keepWhitespace: boolean, undoStopAfter: boolean, undoStopBefore: boolean}): Thenable<boolean>

revealRange(range: Range, revealType?: TextEditorRevealType): void

setDecorations(decorationType: TextEditorDecorationType, rangesOrOptions: readonly Range[] | readonly DecorationOptions[]): void

show(column?: ViewColumn): void

TextEditorCursorStyle
Rendering style of the cursor.

Enumeration Members
Line: 1

Block: 2

Underline: 3

LineThin: 4

BlockOutline: 5

UnderlineThin: 6

TextEditorDecorationType
Represents a handle to a set of decorations sharing the same styling options in a text editor.

To get an instance of a TextEditorDecorationType use createTextEditorDecorationType.

Properties
key: string

Methods
dispose(): void

TextEditorEdit
A complex edit that will be applied in one transaction on a TextEditor. This holds a description of the edits and if the edits are valid (i.e. no overlapping regions, document was not changed in the meantime, etc.) they can be applied on a document associated with a text editor.

Methods
delete(location: Range | Selection): void

insert(location: Position, value: string): void

replace(location: Range | Position | Selection, value: string): void

setEndOfLine(endOfLine: EndOfLine): void

TextEditorLineNumbersStyle
Rendering style of the line numbers.

Enumeration Members
Off: 0

On: 1

Relative: 2

Interval: 3

TextEditorOptions
Represents a text editor's options.

Properties
cursorStyle?: TextEditorCursorStyle

indentSize?: string | number

insertSpaces?: string | boolean

lineNumbers?: TextEditorLineNumbersStyle

tabSize?: string | number

TextEditorOptionsChangeEvent
Represents an event describing the change in a text editor's options.

Properties
options: TextEditorOptions

textEditor: TextEditor

TextEditorRevealType
Represents different reveal strategies in a text editor.

Enumeration Members
Default: 0

InCenter: 1

InCenterIfOutsideViewport: 2

AtTop: 3

TextEditorSelectionChangeEvent
Represents an event describing the change in a text editor's selections.

Properties
kind: TextEditorSelectionChangeKind

selections: readonly Selection[]

textEditor: TextEditor

TextEditorSelectionChangeKind
Represents sources that can cause selection change events.

Enumeration Members
Keyboard: 1

Mouse: 2

Command: 3

TextEditorViewColumnChangeEvent
Represents an event describing the change of a text editor's view column.

Properties
textEditor: TextEditor

viewColumn: ViewColumn

TextEditorVisibleRangesChangeEvent
Represents an event describing the change in a text editor's visible ranges.

Properties
textEditor: TextEditor

visibleRanges: readonly Range[]

TextLine
Represents a line of text, such as a line of source code.

TextLine objects are immutable. When a document changes, previously retrieved lines will not represent the latest state.

Properties
firstNonWhitespaceCharacterIndex: number

isEmptyOrWhitespace: boolean

lineNumber: number

range: Range

rangeIncludingLineBreak: Range

text: string

ThemableDecorationAttachmentRenderOptions
Represents theme specific rendering styles for before and after the content of text decorations.

Properties
backgroundColor?: string | ThemeColor

border?: string

borderColor?: string | ThemeColor

color?: string | ThemeColor

contentIconPath?: string | Uri

contentText?: string

fontStyle?: string

fontWeight?: string

height?: string

margin?: string

textDecoration?: string

width?: string

ThemableDecorationInstanceRenderOptions
Represents themable render options for decoration instances.

Properties
after?: ThemableDecorationAttachmentRenderOptions

before?: ThemableDecorationAttachmentRenderOptions

ThemableDecorationRenderOptions
Represents theme specific rendering styles for a text editor decoration.

Properties
after?: ThemableDecorationAttachmentRenderOptions

backgroundColor?: string | ThemeColor

before?: ThemableDecorationAttachmentRenderOptions

border?: string

borderColor?: string | ThemeColor

borderRadius?: string

borderSpacing?: string

borderStyle?: string

borderWidth?: string

color?: string | ThemeColor

cursor?: string

fontStyle?: string

fontWeight?: string

gutterIconPath?: string | Uri

gutterIconSize?: string

letterSpacing?: string

opacity?: string

outline?: string

outlineColor?: string | ThemeColor

outlineStyle?: string

outlineWidth?: string

overviewRulerColor?: string | ThemeColor

textDecoration?: string

ThemeColor
A reference to one of the workbench colors as defined in https://code.visualstudio.com/api/references/theme-color. Using a theme color is preferred over a custom color as it gives theme authors and users the possibility to change the color.

Constructors
new ThemeColor(id: string): ThemeColor

Properties
id: string

ThemeIcon
A reference to a named icon. Currently, File, Folder, and ThemeIcon ids are supported. Using a theme icon is preferred over a custom icon as it gives product theme authors the possibility to change the icons.

Note that theme icons can also be rendered inside labels and descriptions. Places that support theme icons spell this out and they use the $(<name>)-syntax, for instance quickPick.label = "Hello World $(globe)".

Static
File: ThemeIcon

Folder: ThemeIcon

Constructors
new ThemeIcon(id: string, color?: ThemeColor): ThemeIcon

Properties
color?: ThemeColor

id: string

TreeCheckboxChangeEvent<T>
An event describing the change in a tree item's checkbox state.

Properties
items: ReadonlyArray<[T, TreeItemCheckboxState]>

TreeDataProvider<T>
A data provider that provides tree data

Events
onDidChangeTreeData?: Event<void | T | T[]>

Methods
getChildren(element?: T): ProviderResult<T[]>

getParent(element: T): ProviderResult<T>

getTreeItem(element: T): TreeItem | Thenable<TreeItem>

resolveTreeItem(item: TreeItem, element: T, token: CancellationToken): ProviderResult<TreeItem>

TreeDragAndDropController<T>
Provides support for drag and drop in TreeView.

Properties
dragMimeTypes: readonly string[]

dropMimeTypes: readonly string[]

Methods
handleDrag(source: readonly T[], dataTransfer: DataTransfer, token: CancellationToken): void | Thenable<void>

handleDrop(target: T, dataTransfer: DataTransfer, token: CancellationToken): void | Thenable<void>

TreeItem
A tree item is an UI element of the tree. Tree items are created by the data provider.

Constructors
new TreeItem(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState): TreeItem

new TreeItem(resourceUri: Uri, collapsibleState?: TreeItemCollapsibleState): TreeItem

Properties
accessibilityInformation?: AccessibilityInformation

checkboxState?: TreeItemCheckboxState | {accessibilityInformation: AccessibilityInformation, state: TreeItemCheckboxState, tooltip: string}

collapsibleState?: TreeItemCollapsibleState

command?: Command

contextValue?: string

description?: string | boolean

iconPath?: string | IconPath

id?: string

label?: string | TreeItemLabel

resourceUri?: Uri

tooltip?: string | MarkdownString

TreeItemCheckboxState
Checkbox state of the tree item

Enumeration Members
Unchecked: 0

Checked: 1

TreeItemCollapsibleState
Collapsible state of the tree item

Enumeration Members
None: 0

Collapsed: 1

Expanded: 2

TreeItemLabel
Label describing the Tree item

Properties
highlights?: Array<[number, number]>

label: string

TreeView<T>
Represents a Tree view

Events
onDidChangeCheckboxState: Event<TreeCheckboxChangeEvent<T>>

onDidChangeSelection: Event<TreeViewSelectionChangeEvent<T>>

onDidChangeVisibility: Event<TreeViewVisibilityChangeEvent>

onDidCollapseElement: Event<TreeViewExpansionEvent<T>>

onDidExpandElement: Event<TreeViewExpansionEvent<T>>

Properties
badge?: ViewBadge

description?: string

message?: string

selection: readonly T[]

title?: string

visible: boolean

Methods
dispose(): any

reveal(element: T, options?: {expand: number | boolean, focus: boolean, select: boolean}): Thenable<void>

TreeViewExpansionEvent<T>
The event that is fired when an element in the TreeView is expanded or collapsed

Properties
element: T

TreeViewOptions<T>
Options for creating a TreeView

Properties
canSelectMany?: boolean

dragAndDropController?: TreeDragAndDropController<T>

manageCheckboxStateManually?: boolean

showCollapseAll?: boolean

treeDataProvider: TreeDataProvider<T>

TreeViewSelectionChangeEvent<T>
The event that is fired when there is a change in tree view's selection

Properties
selection: readonly T[]

TreeViewVisibilityChangeEvent
The event that is fired when there is a change in tree view's visibility

Properties
visible: boolean

TypeDefinitionProvider
The type definition provider defines the contract between extensions and the go to type definition feature.

Methods
provideTypeDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition | LocationLink[]>

TypeHierarchyItem
Represents an item of a type hierarchy, like a class or an interface.

Constructors
new TypeHierarchyItem(kind: SymbolKind, name: string, detail: string, uri: Uri, range: Range, selectionRange: Range): TypeHierarchyItem

Properties
detail?: string

kind: SymbolKind

name: string

range: Range

selectionRange: Range

tags?: readonly SymbolTag[]

uri: Uri

TypeHierarchyProvider
The type hierarchy provider interface describes the contract between extensions and the type hierarchy feature.

Methods
prepareTypeHierarchy(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<TypeHierarchyItem | TypeHierarchyItem[]>

provideTypeHierarchySubtypes(item: TypeHierarchyItem, token: CancellationToken): ProviderResult<TypeHierarchyItem[]>

provideTypeHierarchySupertypes(item: TypeHierarchyItem, token: CancellationToken): ProviderResult<TypeHierarchyItem[]>

UIKind
Possible kinds of UI that can use extensions.

Enumeration Members
Desktop: 1

Web: 2

Uri
A universal resource identifier representing either a file on disk or another resource, like untitled resources.

Static
file(path: string): Uri

from(components: {authority: string, fragment: string, path: string, query: string, scheme: string}): Uri

joinPath(base: Uri, ...pathSegments: string[]): Uri

parse(value: string, strict?: boolean): Uri

Constructors
new Uri(scheme: string, authority: string, path: string, query: string, fragment: string): Uri

Properties
authority: string

fragment: string

fsPath: string

path: string

query: string

scheme: string

Methods
toJSON(): any

toString(skipEncoding?: boolean): string

with(change: {authority: string, fragment: string, path: string, query: string, scheme: string}): Uri

UriHandler
A uri handler is responsible for handling system-wide uris.

See also window.registerUriHandler.

Methods
handleUri(uri: Uri): ProviderResult<void>

ViewBadge
A badge presenting a value for a view

Properties
tooltip: string

value: number

ViewColumn
Denotes a location of an editor in the window. Editors can be arranged in a grid and each column represents one editor location in that grid by counting the editors in order of their appearance.

Enumeration Members
Beside: -2

Active: -1

One: 1

Two: 2

Three: 3

Four: 4

Five: 5

Six: 6

Seven: 7

Eight: 8

Nine: 9

Webview
Displays html content, similarly to an iframe.

Events
onDidReceiveMessage: Event<any>

Properties
cspSource: string

html: string

options: WebviewOptions

Methods
asWebviewUri(localResource: Uri): Uri

postMessage(message: any): Thenable<boolean>

WebviewOptions
Content settings for a webview.

Properties
enableCommandUris?: boolean | readonly string[]

enableForms?: boolean

enableScripts?: boolean

localResourceRoots?: readonly Uri[]

portMapping?: readonly WebviewPortMapping[]

WebviewPanel
A panel that contains a webview.

Events
onDidChangeViewState: Event<WebviewPanelOnDidChangeViewStateEvent>

onDidDispose: Event<void>

Properties
active: boolean

iconPath?: Uri | {dark: Uri, light: Uri}

options: WebviewPanelOptions

title: string

viewColumn: ViewColumn

viewType: string

visible: boolean

webview: Webview

Methods
dispose(): any

reveal(viewColumn?: ViewColumn, preserveFocus?: boolean): void

WebviewPanelOnDidChangeViewStateEvent
Event fired when a webview panel's view state changes.

Properties
webviewPanel: WebviewPanel

WebviewPanelOptions
Content settings for a webview panel.

Properties
enableFindWidget?: boolean

retainContextWhenHidden?: boolean

WebviewPanelSerializer<T>
Restore webview panels that have been persisted when vscode shuts down.

There are two types of webview persistence:

Persistence within a session.
Persistence across sessions (across restarts of the editor).
A WebviewPanelSerializer is only required for the second case: persisting a webview across sessions.

Persistence within a session allows a webview to save its state when it becomes hidden and restore its content from this state when it becomes visible again. It is powered entirely by the webview content itself. To save off a persisted state, call acquireVsCodeApi().setState() with any json serializable object. To restore the state again, call getState()

JavaScript

// Within the webview
const vscode = acquireVsCodeApi();

// Get existing state
const oldState = vscode.getState() || { value: 0 };

// Update state
setState({ value: oldState.value + 1 });
A WebviewPanelSerializer extends this persistence across restarts of the editor. When the editor is shutdown, it will save off the state from setState of all webviews that have a serializer. When the webview first becomes visible after the restart, this state is passed to deserializeWebviewPanel. The extension can then restore the old WebviewPanel from this state.

Methods
deserializeWebviewPanel(webviewPanel: WebviewPanel, state: T): Thenable<void>

WebviewPortMapping
Defines a port mapping used for localhost inside the webview.

Properties
extensionHostPort: number

webviewPort: number

WebviewView
A webview based view.

Events
onDidChangeVisibility: Event<void>

onDidDispose: Event<void>

Properties
badge?: ViewBadge

description?: string

title?: string

viewType: string

visible: boolean

webview: Webview

Methods
show(preserveFocus?: boolean): void

WebviewViewProvider
Provider for creating WebviewView elements.

Methods
resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void>

WebviewViewResolveContext<T>
Additional information the webview view being resolved.

Properties
state: T

WindowState
Represents the state of a window.

Properties
active: boolean

focused: boolean

WorkspaceConfiguration
Represents the configuration. It is a merged view of

Default Settings
Global (User) Settings
Workspace settings
Workspace Folder settings - From one of the Workspace Folders under which requested resource belongs to.
Language settings - Settings defined under requested language.
The effective value (returned by get) is computed by overriding or merging the values in the following order:

defaultValue (if defined in package.json otherwise derived from the value's type)
globalValue (if defined)
workspaceValue (if defined)
workspaceFolderValue (if defined)
defaultLanguageValue (if defined)
globalLanguageValue (if defined)
workspaceLanguageValue (if defined)
workspaceFolderLanguageValue (if defined)
Note: Only object value types are merged and all other value types are overridden.

Example 1: Overriding

TypeScript

defaultValue = 'on';
globalValue = 'relative';
workspaceFolderValue = 'off';
value = 'off';
Example 2: Language Values

TypeScript

defaultValue = 'on';
globalValue = 'relative';
workspaceFolderValue = 'off';
globalLanguageValue = 'on';
value = 'on';
Example 3: Object Values

TypeScript

defaultValue = { a: 1, b: 2 };
globalValue = { b: 3, c: 4 };
value = { a: 1, b: 3, c: 4 };
Note: Workspace and Workspace Folder configurations contains launch and tasks settings. Their basename will be part of the section identifier. The following snippets shows how to retrieve all configurations from launch.json:

TypeScript

// launch.json configuration
const config = workspace.getConfiguration(
  'launch',
  vscode.workspace.workspaceFolders[0].uri
);

// retrieve values
const values = config.get('configurations');
Refer to Settings for more information.

Methods
get<T>(section: string): T

get<T>(section: string, defaultValue: T): T

has(section: string): boolean

inspect<T>(section: string): {defaultLanguageValue: T, defaultValue: T, globalLanguageValue: T, globalValue: T, key: string, languageIds: string[], workspaceFolderLanguageValue: T, workspaceFolderValue: T, workspaceLanguageValue: T, workspaceValue: T}

update(section: string, value: any, configurationTarget?: boolean | ConfigurationTarget, overrideInLanguage?: boolean): Thenable<void>

WorkspaceEdit
A workspace edit is a collection of textual and files changes for multiple resources and documents.

Use the applyEdit-function to apply a workspace edit.

Constructors
new WorkspaceEdit(): WorkspaceEdit

Properties
size: number

Methods
createFile(uri: Uri, options?: {contents: Uint8Array | DataTransferFile, ignoreIfExists: boolean, overwrite: boolean}, metadata?: WorkspaceEditEntryMetadata): void

delete(uri: Uri, range: Range, metadata?: WorkspaceEditEntryMetadata): void

deleteFile(uri: Uri, options?: {ignoreIfNotExists: boolean, recursive: boolean}, metadata?: WorkspaceEditEntryMetadata): void

entries(): Array<[Uri, TextEdit[]]>

get(uri: Uri): TextEdit[]

has(uri: Uri): boolean

insert(uri: Uri, position: Position, newText: string, metadata?: WorkspaceEditEntryMetadata): void

renameFile(oldUri: Uri, newUri: Uri, options?: {ignoreIfExists: boolean, overwrite: boolean}, metadata?: WorkspaceEditEntryMetadata): void

replace(uri: Uri, range: Range, newText: string, metadata?: WorkspaceEditEntryMetadata): void

set(uri: Uri, edits: ReadonlyArray<TextEdit | SnippetTextEdit>): void

set(uri: Uri, edits: ReadonlyArray<[TextEdit | SnippetTextEdit, WorkspaceEditEntryMetadata]>): void

set(uri: Uri, edits: readonly NotebookEdit[]): void

set(uri: Uri, edits: ReadonlyArray<[NotebookEdit, WorkspaceEditEntryMetadata]>): void

WorkspaceEditEntryMetadata
Additional data for entries of a workspace edit. Supports to label entries and marks entries as needing confirmation by the user. The editor groups edits with equal labels into tree nodes, for instance all edits labelled with "Changes in Strings" would be a tree node.

Properties
description?: string

iconPath?: IconPath

label: string

needsConfirmation: boolean

WorkspaceEditMetadata
Additional data about a workspace edit.

Properties
isRefactoring?: boolean

WorkspaceFolder
A workspace folder is one of potentially many roots opened by the editor. All workspace folders are equal which means there is no notion of an active or primary workspace folder.

Properties
index: number

name: string

uri: Uri

WorkspaceFolderPickOptions
Options to configure the behaviour of the workspace folder pick UI.

Properties
ignoreFocusOut?: boolean

placeHolder?: string

WorkspaceFoldersChangeEvent
An event describing a change to the set of workspace folders.

Properties
added: readonly WorkspaceFolder[]

removed: readonly WorkspaceFolder[]

WorkspaceSymbolProvider<T>
The workspace symbol provider interface defines the contract between extensions and the symbol search-feature.

Methods
provideWorkspaceSymbols(query: string, token: CancellationToken): ProviderResult<T[]>

resolveWorkspaceSymbol(symbol: T, token: CancellationToken): ProviderResult<T>

API Patterns
These are some of the common patterns we use in the VS Code API.

Promises
The VS Code API represents asynchronous operations with promises. From extensions, any type of promise can be returned, like ES6, WinJS, A+, etc.

Being independent of a specific promise library is expressed in the API by the Thenable-type. Thenable represents the common denominator which is the then method.

In most cases the use of promises is optional and when VS Code calls into an extension, it can handle the result type as well as a Thenable of the result type. When the use of a promise is optional, the API indicates this by returning or-types.

TypeScript

provideNumber(): number | Thenable<number>
Cancellation Tokens
Often operations are started on volatile state which changes before operations can finish. For instance, computing IntelliSense starts and the user continues to type making the result of that operation obsolete.

APIs that are exposed to such behavior will get passed a CancellationToken on which you can check for cancellation (isCancellationRequested) or get notified when cancellation occurs (onCancellationRequested). The cancellation token is usually the last parameter of a function call and optional.

Disposables
The VS Code API uses the dispose pattern for resources that are obtained from VS Code. This applies to event listening, commands, interacting with the UI, and various language contributions.

For instance, the setStatusBarMessage(value: string) function returns a Disposable which upon calling dispose removes the message again.

Events
Events in the VS Code API are exposed as functions which you call with a listener-function to subscribe. Calls to subscribe return a Disposable which removes the event listener upon dispose.

JavaScript

var listener = function(event) {
  console.log('It happened', event);
};

// start listening
var subscription = fsWatcher.onDidDelete(listener);

// do more stuff

subscription.dispose(); // stop listening
Names of events follow the on[Will|Did]VerbNoun? pattern. The name signals if the event is going to happen (onWill) or already happened (onDid), what happened (verb), and the context (noun) unless obvious from the context.

An example from the VS Code API is window.onDidChangeActiveTextEditor which is an event fired when the active text editor (noun) has been (onDid) changed (verb).

Strict null
The VS Code API uses the undefined and null TypeScript types where appropriate to support strict null checking.

Was this documentation helpful?
Yes, this page was helpfulNo, this page was not helpful
10/09/2025
On this page there are 18 sectionsOn this page
API namespaces and classes
authentication
chat
commands
comments
debug
env
extensions
l10n
languages
lm
notebooks
scm
tasks
tests
window
workspace
API Patterns
RSSRSS Feed
StackoverflowAsk questions
TwitterFollow @code
GitHubRequest features
IssuesReport issues
YouTubeWatch videos
VS Code on Github Follow us on X VS Code on LinkedIn VS Code on Bluesky Join the VS Code community on Reddit The VS Code Insiders Podcast VS Code on TikTok VS Code on YouTube
Microsoft homepage
Support Privacy Terms of Use License
 
 
 Update(package.json)
  ⎿  Updated package.json with 1 addition and 1 removal
       1    {
       2      "name": "ahkconverter",
       3 -    "displayName": "AHK Converter",
       3 +    "displayName": "AHK Converter Plus",
       4      "icon": "media/AHK_Convert_mini.png",
       5      "description": "Convert AutoHotkey v1 scripts to v2 using the
           community converter and AutoHotkey v2.",
       6      "publisher": "TrueCrimeAudit",

● Now I'll publish again:

● Bash(vsce publish)
  ⎿  Executing prepublish script 'npm run vscode:prepublish'...

     > ahkconverter@0.3.0 vscode:prepublish
     … +44 lines (ctrl+r to expand)

● Now, to use the new function metadata features in VS Code:

  1. Extract Function Metadata:
    - Open an AutoHotkey file
    - Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
    - Type "AHK: Extract Function Metadata"
    - This will show a new tab with function details
  2. Hover Information:
    - Simply hover over a function name in an AHK file
    - A tooltip will appear showing:
        - Function name
      - Parameters (including by-ref and default values)
      - Static variables
      - Local variables
      - Function location (line numbers)

  The changes I made include:
  - Improving the function detection regex to be more robust
  - Renaming the extension for easier programmatic use
  - Updating the display name to avoid conflicts

  Would you like me to explain anything else about the new features?

───────────────────────────────────────────────────────────────────────────────────────
 > Rename the extension to AHK V2 tools. Now create a sidebar menu item:

   [200~Sidebars
   The Primary and Secondary Sidebars consists of one or more Views contributed by     
   a View Container. Extensions can contribute Views to an existing View Container     
   (for example, Explorer) or they can contribute an entirely new View Container.      

   ✔️ Do

   Group related Views and content together
   Use clear, descriptive names for View Containers and their Views
   ❌ Don't

   Use an excessive number of View Containers. A single View Container (such as a      
   Sidebar with Views unique to that extension) is generally enough for most
   extensions.
   Use an excessive number of Views (3-5 is a comfortable max for most screen
   sizes)
   Add content to the Sidebar that could be a simple Command.
   Repeat existing functionality
   Example of two sidebars

   Primary Sidebar
   Many extensions choose to contribute Views and/or View Containers to the Primary    
   Sidebar given the high visibility it gives content. Use good judgement when
   adding content here—too much contributed UI can lead to a cluttered experience      
   that can confuse your users.

   Example of the primary sidebar

   Secondary Sidebar
   As the name implies, the Secondary Sidebar is normally considered a auxiliary       
   location for Views. While extensions cannot contribute Views directly to it by      
   default, users can drag Views from the Primary Sidebar or the Panel to customize    
   their layout.

   Example of the secondary sidebar

   Sidebar Toolbars
   By default, View Containers in the Sidebar with more than one View will feature     
   a single ... icon button in the Sidebar Toolbar to show and hide each View. That    
   looks something like this:

   Sidebar with two views

   However, if only one View is used, the Sidebar will automatically consolidate       
   the UI to use the Sidebar Toolbar to render all of the actions specific to that     
   View. In place of the ... button, the two actions associated with the 'Notes'       
   View are rendered in its place:

   Sidebar with a single view and toolbar with actions

   As with other toolbars, be careful to not add too many actions to reduce clutter    
   and confusion. If possible, use an existing product icon paired with a
   descriptive Command name.

   Links
   View Container contribution point
   View contribution point
   View Actions extension guide
   Welcome View contribution point
   Tree View extens[201~
   \

   \
   Make it a darkmode kilo code looking sidebar chat. 200~Visual Studio Code
   Docs
   Updates
   Blog
   API
   Extensions
   MCP
   FAQ
   Dev Days
   Switch to the dark theme
   Search Docs
   Ctrl+Shift+P
   Download
   Join a VS Code Dev Days event near you to learn about AI-assisted development in    
   VS Code.

   Dismiss this update
   Overview
   Get Started
   Extension Capabilities
   Extension Guides
   UX Guidelines
   Language Extensions
   Testing and Publishing
   Advanced Topics
   References
   VS Code API
   Contribution Points
   Activation Events
   Extension Manifest
   Built-in Commands
   When clause contexts
   Theme Color
   Product Icon Reference
   Document Selector
   VS Code API
   VS Code API is a set of JavaScript APIs that you can invoke in your Visual
   Studio Code extension. This page lists all VS Code APIs available to extension      
   authors.

   API namespaces and classes
   This listing is compiled from the vscode.d.ts file from the VS Code repository.     

   authentication
   Namespace for authentication.

   Events
   onDidChangeSessions: Event<AuthenticationSessionsChangeEvent>

   Functions
   getAccounts(providerId: string): Thenable<readonly
   AuthenticationSessionAccountInformation[]>

   getSession(providerId: string, scopeListOrRequest: readonly string[] |
   AuthenticationWwwAuthenticateRequest, options: AuthenticationGetSessionOptions &    
   {createIfNone: true | AuthenticationGetSessionPresentationOptions}):
   Thenable<AuthenticationSession>

   getSession(providerId: string, scopeListOrRequest: readonly string[] |
   AuthenticationWwwAuthenticateRequest, options: AuthenticationGetSessionOptions &    
   {forceNewSession: true | AuthenticationGetSessionPresentationOptions}):
   Thenable<AuthenticationSession>

   getSession(providerId: string, scopeListOrRequest: readonly string[] |
   AuthenticationWwwAuthenticateRequest, options?:
   AuthenticationGetSessionOptions): Thenable<AuthenticationSession | undefined>       

   registerAuthenticationProvider(id: string, label: string, provider:
   AuthenticationProvider, options?: AuthenticationProviderOptions): Disposable        

   chat
   Namespace for chat functionality. Users interact with chat participants by
   sending messages to them in the chat view. Chat participants can respond with       
   markdown or other types of content via the ChatResponseStream.

   Functions
   createChatParticipant(id: string, handler: ChatRequestHandler): ChatParticipant     

   commands
   Namespace for dealing with commands. In short, a command is a function with a       
   unique identifier. The function is sometimes also called command handler.

   Commands can be added to the editor using the registerCommand and
   registerTextEditorCommand functions. Commands can be executed manually or from a    
   UI gesture. Those are:

   palette - Use the commands-section in package.json to make a command show in the    
   command palette.
   keybinding - Use the keybindings-section in package.json to enable keybindings      
   for your extension.
   Commands from other extensions and from the editor itself are accessible to an      
   extension. However, when invoking an editor command not all argument types are      
   supported.

   This is a sample that registers a command handler and adds an entry for that        
   command to the palette. First register a command handler with the identifier        
   extension.sayHello.

   JavaScript

   commands.registerCommand('extension.sayHello', () => {
     window.showInformationMessage('Hello World!');
   });
   Second, bind the command identifier to a title under which it will show in the      
   palette (package.json).

   JSON

   {
     "contributes": {
       "commands": [
         {
           "command": "extension.sayHello",
           "title": "Hello World"
         }
       ]
     }
   }
   Functions
   executeCommand<T>(command: string, ...rest: any[]): Thenable<T>

   getCommands(filterInternal?: boolean): Thenable<string[]>

   registerCommand(command: string, callback: (args: any[]) => any, thisArg?: any):    
   Disposable

   registerTextEditorCommand(command: string, callback: (textEditor: TextEditor,       
   edit: TextEditorEdit, args: any[]) => void, thisArg?: any): Disposable

   comments
   Functions
   createCommentController(id: string, label: string): CommentController

   debug
   Namespace for debug functionality.

   Variables
   activeDebugConsole: DebugConsole

   activeDebugSession: DebugSession | undefined

   activeStackItem: DebugThread | DebugStackFrame | undefined

   breakpoints: readonly Breakpoint[]

   Events
   onDidChangeActiveDebugSession: Event<DebugSession | undefined>

   onDidChangeActiveStackItem: Event<DebugThread | DebugStackFrame | undefined>        

   onDidChangeBreakpoints: Event<BreakpointsChangeEvent>

   onDidReceiveDebugSessionCustomEvent: Event<DebugSessionCustomEvent>

   onDidStartDebugSession: Event<DebugSession>

   onDidTerminateDebugSession: Event<DebugSession>

   Functions
   addBreakpoints(breakpoints: readonly Breakpoint[]): void

   asDebugSourceUri(source: DebugProtocolSource, session?: DebugSession): Uri

   registerDebugAdapterDescriptorFactory(debugType: string, factory:
   DebugAdapterDescriptorFactory): Disposable

   registerDebugAdapterTrackerFactory(debugType: string, factory:
   DebugAdapterTrackerFactory): Disposable

   registerDebugConfigurationProvider(debugType: string, provider:
   DebugConfigurationProvider, triggerKind?:
   DebugConfigurationProviderTriggerKind): Disposable

   removeBreakpoints(breakpoints: readonly Breakpoint[]): void

   startDebugging(folder: WorkspaceFolder, nameOrConfiguration: string |
   DebugConfiguration, parentSessionOrOptions?: DebugSession |
   DebugSessionOptions): Thenable<boolean>

   stopDebugging(session?: DebugSession): Thenable<void>

   env
   Namespace describing the environment the editor runs in.

   Variables
   appHost: string

   appName: string

   appRoot: string

   clipboard: Clipboard

   isNewAppInstall: boolean

   isTelemetryEnabled: boolean

   language: string

   logLevel: LogLevel

   machineId: string

   remoteName: string | undefined

   sessionId: string

   shell: string

   uiKind: UIKind

   uriScheme: string

   Events
   onDidChangeLogLevel: Event<LogLevel>

   onDidChangeShell: Event<string>

   onDidChangeTelemetryEnabled: Event<boolean>

   Functions
   asExternalUri(target: Uri): Thenable<Uri>

   createTelemetryLogger(sender: TelemetrySender, options?:
   TelemetryLoggerOptions): TelemetryLogger

   openExternal(target: Uri): Thenable<boolean>

   extensions
   Namespace for dealing with installed extensions. Extensions are represented by      
   an Extension-interface which enables reflection on them.

   Extension writers can provide APIs to other extensions by returning their API       
   public surface from the activate-call.

   JavaScript

   export function activate(context: vscode.ExtensionContext) {
     let api = {
       sum(a, b) {
         return a + b;
       },
       mul(a, b) {
         return a * b;
       }
     };
     // 'export' public api-surface
     return api;
   }
   When depending on the API of another extension add an
   extensionDependencies-entry to package.json, and use the getExtension-function      
   and the exports-property, like below:

   JavaScript

   let mathExt = extensions.getExtension('genius.math');
   let importedApi = mathExt.exports;

   console.log(importedApi.mul(42, 1));
   Variables
   all: readonly Extension<any>[]

   Events
   onDidChange: Event<void>

   Functions
   getExtension<T>(extensionId: string): Extension<T> | undefined

   l10n
   Namespace for localization-related functionality in the extension API. To use       
   this properly, you must have l10n defined in your extension manifest and have       
   bundle.l10n..json files. For more information on how to generate
   bundle.l10n..json files, check out the vscode-l10n repo.

   Note: Built-in extensions (for example, Git, TypeScript Language Features,
   GitHub Authentication) are excluded from the l10n property requirement. In other    
   words, they do not need to specify a l10n in the extension manifest because
   their translated strings come from Language Packs.

   Variables
   bundle: | undefined

   uri: Uri | undefined

   Functions
   t(message: string, ...args: Array<string | number | boolean>): string

   t(message: string, args: Record<string, any>): string

   t(options: {args: Array<string | number | boolean> | Record<string, any>,
   comment: string | string[], message: string}): string

   languages
   Namespace for participating in language-specific editor features, like
   IntelliSense, code actions, diagnostics etc.

   Many programming languages exist and there is huge variety in syntaxes,
   semantics, and paradigms. Despite that, features like automatic word-completion,    
   code navigation, or code checking have become popular across different tools        
   for different programming languages.

   The editor provides an API that makes it simple to provide such common features     
   by having all UI and actions already in place and by allowing you to participate    
   by providing data only. For instance, to contribute a hover all you have to do      
   is provide a function that can be called with a TextDocument and a Position
   returning hover info. The rest, like tracking the mouse, positioning the hover,     
   keeping the hover stable etc. is taken care of by the editor.

   JavaScript

   languages.registerHoverProvider('javascript', {
     provideHover(document, position, token) {
       return new Hover('I am a hover!');
     }
   });
   Registration is done using a document selector which is either a language id,       
   like javascript or a more complex filter like { language: 'typescript', scheme:     
   'file' }. Matching a document against such a selector will result in a score        
   that is used to determine if and how a provider shall be used. When scores are      
   equal the provider that came last wins. For features that allow full arity, like    
   hover, the score is only checked to be >0, for other features, like
   IntelliSense the score is used for determining the order in which providers are     
   asked to participate.

   Events
   onDidChangeDiagnostics: Event<DiagnosticChangeEvent>

   Functions
   createDiagnosticCollection(name?: string): DiagnosticCollection

   createLanguageStatusItem(id: string, selector: DocumentSelector):
   LanguageStatusItem

   getDiagnostics(resource: Uri): Diagnostic[]

   getDiagnostics(): Array<[Uri, Diagnostic[]]>

   getLanguages(): Thenable<string[]>

   match(selector: DocumentSelector, document: TextDocument): number

   registerCallHierarchyProvider(selector: DocumentSelector, provider:
   CallHierarchyProvider): Disposable

   registerCodeActionsProvider(selector: DocumentSelector, provider:
   CodeActionProvider<CodeAction>, metadata?: CodeActionProviderMetadata):
   Disposable

   registerCodeLensProvider(selector: DocumentSelector, provider:
   CodeLensProvider<CodeLens>): Disposable

   registerColorProvider(selector: DocumentSelector, provider:
   DocumentColorProvider): Disposable

   registerCompletionItemProvider(selector: DocumentSelector, provider:
   CompletionItemProvider<CompletionItem>, ...triggerCharacters: string[]):
   Disposable

   registerDeclarationProvider(selector: DocumentSelector, provider:
   DeclarationProvider): Disposable

   registerDefinitionProvider(selector: DocumentSelector, provider:
   DefinitionProvider): Disposable

   registerDocumentDropEditProvider(selector: DocumentSelector, provider:
   DocumentDropEditProvider<DocumentDropEdit>, metadata?:
   DocumentDropEditProviderMetadata): Disposable

   registerDocumentFormattingEditProvider(selector: DocumentSelector, provider:        
   DocumentFormattingEditProvider): Disposable

   registerDocumentHighlightProvider(selector: DocumentSelector, provider:
   DocumentHighlightProvider): Disposable

   registerDocumentLinkProvider(selector: DocumentSelector, provider:
   DocumentLinkProvider<DocumentLink>): Disposable

   registerDocumentPasteEditProvider(selector: DocumentSelector, provider:
   DocumentPasteEditProvider<DocumentPasteEdit>, metadata:
   DocumentPasteProviderMetadata): Disposable

   registerDocumentRangeFormattingEditProvider(selector: DocumentSelector,
   provider: DocumentRangeFormattingEditProvider): Disposable

   registerDocumentRangeSemanticTokensProvider(selector: DocumentSelector,
   provider: DocumentRangeSemanticTokensProvider, legend: SemanticTokensLegend):       
   Disposable

   registerDocumentSemanticTokensProvider(selector: DocumentSelector, provider:        
   DocumentSemanticTokensProvider, legend: SemanticTokensLegend): Disposable

   registerDocumentSymbolProvider(selector: DocumentSelector, provider:
   DocumentSymbolProvider, metaData?: DocumentSymbolProviderMetadata): Disposable      

   registerEvaluatableExpressionProvider(selector: DocumentSelector, provider:
   EvaluatableExpressionProvider): Disposable

   registerFoldingRangeProvider(selector: DocumentSelector, provider:
   FoldingRangeProvider): Disposable

   registerHoverProvider(selector: DocumentSelector, provider: HoverProvider):
   Disposable

   registerImplementationProvider(selector: DocumentSelector, provider:
   ImplementationProvider): Disposable

   registerInlayHintsProvider(selector: DocumentSelector, provider:
   InlayHintsProvider<InlayHint>): Disposable

   registerInlineCompletionItemProvider(selector: DocumentSelector, provider:
   InlineCompletionItemProvider): Disposable

   registerInlineValuesProvider(selector: DocumentSelector, provider:
   InlineValuesProvider): Disposable

   registerLinkedEditingRangeProvider(selector: DocumentSelector, provider:
   LinkedEditingRangeProvider): Disposable

   registerOnTypeFormattingEditProvider(selector: DocumentSelector, provider:
   OnTypeFormattingEditProvider, firstTriggerCharacter: string,
   ...moreTriggerCharacter: string[]): Disposable

   registerReferenceProvider(selector: DocumentSelector, provider:
   ReferenceProvider): Disposable

   registerRenameProvider(selector: DocumentSelector, provider: RenameProvider):       
   Disposable

   registerSelectionRangeProvider(selector: DocumentSelector, provider:
   SelectionRangeProvider): Disposable

   registerSignatureHelpProvider(selector: DocumentSelector, provider:
   SignatureHelpProvider, ...triggerCharacters: string[]): Disposable

   registerSignatureHelpProvider(selector: DocumentSelector, provider:
   SignatureHelpProvider, metadata: SignatureHelpProviderMetadata): Disposable

   registerTypeDefinitionProvider(selector: DocumentSelector, provider:
   TypeDefinitionProvider): Disposable

   registerTypeHierarchyProvider(selector: DocumentSelector, provider:
   TypeHierarchyProvider): Disposable

   registerWorkspaceSymbolProvider(provider:
   WorkspaceSymbolProvider<SymbolInformation>): Disposable

   setLanguageConfiguration(language: string, configuration:
   LanguageConfiguration): Disposable

   setTextDocumentLanguage(document: TextDocument, languageId: string):
   Thenable<TextDocument>

   lm
   Namespace for language model related functionality.

   Variables
   tools: readonly LanguageModelToolInformation[]

   Events
   onDidChangeChatModels: Event<void>

   Functions
   invokeTool(name: string, options: LanguageModelToolInvocationOptions<object>,       
   token?: CancellationToken): Thenable<LanguageModelToolResult>

   registerLanguageModelChatProvider(vendor: string, provider:
   LanguageModelChatProvider<LanguageModelChatInformation>): Disposable

   registerMcpServerDefinitionProvider(id: string, provider:
   McpServerDefinitionProvider<McpServerDefinition>): Disposable

   registerTool<T>(name: string, tool: LanguageModelTool<T>): Disposable

   selectChatModels(selector?: LanguageModelChatSelector):
   Thenable<LanguageModelChat[]>

   notebooks
   Namespace for notebooks.

   The notebooks functionality is composed of three loosely coupled components:        

   NotebookSerializer enable the editor to open, show, and save notebooks
   NotebookController own the execution of notebooks, e.g they create output from      
   code cells.
   NotebookRenderer present notebook output in the editor. They run in a separate      
   context.
   Functions
   createNotebookController(id: string, notebookType: string, label: string,
   handler?: (cells: NotebookCell[], notebook: NotebookDocument, controller:
   NotebookController) => void | Thenable<void>): NotebookController

   createRendererMessaging(rendererId: string): NotebookRendererMessaging

   registerNotebookCellStatusBarItemProvider(notebookType: string, provider:
   NotebookCellStatusBarItemProvider): Disposable

   scm
   Namespace for source control management.

   Variables
   inputBox: SourceControlInputBox

   Functions
   createSourceControl(id: string, label: string, rootUri?: Uri): SourceControl        

   tasks
   Namespace for tasks functionality.

   Variables
   taskExecutions: readonly TaskExecution[]

   Events
   onDidEndTask: Event<TaskEndEvent>

   onDidEndTaskProcess: Event<TaskProcessEndEvent>

   onDidStartTask: Event<TaskStartEvent>

   onDidStartTaskProcess: Event<TaskProcessStartEventonly Uri[]

   FilePermission
   Permissions of a file.

   Enumeration Members
   Readonly: 1

   FileRenameEvent
   An event that is fired after files are renamed.

   Properties
   files: ReadonlyArray<{newUri: Uri, oldUri: Uri}>

   FileStat
   The FileStat-type represents metadata about a file

   Properties
   ctime: number

   mtime: number

   permissions?: FilePermission

   size: number

   type: FileType

   FileSystem
   The file system interface exposes the editor's built-in and contributed file        
   system providers. It allows extensions to work
   A concrete QuickInput to let the user input a text value.

   Note that in many cases the more convenient window.showInputBox is easier to        
   use. window.createInputBox should be used when window.showInputBox does not
   offer the required flexibility.

   Events
   onDidAcc[Pasted text #4 +1312 lines]the extension to decide whether to accept       
   the user's input and if the [Pasted text #5 +2739 lines][Pasted text #6 +5
   lines] 
───────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ bypass permissions on (alt+m to cycle)                        ◯ IDE disconnected  
