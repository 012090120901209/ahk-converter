import * as assert from 'assert';
import * as sinon from 'sinon';
import { GitHubCodeSearchClient, GitHubSearchResult, GitHubReleaseInfo } from '../githubCodeSearchClient';

suite('GitHubCodeSearchClient Test Suite', () => {
  let client: GitHubCodeSearchClient;
  let requestStub: sinon.SinonStub;

  setup(() => {
    client = GitHubCodeSearchClient.getInstance();
  });

  teardown(() => {
    if (requestStub) {
      requestStub.restore();
    }
  });

  test('searchCode - returns search results', async () => {
    const mockResults: GitHubSearchResult[] = [
      {
        name: 'TestLib.ahk',
        path: 'Lib/TestLib.ahk',
        repository: {
          full_name: 'user/repo',
          html_url: 'https://github.com/user/repo',
          description: 'Test repository',
          stargazers_count: 100,
          updated_at: '2024-01-15T10:00:00Z'
        },
        html_url: 'https://github.com/user/repo/blob/main/Lib/TestLib.ahk',
        score: 50
      }
    ];

    // Mock the private request method
    requestStub = sinon.stub(client as any, 'request').resolves({ items: mockResults });

    const results = await client.searchCode('TestLib.ahk', 5);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'TestLib.ahk');
    assert.strictEqual(results[0].repository.full_name, 'user/repo');
  });

  test('searchCode - handles empty results', async () => {
    requestStub = sinon.stub(client as any, 'request').resolves({ items: [] });

    const results = await client.searchCode('NonExistentLib.ahk', 5);

    assert.strictEqual(results.length, 0);
  });

  test('searchRepositories - returns repository results', async () => {
    const mockRepos = [
      {
        name: 'testlib',
        full_name: 'user/testlib',
        html_url: 'https://github.com/user/testlib',
        description: 'Test library repository',
        stargazers_count: 50,
        updated_at: '2024-01-15T10:00:00Z',
        score: 40
      }
    ];

    requestStub = sinon.stub(client as any, 'request').resolves({ items: mockRepos });

    const results = await client.searchRepositories('testlib', 5);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].repository.full_name, 'user/testlib');
  });

  test('getFileContent - decodes base64 content', async () => {
    const testContent = 'class TestClass { }';
    const base64Content = Buffer.from(testContent).toString('base64');

    requestStub = sinon.stub(client as any, 'request').resolves({
      content: base64Content,
      encoding: 'base64'
    });

    const content = await client.getFileContent('user', 'repo', 'TestLib.ahk');

    assert.strictEqual(content, testContent);
  });

  test('getLatestRelease - returns release info', async () => {
    const mockRelease: GitHubReleaseInfo = {
      tag_name: 'v1.0.0',
      published_at: '2024-01-15T10:00:00Z',
      html_url: 'https://github.com/user/repo/releases/tag/v1.0.0'
    };

    requestStub = sinon.stub(client as any, 'request').resolves(mockRelease);

    const release = await client.getLatestRelease('user', 'repo');

    assert.ok(release);
    assert.strictEqual(release!.tag_name, 'v1.0.0');
    assert.strictEqual(release!.published_at, '2024-01-15T10:00:00Z');
  });

  test('getLatestRelease - handles no releases', async () => {
    requestStub = sinon.stub(client as any, 'request').rejects(new Error('Not Found'));

    const release = await client.getLatestRelease('user', 'repo');

    assert.strictEqual(release, null);
  });

  test('parseGitHubUrl - extracts owner and repo', () => {
    const result = GitHubCodeSearchClient.parseGitHubUrl('https://github.com/user/repo');

    assert.ok(result);
    assert.strictEqual(result!.owner, 'user');
    assert.strictEqual(result!.repo, 'repo');
  });

  test('parseGitHubUrl - handles .git suffix', () => {
    const result = GitHubCodeSearchClient.parseGitHubUrl('https://github.com/user/repo.git');

    assert.ok(result);
    assert.strictEqual(result!.owner, 'user');
    assert.strictEqual(result!.repo, 'repo');
  });

  test('parseGitHubUrl - returns null for invalid URL', () => {
    const result = GitHubCodeSearchClient.parseGitHubUrl('https://example.com/user/repo');

    assert.strictEqual(result, null);
  });

  test('request retry logic - retries on timeout', async () => {
    // First two calls fail with timeout, third succeeds
    const mockResults = { items: [] };
    let callCount = 0;

    requestStub = sinon.stub(client as any, 'request');
    requestStub.callsFake(async function(this: any, path: string, attempt: number = 0) {
      if (requestStub.wrappedMethod) {
        // Call original method
        return requestStub.wrappedMethod.call(this, path, attempt);
      }

      callCount++;
      if (callCount <= 2) {
        throw new Error('GitHub API request timeout');
      }
      return mockResults;
    });

    // This should succeed after retries
    const results = await (client as any).request('/test/path');

    assert.strictEqual(callCount, 3); // Failed twice, succeeded on third
  });

  test('getStats - returns request statistics', () => {
    const stats = client.getStats();

    assert.ok(stats.hasOwnProperty('requestCount'));
    assert.ok(stats.hasOwnProperty('failureCount'));
    assert.ok(stats.hasOwnProperty('rateLimitRemaining'));
    assert.strictEqual(typeof stats.requestCount, 'number');
    assert.strictEqual(typeof stats.failureCount, 'number');
    assert.strictEqual(typeof stats.rateLimitRemaining, 'number');
  });

  test('rate limit handling - throws error when rate limited', async () => {
    // Set rate limit to 0 and reset time in future
    (client as any).rateLimitRemaining = 0;
    (client as any).rateLimitReset = Date.now() + 60000; // 1 minute in future

    try {
      await (client as any).checkRateLimit();
      assert.fail('Should have thrown rate limit error');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok((error as Error).message.includes('rate limit exceeded'));
    }
  });

  test('exponential backoff calculation', () => {
    const delay0 = (client as any).calculateBackoff(0);
    const delay1 = (client as any).calculateBackoff(1);
    const delay2 = (client as any).calculateBackoff(2);
    const delay3 = (client as any).calculateBackoff(3);

    // Base delays: 1s, 2s, 4s, 8s (plus jitter up to 1s)
    assert.ok(delay0 >= 1000 && delay0 <= 2000);
    assert.ok(delay1 >= 2000 && delay1 <= 3000);
    assert.ok(delay2 >= 4000 && delay2 <= 5000);
    assert.ok(delay3 >= 8000 && delay3 <= 9000);

    // Max delay should be capped at 16s
    const delay10 = (client as any).calculateBackoff(10);
    assert.ok(delay10 >= 16000 && delay10 <= 17000);
  });
});
