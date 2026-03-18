---
name: ci-cd-pipelines
description: >
  Design, implement, and debug CI/CD pipelines using GitHub Actions, GitLab CI,
  and other tools. Covers pipeline architecture, job optimization, caching,
  secrets management in CI, and deployment automation.
---

# CI/CD Pipelines

Design and maintain continuous integration and deployment pipelines that
build, test, and deploy code reliably.

## Use this skill when

- Setting up CI/CD for a new project
- Debugging failing pipeline jobs
- Optimizing pipeline speed (caching, parallelism)
- Adding deployment stages to existing pipelines
- Configuring secrets and environment variables in CI

## Do not use this skill when

- Managing deployment strategies (blue/green) — use `deployment-strategies`
- Writing Docker images — use `containerization`
- Managing cloud infrastructure — use `infrastructure-as-code`

## Instructions

### 1. GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: pytest --cov=app tests/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install ruff
      - run: ruff check .

  deploy:
    needs: [test, lint]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: my-service
          region: europe-west1
          source: .
```

### 2. Pipeline Design Principles

- **Fast feedback:** Lint → Type check → Unit tests → Integration → Deploy
- **Fail fast:** Cheapest checks first
- **Cache aggressively:** Dependencies, Docker layers, build artifacts
- **Parallel when possible:** Independent jobs run concurrently
- **Secrets via vault:** Never hardcode, use `${{ secrets.NAME }}`

### 3. Caching Strategy

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

### 4. Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `Permission denied` | Missing secrets | Add secrets in repo settings |
| Timeout | Slow tests or no cache | Add caching, split jobs |
| `Module not found` | Missing dependency | Check requirements.txt |
| Flaky tests | Race conditions | Fix test, add retry |

## Workflow Integration

**Invoked by:**
- `/ops-check` — when verifying CI/CD health
- `/claude-building` — when adding CI/CD to a project

**After using this skill:** Verify pipeline runs with `verification-before-completion`.

**Related skills:** `git-workflow`, `containerization`, `deployment-strategies`
