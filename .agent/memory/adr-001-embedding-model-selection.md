# ADR-001: Retain gemini-embedding-001 for Vector Search

**Date:** 2026-03-12
**Status:** Accepted
**Deciders:** User (Orchestrator) + Worker Agent

## Context

Evaluated whether to migrate embedding model from `gemini-embedding-001` (3072-dim) to `voyage-4-large` (1024-dim) for Georgian tax code vector search. Voyage API was already integrated for reranking — the question was whether Voyage embeddings would also outperform Gemini.

## Decision

**Retained `gemini-embedding-001` for vector search. Rejected `voyage-4-large` for embeddings.**

Voyage API is kept exclusively for the Reranking layer.

## Evidence

### Phase 1 (10 queries, 48 articles)
| Model | P@1 | MRR | Avg Latency |
|-------|-----|-----|-------------|
| Gemini | 7/10 | 0.8200 | 893 ms |
| Voyage | 6/10 | 0.7500 | 302 ms |

### Phase 2 (50 queries, 132 articles)
| Model | P@1 | P@5 | MRR | Avg Latency |
|-------|-----|-----|-----|-------------|
| **Gemini** | **15/50** | **28/50** | **0.4231** | 362 ms |
| Voyage | 14/50 | 22/50 | 0.3705 | 305 ms |

**MRR diff = +5.26% absolute (+14% relative)** in Gemini's favor.

### By Query Source (Phase 2)
- **Real user queries:** Gemini MRR 0.40 vs Voyage 0.34 → Gemini wins
- **LLM-generated:** Gemini 0.46 vs Voyage 0.35 → Gemini wins decisively
- **Edge cases:** Voyage 0.48 vs Gemini 0.38 → Voyage wins (transliteration, tricks)

## Rationale

1. Gemini wins on the metrics that matter most (real user + structured queries)
2. Latency gap narrowed from 3x (Phase 1) to 1.2x (Phase 2) — negligible in production where LLM inference dominates
3. Migration cost (reindexing 400+ articles, dimension change 3072→1024, updating Atlas vector indexes) is not justified by marginal or negative gains
4. Voyage's edge case advantage (transliteration) can be addressed via query preprocessing, not model swap

## Consequences

- `gemini-embedding-001` remains the production embedding model
- Voyage API key is retained for `rerank-2` reranking only
- No vector index migration needed
- Future re-evaluation if Voyage releases Georgian-specific fine-tuned model
