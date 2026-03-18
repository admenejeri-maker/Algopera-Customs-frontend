---
name: security-scanning
description: >
  Static analysis and vulnerability detection using Semgrep, CodeQL, and
  manual patterns. Covers OWASP Top 10, dependency scanning, and automated
  security review. Use when auditing code security or setting up scanning.
---

# Security Scanning

Detect vulnerabilities, insecure patterns, and supply chain risks through
static analysis and automated scanning.

## Use this skill when

- Auditing code for security vulnerabilities
- Setting up automated security scanning in CI
- Reviewing code for OWASP Top 10 issues
- Checking dependencies for known CVEs
- Implementing security gates before deployment

## Do not use this skill when

- Implementing auth patterns — use `auth-implementation-patterns`
- Designing API security — use `api-security-best-practices`
- Managing secrets — use `secrets-management`

## Instructions

### 1. OWASP Top 10 Checklist

| # | Risk | Check |
|---|------|-------|
| A01 | Broken Access Control | Auth on every endpoint, RBAC enforced |
| A02 | Cryptographic Failures | TLS, hashed passwords, no plaintext secrets |
| A03 | Injection | Parameterized queries, input validation |
| A04 | Insecure Design | Threat modeling, security requirements |
| A05 | Security Misconfiguration | Default creds removed, error pages sanitized |
| A06 | Vulnerable Components | Dependency scanning, update policy |
| A07 | Auth Failures | Strong passwords, MFA, account lockout |
| A08 | Data Integrity Failures | Signed updates, CI/CD pipeline integrity |
| A09 | Logging Failures | Security events logged, no sensitive data in logs |
| A10 | SSRF | URL validation, allowlists for external calls |

### 2. Semgrep (Static Analysis)

```bash
# Install
pip install semgrep

# Scan with auto-detection
semgrep scan --config=auto .

# Python-specific rules
semgrep scan --config=p/python .

# Security-focused
semgrep scan --config=p/security-audit .
semgrep scan --config=p/owasp-top-ten .
```

### 3. Dependency Scanning

```bash
# Python
pip-audit                    # Check installed packages for CVEs
safety check                 # Alternative scanner

# Node.js
npm audit                    # Built-in npm scanner
npx audit-ci --moderate      # CI-friendly (fails on moderate+)

# Universal
snyk test                    # Multi-language scanner
```

### 4. Common Vulnerability Patterns

```python
# ❌ SQL Injection
query = f"SELECT * FROM users WHERE id = '{user_input}'"

# ✅ Parameterized
cursor.execute("SELECT * FROM users WHERE id = %s", (user_input,))

# ❌ Path Traversal
file_path = f"/uploads/{user_input}"
open(file_path)

# ✅ Validated path
safe_path = os.path.join("/uploads", os.path.basename(user_input))

# ❌ Command Injection
os.system(f"convert {filename}")

# ✅ Safe subprocess
subprocess.run(["convert", filename], check=True)
```

### 5. CI Integration

```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Semgrep
      uses: semgrep/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/owasp-top-ten
    - name: Dependency audit
      run: pip-audit -r requirements.txt
```

## Workflow Integration

**Invoked by:**
- `/ops-check` — security audit stage
- `/test-sprite` — security verification

**After using this skill:** Fix findings via `/claude-building`, verify with `verification-before-completion`.

**Related skills:** `api-security-best-practices`, `dependency-auditing`, `secrets-management`
