---
workflow: test-sprite
version: 3.0
model_preference: claude-opus-4-5
description: Test-driven reasoning for verification, QA, and security scanning

# THINKING CONFIG: Maximum reasoning budget for testing
thinking_config:
  claude-opus-4-5:
    budget_tokens: 64000
    use_for: "Deep test analysis, security scanning, QA investigation"
  default:
    budget_tokens: 32000

# Smart Execution Strategy
mcp_strategy:
  phase_1_preflight:
    tool: sequential-thinking
    prompt: |
      Analyze what changed and determine test strategy:
      1. What is the scope of changes?
         - Backend only → Unit + Integration tests
         - Frontend → UI + E2E tests
         - Full stack → All test types
      2. What is the regression risk?
         - Critical path (auth, payments) → Run ALL tests
         - Isolated feature → Run targeted tests
      3. What security implications exist?
         - User input → Injection scan (semgrep)
         - File handling → Path traversal scan
         - API changes → Authentication/Authorization check
    auto_execute: true

  phase_2_execution:
    tools:
      unit_tests:
        command: "pytest tests/unit -v"
        when: "backend changes detected"
        auto_execute: false  # Ask first (runs code)

      integration_tests:
        command: "pytest tests/integration -v"
        when: "API endpoints changed"
        auto_execute: false

      security_scan:
        tool: semgrep
        when: "code changes detected"
        auto_execute: false  # Requires approval
        config:
          rules: ["security", "owasp-top-10", "secrets"]

  phase_3_diagnosis:
    tool: sequential-thinking
    trigger: "test failures detected"
    prompt: |
      Root cause analysis:
      1. Is this a logic error? (Check traceback)
      2. Is this an environment issue? (Check .env, DB connection)
      3. Is this a test flake? (Timing, async issues)
      4. Should this escalate to /debug?
    auto_execute: true

  phase_4_security_gate:
    tool: semgrep
    required: true  # Must pass before commit
    blocking_severity: ["error", "warning"]
    auto_execute: false

  phase_5_code_analysis:
    tool: claude-code
    actions:
      - Glob: "Find test files for changed modules"
      - Grep: "Search for related test patterns"
      - Read: "Analyze existing test structure"
    purpose: "Understand test coverage before running tests"
    auto_execute: true

  phase_6_gitnexus_scope:
    tool: gitnexus
    actions:
      detect_changes:
        action: "detect_changes({scope: 'all'}) — map git diff to knowledge graph"
        purpose: "Precisely identify ALL affected functions, callers, and test files"
        when: "Phase 1 Pre-Flight — before deciding which tests to run"
      impact:
        action: "impact({target: 'ChangedFunction'}) — blast radius per function"
        purpose: "Determine regression risk level based on dependency graph"
        when: "After detect_changes — use blast radius to set test priority"
    supplements: [phase_1_preflight, phase_5_code_analysis]
    auto_execute: true  # Read-only graph queries

# Execution Mode
turbo: false  # Tests and scans need approval
requires_approval:
  - pytest_commands
  - semgrep_scan
  - code_execution

# Test Strategy Matrix
test_matrix:
  unit:
    scope: "Individual functions, pure logic"
    command: "pytest tests/unit -v"
    speed: fast
    coverage_target: 80

  integration:
    scope: "API endpoints, database operations"
    command: "pytest tests/integration -v"
    speed: medium
    requires: ["mongodb running", "test database"]

  e2e:
    scope: "User flows, UI interactions"
    command: "npm run test:e2e"
    speed: slow
    requires: ["frontend built", "backend running"]

  visual_verification:
    scope: "Screenshot comparison, network correctness, console checks"
    tool: "browser_subagent + chrome-devtools"
    speed: medium
    when: "Frontend changes detected — UI components, layouts, styles"
    steps:
      - "Start local servers (/localservers)"
      - "Navigate to affected pages via browser_subagent"
      - "Take before/after screenshots"
      - "Inspect network requests for API correctness"
      - "Check console for JS errors"
      - "Attach screenshots to test report artifact"
    requires: ["local servers running", "frontend changes"]

  security:
    scope: "SAST, secrets detection, vulnerability scan"
    tool: semgrep
    speed: medium
    blocking: true

