---
workflow: claude-building
version: 3.0
model_preference: claude-opus-4-5
description: Implementation, refactoring, and bug fixes with tiered building modes

# ═══════════════════════════════════════════════════════════════════════════════
# ROUTING METADATA: When to use this workflow (from Oh-My-OpenCode)
# ═══════════════════════════════════════════════════════════════════════════════
routing_metadata:
  useWhen:
    - "Task has approved plan or is simple enough (S/M size)"
    - "Implementation work needed (not planning)"
    - "Code writing, refactoring, or bug fixes"
    - "1-10 files to be modified"
    - "Low/medium risk non-critical path changes"
  avoidWhen:
    - "Task is XL (10+ files) without approved plan - use /opus-planning first"
    - "Critical path (Auth, Payments) without security review"
    - "Unknown technology - use /deep-research first"
    - "Pure design/UX task - use /ui-ux-pro-max"
    - "Bug investigation needed - use /debug first"
  triggers:
    - domain: "Implementation"
      patterns: ["გააკეთე", "implement", "add", "create", "build", "write code"]
    - domain: "Refactoring"
      patterns: ["refactor", "clean up", "optimize", "simplify"]
    - domain: "Fixes"
      patterns: ["fix", "patch", "update", "correct"]

# ═══════════════════════════════════════════════════════════════════════════════
# THINKING CONFIG: Maximum reasoning budget (Opus 4.5 + 64k)
# ═══════════════════════════════════════════════════════════════════════════════
thinking_config:
  claude-opus-4-5:
    budget_tokens: 64000
    use_for: "All implementation, refactoring, bug fixes - maximum quality"
  default:
    budget_tokens: 32000
    use_for: "Fallback for any model"

# ═══════════════════════════════════════════════════════════════════════════════
# SUPERPOWERS PATTERN: Two-Stage Review & Subagent Development
# ═══════════════════════════════════════════════════════════════════════════════
two_stage_review:
  enabled: true
  stages:
    spec_compliance:
      order: 1
      question: "Does this implementation meet the specification requirements?"
      checks:
        - "All acceptance criteria satisfied?"
        - "Edge cases handled?"
        - "Error states covered?"
      must_pass: true  # Cannot proceed to quality review if fails
    
    code_quality:
      order: 2
      question: "Is this code well-written, maintainable, and secure?"
      checks:
        - "Code style consistent?"
        - "No code smells or anti-patterns?"
        - "Security best practices followed?"
        - "Performance optimized?"
      must_pass: true
  
  review_loop:
    on_failure: "Implementer fixes, then re-review same stage"
    max_iterations: 3
    escalate_after: "Ask user for direction"

subagent_config:
  mode: "subagent-driven-development"
  principle: "Fresh subagent per task + two-stage review = high quality"
  dispatch_rules:
    - "Dispatch ONE implementer subagent per task"
    - "Provide full plan text (don't make subagent read file)"
    - "Include scene-setting context"
    - "Answer subagent questions before proceeding"
  review_rules:
    - "Spec review BEFORE quality review (order matters!)"
    - "Same subagent fixes issues found in review"
    - "Re-review after fixes (don't skip)"
    - "Never move to next task with open issues"

