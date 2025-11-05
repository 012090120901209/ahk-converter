# Workspace Summaries via Chat Commands

This guide explains how to use the AHKv2 Toolbox chat participant to export the current Code Map and Dependency Map (1Include relationships) directly into a GitHub Copilot Chat conversation. These summaries make it easy for an LLM to reason about your script structure and cross-file dependencies without leaving the chat pane.

## Prerequisites

- VS Code 1.90 or later with GitHub Copilot Chat enabled
- AHKv2 Toolbox extension v0.4.3 or newer
- An AutoHotkey v2 workspace with the Code Map and Dependency Map views available
- An `.ahk` file opened in the active editor (required for live data)

## Available Chat Commands

| Command | Purpose |
| --- | --- |
| `@ahk /codemap` | Streams the active files Code Map as an ASCII tree with counts for classes, functions, methods, variables, parameters, hotkeys, header directives, includes, and `#HotIf` directives. |
| `@ahk /dependencies` | Streams the resolved `#Include` tree for the active file, highlights unresolved includes, and reports include depth statistics. |
| `@ahk /workspace` | Combines both summaries so the LLM receives structure and dependency context together. |

## Example Conversation

```
You: @ahk /workspace

Assistant:
### Code Map Snapshot
**File:** `Lib/GuiToolkit.ahk`
Generated: 11/04/2025, 10:15:09 AM

```text
[Root] GuiToolkit.ahk
├── [C] GuiToolkit
│   ├── [M] __New (static)
│   ├── [M] CreateWindow
│   └── [M] Destroy
└── [F] ShowDemo
```

**Summary**
- Classes: 1
- Functions: 1
- Methods: 3
- Variables: 0
- Parameters: 5
- Hotkeys: 0
- Header Directives: 1
- Includes: 2
- #HotIf Directives: 0

### Dependency Map Snapshot
**Root:** `Lib/GuiToolkit.ahk`
Generated: 11/04/2025, 10:15:09 AM

```text
[Root] Lib/GuiToolkit.ahk
├── [Inc] Lib/GuiControls.ahk
└── [Missing] Lib/ThemeKit.ahk
```

**Summary**
- Unique dependency files: 1
- Total resolved #Include links: 1
- Maximum include depth: 1
- Unresolved includes (1):
  - Lib/ThemeKit.ahk
```

The command output is streamed directly into the chat, ready for the LLM to reference in follow-up requests (e.g., `/fix`, `/optimize`, or a custom prompt).

## Tips

- Open the script you want summarized before running the commands. The snapshot uses the active editor.
- Pin the Dependency Map view if you want `/workspace` to always reference a specific root file.
- The ASCII trees respect the Code Map filters (classes only, variables only, etc.). Adjust the filters before running the command to tailor the output.
- Use `/codemap` or `/dependencies` individually when you only need part of the context to reduce token usage.

## Troubleshooting

| Issue | Resolution |
| --- | --- |
| "Open an `.ahk` file to generate a code map summary" | Ensure an AutoHotkey file is active in the editor. |
| "Dependency Map view is not available" | Open the workspace folder that contains your scripts so the Dependency Map can load. |
| Missing includes are listed in the summary | Review the unresolved paths and update your project structure or `#Include` statements. |

## Related Documentation

- [Code Map Architecture](PARSE_STRUCTURE.md)
- [Dependency Tree Internals](DEPENDENCY_TREE.md)
- [Chat Participant Usage Guide - Library Attribution](chat-participant-usage-guide.md)
