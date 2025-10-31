import * as vscode from 'vscode';
import * as path from 'path';
import { GitHubCodeSearchClient, GitHubSearchResult } from './githubCodeSearchClient';
import { MetadataExtractor, LibraryMetadata } from './metadataExtractor';
import { MetadataCache } from './metadataCache';
import { getTelemetryManager, LibraryAttributionTelemetryData } from './telemetry';

/**
 * Chat participant for discovering and filling in missing library metadata
 * Searches GitHub and other sources to complete library header information
 */
export class LibraryAttributionParticipant {
  private githubClient: GitHubCodeSearchClient;
  private cache: MetadataCache;
  private enabled: boolean = true;

  constructor() {
    this.githubClient = GitHubCodeSearchClient.getInstance();
    this.cache = MetadataCache.getInstance();
    this.loadConfiguration();
  }

  /**
   * Load configuration settings
   */
  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
    this.enabled = config.get<boolean>('libraryAttribution.enabled', true);
  }

  /**
   * Main handler for library attribution requests
   * Can be invoked via chat participant or directly
   */
  public async attributeLibrary(
    filePath: string,
    stream?: vscode.ChatResponseStream
  ): Promise<LibraryMetadata | null> {
    const startTime = Date.now();
    const filename = path.basename(filePath);
    let cacheHit = false;
    let fieldsDiscovered: string[] = [];
    let sources: string[] = [];
    let success = false;
    let errorType: string | undefined;
    let errorMessage: string | undefined;

    // Track GitHub API calls
    const githubClientBefore = this.githubClient.getStats();

    if (!this.enabled) {
      if (stream) {
        stream.markdown('Library attribution is disabled in settings.\n\n');
      }
      return null;
    }

    try {
      // Read the file
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();

      // Extract existing metadata
      const existingMetadata = MetadataExtractor.extractFromFileContent(content);
      const missingFields = MetadataExtractor.getMissingFields(existingMetadata);

      if (missingFields.length === 0) {
        if (stream) {
          stream.markdown('✅ All metadata fields are already complete!\n\n');
        }
        success = true;
        // Record telemetry
        this.recordTelemetry(filename, startTime, success, cacheHit, fieldsDiscovered, sources, githubClientBefore);
        return existingMetadata;
      }

      if (stream) {
        stream.markdown(`🔍 Searching for library metadata...\n\n`);
        stream.markdown(`Missing fields: ${missingFields.map(f => `\`${f}\``).join(', ')}\n\n`);
      }

      // Check cache first
      const cached = this.cache.get(filename);
      if (cached) {
        cacheHit = true;
        sources = cached.sources;
        fieldsDiscovered = Object.keys(cached.metadata).filter(
          key => cached.metadata[key as keyof LibraryMetadata]
        );

        if (stream) {
          stream.markdown(`✨ Found cached metadata (from ${cached.sources.join(', ')})\n\n`);
        }
        const mergedMetadata = this.mergePreservingExisting(existingMetadata, cached.metadata);
        if (stream) {
          this.displayMetadataResult(mergedMetadata, cached.metadata, stream, cached.sources);
        }

        success = true;
        // Record telemetry
        this.recordTelemetry(filename, startTime, success, cacheHit, fieldsDiscovered, sources, githubClientBefore);
        return mergedMetadata;
      }

      const discoveredResult = await this.discoverMetadata(filename, stream);

      if (!discoveredResult) {
        if (stream) {
          stream.markdown('❌ Could not find metadata for this library.\n\n');
        }
        errorType = 'NotFound';
        errorMessage = 'Could not find metadata for this library';
        // Record telemetry
        this.recordTelemetry(filename, startTime, false, cacheHit, fieldsDiscovered, sources, githubClientBefore, errorType, errorMessage);
        return null;
      }

      sources = discoveredResult.sources;
      fieldsDiscovered = Object.keys(discoveredResult.metadata).filter(
        key => discoveredResult.metadata[key as keyof LibraryMetadata]
      );

      // Cache the discovered metadata
      this.cache.set(filename, discoveredResult.metadata, discoveredResult.sources);

      // Merge discovered metadata with existing (never overwrite existing fields)
      const mergedMetadata = this.mergePreservingExisting(existingMetadata, discoveredResult.metadata);

      // Format and display the result
      if (stream) {
        this.displayMetadataResult(mergedMetadata, discoveredResult.metadata, stream, discoveredResult.sources);
      }

      success = true;
      // Record telemetry
      this.recordTelemetry(filename, startTime, success, cacheHit, fieldsDiscovered, sources, githubClientBefore);
      return mergedMetadata;
    } catch (error) {
      if (stream) {
        stream.markdown(`\n\n❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
      }
      console.error('Library attribution error:', error);
      errorType = 'Exception';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Record telemetry
      this.recordTelemetry(filename, startTime, false, cacheHit, fieldsDiscovered, sources, githubClientBefore, errorType, errorMessage);
      return null;
    }
  }

  /**
   * Record telemetry for library attribution
   */
  private recordTelemetry(
    libraryName: string,
    startTime: number,
    success: boolean,
    cacheHit: boolean,
    fieldsDiscovered: string[],
    sources: string[],
    githubClientBefore: { requestCount: number; failureCount: number; rateLimitRemaining: number },
    errorType?: string,
    errorMessage?: string
  ): void {
    try {
      const telemetry = getTelemetryManager();
      const githubClientAfter = this.githubClient.getStats();
      const githubApiCalls = githubClientAfter.requestCount - githubClientBefore.requestCount;
      const processingTime = Date.now() - startTime;

      const telemetryData: LibraryAttributionTelemetryData = {
        libraryName,
        success,
        cacheHit,
        fieldsDiscovered,
        sources,
        githubApiCalls,
        processingTime,
        errorType,
        errorMessage
      };

      telemetry.recordLibraryAttribution(telemetryData);
    } catch (error) {
      // Fail silently - telemetry should never break the main flow
      console.error('Failed to record telemetry:', error);
    }
  }

  /**
   * Discover metadata from GitHub and other sources
   */
  private async discoverMetadata(
    filename: string,
    stream?: vscode.ChatResponseStream
  ): Promise<{ metadata: Partial<LibraryMetadata>; sources: string[] } | null> {
    try {
      // First, search for the exact filename
      if (stream) {
        stream.markdown(`Searching GitHub for \`${filename}\`...\n\n`);
      }

      const codeResults = await this.githubClient.searchCode(filename, 5);

      // Rank results by relevance
      const rankedResults = MetadataExtractor.rankSearchResults(filename, codeResults);

      if (rankedResults.length === 0) {
        // Try searching repositories instead
        const baseFilename = filename.replace(/\.(ahk|ahk2)$/i, '');
        if (stream) {
          stream.markdown(`No code matches found. Searching repositories for \`${baseFilename}\`...\n\n`);
        }

        const repoResults = await this.githubClient.searchRepositories(baseFilename, 5);
        if (repoResults.length === 0) {
          return null;
        }

        const metadata = await this.extractFromRepository(repoResults[0], filename, stream);
        return { metadata, sources: ['GitHub Repository Search'] };
      }

      // Use the best match
      const bestMatch = rankedResults[0];
      if (stream) {
        stream.markdown(`📦 Found match: [${bestMatch.repository.full_name}](${bestMatch.repository.html_url})\n\n`);
      }

      const metadata = await this.extractFromSearchResult(bestMatch, filename, stream);
      return { metadata, sources: ['GitHub Code Search', bestMatch.repository.html_url] };
    } catch (error) {
      if (stream) {
        stream.markdown(`⚠️ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`);
      }
      return null;
    }
  }

  /**
   * Extract metadata from a code search result
   */
  private async extractFromSearchResult(
    result: GitHubSearchResult,
    filename: string,
    stream?: vscode.ChatResponseStream
  ): Promise<Partial<LibraryMetadata>> {
    const metadata: Partial<LibraryMetadata> = {};
    const repoInfo = GitHubCodeSearchClient.parseGitHubUrl(result.repository.html_url);

    if (!repoInfo) {
      return metadata;
    }

    // Set the link
    metadata.link = MetadataExtractor.normalizeGitHubUrl(result.repository.html_url);

    // Try to fetch the actual file content to extract metadata
    try {
      const fileContent = await this.githubClient.getFileContent(repoInfo.owner, repoInfo.repo, result.path);
      const extractedMetadata = MetadataExtractor.extractFromFileContent(fileContent);

      Object.assign(metadata, extractedMetadata);
    } catch (error) {
      if (stream) {
        stream.markdown(`⚠️ Could not fetch file content, using repository info...\n\n`);
      }
    }

    // Try to fetch README if we still need more info
    if (!metadata.description || !metadata.author) {
      try {
        const readmeContent = await this.githubClient.getFileContent(repoInfo.owner, repoInfo.repo, 'README.md');
        const readmeMetadata = MetadataExtractor.extractFromReadme(readmeContent);

        if (readmeMetadata.description && !metadata.description) {
          metadata.description = readmeMetadata.description;
        }
        if (readmeMetadata.author && !metadata.author) {
          metadata.author = readmeMetadata.author;
        }
      } catch {
        // README might not exist
      }
    }

    // Fallback to repository info
    if (!metadata.description && result.repository.description) {
      metadata.description = result.repository.description;
    }

    if (!metadata.author) {
      metadata.author = repoInfo.owner;
    }

    // Set filename
    if (!metadata.file) {
      metadata.file = filename;
    }

    // Get version and date from latest release
    try {
      const release = await this.githubClient.getLatestRelease(repoInfo.owner, repoInfo.repo);
      if (release) {
        if (!metadata.version) {
          metadata.version = MetadataExtractor.extractVersionFromRelease(release.tag_name);
        }
        if (!metadata.date) {
          metadata.date = MetadataExtractor.normalizeDate(release.published_at);
        }
      }
    } catch {
      // No releases available
    }

    // Fallback to repository update date
    if (!metadata.date) {
      metadata.date = MetadataExtractor.normalizeDate(result.repository.updated_at);
    }

    return metadata;
  }

  /**
   * Extract metadata from a repository search result
   */
  private async extractFromRepository(
    result: GitHubSearchResult,
    filename: string,
    stream?: vscode.ChatResponseStream
  ): Promise<Partial<LibraryMetadata>> {
    const metadata: Partial<LibraryMetadata> = {};
    const repoInfo = GitHubCodeSearchClient.parseGitHubUrl(result.repository.html_url);

    if (!repoInfo) {
      return metadata;
    }

    metadata.link = MetadataExtractor.normalizeGitHubUrl(result.repository.html_url);
    metadata.file = filename;

    // Use repository description
    if (result.repository.description) {
      metadata.description = result.repository.description;
    }

    // Use repository owner as author
    metadata.author = repoInfo.owner;

    // Get version and date from latest release
    try {
      const release = await this.githubClient.getLatestRelease(repoInfo.owner, repoInfo.repo);
      if (release) {
        metadata.version = MetadataExtractor.extractVersionFromRelease(release.tag_name);
        metadata.date = MetadataExtractor.normalizeDate(release.published_at);
      }
    } catch {
      // Fallback to repository update date
      metadata.date = MetadataExtractor.normalizeDate(result.repository.updated_at);
    }

    return metadata;
  }

  /**
   * Merge discovered metadata with existing, never overwriting existing fields
   */
  private mergePreservingExisting(
    existing: Partial<LibraryMetadata>,
    discovered: Partial<LibraryMetadata>
  ): LibraryMetadata {
    const merged: LibraryMetadata = { ...discovered } as LibraryMetadata;

    // Existing values always take precedence
    for (const key of Object.keys(existing) as (keyof LibraryMetadata)[]) {
      if (existing[key]) {
        merged[key] = existing[key];
      }
    }

    return merged;
  }

  /**
   * Display the metadata result in the chat
   */
  private displayMetadataResult(
    merged: LibraryMetadata,
    discovered: Partial<LibraryMetadata>,
    stream: vscode.ChatResponseStream,
    sources: string[]
  ): void {
    stream.markdown('✅ **Metadata discovered!**\n\n');

    // Show the formatted header
    const formattedHeader = MetadataExtractor.formatAsHeader(merged);
    stream.markdown('```autohotkey\n' + formattedHeader + '\n```\n\n');

    // Show which fields were filled
    const filledFields = Object.keys(discovered).filter(
      key => discovered[key as keyof LibraryMetadata]
    );

    if (filledFields.length > 0) {
      stream.markdown('**Fields filled:**\n');
      for (const field of filledFields) {
        const value = discovered[field as keyof LibraryMetadata];
        stream.markdown(`- \`${field}\`: ${value}\n`);
      }
      stream.markdown('\n');
    }

    // Show provenance note with sources
    stream.markdown('\n---\n\n');
    stream.markdown('**📋 Provenance:**\n');
    for (const source of sources) {
      stream.markdown(`- ${source}\n`);
    }
    stream.markdown('\n💡 *Please verify accuracy before using.*\n\n');
  }

  /**
   * Check if a file needs metadata attribution
   */
  public static async needsAttribution(filePath: string): Promise<boolean> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const content = document.getText();
      const metadata = MetadataExtractor.extractFromFileContent(content);
      const missingFields = MetadataExtractor.getMissingFields(metadata);

      return missingFields.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Register the library attribution chat participant
 */
