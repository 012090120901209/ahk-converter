import * as vscode from 'vscode';
import { FunctionAnalyzer } from './functionAnalyzer';
import { FunctionMetadata } from './functionMetadata';

export class AHKHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument, 
    position: vscode.Position, 
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const functionMetadata = FunctionAnalyzer.getFunctionMetadataAtPosition(document, position);
    
    if (!functionMetadata) return null;

    const hoverContent = this.createHoverMarkdown(functionMetadata);
    
    return new vscode.Hover(hoverContent);
  }

  private createHoverMarkdown(metadata: FunctionMetadata): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    
    // Function signature
    markdown.appendMarkdown(`**Function**: \`${metadata.name}\`\n\n`);
    
    // Parameters
    markdown.appendMarkdown(`**Parameters**:\n`);
    metadata.parameters.forEach(param => {
      markdown.appendMarkdown(`- \`${param.isByRef ? '&' : ''}${param.name}\`` + 
        `${param.hasDefault ? ` = \`${param.defaultValue}\`` : ''}\n`);
    });
    
    // Static Variables
    if (metadata.staticVariables.length > 0) {
      markdown.appendMarkdown(`\n**Static Variables**:\n`);
      metadata.staticVariables.forEach(variable => {
        markdown.appendMarkdown(`- \`${variable.name}\`\n`);
      });
    }
    
    // Local Variables
    if (metadata.localVariables.length > 0) {
      markdown.appendMarkdown(`\n**Local Variables**:\n`);
      metadata.localVariables.forEach(variable => {
        markdown.appendMarkdown(`- \`${variable.name}\`\n`);
      });
    }
    
    // Location
    markdown.appendMarkdown(`\n**Location**: Line ${metadata.location.startLine + 1} - ${metadata.location.endLine + 1}`);
    
    markdown.isTrusted = true;
    return markdown;
  }
}