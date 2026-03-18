# Phase 6-9 Architecture Audit: Second-Pass Review & Improved Plan

**Date:** 2026-02-24
**Author:** Senior Systems Architect (Second-Pass Auditor)
**Status:** PLAN ONLY — Zero production code

---

## Executive Summary

The first audit was **largely correct** in its risk assessment of the original Phase 6-9 roadmap. However, the proposed alternative (6A-6D) is too conservative in places and misses several genuine improvements that the original roadmap attempted to solve. This second-pass review found:

1. **3 bugs/gaps the first audit missed** — including a critical silent failure in the critic module and a concurrency issue in the streaming path
2. **2 audit claims that are partially wrong** — the cross-ref system is more capable than the audit credits, and the "Georgian not in training set" claim needs nuance
3. **1 major technical debt** that should be addressed before ANY new phase work
4. **A refined 4-phase plan** that blends the best of both approaches

The verdict: **neither the original 6-9 nor the alternative 6A-6D is optimal**. The right plan is a hybrid that addresses real gaps while respecting the CPU-only, low-budget constraints.

---

## Current Architecture Assessment

### What Actually Exists (verified against code)

| Component | File | Lines | Key Observations |
|---|---|---|---|
| RAG Orchestrator | `rag_pipeline.py` | 922 | Two paths: `answer_question()` (sync+critic) and `answer_question_stream()` (SSE, no critic). Both paths share retrieval logic but diverge at generation. |
| Hybrid Search | `vector_search.py` | 889 | 3-way search: semantic ($vectorSearch) + BM25 ($search) + direct lookup. RRF fusion at K=60. Cross-ref enrichment via `related_articles` field. |
| Query Rewriter | `query_rewriter.py` | 439 | 3 functions: `rewrite_query()`, `decompose_query()`, `audit_context_coverage()`. All fail-safe (return defaults on error). |
| Config | `config.py` | 158 | Pydantic v2 BaseSettings. 30+ feature flags. Most advanced features gated (router=False, critic=False, logic_rules=False, graph_expansion=False). |
| Embedding | `embedding_service.py` | 312 | `gemini-embedding-001`, 3072-dim. Singleton client. Batch support with rate limiting. |
| Router | `router.py` | 170 | Keyword-only (Tier 0: compound rules, Tier 1: keyword map). Tier 2 semantic stub is TODO. |
| Critic | `critic.py` | 140 | Confidence-gated QA reviewer. Uses `settings.generation_model` (expensive). Fail-open. |
| Safety | `safety.py` | 160 | 3-tier safety: primary → fallback → backup model. ThinkingConfig support. |
| System Prompt | `tax_system_prompt.py` | 211 | Rich Georgian persona with few-shot examples. Citation instruction injection. Disclaimer system. |
| Stream Bridge | `llm_stream.py` | 137 | Queue-based sync→async bridge for Gemini streaming. Heartbeat at 2s intervals. |
| Follow-up Gen | `follow_up_generator.py` | 167 | Flash model generates 3-4 Georgian follow-up questions. Fail-safe. |
| Classifiers | `classifiers.py` | 105 | Red zone (regex), term resolver (DB substring match), past-date detector (regex). |
| Logic Loader | `logic_loader.py` | 71 | Lazy-load CoL rules from `data/logic/*.md`. Path traversal guard. 3 rule files exist (corporate, individual, micro). |
| Cross-ref Script | `populate_related_articles.py` | 179 | Regex-based extraction from body text. Two patterns: "მუხლი N" and "N-ე მუხლი". Max 500 articles. |

### Production Configuration (from `config.py` defaults)

| Setting | Default | Impact |
|---|---|---|
| `generation_model` | `gemini-3-flash-preview` | **NOT** `gemini-3-pro-preview` as the first audit claims for generation |
| `query_rewrite_model` | `gemini-3-flash-preview` | Used for decomposition + audit + rewriting |
| `compression_model` | `gemini-2.0-flash` | Older model for compression |
| `safety_fallback_model` | `gemini-2.5-flash` | Backup on safety blocks |
| `follow_up_model` | `gemini-2.0-flash` | Follow-up generation |
| `thinking_enabled` | `True` | Active — uses `thinking_budget: 2048` |
| `graph_expansion_enabled` | `False` | Cross-ref enrichment is DISABLED by default |
| `router_enabled` | `False` | Domain routing is DISABLED by default |
| `critic_enabled` | `False` | QA critic is DISABLED by default |
| `context_compression_enabled` | `True` | Active — threshold 1500 chars |
| `max_context_chars` | `20000` | Budget for pack_context() |

