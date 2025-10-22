import * as vscode from 'vscode';
import { FunctionAnalyzer } from './functionAnalyzer';
import { FunctionMetadata } from './models/functionMetadata';

export class FunctionMetadataHandler {
  private static instance: FunctionMetadataHandler;
  private metadataCache: Map<string, { metadata: FunctionMetadata[], version: number }> = new Map();

  private constructor() {}

  static getInstance(): FunctionMetadataHandler {
    if (!this.instance) {
      this.instance = new FunctionMetadataHandler();
    }
    return this.instance;
  }

  getFunctionMetadata(uri: vscode.Uri, position?: vscode.Position): FunctionMetadata[] | FunctionMetadata | null {
    const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
    
    if (!document) return null;

    // Check cache first
    const cached = this.metadataCache.get(uri.toString());
    if (cached && cached.version === document.version) {
      if (position) {
        return FunctionAnalyzer.getFunctionMetadataAtPosition(document, position);
      }
      return cached.metadata;
    }

    // Extract and cache metadata
    const metadata = FunctionAnalyzer.extractFunctionMetadata(document);
    this.metadataCache.set(uri.toString(), {
      metadata,
      version: document.version
    });

    if (position) {
      return FunctionAnalyzer.getFunctionMetadataAtPosition(document, position);
    }
    return metadata;
  }

  // LSP-style request handler
  static registerFunctionMetadataRequest(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand('ahk.getFunctionMetadata', (uri: vscode.Uri, position?: vscode.Position) => {
        return this.getInstance().getFunctionMetadata(uri, position);
      })
    );
  }
}