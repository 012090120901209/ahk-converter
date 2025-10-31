import * as assert from 'assert';
import { MetadataExtractor, LibraryMetadata } from '../metadataExtractor';

suite('MetadataExtractor Test Suite', () => {
  test('extractFromFileContent - complete header', () => {
    const content = `/************************************************************************
 * @description Test library for AHK
 * @file TestLib.ahk
 * @author John Doe
 * @link https://github.com/johndoe/testlib
 * @date 2024/01/15
 * @version 1.0.0
 ***********************************************************************/

class TestClass {
  __New() {
  }
}`;

    const metadata = MetadataExtractor.extractFromFileContent(content);

    assert.strictEqual(metadata.description, 'Test library for AHK');
    assert.strictEqual(metadata.file, 'TestLib.ahk');
    assert.strictEqual(metadata.author, 'John Doe');
    assert.strictEqual(metadata.link, 'https://github.com/johndoe/testlib');
    assert.strictEqual(metadata.date, '2024/01/15');
    assert.strictEqual(metadata.version, '1.0.0');
  });

  test('extractFromFileContent - partial header', () => {
    const content = `/************************************************************************
 * @description Test library
 * @author John Doe
 ***********************************************************************/

class TestClass {
}`;

    const metadata = MetadataExtractor.extractFromFileContent(content);

    assert.strictEqual(metadata.description, 'Test library');
    assert.strictEqual(metadata.author, 'John Doe');
    assert.strictEqual(metadata.file, undefined);
    assert.strictEqual(metadata.link, undefined);
  });

  test('extractFromFileContent - no header', () => {
    const content = `class TestClass {
  __New() {
  }
}`;

    const metadata = MetadataExtractor.extractFromFileContent(content);

    assert.strictEqual(Object.keys(metadata).length, 0);
  });

  test('extractFromReadme - description from first paragraph', () => {
    const readme = `# TestLib

This is a test library for AutoHotkey v2 development.

## Installation

Install via package manager.`;

    const metadata = MetadataExtractor.extractFromReadme(readme);

    assert.ok(metadata.description);
    assert.ok(metadata.description!.includes('test library'));
  });

  test('normalizeDate - various formats', () => {
    assert.strictEqual(MetadataExtractor.normalizeDate('2024-01-15'), '2024/01/15');
    assert.strictEqual(MetadataExtractor.normalizeDate('2024/01/15'), '2024/01/15');
    assert.strictEqual(MetadataExtractor.normalizeDate('2024-01-15T10:30:00Z'), '2024/01/15');
  });

  test('normalizeVersion - semver format', () => {
    assert.strictEqual(MetadataExtractor.normalizeVersion('1.0.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.normalizeVersion('v1.0.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.normalizeVersion('v 1.0.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.normalizeVersion('1.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.normalizeVersion('2'), '2.0.0');
  });

  test('normalizeGitHubUrl - various formats', () => {
    assert.strictEqual(
      MetadataExtractor.normalizeGitHubUrl('https://github.com/user/repo.git'),
      'https://github.com/user/repo'
    );
    assert.strictEqual(
      MetadataExtractor.normalizeGitHubUrl('git@github.com:user/repo'),
      'https://github.com/user/repo'
    );
    assert.strictEqual(
      MetadataExtractor.normalizeGitHubUrl('git://github.com/user/repo'),
      'https://github.com/user/repo'
    );
  });

  test('getMissingFields - identifies missing fields', () => {
    const metadata: Partial<LibraryMetadata> = {
      description: 'Test',
      author: 'John Doe'
    };

    const missing = MetadataExtractor.getMissingFields(metadata);

    assert.ok(missing.includes('file'));
    assert.ok(missing.includes('link'));
    assert.ok(missing.includes('date'));
    assert.ok(missing.includes('version'));
    assert.strictEqual(missing.includes('description'), false);
    assert.strictEqual(missing.includes('author'), false);
  });

  test('mergeMetadata - combines multiple sources', () => {
    const source1: Partial<LibraryMetadata> = {
      description: 'First description',
      author: 'John'
    };

    const source2: Partial<LibraryMetadata> = {
      author: 'Jane', // Should not override
      link: 'https://github.com/test',
      version: '1.0.0'
    };

    const merged = MetadataExtractor.mergeMetadata(source1, source2);

    assert.strictEqual(merged.description, 'First description');
    assert.strictEqual(merged.author, 'John'); // First source takes precedence
    assert.strictEqual(merged.link, 'https://github.com/test');
    assert.strictEqual(merged.version, '1.0.0');
  });

  test('formatAsHeader - formats metadata correctly', () => {
    const metadata: LibraryMetadata = {
      description: 'Test library',
      file: 'TestLib.ahk',
      author: 'John Doe',
      link: 'https://github.com/johndoe/testlib',
      date: '2024/01/15',
      version: '1.0.0'
    };

    const header = MetadataExtractor.formatAsHeader(metadata);

    assert.ok(header.includes('@description Test library'));
    assert.ok(header.includes('@file TestLib.ahk'));
    assert.ok(header.includes('@author John Doe'));
    assert.ok(header.includes('@link https://github.com/johndoe/testlib'));
    assert.ok(header.includes('@date 2024/01/15'));
    assert.ok(header.includes('@version 1.0.0'));
    assert.ok(header.startsWith('/***'));
    assert.ok(header.endsWith('***/'));
  });

  test('rankSearchResults - scores exact matches higher', () => {
    const results = [
      {
        name: 'SomeOtherLib.ahk',
        repository: {
          full_name: 'user1/other',
          html_url: 'https://github.com/user1/other',
          stargazers_count: 100,
          updated_at: '2024-01-01'
        },
        score: 50
      },
      {
        name: 'TestLib.ahk',
        repository: {
          full_name: 'user2/testlib',
          html_url: 'https://github.com/user2/testlib',
          stargazers_count: 10,
          updated_at: '2024-01-01'
        },
        score: 30
      }
    ];

    const ranked = MetadataExtractor.rankSearchResults('TestLib.ahk', results);

    // Exact filename match should be ranked first despite lower stars
    assert.strictEqual(ranked[0].name, 'TestLib.ahk');
  });

  test('extractVersionFromRelease - removes common prefixes', () => {
    assert.strictEqual(MetadataExtractor.extractVersionFromRelease('v1.0.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.extractVersionFromRelease('version-1.0.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.extractVersionFromRelease('release-1.0.0'), '1.0.0');
    assert.strictEqual(MetadataExtractor.extractVersionFromRelease('1.0.0'), '1.0.0');
  });
});
