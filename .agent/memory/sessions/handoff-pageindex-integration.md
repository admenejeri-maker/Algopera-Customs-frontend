# Handoff: PageIndex Vectorless RAG — Scoop AI Integration Analysis

> **Created:** 2026-02-25T21:12  
> **From:** Antigravity (Game Master / Orchestrator)  
> **To:** Claude Code (Worker Agent — PLANNING MODE ONLY)  
> **Phase:** Move 2 — Strategic Planning  
> **Status:** AAD_COMPLETE → INTEGRATION_PLAN_PENDING

---

## 🚨 CRITICAL CONSTRAINT

**DO NOT WRITE ANY CODE. PLANNING AND ANALYSIS ONLY.**

You are acting as a **Senior Staff Architect**. Your output is a refined integration plan — not code.

---

## Context

The Orchestrator has completed a deep deconstruction of the VectifyAI/PageIndex repository — a "Vectorless, Reasoning-based RAG" system that uses a hierarchical JSON tree index + LLM reasoning for document retrieval (no vector DB, no chunking).

The AAD (Architecture Analysis Document) is ready for your review.

**Your job is to:**
1. Read the AAD
2. Read our existing search infrastructure  
3. Challenge the AAD's conclusions
4. Produce a detailed integration plan for building a `tree_router.py` module

---

## Step 1: Read the Architecture Analysis Document (AAD)

```
FILE: /Users/maqashable/.gemini/antigravity/brain/67b7be49-44a5-4c60-919e-9df4e7693c39/pageindex_architecture_analysis.md
```

This covers:
- PageIndex Tree Node Schema: `{title, node_id, summary, nodes[]}`
- The exact LLM Tree Search prompt (one-shot, `{thinking, node_list}`)
- Expert Knowledge Injection pattern
- Hybrid MCTS approach (deferred)
- MongoDB → Tree Index mapping for Georgian Tax Code
- Risk matrix and feasibility assessment
- **Verdict:** Adopt concept, not library (~100-line `tree_router.py`)

---

## Step 2: Read the V2 Architecture Decision Record

```
FILE: /Users/maqashable/.gemini/antigravity/brain/67b7be49-44a5-4c60-919e-9df4e7693c39/v2_architecture_decision_record.md
```

This provides the broader V2 context — particularly the PIVOT verdict on Pillar 1 (Graph RAG) which recommends enhanced `$graphLookup` + LightRAG spike. The Tree Router concept from PageIndex may be a superior alternative to both Neo4j and LightRAG.

---

## Step 3: Read Our Current Search System

```
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/vector_search.py
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/rag_pipeline.py
FILE: /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/config.py
```

Focus on:
- `hybrid_search()` — current 3-way merge (direct + semantic + BM25 + RRF)
- `parallel_hybrid_search()` — Phase 1 agentic retrieval
- `enrich_with_graph_lookup()` — current graph traversal
- Feature flags pattern in config.py

---

## Step 4: Your Analysis Assignment

### A. Validate the AAD Conclusions
- Is "Adopt Concept, Not Library" the right call?
- Is a ~100-line `tree_router.py` realistic?
- Is the "Deterministic Build" (MongoDB aggregation → JSON tree) achievable?

### B. Challenge the Integration Architecture
- Should Tree Router **replace** or **augment** hybrid search?
- When should the Tree Router activate? (Always? Classifier-gated? Fallback?)
- How does this interact with the existing `$graphLookup` enrichment?
- What about InfoHub documents — separate tree or unified?

### C. Design the `tree_router.py` Module
Produce a detailed architectural blueprint:

1. **Tree Builder** — MongoDB aggregation query that produces the JSON tree
   - Exact `$group` / `$sort` / `$project` pipeline
   - Caching strategy (in-memory? Redis? How often rebuild?)
   
2. **Tree Search** — Gemini Flash prompt + structured output
   - Full prompt template adapted for Georgian Tax Code
   - Expert Knowledge injection for tax domain
   - Fallback if LLM fails to return valid JSON
   
3. **Integration Point** — How it plugs into `rag_pipeline.py`
   - Where in the 12-step pipeline does it insert?
   - How do Tree Router results merge with existing results?
   - Feature flag design (`tree_router_enabled`, etc.)

4. **Scoop-Specific Adaptations**
   - Georgian article numbering (`მუხლი 81` → `node_id`)
   - Cross-reference awareness in tree structure
   - InfoHub document handling

---

## Step 5: Sprint Structure

Break the integration into testable sprints:

```markdown
### Sprint 1: Tree Builder Module (Size: S)
- [ ] MongoDB aggregation → JSON tree
- [ ] In-memory caching with TTL
- DONE WHEN: `GET /api/debug/tree-index` returns valid JSON tree

### Sprint 2: Tree Search Router (Size: M)  
- [ ] Gemini Flash prompt with Georgian legal context
- [ ] node_id → article_number mapping
- [ ] Feature flag gating
- DONE WHEN: Tree Router correctly identifies relevant articles for 5 test queries

### Sprint 3: Pipeline Integration (Size: M)
- [ ] Merge Tree Router results with hybrid search
- [ ] Classifier gating logic
- DONE WHEN: Side-by-side comparison shows improvement on navigational queries
```

---

## Constraints

- **NO CODE.** Output is markdown planning documents only.
- **Georgian language first.** All prompts must work with Georgian legal terminology.
- **Zero new dependencies.** No `pip install pageindex` — pure concept adoption.
- **Feature-flagged.** Must be disable-able via `config.py` flag.
- **Budget-conscious.** Each Tree Router call = 1 Gemini Flash call. Estimate token cost.

---

## Reference Files (Read in Order)

1. `/Users/maqashable/.gemini/antigravity/brain/67b7be49-44a5-4c60-919e-9df4e7693c39/pageindex_architecture_analysis.md` — AAD
2. `/Users/maqashable/.gemini/antigravity/brain/67b7be49-44a5-4c60-919e-9df4e7693c39/v2_architecture_decision_record.md` — V2 ADR
3. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/vector_search.py` — Current search
4. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/rag_pipeline.py` — Current pipeline
5. `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/config.py` — Feature flags

**HALT after producing the integration plan. Do not implement anything.**
