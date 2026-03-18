---
name: code-generation
description: >
  Smart code scaffolding, boilerplate generation, and project structure
  patterns. Covers CRUD endpoints, data models, component templates, and
  configuration files. Use when bootstrapping new features, modules, or
  entire project structures.
---

# Code Generation

Generate production-ready code scaffolding, boilerplate, and project
structures following established patterns.

## Use this skill when

- Bootstrapping a new project or module
- Generating CRUD endpoints or data models
- Creating component templates (React, FastAPI, etc.)
- Scaffolding configuration files (Docker, CI, etc.)
- Setting up common patterns (auth, logging, error handling)

## Do not use this skill when

- Refactoring existing code — use `refactoring`
- Writing tests — use `testing-qa`
- Designing architecture — use `architect-review`

## Instructions

### 1. Scaffolding Principles

- Follow existing project conventions (detect from codebase)
- Include type hints (Python) or TypeScript types
- Add error handling from the start
- Include minimal but useful docstrings
- Use environment variables for configuration

### 2. Python/FastAPI Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/items", tags=["Items"])

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)

class ItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price: float

@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate, db=Depends(get_db)):
    """Create a new item."""
    result = await db.items.insert_one(item.model_dump())
    return ItemResponse(id=str(result.inserted_id), **item.model_dump())

@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str, db=Depends(get_db)):
    """Get item by ID."""
    item = await db.items.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemResponse(id=str(item["_id"]), **item)
```

### 3. React Component Template

```tsx
import { useState, useEffect } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  title: string;
  onAction?: () => void;
}

export function ComponentName({ title, onAction }: ComponentNameProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setup logic
    return () => { /* cleanup */ };
  }, []);

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
}
```

### 4. Data Model (Pydantic)

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class ModelBase(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
```

### 5. Project Structure (Python Backend)

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app + startup
│   ├── config.py             # Settings from env
│   ├── dependencies.py       # Shared dependencies
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── items.py
│   │   └── users.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── item_service.py
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
├── tests/
│   ├── conftest.py
│   ├── test_items.py
│   └── test_users.py
├── pyproject.toml
├── Dockerfile
└── .env.example
```

## Workflow Integration

**Invoked by:**
- `/claude-building` — when scaffolding new features
- `/scaffold` — primary code scaffolding workflow

**After using this skill:** Route to implementation in `/claude-building`.

**Related skills:** `api-design-principles`, `testing-qa`, `documentation-generator`
