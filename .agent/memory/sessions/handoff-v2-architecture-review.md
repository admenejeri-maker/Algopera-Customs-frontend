# Handoff: V2 Architecture Critical Review & Plan Refinement

> **Created:** 2026-02-25T19:53  
> **From:** Antigravity (Game Master / Orchestrator)  
> **To:** Claude Code (Worker Agent — PLANNING MODE ONLY)  
> **Phase:** Move 2 — Strategic Planning  
> **Status:** ADR_COMPLETE → PLAN_REFINEMENT_PENDING

---

## 🚨 CRITICAL CONSTRAINT

**DO NOT WRITE ANY CODE. PLANNING AND ANALYSIS ONLY.**

You are acting as a **Senior Staff Architect**. Your output is a refined, actionable V2 Implementation Plan — not code.

---

## Context

The Game Master has completed a State-of-the-Art (SOTA) compliance review for the V2 architecture of the Georgian Tax AI Agent. The current V1 system is already a sophisticated 12-step agentic RAG pipeline with 30+ feature flags, hybrid search (vector + BM25 + RRF), LLM reranking, critic QA loops, math verification, and circuit breakers.

A V2 proposal was drafted with 4 architectural pillars. An independent Architecture Decision Record (ADR) has critically analyzed each pillar and rendered verdicts.

**Your job is to synthesize both documents and produce a superior, refined plan.**

---

## Step 1: Read the Original V2 SOTA Proposal

The original enterprise sprint plan and V1 architecture are here:

```
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/docs/plans/2026-02-16-tax-agent-implementation-plan-v5-FINAL.md
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/docs/plans/2026-02-17-enterprise-sprint-implementation-plan.md
```

Also review the current system state:
```
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/config.py
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/rag_pipeline.py
```

**Understand:** What is V1 today? What was proposed for V2?

---

## Step 2: Read the V2 Architecture Decision Record (ADR)

The critical analysis of the 4 proposed V2 pillars is here:

```
FILE: /Users/maqashable/.gemini/antigravity/brain/67b7be49-44a5-4c60-919e-9df4e7693c39/v2_architecture_decision_record.md
```

**The ADR rendered these verdicts:**

| Pillar | Proposal | ADR Verdict |
|--------|----------|-------------|
| 1. Graph RAG | Neo4j + Text-to-Cypher | **PIVOT** → Enhanced `$graphLookup` + LightRAG spike |
| 2. Neuro-Symbolic | LLM → Z3/Python → Docker sandbox | **PIVOT** → Pydantic Tool Calling + Tax Calculator Toolkit |
| 3. LangGraph | CodeExecutor + Auditor loops | **DROP** → V1 already equivalent |
| 4. Evals | Custom code gen + graph evals | **PIVOT** → 3-layer pipeline (pytest → Ragas → Promptfoo) |

---

## Step 3: Your Analysis Assignment

Now critically analyze BOTH documents. For each pillar:

### A. Where do you AGREE with the ADR?
- Which vulnerabilities identified are genuine showstoppers?
- Which alternatives proposed are clearly superior?

### B. Where do you DISAGREE with the ADR?
- Is the ADR too conservative on any pillar?
- Are there hybrid approaches the ADR missed?  
- Is there value in any dropped component that could be preserved in a lighter form?

### C. What did BOTH documents miss?
- Are there V2 capabilities neither document proposed?
- What about the Georgian-specific domain challenges (morphology, legal text structure, Matsne integration)?
- Multi-language support, user personalization, or regulatory compliance gaps?

---

## Step 4: Produce a Refined V2 Implementation Plan

Based on your synthesis, write a **refined V2 plan** that:

1. **Respects the ADR's risk analysis** — don't re-propose what was killed for good reason
2. **Salvages value where possible** — if a dropped pillar has a lighter-weight variant worth considering, propose it
3. **Fills gaps** — identify capabilities V2 needs that neither document addressed
4. **Is sprint-structured** — break into 2-week sprints with clear deliverables
5. **Has explicit acceptance criteria** — each sprint has measurable DONE-WHEN conditions
6. **Estimates complexity** — T-shirt sizing (S/M/L/XL) per sprint
7. **Defines dependencies** — which sprints block which

### Output Format

```markdown
# V2 Refined Implementation Plan

## Executive Summary
(3-5 sentences: what V2 delivers and the key strategic decisions)

## Architecture Decisions (Final)
(Table: Pillar | Original Proposal | ADR Verdict | Your Final Decision | Rationale)

## Sprint Breakdown
### Sprint V2.1: [Name] (Size: X, Duration: Ydays)
- Scope: ...
- Files: ...
- DONE WHEN: ...
- Dependencies: None

### Sprint V2.2: ...
(repeat for each sprint)

## Risk Matrix
(Updated with refined approach risks)

## What We're NOT Building (and why)
(Explicit exclusion list to prevent scope creep)
```

---

## Constraints

- **NO CODE.** Output is markdown planning documents only.
- **Be ruthlessly honest.** If you think the ADR is wrong on something, say so with evidence.
- **Georgian domain awareness.** Solutions must work for Georgian legal text (no Latin-alphabet assumptions).
- **Budget-conscious.** The team is small. Prefer solutions that extend V1 over greenfield rewrites.
- **Production-first.** Every proposed component must be deployable to Cloud Run within its sprint.

---

## Reference Files (Read in Order)

1. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/docs/plans/2026-02-16-tax-agent-implementation-plan-v5-FINAL.md` — V1 architecture
2. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/docs/plans/2026-02-17-enterprise-sprint-implementation-plan.md` — Enterprise sprint  
3. `/Users/maqashable/.gemini/antigravity/brain/67b7be49-44a5-4c60-919e-9df4e7693c39/v2_architecture_decision_record.md` — ADR critique
4. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/config.py` — Current feature flags
5. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/rag_pipeline.py` — Current pipeline

**HALT after producing the refined plan. Do not implement anything.**