# ═══════════════════════════════════════════════════════════════════════════════
# Smart Execution Strategy
mcp_strategy:
  phase_1_sizing:
    tool: sequential-thinking
    prompt: |
      Analyze task complexity and determine building mode:

      S (Small/Hotfix):
      - 1-2 files changed
      - Simple logic (CSS fix, text change, minor bug)
      - No architecture impact
      → Flow: Quick (Read → Write → Verify)

      M (Medium/Feature):
      - 3-5 files changed
      - New feature or moderate refactor
      - Some architecture consideration
      → Flow: Standard (Plan → Write → Loop Verify)

      L (Large/Refactor):
      - 5+ files changed
      - Architecture change, migration, major feature
      - Multiple system components
      → Flow: Deep (Blueprint → Atomic Write → Integration)

      XL (Extra Large):
      - Route to /opus-planning first
      - Then return to /claude-building with approved plan
    auto_execute: true

  phase_2_grounding:
    tools:
      code_reading:
        action: "Read all dependent files (follow imports)"
        purpose: "Understand existing patterns and context"

      api_docs_fetch:
        tool: chub
        action: "chub get <id> --lang py — fetch current API documentation"
        purpose: "Get versioned, accurate API docs instead of relying on training data"
        when: "Writing or modifying code that calls external APIs (Gemini, MongoDB, Firebase)"
        ids:
          gemini: "chub get gemini/genai --lang py"
          mongodb: "chub get mongodb/atlas --lang js"
          firebase: "chub get firebase/auth --lang js"

      gitnexus_context:
        tool: gitnexus
        action: "context({name: 'TargetFunction'}) — 360° view of symbol"
        purpose: "See all callers, callees, and execution flows for the target symbol"
        when: "Before modifying any function/class — understand its full dependency tree"
        supplements: code_reading  # Use AFTER reading files for deeper insight

      syntax_check:
        primary_tool: context7
        fallback_tool: tavily_research   # when context7 has no hit (web/project-specific)
        when: "using unfamiliar library, new API, or web/project-specific research needed"
        query_pattern: "How to use {library} {feature}"

    auto_execute: true  # Reading is safe

  phase_3_blueprinting:
    tool: sequential-thinking
    when: "task_size >= L"
    prompt: |
      Create implementation blueprint:
      1. Data flow: How does data move? (DB → API → UI)
      2. Touch points: Which files will change?
      3. Order of operations: What sequence minimizes risk?
      4. Test strategy: How will we verify?
      5. Rollback plan: What if something breaks?
    auto_execute: true

    gitnexus_impact:
      tool: gitnexus
      action: "impact({target: 'ComponentName', direction: 'upstream'}) — blast radius"
      purpose: "Before blueprinting, see exactly what depends on the target component"
      when: "task_size >= M — any non-trivial change benefits from impact analysis"
      supplements: sequential-thinking  # Feed impact data INTO the blueprint
      auto_execute: true

  phase_4_implementation:
    pattern: atomic_write_verify_loop
    steps:
      - write_one_component
      - verify_syntax: true
      - scan_security: true
      - fix_issues_before_next
    auto_execute: false  # Code writing needs approval
    fast_track_exceptions:
      extensions: [".md", ".txt", ".yaml"]  # docs/skills/plans are safe
      reason: "Documentation and skill files carry no execution risk"
      auto_execute: true

  phase_5_integration:
    order: [backend_first, contract_lock, frontend_second]
    verification:
      - api_endpoint_test
      - type_contract_match
      - integration_test
    auto_execute: false

  phase_6_pre_commit_impact:
    tool: gitnexus
    action: "detect_changes({scope: 'all'}) — git diff mapped to knowledge graph"
    purpose: "Before commit, see risk level and affected execution flows"
    when: "Always run before git commit — supplements the Final Checklist"
    auto_execute: true  # Read-only analysis

# Execution Mode
turbo: false  # Code changes need approval
requires_approval:
  - file_write
  - file_edit
  - code_execution
  - terminal_commands

# Building Modes Matrix
building_modes:
  S_hotfix:
    file_count: 1-2
    complexity: low
    flow: [read, write, verify]
    approval_required: true
    estimated_duration: "5-10 min"

  M_feature:
    file_count: 3-5
    complexity: medium
    flow: [read, plan, write, loop_verify]
    approval_required: true
    estimated_duration: "20-40 min"

  L_refactor:
    file_count: 5+
    complexity: high
    flow: [blueprint, atomic_write, integration]
    approval_required: true
    estimated_duration: "60+ min"

  XL_architecture:
    file_count: "10+"
    complexity: critical
    flow: [route_to_opus_planning]
    approval_required: true
    note: "Must go through /opus-planning first"

# Quality Standards
quality_gates:
  syntax:
    tool: semgrep
    run_after: every_file_change
    blocking: true

  security:
    tool: semgrep
    rules: ["security", "owasp-top-10"]
    run_before: commit
    blocking: true

  imports:
    check: all_imports_resolve
    blocking: true

  types:
    check: type_consistency
    blocking: true

  e2e:
    tool: playwright
    command: "cd frontend && npx playwright test"
    run_after: integration_complete
    blocking: true
    note: "E2E tests cover chat, sidebar, categories, error-handling (SSE mocked — update mock URL if backend endpoint changes)"

# Integration Contracts
contracts:
  backend_api:
    define_first: true
    verify_with: curl_test
    document: response_schema

  streaming_api:
    type: "SSE (text/event-stream)"  # Tax Agent primary API
    define_first: true
    verify_with: |
      curl -N http://localhost:8000/api/chat \
        -H "Content-Type: application/json" \
        -d '{"message": "test"}' | head -20
    expected_format: "data: {json_chunk}\n\ndata: [DONE]\n\n"
    document: streaming_contract.md

  frontend_types:
    match_api: true
    verify_with: typescript_check

