---
workflow: multi-agent-dev
version: 3.0
model_preference: gemini-2.0-flash-thinking
description: Full development cycle orchestration and intelligent task routing

# ═══════════════════════════════════════════════════════════════════════════════
# ROUTING METADATA: When to use this workflow (from Oh-My-OpenCode)
# ═══════════════════════════════════════════════════════════════════════════════
routing_metadata:
  useWhen:
    - "Multi-step development task requiring planning + implementation"
    - "Full feature development from scratch"
    - "End-to-end system changes"
    - "Task spans multiple workflow domains (research + build + test)"
    - "Complete development cycle needed"
  avoidWhen:
    - "Single-domain task (use specific workflow instead)"
    - "Simple hotfix (use /debug)"
    - "Pure research question (use /deep-research)"
    - "Simple UI tweak (use /ui-ux-pro-max)"
  triggers:
    - domain: "Orchestration"
      patterns: ["full feature", "end-to-end", "complete system", "სრული ფუნქცია"]
    - domain: "Multi-workflow"
      patterns: ["plan and build", "research then implement", "test after build"]

# ═══════════════════════════════════════════════════════════════════════════════
# THINKING CONFIG: Model-specific reasoning budgets (from Oh-My-OpenCode)
# ═══════════════════════════════════════════════════════════════════════════════
thinking_config:
  claude-opus-4-5:
    budget_tokens: 32000
    use_for: "Complex orchestration decisions, multi-workflow planning"
  claude-sonnet-4-5:
    budget_tokens: 16000
    use_for: "Standard orchestration, routing decisions"
  gemini-2.5-pro:
    budget_tokens: 16000
    use_for: "Alternative orchestration analysis"
  default:
    budget_tokens: 8000
    use_for: "Quick routing decisions"

# ═══════════════════════════════════════════════════════════════════════════════
# Smart Execution Strategy
mcp_strategy:
  phase_1_triage:
    tool: sequential-thinking
    prompt: |
      Deep context triage:

      1. Risk assessment (Risk > Size)
         Small change to auth.py = HIGH RISK (treat as XL)
         Large change to README = LOW RISK (treat as S)

      2. Simulation gate
         "If I start coding now, what's unclear?"
         - If anything unclear → /deep-research or /opus-planning
         - If clear → proceed

      3. Routing decision
         Unknown tech → /deep-research
         M/L/XL task → /opus-planning
         UI focus → /ui-ux-pro-max
         Implementation → /claude-building
         Bug → /debug
         Testing → /test-sprite

    auto_execute: true

  phase_2_workflow_routing:
    routes:
      research: "/deep-research"
      planning: "/opus-planning"
      ui_design: "/ui-ux-pro-max"
      implementation: "/claude-building"
      testing: "/test-sprite"
      debugging: "/debug"
      documentation: "/context-gardener"

  phase_2b_code_exploration:
    tool: claude-code
    when: "Need to understand existing codebase"
    actions:
      - Glob: "Map project structure"
      - Grep: "Find patterns across files"
      - Read: "Analyze specific files"
    auto_execute: true

# Execution Mode
turbo: true  # Routing and planning are safe
requires_approval:
  - workflow_execution  # Individual workflows ask for approvals

# Orchestration Flow
orchestration_flow: |
  ┌─────────────┐
  │   /init     │ Session Start
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ Risk Triage │ (sequential-thinking)
  └──────┬──────┘
         ▼
  ┌─────────────────────────────┐
  │ Route to appropriate workflow│
  ├─────────────────────────────┤
  │ Unknown → /deep-research    │
  │ Complex → /opus-planning    │
  │ UI → /ui-ux-pro-max         │
  │ Build → /claude-building    │
  │ Test → /test-sprite         │
  │ Bug → /debug                │
  └──────┬──────────────────────┘
         ▼
  ┌─────────────┐
  │ Execute     │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ /context-   │ Update docs
  │  gardener   │
  └─────────────┘

# Routing Matrix
routing_matrix:
  - trigger: ["როგორ", "how does", "explain", "what is"]
    route: "/deep-research"

  - trigger: ["გააკეთე", "implement", "add feature", "create"]
    size_check: true
    small: "/claude-building"
    large: "/opus-planning"

  - trigger: ["ჩაასწორე", "fix bug", "error", "broken"]
    route: "/debug"

  - trigger: ["დიზაინი", "UI", "design", "style"]
    route: "/ui-ux-pro-max"

  - trigger: ["ტესტი", "test", "QA", "security"]
    route: "/test-sprite"

  - trigger: ["ბრაუზერი", "browser", "screenshot", "visual bug", "frontend bug"]
    route: "/debug"
    note: "with browser evidence collection (Phase 2b)"

  - trigger: ["UI ტესტი", "visual test", "screenshot test", "responsive check"]
    route: "/test-sprite"
    note: "with visual verification phase"
---

# 🎼 Multi-Agent Dev - Orchestration (v3.0)

## Overview

**Central nervous system** of Antigravity IDE. Routes tasks to optimal workflows.

---

## 🚦 Phase 1: Deep Context Triage

**Use `sequential-thinking` for intelligent routing:**

1. **Risk Assessment:** Risk > Size
   - Small change to critical file = XL task
   - Large change to docs = S task

2. **Simulation Gate:** "What's unclear?"
   - If unclear → research/planning first
   - If clear → execute

3. **Route Decision:** Match to best workflow

---

## 🎯 Routing Matrix

| User Query | Route To |
|:-----------|:---------|
| "როგორ მუშაობს X?" | /deep-research |
| "გააკეთე feature" | /opus-planning → /claude-building |
| "ჩაასწორე ბაგი" | /debug |
| "დიზაინი როგორ უნდა იყოს?" | /ui-ux-pro-max |
| "გატესტე" | /test-sprite |
| "სად არის X?" | /deep-research + claude-code |
| "ბრაუზერში ბაგია" | /debug (with browser evidence Phase 2b) |
| "UI ტესტი / screenshot" | /test-sprite (with visual verification) |

---

## 🔄 Orchestration Flow

```
/init → Triage → Route → Execute → /context-gardener
```

---

**ბოლო სიტყვა:** Right workflow, right time, every time!
