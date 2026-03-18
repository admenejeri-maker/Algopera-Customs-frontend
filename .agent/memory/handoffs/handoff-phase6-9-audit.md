# Claude Code Handoff: Phase 6-9 Architecture Audit & Improved Plan

**Date:** 2026-02-24
**From:** Orchestrator (Strategic Game Master)
**To:** Claude Code (Worker Agent)
**Current Phase:** MOVE 1 → MOVE 2 (Analysis → Strategic Planning)

---

## 🎯 YOUR MISSION

You are a **Senior Systems Architect** performing a second-pass architectural review. Your job is:

1. **წარმოადგინე თავდაპირველი გეგმა** — Show the original Phase 6-9 roadmap as proposed
2. **წარმოადგინე პირველი აუდიტის შედეგები** — Present findings from the first vulnerability assessment (below)
3. **გადაამოწმე არქიტექტურა** — Cross-verify against the actual production codebase
4. **იპოვე გეპები და ბაგები** — Identify any gaps, contradictions, or bugs the first audit missed
5. **შემოთავაზე გაუმჯობესებული გეგმა** — Propose a refined, actionable implementation plan
6. **არაფერი დაწერო** — Do NOT write any production code. Output ONLY the implementation plan document.
7. **კითხვები დასვი თავიდანვე** — If you have clarifying questions, ask them BEFORE starting analysis.

---

## ⛔ HARD CONSTRAINTS

- **DO NOT** write any production code, tests, or scripts
- **DO NOT** modify any files in `/backend/` or `/frontend/`
- **DO NOT** run any servers or execute any tests
- **OUTPUT:** A single implementation plan document (markdown)
- **ASK FIRST:** If anything is unclear, ask ALL questions upfront before proceeding

---

## 📍 PROJECT CONTEXT

**Project Root:** `/Users/maqashable/Desktop/scoop-sagadasaxado`
**System:** Georgian Tax AI Agent (RAG pipeline for საგადასახადო კოდექსი)
**Stack:** Python 3.11 + FastAPI + MongoDB Atlas + Gemini API + Cloud Run (CPU-only)

### Key Files to Read

| File | Purpose |
|---|---|
| `backend/tax_agent/app/services/rag_pipeline.py` | RAG orchestrator (922 lines) — answer_question + SSE streaming |
| `backend/tax_agent/app/services/vector_search.py` | Hybrid search: semantic + BM25 + RRF + cross-refs (889 lines) |
| `backend/tax_agent/app/services/query_rewriter.py` | Query decomposition + context audit (439 lines) |
| `backend/tax_agent/config.py` | Pydantic v2 config — all feature flags and model settings |
| `backend/tax_agent/app/services/embedding_service.py` | Embedding pipeline |
| `backend/tax_agent/app/services/router.py` | Domain router |
| `backend/tax_agent/app/services/critic.py` | Answer critic |
| `backend/tax_agent/app/services/safety.py` | Safety filters |

---

## 📋 ORIGINAL PLAN (Phase 6-9 Roadmap)

### Phase 6: Contextual Retrieval & Cross-Encoder Reranking
- **Goal:** Insert a cross-encoder reranker (ColBERTv2 or similar) after hybrid search to improve relevance before LLM generation
- **Approach:** Retrieve top-20 candidates via vector+BM25 → rerank with cross-encoder → pass top-5 to LLM
- **Proposed model:** `BAAI/bge-reranker-v2-m3` (multilingual, 568M params)

### Phase 7: SAT-Graph RAG (Knowledge Graph)
- **Goal:** Build a Neo4j knowledge graph of Georgian Tax Code article relationships (lex specialis, cross-references, chapter hierarchy)
- **Approach:** Dual-database architecture — MongoDB for chunks/vectors, Neo4j for graph traversal
- **Query pattern:** For each user query, run vector search (MongoDB) + graph traversal (Neo4j) concurrently, merge results

### Phase 8: Neuro-Symbolic Execution (Z3 SMT Solver)
- **Goal:** Use Z3 theorem prover to formally verify tax calculations
- **Approach:** LLM generates Z3 Python constraints from tax rules → execute in sandbox → return verified mathematical result
- **Expected benefit:** Eliminate arithmetic errors in multi-component tax calculations

### Phase 9: LangGraph Orchestration
- **Goal:** Replace raw Python asyncio with LangGraph state machine + Redis/Celery message queues
- **Approach:** Each RAG step becomes a LangGraph node with retry logic, state persistence, and observability
- **Infrastructure:** Add Redis (state store) + Celery (task workers) + LangSmith (tracing)

---

## 🔴 FIRST AUDIT FINDINGS (Vulnerability Assessment)

### Current Production Baseline (measured)

