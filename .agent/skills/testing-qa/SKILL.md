---
name: testing-qa
description: >
  Generate and manage unit, integration, and e2e tests using pytest, Vitest,
  Playwright, and Testing Library. Covers TDD, test strategy design, coverage
  analysis, and fixture patterns. Use when writing tests, debugging test
  failures, or designing test architecture.
---

# Testing & QA

Comprehensive test generation, strategy design, and quality assurance for
Python and TypeScript/JavaScript projects.

## Use this skill when

- Writing unit, integration, or e2e tests
- Designing test strategy for a new feature or module
- Debugging flaky or failing tests
- Setting up test infrastructure (fixtures, factories, mocks)
- Improving code coverage
- Implementing TDD (Red-Green-Refactor)
- Choosing testing frameworks or tools

## Do not use this skill when

- The task is pure code review without test concerns — use `code-review`
- The issue is a production bug without test context — use `debugging-patterns`
- You need security-specific testing — use `security-scanning`

## Instructions

### 1. Assess Test Needs

Before writing tests, identify:
- **What to test:** Functions, API endpoints, UI components, integrations
- **Test type:** Unit (isolated), Integration (multi-module), E2E (full flow)
- **Coverage gaps:** Run coverage tool first if available

### 2. Choose Framework

| Language | Unit/Integration | E2E | Mocking |
|----------|-----------------|-----|---------|
| Python | pytest | Playwright | unittest.mock, pytest-mock |
| TypeScript | Vitest | Playwright | vi.mock, MSW |
| React | Vitest + Testing Library | Cypress/Playwright | MSW |
| FastAPI | pytest + httpx | Playwright | pytest fixtures |

### 3. Write Tests (TDD Pattern)

```
RED:   Write failing test that defines expected behavior
GREEN: Write minimum code to pass the test
REFACTOR: Clean up while keeping tests green
```

### 4. Test Structure (AAA Pattern)

```python
def test_calculate_tax():
    # Arrange
    income = 50000
    rate = 0.20

    # Act
    result = calculate_tax(income, rate)

    # Assert
    assert result == 10000
```

### 5. Key Patterns

**Fixtures & Factories:**
```python
@pytest.fixture
def sample_user():
    return User(name="Test", email="test@example.com")

@pytest.fixture
def db_session():
    session = create_test_session()
    yield session
    session.rollback()
```

**Mocking External Services:**
```python
@patch("app.services.api_client.fetch")
def test_with_mock(mock_fetch):
    mock_fetch.return_value = {"status": "ok"}
    result = process_data()
    assert result.status == "ok"
    mock_fetch.assert_called_once()
```

**Parametrized Tests:**
```python
@pytest.mark.parametrize("input,expected", [
    (100, 20),
    (0, 0),
    (-50, 0),  # edge case
])
def test_tax_calculation(input, expected):
    assert calculate_tax(input, 0.20) == expected
```

**Integration Test (FastAPI):**
```python
from httpx import AsyncClient

async def test_ask_endpoint(client: AsyncClient):
    response = await client.post("/ask", json={"query": "test"})
    assert response.status_code == 200
    assert "answer" in response.json()
```

**E2E Test (Playwright):**
```python
async def test_login_flow(page):
    await page.goto("/login")
    await page.fill("#email", "user@test.com")
    await page.fill("#password", "password123")
    await page.click("button[type=submit]")
    await expect(page.locator(".dashboard")).to_be_visible()
```

### 6. Coverage Strategy

- Aim for 80%+ line coverage on critical paths
- 100% on business logic (calculations, validations)
- Don't chase 100% overall — diminishing returns
- Always cover edge cases: null, empty, boundary values, error paths

## Anti-Patterns

- ❌ Testing implementation details instead of behavior
- ❌ Mocking everything (tests prove nothing)
- ❌ No assertions (test runs but verifies nothing)
- ❌ Flaky tests left unfixed
- ❌ Copying production data into tests (use factories)

## Workflow Integration

**Invoked by:**
- `/claude-building` — after writing implementation code
- `/test-sprite` — primary skill for test-driven reasoning
- `/debug` — when verifying bug fixes with regression tests

**After using this skill:** Run tests with `verification-before-completion` before claiming done.

**Related skills:** `verification-before-completion`, `debugging-patterns`, `code-review`