---

## Gaps & Bugs Found

### GAP-A1: First Audit Misidentifies the Generation Model

**Claim (audit):** "LLM Generation (Thinking) uses `gemini-3-pro-preview` at ~50s"

**Reality:** `config.py:47-51` shows `generation_model` defaults to `gemini-3-flash-preview`, not `gemini-3-pro-preview`. The `GEMINI_GENERATION_MODEL` env var alias allows override, so production *may* use pro-preview — but this is not the default.

**Impact:** If production uses flash-preview (the default), the 50s generation time is inflated. Flash models typically respond in 5-15s. The audit's latency baseline may be based on a non-default configuration.

**Action needed:** Verify which model is actually deployed in Cloud Run env vars before optimizing for latency.

### GAP-A2: Critic Uses the Expensive Generation Model

**Bug in `critic.py:112`:** The critic calls `settings.generation_model` for its QA review. If production uses `gemini-3-pro-preview` for generation, the critic ALSO uses the expensive model for a simple JSON yes/no judgment. This doubles the cost of pro-preview calls when critic is enabled.

```python
# critic.py:112 — uses generation_model, should use a flash model
response = await asyncio.to_thread(
    client.models.generate_content,
    model=settings.generation_model,  # BUG: should be a dedicated critic_model
```

**Fix:** Add `critic_model` field to `config.py` defaulting to `gemini-3-flash-preview`.

### GAP-A3: Streaming Path Skips Critic AND Safety Retry — No Quality Gate

**`rag_pipeline.py:717-720`:** The streaming path (`answer_question_stream`) explicitly disables both the critic AND the safety retry loop. This means the streaming path (which is what users actually see via SSE) has NO post-generation quality control.

The first audit does not flag this. For a tax law system where accuracy is critical, this is a significant gap. The streaming path is the primary user-facing path.

**Possible mitigations (for plan):**
- Post-stream critic: after `full_answer` is assembled (line 888), run the critic asynchronously and emit a "correction" event if it fails
- Or: implement a "confidence warning" event that fires after streaming completes

### GAP-A4: `find_by_number()` Returns Only chunk_index=0

**`tax_article.py:158-161`:** `find_by_number()` uses `find_one()`, which returns only the first matching document. For chunked articles (chunk_index > 0), this silently drops all chunks except the first one.

```python
async def find_by_number(self, article_number: int) -> Optional[dict]:
    return await self._collection.find_one(
        {"article_number": article_number, "status": "active"},
        {"_id": 0},
    )
```

When a user asks "მუხლი 81" and article 81 has been chunked into 3 pieces, only chunk 0 is returned by direct lookup. The semantic search may retrieve other chunks, but the direct lookup path (score=1.0) is incomplete.

**Impact:** Direct article lookup gives partial information for long articles. This is a pre-existing bug, not introduced by any phase.

### GAP-A5: Cross-Ref Enrichment Uses `find_by_numbers()` Which Also Has a Chunk Gap

**`tax_article.py:163-176`:** `find_by_numbers()` uses `find()` with `$in`, which returns ALL matching documents (including all chunks). This is correct for cross-refs but inconsistent with `find_by_number()` (singular) which only returns one chunk.

However, `enrich_with_cross_refs()` at `vector_search.py:509` deduplicates by `article_number` in the `seen` set — so if article 82 has 3 chunks and chunk 0 is already in results, the other chunks of 82 won't be fetched as cross-refs. This is correct behavior but means cross-ref enrichment is chunk-unaware.

### GAP-A6: The Audit's "Georgian Not in Training Set" Claim Needs Nuance

**Claim (V6-2):** "Georgian is NOT in the explicit training set. No benchmarks exist for Georgian legal text."

