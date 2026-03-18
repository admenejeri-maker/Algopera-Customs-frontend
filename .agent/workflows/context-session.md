---
description: Manage session context (load/handoff) for deep continuity
version: 1.0
model_preference: claude-3-5-sonnet-20241022
---

# 🧠 Antigravity Context Session (Memory Bank)

**Purpose**: Manage component context, load previous state, and ensure perfect handoffs between sessions.

## 🟢 1. Load Context (Start of Session)
**Run this when starting work to load the brain.**

1. **Check Memory Bank**:
   - Verify presence of `.agent/memory/activeContext.md`
   - Verify presence of `.agent/memory/productContext.md`
   - Verify presence of `.agent/memory/projectbrief.md`

2. **Read Last Handoff**:
   - `cat .agent/memory/activeContext.md` to see where we left off.

3. **Initialize Session**:
   - Log session start in `.agent/memory/sessions/session-$(date +%Y%m%d-%H%M).md`
   - "Context Loaded. Ready to engage."

## 🔴 2. Handoff (End of Session)
**Run this before exiting to save state.**

1. **Update Active Context**:
   - Opens `.agent/memory/activeContext.md`
   - Updates `## Current Focus`
   - Updates `## Next Steps`

2. **Generate Session Report**:
   - Dumps session activities to `.agent/memory/sessions/latest.md`
   - Includes: Modified files, Decisions made, Open questions.

3. **Commit Memory**:
   - `git add .agent/memory`
   - `git commit -m "docs(memory): update context bank [skip ci]"`

---

# 🧩 Memory Bank Structure

- `projectbrief.md`: The "North Star". High-level goals.
- `productContext.md`: Architecture, Tech Stack, Design Patterns.
- `activeContext.md`: The "Now". Current sprint, active tasks, blockers.
- `sessions/`: Logs of individual sessions.
