# 🗝️ Autoform UID Sync API

This API is used by the **External UID Generation System** to push newly generated serial numbers (UIDs) into the Autoform Warranty Portal.

---

## 🚀 1. Base Configuration

| Parameter | Value |
| :--- | :--- |
| **API Endpoint** | `https://server-bharat-maheshwaris-projects.vercel.app/api/uid/sync` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

---

## 🔒 2. Authentication

This is a **Stateless API**. No standard login or user token (JWT) is required. Instead, you must include the following secret **API Key** in your request headers for every call.

**Required Header:**
```http
x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW
```

> [!NOTE]
> No "Login" or "Bearer Token" is needed. The `x-api-key` is the only authentication required for this system-to-system connection.

---

## 📦 3. Request Format (JSON)

Send a batch of UIDs as an array of strings.

```json
{
  "uids": [
    "23101002211185",
    "23101002211186",
    "23101002211187"
  ]
}
```

### 📋 UID Rules:
*   **Format**: Digits only (`0-9`). No letters or special characters.
*   **Length**: Must be between **13 and 16 digits**.
*   **Batching**: Recommended batch size is **100 - 500 UIDs** per request.
*   **Idempotent**: If you send a UID that already exists, the system will simply skip it without error. It is safe to retry a failed batch.

---

## 📤 4. Typical Responses

### ✅ Success (200 OK)
The system returns a high-level summary and detailed info for **every** UID in the batch.

```json
{
  "success": true,
  "message": "Processed 100 UIDs",
  "stats": {
    "total_received": 100,
    "inserted": 95,
    "already_exists_available": 2,
    "already_exists_used": 1,
    "invalid_format": 1,
    "duplicate_in_request": 1
  },
  "details": [
    { "uid": "23101002211185", "status": "inserted", "message": "UID successfully synced" },
    { "uid": "23101002211186", "status": "already_exists_available", "message": "UID already exists in the system and is available" },
    { 
      "uid": "23101002211187", 
      "status": "already_exists_used", 
      "message": "UID is already registered to a warranty",
      "info": {
        "customer_name": "Rahul Sharma",
        "registration_number": "HR26AB1234",
        "used_at": "2026-02-15 14:30:00"
      }
    },
    { "uid": "ABC123", "status": "invalid_format", "message": "UID must be a 13-16 digit number" }
  ]
}
```

### 📋 Status Codes Table:
| Status | Meaning |
| :--- | :--- |
| `inserted` | New UID added successfully. |
| `already_exists_available` | UID was already in the portal and is ready to use. |
| `already_exists_used` | UID is already linked to a customer warranty. |
| `invalid_format` | UID is not a 13-16 digit number. |
| `duplicate_in_request` | You sent the same UID more than once in this batch. |

---

## ⚠️ 5. Limits
*   **Maximum Batch Size**: 1,000 UIDs per request.
*   **Rate Limiting**: Standard API rate limits apply.

---

## 💻 5. Sample Request (cURL)

```bash
curl -X POST https://server-bharat-maheshwaris-projects.vercel.app/api/uid/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW" \
  -d '{
    "uids": ["23112000000001", "23112000000002"]
  }'
```

---

> [!IMPORTANT]
> **Production Notice:** Once testing is complete, the Base URL will change to the production domain. All other headers and JSON formats will remain identical.