**Reality for `bge-reranker-v2-m3`:** This is accurate — Georgian is not in the BAAI training languages. However, the alternative suggestion of "Gemini-native reranking" also lacks Georgian-specific benchmarks. The difference is that Gemini models have significantly more Georgian language exposure via their general web training data than a 568M-param BAAI model.

**For Cohere Rerank v3:** Cohere's supported languages list does not include Georgian either. The audit recommends Cohere without verifying Georgian support.

**Corrected recommendation:** Gemini-native reranking (using flash model as a relevance judge) is the most Georgian-safe option since Gemini models demonstrably handle Georgian (the entire system already works in Georgian).

### GAP-A7: `resolve_terms()` Loads ALL Definitions Every Call

**`classifiers.py:65-66`:** `resolve_terms()` creates a new `DefinitionStore()` and calls `find_all()` on EVERY query. No caching.

```python
async def resolve_terms(query: str) -> List[dict]:
    store = DefinitionStore()
    all_defs = await store.find_all()  # DB hit every time
```

If there are 200 definitions, this is 200 documents loaded from MongoDB per query. This is wasteful and adds latency to every request.

### GAP-A8: Compression Uses `gemini-2.0-flash` — Outdated Model

**`config.py:83`:** `compression_model` defaults to `gemini-2.0-flash`, which is an older model. The system already uses `gemini-3-flash-preview` for generation and rewriting. Using a newer model for compression would be more consistent and potentially better quality.

### GAP-A9: `_COMPRESS_SEMAPHORE` is Module-Level — Shared Across All Requests

**`rag_pipeline.py:67`:** The compression semaphore `asyncio.Semaphore(3)` is defined at module level. In a multi-worker deployment, each worker gets its own semaphore. But within a single worker, ALL concurrent requests share the same 3-slot semaphore. Under load, this creates a bottleneck where compression for one user blocks compression for another.

This isn't critical at <100 concurrent users, but it's worth noting for Phase 6D (observability) — this should be monitored.

### GAP-A10: Pack Context Truncation Loses Mid-Chunk Information

**`rag_pipeline.py:387-390`:** The partial truncation in `pack_context()` cuts text at `remaining - len("\n[...]")` characters and appends `\n[...]`. This is a character-level cut that may split Georgian words or legal terms mid-character (Georgian uses multi-byte UTF-8).

```python
truncated_body = body[:remaining - len("\n[...]")] + "\n[...]"
```

**Impact:** The truncation marker is 6 ASCII characters but the body is Georgian UTF-8. The character count is correct (Python str slicing is Unicode-aware), but splitting mid-word can create nonsensical legal text that confuses the LLM.

---

## Contradictions Between Audit Claims and Actual Code

### Contradiction C1: "Cross-ref enrichment already exists in MongoDB"

**Audit claim (V7-2):** "`enrich_with_cross_refs()` in `vector_search.py` already does cross-ref enrichment within MongoDB"

**Partially true, but:** `graph_expansion_enabled` defaults to `False` in `config.py:77`. So while the code exists, it's disabled in production. The first audit should have flagged that the feature it says "already exists" is actually turned off.

Additionally, the cross-ref system is regex-based (`populate_related_articles.py`) and only captures explicit "მუხლი N" patterns. It misses:
- Chapter-level references ("ამ თავის" = "this chapter")
- Implicit semantic relationships (articles about the same tax type)
- Hierarchical relationships (parent chapter → child articles)

The original Phase 7 (Knowledge Graph) was trying to solve these deeper relationships, not just explicit article cross-refs. The audit dismisses Phase 7 too readily.

### Contradiction C2: "Georgian Tax Code is a tree, not a graph"

**Audit claim (V7-4):** "Georgian Tax Code is a tree, not a graph. Cross-references are sparse (2-5 per article)."

**Partially wrong:** The code structure (კარი → თავი → მუხლი) IS a tree. But cross-references create cycles and lateral connections that form a graph. The `populate_related_articles.py` script extracts these, and the `MAX_VALID_ARTICLE = 500` cap suggests there are enough to matter.

