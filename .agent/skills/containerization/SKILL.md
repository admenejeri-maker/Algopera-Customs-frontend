---
name: containerization
description: >
  Docker and Kubernetes best practices including Dockerfile optimization,
  multi-stage builds, Docker Compose, and K8s manifest patterns. Use when
  containerizing applications, optimizing images, or orchestrating services.
---

# Containerization

Build efficient, secure container images and orchestrate services with
Docker and Kubernetes.

## Use this skill when

- Writing or optimizing Dockerfiles
- Setting up Docker Compose for local development
- Creating Kubernetes manifests (deployments, services, ingress)
- Debugging container build or runtime issues
- Reducing image sizes

## Do not use this skill when

- Managing cloud infrastructure — use `infrastructure-as-code`
- Setting up CI/CD — use `ci-cd-pipelines`
- Designing deployment strategies — use `deployment-strategies`

## Instructions

### 1. Dockerfile Best Practices

```dockerfile
# Multi-stage build for Python
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .

# Non-root user
RUN adduser --disabled-password --no-create-home appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Image Optimization

| Technique | Savings | How |
|-----------|---------|-----|
| Multi-stage builds | 50-90% | Separate build and runtime |
| Slim/alpine base | 30-70% | `python:3.12-slim` vs `python:3.12` |
| `.dockerignore` | Variable | Exclude `.git`, `node_modules`, `__pycache__` |
| Layer caching | Build time | Copy requirements before code |
| No cache pip/npm | 10-30% | `--no-cache-dir` |

### 3. Docker Compose

```yaml
version: '3.9'
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - MONGO_URI=mongodb://mongo:27017/mydb
    depends_on:
      mongo:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports: ["3000:3000"]

  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  mongo_data:
```

### 4. Security

- Always use non-root users
- Scan images: `docker scout cves <image>`
- Pin base image versions (not `latest`)
- Don't copy secrets into images (use runtime env vars)

## Workflow Integration

**Invoked by:**
- `/claude-building` — when containerizing services
- `/ops-check` — when auditing container security

**After using this skill:** Test with `docker build` + `docker run` via `verification-before-completion`.

**Related skills:** `ci-cd-pipelines`, `deployment-strategies`, `infrastructure-as-code`
