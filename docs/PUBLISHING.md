### Publishing the VS Code Extension

Prerequisites
- Create a VS Code Marketplace publisher (e.g., `TrueCrimeAudit`) and generate a Personal Access Token with the scope "Publish extensions".
- Locally: set an environment variable `VSCE_PAT` to the token value.
- CI: add repository secret `VSCE_PAT` with the token.

Local packaging and publish
- Package: run `npm run package` to produce a `.vsix` file in the repo root.
- Publish: ensure `VSCE_PAT` is set, then either:
  - Run `npm run publish` to publish the current version, or
  - Use the VS Code task "Publish latest VSIX to VS Code Marketplace" which publishes the most recent `.vsix`.

GitHub Actions (tag-driven publish)
- Pushing a tag like `v0.1.6` triggers `.github/workflows/publish.yml` to build and publish using `VSCE_PAT`.

Notes
- The workflow uses `vsce publish --skip-duplicate` to avoid failing when a version was already published.
- Ensure `package.json` `publisher`, `name`, and `version` are correct before publishing.

