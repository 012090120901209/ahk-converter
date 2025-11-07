# VS Code Extension Publishing Setup Guide

## Quick Summary

Your extension uses **GitHub Actions** for automated publishing. Publishing is triggered by **git tags**, not commits.

## Issues Fixed (2025-11-07)

### Icon Configuration
✅ **Fixed** `package.json` icon references:
- Marketplace icon: `media/converter.png` (was: broken reference to `src/AHK_Icon.png`)
- Sidebar icon: `src/Icon_VsCode2.svg` (was: broken reference to `src/AHK_Code.svg`)

### Publishing Issue
❌ **Problem**: Tag `v0.4.3` exists locally but not on GitHub
✅ **Solution**: Push tag to trigger GitHub Actions workflow

---

## Part 1: VSCE_PAT Setup (One-Time)

### What is VSCE_PAT?
A Personal Access Token (PAT) that authorizes GitHub Actions to publish your extension to the VS Code Marketplace.

### Step-by-Step Setup

#### 1. Create Azure DevOps Account
- Go to: https://dev.azure.com
- Sign in with Microsoft account (or create one)
- Organization will be auto-created

#### 2. Get Marketplace Publisher Access
Your publisher is: **TrueCrimeAudit**

Verify you have access:
- Go to: https://marketplace.visualstudio.com/manage/publishers/TrueCrimeAudit
- If you see "Access Denied", request access from the publisher owner
- If you created it, you already have access

#### 3. Generate Personal Access Token

**In Azure DevOps:**
1. Click your profile icon (top right)
2. Security → Personal access tokens
3. Click "New Token"
4. Configure:
   ```
   Name:           VS Code Marketplace Publishing
   Organization:   All accessible organizations
   Expiration:     1 year (or custom)
   Scopes:         ☐ Full access
                   ☑ Marketplace (Manage or Publish)
   ```