That said, the audit is right that Neo4j is overkill. MongoDB `$graphLookup` can handle tree + cross-ref traversal natively.

### Contradiction C3: Audit latency baseline may be wrong

As noted in GAP-A1, the 50s generation time assumes `gemini-3-pro-preview`, but the default config uses `gemini-3-flash-preview`. Need to verify the actual deployed model before trusting the 64s E2E baseline.

---

## Improved Phase Plan

### Pre-requisite Phase: Technical Debt Cleanup (PHASE 0)

**Goal:** Fix bugs and inefficiencies discovered in this audit before adding new features.
**Duration:** 1 sprint (3-5 days)
**Priority:** CRITICAL — do this first

| # | Fix | File(s) | Effort |
|---|---|---|---|
| 0.1 | Add `critic_model` config field, default to flash | `config.py`, `critic.py` | 30min |
| 0.2 | Fix `find_by_number()` to return all chunks | `tax_article.py` | 1hr |
| 0.3 | Cache `resolve_terms()` definitions with TTL | `classifiers.py` | 1hr |
| 0.4 | Update `compression_model` default to `gemini-3-flash-preview` | `config.py` | 5min |
| 0.5 | Verify production `GEMINI_GENERATION_MODEL` env var | Cloud Run config | 15min |
| 0.6 | Add word-boundary-aware truncation in `pack_context()` | `rag_pipeline.py` | 1hr |

**Acceptance Criteria:**
- All existing tests pass
- `find_by_number()` returns all chunks for a multi-chunk article
- `resolve_terms()` only hits DB once per TTL period
- Critic uses a flash model, not the generation model

---

### Phase 6A: Gemini-Native Reranking (Revised)

**Goal:** Improve retrieval relevance by adding a lightweight LLM-based reranking step after hybrid search, using Gemini Flash as a relevance judge.

**Why not the alternatives:**
- `bge-reranker-v2-m3`: CPU-only = 8-15s latency (audit correct). No Georgian support (audit correct).
- Cohere Rerank v3 API: No confirmed Georgian support. External dependency + API cost.
- Vertex AI Ranking API: Google's managed reranker — worth evaluating, but unclear Georgian support.
- **Gemini Flash as judge**: Already proven to handle Georgian. ~1-2s latency. Zero new infrastructure.

**Approach:**

Implement a "relevance scoring" step where Gemini Flash scores each search result (query, document) pair on a 1-5 scale. This is NOT the same as the context auditor — the auditor checks coverage gaps; the reranker scores individual document relevance.

**Key design decision:** Score all candidates in a SINGLE prompt (not N separate calls). Pack the query + top-10 candidate summaries into one flash call, ask for JSON relevance scores.

**Files to Change:**

| File | Change |
|---|---|
| `config.py` | Add `reranker_enabled: bool = False`, `reranker_model: str = "gemini-3-flash-preview"`, `reranker_top_k: int = 10`, `reranker_timeout: float = 3.0` |
| `vector_search.py` | Add `rerank_with_llm()` function after `merge_and_rank()` |
| `rag_pipeline.py` | Insert reranker call between hybrid search and `pack_context()` (both sync and stream paths) |

**Latency estimate:** 1-2s additional (single flash call with 10 candidates)
**Cost estimate:** ~$0.001 per query (flash pricing)

**Risks:**
- Flash model may not differentiate relevance well for Georgian legal text (mitigated by: can A/B test against current pipeline)
- Adding a 3rd LLM call increases failure surface (mitigated by: fail-safe pattern — skip reranking on error)

**Acceptance Criteria:**
- Feature-gated by `reranker_enabled` flag
- Measurable improvement on a set of 20 benchmark queries (before/after relevance comparison)
- E2E latency increase < 3s
- Graceful degradation if reranker call fails

---

### Phase 6B: Enhanced MongoDB Cross-Ref Graph (Revised)

**Goal:** Make the existing cross-ref system production-ready and extend it with `$graphLookup` for multi-hop traversal, WITHOUT adding Neo4j.

