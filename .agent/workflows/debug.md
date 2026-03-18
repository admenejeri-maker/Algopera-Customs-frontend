---
workflow: debug
version: 3.0
model_preference: claude-opus-4-5
description: Deep reasoning protocol for bug investigation and remediation

# THINKING CONFIG: Maximum reasoning budget for debugging
thinking_config:
  claude-opus-4-5:
    budget_tokens: 64000
    use_for: "Deep bug investigation, complex system debugging"
  default:
    budget_tokens: 32000

# Smart Execution Strategy
mcp_strategy:
  phase_1_classification:
    tool: sequential-thinking
    prompt: |
      Classify bug complexity:

      C1 (Trivial): Visual/typo/obvious
      - CSS rendering issue
      - Typo in text
      - Missing import
      → Flow: Fast Track (direct fix)

      C2 (Moderate): Logic error
      - Wrong API response
      - Function returning incorrect value
      - State management issue
      → Flow: Light DRP (hypothesis → test → fix)

      C3 (Critical): System failure
      - 500 errors
      - Data loss
      - Authentication broken
      - Performance degradation
      → Flow: Full DRP (deep investigation)

    auto_execute: true

  phase_2_observation:
    when: "complexity >= C2"
    tools:
      delta_analysis:
        action: "git log -p -1"
        purpose: "What changed recently?"

      state_snapshot:
        action: "Trace data flow (DB → API → UI)"
        purpose: "Where is the failure point?"

      context_loading:
        action: "Read affected files fully"
        purpose: "Understand dependencies"

      claude_code_exploration:
        tool: claude-code
        actions:
          - Glob: "Find related files by pattern"
          - Grep: "Search for error messages, function calls"
          - Read: "Read full file contents for analysis"
        purpose: "Deep codebase exploration without running code"

      documentation_check:
        primary_tool: context7
        fallback_tool: tavily_research
        when: "Unfamiliar library behavior, GCP/Atlas error message lookup"
        purpose: "Verify API behavior against official docs before patching"

    auto_execute: true  # Reading is safe

  phase_2b_browser_evidence:
    when: "Bug involves UI rendering, network requests, or client-side errors"
    tools:
      browser_screenshot:
        tool: browser_subagent
        action: "Navigate to affected page, take screenshot of error state"
        purpose: "Visual evidence of the bug"

      console_errors:
        tool: chrome-devtools
        action: "evaluate_script to capture console errors"
        purpose: "Capture JS errors, warnings, and uncaught exceptions"

      network_inspection:
        tool: chrome-devtools
        action: "Inspect Network panel for failed requests (4xx/5xx)"
        purpose: "Identify API failures, CORS issues, timeout errors"

    auto_execute: true  # Read-only browser inspection

  phase_3_hypothesis:
    when: "complexity == C3"
    tool: sequential-thinking
    prompt: |
      Generate hypothesis tree with probability:

      Branch A: Environment/Config (High probability)
      - Missing .env variable
      - Database connection string wrong
      - Port already in use

      Branch B: Logic bug (Medium probability)
      - Recent code change introduced bug
      - Edge case not handled
      - Type mismatch

      Branch C: External dependency (Low probability)
      - Third-party API down
      - Rate limit exceeded
      - Network issue

      Select most probable branch based on evidence.

    auto_execute: true

  phase_4_evidence_gathering:
    constraint: "No code changes without smoking gun!"
    tools:
      api_isolation: "curl tests"
      log_analysis: "grep error patterns"
      state_inspection: "database queries"

    auto_execute: false  # May execute commands

  phase_5_intervention:
    principle: "Smallest possible change"
    verify: "Test with failing case immediately"
    rollback_ready: true

    auto_execute: false  # Code changes

# Execution Mode
turbo: false  # Debugging needs careful approval
requires_approval:
  - code_changes
  - database_queries
  - terminal_commands

# Complexity Decision Matrix
complexity_matrix:
  C1_trivial:
    indicators: ["typo", "css", "missing import"]
    duration: "2-5 min"
    flow: "fast_track"

  C2_moderate:
    indicators: ["wrong output", "logic error", "state issue"]
    duration: "10-20 min"
    flow: "light_drp"

  C3_critical:
    indicators: ["500 error", "data loss", "system failure", "empty RAG", "Matsne unreachable", "Georgian encoding", "safety block", "Atlas timeout"]
    duration: "30-60 min"
    flow: "full_drp"

