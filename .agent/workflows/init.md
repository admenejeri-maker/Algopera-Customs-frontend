---
workflow: init
version: 3.0
model_preference: gemini-2.0-flash-thinking
description: Session initialization with ecosystem verification

# Smart Execution Strategy
mcp_strategy:
  phase_1_context_loading:
    description: "Load project documentation"
    actions:
      - read: "AGENT_INSTRUCTIONS.md"
      - read: "backend/CONTEXT.md"
      - read: ".agent/workflows/README.md"
    auto_execute: true

  phase_2_project_structure:
    description: "Scan entire project structure for situational awareness"
    actions:
      - glob: "backend/**/*.py"
        purpose: "Backend Python modules"
      - glob: "frontend/src/**/*.tsx"
        purpose: "Frontend React components"
      - glob: "frontend/src/**/*.ts"
        purpose: "Frontend TypeScript utilities"
      - read: "backend/main.py"
        purpose: "Backend entry point"
      - read: "backend/config.py"
        purpose: "Backend configuration"
      - read: "backend/app/core/engine.py"
        purpose: "Core AI engine"
      - read: "frontend/src/app/page.tsx"
        purpose: "Frontend main page"
      - read: "frontend/src/components/Chat.tsx"
        purpose: "Chat component"
    auto_execute: true

  phase_3_ecosystem_check:
    description: "Verify MCP tool connectivity"
    tools:
      github: "Verify repo access"
      mongodb: "Check connection"
      cloudrun: "Verify services"
      claude-code: "Verify CLI tools (Read, Write, Bash, Glob)"
      context7: "Verify documentation access"
      tavily: "Verify AI-optimized search"
      semgrep: "Verify security scanning"
      sequential-thinking: "Verify reasoning engine"
      stitch: "Verify UI design tools"
      chub: "Verify API docs CLI (chub search)"
    auto_execute: true

  phase_4_workflow_inventory:
    action: "List all available workflows"
    auto_execute: true

# Execution Mode
turbo: true  # Initialization is safe

# Checklist
initialization_checklist:
  - project: "Scoop AI (Georgian Sports Nutrition)"
  - stack: "FastAPI + Next.js + MongoDB + Gemini"
  - model: "Claude Opus 4.5 / Gemini 2.0"
  - tools: "All MCP servers connected"
  - state: "Synced with CONTEXT.md"
---

# 🚀 Init - Session Initialization (v3.0)

## Purpose

Initialize session, load context, verify ecosystem connectivity.

---

## Execution

1. **Load context:**
   - AGENT_INSTRUCTIONS.md
   - CONTEXT.md
   - Workflow v3 README

2. **Verify MCP tools:**
   - GitHub ✓
   - MongoDB ✓
   - Cloud Run ✓
   - Context7 ✓
   - Semgrep ✓
   - Sequential Thinking ✓
   - Stitch ✓
   - **Claude-Code ✓** (NEW - File ops, Bash, Web, Tasks)

3. **List workflows:**
   - /init
   - /deep-research
   - /opus-planning
   - /ui-ux-pro-max
   - /claude-building
   - /test-sprite
   - /debug
   - /multi-agent-dev
   - /context-gardener
   - /smart-router (NEW)

---

**Output:**
```
🚀 Session Initialized (v3.0)

📚 Context: Loaded
🛠️ MCP Tools: All connected
🔧 Workflows: 10 available

Ready for intelligent task routing!
```
