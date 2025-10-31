import { LibraryMetadata } from './metadataExtractor';

interface CacheEntry {
  metadata: Partial<LibraryMetadata>;
  timestamp: number;
  sources: string[];
}

/**
 * Simple in-memory cache for library metadata
 * Helps reduce GitHub API calls and improve performance
 */
export class MetadataCache {
  private static instance: MetadataCache | undefined;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 1000 * 60 * 60 * 24; // 24 hours

  private constructor() {}

  public static getInstance(): MetadataCache {
    if (!MetadataCache.instance) {
      MetadataCache.instance = new MetadataCache();
    }
    return MetadataCache.instance;
  }

  /**
   * Get cached metadata for a library
   * @param filename Library filename (e.g., "GuiEnhancerKit.ahk")
   * @returns Cached metadata or undefined if not found/expired
   */
  public get(filename: string): { metadata: Partial<LibraryMetadata>; sources: string[] } | undefined {
    const normalized = this.normalizeFilename(filename);
    const entry = this.cache.get(normalized);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(normalized);
      return undefined;
    }

    return {
      metadata: entry.metadata,
      sources: entry.sources
    };
  }

  /**
   * Store metadata in cache
   * @param filename Library filename
   * @param metadata Metadata to cache
   * @param sources List of sources where metadata was found
   */
  public set(filename: string, metadata: Partial<LibraryMetadata>, sources: string[]): void {
    const normalized = this.normalizeFilename(filename);

    this.cache.set(normalized, {
      metadata,
      timestamp: Date.now(),
      sources
    });
  }

  /**
   * Check if metadata exists in cache and is valid
   * @param filename Library filename
   * @returns True if cached and not expired
   */
  public has(filename: string): boolean {
    const normalized = this.normalizeFilename(filename);
    const entry = this.cache.get(normalized);

    if (!entry) {
      return false;
    }

    // Check expiration
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(normalized);
      return false;
    }

    return true;
  }

  /**
   * Clear a specific entry from cache
   * @param filename Library filename
   */
  public delete(filename: string): void {
    const normalized = this.normalizeFilename(filename);
    this.cache.delete(normalized);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  public clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; oldestEntry: number | null; newestEntry: number | null } {
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (newestEntry === null || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Normalize filename for consistent cache keys
   */
  private normalizeFilename(filename: string): string {
    // Extract just the filename without path
    const parts = filename.replace(/\\/g, '/').split('/');
    const name = parts[parts.length - 1];

    // Normalize case and extension
    return name.toLowerCase().replace(/\.ahk2?$/i, '.ahk');
  }
}