**Why the original Phase 7 (Neo4j) is wrong:**
The first audit is correct that Neo4j adds cost and operational complexity for a tree+sparse-graph structure. MongoDB's `$graphLookup` can handle 2-hop cross-ref traversal natively.

**Why the first audit's alternative is incomplete:**
The audit says "Enhanced MongoDB cross-refs with `refs` array + `$lookup`" — but this already exists (`related_articles` field + `enrich_with_cross_refs()`). The real gap is:
1. `graph_expansion_enabled` is **OFF** by default — needs evaluation and enabling
2. Cross-refs are only extracted by regex — misses implicit relationships
3. No multi-hop traversal (article A → article B → article C)
4. `find_by_number()` is broken for chunked articles (GAP-A4)

**Approach:**

1. **Fix `find_by_number()`** (Phase 0 prerequisite)
2. **Enable `graph_expansion_enabled`** after fixing and testing
3. **Add `$graphLookup` pipeline** for 2-hop cross-ref traversal (A references B, B references C → include C)
4. **Add chapter-level cross-refs**: If article 81 is in "თავი XIV", and a user query about article 81's exception mentions "ამ თავის" (this chapter), also retrieve sibling articles from the same chapter
5. **Improve `populate_related_articles.py`**: Add patterns for "ამ თავის" (this chapter), "ამ კარის" (this part), and other Georgian legal cross-ref formulations

**Files to Change:**

| File | Change |
|---|---|
| `vector_search.py` | Add `enrich_with_graph_lookup()` using `$graphLookup` pipeline. Replace or extend `enrich_with_cross_refs()`. |
| `tax_article.py` | Fix `find_by_number()` to use `find()` instead of `find_one()`. |
| `populate_related_articles.py` | Add new regex patterns for chapter/part references. |
| `config.py` | Add `graph_lookup_depth: int = 2`, change `graph_expansion_enabled` default to `True` after testing. |

**MongoDB `$graphLookup` pipeline (conceptual):**
```
{
  $graphLookup: {
    from: "tax_articles",
    startWith: "$related_articles",
    connectFromField: "related_articles",
    connectToField: "article_number",
    maxDepth: 1,  // 2-hop total (direct + 1 hop)
    depthField: "hop_depth",
    restrictSearchWithMatch: { status: "active" }
  }
}
```

**Latency estimate:** ~200-500ms for $graphLookup (depends on fan-out)
**Cost estimate:** $0 (MongoDB Atlas M0 supports $graphLookup)

**Risks:**
- $graphLookup fan-out: if an article references 10 articles, each of which references 10 more = 100 documents. Mitigated by `maxDepth: 1` and `max_graph_refs` cap.
- M0 tier may have performance limits for $graphLookup. Needs testing.

**Acceptance Criteria:**
- 2-hop cross-ref traversal works on test queries
- No latency regression > 500ms
- Graph expansion is enabled by default
- New regex patterns extract chapter/part references

---

### Phase 6C: Arithmetic Verification Layer (Revised — Orchestrator Corrected)

**Goal:** Add a post-processing verification step for mathematical claims in LLM output, without Z3 or any code execution sandbox.

**Why the original Phase 8 (Z3) is wrong:**
The first audit's security findings (V8-1 through V8-3) are valid and compelling. RCE risk from LLM-generated Z3 code is unacceptable. The 20% syntax error rate alone disqualifies Z3.

**Why the first audit's alternative is incomplete:**
The audit says "Implement arithmetic verification as post-processing" but doesn't specify HOW. Here's a concrete design.

> [!IMPORTANT]
> **Orchestrator Correction:** Flash model can hallucinate its own verification — LLM verifying LLM output is circular. Use deterministic verification first, Flash only as fallback.

**Approach: Two-Tier "Calculator Judge" pattern**

