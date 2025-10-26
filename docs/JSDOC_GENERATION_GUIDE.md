# JSDoc Header Generation Guide for AutoHotkey v2

## Overview

This guide defines the authoritative standard for generating JSDoc-style header comments for AutoHotkey v2 scripts. These headers help LLMs and package managers understand, index, and utilize your code effectively.

---

## Core Principles

You are an expert AHK v2 documentation generator. Read the provided AutoHotkey v2 source code and produce a single JSDoc style header comment block only. Do not rewrite or output any code. No prose outside the header.

### Goals

1. **Create both an abstract and a description**
   - Abstract: Short high-level overview
   - Description: Fuller explanation of purpose, behavior, and context

2. **Populate as many relevant header tags as possible**
   - Help LLMs and package managers understand and index the script
   - Provide comprehensive metadata for automated tooling

3. **Include GitHub URLs properly**
   - Use appropriate JSDoc tag for repository
   - Add as @link entry for easy access

4. **Infer metadata from code**
   - AHK version from `#Requires` directive
   - Dependencies from `#Include` statements
   - Exported API (classes, functions, hotkeys)
   - CLI usage patterns
   - Environment assumptions
   - Risky permissions (registry, network, file system)

---

## Input/Output Specification

### Input
* One AHK v2 file as plain text

### Output
* Exactly one JSDoc style block in this format:

```ahk
/************************************************************************
 * ...
 ***********************************************************************/
```

* **No trailing commentary**
* **No code**
* **Header only**

---

## Authoritative Rules

1. **Line Wrapping**: Keep lines wrapped sensibly, avoid excessive width (80-100 chars recommended)
2. **Dates**: Prefer ISO dates `YYYY-MM-DD`
3. **Versioning**: Use semver for `@version` when possible (e.g., `1.0.7`)
4. **Confidence**: Use values you can confidently infer. If unknown, omit the tag rather than guessing
5. **No Duplication**: Don't duplicate information across tags unless the tag semantics require it

---

## Required Content Order

All tags should appear in this specific order:

### 1. File & Module Identity
- `@file` - File name or identifier
- `@title` - Short module title if inferable
- `@fileoverview` - Concise one sentence overview
- `@abstract` - 1 to 2 sentences max
- `@description` - 2 to 6 sentences; include purpose, core features, I/O, side effects
- `@module` - Module name if inferable

### 2. Authorship & Legal
- `@author` - Name <email> if present
- `@license` - If present in file or repository (MIT, GPL, etc.)
- `@version` - Semantic version
- `@since` - First known date if inferable
- `@date` - Current or last modified date if present

### 3. Links & References
- `@homepage` - If repo root can be inferred
- `@repository` - Type and URL if found (use GitHub if present)
- `@link` - One or more helpful URLs (docs, repo, issue tracker)
- `@see` - Additional references

### 4. Classification
- `@keywords` - Comma-separated topical terms
- `@category` - Primary category like:
  - `Automation`
  - `GUI`
  - `WinAPI`
  - `DevTools`
  - `Networking`
  - `FileSystem`
  - `DataParsing`
  - `Graphics`
  - Other

### 5. Technical Requirements
- `@ahk-version` - Value from `#Requires` if present, else omit
- `@requires` - List each dependency:
  - AHK library files from `#Include`
  - DLLs loaded via `DllCall` or `#DllLoad`
  - External tools or environment prerequisites
- `@imports` - List imported modules or files if any
- `@exports` - Main public classes, functions, hotkeys

### 6. Behavior & Usage
- `@entrypoint` - Script entry behavior if any (e.g., auto-execute section)
- `@env` - OS assumptions, bitness, admin rights, codepage
- `@permissions` - Anything elevated or sensitive (registry, file system writes, network)
- `@config` - Configurable settings or INI keys
- `@arguments` - CLI args expected, if applicable
- `@returns` - Primary outputs or artifacts
- `@sideEffects` - Notable system changes (e.g., registry edits, theme changes)

### 7. Documentation & Examples
- `@examples` - Brief usage examples (inline)
- `@bugs` - Known issues if found in comments
- `@todo` - Actionable next steps
- `@changelog` - Most recent noteworthy changes if present

### 8. Community & Support
- `@funding` - If you find donation links
- `@maintainer` - If present
- `@contributors` - If present

---

## Formatting Details

### Tag Structure
* **One tag per line** in the above order
* Format: ` * @tagname: value` or ` * @tagname value`

### Multi-Item Tags
For tags with multiple values (`@requires`, `@exports`, `@keywords`):

**Option 1: Comma-separated**
```ahk
 * @keywords: json, parsing, serialization, autohotkey
```