skills_integration:
  always:
    - skill: verification-before-completion
      when: "Before claiming task complete, fixed, or passing"
      priority: MANDATORY
  conditional:
    - skill: get-api-docs
      when: "Writing or modifying code that calls external APIs (Gemini, MongoDB, Firebase, Stripe)"
      priority: MANDATORY
    - skill: api-security-best-practices
      when: "Writing or modifying API endpoints"
    - skill: api-design-principles
      when: "Designing new API contracts or endpoints"
    - skill: auth-implementation-patterns
      when: "Implementing authentication or authorization"
    - skill: async-python-patterns
      when: "Writing async Python (asyncio, FastAPI async routes)"
    - skill: georgian-tax-domain
      when: "Modifying RAG pipeline or Tax Agent logic"
    - skill: rag-pipeline-debug
      when: "Debugging vector search or context packing issues"
    - skill: citation-formatter
      when: "Modifying tax_system_prompt.py citation logic"
    - skill: scraping-resilience
      when: "Modifying matsne_scraper.py"
  gitnexus_tools:
    - tool: gitnexus context
      when: "Phase 2 Grounding — understanding symbol dependencies before coding"
      auto_execute: true
    - tool: gitnexus impact
      when: "Phase 3 Blueprinting — blast radius analysis before complex changes"
      auto_execute: true
    - tool: gitnexus detect_changes
      when: "Phase 6 Pre-Commit — risk assessment before git commit"
      auto_execute: true
---

# 🏗️ Claude Building - Deep Implementation (v3.0)

## Overview

**Claude Building** is your implementation engine. This workflow handles:
1. 🔨 Writing new code (features, components, endpoints)
2. ♻️ Refactoring existing code
3. 🐛 Bug fixes and hotfixes
4. 🔄 Migrations and architecture changes

> **Philosophy:** Build atomically, verify continuously, integrate carefully.

---

## 🎚️ Phase 1: Task Sizing (Sequential Thinking)

**ALWAYS START HERE - Size Before You Build!**

Use `sequential-thinking` to classify task complexity:

```thinking-prompt
Task Analysis:

1. Count the touch points
   - How many files need changes?
   - How many systems are affected? (DB, API, UI, etc.)

2. Assess architecture impact
   - Does this change core patterns?
   - Will this affect other features?
   - Are there backward compatibility concerns?

3. Estimate risk level
   Risk Matrix:
   ┌─────────────────┬──────────┬─────────┐
   │ Area            │ Impact   │ Mode    │
   ├─────────────────┼──────────┼─────────┤
   │ CSS fix         │ Minimal  │ S       │
   │ New API route   │ Medium   │ M       │
   │ Auth refactor   │ Critical │ L → XL  │
   │ DB migration    │ Critical │ XL      │
   └─────────────────┴──────────┴─────────┘

4. Select building mode
   - S (1-2 files, simple) → Quick flow
   - M (3-5 files, feature) → Standard flow
   - L (5+ files, refactor) → Deep flow
   - XL (10+ files, architecture) → Route to /opus-planning

Decision: {S | M | L | XL}
Justification: {reasoning}
```

**Tool:** `sequential-thinking`
**Auto-Execute:** ✅ Yes
**Output:** Building mode selection

---

## 🏗️ Phase 2: Deep Grounding (Context Loading)

**Never write code without understanding the existing patterns!**

### Step 1: Read Dependent Files

```yaml
Action: Read all files that will be affected

For feature: "Add new chat endpoint"

Read files:
  1. backend/api/chat.py (existing chat logic)
  2. backend/models/message.py (data models)
  3. backend/db/mongodb.py (database client)
  4. frontend/types/chat.ts (TypeScript types)
  5. Any related test files

Purpose:
  - Understand existing patterns
  - Match code style
  - Identify reusable utilities
  - Spot potential conflicts
```

**Auto-Execute:** ✅ Yes (reading is safe)

### Step 1.5: GitNexus Context Lookup (Supplementary)

**After reading files, use GitNexus for a 360° dependency view:**

