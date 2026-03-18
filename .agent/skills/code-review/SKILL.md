---
name: code-review
description: >
  Systematic code review for quality, correctness, and maintainability.
  Covers anti-pattern detection, PR review, naming conventions, complexity
  analysis, and constructive feedback. Use when reviewing PRs, auditing
  code quality, or enforcing coding standards.
---

# Code Review

Systematic, constructive code review focusing on correctness, readability,
maintainability, and adherence to best practices.

## Use this skill when

- Reviewing pull requests or merge requests
- Auditing code quality before release
- Identifying anti-patterns and code smells
- Enforcing team coding standards
- Providing constructive feedback on implementations

## Do not use this skill when

- Reviewing system architecture — use `architect-review`
- Writing tests for reviewed code — use `testing-qa`
- Fixing security vulnerabilities — use `security-scanning`

## Instructions

### 1. Review Checklist

For every code review, evaluate:

**Correctness:**
- [ ] Logic handles all cases (happy path + edge cases)
- [ ] Error handling is present and appropriate
- [ ] No off-by-one errors, null derefs, or race conditions
- [ ] Return types match expectations

**Readability:**
- [ ] Names are descriptive and consistent
- [ ] Functions are focused (single responsibility)
- [ ] Comments explain "why", not "what"
- [ ] No dead code or commented-out blocks

**Maintainability:**
- [ ] DRY — no duplicated logic
- [ ] Proper abstraction level (not over/under-engineered)
- [ ] Dependencies are appropriate
- [ ] Configuration externalized (no magic numbers/strings)

**Performance:**
- [ ] No N+1 queries or unbounded loops
- [ ] Appropriate data structures used
- [ ] Expensive operations cached or batched

**Security:**
- [ ] Input validated and sanitized
- [ ] No secrets in code
- [ ] Auth checks on protected operations

### 2. Code Smells to Flag

| Smell | Example | Fix |
|-------|---------|-----|
| Long function | >30 lines | Extract subfunctions |
| Deep nesting | >3 levels | Early returns, guard clauses |
| God class | Does everything | Split by responsibility |
| Primitive obsession | Dict everywhere | Create data classes/types |
| Feature envy | Accesses other class data | Move method to data owner |
| Magic numbers | `if x > 86400` | Named constant `SECONDS_PER_DAY` |
| Boolean params | `process(data, True, False)` | Use named params or enums |

### 3. Feedback Format

```markdown
## Summary
Brief overall assessment (1-2 sentences)

## Must Fix 🔴
- [file:line] Description of critical issue

## Should Fix 🟡
- [file:line] Description of important improvement

## Suggestions 🟢
- [file:line] Optional enhancement idea

## Praise ⭐
- Highlight what was done well
```

### 4. Review Principles

- **Be specific:** Point to exact lines, suggest alternatives
- **Be constructive:** Suggest how to fix, not just what's wrong
- **Be kind:** Praise good patterns, not just critique
- **Prioritize:** Must-fix vs. nice-to-have
- **Ask questions:** "Is there a reason for X?" instead of "X is wrong"

## Workflow Integration

**Invoked by:**
- `/claude-building` — after implementation, before completion
- Manual invocation — for PR review

**After using this skill:** If issues found → back to `/claude-building` to fix. If clean → proceed to `verification-before-completion`.

**Related skills:** `testing-qa`, `refactoring`, `architect-review`