# Quality Gates
quality_gates:
  test_coverage:
    min_threshold: 70
    target: 80
    critical_paths: 90

  security_findings:
    blocking: ["critical", "high"]
    review_required: ["medium"]
    acceptable: ["low", "info"]

  performance:
    max_test_duration: 300  # 5 minutes
    max_endpoint_latency: 1000  # 1 second
---

# 🛡️ Test Sprite - Test-Driven Reasoning (v3.0)

## Overview

**Test Sprite** is your QA Guardian and Security Officer. This workflow ensures:
1. ✅ Code works as intended (Testing)
2. 🔒 Code is secure (Security Scanning)
3. 🐛 Failures are diagnosed efficiently (Root Cause Analysis)

> **Philosophy:** Test failure is **information**, not judgment. Red bar = clue to fix.

---

## 🧠 Phase 1: Pre-Flight Strategy (Sequential Thinking)

**ALWAYS START HERE - Plan Before You Test!**

Use `sequential-thinking` to determine your testing strategy:

```thinking-prompt
Context Analysis:

1. What changed?
   - Files modified: {list changed files}
   - Type of change: {feature | bugfix | refactor}
   - Scope: {backend | frontend | fullstack}

2. What is the regression risk?
   Risk Assessment Matrix:
   ┌────────────────┬──────────┬─────────────┐
   │ Change Area    │ Risk     │ Test Scope  │
   ├────────────────┼──────────┼─────────────┤
   │ Auth/Payments  │ CRITICAL │ ALL tests   │
   │ Core API       │ HIGH     │ Full suite  │
   │ UI Component   │ MEDIUM   │ Targeted    │
   │ Documentation  │ LOW      │ Minimal     │
   └────────────────┴──────────┴─────────────┘

3. What should we test?
   - Unit tests: {specific test files}
   - Integration: {affected API endpoints}
   - Security: {new user input? file handling?}

4. What's the optimal execution order?
   - Step 1: Run fast unit tests (feedback loop)
   - Step 2: Run integration tests (if units pass)
   - Step 3: Security scan (always before commit)
```

**Tool:** `sequential-thinking`
**Auto-Execute:** ✅ Yes (planning is safe)
**Output:** Tailored test execution plan

### 🔗 Phase 1.5: GitNexus Change Scope (Supplementary)

**After sequential-thinking analysis, use GitNexus for precise scope:**

```yaml
Tool: gitnexus detect_changes + impact
Purpose: Map git diff to knowledge graph → exact blast radius

Step 1: Detect what changed
  gitnexus detect_changes({scope: 'all'})
  Output:
    changed_functions:
      - generate_response (rag_pipeline.py)
      - rewrite_query (query_rewriter.py)
    risk_level: HIGH

Step 2: Get blast radius per function
  gitnexus impact({target: 'generate_response', direction: 'upstream'})
  Output:
    callers: [handle_chat_request]
    affected_tests:
      - tests/test_rag_pipeline.py
      - tests/test_giorgi_remediation.py
    execution_flows: [TaxQueryFlow, FollowUpFlow]

Benefit:
  - Supplements sequential-thinking with graph-level precision
  - Finds test files that Glob/Grep might miss
  - Risk level automatically calibrated from dependency count
```

**Auto-Execute:** ✅ Yes (read-only graph query)
**Output:** Precise test file list + risk level

---

## 🧪 Phase 2: Test Execution Matrix

### 🎯 Unit Tests (Micro-Level)

**Purpose:** Test individual functions and pure logic

**When to run:**
- Changed any Python/TypeScript function
- Added new business logic
- Refactored existing code
- GitNexus `detect_changes()` flagged affected test files (Phase 1.5)

**Execution:**

```yaml
Step 1: Request permission
  prompt: "Run unit tests on {affected modules}?"
  reason: "Executes code in test environment"

Step 2: Execute tests
  command: "python3 -m pytest tests/unit -v --cov"
  timeout: 60  # 1 minute max

Step 3: Parse results
  analyze:
    - Passed: {count}
    - Failed: {count}
    - Coverage: {percentage}
```

**Auto-Execute:** ❌ No (requires approval - executes code)

**Example:**
```bash
# User changed: backend/api/nutrition.py

Proposed command:
pytest tests/unit/test_nutrition.py -v --cov=backend.api.nutrition

Expected outcome:
✓ test_calculate_macros ... PASSED
✓ test_validate_nutrients ... PASSED
✓ test_edge_cases ... PASSED
Coverage: 85%
```

---