| Component | Technology | Latency |
|---|---|---|
| Query Decomposition | `gemini-3-flash-preview` | ~2s |
| Parallel Hybrid Search | MongoDB Atlas (vector + BM25 RRF) | ~4s (3 intents) |
| Context Audit + Gap-Fill | `gemini-2.5-flash` | ~2s |
| LLM Generation (Thinking) | `gemini-3-pro-preview` | ~50s |
| **Total E2E** | SSE streaming | **~64s** |

### Phase 6 Findings
- **V6-1:** `bge-reranker-v2-m3` averages **2,383ms on GPU**. On CPU-only Cloud Run → estimated **8-15 seconds**
- **V6-2:** Georgian is NOT in the explicit training set. No benchmarks exist for Georgian legal text
- **V6-3:** Cloud Run GPU instances cost 10x more ($0.40/hr vs $0.05/hr)
- **Recommendation:** Use Cohere Rerank v3 API (200ms avg) or Gemini-native reranking

### Phase 7 Findings
- **V7-1:** No cross-database transactions between MongoDB and Neo4j. Legal data cannot tolerate eventual consistency
- **V7-2:** `enrich_with_cross_refs()` in `vector_search.py` already does cross-ref enrichment within MongoDB
- **V7-3:** Neo4j AuraDB costs $65/month minimum. Current MongoDB Atlas M0 is free
- **V7-4:** Georgian Tax Code is a tree, not a graph. Cross-references are sparse (2-5 per article)
- **Recommendation:** Enhanced MongoDB cross-refs with `refs` array + `$lookup`

### Phase 8 Findings
- **V8-1:** Python sandbox RCE — 3 CVEs in Jan-Feb 2026 (CVE-2026-0863, CVE-2026-25115, CVE-2025-68668)
- **V8-2:** LLM-generated Z3 code is non-deterministic, ~20% syntax error rate
- **V8-3:** Z3's Python bindings import `ctypes` — direct path to arbitrary memory access
- **V8-4:** T5-S3 proved Gemini already calculates multi-component taxes correctly with native thinking
- **Recommendation:** Defer Z3. Implement arithmetic verification as post-processing

### Phase 9 Findings
- **V9-1:** Current traffic <100 concurrent users. `asyncio.gather()` already handles concurrency
- **V9-2:** LangGraph adds 3 volatile dependencies with breaking changes every 2-3 months
- **V9-3:** Redis/Celery costs $15-30/month for a problem we don't have yet
- **Recommendation:** asyncio + OpenTelemetry, defer Redis/Celery until >500 concurrent users

### Alternative Proposed (Phase 6A-6D)

| Phase | Name | Description | Infra Change |
|---|---|---|---|
| 6A | Gemini-Native Reranking | Embed relevance scoring into auditor prompt | None |
| 6B | MongoDB Cross-Ref Enrichment | `refs` array + `$lookup` joins | None |
| 6C | Arithmetic Verification | Post-process LLM output, verify math claims | None |
| 6D | Pipeline Observability | OpenTelemetry + circuit breakers + dashboards | GCP Trace (free) |

---

## 🔍 YOUR TASK: What to Produce

### Step 1: Ask Questions (if any)
Before starting, ask ALL clarifying questions. Examples:
- Do you agree with the alternative 6A-6D roadmap?
- Should I evaluate if Cohere Rerank v3 supports Georgian specifically?
- Is there a budget ceiling for new infrastructure?
- Should I consider Google Vertex AI reranking as a Gemini-native option?

### Step 2: Read the Codebase
Read ALL key files listed above. Understand the actual implementation, not just the outlines.

### Step 3: Cross-Verify
- Does the first audit accurately represent the codebase?
- Are there gaps or bugs the audit missed?
- Are there existing capabilities that make some proposed phases redundant?
- Are there hidden technical debts that should be addressed first?

### Step 4: Produce the Improved Plan
Output a single markdown document with:

```
# [Title]

## Executive Summary
- What changed from the original plan and why

## Current Architecture Assessment  
- Accurate snapshot of what exists today
- Hidden technical debt or risks discovered

## Gaps & Bugs Found
- Anything the first audit missed
- Contradictions between audit claims and actual code

## Improved Phase Plan
- For each phase: Goal, Approach, Files to Change, Dependencies, Risks, Acceptance Criteria
- Clear ordering (what blocks what)
- Realistic latency/cost estimates

## Open Questions for Orchestrator
- Decisions that need human judgment
```

---

## ⚠️ RULES OF ENGAGEMENT

1. **Be adversarial.** Challenge BOTH the original plan AND the first audit. Neither is sacred.
2. **Be specific.** Cite file names, line numbers, function names. "The code does X" is not enough — show WHERE.
3. **Be honest about unknowns.** If you can't verify something without running the code, say so.
4. **Zero code.** Your output is a plan, not an implementation.
5. **Georgian context matters.** This is a საგადასახადო (tax) system for Georgia. Domain-specific decisions (like reranker language support) are critical, not academic.
