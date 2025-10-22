# AHK v2 Debugger Window Reader

## Overview

The AHK v2 Debugger Window Reader is a standalone utility that captures debugging information from AutoHotkey v2's built-in debugger and formats it for LLM consumption. This tool enables AI-assisted code analysis and troubleshooting by providing structured debug data.

## Outstanding Issues in Current Project

| Issue | Priority | Description | Solution |
|-------|----------|-------------|----------|
| Missing `dist/` directory | High | Extension build output missing - prevents installation | Run `npm run compile` to generate dist files |
| Incomplete CHANGELOG | Medium | Only shows v0.1.0, current version is 0.1.5 | Update CHANGELOG.md with version history |
| Missing error handling | Medium | No validation for malformed AHK files | Add try-catch blocks in conversion functions |
