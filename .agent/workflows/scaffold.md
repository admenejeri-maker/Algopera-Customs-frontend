---
description: Production-ready code scaffolding skill
version: 1.0
model_preference: claude-3-5-sonnet-20241022
---

# 🏗️ Antigravity Scaffold Skill

**Purpose**: Generate consistent, production-ready features with automated boilerplate, tests, and types.

## Usage
`@scaffold <type> <name>`

## Types

### 1. Feature (React/Next.js)
**Generates**:
- `components/<Name>/index.tsx`
- `components/<Name>/<Name>.tsx`
- `components/<Name>/<Name>.test.tsx` (Vitest/Jest)
- `components/<Name>/<Name>.module.css` (or styled)

**Template**:
```tsx
import styles from './{{Name}}.module.css';

interface {{Name}}Props {
  // TODO: Define props
}

export const {{Name}} = (props: {{Name}}Props) => {
  return (
    <div className={styles.container}>
      <h1>{{Name}}</h1>
    </div>
  );
};
```

### 2. API Endpoint (Node/Python)
**Generates**:
- Controller
- Service
- DTO/Schema
- Tests

### 3. Hook
**Generates**:
- `hooks/use<Name>.ts`
- `hooks/use<Name>.test.ts`

## Automation
1. **Create Files**: Uses `write_to_file` to generate structure.
2. **Register**: Adds new component to exports.
3. **Test**: Runs the newly created test to ensure it fails (TDD) or passes (Scaffold).
