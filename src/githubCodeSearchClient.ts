import * as https from 'https';
import * as vscode from 'vscode';

export interface GitHubSearchResult {
  name: string;
  path: string;
  repository: {
    full_name: string;
    html_url: string;
    description?: string;
    stargazers_count: number;
    updated_at: string;
  };
  html_url: string;
  score: number;
}

export interface GitHubReleaseInfo {
  tag_name: string;
  published_at: string;
  html_url: string;
}

interface GitHubApiOptions {
  method: string;
  hostname: string;
  path: string;
  headers: {
    'User-Agent': string;
    'Accept': string;
    'Authorization'?: string;
  };
}

/**
 * Client for searching GitHub code and fetching repository content
 * Handles rate limiting and authentication
 */
export class GitHubCodeSearchClient {
  private static instance: GitHubCodeSearchClient | undefined;
  private readonly baseUrl = 'api.github.com';
  private readonly userAgent = 'vscode-ahkv2-toolbox';
  private token: string | undefined;
  private rateLimitRemaining: number = 10;
  private rateLimitReset: number = 0;
  private requestCount: number = 0;
  private failureCount: number = 0;

  private constructor() {
    this.loadToken();
  }

  public static getInstance(): GitHubCodeSearchClient {
    if (!GitHubCodeSearchClient.instance) {
      GitHubCodeSearchClient.instance = new GitHubCodeSearchClient();
    }
    return GitHubCodeSearchClient.instance;
  }

  /**
   * Load GitHub token from VS Code settings or secrets
   */
  private loadToken(): void {
    const config = vscode.workspace.getConfiguration('ahkv2Toolbox');
    this.token = config.get<string>('githubToken');
  }

  /**
   * Update the GitHub token
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Check if we're being rate limited
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 1 && Date.now() < this.rateLimitReset) {
      const waitTime = Math.ceil((this.rateLimitReset - Date.now()) / 1000);
      throw new Error(`GitHub rate limit exceeded. Please wait ${waitTime} seconds.`);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
    const baseDelay = 1000;
    const maxDelay = 16000;
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a request to the GitHub API with retry logic
   */
  private async request<T>(path: string, attempt: number = 0): Promise<T> {
    await this.checkRateLimit();

    const options: GitHubApiOptions = {
      method: 'GET',
      hostname: this.baseUrl,
      path,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (this.token) {
      options.headers['Authorization'] = `token ${this.token}`;
    }

    try {
      const result = await new Promise<T>((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';

          // Update rate limit info from headers
          if (res.headers['x-ratelimit-remaining']) {
            this.rateLimitRemaining = parseInt(res.headers['x-ratelimit-remaining'] as string, 10);
          }
          if (res.headers['x-ratelimit-reset']) {
            this.rateLimitReset = parseInt(res.headers['x-ratelimit-reset'] as string, 10) * 1000;
          }

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                this.requestCount++;
                this.failureCount = 0; // Reset failure count on success
                resolve(JSON.parse(data));
              } catch (error) {
                reject(new Error('Failed to parse GitHub API response'));
              }
            } else if (res.statusCode === 403) {
              // Check if it's a rate limit error
              const retryAfter = res.headers['retry-after'];
              if (retryAfter) {
                reject(new Error(`Rate limited. Retry after ${retryAfter} seconds`));
              } else {
                reject(new Error('GitHub API rate limit exceeded or authentication required'));
              }
            } else if (res.statusCode === 422) {
              reject(new Error('GitHub search query validation failed'));
            } else if (res.statusCode === 502 || res.statusCode === 503 || res.statusCode === 504) {
              // Server errors - retry
              reject(new Error(`GitHub API server error: ${res.statusCode}`));
            } else {
              reject(new Error(`GitHub API error: ${res.statusCode} ${res.statusMessage}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(new Error(`GitHub API request failed: ${error.message}`));
        });

        // Set timeout
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('GitHub API request timeout'));
        });

        req.end();
      });

      return result;
    } catch (error) {
      this.failureCount++;

      // Determine if we should retry
      const shouldRetry = attempt < 3 &&
        error instanceof Error &&
        (error.message.includes('timeout') ||
         error.message.includes('server error') ||
         error.message.includes('Rate limited'));

      if (shouldRetry) {
        const delay = this.calculateBackoff(attempt);
        console.log(`GitHub API request failed, retrying in ${delay}ms (attempt ${attempt + 1}/3)`);
        await this.sleep(delay);
        return this.request<T>(path, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Get request statistics
   */
  public getStats(): { requestCount: number; failureCount: number; rateLimitRemaining: number } {
    return {
      requestCount: this.requestCount,
      failureCount: this.failureCount,
      rateLimitRemaining: this.rateLimitRemaining
    };
  }

  /**
   * Search for code files on GitHub
   * @param query Search query (e.g., "GuiEnhancerKit.ahk")
   * @param maxResults Maximum number of results to return
   */
  public async searchCode(query: string, maxResults: number = 10): Promise<GitHubSearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const path = `/search/code?q=${encodedQuery}+language:AutoHotkey&per_page=${maxResults}&sort=stars&order=desc`;

      const response = await this.request<{ items: GitHubSearchResult[] }>(path);

      return response.items || [];
    } catch (error) {
      console.error('GitHub code search failed:', error);
      throw error;
    }
  }

  /**
   * Search for repositories on GitHub
   * @param query Search query (e.g., "GuiEnhancerKit")
   * @param maxResults Maximum number of results to return
   */
  public async searchRepositories(query: string, maxResults: number = 10): Promise<GitHubSearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(`${query} language:AutoHotkey`);
      const path = `/search/repositories?q=${encodedQuery}&per_page=${maxResults}&sort=stars&order=desc`;

      const response = await this.request<{ items: any[] }>(path);

      // Map repository results to the same structure as code search results
      return (response.items || []).map(repo => ({
        name: repo.name,
        path: '',
        repository: {
          full_name: repo.full_name,
          html_url: repo.html_url,
          description: repo.description,
          stargazers_count: repo.stargazers_count,
          updated_at: repo.updated_at
        },
        html_url: repo.html_url,
        score: repo.score
      }));
    } catch (error) {
      console.error('GitHub repository search failed:', error);
      throw error;
    }
  }

  /**
   * Fetch file content from a GitHub repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param path File path in the repository
   */
  public async getFileContent(owner: string, repo: string, filePath: string): Promise<string> {
    try {
      const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
      const path = `/repos/${owner}/${repo}/contents/${encodedPath}`;

      const response = await this.request<{ content: string; encoding: string }>(path);

      if (response.encoding === 'base64') {
        return Buffer.from(response.content, 'base64').toString('utf-8');
      }

      return response.content;
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      throw error;
    }
  }

  /**
   * Get the latest release information for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  public async getLatestRelease(owner: string, repo: string): Promise<GitHubReleaseInfo | null> {
    try {
      const path = `/repos/${owner}/${repo}/releases/latest`;
      const response = await this.request<GitHubReleaseInfo>(path);
      return response;
    } catch (error) {
      // Repository might not have releases
      return null;
    }
  }

  /**
   * Get repository information
   * @param owner Repository owner
   * @param repo Repository name
   */
  public async getRepository(owner: string, repo: string): Promise<any> {
    try {
      const path = `/repos/${owner}/${repo}`;
      return await this.request(path);
    } catch (error) {
      console.error('Failed to fetch repository info:', error);
      throw error;
    }
  }

  /**
   * Extract repository owner and name from a GitHub URL
   */
  public static parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    }
    return null;
  }
}
