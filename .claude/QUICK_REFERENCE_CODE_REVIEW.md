# Quick Reference: Code Review with Claude Code

A concise cheat sheet for conducting code reviews using Claude Code agents.

## Agent Quick Reference

| Agent | Use Case | Key Strengths |
|-------|----------|---------------|
| `code-reviewer` | General review | Security, quality, performance, best practices |
| `typescript-pro` | TypeScript code | Types, type inference, strict typing |
| `cpp-pro` | C++ code | Memory safety, RAII, modern C++ |
| `ahk-v2-expert` | AutoHotkey v2 | Syntax validation, OOP, GUI |
| `ahk-analysis` | AHK performance | Bottlenecks, patterns, optimization |
| `debugger` | Bug analysis | Root cause, stack traces, failures |

## Common Review Commands

### General Code Review
```
"Review [file/component] for code quality, security, and best practices"
```

### Security-Focused Review
```
"Review [file] for security vulnerabilities, focusing on:
- Input validation
- Authentication/authorization
- Data handling
- OWASP Top 10"
```

### Performance Review
```
"Review [file] for performance issues:
- Algorithm complexity
- Memory usage
- Resource management
- Optimization opportunities"
```

### Pre-Commit Review
```
"Review my staged changes for:
- Code quality
- Potential bugs
- Style consistency
- Test coverage"
```

### Pull Request Review
```
"Review PR #[number] for:
- Security issues
- Code quality
- Breaking changes
- Test coverage"
```

### Bug Fix Verification
```
"Review this bug fix in [file] to verify:
- Root cause is addressed
- No new bugs introduced
- Proper error handling
- Test coverage for the bug"
```

## Quick Workflows

### Basic Review (3 steps)
1. Invoke `code-reviewer` with specific focus areas
2. Address Critical and High priority issues
3. Run tests to verify fixes

### Thorough Review (5 steps)
1. `code-reviewer` - General assessment
2. Language-specific agent - Specialized review
3. Fix issues found
4. `debugger` - If tests fail
5. Final `code-reviewer` - Verification

### Pre-Commit (4 steps)
1. Run tests
2. `code-reviewer` - Quick review of staged changes
3. Fix any Critical/High issues
4. Commit with descriptive message

### PR Review (6 steps)
1. Read PR description
2. `code-reviewer` - Comprehensive review
3. Check tests and documentation
4. Leave feedback with file:line references
5. Request changes or approve
6. Verify changes before merge

## Review Priority Guide

| Priority | When to Address | Examples |
|----------|----------------|----------|
| **Critical** | Immediately, block merge | Security holes, data corruption, crashes |
| **High** | Before merge | Logic errors, poor error handling, test gaps |
| **Medium** | Soon, or next iteration | Code duplication, naming issues, performance |
| **Low** | Future cleanup | Style preferences, optional optimizations |

## Common Focus Areas

### Security
- Input validation and sanitization
- Authentication and authorization
- SQL injection, XSS, CSRF
- Secrets and credentials
- Error message information leakage

### Performance
- Algorithm complexity (O(n²) → O(n log n))
- Database query optimization (N+1 queries)
- Memory leaks and resource cleanup
- Caching opportunities
- Bundle size and lazy loading

### Code Quality
- Readability and maintainability
- Function/method length (<50 lines ideal)
- Cyclomatic complexity (<10 ideal)
- Naming clarity and consistency
- DRY principle (Don't Repeat Yourself)

### Testing
- Test coverage (>80% ideal)
- Edge case coverage
- Error path testing
- Integration test gaps
- Mock/stub appropriateness

## Language-Specific Checklist

### TypeScript
- [ ] Proper type annotations
- [ ] No `any` types (use `unknown` if needed)
- [ ] Null/undefined handling
- [ ] Async/await error handling
- [ ] Proper module imports/exports

### C++
- [ ] No memory leaks
- [ ] RAII for resource management
- [ ] Const correctness
- [ ] Move semantics where appropriate
- [ ] Thread safety

### AutoHotkey v2
- [ ] v2 syntax (not v1)
- [ ] `:=` for assignment
- [ ] Object syntax (not command mode)
- [ ] Proper event binding (`.Bind(this)`)
- [ ] GUI cleanup on exit

## Useful Prompts

### Request Context
```
"Before reviewing, please explain what this [component/feature] does"
```

### Incremental Review
```
"Review just the security aspects first"
"Now review the performance"
```

### Specific Concern
```
"I'm concerned about [specific issue]. Can you focus on that?"
```

### Comparison
```
"Compare this approach with [alternative]. Which is better and why?"
```

### Follow-up
```
"Verify that my fixes for [issue] are correct"
```

## Tips for Better Reviews

### DO
✅ Be specific about what to review
✅ Provide context and constraints
✅ Focus on high-risk areas
✅ Use multiple agents for thorough review
✅ Test suggested fixes before committing
✅ Document decisions and trade-offs

### DON'T
❌ Review too much at once (>500 lines)
❌ Skip tests before reviewing
❌ Ignore context and requirements
❌ Block on low-priority issues
❌ Forget to verify fixes work
❌ Review without running the code

## Troubleshooting

**Issue**: Agent gives vague feedback
**Fix**: Be more specific in prompt, provide file paths

**Issue**: Review takes too long
**Fix**: Break into smaller chunks, review changed files only

**Issue**: Missing critical issues
**Fix**: Use multiple specialized agents, be explicit about concerns

**Issue**: Overwhelmed by suggestions
**Fix**: Focus on Critical/High first, batch low priority items

## Quick Setup

### First Time Setup
1. Ensure `.claude/agents/code-reviewer.md` exists
2. Familiarize yourself with available agents
3. Review this quick reference
4. Try a small review to test

### Regular Use
1. Keep this file handy for quick reference
2. Use prompts from "Common Review Commands"
3. Follow appropriate workflow from "Quick Workflows"
4. Adapt prompts to your specific needs

## Example Session

```
// 1. Initial review
"Review src/auth/login.ts for security issues"

// 2. Agent provides detailed report with issues

// 3. Fix critical issues

// 4. Verify fixes
"Verify my security fixes in src/auth/login.ts"

// 5. TypeScript-specific review
"Use typescript-pro to review the type safety"

// 6. Final check
"Quick review to confirm all critical issues are resolved"
```

## Resources

- Full Documentation: `docs/CODE_REVIEW_WORKFLOWS.md`
- Agent Definitions: `.claude/agents/`
- Claude Code Docs: https://docs.claude.com/claude-code

---

**Version**: 1.0
**Last Updated**: 2025-11-07
