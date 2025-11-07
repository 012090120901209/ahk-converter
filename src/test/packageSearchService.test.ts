import * as assert from 'assert';
import { PackageSearchService, PackageSearchResult } from '../../packageSearchService';

suite('PackageSearchService Test Suite', () => {
  let searchService: PackageSearchService;

  setup(() => {
    searchService = PackageSearchService.getInstance();
  });

  teardown(() => {
    // Clear cache between tests
    searchService.clearCache();
  });

  test('Should return instance', () => {
    assert.ok(searchService, 'Service instance should exist');
  });

  test('Should have valid categories', () => {
    const categories = searchService.getCategories();
    assert.ok(categories.length > 0, 'Should have at least one category');
    assert.ok(categories.includes('All'), 'Should include "All" category');
    assert.ok(categories.includes('GUI'), 'Should include "GUI" category');
    assert.ok(categories.includes('Networking'), 'Should include "Networking" category');
  });

  test('Should handle empty search query', async function() {
    // This test may take longer due to API calls
    this.timeout(30000);
    this.retries(2); // Retry on rate limit

    try {
      const results = await searchService.searchPackages('', undefined, 5);
      assert.ok(Array.isArray(results), 'Should return array of results');
      
      // Results may be empty if rate limited, but structure should be valid
      if (results.length > 0) {
        const firstResult = results[0];
        assert.ok(firstResult.name, 'Result should have name');
        assert.ok(firstResult.version, 'Result should have version');
        assert.ok(firstResult.description, 'Result should have description');
        assert.ok(typeof firstResult.stars === 'number', 'Result should have star count');
      }
    } catch (error: any) {
      // Allow rate limit errors in tests
      if (error.message.includes('rate limit')) {
        console.log('Skipping test due to GitHub rate limit');
        this.skip();
      } else {
        throw error;
      }
    }
  });

  test('Should handle specific search query', async function() {
    this.timeout(30000);
    this.retries(2);

    try {
      const results = await searchService.searchPackages('JSON', undefined, 5);
      assert.ok(Array.isArray(results), 'Should return array of results');
      
      // Check result structure
      results.forEach(result => {
        assert.ok(result.name, 'Each result should have name');
        assert.ok(result.version, 'Each result should have version');
        assert.ok(result.repositoryUrl, 'Each result should have repository URL');
      });
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
        console.log('Skipping test due to GitHub rate limit');
        this.skip();
      } else {
        throw error;
      }
    }
  });

  test('Should apply filters correctly', async function() {
    this.timeout(30000);
    this.retries(2);

    try {
      const results = await searchService.searchPackages(
        'gui',
        {
          category: 'GUI',
          sortBy: 'stars',
          sortOrder: 'desc'
        },
        10
      );

      assert.ok(Array.isArray(results), 'Should return array of results');
      
      // Verify sorting if we have results
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          assert.ok(
            results[i].stars >= results[i + 1].stars,
            'Results should be sorted by stars descending'
          );
        }
      }
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
        console.log('Skipping test due to GitHub rate limit');
        this.skip();
      } else {
        throw error;
      }
    }
  });

  test('Should cache search results', async function() {
    this.timeout(30000);
    this.retries(2);

    try {
      // First search
      const results1 = await searchService.searchPackages('test', undefined, 3);
      const stats1 = searchService.getStats();
      const githubRequests1 = stats1.githubStats.requestCount;

      // Second identical search (should use cache)
      const results2 = await searchService.searchPackages('test', undefined, 3);
      const stats2 = searchService.getStats();
      const githubRequests2 = stats2.githubStats.requestCount;

      // Request count should not increase (cache hit)
      assert.strictEqual(
        githubRequests1,
        githubRequests2,
        'Second search should use cache, not make new API calls'
      );

      // Results should be identical
      assert.strictEqual(
        results1.length,
        results2.length,
        'Cached results should match original'
      );
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
        console.log('Skipping test due to GitHub rate limit');
        this.skip();
      } else {
        throw error;
      }
    }
  });

  test('Should clear cache', () => {
    searchService.clearCache();
    const stats = searchService.getStats();
    assert.strictEqual(stats.cacheSize, 0, 'Cache should be empty after clear');
  });

  test('Should handle errors gracefully', async function() {
    this.timeout(30000);

    // Test with invalid query that might cause errors
    try {
      const results = await searchService.searchPackages(
        'definitely-not-a-real-package-xyz-123456',
        undefined,
        1
      );
      // Should return empty array, not throw
      assert.ok(Array.isArray(results), 'Should return empty array for no results');
    } catch (error: any) {
      // Only acceptable errors are rate limits or network issues
      assert.ok(
        error.message.includes('rate limit') || 
        error.message.includes('Failed to search'),
        'Should only throw rate limit or network errors'
      );
    }
  });
});
