import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { LibraryAttributionParticipant } from '../libraryAttributionParticipant';
import { GitHubCodeSearchClient } from '../githubCodeSearchClient';
import { MetadataCache } from '../metadataCache';
import { LibraryMetadata } from '../metadataExtractor';

suite('LibraryAttributionParticipant Test Suite', () => {
  let participant: LibraryAttributionParticipant;
  let githubClientStub: sinon.SinonStubbedInstance<GitHubCodeSearchClient>;
  let cacheStub: sinon.SinonStubbedInstance<MetadataCache>;

  setup(() => {
    participant = new LibraryAttributionParticipant();

    // Get singleton instances to stub
    const githubClient = GitHubCodeSearchClient.getInstance();
    const cache = MetadataCache.getInstance();

    // Create stubs
    githubClientStub = sinon.stub(githubClient);
    cacheStub = sinon.stub(cache);
  });

  teardown(() => {
    sinon.restore();
  });

  test('attributeLibrary - returns existing metadata if complete', async () => {
    const completeMetadata: LibraryMetadata = {
      description: 'Complete library',
      file: 'TestLib.ahk',
      author: 'John Doe',
      link: 'https://github.com/user/repo',
      date: '2024/01/15',
      version: '1.0.0'
    };

    // Mock file content with complete metadata
    const mockDocument = {
      getText: () => `/************************************************************************
 * @description Complete library
 * @file TestLib.ahk
 * @author John Doe
 * @link https://github.com/user/repo
 * @date 2024/01/15
 * @version 1.0.0
 ***********************************************************************/

class TestClass { }`
    };

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);

    const result = await participant.attributeLibrary('/test/path/TestLib.ahk');

    assert.ok(result);
    assert.strictEqual(result!.description, 'Complete library');
    assert.strictEqual(result!.version, '1.0.0');
  });

  test('attributeLibrary - returns cached metadata if available', async () => {
    const cachedMetadata: Partial<LibraryMetadata> = {
      description: 'Cached library',
      author: 'Jane Doe',
      version: '2.0.0'
    };

    const mockDocument = {
      getText: () => `/************************************************************************
 * @description Partial library
 ***********************************************************************/`
    };

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);
    cacheStub.get.returns({
      metadata: cachedMetadata,
      sources: ['GitHub', 'https://github.com/user/repo']
    });

    const result = await participant.attributeLibrary('/test/path/TestLib.ahk');

    assert.ok(result);
    assert.strictEqual(result!.version, '2.0.0');
    assert.strictEqual(result!.author, 'Jane Doe');
  });

  test('attributeLibrary - searches GitHub if metadata missing', async () => {
    const mockDocument = {
      getText: () => `class TestClass { }`
    };

    const mockSearchResults = [
      {
        name: 'TestLib.ahk',
        path: 'Lib/TestLib.ahk',
        repository: {
          full_name: 'user/testlib',
          html_url: 'https://github.com/user/testlib',
          description: 'Test library repository',
          stargazers_count: 50,
          updated_at: '2024-01-15T10:00:00Z'
        },
        html_url: 'https://github.com/user/testlib/blob/main/Lib/TestLib.ahk',
        score: 50
      }
    ];

    const mockFileContent = `/************************************************************************
 * @description Test library from GitHub
 * @file TestLib.ahk
 * @author GitHub User
 * @version 1.5.0
 ***********************************************************************/`;

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);
    cacheStub.get.returns(undefined);
    githubClientStub.searchCode.resolves(mockSearchResults as any);
    githubClientStub.getFileContent.resolves(mockFileContent);
    githubClientStub.getLatestRelease.resolves({
      tag_name: 'v1.5.0',
      published_at: '2024-01-15T10:00:00Z',
      html_url: 'https://github.com/user/testlib/releases/tag/v1.5.0'
    });

    const result = await participant.attributeLibrary('/test/path/TestLib.ahk');

    assert.ok(result);
    assert.ok(githubClientStub.searchCode.called);
  });

  test('attributeLibrary - falls back to repository search if no code matches', async () => {
    const mockDocument = {
      getText: () => `class TestClass { }`
    };

    const mockRepoResults = [
      {
        name: 'testlib',
        path: '',
        repository: {
          full_name: 'user/testlib',
          html_url: 'https://github.com/user/testlib',
          description: 'Test library repository',
          stargazers_count: 50,
          updated_at: '2024-01-15T10:00:00Z'
        },
        html_url: 'https://github.com/user/testlib',
        score: 40
      }
    ];

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);
    cacheStub.get.returns(undefined);
    githubClientStub.searchCode.resolves([]);
    githubClientStub.searchRepositories.resolves(mockRepoResults as any);
    githubClientStub.getLatestRelease.resolves({
      tag_name: 'v1.0.0',
      published_at: '2024-01-15T10:00:00Z',
      html_url: 'https://github.com/user/testlib/releases/tag/v1.0.0'
    });

    const result = await participant.attributeLibrary('/test/path/TestLib.ahk');

    assert.ok(result);
    assert.ok(githubClientStub.searchCode.called);
    assert.ok(githubClientStub.searchRepositories.called);
  });

  test('attributeLibrary - returns null if no results found', async () => {
    const mockDocument = {
      getText: () => `class TestClass { }`
    };

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);
    cacheStub.get.returns(undefined);
    githubClientStub.searchCode.resolves([]);
    githubClientStub.searchRepositories.resolves([]);

    const result = await participant.attributeLibrary('/test/path/TestLib.ahk');

    assert.strictEqual(result, null);
  });

  test('attributeLibrary - preserves existing metadata fields', async () => {
    const mockDocument = {
      getText: () => `/************************************************************************
 * @description My custom description
 * @author My Name
 ***********************************************************************/`
    };

    const discoveredMetadata: Partial<LibraryMetadata> = {
      description: 'GitHub description',
      author: 'GitHub Author',
      version: '1.0.0',
      link: 'https://github.com/user/repo',
      date: '2024/01/15'
    };

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);
    cacheStub.get.returns({
      metadata: discoveredMetadata,
      sources: ['GitHub']
    });

    const result = await participant.attributeLibrary('/test/path/TestLib.ahk');

    assert.ok(result);
    // Existing fields should be preserved
    assert.strictEqual(result!.description, 'My custom description');
    assert.strictEqual(result!.author, 'My Name');
    // Discovered fields should be added
    assert.strictEqual(result!.version, '1.0.0');
    assert.strictEqual(result!.link, 'https://github.com/user/repo');
  });

  test('attributeLibrary - handles errors gracefully', async () => {
    sinon.stub(vscode.workspace, 'openTextDocument').rejects(new Error('File not found'));

    const result = await participant.attributeLibrary('/test/path/NonExistent.ahk');

    assert.strictEqual(result, null);
  });

  test('attributeLibrary - caches successful discoveries', async () => {
    const mockDocument = {
      getText: () => `class TestClass { }`
    };

    const mockSearchResults = [
      {
        name: 'TestLib.ahk',
        path: 'Lib/TestLib.ahk',
        repository: {
          full_name: 'user/testlib',
          html_url: 'https://github.com/user/testlib',
          description: 'Test library',
          stargazers_count: 50,
          updated_at: '2024-01-15T10:00:00Z'
        },
        html_url: 'https://github.com/user/testlib/blob/main/Lib/TestLib.ahk',
        score: 50
      }
    ];

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);
    cacheStub.get.returns(undefined);
    githubClientStub.searchCode.resolves(mockSearchResults as any);
    githubClientStub.getFileContent.resolves(`class TestClass { }`);

    await participant.attributeLibrary('/test/path/TestLib.ahk');

    // Verify cache.set was called
    assert.ok(cacheStub.set.called);
  });

  test('needsAttribution - detects missing metadata', async () => {
    const mockDocument = {
      getText: () => `/************************************************************************
 * @description Test library
 ***********************************************************************/`
    };

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);

    const needs = await LibraryAttributionParticipant.needsAttribution('/test/path/TestLib.ahk');

    assert.strictEqual(needs, true);
  });

  test('needsAttribution - returns false for complete metadata', async () => {
    const mockDocument = {
      getText: () => `/************************************************************************
 * @description Test library
 * @file TestLib.ahk
 * @author John Doe
 * @link https://github.com/user/repo
 * @date 2024/01/15
 * @version 1.0.0
 ***********************************************************************/`
    };

    sinon.stub(vscode.workspace, 'openTextDocument').resolves(mockDocument as any);

    const needs = await LibraryAttributionParticipant.needsAttribution('/test/path/TestLib.ahk');

    assert.strictEqual(needs, false);
  });

  test('needsAttribution - handles errors gracefully', async () => {
    sinon.stub(vscode.workspace, 'openTextDocument').rejects(new Error('File not found'));

    const needs = await LibraryAttributionParticipant.needsAttribution('/test/path/NonExistent.ahk');

    assert.strictEqual(needs, false);
  });
});