### 🔗 Integration Tests (Macro-Level)

**Purpose:** Test API endpoints and database operations

**When to run:**
- Changed API routes
- Modified database queries
- Updated authentication/authorization

**Prerequisites:**
- MongoDB running
- Test database initialized
- Environment variables set

**Execution:**

```yaml
Step 1: Verify environment
  checks:
    - mongodb_running: true
    - test_db_exists: true
    - env_vars_set: true

Step 2: Request permission
  prompt: "Run integration tests for {endpoints}?"
  estimated_duration: "2-3 minutes"

Step 3: Execute tests
  command: "pytest tests/integration -v -k {pattern}"

Step 4: Cleanup
  action: "Reset test database state"
```

**Auto-Execute:** ❌ No (requires approval - interacts with DB)

**Example:**
```bash
# User changed: backend/api/chat.py

Proposed command:
pytest tests/integration/test_chat_api.py -v

Tests to run:
✓ test_chat_endpoint_authentication
✓ test_message_storage_mongodb
✓ test_chat_history_retrieval
✓ test_rate_limiting
```

---

### 🛡️ Security Scan (The Gate)

**Purpose:** Static Application Security Testing (SAST)

**When to run:**
- **ALWAYS** before committing code
- Added user input handling
- Modified file operations
- Changed authentication logic

**Execution:**

```yaml
Step 1: Request explicit approval
  prompt: |
    🔒 Security Scan Request

    Scope: {files or directory}
    Rules: OWASP Top 10, Secrets Detection, Best Practices
    Duration: ~30-60 seconds

    Approve scan?

  warning: "This tool will analyze code for vulnerabilities"

Step 2: Run semgrep scan
  tool: semgrep_scan
  input:
    path: {changed files or full directory}
    config:
      rules: ["security", "owasp-top-10", "secrets"]
      severity: ["error", "warning", "info"]

Step 3: Categorize findings
  critical:
    - SQL Injection
    - XSS (Cross-Site Scripting)
    - Hardcoded secrets (API keys, passwords)
    - Command injection

  high:
    - NoSQL injection
    - Path traversal
    - Insecure deserialization

  medium:
    - Missing input validation
    - Weak crypto
    - Insecure defaults

  low:
    - Code style
    - Best practice violations

Step 4: Generate report
  format: prioritized_list
  include:
    - Severity
    - Finding description
    - File location (line number)
    - Remediation suggestion
```

**Auto-Execute:** ❌ No (requires approval)
**Blocking:** ✅ Yes - Must pass before commit

**Example:**
```yaml
Scan Results for: backend/api/chat.py

❌ CRITICAL (1 finding):
  Line 45: Potential NoSQL injection
  Code: db.find({"user": request.user_input})
  Fix: Sanitize input or use parameterized query

⚠️  MEDIUM (2 findings):
  Line 23: Missing input validation on 'message' field
  Line 67: Using MD5 for hashing (deprecated)

✅ LOW (3 findings):
  Code style recommendations

🚫 BLOCKED: Cannot commit until CRITICAL issues resolved
```

---

## 🔍 Phase 3: Failure Analysis (Deep Diagnosis)

**When a test fails, DON'T immediately fix code. THINK FIRST!**

Use `sequential-thinking` for root cause analysis:

```thinking-prompt
Test Failure: {test_name}
Error: {error_message}
Traceback: {stack_trace}

Hypothesis Tree:

1. Logic Error (Code is wrong)
   Evidence to check:
   - Does the error message point to specific line?
   - Is there a clear assertion failure?
   - Did we change this code recently?
   → If YES: Proceed to code fix

2. Environment Issue (Setup is wrong)
   Evidence to check:
   - Error mentions "connection refused"?
   - Missing environment variable?
   - Database not seeded?
   → If YES: Fix environment, re-run test

3. Test Flake (Test is unreliable)
   Evidence to check:
   - Does the test pass on retry?
   - Involves timing or async operations?
   - Has randomness or external dependencies?
   → If YES: Stabilize test or mark as flaky

4. Unclear Error (Need deeper investigation)
   Evidence:
   - Complex stack trace
   - No obvious failure point
   - Multiple possible causes
   → ESCALATE to /debug workflow

Decision: {Choose hypothesis with strongest evidence}
Next Action: {Specific fix or escalation}
```

**Tool:** `sequential-thinking`
**Auto-Execute:** ✅ Yes (analysis is safe)

