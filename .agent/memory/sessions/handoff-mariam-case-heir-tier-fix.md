# Handoff: Mariam Case — Heir Tier Fix (P0)

## Session: 2026-02-25

## Status: Move 5 — Debugging & Refinement

### What Was Done (Moves 1-4 Complete)

**Commit:** `53e33c0` on `main` → [admenejeri-maker/tax-agent-backend-1](https://github.com/admenejeri-maker/tax-agent-backend-1)

**Files modified/created:**
1. `config.py` — Added `sale_intent_keywords`, `vehicle_type_keywords`, `property_type_keywords`
2. `app/services/statute_injector.py` — **NEW** dual-signal mandatory statute injector
3. `app/services/tax_system_prompt.py` — Rate table injection for red zone
4. `app/services/rag_pipeline.py` — Injector wiring + 5-point disclaimer guards
5. `tests/test_statute_injector.py` — 24/24 tests passing
6. `scripts/test_mariam_trace.py` — Updated with injector stage + disclaimer counter

**Tests:** 24/24 injector tests ✅, 232/232 regression ✅

---

## Remaining Bug: LLM Heir Tier Misclassification

### Problem
Mariam's Case live trace (via SSE `/api/ask/stream`) returned **200 ლარი** instead of expected **6,200 ლარი**.

| Income | Expected | Actual |
|--------|----------|--------|
| ხელფასი 5,500 | 0 (6K exempt) | ✅ 0 |
| ავტომობილი 4,000 profit | 200 (5%) | ✅ 200 |
| ჩუქება 180K პაპისგან | 6,000 (III რიგი) | ❌ 0 (LLM said II რიგი) |
| **ჯამი** | **6,200** | **❌ 200** |

### Root Cause
**LLM incorrectly classified grandfather (პაპა, მამის მამა) as II რიგის მემკვიდრე (fully exempt) instead of III რიგი.**

Georgian Tax Code heir tiers:
- **I რიგი:** მეუღლე, შვილი, მშობელი → fully exempt
- **II რიგი:** და/ძმა → fully exempt  
- **III რიგი:** ბაბუა/ბებია (პაპაჩემი = III!) → 150,000 exempt, excess taxed at 20%
- **Others:** 1,000 ლარამდე exempt

Correct calculation: 180,000 - 150,000 = 30,000 × 20% = **6,000 ლარი**

### Why It Happened
The trace clearly showed: **"Article 168 NOT in final context"** — Art 168 defines the heir tiers and exemption thresholds. Without it, the LLM relies on training data and gets it wrong.

### Pipeline Verification (All Working)
- Art 81 ✅ (5% rate passage found)
- Art 82 ✅ (8 chunks, მარტოხელა, მაღალმთიან, 3,000)
- `is_red_zone: True` ✅
- Disclaimer: **1 occurrence** ✅ (P3 idempotency fix works)
- Statute injector: runs correctly after gap_fill ✅

---

## Proposed Fix: Art 168 Heir Tier Injection

### Approach A: Extend Statute Injector (Recommended)

Add a **Channel C** to `statute_injector.py` that triggers on gift/inheritance keywords:

**Trigger condition:** Query contains gift/inheritance keywords (AND-logic):
- Gift keywords: `["ჩუქ", "საჩუქ", "გადმომცა", "გადმოეცა"]`
- Inheritance keywords: `["მემკვიდრ", "მემკვიდრეობ"]`
- Family keywords: `["პაპა", "ბაბუა", "ბებია", "ძმა", "და"]`

**Action when triggered:** Inject Art 168 chunk that contains the tier definitions.

### Approach B: Prompt Injection (Complementary)

Similar to the rate table already injected in `tax_system_prompt.py`, add an **Heir Tier Table** to the system prompt when `is_red_zone=True` AND gift/inheritance is detected:

```
## მემკვიდრეობის/ჩუქების რიგები (მუხ. 168):
| რიგი | ვინ | შეღავათი |
|------|-----|---------|
| I | მეუღლე, შვილი, მშობელი | სრულად თავისუფალი |
| II | და, ძმა | სრულად თავისუფალი |
| III | ბაბუა/ბებია, შვილიშვილი | 150,000 ლარამდე თავისუფალი |
| სხვა | ნებისმიერი | 1,000 ლარამდე თავისუფალი |

⚠️ პაპა/პაპაჩემი/ბაბუა = III რიგი, არა II!
```

### Recommended Implementation Order
1. **Approach B first** — system prompt table is fastest and most reliable
2. **Then Approach A** — ensure Art 168 chunks are in context for citation

---

## Files to Modify

| File | Change |
|------|--------|
| `config.py` | Add `gift_intent_keywords`, `family_tier_keywords` |
| `statute_injector.py` | Add Channel C for Art 168 detection |
| `tax_system_prompt.py` | Add heir tier table next to rate table |
| `tests/test_statute_injector.py` | Add gift/inheritance trigger tests |

## Verification

1. Re-run `python3 scripts/test_mariam_trace.py` — must show **6,200 ლარი**
2. Check that `Art 168` appears in final context
3. Disclaimer count must remain **1**
4. All existing 24 injector tests must still pass

## Backend Server
- Running on: `http://localhost:8000` (PID active)
- MongoDB: Connected via Atlas (`0.0.0.0/0` access enabled)
- Model: `gemini-3.1-pro-preview-customtools` with thinking enabled

## Key File Locations
- `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/config.py`
- `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/statute_injector.py`
- `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/tax_system_prompt.py`
- `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/app/services/rag_pipeline.py`
- `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/tests/test_statute_injector.py`
- `/Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent/scripts/test_mariam_trace.py`
