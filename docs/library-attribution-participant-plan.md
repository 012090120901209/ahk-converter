# Library Attribution Participant Plan

## Objective

Add a chat participant that fills in missing library header metadata by discovering authoritative details (description, author, repo link, date, version) from GitHub or other sources.## Scope &amp; Assumptions

Target files live under Lib/ and require the standard metadata banner.

Source discovery prioritizes GitHub repositories; other sources should be pluggable.

Existing metadata is never overwritten—only missing fields are populated.

We have access to a GitHub token via the secrets manager.

## Architecture Touchpoints

Chat Participant Registry: extend to register LibraryAttributionParticipant.

Metadata Validation Flow: invoke the participant when header fields are incomplete.

HTTP/Secrets Utilities: reuse or extend for outbound API calls with auth.

## Workflow Overview

Trigger Detection

Monitor chat/tooling prompts about missing metadata in Lib/*.ahk.

Inspect the file header to determine which fields are absent.

Query Preparation

Derive keywords from the file name (GuiEnhancerKit.ahk → GuiEnhancerKit).

Build GitHub search queries (search/code, search/repositories) favoring filename matches.

External Search

Execute GitHub requests (REST) with auth, handle pagination and rate limits.

Provide an abstraction layer to add Bitbucket or custom registries later.

Metadata Extraction

Download candidate README/manifests/library files.

Parse for known comment headers (@description, @author, etc.).

Apply heuristics when explicit tags are missing (e.g., parse version/date from release info).

Result Consolidation

Normalize date to YYYY/MM/DD; ensure version follows SemVer when possible.

Verify repo link resolves; prefer the canonical html_url from GitHub.

Merge findings with existing header values, leaving filled fields untouched.

Participant Response

Emit a formatted banner:

/************************************************************************
 * @description …
 * @file …
 * @author …
 * @link …
 * @date …
 * @version …
 ***********************************************************************/
Include provenance notes when multiple sources were considered.

## Implementation Tasks

GitHub Client

Create GitHubCodeSearchClient (search + content fetch).

Handle rate-limit headers and exponential backoff.

Metadata Extractor

Build utilities to scrape metadata from source files/READMEs.

Add normalizers for date/version/link fields.

Participant Logic

Implement LibraryAttributionParticipant using the client + extractor.

Integrate with the registry and metadata validation hook.

Configuration &amp; Secrets

Ensure GitHub token is configurable (env or settings).

Document required permissions (read-only public repo access).

Testing

Unit tests with mocked API responses covering happy path, partial data, rate-limit handling.

Integration test simulating metadata completion for GuiEnhancerKit.ahk.

Add regression check to confirm existing metadata remains unchanged.

## Risks &amp; Mitigations

Rate Limits: cache successful lookups; back off on 403s.

Ambiguous Matches: rank results by filename match, repo popularity, metadata completeness.

Offline Scenarios: fall back to user prompt or cached metadata snapshots.

## Rollout Checklist

Implement feature flags/config entry for participant enablement.

Verify logging/telemetry for API usage and metadata fills.

Update documentation for contributors on how to extend source providers.



