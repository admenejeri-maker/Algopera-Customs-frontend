---
name: dependency-auditing
description: >
  CVE scanning, supply chain security, lock file integrity, and dependency
  update strategies. Use when checking for known vulnerabilities in project
  dependencies or planning dependency upgrades.
---

# Dependency Auditing

Detect and remediate vulnerable dependencies and manage package updates safely.

## Use this skill when

- Checking project dependencies for known vulnerabilities (CVEs)
- Planning dependency update strategy
- Auditing lock file integrity
- Evaluating new dependencies before adding
- Responding to security advisories

## Do not use this skill when

- Scanning application code — use `security-scanning`
- Managing secrets — use `secrets-management`
- Reviewing code quality — use `code-review`

## Instructions

### 1. Scanning Commands

```bash
# Python
pip-audit                        # Scan installed packages
pip-audit -r requirements.txt    # Scan from requirements file
safety check                     # Alternative scanner

# Node.js
npm audit                        # Built-in scanner
npm audit --fix                  # Auto-fix compatible updates
npx audit-ci --moderate          # CI gate (fail on moderate+)

# Universal
snyk test                        # Multi-language
```

### 2. Lock File Integrity

```bash
# Python — verify lock matches
pip-compile --generate-hashes requirements.in

# Node.js — verify integrity
npm ci  # Clean install from lock file (fails on mismatch)
```

### 3. Dependency Evaluation Criteria

Before adding a new dependency, check:

| Criteria | Acceptable | Red Flag |
|----------|-----------|----------|
| Maintenance | Active (commits <3 months) | Abandoned (>1 year) |
| Downloads | >1000/week | <100/week |
| License | MIT, Apache, BSD | GPL (if proprietary), unlicensed |
| Size | Reasonable for functionality | Bloated for simple task |
| Dependencies | Few, well-known | Deep dependency tree |
| Security | No known CVEs | Unpatched vulnerabilities |

### 4. Update Strategy

```
PATCH (1.2.x): Auto-update (bug fixes)
MINOR (1.x.0): Review changelog, test, update
MAJOR (x.0.0): Read migration guide, dedicated PR, thorough testing
```

### 5. CI Integration

```yaml
dependency-audit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: pip install pip-audit
    - run: pip-audit -r requirements.txt --fail-on-vuln
```

## Workflow Integration

**Invoked by:**
- `/ops-check` — dependency security audit
- `/claude-building` — before adding new dependencies

**After using this skill:** Fix vulnerabilities, then verify with `verification-before-completion`.

**Related skills:** `security-scanning`, `secrets-management`