**Option 2: Continued lines** (for longer descriptions)
```ahk
 * @requires:
 *   - Library_Helper.ahk
 *   - Library_Utils.ahk
 *   - user32.dll (DllCall)
```

### Examples
Keep examples short and inline:
```ahk
 * @examples: obj := JSON.parse('{"key": "value"}') ; Returns Map object
```

### GitHub Integration
For GitHub repositories:
```ahk
 * @repository: https://github.com/user/repo
 * @bugs: https://github.com/user/repo/issues
 * @link: https://github.com/user/repo
```

---

## Complete Example

```ahk
/************************************************************************
 * @file: JSON.ahk
 * @title: JSON Parser and Stringifier
 * @fileoverview: JSON format string serialization and deserialization for AHK v2
 * @abstract: High-performance JSON parser supporting true/false/null types with preserved numeric types
 * @description: JSON格式字符串序列化和反序列化, 修改自[HotKeyIt/Yaml](https://github.com/HotKeyIt/Yaml)
 * 增加了对true/false/null类型的支持, 保留了数值的类型. Provides bidirectional conversion
 * between AutoHotkey objects/Maps and JSON strings with full type preservation.
 * @module: JSON
 * @author: thqby, HotKeyIt
 * @license: MIT
 * @version: 1.0.7
 * @since: 2024-01-01
 * @date: 2024-02-24
 * @homepage: https://github.com/thqby/ahk2_lib
 * @repository: https://github.com/thqby/ahk2_lib
 * @link: https://github.com/thqby/ahk2_lib
 * @link: https://github.com/HotKeyIt/Yaml
 * @see: AutoHotkey v2 Object Documentation
 * @keywords: json, parsing, serialization, deserialization, autohotkey, data-format
 * @category: DataParsing
 * @ahk-version: v2.0+
 * @requires: None (standalone)
 * @imports: None
 * @exports:
 *   - JSON.parse(text, keepbooltype?, as_map?)
 *   - JSON.stringify(obj, space?)
 *   - JSON.null
 *   - JSON.true
 *   - JSON.false
 * @entrypoint: Class definition (no auto-execute)
 * @env: Windows, any bitness, no admin required, UTF-8 compatible
 * @permissions: None (read-only operations)
 * @config: None
 * @arguments: None
 * @returns: JSON class with static methods
 * @sideEffects: None
 * @examples: obj := JSON.parse('{"name": "test", "count": 5}') ; Parse to Map
 * @examples: str := JSON.stringify({key: "value"}) ; Convert to JSON string
 * @bugs: None known
 * @todo:
 *   - Add schema validation support
 *   - Implement JSON5 compatibility
 * @changelog: v1.0.7 - Added null type support, fixed numeric preservation
 * @funding: None
 * @maintainer: thqby
 * @contributors: HotKeyIt, thqby
 ***********************************************************************/
```

---

## Tag Reference

### Core Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@file` | string | File name or identifier | `JSON.ahk` |
| `@title` | string | Short module title | `JSON Parser and Stringifier` |
| `@fileoverview` | string | One sentence | `JSON serialization for AHK v2` |
| `@abstract` | string | 1-2 sentences | `High-performance JSON parser...` |
| `@description` | multiline | 2-6 sentences | Full explanation |
| `@module` | string | Module name | `JSON` |

### Authorship Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@author` | string | Name, email | `John Doe <john@example.com>` |
| `@license` | string | License type | `MIT` |
| `@version` | semver | Version number | `1.0.7` |
| `@since` | date | First release | `2024-01-01` |
| `@date` | date | Last modified | `2024-02-24` |

### Link Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@homepage` | url | Project homepage | `https://example.com` |
| `@repository` | url | Source repository | `https://github.com/user/repo` |
| `@link` | url | Related URL | `https://docs.example.com` |
| `@see` | string | Reference | `AHK v2 Object Docs` |
| `@bugs` | url | Issue tracker | `https://github.com/user/repo/issues` |

### Classification Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@keywords` | csv | Topic terms | `json, parsing, data` |
| `@category` | string | Primary category | `DataParsing` |

### Technical Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@ahk-version` | string | AHK version | `v2.0+` |
| `@requires` | array | Dependencies | `Library_Utils.ahk` |
| `@imports` | array | Imported modules | `Helpers.ahk` |
| `@exports` | array | Public API | `JSON.parse()` |

### Behavior Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@entrypoint` | string | Entry behavior | `Auto-execute section` |
| `@env` | string | Environment | `Windows 10+, 64-bit` |
| `@permissions` | string | Required access | `Registry write, Admin` |
| `@config` | string | Configuration | `Settings.ini [Main]` |
| `@arguments` | string | CLI args | `--input <file>` |
| `@returns` | string | Output | `JSON string` |
| `@sideEffects` | string | System changes | `Modifies HKCU registry` |

