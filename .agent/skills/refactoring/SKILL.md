---
name: refactoring
description: >
  Systematic code refactoring patterns for improving structure without
  changing behavior. Covers extract method, rename, move, code smell
  elimination, and safe refactoring workflows. Use when improving code
  quality, reducing complexity, or paying down technical debt.
---

# Refactoring

Improve code structure, readability, and maintainability without changing
external behavior. Every refactoring must be backed by tests.

## Use this skill when

- Reducing complexity in large functions or classes
- Eliminating code duplication (DRY violations)
- Improving naming for clarity
- Restructuring modules or file organization
- Paying down technical debt
- Preparing code for new feature additions

## Do not use this skill when

- Adding new behavior — that's implementation, not refactoring
- The code has no tests (write tests first with `testing-qa`)
- Reviewing code without changing it — use `code-review`

## Instructions

### 1. Safety First

```
RULE: Never refactor without tests covering the affected code.
If no tests exist → write characterization tests first.
```

### 2. Core Refactoring Patterns

**Extract Function:**
```python
# Before
def process_order(order):
    # validate
    if not order.items:
        raise ValueError("Empty order")
    if order.total < 0:
        raise ValueError("Invalid total")
    # calculate
    subtotal = sum(item.price for item in order.items)
    tax = subtotal * 0.18
    total = subtotal + tax
    return total

# After
def validate_order(order):
    if not order.items:
        raise ValueError("Empty order")
    if order.total < 0:
        raise ValueError("Invalid total")

def calculate_total(items, tax_rate=0.18):
    subtotal = sum(item.price for item in items)
    tax = subtotal * tax_rate
    return subtotal + tax

def process_order(order):
    validate_order(order)
    return calculate_total(order.items)
```

**Replace Magic Numbers:**
```python
# Before
if len(password) < 8:
    ...
if retry_count > 3:
    ...

# After
MIN_PASSWORD_LENGTH = 8
MAX_RETRIES = 3

if len(password) < MIN_PASSWORD_LENGTH:
    ...
if retry_count > MAX_RETRIES:
    ...
```

**Guard Clauses (Reduce Nesting):**
```python
# Before
def process(data):
    if data:
        if data.is_valid():
            if data.type == "A":
                return handle_a(data)
            else:
                return handle_b(data)

# After
def process(data):
    if not data:
        return None
    if not data.is_valid():
        raise ValueError("Invalid data")
    if data.type == "A":
        return handle_a(data)
    return handle_b(data)
```

**Replace Conditionals with Polymorphism:**
```python
# Before
def calculate_area(shape):
    if shape.type == "circle":
        return 3.14 * shape.radius ** 2
    elif shape.type == "rectangle":
        return shape.width * shape.height

# After
class Circle:
    def area(self): return 3.14 * self.radius ** 2

class Rectangle:
    def area(self): return self.width * self.height
```

### 3. Refactoring Workflow

```
1. Ensure tests pass (baseline)
2. Make ONE small refactoring change
3. Run tests — must still pass
4. Commit with `refactor:` prefix
5. Repeat
```

### 4. When to Stop

- Code is readable and intention-revealing
- No obvious duplication remains
- Functions are single-responsibility
- Nesting depth ≤ 3 levels
- Don't over-engineer: YAGNI

## Anti-Patterns

- ❌ Refactoring and adding features in the same commit
- ❌ Refactoring without tests
- ❌ Big-bang refactoring (change everything at once)
- ❌ Premature abstraction (extracting after seeing only 1 case)

## Workflow Integration

**Invoked by:**
- `/claude-building` — when code quality needs improvement
- `/code-review` — when review identifies refactoring opportunities

**After using this skill:** Run `verification-before-completion` to prove behavior unchanged.

**Related skills:** `code-review`, `testing-qa`, `debugging-patterns`
