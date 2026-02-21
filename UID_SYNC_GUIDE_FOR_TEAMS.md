# 🗝️ Autoform UID Sync: Integration Guide for Teams

Hello Team! 👋 

This guide explains how to sync UIDs from your system into the Autoform Warranty Portal. We've updated the API to be much smarter—it now tells you exactly what happened to every single UID in your batch.

---

## 🚦 Quick Overview
*   **Endpoint:** `https://server-bharat-maheshwaris-projects.vercel.app/api/uid/sync`
*   **Method:** `POST`
*   **Auth Header:** `x-api-key: uid_autoform_man_s3cur3_2026_xK9mP7qW`
*   **Format:** Standard JSON with an array named `uids`.

---

## 📦 What to Send
You can send up to **1,000 UIDs** in a single call. 

**Pro-tip:** We recommend batches of 200–500 for the best performance.

```json
{
  "uids": ["23101002211185", "23101002211186", "23101002211187"]
}
```

---

## 📤 Understanding the Response
Instead of a simple "Success", you'll get a detailed breakdown. Here is how to read it:

### 1. The Summary (`stats`)
This tells you the high-level counts. Great for quick logging on your end.

### 2. The Details (`details`)
Every UID you sent is listed here with its specific status. This is where the magic happens!

### 🔍 Every Case We Cover:

| Status | What it means & What you should do |
| :--- | :--- |
| **`inserted`** | **Success!** This is a brand-new UID we've added to the portal. |
| **`already_exists_available`** | This UID was already in our system but hasn't been used yet. No action needed—it's ready for a customer. |
| **`already_exists_used`** | **Warning!** This UID is already linked to an active warranty in our system. You might want to verify if it was issued correctly. |
| **`invalid_format`** | The UID didn't follow our rules (must be 13-16 digits). Check your generator! |
| **`duplicate_in_request`** | You accidentally sent the same UID twice in the same JSON batch. We processed the first one and skipped this one. |

---

## 📝 Example Response (The full picture)

```json
{
  "success": true,
  "message": "Processed 4 UIDs",
  "stats": {
    "total_received": 4,
    "inserted": 1,
    "already_exists_available": 1,
    "already_exists_used": 1,
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
      "used_at": "2026-02-15 14:30:00"
    },
    { 
      "uid": "ABC123", 
      "status": "invalid_format", 
      "message": "UID must be a 13-16 digit number" 
    }
  ]
}
```

---

## 🛑 Limits & Rules
1.  **Strict Strings**: Please send UIDs as strings in the JSON, not numbers.
2.  **Transactions**: Don't worry about partial failures. Within a single batch, either all "New" UIDs go in, or none do if the database has a hiccup.
3.  **Rate Limits**: Please keep it under 10 requests per minute during initial integration testing.

Happy Integrating! Let us know if you have any questions. 🚀
