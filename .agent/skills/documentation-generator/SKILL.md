---
name: documentation-generator
description: >
  Generate and maintain technical documentation including JSDoc, Python
  docstrings, README files, API docs, and inline comments. Use when
  documenting code, generating API references, or creating project guides.
---

# Documentation Generator

Create clear, maintainable documentation that serves as the source of truth
for code, APIs, and project setup.

## Use this skill when

- Adding docstrings to functions, classes, or modules
- Generating API documentation (OpenAPI/Swagger)
- Writing or updating README files
- Creating inline code comments for complex logic
- Documenting architecture decisions (ADRs)
- Building developer onboarding guides

## Do not use this skill when

- Writing user-facing product docs (not code docs)
- Creating test documentation — use `testing-qa`
- Reviewing existing docs — use `code-review`

## Instructions

### 1. Python Docstrings (Google Style)

```python
def calculate_tax(income: float, rate: float = 0.20) -> float:
    """Calculate tax amount for given income.

    Args:
        income: Gross income in GEL.
        rate: Tax rate as decimal (default 20%).

    Returns:
        Tax amount in GEL.

    Raises:
        ValueError: If income is negative.

    Example:
        >>> calculate_tax(50000)
        10000.0
    """
    if income < 0:
        raise ValueError("Income cannot be negative")
    return income * rate
```

### 2. TypeScript/JSDoc

```typescript
/**
 * Fetches user profile from the API.
 *
 * @param userId - Unique user identifier
 * @param options - Optional fetch configuration
 * @returns Resolved user profile object
 * @throws {AuthError} If the user is not authenticated
 *
 * @example
 * ```ts
 * const profile = await fetchProfile("user-123");
 * console.log(profile.name);
 * ```
 */
async function fetchProfile(
  userId: string,
  options?: FetchOptions
): Promise<UserProfile> { ... }
```

### 3. README Structure

```markdown
# Project Name

One-line description of what it does.

## Quick Start

Minimum steps to get running (3-5 commands max).

## Features

- Feature 1
- Feature 2

## Architecture

Brief overview or link to architecture docs.

## Development

### Prerequisites
### Installation
### Running Tests
### Deployment

## API Reference

Link to OpenAPI docs or inline reference.

## Contributing

How to submit changes.

## License
```

### 4. OpenAPI/FastAPI Auto-docs

```python
@app.post(
    "/ask",
    response_model=AskResponse,
    summary="Ask a tax question",
    description="Submit a question about Georgian tax law and receive an AI-generated answer with citations.",
    tags=["Tax Agent"],
)
async def ask(request: AskRequest):
    ...
```

### 5. Documentation Principles

- **Document WHY, not WHAT** — code shows what, docs explain why
- **Keep docs next to code** — docstrings > separate docs
- **Update docs with code** — stale docs are worse than no docs
- **Use examples** — concrete examples beat abstract descriptions
- **Be concise** — respect the reader's time

## Workflow Integration

**Invoked by:**
- `/claude-building` — when implementation needs documentation
- Manual invocation — for README or API doc generation

**After using this skill:** Route back to current workflow.

**Related skills:** `api-design-principles`, `code-review`
