---
name: debugging-patterns
description: >
  Systematic debugging methodology for root cause analysis. Covers stack trace
  parsing, binary search debugging, logging strategies, common bug patterns,
  and error diagnosis across Python and TypeScript. Use when diagnosing bugs,
  analyzing error logs, or fixing production issues.
---

# Debugging Patterns

Systematic methodology for diagnosing and fixing bugs through root cause
analysis rather than symptom patching.

## Use this skill when

- Diagnosing runtime errors, crashes, or unexpected behavior
- Analyzing stack traces and error logs
- Investigating production incidents
- Debugging intermittent or flaky issues
- Understanding why a fix didn't work

## Do not use this skill when

- Writing new tests — use `testing-qa`
- Reviewing code quality — use `code-review`
- Debugging RAG pipeline specifically — use `rag-pipeline-debug`

## Instructions

### 1. The Debugging Protocol

```
1. REPRODUCE — Can you trigger the bug reliably?
2. ISOLATE   — What is the smallest unit that fails?
3. DIAGNOSE  — What is the ROOT cause (not symptom)?
4. FIX       — Change the minimum code needed
5. VERIFY    — Prove the fix works + no regressions
```

### 2. Reproduction Strategy

| Scenario | Approach |
|----------|----------|
| Always fails | Direct reproduction — run the failing code |
| Intermittent | Add logging, increase attempts, check race conditions |
| Env-specific | Compare env vars, deps, OS, Python/Node version |
| User-reported | Get exact input, reproduce in isolation |

### 3. Stack Trace Analysis

**Python:**
```
Traceback (most recent call last):
  File "app/main.py", line 45, in handle_request    ← entry point
    result = process(data)
  File "app/services/processor.py", line 23, in process  ← closer
    return transform(data["key"])                    ← ROOT CAUSE
KeyError: 'key'                                      ← actual error
```

**Read bottom-up:** The last frame + error message = where to start.

**TypeScript:**
```
TypeError: Cannot read properties of undefined (reading 'map')
    at processItems (src/utils/transform.ts:15:23)   ← ROOT
    at handleRequest (src/api/handler.ts:42:10)
```

### 4. Binary Search Debugging

When the bug location is unknown:
1. Add a checkpoint at the midpoint of the suspect code
2. Is the state correct at the midpoint?
   - Yes → bug is in the second half
   - No → bug is in the first half
3. Repeat until narrowed to a few lines

### 5. Common Bug Patterns

| Pattern | Symptom | Diagnosis |
|---------|---------|-----------|
| Off-by-one | Wrong count, missing item | Check `<` vs `<=`, index bounds |
| Null/undefined | TypeError, AttributeError | Add null checks, trace data flow |
| Race condition | Intermittent failures | Check shared state, add locks |
| Stale closure | Old values in callbacks | Check variable capture in closures |
| Import cycle | ImportError at startup | Reorganize dependencies |
| Env mismatch | Works locally, fails in CI | Compare env vars, versions |
| Silent failure | No error, wrong result | Add assertions, check return values |
| Type coercion | `"5" + 3 = "53"` | Explicit type conversion |

### 6. Logging Strategy

```python
import logging
logger = logging.getLogger(__name__)

# Progressive detail levels:
logger.error("Failed to process request", exc_info=True)  # production
logger.warning("Retrying after timeout: attempt %d", retry)
logger.info("Processing %d items", len(items))
logger.debug("Item detail: %s", item.__dict__)  # dev only
```

### 7. Root Cause vs. Symptom

```
❌ Symptom fix: Add try/except to silence the error
✅ Root cause fix: Ensure data is validated before processing

❌ Symptom fix: Add null check at the crash point
✅ Root cause fix: Fix the upstream function that returns null
```

## Anti-Patterns

- ❌ Shotgun debugging (changing random things hoping it fixes)
- ❌ Print-and-pray (scattered print statements with no strategy)
- ❌ Blaming infrastructure without evidence
- ❌ Fixing symptoms without understanding root cause
- ❌ Skipping reproduction step

## Workflow Integration

**Invoked by:**
- `/debug` — primary diagnostic skill
- `/claude-building` — when implementation hits unexpected errors

**After using this skill:** Once root cause found → `/claude-building` to implement fix → `verification-before-completion` to prove it works.

**Related skills:** `testing-qa`, `rag-pipeline-debug`, `verification-before-completion`
