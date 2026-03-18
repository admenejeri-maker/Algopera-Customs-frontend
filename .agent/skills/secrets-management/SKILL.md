---
name: secrets-management
description: >
  Environment variables, vault integration, credential rotation, and
  secure secret handling. Use when managing API keys, database credentials,
  or any sensitive configuration.
---

# Secrets Management

Securely store, access, and rotate secrets across development and production
environments.

## Use this skill when

- Setting up `.env` files and environment variables
- Configuring secret stores (GCP Secret Manager, Vault)
- Rotating API keys or database credentials
- Auditing secret exposure in code or logs
- Implementing secure secret access patterns

## Do not use this skill when

- Implementing auth flows — use `auth-implementation-patterns`
- Scanning for vulnerabilities — use `security-scanning`
- Reviewing API security — use `api-security-best-practices`

## Instructions

### 1. Secret Handling Rules

```
NEVER: Hardcode secrets in code
NEVER: Commit secrets to Git
NEVER: Log secret values
NEVER: Pass secrets as CLI arguments (visible in ps)
ALWAYS: Use environment variables or secret managers
ALWAYS: Use .env.example (not .env) in Git
```

### 2. Environment Variable Pattern

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str
    api_key: str
    jwt_secret: str
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### 3. GCP Secret Manager

```python
from google.cloud import secretmanager

def get_secret(secret_id: str, project_id: str) -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(name=name)
    return response.payload.data.decode("utf-8")
```

### 4. `.gitignore` Essentials

```
.env
.env.local
.env.production
*.pem
*.key
credentials.json
service-account.json
```

### 5. Secret Rotation Checklist

- [ ] Generate new credential
- [ ] Update secret store
- [ ] Deploy with new credential
- [ ] Verify application works
- [ ] Revoke old credential
- [ ] Update documentation

## Workflow Integration

**Invoked by:**
- `/ops-check` — secrets audit
- `/claude-building` — when configuring secrets in code

**After using this skill:** Verify no secrets in code with `security-scanning`.

**Related skills:** `security-scanning`, `api-security-best-practices`
