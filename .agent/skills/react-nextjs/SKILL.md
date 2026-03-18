---
name: react-nextjs
description: >
  React patterns, Next.js App Router, SSR/SSG, hooks, state management,
  and component design. Use when building or debugging React/Next.js
  applications.
---

# React & Next.js

Modern React patterns and Next.js App Router best practices for building
performant, scalable frontend applications.

## Use this skill when

- Building React components or pages
- Setting up Next.js App Router
- Implementing client/server components
- Managing state (Context, Zustand, etc.)
- Debugging React rendering issues
- Implementing SSR/SSG/ISR strategies

## Do not use this skill when

- Designing visual aesthetics — use `ui-ux-design-guidelines`
- Writing backend APIs — use `api-design-principles`
- Writing tests for components — use `testing-qa`

## Instructions

### 1. Component Patterns

**Functional Component (Standard):**
```tsx
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div className="user-card" onClick={() => onSelect?.(user.id)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

**Custom Hook:**
```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

### 2. Next.js App Router

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page
├── loading.tsx         # Loading UI
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
├── api/
│   └── route.ts        # API route
└── dashboard/
    ├── layout.tsx       # Nested layout
    └── page.tsx         # Dashboard page
```

### 3. Server vs Client Components

```tsx
// Server Component (default) — no "use client"
async function UserList() {
  const users = await db.users.findMany(); // Direct DB access
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// Client Component — needs interactivity
"use client";
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 4. State Management Decision Tree

```
Local UI state → useState
Form state → React Hook Form or useActionState
Shared client state → Zustand or Context
Server state → React Query / SWR / Server Components
URL state → useSearchParams
```

### 5. Performance Patterns

- `React.memo()` — prevent re-renders of pure components
- `useMemo` / `useCallback` — memoize expensive computations
- `Suspense` + `lazy()` — code splitting
- Image optimization with `next/image`
- Dynamic imports for heavy components

### 6. Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Infinite re-render | Missing deps in useEffect | Add all deps, use useCallback |
| Hydration mismatch | Server/client render differs | Check for `typeof window` |
| Stale closure | Outdated values in callbacks | Use refs or functional updates |
| Over-fetching | Client-side data fetching | Move to Server Components |

## Workflow Integration

**Invoked by:**
- `/claude-building` — when building React/Next.js features
- `/ui-ux-pro-max` — when implementing UI designs

**After using this skill:** Route to `testing-qa` for component tests.

**Related skills:** `ui-ux-design-guidelines`, `typescript-advanced`, `testing-qa`
