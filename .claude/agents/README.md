# Claude Code Agents

This directory contains custom agent definitions for Claude Code's Task tool system.

## What Are Agents?

Agents are specialized AI assistants that can be invoked to perform specific tasks. Each agent has:
- A defined purpose and expertise
- Access to specific tools
- Custom instructions and workflows
- A preferred model (sonnet, opus, or haiku)

## Available Agents

### Code Review & Analysis

**code-reviewer** (⭐ Custom)
- Comprehensive code quality, security, and performance review
- Multi-category issue identification (Critical, High, Medium, Low)
- Structured review reports with actionable recommendations
- Usage: For PR reviews, pre-commit checks, quality audits

### Language Specialists

**typescript-pro**
- Advanced TypeScript type system expertise
- Strict typing and type inference optimization
- Usage: TypeScript code review and optimization

**cpp-pro**
- Modern C++ best practices (RAII, smart pointers, STL)
- Memory safety and performance optimization
- Usage: C++ code review and modernization

**ahk-v2-expert**
- AutoHotkey v2 syntax validation and code generation
- OOP patterns, GUI development, event handling
- Usage: AHK code review, v1 to v2 migration

**ahk-analysis**
- AHK v2 performance analysis and pattern recognition
- Code structure and optimization recommendations
- Usage: AHK performance review and refactoring

### Specialized Tools

**debugger**
- Root cause analysis for bugs and failures
- Stack trace interpretation and fix implementation
- Usage: Investigating errors and test failures

**prompt-engineer**
- AI prompt optimization and LLM integration
- Agent performance tuning
- Usage: Reviewing AI-related code and prompts

**mcp-*** (Multiple)
- MCP server development and integration specialists
- Protocol implementation and deployment
- Usage: MCP-related development tasks

**research-coordinator**
- Strategic planning for complex research tasks
- Multi-specialist coordination
- Usage: Complex multi-faceted research projects

## How to Use Agents

### Method 1: Directly in Conversation

Simply ask Claude Code to use an agent:

```
"Use the code-reviewer agent to review my authentication module"
```

Claude Code will automatically invoke the appropriate agent using the Task tool.

### Method 2: Explicit in Code (for developers)

```typescript
// Claude Code will invoke the agent like this:
Task({
  subagent_type: "code-reviewer",
  description: "Review authentication",
  prompt: `Review the authentication module in src/auth/ for:
  - Security vulnerabilities
  - Error handling
  - Code quality

  Focus on the login flow.`
})
```

### Method 3: Via Slash Commands

Create a custom slash command (in `.claude/commands/`) that invokes agents:

```markdown
<!-- .claude/commands/review.md -->
Use the code-reviewer agent to review the currently active file or
the files mentioned in the user's message. Provide a comprehensive
review covering security, performance, and code quality.
```

Then use: `/review` in your conversation.

## Creating Custom Agents

### Agent File Format

Create a new `.md` file in this directory with the following structure:

```markdown
---
name: agent-name
description: Brief description of what the agent does
tools: Read, Write, Edit, Bash, Grep
model: sonnet
---

[Agent instructions and prompt go here]

## Sections can include:
- Purpose and responsibilities
- Process and workflow
- Output format
- Best practices
- Examples
```

### Agent Definition Fields

**name** (required)
- Unique identifier for the agent
- Used when invoking: `subagent_type: "agent-name"`
- Use kebab-case (lowercase with hyphens)

**description** (required)
- Brief, clear description of agent's purpose
- Shown in tool selection interfaces
- Should include when to use the agent

**tools** (required)
- Comma-separated list of available tools
- Common tools: Read, Write, Edit, Bash, Grep, Glob
- Special: `All tools` for full access

**model** (optional)
- Preferred model: `sonnet`, `opus`, or `haiku`
- Defaults to parent/session model if not specified
- Use `haiku` for quick, straightforward tasks

### Best Practices for Agent Creation

1. **Clear Purpose**: Define a specific, focused purpose
2. **Detailed Instructions**: Provide comprehensive workflow steps
3. **Structured Output**: Specify expected output format
4. **Examples**: Include usage examples and scenarios
5. **Tool Selection**: Only request necessary tools
6. **Model Choice**: Choose appropriate model for task complexity

### Example Custom Agent

```markdown
---
name: test-optimizer
description: Analyzes and optimizes test suites for speed and coverage
tools: Read, Write, Edit, Bash
model: sonnet
---

You are a test optimization specialist.

## Responsibilities
1. Analyze test suite structure and execution
2. Identify slow or redundant tests
3. Recommend parallel execution strategies
4. Optimize test coverage

## Process
1. Read all test files in the project
2. Analyze test execution patterns
3. Identify optimization opportunities
4. Provide specific recommendations

## Output Format
- Test execution analysis
- Performance bottlenecks
- Optimization recommendations
- Implementation examples
```

## Agent Invocation Strategies

### Single Agent
Use for focused, specific tasks:
```
"Use typescript-pro to review the type definitions"
```

### Sequential Agents
Use for thorough, multi-step analysis:
```
"First use code-reviewer for general review, then typescript-pro for
type system specifics, then debugger if any issues are found"
```

### Parallel Agents
Use for independent aspects (faster):
```
"Review this PR using code-reviewer for security and typescript-pro
for types in parallel"
```

## Common Patterns

### Pre-Commit Review
```
code-reviewer → Fix issues → Run tests
```

### Feature Review
```
code-reviewer → Language specialist → debugger (if needed)
```

### Architecture Review
```
code-reviewer (architecture focus) → Multiple specialist agents
```

### Bug Investigation
```
debugger → code-reviewer (verify fix) → Language specialist (optimization)
```

## Tips

1. **Be Specific**: Provide clear focus areas in your prompt
2. **Use Context**: Reference specific files, functions, or concerns
3. **Iterate**: Review → Fix → Verify → Review again
4. **Combine**: Use multiple agents for comprehensive analysis
5. **Learn**: Review agent outputs to improve your code over time

## Resources

- **Quick Reference**: `.claude/QUICK_REFERENCE_CODE_REVIEW.md`
- **Full Documentation**: `docs/CODE_REVIEW_WORKFLOWS.md`
- **Claude Code Docs**: https://docs.claude.com/claude-code
- **Project INDEX**: `docs/INDEX.md`

## Contributing

To add a new agent:
1. Create a new `.md` file in this directory
2. Follow the format above
3. Test the agent thoroughly
4. Update this README with the new agent
5. Add usage documentation in `docs/CODE_REVIEW_WORKFLOWS.md`
6. Update `.claude/QUICK_REFERENCE_CODE_REVIEW.md` if applicable

---

**Last Updated**: 2025-11-07
**Agents Available**: 10+