**Escalation Rule:**
```
IF diagnosis_confidence < 70%
THEN route_to: /debug
ELSE proceed_with: targeted_fix
```

---

## ✅ Phase 4: Security Gate (Pre-Commit)

**MANDATORY CHECKPOINT - No code commits without this!**

```yaml
Security Gate Checklist:

□ semgrep scan completed
  Status: {passed | failed | not_run}

□ Critical findings resolved
  Count: {number}
  Status: {all_fixed | pending}

□ High findings reviewed
  Count: {number}
  Decision: {accepted_risk | will_fix | already_fixed}

□ Secrets detected: NONE
  Status: {clean | found_secrets}

□ Code review ready
  Status: {approved | changes_requested}

Gate Status: {🟢 PASS | 🔴 FAIL}
```

**Blocking Conditions:**
- ❌ ANY critical severity findings
- ❌ ANY hardcoded secrets detected
- ❌ High severity in authentication/payment code

**Acceptable Conditions:**
- ✅ All medium/low findings (with documentation)
- ✅ False positives (with justification)

---

## 📋 Test Execution Workflow

### Full Testing Sequence

```
User: "Run tests for my changes"

┌─────────────────────────────────────┐
│ Phase 1: Strategic Planning         │
├─────────────────────────────────────┤
│ ✓ Changed files: 3 Python files     │
│ ✓ Scope: Backend API                │
│ ✓ Risk: Medium (non-critical path)  │
│ ✓ Strategy: Unit → Integration      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Phase 2a: Unit Tests                │
├─────────────────────────────────────┤
│ → Request: Run pytest unit tests?   │
│ → [User approves]                   │
│ → Execute: pytest tests/unit -v     │
│ → Result: ✅ 12/12 passed (85% cov) │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Phase 2b: Integration Tests         │
├─────────────────────────────────────┤
│ → Check: MongoDB running ✓          │
│ → Request: Run integration tests?   │
│ → [User approves]                   │
│ → Execute: pytest tests/integration │
│ → Result: ✅ 8/8 passed             │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Phase 2c: Security Scan             │
├─────────────────────────────────────┤
│ → Request: Run semgrep security?    │
│ → [User approves]                   │
│ → Scan: backend/api/*.py            │
│ → Findings:                         │
│   • 0 Critical                      │
│   • 1 Medium (documented)           │
│ → Status: 🟢 PASS                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Final Report                        │
├─────────────────────────────────────┤
│ ✅ Unit Tests: 12/12 PASSED         │
│ ✅ Integration: 8/8 PASSED          │
│ ✅ Security: CLEAN                  │
│ ✅ Gate Status: APPROVED FOR COMMIT │
│                                     │
│ 💡 Recommendation: Safe to commit   │
└─────────────────────────────────────┘
```

---

## 🚨 Common Failure Patterns & Solutions

### Pattern 1: Import Error

```
Error: ModuleNotFoundError: No module named 'X'

Diagnosis:
  Hypothesis: Missing dependency

Solution:
  1. Check requirements.txt
  2. Run: pip install -r requirements.txt
  3. Retry test
```

### Pattern 2: Database Connection Failure

```
Error: pymongo.errors.ServerSelectionTimeoutError

Diagnosis:
  Hypothesis: MongoDB not running

Solution:
  1. Check: mongod process running?
  2. Check: Correct connection string in .env?
  3. Start MongoDB if needed
  4. Retry test
```

### Pattern 3: Assertion Failure

```
AssertionError: Expected 200, got 401

Diagnosis:
  Hypothesis: Authentication issue in test

Solution:
  1. Check: Is test providing valid auth token?
  2. Check: Has auth logic changed?
  3. Update test fixtures or fix auth code
```

### Pattern 4: Flaky Test (Timing)

```
Error: Timeout waiting for element (intermittent)

Diagnosis:
  Hypothesis: Race condition in async test

Solution:
  1. Add proper await/wait conditions
  2. Increase timeout (if justified)
  3. Use deterministic test data
  4. Mark as flaky if unavoidable
```

---

## 🔗 Integration with Other Workflows

**Route to other workflows:**

- 🐛 **→ /debug**: If test failures are complex or unclear
  - Trigger: diagnosis_confidence < 70%
  - Trigger: Multiple failing tests with unclear pattern

