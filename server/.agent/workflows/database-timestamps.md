---
description: Using IST timestamps in database operations
---

# Database Timestamp Guidelines

When writing SQL queries that insert or update timestamps, **NEVER use `NOW()`**. Instead, use the `getISTTimestamp()` helper function.

## Why?
- The MySQL server on Hostinger is configured for UTC timezone
- We don't have SUPER privileges to change the global timezone
- `getISTTimestamp()` generates correct IST timestamps from JavaScript

## How to Use

### 1. Import the helper
```typescript
import db, { getISTTimestamp } from '../config/database.js';
// OR if only importing the helper:
import { getISTTimestamp } from '../config/database.js';
```

### 2. Use in INSERT statements
```typescript
// ❌ WRONG - will insert UTC time
await db.execute(
  'INSERT INTO table (created_at) VALUES (NOW())',
  []
);

// ✅ CORRECT - will insert IST time
await db.execute(
  'INSERT INTO table (created_at) VALUES (?)',
  [getISTTimestamp()]
);
```

### 3. Use in UPDATE statements
```typescript
// ❌ WRONG
await db.execute(
  'UPDATE table SET updated_at = NOW() WHERE id = ?',
  [id]
);

// ✅ CORRECT
await db.execute(
  'UPDATE table SET updated_at = ? WHERE id = ?',
  [getISTTimestamp(), id]
);
```

## WHERE Clauses - Safe to use NOW()
WHERE clauses comparing against stored timestamps can still use `NOW()` because the session timezone is set to +05:30 on connection:

```typescript
// ✅ This is OK - session timezone handles conversion
await db.execute(
  'SELECT * FROM tokens WHERE expires_at > NOW()',
  []
);
```

## Available Helpers
| Function | Returns | Example Output |
|----------|---------|----------------|
| `getISTTimestamp()` | MySQL datetime string | `'2026-01-22 09:45:00'` |
| `getISTDate()` | MySQL date string | `'2026-01-22'` |