### Documentation Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@examples` | string | Usage example | `obj := JSON.parse(str)` |
| `@bugs` | string | Known issues | `Fails on circular refs` |
| `@todo` | array | Action items | `Add validation` |
| `@changelog` | multiline | Recent changes | `v1.0.7 - Bug fixes` |

### Community Tags

| Tag | Type | Description | Example |
|-----|------|-------------|---------|
| `@funding` | url | Donation link | `https://ko-fi.com/user` |
| `@maintainer` | string | Current maintainer | `Jane Smith` |
| `@contributors` | array | Contributors | `John, Jane, Bob` |

---

## Common Patterns

### Pattern 1: Simple Library
```ahk
/************************************************************************
 * @file: MyHelper.ahk
 * @description: Collection of utility functions for string manipulation
 * @author: Your Name
 * @version: 1.0.0
 * @date: 2024-01-15
 * @ahk-version: v2.0+
 * @category: DevTools
 * @exports: TrimAll(), SplitPath(), JoinPath()
 ***********************************************************************/
```

### Pattern 2: GUI Application
```ahk
/************************************************************************
 * @file: AppLauncher.ahk
 * @title: Application Launcher
 * @description: Quick launcher for frequently used applications with hotkeys
 * @author: Your Name
 * @version: 2.1.0
 * @date: 2024-02-20
 * @ahk-version: v2.1+
 * @category: GUI
 * @env: Windows 10+, no admin required
 * @permissions: File system read access
 * @config: config.ini for application paths
 * @entrypoint: Auto-execute creates tray menu and registers hotkeys
 * @exports: ShowLauncher(), AddApp(), RemoveApp()
 ***********************************************************************/
```

### Pattern 3: System Automation
```ahk
/************************************************************************
 * @file: BackupAutomation.ahk
 * @description: Automated backup script for important directories
 * @author: Your Name
 * @version: 1.5.2
 * @date: 2024-03-10
 * @repository: https://github.com/user/backup-automation
 * @ahk-version: v2.0+
 * @category: Automation
 * @env: Windows, requires admin rights
 * @permissions: File system write, registry write, network access
 * @config: backup.ini for paths and schedules
 * @arguments: --schedule <daily|weekly>, --path <backup-dir>
 * @sideEffects: Creates backup files, modifies Task Scheduler
 * @requires: 7-Zip (external tool)
 ***********************************************************************/
```

---

## Best Practices

### 1. Be Specific
❌ Bad: `@description: Utility functions`
✅ Good: `@description: String manipulation utilities including trim, split, join, and case conversion with Unicode support`

### 2. Include Context
❌ Bad: `@requires: JSON`
✅ Good: `@requires: JSON.ahk from https://github.com/thqby/ahk2_lib`

### 3. Document Permissions
❌ Bad: `@permissions: File access`
✅ Good: `@permissions: Reads %AppData%, writes to Documents folder, no admin required`

### 4. Version Everything
Always include version numbers when referencing external dependencies:
```ahk
 * @ahk-version: v2.1+
 * @requires: WebView2.ahk v1.0.3+
```

### 5. Link to Issues
```ahk
 * @bugs: https://github.com/user/repo/issues
 * @todo: Fix memory leak in parser (see issue #42)
```

---

## Automation Tips

### For AI/LLM Generation
When asking an AI to generate JSDoc headers:

1. **Provide the full source code** - Don't truncate
2. **Specify AHK v2** explicitly
3. **Request inference** of metadata from code patterns
4. **Ask for confidence levels** on inferred data
5. **Validate GitHub URLs** before including

### For Tooling Integration
- Store templates in `~/.ahk/templates/jsdoc.ahk`
- Use snippets for common categories
- Validate with schema checker
- Auto-update `@date` on save
- Generate `@changelog` from git history

---

## Validation Checklist

Before finalizing a JSDoc header:

- [ ] All required tags present (file, description, version, date)
- [ ] Dates in ISO format (YYYY-MM-DD)
- [ ] Version follows semver
- [ ] GitHub URLs are canonical (not shortened)
- [ ] Keywords are relevant and comma-separated
- [ ] Category matches one of the standard categories
- [ ] Examples are runnable and accurate
- [ ] No duplicate information across tags
- [ ] Line length reasonable (<100 chars)
- [ ] Confidence in all inferred data

---

## Related Documentation

- [Metadata Editor Guide](./METADATA_EDITOR_USAGE.md)
- [AHKv2 Toolbox Settings](./SETTINGS_GUIDE.md)
- [Package Manager](./DEPENDENCY_MANAGER.md)

---

**Last Updated:** 2025-01-26
**Version:** 1.0.0
