# UID Sync API — Integration Guide (Autoform India Pvt. Ltd.)

Use this API to sync pre-generated UIDs into the Autoform Warranty System.

## Endpoint
**URL:** `https://autoformindia.com/api/uid/sync`  
**Method:** `POST`

---

## Authentication
Add the following header to all requests:
- `x-api-key`: `sg-uid-sync-a7f3b9e2d4c1089562fe`

---

## Request Body
**Content-Type:** `application/json`

```json
{
  "uids": ["1234567890123", "9876543210987"]
}
```

- **uids**: Array of strings. 
- **Format**: Digits only (0-9), Length: 13 to 16 characters.

---

## Response
**Success (200):**
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
- `400`: Invalid format or empty list.
- `401`: Missing or invalid API key.
- `500`: System failure.

---

## Key Notes
1. **Idempotent**: Safe to re-send the same UIDs; duplicates are skipped.
2. **Batching**: Recommended batch size is up to **5,000 UIDs** per request.
3. **Daily Sync**: Sending data once per day or batch is recommended.
