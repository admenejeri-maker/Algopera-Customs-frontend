---
name: typescript-advanced
description: >
  Advanced TypeScript patterns including generics, utility types, strict mode,
  type guards, declaration merging, and type-safe patterns. Use when writing
  type-safe TypeScript or debugging complex type errors.
---

# Advanced TypeScript

Master TypeScript's advanced type system for safer, more expressive code.

## Use this skill when

- Writing generic functions or types
- Creating utility types
- Debugging complex TypeScript errors
- Implementing type-safe API clients
- Using discriminated unions or branded types
- Configuring strict tsconfig settings

## Do not use this skill when

- Writing basic JavaScript without types
- Building React components (basic) — use `react-nextjs`
- Reviewing code quality — use `code-review`

## Instructions

### 1. Generics

```typescript
// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic interface
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### 2. Utility Types

```typescript
// Built-in utilities
type UserUpdate = Partial<User>;        // All fields optional
type UserRequired = Required<User>;      // All fields required
type UserName = Pick<User, 'name' | 'email'>;  // Subset
type UserWithout = Omit<User, 'password'>;     // Exclude fields
type ReadonlyUser = Readonly<User>;      // Immutable
type UserRecord = Record<string, User>;  // Key-value map

// Custom utility types
type Nullable<T> = T | null;
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
```

### 3. Discriminated Unions

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult(result: Result<User>) {
  if (result.success) {
    console.log(result.data.name);  // TypeScript knows data exists
  } else {
    console.error(result.error);     // TypeScript knows error exists
  }
}
```

### 4. Type Guards

```typescript
// Custom type guard
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'email' in obj
  );
}

// Assertion function
function assertDefined<T>(val: T | null | undefined, msg: string): asserts val is T {
  if (val == null) throw new Error(msg);
}
```

### 5. Branded Types (Nominal Typing)

```typescript
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(id: UserId): User { ... }

// const orderId = createOrderId("abc");
// getUser(orderId); // ❌ Type error! Can't pass OrderId as UserId
```

### 6. Strict Config

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 7. Common Type Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Type 'X' is not assignable to type 'Y'` | Type mismatch | Check types, add assertion or guard |
| `Property does not exist on type` | Missing field | Add optional chaining or extend type |
| `Argument of type 'string' not assignable to parameter of type 'X'` | Literal type expected | Use `as const` or narrow the type |
| `Object is possibly 'null'` | Strict null checks | Add null check or non-null assertion |

## Workflow Integration

**Invoked by:**
- `/claude-building` — when writing TypeScript
- `/debug` — when debugging TypeScript type errors

**After using this skill:** Route to `testing-qa` for type-safe tests.

**Related skills:** `react-nextjs`, `code-review`, `code-generation`