**Tier 1 — Deterministic (regex + `ast.literal_eval`):** Fast, zero-cost, zero-hallucination risk.
1. After LLM generation, extract mathematical claims using regex (Georgian number patterns: `ლარი`, `%`, digit sequences, `=` signs)
2. Parse extracted arithmetic expressions using Python `ast.literal_eval()` + `ast.parse()` with a restricted AST whitelist (only `Add`, `Sub`, `Mult`, `Div`, `Mod`, `Num`, `UnaryOp` nodes — no function calls, no imports, no attribute access)
3. Evaluate the safe AST and compare result against the LLM's stated answer
4. If match → add confidence marker: "✅ გამოთვლა გადამოწმებულია."
5. If mismatch → add disclaimer: "⚠️ გამოთვლა შეიძლება შეიცავს უზუსტობას — გადაამოწმეთ."
6. If extraction fails (complex multi-step, can't parse) → escalate to Tier 2

**Tier 2 — Flash Verifier (fallback for complex cases only):**
1. Only invoked when Tier 1 cannot extract/parse the arithmetic (multi-step calculations, percentage chains, conditional logic)
2. Flash model receives: original question + context numbers + LLM's calculation + instruction "Verify step-by-step, show your work"
3. Flash response is parsed for agree/disagree signal — NOT trusted blindly
4. If Flash disagrees, append disclaimer (never silently correct)

**Why this ordering matters:**
- Tier 1 handles ~70% of tax calculations (simple arithmetic: `100000 × 0.20 = 20000`)
- Tier 2 handles ~25% (multi-step: progressive rates, deduction chains)
- ~5% are unchecked (natural language reasoning with no extractable math)
- Deterministic > LLM for simple math — no hallucination, no latency, no cost

**Files to Change:**

| File | Change |
|---|---|
| `config.py` | Add `math_verification_enabled: bool = False`, `math_verification_model: str = "gemini-3-flash-preview"`, `math_verification_tier2_enabled: bool = True` |
| New: `app/services/math_verifier.py` | Two-tier verifier: `extract_math_claims()` (regex), `verify_deterministic()` (ast), `verify_with_flash()` (Tier 2 fallback) |
| `rag_pipeline.py` | Insert verification step after generation in `answer_question()`. For streaming path, run asynchronously after `full_answer` is assembled and emit a verification event. |

**Latency estimate:** Tier 1: <50ms (pure Python). Tier 2: 1-2s (Flash call, only ~25% of red_zone queries)
**Cost estimate:** Tier 1: $0. Tier 2: ~$0.001 per query (only complex cases)

**Risks:**
- Regex extraction may miss non-standard Georgian number formats (mitigated by: comprehensive pattern set including `ათასი`, `მილიონი`, comma-separated digits)
- Tier 2 Flash may still hallucinate (mitigated by: Tier 2 only appends disclaimers, never silently corrects the answer)
- Only triggers on red_zone queries — may miss unlabeled calculation queries

**Acceptance Criteria:**
- Feature-gated by `math_verification_enabled`
- Tier 1 correctly verifies simple arithmetic in test suite (10 cases)
- Tier 2 correctly flags intentionally wrong complex calculations (5 cases)
- Zero latency impact on non-calculation queries
- Never blocks the pipeline (fail-safe: skip verification on error)
- Tier 2 can be independently disabled via `math_verification_tier2_enabled`

---

### Phase 6D: Pipeline Observability & Resilience (Revised — Orchestrator Corrected)

**Goal:** Add structured telemetry, circuit breakers, and monitoring to the RAG pipeline. No Redis/Celery — use GCP-native tools.

**Why the original Phase 9 (LangGraph) is wrong:**
The first audit is correct (V9-1 through V9-3). Current traffic doesn't justify the complexity. But the NEED for observability is real — the pipeline has 6+ async steps, any of which can silently fail.

> [!IMPORTANT]
> **Orchestrator Correction:** Circuit breaker needs precise degradation spec. What trips? What degrades? What NEVER stops?

**Approach:**

1. **OpenTelemetry integration:** Add spans for each pipeline step (decomposition, search, audit, compression, generation, critic, follow-ups)
2. **Circuit breaker with tiered degradation** (see spec below)
3. **Latency histogram:** Log per-step latency in structured format (already partially done via structlog, but not aggregated)
4. **GCP Cloud Trace:** Export OTel spans to Cloud Trace (free tier: 2.5M spans/month)
5. **Health check endpoint:** Add `/health/ready` that pings MongoDB + Gemini API

#### Circuit Breaker Degradation Spec

Pipeline steps are classified into three tiers:

| Tier | Steps | Behavior on Trip | Rationale |
|---|---|---|---|
| 🔴 **MANDATORY** (never skip) | Hybrid Search, LLM Generation, pack_context | **Pipeline fails with error** if these fail | Without search or generation, there is no answer |
| 🟡 **DEGRADABLE** (skip on trip) | Context Compression, Critic, Follow-up Generator, Reranker (6A), Math Verifier (6C) | **Skip silently + log warning** | Answer quality degrades but user still gets a response |
| 🟢 **OPTIONAL** (always fail-safe) | Query Decomposition, Context Audit, Cross-ref Enrichment | **Already fail-safe** (return defaults on error) | These already have graceful fallbacks |

**Circuit breaker state machine:**

```
CLOSED (normal) ──[5 consecutive Gemini failures]──► HALF-OPEN
    │                                                    │
    │                                              [next request]
    │                                                    │
    │                                           ┌────────┴────────┐
    │                                       success           failure
    │                                           │                │
    │                                      ► CLOSED         ► OPEN
    │                                                           │
    │                                                    [5 min timer]
    │                                                           │
    └───────────────────────────────────────────────── HALF-OPEN ◄┘
```

**OPEN state behavior:**
- 🔴 MANDATORY steps: Execute normally (always attempted)
- 🟡 DEGRADABLE steps: **Skipped entirely** — no API call made
- 🟢 OPTIONAL steps: Execute normally (they're already fail-safe)
- Log: `structlog.warning("circuit_breaker_open", skipped_steps=[...])`
- OTel span: Mark skipped steps with `status=SKIPPED_CIRCUIT_OPEN`

**HALF-OPEN state behavior:**
- Allow ONE degradable step through as a probe
- If probe succeeds → CLOSED (all steps resume)
- If probe fails → OPEN (stay degraded for another 5 min)

**What triggers the counter:**
- Only Gemini API `5xx` errors and `TimeoutError` increment the failure counter
- `4xx` errors (invalid input, safety blocks) do NOT count — they are client errors, not service failures
- Each pipeline step has its own counter (compression failures don't affect generation)

**Files to Change:**

| File | Change |
|---|---|
| `requirements.txt` | Add `opentelemetry-api`, `opentelemetry-sdk`, `opentelemetry-exporter-gcp-trace` |
| New: `app/utils/telemetry.py` | OTel setup + `CircuitBreaker` class with CLOSED/HALF-OPEN/OPEN states |
| New: `app/utils/circuit_breaker.py` | Standalone circuit breaker (can be tested independently from OTel) |
| `rag_pipeline.py` | Wrap each step in OTel spans + circuit breaker guards on DEGRADABLE steps |
| `main.py` | Initialize OTel exporter on startup |
| `config.py` | Add `telemetry_enabled: bool = False`, `circuit_breaker_threshold: int = 5`, `circuit_breaker_reset_seconds: int = 300` |

**Latency estimate:** Near-zero (OTel spans are async, non-blocking). Circuit breaker check is O(1) in-memory.
**Cost estimate:** $0 (GCP Cloud Trace free tier)

**Risks:**
- OTel SDK adds ~3 dependencies. Lower risk than LangGraph's volatile ecosystem.
- Per-step circuit breakers add memory overhead (~50 bytes per breaker × 7 steps = negligible)
- HALF-OPEN probe may succeed on a flaky step, causing premature CLOSED → flap. Mitigated by requiring 2 consecutive probe successes before CLOSED.

**Acceptance Criteria:**
- Each pipeline step emits an OTel span with duration + status
- Circuit breaker trips after 5 consecutive Gemini 5xx/timeout failures per step
- DEGRADABLE steps are skipped when circuit is OPEN — user still gets an answer
- MANDATORY steps NEVER skip — pipeline returns error if generation fails
- Auto-reset to HALF-OPEN after 5 minutes, require 2 probe successes to CLOSED
- Cloud Trace dashboard shows E2E pipeline waterfall
- Zero latency regression from instrumentation

---

## Phase Ordering & Dependencies

```
Phase 0 (Tech Debt)     ← DO FIRST, blocks everything
    ↓
Phase 6A (Reranking)    ← Independent, can start immediately after Phase 0
Phase 6B (Cross-refs)   ← Independent, can start immediately after Phase 0
Phase 6D (Observability) ← Independent, can start immediately after Phase 0
    ↓
Phase 6C (Math Verify)  ← Depends on 6D (needs telemetry to measure impact)
```

**Phases 6A, 6B, and 6D can be developed in parallel** — they touch different files and have no code dependencies. Phase 6C should come last because it benefits from the telemetry infrastructure of 6D.

---

## Cost Summary

| Phase | New Infra Cost | Per-Query Cost Δ | New Dependencies |
|---|---|---|---|
| Phase 0 | $0 | -$0.002 (cheaper critic) | 0 |
| Phase 6A | $0 | +$0.001 (flash reranker call) | 0 |
| Phase 6B | $0 | $0 (MongoDB-native) | 0 |
| Phase 6C | $0 | +$0.001 (flash verifier, red_zone only) | 0 |
| Phase 6D | $0 | $0 (free tier tracing) | 3 (opentelemetry) |
| **Total** | **$0/month new infra** | **~$0.002/query increase** | **3 new packages** |

Compare to original Phase 6-9:
- Neo4j AuraDB: $65/month
- Redis: $15-30/month
- Cohere API: usage-based
- LangGraph + LangSmith: usage-based + volatile deps

---

## Open Questions for Orchestrator

### Q1: What is the actual deployed generation model?
`config.py` defaults to `gemini-3-flash-preview`, but the first audit claims `gemini-3-pro-preview` with 50s latency. **Which model is in the Cloud Run environment variable `GEMINI_GENERATION_MODEL`?** This fundamentally changes the latency baseline and optimization priorities.

### Q2: Should the streaming path get a post-stream critic?
Currently `answer_question_stream()` has ZERO quality control after generation. For a tax law system, this is risky. Options:
- (a) Add a post-stream async critic that emits a "correction needed" event
- (b) Accept the risk (streaming is for UX, not accuracy)
- (c) Enable critic on the non-streaming path only and use that for high-stakes queries

### Q3: Should `graph_expansion_enabled` be turned on now?
The cross-ref code exists and works, it's just gated off. Before building Phase 6B enhancements, should we enable the existing system and measure its impact?

### Q4: How many chunked articles exist in production?
GAP-A4 (broken `find_by_number()` for multi-chunk articles) severity depends on how many articles are actually chunked. If most articles fit in one chunk, this is low-priority. If many are chunked, it's critical.

### Q5: Is there a benchmark query set?
Phases 6A and 6B need a way to measure "better relevance." Is there an existing set of benchmark queries with expected articles, or should we create one?

### Q6: What is the appetite for enabling disabled features?
Several features are coded but disabled: `router_enabled`, `critic_enabled`, `logic_rules_enabled`, `graph_expansion_enabled`. Should Phase 0 include enabling and evaluating these, or are they disabled for known reasons?

---

## Summary Matrix: Original vs Audit vs This Plan

| Phase | Original | First Audit | This Plan |
|---|---|---|---|
| Reranking | bge-reranker (GPU, 8-15s) | Gemini-native or Cohere | Gemini Flash judge (1-2s, proven Georgian) |
| Knowledge Graph | Neo4j ($65/mo) | MongoDB $lookup | MongoDB $graphLookup (2-hop, $0) |
| Math Verification | Z3 sandbox (RCE risk) | "Post-processing" (vague) | **Two-tier: regex+ast deterministic → Flash fallback** |
| Orchestration | LangGraph + Redis + Celery | asyncio + OpenTelemetry | **OTel + 3-tier circuit breakers (MANDATORY/DEGRADABLE/OPTIONAL)** |
| Tech Debt | Not addressed | Not addressed | **Phase 0: 6 critical fixes** |
| New Infra Cost | $80-95/month | $0 | $0 |
| New Dependencies | 5+ (Neo4j, Redis, Celery, LangGraph, Z3) | 0-1 | 3 (OpenTelemetry only) |
