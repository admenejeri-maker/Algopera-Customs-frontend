---
name: performance-optimization
description: >
  Profiling, caching strategies, lazy loading, bundle analysis, and
  database query optimization. Use when improving application speed,
  reducing latency, or optimizing resource usage.
---

# Performance Optimization

Identify and eliminate performance bottlenecks across frontend, backend,
and database layers.

## Use this skill when

- Application response time is too slow
- Bundle size needs reduction
- Database queries are inefficient
- Memory usage is excessive
- API latency needs improvement
- Page load time needs optimization

## Do not use this skill when

- Designing database schemas — use `database-design`
- Reviewing architecture — use `architect-review`
- Premature optimization (measure first!)

## Instructions

### 1. The Performance Protocol

```
1. MEASURE — Profile before optimizing (never guess)
2. IDENTIFY — Find the actual bottleneck
3. OPTIMIZE — Fix the biggest bottleneck first
4. VERIFY — Measure again to confirm improvement
5. REPEAT — Next biggest bottleneck
```

### 2. Backend Optimization

**Caching:**
```python
from functools import lru_cache
from redis import Redis

# In-memory cache (single process)
@lru_cache(maxsize=256)
def get_tax_rate(category: str) -> float:
    return db.tax_rates.find_one({"category": category})["rate"]

# Distributed cache (multi-process)
redis = Redis()
def get_cached(key: str, ttl: int = 3600):
    cached = redis.get(key)
    if cached:
        return json.loads(cached)
    result = expensive_computation()
    redis.setex(key, ttl, json.dumps(result))
    return result
```

**Async I/O:**
```python
# SLOW: Sequential
for url in urls:
    result = await fetch(url)  # one at a time

# FAST: Concurrent
results = await asyncio.gather(*[fetch(url) for url in urls])
```

**Database:**
```python
# SLOW: N+1 query
users = db.users.find()
for user in users:
    orders = db.orders.find({"user_id": user["_id"]})  # N queries

# FAST: Aggregation pipeline
pipeline = [
    {"$lookup": {
        "from": "orders",
        "localField": "_id",
        "foreignField": "user_id",
        "as": "orders"
    }}
]
results = db.users.aggregate(pipeline)  # 1 query
```

### 3. Frontend Optimization

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| Code splitting | High | Dynamic `import()`, React.lazy |
| Image optimization | High | WebP, srcset, lazy loading |
| Bundle analysis | Medium | `webpack-bundle-analyzer` |
| Tree shaking | Medium | ES modules, sideEffects: false |
| Debounce/throttle | Medium | Search inputs, scroll handlers |
| Memoization | Low-Med | `useMemo`, `React.memo` |

### 4. Profiling Tools

| Layer | Tool |
|-------|------|
| Python | cProfile, py-spy, line_profiler |
| Node.js | `--prof`, clinic.js, 0x |
| Frontend | Chrome DevTools Performance |
| Database | `explain()`, Atlas Profiler |
| Network | Network tab, Lighthouse |

### 5. Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| API response (p95) | < 500ms |
| Database query | < 100ms |
| Bundle size (JS) | < 200KB gzipped |

## Anti-Patterns

- ❌ Optimizing without measuring first
- ❌ Premature optimization of non-bottleneck code
- ❌ Caching everything (stale data risk)
- ❌ Over-indexing database (write penalty)

## Workflow Integration

**Invoked by:**
- `/claude-building` — when performance issues arise
- `/ops-check` — during performance audits

**After using this skill:** Measure improvement with `verification-before-completion`.

**Related skills:** `database-design`, `architect-review`
