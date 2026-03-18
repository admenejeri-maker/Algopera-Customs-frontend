---
description: Operational rigor checks (Security, Deployment, Health)
version: 1.0
model_preference: claude-3-5-sonnet-20241022
---

# 🛡️ Antigravity Ops Check

**Purpose**: Enforce operational rigor through automated checks for security, deployment readiness, and code health.

## 🔒 Security Scan (`/incident`)
**Run before critical merges or weekly.**

1. **Secret Detection**:
   - `git diff --cached | grep -E '(api_key|password|secret|token)'`
   - Check `.env` handling.

2. **Dependency Audit**:
   - `npm audit --audit-level=moderate`
   - `pip check` (if python)

3. **Code Pattern Scan**:
   - Scan for `eval()`, hardcoded credentials, unvalidated inputs.

## 🚀 Deploy Check (`/deploy-check`)
**Run before deployment.**

1. **Verification**:
   - Run full test suite: `npm test` or `pytest`
   - Build check: `npm run build`
   - Type check: `tsc --noEmit` / `mypy .`

2. **Readiness Score**:
   - [ ] Tests Pass
   - [ ] Build Success
   - [ ] Migrations Reviewed
   - [ ] Env Vars Configured

## 🏥 Code Health (`/health`)
**Run periodically to assess tech debt.**

1. **Stats**:
   - `cloc . --exclude-dir=node_modules,dist,venv`
   - Complexity checking (cyclomatic complexity)

2. **Debt Report**:
   - List TODOs: `grep -r "TODO" .`
   - List FIXMEs: `grep -r "FIXME" .`
