---
workflow: context-gardener
version: 3.0
model_preference: claude-sonnet-4-5
description: Knowledge maintenance and documentation updates

# Smart Execution Strategy
mcp_strategy:
  phase_1_analysis:
    tool: sequential-thinking
    prompt: |
      What changed that needs documentation?
      - New feature → Update CONTEXT.md
      - Architecture change → Update ARCHITECTURE.md
      - API change → Update API_CONTRACTS.md
      - Bug fix → Update CHANGELOG.md

    auto_execute: true

  phase_2_update:
    files_to_update:
      - CONTEXT.md
      - ARCHITECTURE.md (if applicable)
      - API_CONTRACTS.md (if applicable)
      - CHANGELOG.md (if applicable)

    auto_execute: false  # File edits need approval

# Execution Mode
turbo: false  # Documentation changes need review
requires_approval:
  - file_edits
---

# 📚 Context Gardener - Knowledge Maintenance (v3.0)

## Purpose

Keep documentation fresh and accurate after changes.

---

## Process

1. **Analyze what changed**
2. **Determine which docs need updates**
3. **Update relevant files:**
   - CONTEXT.md (current state)
   - ARCHITECTURE.md (system design)
   - API_CONTRACTS.md (API specs)
   - CHANGELOG.md (version history)

---

**ბოლო სიტყვა:** Good documentation = future you will thank present you!
