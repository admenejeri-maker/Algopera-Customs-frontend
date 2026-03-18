# ADR-002: Retain Gemini LLM Reranker — Reject Voyage rerank-2.5 for Primary Ranking

**Date:** 2026-03-12
**Status:** Accepted
**Deciders:** User (Orchestrator) + Worker Agent
**Supersedes:** N/A (Complements ADR-001)

## Context

After retaining `gemini-embedding-001` for embeddings (ADR-001), we evaluated whether `voyage rerank-2.5` could replace the Gemini LLM-based reranker in the RAG pipeline. Voyage was already running in **shadow mode** — executing in parallel without affecting user responses — to collect comparative data.

## Decision

**Retained Gemini LLM Reranker as primary. Rejected Voyage rerank-2.5 for primary ranking. Shadow mode disabled.**

## Evidence

### Shadow Mode Analysis (53 queries: 50 golden set + 3 organic)

| Metric | Value |
|---|---|
| **Top-1 Match Rate** | 30/53 (56.6%) |
| **Top-3 Match Rate** | 16/53 (30.2%) |
| **Avg Jaccard@5** | 0.8418 |
| **Divergent Queries** | 23/53 (43.4%) |

### Latency Comparison

| | Voyage | Gemini |
|---|---|---|
| Average | 553 ms | ~1800 ms |
| P95 | 1627 ms | ~3300 ms |

### Score Health

- No context loss cases (`voyage_avg_score < 0.2`): 0 occurrences ✅
- Score distribution: 48.7% in 0.5–0.7 range, 19.8% ≥ 0.7

### Critical Divergences (3 clearly wrong rankings by Voyage)

1. **ეკონომიკური საქმიანობა** → Voyage: Art.158 (VAT, ❌), Gemini: Art.9 (Definition, ✅)
2. **ფეისბუქი რეკლამა** → Voyage: InfoHub chunk (❌), Gemini: Art.161 (Reverse charge, ✅)
3. **ოფშორული მომსახურება** → Voyage: Art.18 (❌), Gemini: Art.127 (Transfer pricing, ✅)

## Rationale

1. **43.4% Top-1 divergence** far exceeds the 10% tolerance threshold for safe promotion
2. Voyage lacks understanding of Georgian tax code **article hierarchy** — cannot distinguish definitional articles (Art.9) from application articles (Art.158)
3. Voyage tends to rank InfoHub chunks over authoritative Matsne legal articles
4. While Voyage is 3.3x faster, the reranker latency is not on the critical path (non-blocking shadow/parallel execution)
5. Gemini's LLM-based reranking leverages semantic understanding of legal context that cross-encoder models cannot match for this domain

## Consequences

- Gemini LLM Reranker remains the primary production reranker
- `VOYAGE_SHADOW_ENABLED` set to `false` in `.env` — no more Voyage API token spend
- Shadow mode infrastructure retained (code not removed) for future re-evaluation
- Voyage API key kept for potential future use (fine-tuned models, hybrid approaches)
- Future re-evaluation if: (a) Voyage releases domain-specific fine-tuning, or (b) hybrid pre-filter approach is implemented
