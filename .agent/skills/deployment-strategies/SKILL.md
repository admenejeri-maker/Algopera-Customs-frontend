---
name: deployment-strategies
description: >
  Blue/green, canary, rolling deployments, and rollback procedures. Use
  when planning deployment strategies, managing releases, or implementing
  zero-downtime deployments.
---

# Deployment Strategies

Deploy applications safely with zero-downtime strategies and reliable
rollback procedures.

## Use this skill when

- Planning deployment strategy for production
- Implementing zero-downtime deployments
- Setting up rollback procedures
- Choosing between deployment patterns
- Managing Cloud Run traffic splitting

## Do not use this skill when

- Writing Dockerfiles — use `containerization`
- Setting up CI/CD — use `ci-cd-pipelines`
- Managing infrastructure — use `infrastructure-as-code`

## Instructions

### 1. Deployment Patterns

| Pattern | Risk | Speed | Best For |
|---------|------|-------|----------|
| **Rolling** | Low | Moderate | Default for most apps |
| **Blue/Green** | Very Low | Fast | Instant rollback needed |
| **Canary** | Very Low | Slow | Critical services |
| **Recreate** | High | Fast | Dev/staging only |

### 2. Cloud Run Traffic Splitting (Canary)

```bash
# Deploy new revision (no traffic yet)
gcloud run deploy my-service --source . --no-traffic

# Send 10% to new revision
gcloud run services update-traffic my-service \
  --to-revisions=my-service-00002=10

# Verify metrics, then promote to 100%
gcloud run services update-traffic my-service \
  --to-revisions=my-service-00002=100

# Rollback if issues
gcloud run services update-traffic my-service \
  --to-revisions=my-service-00001=100
```

### 3. Rollback Checklist

```
1. Identify the issue (metrics, logs, alerts)
2. Route traffic to previous revision
3. Verify rollback success
4. Investigate root cause
5. Fix and redeploy through normal process
```

### 4. Pre-deployment Checklist

- [ ] All tests passing in CI
- [ ] Database migrations applied (backward compatible)
- [ ] Feature flags configured
- [ ] Monitoring/alerts in place
- [ ] Rollback plan documented
- [ ] Team notified

### 5. Zero-Downtime Requirements

- Database migrations must be backward-compatible
- Health checks must be configured
- Graceful shutdown with connection draining
- No breaking API changes without versioning

## Workflow Integration

**Invoked by:**
- `/ops-check` — deployment readiness verification
- `/claude-building` — when implementing deployment logic

**After using this skill:** Verify deployment with `verification-before-completion`.

**Related skills:** `ci-cd-pipelines`, `containerization`, `monitoring-observability`
