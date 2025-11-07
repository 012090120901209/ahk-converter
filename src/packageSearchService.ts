import * as vscode from 'vscode';
import { GitHubCodeSearchClient, GitHubSearchResult } from './githubCodeSearchClient';

/**
 * Represents a package search result with rich metadata
 */
export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  author: string;
  repositoryUrl: string;
  stars: number;
  lastUpdated: Date;
  category?: string;
  tags?: string[];
  downloadUrl?: string;
  rawUrl?: string;
  readmeUrl?: string;
}

/**
 * Search filters for refining package search results
 */
export interface SearchFilters {
  category?: string;
  minStars?: number;
  sortBy?: 'stars' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Service for searching AHK v2 packages from various sources
 */
export class PackageSearchService {
  private static instance: PackageSearchService | undefined;
  private githubClient: GitHubCodeSearchClient;
  private searchCache: Map<string, PackageSearchResult[]> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastSearchTime: Map<string, number> = new Map();

  // Popular topics and categories for AHK v2 packages
  private readonly popularTopics = [
    'autohotkey-v2',
    'ahk-v2',
    'ahk2',
    'autohotkey',
    'ahk-library',
    'ahk-script'
  ];

  private readonly categories = {
    'GUI': ['gui', 'window', 'interface', 'ui'],
    'Networking': ['http', 'socket', 'api', 'rest', 'web'],
    'File Operations': ['file', 'io', 'filesystem', 'directory'],
    'System': ['system', 'process', 'registry', 'wmi'],
    'Parsing': ['json', 'xml', 'csv', 'parser', 'regex'],
    'Utilities': ['util', 'helper', 'tool', 'lib'],
    'Gaming': ['game', 'gaming', 'overlay'],
    'Automation': ['automation', 'macro', 'hotkey'],
    'Testing': ['test', 'testing', 'framework', 'unit-test']
  };

  private constructor() {
    this.githubClient = GitHubCodeSearchClient.getInstance();
  }

  public static getInstance(): PackageSearchService {
    if (!PackageSearchService.instance) {
      PackageSearchService.instance = new PackageSearchService();
    }
    return PackageSearchService.instance;
  }

  /**
   * Search for AHK v2 packages
   * @param query Search query (package name, keyword, or empty for popular packages)
   * @param filters Optional filters for refining results
   * @param maxResults Maximum number of results to return
   */
  public async searchPackages(
    query: string,
    filters?: SearchFilters,
    maxResults: number = 30
  ): Promise<PackageSearchResult[]> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query, filters);
      if (this.isCacheValid(cacheKey)) {
        const cached = this.searchCache.get(cacheKey);
        if (cached) {
          console.log('Returning cached search results');
          return cached;
        }
      }

      let results: PackageSearchResult[] = [];

      if (!query || query.trim() === '') {
        // If no query, show popular/trending AHK v2 packages
        results = await this.getPopularPackages(maxResults);
      } else {
        // Search GitHub for packages matching the query
        results = await this.searchGitHub(query, maxResults);
      }

      // Apply filters
      if (filters) {
        results = this.applyFilters(results, filters);
      }

      // Cache the results
      this.searchCache.set(cacheKey, results);
      this.lastSearchTime.set(cacheKey, Date.now());

