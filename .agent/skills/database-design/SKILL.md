---
name: database-design
description: >
  Database schema design, query optimization, migrations, and indexing
  strategies for SQL and NoSQL databases. Use when designing data models,
  optimizing queries, planning migrations, or choosing database technologies.
---

# Database Design

Design efficient, scalable database schemas and optimize query performance
across SQL and NoSQL databases.

## Use this skill when

- Designing new database schemas or collections
- Optimizing slow queries
- Planning database migrations
- Choosing between SQL and NoSQL
- Setting up indexes for performance
- Designing data models for MongoDB, PostgreSQL, etc.

## Do not use this skill when

- Building API endpoints — use `api-design-principles`
- Reviewing system architecture — use `architect-review`
- Debugging application code — use `debugging-patterns`

## Instructions

### 1. Schema Design Principles

- **Normalize for writes, denormalize for reads** (SQL)
- **Embed for reads, reference for writes** (MongoDB)
- **Design for your queries** — schema follows access patterns
- **Plan for growth** — partition/shard strategy early

### 2. MongoDB Schema Design

**Embedding (1:few, read-heavy):**
```javascript
// User with embedded addresses
{
  _id: ObjectId("..."),
  name: "John",
  addresses: [
    { type: "home", city: "Tbilisi", zip: "0100" },
    { type: "work", city: "Batumi", zip: "6000" }
  ]
}
```

**Referencing (1:many, write-heavy):**
```javascript
// User
{ _id: ObjectId("user1"), name: "John" }

// Orders (separate collection)
{ _id: ObjectId("order1"), userId: ObjectId("user1"), total: 150.00 }
```

### 3. Indexing Strategy

```javascript
// MongoDB index patterns
db.collection.createIndex({ field: 1 })              // Single field
db.collection.createIndex({ field1: 1, field2: -1 })  // Compound
db.collection.createIndex({ field: "text" })           // Text search
db.collection.createIndex({ location: "2dsphere" })    // Geospatial

// Covered query (index contains all needed fields)
db.users.createIndex({ email: 1, name: 1 })
db.users.find({ email: "x" }, { name: 1, _id: 0 })  // Uses index only
```

**Index Rules:**
- Index fields in WHERE/filter clauses
- Compound index: equality → sort → range (ESR rule)
- Don't over-index (write penalty)
- Monitor with `explain()` and Atlas Performance Advisor

### 4. Query Optimization

```javascript
// SLOW: Full collection scan
db.orders.find({ status: "active" }).sort({ createdAt: -1 })

// FAST: Compound index
db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.find({ status: "active" }).sort({ createdAt: -1 })

// Use explain to verify
db.orders.find({ status: "active" }).explain("executionStats")
// Look for: totalDocsExamined vs nReturned
```

### 5. Migration Strategy

```
1. Write migration script (up + down)
2. Test on staging with production-size data
3. Backup production database
4. Run migration with monitoring
5. Verify data integrity post-migration
6. Keep rollback plan ready
```

### 6. Data Modeling Checklist

- [ ] Access patterns documented
- [ ] Indexes match query patterns
- [ ] Referential integrity enforced (where needed)
- [ ] Timestamps on all documents (`created_at`, `updated_at`)
- [ ] Soft delete vs hard delete decision made
- [ ] Backup and recovery plan defined

## Anti-Patterns

- ❌ Indexing every field (kills write performance)
- ❌ Deeply nested documents (>3 levels)
- ❌ No indexes on frequently queried fields
- ❌ Storing computed values that become stale
- ❌ Using database for caching (use Redis)

## Workflow Integration

**Invoked by:**
- `/opus-planning` — during data model design phase
- `/claude-building` — when implementing database operations

**After using this skill:** Route to `/claude-building` for implementation.

**Related skills:** `architect-review`, `performance-optimization`