```yaml
Tool: gitnexus context
Purpose: See full caller/callee tree for the target symbol

Example:
  gitnexus context({name: "generate_response"})

Output:
  incoming:
    calls: [handle_chat_request → routers/chat.py]
  outgoing:
    calls: [rewrite_query, search_vectors, walk_graph,
            run_critic, verify_math, stream_to_client]
  flows:
    - TaxQueryFlow (step 3/8)
    - FollowUpFlow (step 2/5)

Benefit:
  - Complements file reading with graph-level insight
  - Shows execution flows that grep/read cannot reveal
  - Prevents missing hidden dependencies
```

**Auto-Execute:** ✅ Yes (read-only graph query)

---

### Step 2: API Documentation Fetch (chub)

**If writing code that calls an external API (Gemini, MongoDB, Firebase, etc.):**

```yaml
Tool: chub CLI (get-api-docs skill)
Purpose: Fetch current, versioned API documentation — never guess from training data

Flow:
  1. chub search "<library>"             # Find the doc ID
  2. chub get <id> --lang py             # Fetch Python docs
  3. Read output → use correct API syntax

Scoop shortcuts:
  - chub get gemini/genai --lang py      # Gemini SDK
  - chub get mongodb/atlas --lang js     # MongoDB Atlas
  - chub get firebase/auth --lang js     # Firebase Auth
```

**Auto-Execute:** ✅ Yes (read-only, fetches from CDN)
**MANDATORY:** Do NOT write API code from memory — fetch docs first.

---

### Step 3: Syntax and API Verification

**If using unfamiliar library or new API (after checking chub):**

```yaml
Tool: context7
Purpose: Verify correct syntax and best practices (supplements chub)

Example queries:
  - "How to use NextResponse in Next.js 15 app router?"
  - "FastAPI file upload best practices"
  - "MongoDB aggregation pipeline syntax"

Output:
  - Official documentation reference
  - Code examples
  - Best practices
  - Common pitfalls to avoid
```

**Auto-Execute:** ✅ Yes (for documentation lookup)

---

## 📐 Phase 3: Blueprinting (L Mode Only)

**For complex tasks (L/XL), create a detailed implementation blueprint:**

```thinking-prompt
Implementation Blueprint

1. Data Flow Mapping
   ┌──────────┐     ┌─────────┐     ┌──────────┐
   │ Database │ --> │ API     │ --> │ Frontend │
   └──────────┘     └─────────┘     └──────────┘

   Specific flow for this feature:
   - User input → {where?}
   - Validation → {what layer?}
   - Processing → {which service?}
   - Storage → {which collection?}
   - Response → {what shape?}

2. File Change Manifest
   Files to modify:
   1. {file_path} - {what changes}
   2. {file_path} - {what changes}
   ...

   Files to create:
   1. {file_path} - {purpose}
   ...

3. Order of Operations
   Step 1: {task} - {why first}
   Step 2: {task} - {depends on step 1}
   Step 3: {task} - {integration}
   ...

4. Verification Strategy
   Unit tests:
   - Test: {what}
   - Test: {what}

   Integration tests:
   - Endpoint: {which}
   - Expected: {result}

   Manual verification:
   - Action: {steps}
   - Expected: {outcome}

5. Rollback Plan
   If X fails:
   - Revert: {files}
   - Restore: {state}
   - Alternative: {approach}
```

**Tool:** `sequential-thinking`
**Auto-Execute:** ✅ Yes (planning is safe)
**Output:** Detailed implementation plan

---

## 🔨 Phase 4: Atomic Implementation

**Write code in small, verifiable chunks. NEVER write 5 files without checking!**

### The Write-Verify Loop

```yaml
Loop for each component:

  Step 1: Write ONE component
    - One function
    - One class
    - One component file
    - One API endpoint

  Step 2: Verify syntax
    Action: Run linter on the specific file
    Examples:
      - Python: pylint {file}
      - TypeScript: eslint {file}
      - General: semgrep --config=auto {file}

  Step 3: Security scan
    Tool: semgrep
    Rules: ["security", "best-practice"]
    Blocking: true

  Step 4: Fix issues BEFORE next file
    - If errors found → Fix immediately
    - If warnings → Decide: fix or document
    - Never proceed with broken code

  Step 5: E2E regression check (frontend changes)
    Tool: playwright
    Command: cd frontend && npx playwright test
    When: After any frontend component change
    Blocking: true — all 20 tests must pass
    Note: Tests use SSE mocks, no backend required

  Step 6: Repeat for next component
```

**Critical Rules:**