      return results;
    } catch (error) {
      console.error('Package search failed:', error);
      throw new Error(
        `Failed to search packages: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search GitHub for AHK packages
   */
  private async searchGitHub(query: string, maxResults: number): Promise<PackageSearchResult[]> {
    const results: PackageSearchResult[] = [];

    try {
      // Search for repositories with the query + AutoHotkey v2
      const searchQuery = `${query} language:AutoHotkey topic:autohotkey-v2`;
      const githubResults = await this.githubClient.searchRepositories(searchQuery, maxResults);

      // Also search for code files with .ahk extension
      const codeQuery = `${query} extension:ahk`;
      const codeResults = await this.githubClient.searchCode(codeQuery, Math.floor(maxResults / 2));

      // Combine and deduplicate results
      const allResults = [...githubResults, ...codeResults];
      const seen = new Set<string>();

      for (const result of allResults) {
        const repoFullName = result.repository.full_name;
        
        if (seen.has(repoFullName)) {
          continue;
        }
        seen.add(repoFullName);

        const packageResult = this.convertGitHubResult(result);
        if (packageResult) {
          results.push(packageResult);
        }

        if (results.length >= maxResults) {
          break;
        }
      }
    } catch (error) {
      console.error('GitHub search failed:', error);
      // Continue with empty results rather than failing completely
    }

    return results;
  }

  /**
   * Get popular/trending AHK v2 packages
   */
  private async getPopularPackages(maxResults: number): Promise<PackageSearchResult[]> {
    const results: PackageSearchResult[] = [];

    try {
      // Search for repositories with autohotkey-v2 topic, sorted by stars
      for (const topic of this.popularTopics.slice(0, 2)) {
        const searchQuery = `topic:${topic} language:AutoHotkey`;
        const githubResults = await this.githubClient.searchRepositories(
          searchQuery,
          Math.floor(maxResults / 2)
        );

        for (const result of githubResults) {
          const packageResult = this.convertGitHubResult(result);
          if (packageResult && !results.find(r => r.repositoryUrl === packageResult.repositoryUrl)) {
            results.push(packageResult);
          }
        }

        if (results.length >= maxResults) {
          break;
        }
      }
    } catch (error) {
      console.error('Failed to fetch popular packages:', error);
    }

    // Sort by stars descending
    results.sort((a, b) => b.stars - a.stars);
    return results.slice(0, maxResults);
  }

  /**
   * Convert GitHub search result to PackageSearchResult
   * Note: Version is set to 1.0.0 as fetching from releases would require
   * additional API calls per package, which could quickly exhaust rate limits
   */
  private convertGitHubResult(result: GitHubSearchResult): PackageSearchResult | null {
    try {
      const repo = result.repository;
      const [owner, repoName] = repo.full_name.split('/');

      // Default version - fetching from GitHub releases would require
      // one API call per result which could exhaust rate limits
      const version = '1.0.0';

      // Determine category from repository topics/description
      const category = this.inferCategory(repo.description || '');

      // Extract main .ahk file URL if this is a code search result
      let downloadUrl: string | undefined;
      let rawUrl: string | undefined;
      
      if (result.path) {
        // This is a code search result with a specific file
        downloadUrl = result.html_url;
        rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/main/${result.path}`;
      } else {
        // Repository search result - assume main file is in root or check common locations
        downloadUrl = `${repo.html_url}/blob/main/${repoName}.ahk`;
        rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/main/${repoName}.ahk`;
      }

      return {
        name: result.name || repoName,
        version,
        description: repo.description || 'No description available',
        author: owner,
        repositoryUrl: repo.html_url,
        stars: repo.stargazers_count,
        lastUpdated: new Date(repo.updated_at),
        category,
        downloadUrl,
        rawUrl,
        readmeUrl: `${repo.html_url}#readme` // GitHub always shows README section if it exists
      };
    } catch (error) {
      console.error('Failed to convert GitHub result:', error);
      return null;
    }
  }

  /**
   * Infer package category from description or name
   */
  private inferCategory(text: string): string {
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(this.categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'Utilities';
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: PackageSearchResult[], filters: SearchFilters): PackageSearchResult[] {
    let filtered = [...results];

    // Filter by category
    if (filters.category && filters.category !== 'All') {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    // Filter by minimum stars
    if (filters.minStars !== undefined) {
      filtered = filtered.filter(r => r.stars >= filters.minStars!);
    }

    // Sort results
    if (filters.sortBy) {
      filtered = this.sortResults(filtered, filters.sortBy, filters.sortOrder || 'desc');
    }

    return filtered;
  }

  /**
   * Sort results by specified field
   */
  private sortResults(
    results: PackageSearchResult[],
    sortBy: 'stars' | 'updated' | 'name',
    order: 'asc' | 'desc'
  ): PackageSearchResult[] {
    const sorted = [...results];
    const multiplier = order === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'stars':
          comparison = a.stars - b.stars;
          break;
        case 'updated':
          comparison = a.lastUpdated.getTime() - b.lastUpdated.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return comparison * multiplier;
    });

    return sorted;
  }

  /**
   * Get available categories for filtering
   */
  public getCategories(): string[] {
    return ['All', ...Object.keys(this.categories)];
  }

  /**
   * Clear the search cache
   */
  public clearCache(): void {
    this.searchCache.clear();
    this.lastSearchTime.clear();
  }

  /**
   * Generate cache key from query and filters
   */
  private getCacheKey(query: string, filters?: SearchFilters): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${query}:${filterStr}`;
  }

  /**
   * Check if cached results are still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const lastTime = this.lastSearchTime.get(cacheKey);
    if (!lastTime) {
      return false;
    }
    return Date.now() - lastTime < this.cacheTimeout;
  }

  /**
   * Get search statistics
   */
  public getStats() {
    return {
      cacheSize: this.searchCache.size,
      githubStats: this.githubClient.getStats()
    };
  }
}
