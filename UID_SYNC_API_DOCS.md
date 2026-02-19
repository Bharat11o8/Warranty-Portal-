# UID Sync API

**Version:** v1  
**Base URL:** `https://server-bharat-maheshwaris-projects.vercel.app/api`

---

## Authentication

All requests require an API key via header:

```
x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW
```

---

## Endpoints

### `POST /uid/sync`

Batch sync pre-generated UIDs.

**Request:**

```json
{
  "uids": ["1234567890123", "9876543210987"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `uids` | `string[]` | Array of UIDs. Each must be **13–16 digits**, numeric only. |

**Response `200`:**

```json
{
  "success": true,
  "stats": {
    "total_received": 100,
    "inserted": 98,
    "duplicates_skipped": 2
  }
}
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Invalid UID format or empty array |
| `401` | Missing/invalid API key |
| `500` | Internal server error |

---

## Notes

- **Idempotent** — Duplicate UIDs are skipped, safe to retry.
- **Batch limit** — Up to **5,000 UIDs** per request.
- **Format** — Digits only (`0-9`), length 13–16 characters.