# Evidence Standards
evidence_quality:
  smoking_gun:
    - "Clear error message pointing to exact line"
    - "Git bisect identifies breaking commit"
    - "Reproduction steps are 100% reliable"

  strong_evidence:
    - "Error pattern matches known issue"
    - "Logs show clear failure point"
    - "State inspection reveals corruption"

  weak_evidence:
    - "Intermittent failure"
    - "No clear error message"
    - "Cannot reproduce reliably"
    action_if_weak: "Gather more evidence, don't guess"

skills_integration:
  always:
    - skill: verification-before-completion
      when: "After phase_5_intervention — before marking bug as resolved"
      priority: MANDATORY
  conditional:
    - skill: rag-pipeline-debug
      when: "C2/C3 — model returns empty/wrong tax answers, vector search failing"
    - skill: scraping-resilience
      when: "C2/C3 — Matsne data missing or corrupt in tax_articles"
    - skill: citation-formatter
      when: "C2/C3 — citation markers [N] missing or mismatched in response"
    - skill: georgian-tax-domain
      when: "C3 — wrong law cited; domain knowledge issue suspected"
    - skill: api-security-best-practices
      when: "C3 — authentication broken, unauthorized access"
    - skill: auth-implementation-patterns
      when: "C3 — auth flow investigation needed"
    - skill: async-python-patterns
      when: "C3 — race condition, coroutine failure, async timeout"
---

# 🐛 Debug - Deep Reasoning Protocol (v3.0)

## Overview

**Debug workflow** is your systematic bug investigation tool. No guessing, no random fixes.

> **Philosophy:** Evidence before code changes. Hypothesis → Evidence → Fix → Verify.

---

## 🎯 Phase 1: Bug Classification

**Use `sequential-thinking` to classify complexity:**

- **C1 (Trivial):** Typo, CSS, obvious → Fast fix
- **C2 (Moderate):** Logic error → Light investigation
- **C3 (Critical):** System failure → Full protocol

---

## ⚡ C1: Fast Track

Fix obvious bugs directly, verify immediately.

---

## 🌐 Phase 2b: Browser Evidence Collection (Frontend Bugs)

**When to use:** Bug involves UI rendering, network requests, or client-side errors.

1. **Navigate** to the affected page using `browser_subagent`
2. **Capture console errors** — evaluate JS to extract errors/warnings
3. **Inspect network** — check for failed API calls (4xx/5xx), CORS, timeouts
4. **Screenshot** — capture the visual error state for the diagnosis report
5. **Add evidence** to the Observation Log from Phase 2

> **Tools:** `browser_subagent` + `chrome-devtools` MCP

---

## 🔍 C2: Light DRP

1. **Observe:** What changed? (git log)
2. **Explore:** Use claude-code Read/Grep to understand code
3. **Hypothesize:** Most likely cause?
4. **Gather evidence:** Test without changing code
5. **Fix:** Minimal change
6. **Verify:** Test original failing case

**claude-code Tools:**
- `Glob`: Find files matching pattern
- `Grep`: Search code for patterns/errors
- `Read`: View file contents
- `WebSearch`: Find similar issues online

---

## 🧠 C3: Full DRP

1. **Deep Observation:** Delta + State + Data flow
2. **Hypothesis Tree:** Environment > Logic > External
3. **Evidence:** NO code changes until smoking gun found
4. **Simulation:** What could this fix break?
5. **Surgical Fix:** Minimal change + monitoring

---

## 🍵 Tax Agent Debug Patterns

| Symptom | Complexity | Route to Skill |
|---------|-----------|---------------|
| Model returns empty answer | C2 | `rag-pipeline-debug` → check vector search |
| Wrong article cited | C2 | `georgian-tax-domain` → verify article |
| `[N]` markers missing in response | C2 | `citation-formatter` → check system prompt |
| Matsne data missing/corrupt | C3 | `scraping-resilience` → retry + fallback |
| Atlas connection timeout | C3 | `rag-pipeline-debug` Branch B (infra) |
| Georgian text garbled/encoded wrong | C3 | `scraping-resilience` → encoding fix |
| Gemini safety block | C3 | Adjust `BLOCK_ONLY_HIGH` threshold |
| SSE stream drops mid-response | C3 | Check Cloud Run request timeout (60s limit) |

---

**ბოლო სიტყვა:** Debugging = detective work. Evidence first, code second!
