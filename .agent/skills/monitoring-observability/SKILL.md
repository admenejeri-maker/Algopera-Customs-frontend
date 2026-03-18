---
name: monitoring-observability
description: >
  Logging, tracing, metrics collection and alerting using Prometheus,
  Grafana, Datadog, and structured logging. Use when setting up monitoring,
  debugging production issues, or improving observability.
---

# Monitoring & Observability

Implement the three pillars of observability — logs, metrics, and traces —
to understand what your system is doing in production.

## Use this skill when

- Setting up application monitoring
- Implementing structured logging
- Creating dashboards and alerts
- Debugging production incidents via telemetry
- Adding distributed tracing

## Do not use this skill when

- Debugging code logic — use `debugging-patterns`
- Setting up CI/CD — use `ci-cd-pipelines`
- Designing infrastructure — use `infrastructure-as-code`

## Instructions

### 1. Three Pillars

| Pillar | What | Tools |
|--------|------|-------|
| **Logs** | Discrete events with context | Structured logging, Cloud Logging |
| **Metrics** | Numeric measurements over time | Prometheus, Grafana, Datadog |
| **Traces** | Request flow across services | OpenTelemetry, Jaeger |

### 2. Structured Logging (Python)

```python
import structlog

logger = structlog.get_logger()

# Structured context
logger.info("request_processed",
    user_id="user-123",
    endpoint="/ask",
    duration_ms=145,
    status=200
)

# Error with context
logger.error("database_connection_failed",
    host="mongo-prod",
    retry_count=3,
    error=str(e)
)
```

### 3. Key Metrics to Track

| Metric | Type | Why |
|--------|------|-----|
| Request rate | Counter | Traffic volume |
| Error rate | Counter | System health |
| Latency (p50/p95/p99) | Histogram | Performance |
| Active connections | Gauge | Resource usage |
| Queue depth | Gauge | Backpressure |

### 4. Alerting Strategy

- **Critical (page):** Service down, error rate >5%, latency p99 >5s
- **Warning (ticket):** Error rate >1%, disk >80%, memory >90%
- **Info (log):** Deployment events, config changes

### 5. Health Checks

```python
@app.get("/health")
async def health():
    checks = {
        "database": await check_db(),
        "cache": await check_redis(),
    }
    healthy = all(checks.values())
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "healthy" if healthy else "unhealthy", "checks": checks}
    )
```

## Workflow Integration

**Invoked by:**
- `/ops-check` — monitoring and health verification
- `/debug` — when investigating production incidents

**After using this skill:** Verify dashboards and alerts are working.

**Related skills:** `deployment-strategies`, `performance-optimization`
