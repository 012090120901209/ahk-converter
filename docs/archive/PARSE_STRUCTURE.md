Prompt: Implement AutoHotkey v2 function introspection in the vscode-autohotkey2-lsp repository.

Goal:
Add a robust server-side Function Introspection feature that statically extracts function metadata (parameters, local variables, static variables, defaults, min/max params, location, docs) from AutoHotkey v2 source and exposes it to the client via a stable LSP request. Use the existing lexer/AST in server/src to avoid duplicating parsing. Wire the client to consume metadata for Hover, Outline augmentation (DocumentSymbol), completions, diagnostics, and tests. Keep heavy work server-side and reuse LSP plumbing.

High-level requirements:
- Add a small, explicit server-side DTO: FunctionMetadata, Parameter, VariableInfo.
- Implement a server-side analyzer that builds FunctionMetadata from the repo's lexers/AhkSymbol/FuncNode structures (reuse lexers[] in server).
- Register an LSP request 'ahk/getFunctionMetadata' that accepts { uri: string, position?: { line, character } } and returns FunctionMetadata[] or a single FunctionMetadata for the function at position.
- Keep parser and heavy logic on server; the client calls the request via the LanguageClient (client.sendRequest).
- Provide client-side helpers to request metadata and integrate into Hover provider and DocumentSymbol provider (augment or replace where appropriate).
- Add unit tests and integration tests that call the new LSP request and validate metadata shape and content.
- Provide caching/incremental reanalysis plan: reuse lexers' update lifecycle and attach versioning to metadata to avoid re-parsing unchanged functions.
- Keep payloads small and stable; include only needed fields in DTOs.

Technical details (exact expectations & names)
1) DTOs (server side)
- server/src/models/FunctionMetadata.ts
  - export interface Parameter { name: string; isByRef: boolean; hasDefault: boolean; defaultValue?: string; position: number; }
  - export interface VariableInfo { name: string; scope: 'static' | 'local' | 'global'; type?: string; declarationLine: number; declarationCharacter: number; }
  - export interface FunctionMetadata { name: string; parameters: Parameter[]; staticVariables: VariableInfo[]; localVariables: VariableInfo[]; minParams: number; maxParams: number | 'variadic'; location: { startLine:number; startCharacter:number; endLine:number; endCharacter:number }; documentation?: string; version?: number; }

2) Analyzer (server side)
- server/src/functionAnalyzer.ts
  - Function getFunctionMetadataForUri(uri: string): FunctionMetadata[]
    - Use existing lexers[uri] to enumerate function/method declarations.
    - For each function node, extract:
      - params with by-ref/default flags and default value text
      - static variables (from function node properties or by scanning token ranges in node body)
      - local variables (first assignments inside function that are not params or statics)
      - minParams (count non-default params)
      - maxParams (params.length or 'variadic' if symbol indicates)
      - location from symbol.range or selectionRange (map to simple start/end numbers)
      - documentation from preceding comment blocks where available
      - version: derive from lexer's document.version or lex.d to help cache invalidation
    - Defensive behavior: if lexers[uri] is missing, return [].

  - Function getFunctionMetadataAtPosition(uri: string, line: number, character: number): FunctionMetadata | null
    - Find the function containing the position and return its metadata (null if none).

3) LSP request registration
- server/src/connection.ts (or the getRequestHandlers function the repo uses)
  - Register handler:
    connection.onRequest('ahk/getFunctionMetadata', (params: { uri: string, position?: { line:number, character:number } }) => {
      if (params.position) return getFunctionMetadataAtPosition(params.uri, params.position.line, params.position.character);
      return getFunctionMetadataForUri(params.uri);
    });

4) Client helper & usage
- client/src/functionClient.ts
  - export function getFunctionMetadata(client: LanguageClient, uri: string) => Promise<FunctionMetadata[]>
  - export function getFunctionMetadataAtPosition(client: LanguageClient, uri: string, position) => Promise<FunctionMetadata | null>

- Integrate into client usage:
  - Hover provider: when hovering a symbol name, call getFunctionMetadataAtPosition; if metadata exists, render a Markdown hover showing signature, param annotations, list of static/local variables and documentation.
  - Symbol provider / Outline: either
    - Augment server-side documentSymbolProvider (preferred) to include children DocumentSymbols for static/local variables using existing DocumentSymbol creation logic on server; OR
    - Client can call ahk/getFunctionMetadata and add DocumentSymbol children for each function (ensure ranges map to workspace positions).
  - Completions: use metadata to improve parameter hints / completion details (client-side or server-side depending on where current completion logic is).