- 🔨 **→ /claude-building**: If tests reveal missing functionality
  - Trigger: "Feature not implemented" errors
  - Trigger: User wants to implement tested feature

- 📚 **→ /deep-research**: If unfamiliar error or framework issue
  - Trigger: Unknown error from library
  - Trigger: Need to understand testing best practices

- 📋 **→ /opus-planning**: If testing reveals architectural issues
  - Trigger: Many integration tests failing
  - Trigger: Need to redesign component

### 🌐 Visual Verification (Frontend Changes)

**When to use:** Test involves UI changes, new components, or layout modifications.

```yaml
Step 1: Ensure local servers running (/localservers)
Step 2: Navigate to affected pages via browser_subagent
Step 3: Take screenshots (before/after if applicable)
Step 4: Inspect network panel for API correctness (200s, correct payloads)
Step 5: Check browser console for JS errors/warnings
Step 6: Attach screenshots to the test report artifact

Tools: browser_subagent + chrome-devtools MCP
Auto-Execute: ❌ No (browser interaction needs approval)
```

**claude-code Tools Available:**
- `Glob`: Find test files (`**/test_*.py`, `**/*.test.ts`)
- `Grep`: Search for test patterns or fixtures
- `Read`: Analyze specific test file structure
- `Bash`: Run pytest commands (with approval)

---

## 📊 Quality Metrics

### Code Coverage Targets

```
Critical Paths: ≥ 90%
  - Authentication
  - Payment processing
  - Data validation

Core API: ≥ 80%
  - Business logic
  - Data transformations
  - Error handling

UI Components: ≥ 70%
  - User interactions
  - State management
  - Rendering logic

Utilities: ≥ 60%
  - Helper functions
  - Formatters
  - Constants
```

### Security Scan Standards

```
Zero Tolerance:
  - Hardcoded secrets
  - SQL/NoSQL injection
  - XSS vulnerabilities
  - Command injection

Review Required:
  - Medium severity findings
  - Deprecated crypto
  - Missing input validation

Acceptable (with docs):
  - Low severity style issues
  - Info-level suggestions
  - False positives (justified)
```

---

## 🎯 Success Criteria

A successful test-sprite session:

1. ✅ Started with strategic planning (sequential-thinking)
2. ✅ Ran appropriate test suite (unit/integration/e2e)
3. ✅ Performed security scan (semgrep)
4. ✅ Diagnosed any failures systematically
5. ✅ Passed security gate (0 critical findings)
6. ✅ Achieved coverage targets
7. ✅ Documented any accepted risks

---

## 📝 Output Template

```markdown
## 🧪 Test Report: {Feature/Module Name}

### Test Execution Summary

**Unit Tests:**
- Passed: {count}
- Failed: {count}
- Skipped: {count}
- Coverage: {percentage}%

**Integration Tests:**
- Passed: {count}
- Failed: {count}
- Duration: {seconds}s

**Security Scan:**
- Critical: {count} 🔴
- High: {count} 🟠
- Medium: {count} 🟡
- Low: {count} ⚪

---

### Detailed Findings

{If tests failed}:
#### Failed Tests
1. **{test_name}**
   - Error: {error_message}
   - Root Cause: {diagnosis}
   - Fix: {solution or "Escalated to /debug"}

{If security issues}:
#### Security Findings
1. **{severity}**: {vulnerability_type}
   - Location: {file}:{line}
   - Description: {details}
   - Remediation: {fix_suggestion}
   - Status: {fixed | accepted_risk | false_positive}

---

### Gate Status

┌────────────────────┬──────────┐
│ Checkpoint         │ Status   │
├────────────────────┼──────────┤
│ Unit Tests         │ {✅|❌}  │
│ Integration Tests  │ {✅|❌}  │
│ Security Scan      │ {✅|❌}  │
│ Coverage Target    │ {✅|❌}  │
│ Zero Critical Bugs │ {✅|❌}  │
└────────────────────┴──────────┘

**Final Verdict:** {🟢 APPROVED FOR COMMIT | 🔴 BLOCKED | 🟡 REVIEW REQUIRED}

---

### Recommendations

1. {Action item 1}
2. {Action item 2}
3. {Next steps}
```

---

**ბოლო სიტყვა:** ტესტირება არ არის დაბრკოლება, ეს არის დაცვა. Security არ არის ოფციონალური. Quality არ არის შემთხვევითი - ის გაზომადი და განხორციელებადია!