export function registerLibraryAttributionParticipant(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const participant = new LibraryAttributionParticipant();

  // Register as a command for direct invocation
  const attributeCommand = vscode.commands.registerCommand(
    'ahkv2Toolbox.attributeLibrary',
    async (uri?: vscode.Uri) => {
      const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.fileName;

      if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
      }

      if (!filePath.match(/\.(ahk|ahk2)$/i)) {
        vscode.window.showErrorMessage('Please select an AHK file');
        return;
      }

      // Check if it's a Lib file
      if (!filePath.includes('/Lib/') && !filePath.includes('\\Lib\\')) {
        const proceed = await vscode.window.showWarningMessage(
          'This file is not in a Lib folder. Continue anyway?',
          'Yes',
          'No'
        );

        if (proceed !== 'Yes') {
          return;
        }
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Discovering library metadata...',
          cancellable: false
        },
        async () => {
          const metadata = await participant.attributeLibrary(filePath);

          if (metadata) {
            const formattedHeader = MetadataExtractor.formatAsHeader(metadata);

            // Offer to insert the header
            const choice = await vscode.window.showInformationMessage(
              'Metadata discovered! Would you like to insert it into the file?',
              'Insert',
              'Copy to Clipboard',
              'Cancel'
            );

            if (choice === 'Insert') {
              const editor = await vscode.window.showTextDocument(vscode.Uri.file(filePath));
              await editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), formattedHeader + '\n\n');
              });
              vscode.window.showInformationMessage('Metadata header inserted!');
            } else if (choice === 'Copy to Clipboard') {
              await vscode.env.clipboard.writeText(formattedHeader);
              vscode.window.showInformationMessage('Metadata header copied to clipboard!');
            }
          } else {
            vscode.window.showWarningMessage('Could not discover metadata for this library.');
          }
        }
      );
    }
  );

  context.subscriptions.push(attributeCommand);

  return {
    dispose: () => {
      attributeCommand.dispose();
    }
  };
}
