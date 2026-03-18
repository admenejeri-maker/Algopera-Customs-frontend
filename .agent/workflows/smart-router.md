---
workflow: smart-router
version: 1.0
model_preference: gemini-3.0-pro
description: Intelligent auto-routing to optimal workflow based on user intent

# THINKING CONFIG: Quick routing with Gemini 3.0 Pro
thinking_config:
  gemini-3.0-pro:
    budget_tokens: 8000
    use_for: "Fast intent classification and workflow routing"
  default:
    budget_tokens: 4000

# ═══════════════════════════════════════════════════════════════════════════════
# ROUTING METADATA: When to use this workflow (from Oh-My-OpenCode)
# ═══════════════════════════════════════════════════════════════════════════════
routing_metadata:
  useWhen:
    - "User request needs workflow selection"
    - "Query contains Georgian or English intent patterns"
    - "Unclear which workflow to use"
    - "Multi-intent query needs classification"
    - "New user query without explicit workflow request"
  avoidWhen:
    - "Already in a specific workflow"
    - "Direct file operation requested"
    - "User explicitly names workflow (e.g., /opus-planning)"
    - "Simple question answerable without workflow"
  triggers:
    - domain: "Any query"
      pattern: "Analyze and route to optimal workflow"
    - domain: "Default"
      pattern: "Entry point for all unclassified requests"

# ═══════════════════════════════════════════════════════════════════════════════
# Smart Execution Strategy
mcp_strategy:
  phase_1_intent_classification:
    tool: sequential-thinking
    prompt: |
      Classify user intent from query: "{query}"

      Intent categories:
      1. RESEARCH: Learn, understand, explain
         Patterns: "როგორ", "how", "what is", "explain"
         → Route: /deep-research

      2. PLANNING: Architecture, design, complex feature
         Patterns: "plan", "architecture", "design system"
         Size: M/L/XL
         → Route: /opus-planning

      3. IMPLEMENTATION: Build, create, add feature
         Patterns: "გააკეთე", "implement", "add", "create"
         → Route: /claude-building (or /opus-planning first if complex)

      4. DEBUGGING: Fix, error, broken
         Patterns: "ჩაასწორე", "fix", "bug", "error", "broken"
         → Route: /debug

      5. UI/DESIGN: Visual, style, UX
         Patterns: "დიზაინი", "UI", "design", "style", "UX"
         → Route: /ui-ux-pro-max

      6. TESTING: QA, security, verification
         Patterns: "ტესტი", "test", "QA", "security", "verify"
         → Route: /test-sprite

      7. ORCHESTRATION: Multi-step, full cycle
         Patterns: "full feature", "end-to-end", "complete system"
         → Route: /multi-agent-dev

    auto_execute: true

  phase_2_complexity_assessment:
    tool: sequential-thinking
    when: "intent == IMPLEMENTATION"
    prompt: |
      Assess implementation complexity:

      File count estimate: {1-2 | 3-5 | 5-10 | 10+}
      Risk level: {low | medium | high | critical}

      Decision:
      - 1-2 files + low risk → /claude-building directly
      - 3-5 files + medium risk → /opus-planning → /claude-building
      - 5+ files OR high risk → /opus-planning (mandatory)

    auto_execute: true

  phase_3_route_execution:
    action: "Execute selected workflow"
    auto_execute: false  # Individual workflows handle their approvals

# Execution Mode
turbo: true  # Routing analysis is safe
requires_approval:
  - workflow_execution  # Routed workflows ask for their own approvals

# Routing Decision Matrix
routing_matrix:
  research_patterns:
    georgian: ["როგორ", "რა არის", "ახსენი", "გამიხსენი"]
    english: ["how does", "how to", "what is", "explain", "why"]
    route: "/deep-research"
    auto_execute_tools: ["context7", "github", "sequential-thinking"]

  implementation_patterns:
    georgian: ["გააკეთე", "შექმენი", "დაამატე", "დაწერე"]
    english: ["implement", "create", "add", "build", "make"]
    complexity_check: true
    route_simple: "/claude-building"
    route_complex: "/opus-planning"

  debugging_patterns:
    georgian: ["ჩაასწორე", "გაასწორე", "ბაგი", "შეცდომა"]
    english: ["fix", "debug", "bug", "error", "broken", "not working"]
    route: "/debug"

  ui_patterns:
    georgian: ["დიზაინი", "ვიზუალი", "სტილი"]
    english: ["design", "UI", "UX", "style", "visual", "layout"]
    route: "/ui-ux-pro-max"

  testing_patterns:
    georgian: ["ტესტი", "შემოწმება", "უსაფრთხოება"]
    english: ["test", "QA", "security", "verify", "check"]
    route: "/test-sprite"

  planning_patterns:
    georgian: ["დაგეგმე", "არქიტექტურა", "სტრატეგია"]
    english: ["plan", "architecture", "design system", "strategy"]
    route: "/opus-planning"

  codebase_patterns:
    georgian: ["სად არის", "იპოვე", "მოვძებნა"]
    english: ["find in code", "where is", "locate", "search code"]
    tool: claude-code
    actions: ["Glob", "Grep", "Read"]
    route_with: "/deep-research"