5) Tests
- server tests (unit):
  - server/test/functionAnalyzer.test.ts (new)
    - validate parse of params, by-ref, defaults, static/local extraction on sample code strings (mock or reuse small helper lexers).
- integration (client):
  - client/src/test/extension.test.ts
    - add new tests that call client.sendRequest('ahk/getFunctionMetadata', { uri }) and assert metadata contains expected functions, parameters, and statics for a sample file in repo.

6) Caching & incremental updates
- Use existing lexers keyed by URI and their document.version (or lex.d) to compute FunctionMetadata.version.
- Cache metadata per-function inside analyzer with key = uri + functionName + functionRange + documentVersion.
- On document changes, only recompute functions whose ranges intersect the change ranges.

7) Diagnostics and advanced checks (server)
- Optionally augment analyzer to produce Diagnostics for:
  - duplicate static/local names within a function
  - parameter/variable name conflicts
  - suspicious default value types (best-effort)
- Publish via connection.sendDiagnostics or existing diagnostics pipeline in server.

8) Performance considerations
- Keep analyzer lightweight:
  - Use existing AST/lexer nodes for accurate info rather than re-scanning token-by-token when possible.
  - For very large files, support background incremental updates and consider offloading heavy work to worker threads only if profiling shows need.

9) Acceptance criteria (tests & manual)
- Automated test coverage added: unit + integration.
- Manually: opening a sample .ahk2 file and viewing the Outline must show functions; expanding a function shows static/local variables in Outline (if implemented on server) or Hover shows function metadata.
- LSP request returns DTO for a sample URI with correct param names and counts in automated tests.

10) Implementation notes for this repository (thqby/vscode-autohotkey2-lsp)
- The repo already has:
  - server/src/lexer.ts (deep lexer/AST)
  - server/src/symbolProvider.ts (document symbols)
  - server/src/connection.ts (LSP initialize and getRequestHandlers)
  - client/src/extension.ts (client side activation)
- Implement the new server files in server/src and register the request using the repo's getRequestHandlers or directly with connection.onRequest in connection.ts where other custom requests are registered.
- Client modifications should be minimal: add client/src/functionClient.ts and call the request from existing client Hover provider or add a new Hover provider registration in client/src/extension.ts using the LanguageClient instance the extension already returns/uses.

Quality constraints:
- TypeScript types for DTOs and handlers.
- Small and stable payloads (no raw AST objects across the wire).
- Unit tests must be runnable with the repo's existing test harness.
- Keep public request name 'ahk/getFunctionMetadata' — stable and documented.

Deliverables:
- New server files: server/src/models/FunctionMetadata.ts, server/src/functionAnalyzer.ts
- connection.ts update: register 'ahk/getFunctionMetadata' handler
- client helper: client/src/functionClient.ts
- small client integrations: modify client/src/extension.ts to call metadata for Hover or Outline (examples included in tests)
- unit + integration tests: server/test/functionAnalyzer.test.ts, client/src/test/extension.test.ts additions
- README update snippet describing new LSP request and usage

Acceptance test procedure:
1. Run unit tests: pass
2. Launch extension in dev host and open a sample ahk2 file with annotated functions:
   - Verify Outline shows functions and children (statics/locals) or Hover shows full metadata.
3. Run integration test that calls client.sendRequest('ahk/getFunctionMetadata', { uri }) and checks the DTO.

If any part of the repo types/AST require exact mapping, examine server/src/lexer.ts and server/src/symbolProvider.ts to map fields (name, params, selectionRange/range) and convert to DTO. Prefer reusing declaration maps (lex.declaration) and the already-parsed FuncNode shape.

Security and stability:
- Do not execute untrusted code; analysis must be static.
- Limit worker/thread usage to controlled parsing tasks.

Output you must produce when you implement:
- Exact new files and changes (file diffs or new files with paths).
- New tests and sample fixture files used by tests.
- Short README snippet describing new LSP request and examples.
- A short migration note if documentSymbolProvider behavior changed.

End of prompt.