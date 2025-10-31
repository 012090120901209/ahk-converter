# AHKv2 Toolbox - Roadmap & Future Updates

## Current Version: 0.4.2

This document outlines planned features, enhancements, and long-term goals for the AHKv2 Toolbox extension.

---

## 🎯 High Priority (Next Release)

### Dependency Manager Enhancements

#### 1. Auto-Add #Include Lines ⭐ **[IMPLEMENTED]** ✅
**Status:** Fully implemented and tested
**Priority:** High
**Complexity:** Medium

Automatically insert `#Include` statements when installing packages.

**Features:**
- Smart insertion location based on directives (#SingleInstance, #Requires)
- Intelligent include block detection and creation
- Duplicate prevention with filename normalization
- Preserve file formatting (EOL style, spacing)
- Preview before insertion
- Support both `#Include Lib/<Name>.ahk` and relative paths
- Handle edge cases (empty files, comments, multiple directives)

**User Flow:**
1. User installs package "JSON" from Dependency Manager
2. Extension detects active .ahk file or prompts to select target
3. Analyzes file structure and finds appropriate insertion point
4. Shows preview: "Add `#Include Lib/JSON.ahk` after line 2?"
5. User confirms → Include line inserted with proper formatting
6. Success notification with "Open File" button

**Configuration Options (Future):**
- `ahk.includeFormat`: Template for include path (default: `Lib/{name}.ahk`)
- `ahk.autoInsertHeaders`: Auto-add #Requires and #SingleInstance (default: false)
- `ahk.headerOrder`: Order of directives to insert
- `ahk.confirmBeforeInsert`: Show preview dialog (default: true)

**Related Files:**
- Implementation: `src/includeLineInserter.ts` ✅
- Tests: `src/test/includeLineInserter.test.ts` ✅
- Docs: `docs/INCLUDE_INSERTION_RULES.md` ✅
- Feature Guide: `docs/AUTO_INCLUDE_FEATURE.md` ✅

---

#### 2. Real Package Download from GitHub
**Status:** Planned
**Priority:** High
**Complexity:** High

Replace mock installations with actual package downloads.

**Features:**
- Parse GitHub repository URLs
- Download `.ahk` files to workspace `Lib/` folder
- Support direct file URLs and repository URLs
- Progress indication with cancellation support
- Verify file integrity (checksums, signatures)
- Handle rate limiting and errors gracefully
- Support GitHub releases and tags

**Example URLs:**
```
https://github.com/user/repo/blob/main/Lib/Package.ahk
https://github.com/user/ahk-package
https://raw.githubusercontent.com/user/repo/main/Package.ahk
```

**Dependencies:**
- GitHub API integration
- Download progress tracking
- File system operations with error handling

---

#### 3. Package Search Implementation
**Status:** Planned
**Priority:** High
**Complexity:** Medium

Make the search button functional with comprehensive search capabilities.

**Features:**
- Search by package name, description, author, tags
- Filter by category (GUI, Networking, Parsing, etc.)
- Sort results (popularity, recent, alphabetical, downloads)
- Quick preview of search results
- Fuzzy matching for better discoverability
- Search history and suggestions
- Keyboard navigation

**UI:**
- Search input dialog with autocomplete
- Results displayed in tree view with icons
- Inline install buttons
- Preview panel with package details

---

## 📋 Medium Priority (Version 0.5.x)

### Dependency Manager

#### 4. Workspace Package Manifest
**Status:** Planned
**Priority:** Medium
**Complexity:** Medium

Create a manifest file to track dependencies.

**File:** `ahk-packages.json` or extend `package.json`
```json
{
  "name": "my-ahk-project",
  "version": "1.0.0",
  "dependencies": {
    "JSON": "^2.0.0",
    "WinClip": "1.5.0",
    "Socket": "~2.1.0"
  },
  "devDependencies": {
    "TestFramework": "*"
  },
  "repository": "https://github.com/user/project"
}
```

**Features:**
- Track installed packages and versions
- Enable reproducible setups across machines
- Bulk install with `Install All` command
- Semantic versioning support (^, ~, *)
- Lock file for exact version tracking
- Workspace-level vs global packages

**Commands:**
- `AHK: Initialize Package Manifest`
- `AHK: Install Dependencies`
- `AHK: Update All Packages`
- `AHK: Publish Package` (for package authors)

---

#### 5. Dependency Resolution & Tree
**Status:** Planned
**Priority:** Medium
**Complexity:** High

Automatically resolve and install package dependencies.

**Features:**
- Parse `#Include` statements in downloaded packages
- Auto-install transitive dependencies
- Detect and resolve version conflicts
- Show visual dependency tree
- Warn about circular dependencies
- Smart update strategies (minimal changes)

**UI Enhancements:**
- Dependency graph visualization
- Conflict resolution dialog
- "Why is this installed?" command
- Dependency size/impact analysis

---

#### 6. Rich Package Details View
**Status:** Planned
**Priority:** Medium
**Complexity:** Medium

Show comprehensive package information in a webview panel.

**Features:**
- README rendering (Markdown)
- Changelog with version history
- Usage examples with syntax highlighting
- API documentation (JSDoc-style)
- License information
- Package statistics (downloads, stars, issues)
- Screenshots/GIFs if available
- Links to repository, issues, docs

**UI:**
- Webview panel with tabs
- Copy code button on examples
- Quick install button
- Related packages section

---

#### 7. Package Registry Integration
**Status:** Research
**Priority:** Medium
**Complexity:** High

Connect to real package registries and indexes.

**Potential Sources:**
- AHK Package Hub (community registry - may need to create)
- Awesome-AutoHotkey list
- GitHub topic search (`topic:autohotkey-v2`)
- Custom registry URL (configurable)

**Features:**
- Registry synchronization
- Package discovery
- Popularity metrics
- Quality scores
- Verified publishers
- Package review/rating system

---

#### 8. Integration with Dependency Map
**Status:** Planned
**Priority:** Medium
**Complexity:** Low

Connect Dependency Manager with Dependency Map view.

**Features:**
- Highlight files using a package when selected
- Show "Used by X files" indicator on packages
- Quick navigation between views
- Sync selection state
- Show impact analysis before uninstall
- Find all #Include references

**Commands:**
- `Show Package Usage` (from Dependency Manager)
- `Find in Dependency Map` (cross-navigation)

---

### Code Map & Navigation

#### 9. Enhanced Symbol Search
**Status:** Planned
**Priority:** Medium

Improve code navigation and symbol finding.

**Features:**
- Workspace-wide symbol search
- Go to symbol across files
- Find all references
- Rename symbol (with preview)
- Symbol outline breadcrumbs

---

### Conversion Features

#### 10. Conversion Profiles Enhancement
**Status:** Planned
**Priority:** Low

Improve v1→v2 conversion with profiles.

**Features:**
- Save custom conversion settings
- Import/export profiles
- Batch apply to multiple files
- Conversion presets (safe, aggressive, minimal)

---

## 🎨 Nice-to-Have (Version 0.6.x+)

### Dependency Manager

#### 11. Favorites & Bookmarks
- Star frequently used packages
- "Favorites" category in tree
- Sync favorites across workspaces

#### 12. Automatic Update Checks
- Check for updates on startup (configurable)
- Update notification badges
- Batch update all packages
- Changelog preview before update

#### 13. Usage Analytics & Recommendations
- Track most-used packages
- Download counts and trends
- Trending packages widget
- Community ratings/reviews
- "You might also like..." suggestions

#### 14. Package Templates & Publishing
- Create new package from template
- Initialize package structure
- Generate package metadata
- Publish to registry
- Version bumping commands

#### 15. Safety Features
- Preview files before install
- Backup before uninstall/update
- Rollback capability
- Package signature verification
- Malware scanning integration
- Sandbox mode for testing

#### 16. Local Development Mode
- Work on packages in development
- Link local package folders
- Hot reload on changes
- Test without installing
- Local package registry

#### 17. Conflict Detection & Resolution
- Warn about multiple versions
- Detect naming conflicts
- Suggest resolutions
- Dependency compatibility matrix

---

### UI/UX Improvements

#### 18. Better Visual Feedback
- Loading spinners during operations
- Success/error animations
- Package icons/logos
- Color coding by status
- Progress bars for downloads

#### 19. Context Menu Enhancements
- Right-click actions on packages
- Copy package name
- Copy #Include line
- Open in file explorer
- Open repository in browser

#### 20. Keyboard Shortcuts
- Quick search: `Ctrl+Shift+P`
- Install selected: `Enter`
- Navigate: Arrow keys
- Refresh: `F5`
- Open details: `Space`

---

## 🔬 Research & Exploration

### Advanced Features (Future)

#### Package Testing Integration
- Run package tests before install
- Test compatibility with current project
- Integration with testing frameworks

#### AI-Powered Features
- Package recommendations based on code analysis
- Auto-detect missing dependencies
- Suggest package upgrades
- Code quality insights

#### Collaboration Features
- Share package lists with team
- Team package repositories
- Package approval workflows
- Usage tracking in teams

#### Performance Monitoring
- Package load time tracking
- Memory usage analysis
- Identify slow packages
- Performance recommendations

#### Documentation Generation
- Auto-generate docs from packages
- JSDoc/AHKDoc integration
- Export API reference
- Interactive documentation

---

## 🐛 Known Issues & Tech Debt

### Dependency Manager
- Mock installations need real implementation
- No actual file downloads yet
- Search is placeholder
- Version comparison is basic

### Dependency Map
- Performance with large files (>1000 lines)
- Complex include path resolution
- System library path detection on Linux

### Code Map
- Refresh lag on large files
- Memory usage with many open files
- LSP fallback parser accuracy

---

## 📊 Metrics & Goals

### Success Criteria (v0.5.0)
- [x] Auto-add #Include working for all scenarios ✅
- [ ] Real package downloads from GitHub
- [ ] Functional package search
- [ ] 100+ packages in registry
- [ ] <100ms UI response time
- [ ] 95% test coverage for new features

### Long-term Vision (v1.0.0)
- [ ] Complete package ecosystem with registry
- [ ] Seamless dependency management
- [ ] Zero-config setup for new projects
- [ ] Community-driven package discovery
- [ ] Best-in-class AutoHotkey development experience

---

## 🤝 Contributing

Want to help implement these features? Check out:
- [Contributing Guide](CONTRIBUTING.md)
- [Development Setup](docs/DEVELOPMENT.md)
- Open issues labeled `good-first-issue` or `help-wanted`

---

## 📝 Changelog

### Version 0.4.2 (Current)
- ✅ Added Dependency Manager (package view)
- ✅ Added Dependency Map (file includes view)
- ✅ Renamed and reordered sidebar views
- ✅ Clickable install notifications
- ✅ Package metadata extraction
- ✅ Activation events for auto-loading

### Version 0.4.1
- ✅ Improved Code Map with diagnostics
- ✅ Enhanced function metadata extraction
- ✅ LSP integration improvements

### Version 0.4.0
- ✅ Code Map explorer
- ✅ Function metadata system
- ✅ Enhanced v1→v2 conversion

---

**Last Updated:** 2025-10-25
**Next Review:** After v0.5.0 release

For detailed implementation status, see individual feature tracking in [GitHub Issues](https://github.com/012090120901209/ahk-converter/issues).
