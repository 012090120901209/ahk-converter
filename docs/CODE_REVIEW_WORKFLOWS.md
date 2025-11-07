# Code Review Workflows with Claude Code

This guide documents workflows for conducting comprehensive code analysis and review using Claude Code's agent system.

## Table of Contents

- [Available Agents for Code Review](#available-agents-for-code-review)
- [Basic Code Review Workflow](#basic-code-review-workflow)
- [Specialized Review Workflows](#specialized-review-workflows)
- [Multi-Agent Review Strategy](#multi-agent-review-strategy)
- [Common Review Scenarios](#common-review-scenarios)
- [Best Practices](#best-practices)
- [Integration with Development Workflow](#integration-with-development-workflow)

## Available Agents for Code Review

### Primary Review Agent

**`code-reviewer`** (Custom Agent)
- **Purpose**: Comprehensive code analysis and review
- **Specialties**: Code quality, security, performance, best practices
- **When to use**: General code review, PR reviews, quality assessments
- **Invocation**: Use the Task tool with `subagent_type: "code-reviewer"`

### Language-Specific Agents

**`typescript-pro`**
- **Purpose**: TypeScript code optimization and type system expertise
- **Specialties**: Advanced types, strict typing, type inference
- **When to use**: TypeScript code review, type system refactoring
- **Tools**: Read, Write, Edit, Bash

**`cpp-pro`**
- **Purpose**: Idiomatic C++ code with modern features
- **Specialties**: RAII, smart pointers, STL, templates, move semantics
- **When to use**: C++ code review, memory safety analysis
- **Tools**: Read, Write, Edit, Bash

**`ahk-v2-expert`**
- **Purpose**: AutoHotkey v2 code generation, review, and validation
- **Specialties**: v2 syntax, GUI, OOP patterns, event handling
- **When to use**: AHK code review, v1 to v2 migration validation
- **Tools**: All tools

**`ahk-analysis`**
- **Purpose**: AHK v2 code analysis for performance and patterns
- **Specialties**: Performance bottlenecks, pattern recognition, best practices
- **When to use**: Performance review, code structure analysis
- **Tools**: All tools

### Supporting Agents

**`debugger`**
- **Purpose**: Root cause analysis for bugs and failures
- **Specialties**: Error diagnosis, stack traces, test failures
- **When to use**: Investigating bugs found during review
- **Tools**: Read, Write, Edit, Bash, Grep

**`prompt-engineer`**
- **Purpose**: AI integration and prompt optimization
- **Specialties**: LLM prompts, agent performance
- **When to use**: Reviewing AI-related code
- **Tools**: Read, Write, Edit

## Basic Code Review Workflow

### Step 1: Identify Review Scope

Before starting, determine:
- Which files or components need review
- The type of review needed (security, performance, general quality)
- Any specific concerns or areas of focus

### Step 2: Invoke the Code Reviewer

Use the Task tool to launch the code-reviewer agent:

```typescript
// Example: Claude Code will invoke this for you
Task({
  subagent_type: "code-reviewer",
  description: "Review authentication module",
  prompt: `Please review the authentication module in src/auth/ for:
  - Security vulnerabilities
  - Error handling
  - Code quality and maintainability

  Focus on the login flow and session management.`
})
```

### Step 3: Review the Report

The agent will provide a structured report with:
- Summary of findings
- Categorized issues (Critical, High, Medium, Low priority)
- Specific file:line references
- Code examples for fixes
- Overall assessment

### Step 4: Address Findings

Work through the issues starting with Critical and High priority items:
1. Fix critical security issues immediately
2. Address high priority bugs and logic errors
3. Consider medium priority improvements
4. Plan low priority enhancements for future iterations

### Step 5: Verification

After making changes:
- Run tests to verify fixes
- Use the `debugger` agent if issues persist
- Consider a follow-up review for significant changes

## Specialized Review Workflows

### Security-Focused Review

For security-critical code:

1. **Use code-reviewer with security focus**
   ```
   Focus areas:
   - Input validation and sanitization
   - Authentication and authorization
   - Data encryption and storage
   - API security
   - OWASP Top 10 vulnerabilities
   ```

2. **Manual verification**
   - Test edge cases with malformed input
   - Verify secrets are not hardcoded
   - Check for proper error messages (no info leakage)

3. **Documentation**
   - Document security assumptions
   - Note any accepted risks
   - Update threat model

### Performance Review

For performance-critical code:

1. **Use code-reviewer with performance focus**
   ```
   Focus areas:
   - Algorithm complexity
   - Database query efficiency
   - Memory usage patterns
   - Caching strategies
   - Resource cleanup
   ```

2. **Use language-specific agents**
   - `cpp-pro` for C++ performance optimization
   - `typescript-pro` for TypeScript optimization
   - `ahk-analysis` for AHK performance

3. **Benchmarking**
   - Run performance tests before and after
   - Profile critical paths
   - Validate improvements

### Architecture Review

For structural and design review:

1. **Use code-reviewer with architecture focus**
   ```
   Focus areas:
   - Separation of concerns
   - Modularity and coupling
   - Dependency management
   - Design pattern usage
   - Scalability considerations
   ```

2. **Consider using general-purpose agent**
   - For complex multi-file analysis
   - When exploring architectural patterns
   - For refactoring recommendations

### Pre-Commit Review

For reviewing your own code before committing:

1. **Quick self-review checklist**
   - Are there any console.log or debug statements?
   - Are all functions properly documented?
   - Do tests pass?
   - Is there any commented-out code?

2. **Automated review**
   ```
   Use code-reviewer to review staged changes:
   "Please review the files I'm about to commit for:
   - Code quality issues
   - Potential bugs
   - Style consistency"
   ```

3. **Focus on impact**
   - Pay extra attention to public API changes
   - Verify backward compatibility
   - Check for breaking changes

## Multi-Agent Review Strategy

For comprehensive reviews, use multiple agents in sequence or parallel:

### Sequential Review (Thorough)

1. **General Review**: Use `code-reviewer` for overall assessment
2. **Language-Specific**: Use appropriate specialist (typescript-pro, cpp-pro, etc.)
3. **Debugging**: Use `debugger` for any issues found
4. **Final Verification**: Quick pass with `code-reviewer`

### Parallel Review (Fast)

Invoke multiple agents simultaneously for independent aspects:

```typescript
// Claude Code can launch these in parallel
[
  Task({ subagent_type: "code-reviewer", prompt: "Security review" }),
  Task({ subagent_type: "typescript-pro", prompt: "Type system review" }),
  Task({ subagent_type: "debugger", prompt: "Test failure analysis" })
]
```

### Specialized Review Chains

**For TypeScript Projects:**
1. `typescript-pro` → Review types and TypeScript patterns
2. `code-reviewer` → Overall quality and security
3. `debugger` → If any test failures

**For AHK Projects:**
1. `ahk-v2-expert` → Syntax and v2 compliance
2. `ahk-analysis` → Performance and patterns
3. `code-reviewer` → General code quality

**For C++ Projects:**
1. `cpp-pro` → Modern C++ patterns and memory safety
2. `code-reviewer` → Security and architecture
3. `debugger` → Memory leak or crash investigation

## Common Review Scenarios

### Scenario 1: New Feature Review

**Context**: Just implemented a new user registration feature

**Workflow**:
```
1. Invoke code-reviewer:
   "Review the new user registration feature in src/auth/register.ts
   focusing on:
   - Input validation
   - Error handling
   - Database transactions
   - Email validation and sending"

2. Address critical/high priority issues

3. Run tests: npm test

4. If tests fail, use debugger agent

5. Final verification review
```

### Scenario 2: Bug Fix Review

**Context**: Fixed a bug in payment processing

**Workflow**:
```
1. Invoke debugger agent first:
   "Analyze the bug fix in src/payments/process.ts
   to ensure the root cause is addressed"

2. Invoke code-reviewer:
   "Review the bug fix for:
   - Completeness of the fix
   - No introduction of new bugs
   - Proper error handling
   - Test coverage"

3. Verify tests cover the bug scenario

4. Consider adding regression tests
```

### Scenario 3: Refactoring Review

**Context**: Refactored authentication module for better testability

**Workflow**:
```
1. Invoke code-reviewer:
   "Review refactored authentication module for:
   - Improved testability
   - Maintained functionality
   - No breaking changes
   - Better separation of concerns"

2. Verify all existing tests still pass

3. Check for any performance regressions

4. Update documentation if needed
```

### Scenario 4: Pull Request Review

**Context**: Reviewing a teammate's PR

**Workflow**:
```
1. Check PR description and scope

2. Invoke code-reviewer:
   "Review PR #123 which adds social login feature:
   - Security of OAuth implementation
   - Error handling
   - Code quality and style
   - Test coverage"

3. Check for:
   - Tests are included
   - Documentation is updated
   - No merge conflicts
   - Follows project conventions

4. Leave constructive feedback

5. Request changes or approve
```

### Scenario 5: Legacy Code Modernization

**Context**: Updating old code to modern standards

**Workflow**:
```
1. Invoke appropriate language agent:
   typescript-pro: "Review legacy code modernization"
   cpp-pro: "Review C++11 to C++17 migration"
   ahk-v2-expert: "Review AHK v1 to v2 conversion"

2. Invoke code-reviewer:
   "Verify modernized code maintains:
   - Original functionality
   - Improved safety/quality
   - Better performance
   - Enhanced maintainability"

3. Comprehensive testing

4. Document breaking changes
```

## Best Practices

### Before Review

1. **Ensure code compiles/runs**
   - Fix syntax errors first
   - Ensure basic functionality works
   - Run existing tests

2. **Prepare context**
   - Document what changed and why
   - Note any specific concerns
   - Identify high-risk areas

3. **Check scope**
   - Review manageable chunks (< 500 lines)
   - Break large reviews into multiple sessions
   - Focus on one aspect at a time if needed

### During Review

1. **Be systematic**
   - Follow the agent's structured approach
   - Don't skip sections
   - Take notes on findings

2. **Consider context**
   - Understand the problem being solved
   - Consider time/resource constraints
   - Balance perfection with pragmatism

3. **Ask questions**
   - If something is unclear, investigate
   - Use additional agents for deep dives
   - Consult documentation and references

### After Review

1. **Prioritize findings**
   - Address critical issues immediately
   - Plan for high/medium priority items
   - Log low priority items for future work

2. **Document decisions**
   - Record why certain approaches were chosen
   - Note accepted trade-offs
   - Update architectural decision records (ADRs)

3. **Learn and improve**
   - Identify patterns in issues found
   - Update style guides or linting rules
   - Share learnings with the team

## Integration with Development Workflow

### Git Hooks Integration

You can use Claude Code hooks to trigger reviews:

```json
// .claude/hooks/pre-commit.sh
{
  "trigger": "pre-commit",
  "action": "review-staged-changes"
}
```

### CI/CD Integration

Consider automated reviews in CI:
- Run code-reviewer on changed files
- Block merges on critical issues
- Generate review reports in PR comments

### Regular Review Schedule

Establish a review cadence:
- **Daily**: Review your own commits before pushing
- **Weekly**: Team code review sessions
- **Monthly**: Codebase health check with general-purpose agent
- **Quarterly**: Architecture review

### Review Checklist Template

Create a standardized checklist:

```markdown
## Code Review Checklist

### Functionality
- [ ] Code accomplishes intended purpose
- [ ] Edge cases are handled
- [ ] Error handling is appropriate

### Code Quality
- [ ] Code is readable and maintainable
- [ ] Naming is clear and consistent
- [ ] No unnecessary complexity

### Testing
- [ ] Tests are included
- [ ] Tests cover edge cases
- [ ] All tests pass

### Security
- [ ] No security vulnerabilities
- [ ] Input is validated
- [ ] Secrets are not exposed

### Performance
- [ ] No obvious performance issues
- [ ] Resources are properly managed
- [ ] Algorithms are appropriate

### Documentation
- [ ] Code is properly commented
- [ ] Public APIs are documented
- [ ] README is updated if needed
```

## Tips for Effective Reviews

1. **Start with the big picture**: Understand what the code does before diving into details

2. **Use multiple agents**: Different agents catch different issues

3. **Review in context**: Consider the surrounding code and architecture

4. **Be thorough but practical**: Don't let perfect be the enemy of good

5. **Verify fixes**: Always test that suggested fixes actually work

6. **Keep learning**: Each review is an opportunity to improve

7. **Communicate clearly**: Whether reviewing your own code or others', clear communication is key

8. **Use automation**: Let agents handle mechanical checks so you can focus on logic and design

9. **Follow up**: Track issues found and verify they're resolved

10. **Share knowledge**: Document patterns and learnings for the team

## Troubleshooting

### Agent Returns Generic Feedback

**Problem**: Agent gives vague or general feedback

**Solution**:
- Be more specific in your prompt
- Provide file paths explicitly
- Mention specific concerns or focus areas
- Give context about the project

### Review Takes Too Long

**Problem**: Review is taking excessive time

**Solution**:
- Break into smaller chunks
- Use parallel agent invocation
- Focus on changed files only
- Use faster model (haiku) for quick checks

### Missing Critical Issues

**Problem**: Agent doesn't catch an obvious issue

**Solution**:
- Use multiple specialized agents
- Be explicit about security/performance concerns
- Run debugger agent if tests fail
- Manual review for domain-specific issues

### Too Many Low Priority Issues

**Problem**: Overwhelmed by minor suggestions

**Solution**:
- Focus on Critical/High priority first
- Create technical debt tickets for later
- Update linting rules to catch automatically
- Batch low priority fixes

## Resources

- Claude Code Documentation: https://docs.claude.com/claude-code
- Task Tool Reference: See Claude Code docs
- Agent Definitions: `.claude/agents/`
- Project Style Guide: `Style_Guide.md`

## Examples

See `examples/` directory for:
- Example review reports
- Sample prompts for different scenarios
- Integration scripts and hooks

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Maintainer**: Project Team
