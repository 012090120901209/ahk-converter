# Package Search Guide

## Overview

The AHKv2 Toolbox now includes a powerful package search feature that helps you discover interesting AutoHotkey v2 scripts and libraries from GitHub. This feature integrates with the GitHub API to provide real-time search results with rich metadata.

## Features

### 🔍 Search Capabilities

- **Keyword Search**: Search for packages by name, description, or related terms
- **Popular Packages**: Browse trending AHK v2 packages when no search query is provided
- **Category Filtering**: Filter results by category (GUI, Networking, Parsing, System, etc.)
- **Sorting Options**: Sort by popularity (stars), recent updates, or alphabetically
- **Rich Metadata**: View package stars, author, category, and description directly in the tree view

### 📦 Package Discovery

The search service automatically:
- Searches GitHub repositories tagged with `autohotkey-v2` and related topics
- Searches for `.ahk` files across all GitHub repositories
- Categorizes packages based on their description and name
- Displays repository star count for popularity indication
- Caches results for 5 minutes to reduce API calls

## How to Use

### Basic Search

1. Open the **Dependency Manager** view in the AHKv2 Toolbox sidebar
2. Click the **Search** button (magnifying glass icon) in the view title bar
3. Enter your search query:
   - Package name (e.g., "JSON", "Socket", "WinClip")
   - Keyword (e.g., "parsing", "networking", "gui")
   - Leave empty to browse popular packages
4. Select sorting preference:
   - **Most Popular (Stars)**: Recommended for finding well-tested packages
   - **Recently Updated**: Find actively maintained packages
   - **Alphabetical**: Browse packages by name
5. Optionally filter by category:
   - GUI
   - Networking
   - File Operations
   - System
   - Parsing
   - Utilities
   - Gaming
   - Automation
   - Testing
   - All (no filter)

### Search Results

Search results appear in the **Available Libraries** category with enhanced information:

- **Package Name**: Primary identifier
- **Stars**: GitHub star count (⭐ 123)
- **Version**: Package version (1.0.0)
- **Description**: Full package description in tooltip
- **Author**: Package author/owner
- **Category**: Auto-detected category
- **Repository URL**: GitHub repository link

### Actions on Search Results

#### Click a Package
- Opens the repository in your web browser for detailed inspection

#### Install a Package
- Right-click a package → "Install Package"
- Follow the installation prompts
- Optionally add `#Include` line to your active script

#### Clear Search
- Click the **Clear** button (clear-all icon) in the view title bar
- Returns to the default package view

## Example Searches

### Find JSON Parsing Libraries
```
Query: "JSON"
Sort by: Most Popular
Category: Parsing
```

### Find GUI Helper Libraries
```
Query: "gui"
Sort by: Recently Updated
Category: GUI
```

### Browse All Popular Packages
```
Query: (empty)
Sort by: Most Popular
Category: All
```

### Find Testing Frameworks
```
Query: "test"
Sort by: Most Popular
Category: Testing
```

## GitHub API Rate Limiting

The search feature uses the GitHub API, which has rate limits:

### Without Authentication
- 60 requests per hour
- Sufficient for casual searching

### With GitHub Token (Recommended)
- 5,000 requests per hour
- Required for frequent searches

### Setting Up GitHub Token

1. Generate a Personal Access Token:
   - Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select scope: `public_repo` (read-only access)
   - Copy the generated token

2. Add token to VS Code settings:
   - Open Settings (`Ctrl+,` or `Cmd+,`)
   - Search for "ahkv2Toolbox.githubToken"
   - Paste your token
   
   Or add to `settings.json`:
   ```json
   {
     "ahkv2Toolbox.githubToken": "ghp_your_token_here"
   }
   ```

### Rate Limit Errors

If you encounter rate limit errors:
- Wait for the reset time (shown in error message)
- Add a GitHub token (see above)
- Clear search cache: Restart VS Code or run `Developer: Reload Window`

## Search Algorithm Details

### Repository Search
1. Searches for repositories with AutoHotkey language tag
2. Filters by `autohotkey-v2` topic
3. Sorts by star count (descending)
4. Fetches top 30 results

### Code Search
1. Searches for `.ahk` files matching query
2. Extracts repository information
3. Deduplicates with repository search results
4. Combines and ranks results

### Categorization
Packages are automatically categorized based on keywords in their:
- Repository description
- Repository name
- Primary topics

Categories:
- **GUI**: `gui`, `window`, `interface`, `ui`
- **Networking**: `http`, `socket`, `api`, `rest`, `web`
- **File Operations**: `file`, `io`, `filesystem`, `directory`
- **System**: `system`, `process`, `registry`, `wmi`
- **Parsing**: `json`, `xml`, `csv`, `parser`, `regex`
- **Utilities**: `util`, `helper`, `tool`, `lib`
- **Gaming**: `game`, `gaming`, `overlay`
- **Automation**: `automation`, `macro`, `hotkey`
- **Testing**: `test`, `testing`, `framework`, `unit-test`

## Caching

Search results are cached for 5 minutes to:
- Reduce GitHub API calls
- Improve response time for repeated searches
- Preserve rate limits

Cache is automatically cleared:
- After 5 minutes
- When VS Code is reloaded
- When search filters change

## Troubleshooting

### No Results Found
- Check your internet connection
- Verify the search query is relevant to AutoHotkey
- Try broader keywords (e.g., "gui" instead of "complex-gui-framework")
- Try searching without category filters

### Rate Limit Exceeded
- Wait for the reset time
- Add a GitHub token to your settings
- Reduce search frequency

### Incorrect Categorization
- Categories are auto-detected and may not always be accurate
- Use sorting and filtering to find relevant packages
- Check the repository description for accurate information

### Package Not Installing
- Search results show available packages
- Installation requires the package to have a downloadable `.ahk` file
- Some repositories may be templates or documentation only

## Tips for Effective Searching

1. **Start Broad**: Begin with general keywords and refine
2. **Check Stars**: Higher star counts generally indicate quality and popularity
3. **Recent Updates**: Active maintenance is a good sign
4. **Read Descriptions**: Click packages to view full repository details
5. **Explore Categories**: Browse by category to discover new tools
6. **Popular Packages**: Leave search empty to see trending packages

## Related Features

- **Dependency Manager**: Install and manage packages
- **Auto-Add #Include**: Automatically add include statements
- **Dependency Tree**: Visualize package dependencies
- **Code Map**: Explore installed package structure

## Configuration Options

Available settings:
```json
{
  // GitHub personal access token for higher rate limits
  "ahkv2Toolbox.githubToken": "",
  
  // Search result cache timeout (milliseconds)
  // Default: 300000 (5 minutes)
  "ahkv2Toolbox.searchCacheTimeout": 300000,
  
  // Maximum search results to fetch
  // Default: 30
  "ahkv2Toolbox.maxSearchResults": 30
}
```

## Feedback and Contributions

Found an issue or have a suggestion?
- [Report an issue](https://github.com/012090120901209/ahk-converter/issues)
- [Contribute on GitHub](https://github.com/012090120901209/ahk-converter)

---

**Last Updated**: 2025-11-06  
**Version**: 0.4.3+
