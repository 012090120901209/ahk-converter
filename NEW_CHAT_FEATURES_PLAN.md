# New Chat Participant Features Plan

## Current Commands
- `/convert` - Convert v1 to v2
- `/explain` - Explain concepts
- `/fix` - Debug and fix code
- `/optimize` - Performance optimization
- `/example` - Generate examples
- `/attribute` - Library attribution
- `/codemap` - Show code structure
- `/dependencies` - Show include tree
- `/workspace` - Combined overview

## Proposed New Features

### 1. `/syntax` - Syntax Validation
**Purpose**: Check code for AHK v2 syntax issues and common pitfalls
**Implementation**:
- Scans active file for v1 contamination patterns
- Checks for common syntax errors
- Validates modern v2 patterns

### 2. `/symbols` - Quick Symbol Navigation
**Purpose**: List and navigate to symbols (functions, classes, variables)
**Implementation**:
- Shows clickable symbol list from Code Map
- Allows quick navigation
- Can filter by type (functions only, classes only)

### 3. `/refactor` - Refactoring Suggestions
**Purpose**: Suggest refactoring opportunities
**Implementation**:
- Analyzes code structure
- Suggests improvements:
  - Extract function
  - Simplify conditionals
  - Remove duplication
  - Modern v2 idioms

### 4. `/best-practices` - AHK v2 Best Practices
**Purpose**: Review code against AHK v2 best practices
**Implementation**:
- Checks naming conventions
- Validates error handling
- Reviews resource management
- Suggests improvements

### 5. `/test` - Generate Test Cases
**Purpose**: Generate test cases for functions
**Implementation**:
- Analyzes function signatures
- Generates example test cases
- Suggests edge cases to test

### 6. `/docs` - Generate Documentation
**Purpose**: Generate or improve documentation
**Implementation**:
- Analyzes functions/classes
- Generates JSDoc-style comments
- Suggests documentation improvements

### 7. Enhanced Context Features

#### Automatic Symbol Detection
When user mentions a function/class name, automatically include its definition in context

#### Smart Error Context
When fixing errors, include:
- Related function definitions
- Recent changes (if git available)
- Similar working code

#### Dependency Context
When working with includes, automatically show:
- Which functions come from which files
- Circular dependency warnings
- Missing dependency suggestions

## Priority Implementation

**Phase 1: Quick Wins** (Implement Now)
1. `/syntax` - High value, moderate complexity
2. `/symbols` - High value, low complexity
3. Enhanced context (automatic symbol detection)

**Phase 2: Advanced Features** (Future)
1. `/refactor` - High value, high complexity
2. `/best-practices` - Medium value, high complexity
3. `/test` - Medium value, medium complexity

**Phase 3: Documentation** (Optional)
1. `/docs` - Medium value, medium complexity

## Implementation Notes

### Command Registration
Add to `package.json` under `chatParticipants[0].commands`

### Handler Implementation
Add cases to `handleSlashCommand()` method

### Context Enhancement
Modify `getWorkspaceContext()` to detect symbol mentions

## User Feedback Priorities
- What commands do you use most?
- What's missing from your workflow?
- What takes too long to do manually?
