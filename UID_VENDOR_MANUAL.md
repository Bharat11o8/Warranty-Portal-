# 🔌 Autoform Warranty Portal — UID Integration Manual
### For External UID Generation Team

> **Version:** 1.0 · **Last Updated:** June 2026  
> **Contact:** Autoform IT Team · warranty2.autoformindia.co.in

---

## 📋 Table of Contents

1. [What Is This?](#1-what-is-this)
2. [Quick Start Checklist](#2-quick-start-checklist)
3. [Authentication](#3-authentication)
4. [API Endpoint Reference](#4-api-endpoint-reference)
5. [Request Formats](#5-request-formats)
6. [Response Reference](#6-response-reference)
7. [UID Rules & Validation](#7-uid-rules--validation)
8. [Postman Testing Guide](#8-postman-testing-guide)
9. [Error Handling](#9-error-handling)
10. [Auto Product Registration](#10-auto-product-registration)
11. [Best Practices](#11-best-practices)
12. [FAQ](#12-faq)

---

## 1. What Is This?

When your system **generates new UID serial numbers** and assigns them to products, you must **push those UIDs** into the Autoform Warranty Portal before customers can use them for warranty registration.

This document explains exactly how to do that using our **UID Sync API**.

```
Your System  ──[POST /api/uid/sync]──▶  Autoform Portal
   (UIDs)                                   (Database)
                                              ▼
                                      Customer enters UID
                                      on warranty form
                                              ▼
                                     Auto-fills Product Name
```

---

## 2. Quick Start Checklist

- [ ] Receive the `x-api-key` from the Autoform IT team
- [ ] Test connection using the Health Check endpoint
- [ ] Test a small batch (2-3 UIDs) in Postman
- [ ] Confirm UIDs appear in the portal admin panel
- [ ] Integrate the sync call into your UID generation pipeline
- [ ] Set up batch syncing (recommended: sync immediately after generation)

---

## 3. Authentication

This API uses **API Key authentication**. No login or JWT token is needed.

### Required Header (on every request):
```http
x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW
```

> ⚠️ **Keep this key secret.** Do not hardcode it in public repositories. Store it in your environment variables or secrets manager.

### What happens with a wrong/missing key:
```json
HTTP 401 Unauthorized
{
  "error": "Invalid or missing API key"
}
```

---

## 4. API Endpoint Reference

| Parameter        | Value                                                    |
|:-----------------|:---------------------------------------------------------|
| **Base URL (Prod)**  | `https://warranty2.autoformindia.co.in`              |
| **Base URL (Local)** | `http://localhost:3000`                              |
| **Sync Endpoint**    | `POST /api/uid/sync`                                 |
| **Health Check**     | `GET /health`                                        |
| **Content-Type**     | `application/json`                                   |
| **Max Batch Size**   | `1,000 UIDs per request`                             |

---

## 5. Request Formats

The `uids` field accepts **three formats**. You can even mix them in the same request.

---

### ✅ Format 1: Plain String Array *(Backward Compatible)*

Use this if you only want to sync UID numbers without product info.

```json
POST /api/uid/sync
Content-Type: application/json
x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW

{
  "uids": [
    "23101002211185",
    "23101002211186",
    "23101002211187"
  ]
}
```

---

### ✅ Format 2: Object Array with Product Name *(Recommended)*

Use this to link each UID to its product/design name. This enables **auto-fill** on the customer warranty form.

```json
POST /api/uid/sync
Content-Type: application/json
x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW

{
  "uids": [
    { "uid": "23101002211185", "product_name": "Amaze Duo +" },
    { "uid": "23101002211186", "product_name": "Amaze Duo +" },
    { "uid": "23101002211187", "product_name": "Rover Special Edition" }
  ]
}
```

> 💡 **Why use this format?** When a customer enters their UID on the warranty form, the **Product Name** and **Warranty Type** fields are automatically filled in for them — no manual selection needed.

---

### ✅ Format 3: Mixed Array

You can mix strings and objects in the same request.

```json
{
  "uids": [
    "23101002211185",
    { "uid": "23101002211186", "product_name": "Amaze Duo +" }
  ]
}
```

---

## 6. Response Reference

### ✅ Success Response (HTTP 200)

```json
{
  "success": true,
  "message": "Processed 5 UIDs",
  "stats": {
    "total_received": 5,
    "inserted": 3,
    "already_exists_available": 1,
    "already_exists_used": 0,
    "invalid_format": 1,
    "duplicate_in_request": 0
  },
  "details": [
    {
      "uid": "23101002211185",
      "status": "inserted",
      "message": "UID successfully synced"
    },
    {
      "uid": "23101002211186",
      "status": "already_exists_available",
      "message": "UID already exists in the system and is available"
    },
    {
      "uid": "23101002211187",
      "status": "already_exists_used",
      "message": "UID is already registered to a warranty",
      "used_at": "2026-05-10 14:30:00"
    },
    {
      "uid": "ABC123",
      "status": "invalid_format",
      "message": "UID must be a 13-16 digit number string"
    }
  ]
}
```

---

### 📊 Status Code Reference

| Status Field                | Meaning                                                       | Action Needed?       |
|:----------------------------|:--------------------------------------------------------------|:---------------------|
| `inserted`                  | ✅ New UID added to the portal successfully                   | None                 |
| `already_exists_available`  | ℹ️ UID was already in the portal and is ready for use         | None (safe to retry) |
| `already_exists_used`       | ⚠️ UID is already linked to a customer's warranty             | Investigate          |
| `invalid_format`            | ❌ UID is not a 13–16 digit number                            | Fix and resend       |
| `duplicate_in_request`      | ⚠️ Same UID sent more than once in this batch                 | Deduplicate your list|

---

### ❌ Error Responses

| HTTP Code | Reason                         | Response Body                                          |
|:----------|:-------------------------------|:-------------------------------------------------------|
| `400`     | Empty or missing `uids` field  | `{ "error": "uids must be a non-empty array..." }`     |
| `400`     | Batch exceeds 1000 UIDs        | `{ "error": "Batch size exceeds limit of 1000 UIDs" }` |
| `401`     | Wrong or missing API key       | `{ "error": "Invalid or missing API key" }`            |
| `500`     | Server-side error              | `{ "error": "Failed to sync UIDs" }`                   |

---

## 7. UID Rules & Validation

| Rule           | Detail                                                  |
|:---------------|:--------------------------------------------------------|
| **Characters** | Digits only (`0–9`). No letters, dashes, or spaces.     |
| **Length**     | Must be between **13 and 16 digits** (inclusive).       |
| **Uniqueness** | Each UID must be globally unique across all products.   |
| **Product Name** | Optional. Plain text string, e.g. `"Amaze Duo +"`.   |
| **Idempotent** | Safe to retry. Sending the same UID again won't cause errors. |

### ✅ Valid UIDs
```
2310100221118      ← 13 digits ✓
23101002211185     ← 14 digits ✓
231010022111857    ← 15 digits ✓
2310100221118579   ← 16 digits ✓
```

### ❌ Invalid UIDs
```
ABC123             ← Contains letters ✗
12345              ← Only 5 digits ✗
23101-002-211185   ← Contains dashes ✗
23101002211185999  ← 17 digits ✗
```

---

## 8. Postman Testing Guide

### Step 1 — Import / Create a Collection

1. Open Postman
2. Click **New Collection** → Name it `Autoform UID API`
3. Set a **Collection Variable**: `baseUrl = http://localhost:3000`

---

### Step 2 — Add Auth Header to Collection

Go to the **Headers** tab of the Collection (Edit → Headers) and add:

| Key         | Value                                        |
|:------------|:---------------------------------------------|
| `x-api-key` | `uid_autoform_man_s3cur3_2026_xK9mP7qW`      |
| `Content-Type` | `application/json`                        |

---

### 🧪 Test 1 — Health Check

```
Method : GET
URL    : http://localhost:3000/health
Headers: (none needed)
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Warranty Portal API is running"
}
```

---

### 🧪 Test 2 — Sync UIDs (Plain Strings)

```
Method : POST
URL    : http://localhost:3000/api/uid/sync
Headers: x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW
Body   : raw → JSON
```

```json
{
  "uids": [
    "23101002211185",
    "23101002211186",
    "23101002211187"
  ]
}
```

**Expected:** All 3 UIDs → `"status": "inserted"`

---

### 🧪 Test 3 — Sync UIDs with Product Names ⭐ (Main Test)

```
Method : POST
URL    : http://localhost:3000/api/uid/sync
Headers: x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW
Body   : raw → JSON
```

```json
{
  "uids": [
    { "uid": "23101002299001", "product_name": "Amaze Duo +" },
    { "uid": "23101002299002", "product_name": "Amaze Duo +" },
    { "uid": "23101002299003", "product_name": "Rover Special Edition" }
  ]
}
```

**Expected:**
- All 3 → `"status": "inserted"`
- If `"Rover Special Edition"` is a new product → it gets **auto-registered** in the portal's product catalogue
- Admin receives a real-time notification about the new product

---

### 🧪 Test 4 — Retry / Idempotency Test

Resend the **same UIDs** from Test 3.

**Expected:**
- All 3 → `"status": "already_exists_available"`
- No errors, no duplicates — safe to retry ✅

---

### 🧪 Test 5 — Invalid Format Test

```json
{
  "uids": [
    "ABC123",
    "12345",
    "23101002299999"
  ]
}
```

**Expected:**
- `"ABC123"` → `"invalid_format"`
- `"12345"` → `"invalid_format"`
- `"23101002299999"` → `"inserted"` ✅

---

### 🧪 Test 6 — Large Batch Test

```json
{
  "uids": [
    { "uid": "23101002300001", "product_name": "Amaze Duo +" },
    { "uid": "23101002300002", "product_name": "Amaze Duo +" },
    { "uid": "23101002300003", "product_name": "City Classic" },
    { "uid": "23101002300004", "product_name": "City Classic" },
    { "uid": "23101002300005", "product_name": "Rover Special Edition" }
  ]
}
```

---

### 🧪 Test 7 — Wrong API Key (Auth Check)

```
Headers: x-api-key: wrong_key_here
```

**Expected:** `HTTP 401` → `{ "error": "Invalid or missing API key" }`

---

### 🧪 Test 8 — Exceed Batch Limit

Send an array with more than **1000 UIDs**.

**Expected:** `HTTP 400` → `{ "error": "Batch size exceeds limit of 1000 UIDs" }`

---

## 9. Error Handling

### Recommended Retry Logic

```
On HTTP 5xx  → Wait 30 seconds, retry up to 3 times
On HTTP 429  → Wait 60 seconds (rate limited), retry
On HTTP 400  → Fix payload, do NOT retry blindly
On HTTP 401  → Check API key, contact Autoform IT
```

### Handling Partial Failures

The API always returns `HTTP 200` even if some UIDs in the batch were invalid. **Always check the `details` array** for individual UID statuses:

```javascript
// Pseudocode example
const response = await syncUIDs(batch);
const failed = response.details.filter(d => d.status === 'invalid_format');
if (failed.length > 0) {
    // Log these for review
    logInvalidUIDs(failed);
}
```

---

## 10. Auto Product Registration

This is an important feature to understand:

### What happens when you send a new product name?

```
You send: { "uid": "23101002299003", "product_name": "New Seat Design XL" }
                    ▼
Portal checks: Does "New Seat Design XL" exist in product catalogue?
                    ▼
           ┌── YES → Links UID to existing product
           └── NO  → Automatically creates the product with defaults:
                        • Type: Seat Cover
                        • Warranty: 1 Year
                      Then links the UID to it
                      Then notifies admin via real-time notification
```

### Default values for auto-registered products:
| Field          | Default Value  |
|:---------------|:---------------|
| Product Type   | `seat_cover`   |
| Warranty Years | `1 Year`       |

> ⚠️ **Note:** If a product needs custom warranty terms (e.g., 2 Year or 3 Year), the admin team will update it manually after seeing the notification. Make sure to communicate any non-standard warranty terms separately.

### Product Name Matching
- Matching is **case-insensitive** and **trims whitespace**
- `"Amaze Duo +"` = `"amaze duo +"` = `"  AMAZE DUO +  "` → all treated as the same product

---

## 11. Best Practices

### ✅ Do This

- **Sync immediately** after generating UIDs — don't batch up days of UIDs
- **Use Format 2** (objects with `product_name`) for the best customer experience
- **Include product name** exactly as it appears on the physical product label
- **Recommended batch size:** 100–500 UIDs per request for optimal performance
- **Retry on 5xx errors** with exponential backoff
- **Log all API responses** for audit and debugging
- **Deduplicate** UIDs within your batch before sending

### ❌ Avoid This

- Don't send UIDs that have been sold/used by customers (they'll come back as `already_exists_used`)
- Don't send batches over 1,000 UIDs — split them up
- Don't hardcode the API key in your application source code
- Don't retry 400 errors without fixing the payload first

---

## 12. FAQ

**Q: What if I send the same UID twice in the same batch?**  
A: The second occurrence gets `status: duplicate_in_request`. No error is thrown. The first occurrence is processed normally.

**Q: What if I send a UID that's already in the portal?**  
A: It returns `already_exists_available`. No error. If you also sent a new `product_name`, the portal will **update** the product name on that UID (as long as it hasn't been used yet).

**Q: What if the server is down when I send UIDs?**  
A: You'll receive a `5xx` error. Store the failed batch and retry after 30–60 seconds. The API is idempotent — retrying is always safe.

**Q: How quickly are UIDs available after syncing?**  
A: Immediately. As soon as you get a `200 OK` response with `inserted` statuses, the UIDs are live in the portal and customers can use them.

**Q: Can I delete a UID I accidentally sent?**  
A: Only an Autoform admin can delete UIDs from the portal admin panel. Contact the Autoform IT team.

**Q: How do I know if my product name was auto-registered?**  
A: The admin team gets a real-time notification in the portal whenever a new product is auto-registered. You can also ask them to confirm.

**Q: What is the production API URL?**  
A: `https://warranty2.autoformindia.co.in/api/uid/sync`

**Q: Is there a sandbox/test environment?**  
A: Use `http://localhost:3000` for local testing. Contact the Autoform IT team for staging environment access.

---

## 📞 Contact & Support

| Purpose             | Contact                              |
|:--------------------|:-------------------------------------|
| API Key / Access    | Autoform IT Team                     |
| Product Catalogue   | Autoform Admin Panel → Products      |
| Bugs / Issues       | warranty2.autoformindia.co.in        |

---

*This document is intended for the external UID generation team. Please do not share the API key publicly.*
