import * as assert from 'assert';
import { MetadataCache } from '../metadataCache';
import { LibraryMetadata } from '../metadataExtractor';

suite('MetadataCache Test Suite', () => {
  let cache: MetadataCache;

  setup(() => {
    cache = MetadataCache.getInstance();
    cache.clear(); // Clear cache before each test
  });

  teardown(() => {
    cache.clear();
  });

  test('set and get - stores and retrieves metadata', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test library',
      author: 'John Doe',
      version: '1.0.0'
    };
    const sources = ['GitHub', 'https://github.com/user/repo'];

    cache.set('TestLib.ahk', metadata, sources);
    const result = cache.get('TestLib.ahk');

    assert.ok(result);
    assert.deepStrictEqual(result!.metadata, metadata);
    assert.deepStrictEqual(result!.sources, sources);
  });

  test('get - returns undefined for non-existent key', () => {
    const result = cache.get('NonExistent.ahk');

    assert.strictEqual(result, undefined);
  });

  test('has - returns true for existing entry', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test'
    };

    cache.set('TestLib.ahk', metadata, ['GitHub']);

    assert.strictEqual(cache.has('TestLib.ahk'), true);
  });

  test('has - returns false for non-existent entry', () => {
    assert.strictEqual(cache.has('NonExistent.ahk'), false);
  });

  test('delete - removes entry from cache', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test'
    };

    cache.set('TestLib.ahk', metadata, ['GitHub']);
    assert.strictEqual(cache.has('TestLib.ahk'), true);

    cache.delete('TestLib.ahk');
    assert.strictEqual(cache.has('TestLib.ahk'), false);
  });

  test('clear - removes all entries', () => {
    cache.set('TestLib1.ahk', { description: 'Test 1' }, ['GitHub']);
    cache.set('TestLib2.ahk', { description: 'Test 2' }, ['GitHub']);

    cache.clear();

    assert.strictEqual(cache.has('TestLib1.ahk'), false);
    assert.strictEqual(cache.has('TestLib2.ahk'), false);
  });

  test('filename normalization - case insensitive', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test'
    };

    cache.set('TestLib.ahk', metadata, ['GitHub']);

    // Should find with different case
    assert.ok(cache.get('testlib.ahk'));
    assert.ok(cache.get('TESTLIB.AHK'));
    assert.ok(cache.has('TestLib.AHK'));
  });

  test('filename normalization - handles paths', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test'
    };

    cache.set('C:\\Users\\test\\Lib\\TestLib.ahk', metadata, ['GitHub']);

    // Should find with just filename
    assert.ok(cache.get('TestLib.ahk'));
  });

  test('filename normalization - handles .ahk2 extension', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test'
    };

    cache.set('TestLib.ahk2', metadata, ['GitHub']);

    // Should find with .ahk extension
    assert.ok(cache.get('TestLib.ahk'));
  });

  test('TTL expiration - returns undefined after expiry', async () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test'
    };

    // Set TTL to 100ms for testing
    (cache as any).TTL = 100;

    cache.set('TestLib.ahk', metadata, ['GitHub']);
    assert.ok(cache.get('TestLib.ahk'));

    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 150));

    const result = cache.get('TestLib.ahk');
    assert.strictEqual(result, undefined);

    // Restore original TTL
    (cache as any).TTL = 1000 * 60 * 60 * 24;
  });

  test('clearExpired - removes only expired entries', async () => {
    const metadata1: Partial<LibraryMetadata> = { description: 'Test 1' };
    const metadata2: Partial<LibraryMetadata> = { description: 'Test 2' };

    // Set short TTL for testing
    (cache as any).TTL = 100;

    cache.set('TestLib1.ahk', metadata1, ['GitHub']);

    // Wait 150ms
    await new Promise(resolve => setTimeout(resolve, 150));

    cache.set('TestLib2.ahk', metadata2, ['GitHub']);

    // Clear expired
    cache.clearExpired();

    // TestLib1 should be removed, TestLib2 should remain
    assert.strictEqual(cache.has('TestLib1.ahk'), false);
    assert.strictEqual(cache.has('TestLib2.ahk'), true);

    // Restore original TTL
    (cache as any).TTL = 1000 * 60 * 60 * 24;
  });

  test('getStats - returns cache statistics', () => {
    cache.set('TestLib1.ahk', { description: 'Test 1' }, ['GitHub']);
    cache.set('TestLib2.ahk', { description: 'Test 2' }, ['GitHub']);

    const stats = cache.getStats();

    assert.strictEqual(stats.size, 2);
    assert.ok(stats.oldestEntry !== null);
    assert.ok(stats.newestEntry !== null);
    assert.ok(stats.newestEntry! >= stats.oldestEntry!);
  });

  test('getStats - empty cache', () => {
    const stats = cache.getStats();

    assert.strictEqual(stats.size, 0);
    assert.strictEqual(stats.oldestEntry, null);
    assert.strictEqual(stats.newestEntry, null);
  });

  test('singleton pattern - returns same instance', () => {
    const instance1 = MetadataCache.getInstance();
    const instance2 = MetadataCache.getInstance();

    assert.strictEqual(instance1, instance2);
  });

  test('sources tracking - preserves provenance', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test library'
    };
    const sources = [
      'GitHub Code Search',
      'https://github.com/user/repo',
      'README.md extraction'
    ];

    cache.set('TestLib.ahk', metadata, sources);
    const result = cache.get('TestLib.ahk');

    assert.ok(result);
    assert.strictEqual(result!.sources.length, 3);
    assert.deepStrictEqual(result!.sources, sources);
  });
});