1. ⚠️ **One component at a time**
   - ❌ Don't write 5 files then check
   - ✅ Write 1, verify, write next

2. 🔒 **Security gates**
   - Every file change → semgrep scan
   - Before moving to next file → must be clean

3. 📝 **Incremental commits**
   - After each working component → git commit
   - Easier rollback if needed

**Example Flow:**

```
Task: Add user profile endpoint

┌─────────────────────────────────────┐
│ Component 1: Pydantic Model         │
├─────────────────────────────────────┤
│ → Write: backend/models/profile.py  │
│ → Lint: pylint profile.py ✓        │
│ → Scan: semgrep profile.py ✓       │
│ → Status: VERIFIED                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Component 2: Database Function      │
├─────────────────────────────────────┤
│ → Write: backend/db/profile_ops.py  │
│ → Lint: pylint profile_ops.py ✓    │
│ → Scan: semgrep profile_ops.py      │
│ → Found: NoSQL injection risk ⚠️    │
│ → Fix: Sanitize input parameters    │
│ → Re-scan: ✓ Clean                 │
│ → Status: VERIFIED                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Component 3: API Endpoint           │
├─────────────────────────────────────┤
│ → Write: backend/api/profile.py     │
│ → Lint: ✓                           │
│ → Scan: ✓                           │
│ → Status: VERIFIED                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Component 4: TypeScript Types       │
├─────────────────────────────────────┤
│ → Write: frontend/types/profile.ts  │
│ → Lint: eslint ✓                    │
│ → Type check: tsc --noEmit ✓        │
│ → Status: VERIFIED                  │
└─────────────────────────────────────┘
```

---

## 🔍 Phase 4.5: Two-Stage Review (Superpowers Pattern)

**Every implementation goes through TWO review stages:**

### Stage 1: Spec Compliance Review

**Question:** "ეს იმპლემენტაცია აკმაყოფილებს სპეციფიკაციის მოთხოვნებს?"

```yaml
Spec Compliance Checklist:
  ☐ All acceptance criteria satisfied?
  ☐ Edge cases handled?
  ☐ Error states covered?
  ☐ Input validation complete?
  ☐ Expected outputs match spec?

Outcome:
  ✔ PASS → Proceed to Quality Review
  ✘ FAIL → Implementer fixes, then re-review
```

### Stage 2: Code Quality Review

**Question:** "ეს კოდი კარგად დაწერილი, მოვლილი და უსაფრთხოა?"

```yaml
Code Quality Checklist:
  ☐ Code style consistent with project?
  ☐ No code smells or anti-patterns?
  ☐ DRY - No unnecessary duplication?
  ☐ Security best practices followed?
  ☐ Performance optimized?
  ☐ Comments/docs where needed?

Outcome:
  ✔ PASS → Task complete, move to next
  ✘ FAIL → Implementer fixes, then re-review
```

### Review Flow Diagram

```
┌───────────────────────────────────────────┐
│        Implementation Complete              │
└─────────────────────┬─────────────────────┘
                      ↓
┌───────────────────────────────────────────┐
│   STAGE 1: Spec Compliance Review           │
│   "Does it meet requirements?"              │
└─────────────────────┬─────────────────────┘
                      ↓
               ┌─────────┐
               │  PASS?  │
               └───┬─────┘
          YES ↓         │ NO
              ↓         └─────────────┐
              ↓                       ↓
              ↓     ┌─────────────────────┐
              ↓     │ Implementer Fixes   │
              ↓     └─────────┬───────────┘
              ↓               │
              ↓     ──────────┘ (re-review)
              ↓
┌─────────────────────┴─────────────────────┐
│   STAGE 2: Code Quality Review              │
│   "Is the code well-written?"               │
└─────────────────────┬─────────────────────┘
                      ↓
               ┌─────────┐
               │  PASS?  │
               └───┬─────┘
          YES ↓         │ NO
              ↓         └─────────────┐
              ↓                       ↓
              ↓     ┌─────────────────────┐
              ↓     │ Implementer Fixes   │
              ↓     └─────────┬───────────┘
              ↓               │
              ↓     ──────────┘ (re-review)
              ↓
┌─────────────────────┴─────────────────────┐
│        ✔ TASK COMPLETE                      │
│        Move to next task                    │
└───────────────────────────────────────────┘
```

### ⚠️ Critical Rules:

1. **სპეც ჯერ, ხარისხი მერე** - Never start quality review if spec review failed
2. **იგივე implementer ასწორებს** - Don't fix issues yourself, let subagent fix
3. **Re-review სავალდებულო** - After fixes, ALWAYS re-review (don't skip)

---

## 🔗 Phase 5: Integration & Contract Locking

**Build backend first, lock the contract, then build frontend!**

### Backend First Strategy

```yaml
Step 1: Implement backend API
  - Define endpoint
  - Implement logic
  - Add validation
  - Handle errors

Step 2: Define API contract
  Response schema (example):
    {
      "status": "success",
      "data": {
        "user_id": "string",
        "name": "string",
        "email": "string"
      },
      "timestamp": "ISO8601"
    }

Step 3: Verify with curl test
  Command: |
    curl -X POST http://localhost:8080/api/profile \
      -H "Content-Type: application/json" \
      -d '{"user_id": "test123"}'

  Expected:
    Status: 200
    Body: {matches schema above}

Step 4: Document the contract
  Location: API_CONTRACTS.md or OpenAPI spec
  Include:
    - Endpoint path
    - HTTP method
    - Request schema
    - Response schema
    - Error codes
```

**Contract Lock:** Once backend is verified and contract documented, it's LOCKED. Frontend builds against this contract.

---

### Frontend Second Strategy

```yaml
Step 1: Generate TypeScript types from contract
  Manual or using codegen:
    interface ProfileResponse {
      status: "success" | "error";
      data: {
        user_id: string;
        name: string;
        email: string;
      };
      timestamp: string;
    }

Step 2: Implement frontend using types
  - TypeScript will enforce contract
  - Any mismatch = compile error
  - This catches integration bugs early

Step 3: Integration test
  - Call real API endpoint
  - Verify response matches types
  - Check error handling

Step 4: Error boundary
  - What if API changes?
  - What if network fails?
  - Graceful degradation
```

---

## 🌐 Phase 5.5: Frontend Verification Gate

**When UI code changed (any file in `frontend/src/`):**

```yaml
Step 1: Ensure local servers running (/localservers)
Step 2: Navigate to affected page via browser_subagent
Step 3: Take screenshot of current state
Step 4: Verify:
  - No console errors (evaluate via chrome-devtools)
  - API calls return expected responses (inspect Network panel)
  - Visual matches the spec/expectation
Step 5: If issues found → loop back to Phase 4, do NOT proceed to commit

Tools: browser_subagent + chrome-devtools MCP
Auto-Execute: ❌ No (browser interaction needs approval)
Blocking: ✅ Yes — must pass before commit
```

> **Trigger:** Any file in `frontend/src/` was modified during this building session.

---

## ✅ Final Checklist (Before Commit)

```markdown
## Code Quality Checklist

### Imports & Dependencies
- [ ] All imports resolve (no ModuleNotFoundError)
- [ ] No unused imports
- [ ] Dependencies added to requirements.txt / package.json

### Type Safety
- [ ] TypeScript: No `any` types (unless justified)
- [ ] Python: Pydantic models for API contracts
- [ ] Types match between frontend and backend

### Security
- [ ] semgrep scan passed (0 critical, 0 high)
- [ ] No hardcoded secrets
- [ ] User input validated
- [ ] SQL/NoSQL injection protected

### Code Cleanliness
- [ ] No console.log or print() left in code
- [ ] No commented-out code blocks
- [ ] No TODO comments (or moved to issue tracker)
- [ ] Consistent code style (linter passed)

### Testing
- [ ] Unit tests written for new logic
- [ ] Integration tests for API endpoints
- [ ] **E2E Playwright tests pass** (`cd frontend && npx playwright test` — 20/20 ✓)
- [ ] Manual testing completed

### GitNexus Pre-Commit (Supplementary)
- [ ] `detect_changes()` risk level ≤ MEDIUM (or justified)
- [ ] Affected execution flows reviewed
- [ ] No unexpected upstream dependencies broken

### Documentation
- [ ] API contract documented
- [ ] Complex logic has comments
- [ ] README updated if needed
```

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: "Works on my machine"

```
Problem: Environment differences cause failures

Solution:
  1. Use .env.example as template
  2. Document all environment variables
  3. Use Docker for consistency
  4. CI/CD runs same environment
```

### Pitfall 2: Import hell

```
Problem: Circular imports, missing dependencies

Solution:
  1. Check imports BEFORE writing logic
  2. Use dependency injection pattern
  3. Keep imports at top of file
  4. Run `pip install -r requirements.txt` fresh
```

### Pitfall 3: Type mismatches (Frontend ↔ Backend)

```
Problem: Backend returns string, frontend expects number

Solution:
  1. Define contract FIRST (API_CONTRACTS.md)
  2. Generate TypeScript types from contract
  3. Use Pydantic on backend (enforces types)
  4. Integration test catches mismatch
```

### Pitfall 4: Security after-thought

```
Problem: Code works but has vulnerabilities

Solution:
  1. Run semgrep DURING development (not just at end)
  2. Write-Verify loop includes security scan
  3. No commit without clean scan
```

---

## 📊 Building Mode Decision Tree

```
User task: "{task description}"
          ↓
┌─────────────────────────┐
│ How many files?         │
├─────────────────────────┤
│ 1-2 files  → S Mode     │
│ 3-5 files  → M Mode     │
│ 5-10 files → L Mode     │
│ 10+ files  → XL (Opus)  │
└─────────────────────────┘
          ↓
┌─────────────────────────┐
│ S Mode: Quick Flow      │
├─────────────────────────┤
│ 1. Read existing file   │
│ 2. Make change          │
│ 3. Verify (lint + scan) │
│ 4. Test manually        │
│ 5. Commit               │
└─────────────────────────┘

┌─────────────────────────┐
│ M Mode: Standard Flow   │
├─────────────────────────┤
│ 1. Read dependencies    │
│ 2. Plan approach        │
│ 3. Write-Verify loop    │
│ 4. Integration test     │
│ 5. Commit               │
└─────────────────────────┘

┌─────────────────────────┐
│ L Mode: Deep Flow       │
├─────────────────────────┤
│ 1. Blueprint (detailed) │
│ 2. Atomic write loop    │
│ 3. Contract lock        │
│ 4. Integration carefully│
│ 5. Full test suite      │
│ 6. Staged commits       │
└─────────────────────────┘

┌─────────────────────────┐
│ XL Mode: Route to Opus  │
├─────────────────────────┤
│ 1. Go to /opus-planning │
│ 2. Get architecture plan│
│ 3. Return with plan     │
│ 4. Execute as L Mode    │
└─────────────────────────┘
```

---

## 🔗 Integration with Other Workflows

**Route to other workflows when:**

- 📋 **→ /opus-planning**: If task is XL (10+ files, architecture change)
  - Get detailed architecture plan first
  - Return to /claude-building with approved blueprint

- 📚 **→ /deep-research**: If unclear on library usage or API
  - Before writing unfamiliar code
  - Verify syntax and best practices

- 🛡️ **→ /test-sprite**: After implementation complete
  - Run full test suite
  - Security scan before commit

- 🐛 **→ /debug**: If implementation reveals unexpected errors
  - Complex bugs need investigation
  - Performance issues

- 🎨 **→ /ui-ux-pro-max**: If building UI components
  - Get design spec first
  - Ensure accessibility and UX patterns

---

## 📝 Output Template

```markdown
## 🏗️ Implementation Report: {Feature Name}

### Task Classification
- **Mode:** {S | M | L | XL}
- **Files Modified:** {count}
- **Files Created:** {count}
- **Complexity:** {Low | Medium | High}

---

### Changes Made

#### Backend
1. **{file_path}**
   - Added: {description}
   - Modified: {description}
   - Tests: {test_file}

#### Frontend
1. **{file_path}**
   - Added: {description}
   - Types: {type definitions}

---

### API Contract

**Endpoint:** `POST /api/{endpoint}`

**Request:**
```json
{
  "field": "type"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {}
}
```

---

### Verification Results

✅ **Syntax Check:** Passed
✅ **Security Scan:** 0 critical, 0 high, 2 low (documented)
✅ **Type Check:** All types match
✅ **Import Check:** All dependencies resolved
✅ **Manual Test:** Verified working

---

### Next Steps

1. {Action item}
2. {Action item}
3. Route to /test-sprite for full test suite
4. If backend changed → deploy to Cloud Run:
   `gcloud run deploy tax-agent-backend --source ./backend --region europe-west1`
5. Verify Cloud Run health: `curl https://{SERVICE_URL}/health`
```

---

**ბოლო სიტყვა:** კოდი არ არის ხელოვნება, ეს არის ინჟინერია. ზუსტობა, სისუფთავე და უსაფრთხოება - ყოველ ხაზზე!