5. Click "Create"
6. **CRITICAL**: Copy the token immediately (you can't see it again!)

#### 4. Add Token to GitHub Secrets

**In your GitHub repository:**
1. Go to: https://github.com/012090120901209/ahk-converter/settings/secrets/actions
2. Click "New repository secret"
3. Enter:
   ```
   Name:   VSCE_PAT
   Value:  [paste the token you copied]
   ```
4. Click "Add secret"

#### 5. Verify Secret
- Go to: https://github.com/012090120901209/ahk-converter/settings/secrets/actions
- You should see `VSCE_PAT` listed (value is hidden for security)

---

## Part 2: Publishing Your Extension

### Current Status
- ✅ Package version: **0.4.3**
- ✅ Tag exists locally: `v0.4.3`
- ❌ Tag NOT on GitHub remote
- ❌ GitHub Actions not triggered yet

### Publishing Process

#### Option A: Automated (Recommended)

**1. Push the tag to GitHub:**
```bash
git push origin v0.4.3
```

**2. Monitor GitHub Actions:**
- Go to: https://github.com/012090120901209/ahk-converter/actions
- Watch "Publish VS Code Extension" workflow
- Status will show: ⏳ Running → ✅ Success or ❌ Failed

**3. If Successful:**
- Extension publishes to VS Code Marketplace within ~5-10 minutes
- Verify at: https://marketplace.visualstudio.com/items?itemName=TrueCrimeAudit.ahkv2-toolbox

**4. If Failed:**
Check the workflow logs for errors:
- Missing `VSCE_PAT` secret
- Invalid token (expired or wrong scope)
- Version `0.4.3` already published (use `--skip-duplicate` flag)
- Compilation errors

#### Option B: Manual Publishing

**If automated publishing fails, publish manually:**

1. **Set environment variable (local terminal):**
   ```bash
   # Windows (PowerShell)
   $env:VSCE_PAT = "your-token-here"

   # Linux/Mac
   export VSCE_PAT="your-token-here"
   ```

2. **Publish:**
   ```bash
   npm run publish
   ```

3. **Or publish the VSIX directly:**
   ```bash
   npx vsce publish --packagePath ahkv2-toolbox-0.4.3.vsix
   ```

---

## Part 3: Understanding the Setup

### GitHub Actions Workflow

**File:** `.github/workflows/publish.yml`

**Triggers:**
- Tag push: `v*` (e.g., `v0.4.3`, `v1.0.0`)
- Manual dispatch: From Actions tab

**What it does:**
1. Checks out code
2. Installs Node.js 20
3. Installs dependencies (`npm ci`)
4. Compiles TypeScript (`npm run compile`)
5. Publishes to Marketplace (`npx vsce publish --skip-duplicate`)

**Skip duplicate flag:**
Prevents failure if version already exists on marketplace.

### Azure Pipelines (Not Used)

**File:** `azure-pipelines.yml`

This file exists but **is NOT used** because:
- Your repo is on **GitHub** (not Azure DevOps)
- GitHub Actions is configured instead

**Options:**
- Delete `azure-pipelines.yml` (recommended)
- Keep it for reference

### Icon Configuration

**Two types of icons in VS Code extensions:**

1. **Marketplace Icon** (`package.json` → `icon`)
   - Shows in marketplace search results
   - Current: `media/converter.png`
   - Recommended size: 128x128px (at least)
   - Must be PNG

2. **Activity Bar Icon** (`viewsContainers` → `icon`)
   - Shows in VS Code sidebar
   - Current: `src/Icon_VsCode2.svg`
   - Recommended: SVG for scalability
   - Fallback: PNG if needed

**Available icons in your project:**
```
media/converter.png        → Marketplace icon (21KB)
src/Icon_VsCode2.svg       → Sidebar icon (27KB)
src/Icon_VsCode.svg        → Alternative (234KB)
src/icon.png               → Small PNG (1.3KB)
```

---

## Part 4: Complete Publishing Checklist

### Before Publishing

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with changes
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npm run compile`)
- [ ] Package builds (`npm run package`)
- [ ] VSIX file created and tested locally
- [ ] Icons exist at correct paths
- [ ] Git tag created (`git tag v0.4.3`)

### Publishing Steps

- [ ] Commit all changes
- [ ] Push commits to `main`: `git push origin main`
- [ ] Push tag to GitHub: `git push origin v0.4.3`
- [ ] Monitor GitHub Actions: Check workflow status
- [ ] Verify on Marketplace: Wait 5-10 minutes
- [ ] Test installation: Install from marketplace in VS Code

### After Publishing

- [ ] Announce release (GitHub Releases, social media, etc.)
- [ ] Monitor for issues (GitHub Issues)
- [ ] Update documentation if needed
- [ ] Plan next version features

---

## Part 5: Common Issues & Solutions

### Issue: "VSCE_PAT not found"

**Error in GitHub Actions:**
```
Error: The environment variable VSCE_PAT is not set
```

**Solution:**
1. Verify secret exists: Repo → Settings → Secrets → Actions
2. Name must be exactly `VSCE_PAT` (case-sensitive)
3. Re-add secret if missing

### Issue: "Extension already published"

**Error:**
```
ERROR  Extension 'ahkv2-toolbox' version 0.4.3 is already published.
```

**Solutions:**
1. Use `--skip-duplicate` flag (already in workflow)
2. Bump version in `package.json` to `0.4.4`
3. Create new tag: `git tag v0.4.4`

### Issue: Token expired

**Error:**
```
ERROR  The Personal Access Token expired on [date]
```

**Solution:**
1. Generate new token in Azure DevOps
2. Update `VSCE_PAT` secret in GitHub
3. Re-run the workflow or re-push tag

### Issue: Compilation errors

**Error:**
```
ERROR  TS2307: Cannot find module 'vscode'
```

**Solution:**
1. Run locally: `npm ci && npm run compile`
2. Fix TypeScript errors
3. Commit and push fixes
4. Re-push tag

### Issue: Tag not triggering workflow

**Symptoms:**
- Tag pushed but no workflow runs
- No new runs in Actions tab

**Solutions:**
1. Check tag name format: Must start with `v` (e.g., `v0.4.3`)
2. Verify workflow file exists: `.github/workflows/publish.yml`
3. Check workflow syntax (YAML formatting)
4. Try manual trigger: Actions → Publish Extension → Run workflow

---

## Part 6: Quick Reference Commands

### Publishing Commands

```bash
# Standard workflow
git tag v0.4.3
git push origin v0.4.3

# Check tag
git tag -l | grep v0.4.3

# Delete tag (if mistake)
git tag -d v0.4.3                # Delete locally
git push origin --delete v0.4.3  # Delete on GitHub

# Manual publish
npm run compile
npm run package
npm run publish

# Test locally first
code --install-extension ahkv2-toolbox-0.4.3.vsix
```

### Troubleshooting Commands

```bash
# Check GitHub Actions status
gh run list --workflow=publish.yml

# View workflow logs
gh run view [run-id] --log

# Check remote tags
git ls-remote --tags origin

# Verify compilation
npm run compile

# Verify package
npm run package
```

---

## Part 7: Next Steps (Right Now)

### Immediate Action Required

**You need to push the tag to trigger publishing:**

```bash
cd /mnt/c/Users/uphol/Documents/Design/Coding/ahk-converter

# 1. Verify tag exists locally
git tag -l | grep v0.4.3

# 2. Push the tag to GitHub
git push origin v0.4.3

# 3. Watch the workflow
# Go to: https://github.com/012090120901209/ahk-converter/actions
```

### If VSCE_PAT Not Set Up Yet

1. Follow **Part 1** to create and add the token
2. Then push the tag (above commands)
3. Workflow will run automatically

### Verify Success

After 5-10 minutes:
1. Check: https://marketplace.visualstudio.com/items?itemName=TrueCrimeAudit.ahkv2-toolbox
2. Version should show `0.4.3`
3. Install in VS Code to test

---

## Resources

- **VS Code Publishing Guide**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **VSCE CLI Docs**: https://github.com/microsoft/vscode-vsce
- **GitHub Actions**: https://docs.github.com/en/actions
- **Your Marketplace**: https://marketplace.visualstudio.com/manage/publishers/TrueCrimeAudit
- **Your Actions**: https://github.com/012090120901209/ahk-converter/actions

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Ready to publish v0.4.3