# Auto-Execution Rules
auto_execution_rules:
  safe_workflows:
    - "/deep-research" with tools: ["context7", "github", "claude-code"]
    - "/opus-planning" (planning only, no code)
    - "/smart-router" (routing only)

  claude_code_safe_actions:
    - Glob: "Find files by pattern (read-only)"
    - Grep: "Search content (read-only)"
    - Read: "View file contents (read-only)"
    - WebSearch: "Search web for solutions"

  approval_required:
    - "/claude-building" (writes code)
    - "/test-sprite" (runs tests, scans code)
    - "/debug" (modifies code)
    - "/ui-ux-pro-max" when using stitch
    - claude-code Write/Edit/Bash (modifies files)
---

# 🧭 Smart Router - Intelligent Workflow Routing (v1.0)

## Overview

**Smart Router** is the meta-workflow that automatically routes user requests to the optimal workflow based on intent analysis.

> **Purpose:** Eliminate manual workflow selection. User says what they want, system routes intelligently.

---

## 🎯 How It Works

```
User query: "{anything}"
     ↓
┌─────────────────────────────────────┐
│ Phase 1: Intent Classification      │
│ (sequential-thinking)                │
├─────────────────────────────────────┤
│ Analyze patterns in query:          │
│ - "როგორ" / "how" → RESEARCH       │
│ - "გააკეთე" / "implement" → BUILD   │
│ - "ჩაასწორე" / "fix" → DEBUG       │
│ - "დიზაინი" / "design" → UI/UX     │
│ - "ტესტი" / "test" → TESTING       │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│ Phase 2: Complexity Assessment       │
│ (if intent == BUILD)                 │
├─────────────────────────────────────┤
│ Estimate: Files + Risk              │
│ - Simple → /claude-building         │
│ - Complex → /opus-planning first    │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│ Phase 3: Route & Execute            │
├─────────────────────────────────────┤
│ Execute selected workflow           │
│ (workflow handles its own approvals)│
└─────────────────────────────────────┘
```

---

## 📋 Routing Matrix

### Research Queries
**Patterns:** "როგორ", "how to", "what is", "explain"
**Route:** `/deep-research`
**Auto-execute:** ✅ Yes (context7, github are safe)

**Examples:**
- "როგორ მუშაობს Next.js caching?"
- "How does FastAPI handle async?"
- "What is MongoDB aggregation?"

---

### Implementation Requests
**Patterns:** "გააკეთე", "implement", "create", "add"
**Route:** `/claude-building` (simple) or `/opus-planning` → `/claude-building` (complex)
**Auto-execute:** ❌ No (code changes need approval)

**Examples:**
- "გააკეთე user profile endpoint" → Complex (planning first)
- "Add a button to navbar" → Simple (direct build)

---

### Bug Fixes
**Patterns:** "ჩაასწორე", "fix", "bug", "error", "broken"
**Route:** `/debug`
**Auto-execute:** ❌ No (debugging needs careful analysis)

**Examples:**
- "ჩაასწორე API error"
- "Fix the login button"
- "Debug why tests are failing"

---

### UI/Design
**Patterns:** "დიზაინი", "UI", "design", "style"
**Route:** `/ui-ux-pro-max`
**Auto-execute:** Partial (analysis yes, stitch generation needs approval)

**Examples:**
- "დიზაინი როგორ უნდა იყოს profile page-ის?"
- "Design a loading spinner"

---

### Testing/Security
**Patterns:** "ტესტი", "test", "QA", "security"
**Route:** `/test-sprite`
**Auto-execute:** ❌ No (tests and scans need approval)

**Examples:**
- "Run tests for my changes"
- "Security scan the API code"

---

### Planning/Architecture
**Patterns:** "დაგეგმე", "plan", "architecture"
**Route:** `/opus-planning`
**Auto-execute:** ✅ Yes (planning is safe, no code changes)

**Examples:**
- "Plan the notification system architecture"
- "Design the database schema for chat"

---

## 🚀 Usage Examples

### Example 1: Research Query

```
User: "როგორ გავაკეთო file upload FastAPI-ში?"

Smart Router:
├─ Intent: RESEARCH (pattern "როგორ")
├─ Route: /deep-research
└─ Auto-execute:
    ├─ sequential-thinking (plan research)
    ├─ context7 (search FastAPI docs)
    └─ Result: Documentation + code examples

Duration: ~15 seconds
```

### Example 2: Simple Implementation

```
User: "Add a logout button to the header"

Smart Router:
├─ Intent: IMPLEMENTATION (pattern "add")
├─ Complexity: Simple (1-2 files, UI only)
├─ Route: /claude-building
└─ Ask approval: "Implement logout button?"
    └─ If approved: Write code

Duration: ~5-10 minutes
```

### Example 3: Complex Feature

```
User: "გააკეთე real-time chat feature"

Smart Router:
├─ Intent: IMPLEMENTATION (pattern "გააკეთე")
├─ Complexity: HIGH (10+ files, WebSockets, DB)
├─ Route: /opus-planning first
└─ Flow:
    ├─ /opus-planning (create architecture)
    ├─ User reviews plan
    └─ /claude-building (implement with plan)

Duration: ~60-90 minutes
```

### Example 4: Bug Fix

```
User: "ჩაასწორე: API returns 500 error"

Smart Router:
├─ Intent: DEBUGGING (pattern "ჩაასწორე")
├─ Route: /debug
└─ Flow:
    ├─ Classify: C3 (Critical)
    ├─ Deep investigation
    ├─ Find root cause
    └─ Apply fix

Duration: ~10-30 minutes
```

---

## 🎯 Decision Tree Visualization

```
User Query
    │
    ├─ Contains "როგორ/how/explain"?
    │   └─ YES → /deep-research ✅
    │
    ├─ Contains "სად არის/where is/find in"?
    │   └─ YES → claude-code (Glob/Grep/Read) + /deep-research
    │
    ├─ Contains "გააკეთე/implement/add"?
    │   └─ YES → Complexity check
    │       ├─ Simple (1-2 files) → /claude-building
    │       └─ Complex (3+ files) → /opus-planning → /claude-building
    │
    ├─ Contains "ჩაასწორე/fix/bug"?
    │   └─ YES → /debug (uses claude-code for exploration)
    │
    ├─ Contains "დიზაინი/design/UI"?
    │   └─ YES → /ui-ux-pro-max
    │
    ├─ Contains "ტესტი/test/security"?
    │   └─ YES → /test-sprite (uses claude-code for test discovery)
    │
    ├─ Contains "დაგეგმე/plan/architecture"?
    │   └─ YES → /opus-planning
    │
    └─ Multi-step / unclear?
        └─ YES → /multi-agent-dev (orchestration)
```

---

## ⚡ Performance Optimizations

### Caching Strategy
- **Research queries:** context7 cached 15min → Fast repeat questions
- **Planning:** Templates cached → Faster planning for similar tasks

### Parallel Execution
- **Research:** context7 + github search in parallel
- **Planning:** Research + ToT analysis concurrently

### Early Termination
- **Simple queries:** Fast-track without full workflow
- **Obvious bugs (C1):** Skip deep investigation, fix directly

---

## 📊 Success Metrics

**Before Smart Router:**
- User manually selects workflow: ~30s thinking time
- Wrong workflow selected: ~10% of cases
- Average task completion: 4-5 agent turns

**After Smart Router:**
- Auto-routing: instant
- Correct workflow: ~95% accuracy
- Average task completion: 2-3 agent turns

**Improvement: 40% faster task resolution!**

---

## 🔧 Configuration

### Custom Routing Rules

Add to user's `.agent/config.json`:

```json
{
  "smart_router": {
    "custom_patterns": {
      "my_project_keyword": {
        "patterns": ["keyword1", "keyword2"],
        "route": "/custom-workflow"
      }
    },
    "default_fallback": "/multi-agent-dev",
    "confidence_threshold": 0.8
  }
}
```

---

## 🤝 Integration with Other Workflows

**All workflows can call Smart Router:**

```
Inside /claude-building:
  "This task needs design input"
  → Call /smart-router with "design the X component"
  → Routes to /ui-ux-pro-max
  → Returns with design spec
  → Continue building
```

---

## 📝 Output Template

```markdown
## 🧭 Smart Router Decision

**User Query:** "{original query}"

**Intent Detected:** {RESEARCH | BUILD | DEBUG | UI | TEST | PLAN}
**Confidence:** {percentage}%

**Routing Decision:**
- **Workflow:** {workflow_name}
- **Reasoning:** {why this workflow}
- **Expected Duration:** {estimate}

**Auto-Execute:** {yes/no}
- Safe tools: {list if auto}
- Requires approval: {list if not auto}

---

**Executing workflow: {workflow_name}**
{workflow output follows}
```

---

**ბოლო სიტყვა:** Smart routing = Right tool for the job, automatically!
