# WhatsApp Health & Monitoring Dashboard — Plan

**Status:** Deferred. Build *after* the manpower-approval WhatsApp message is wired up and live.
**Written:** 2026-08-05
**Owner:** dev@autoformindia.com

This document captures the research and design for an admin-side WhatsApp monitoring
dashboard so nothing has to be re-derived later. All findings below were verified
against the live system and the live Interakt API on 2026-08-05.

---

## 1. Why this is deferred

The immediate need is the **manpower approval WhatsApp message** (when an admin
approves a staff member, that person gets a WhatsApp). The monitoring dashboard is
a separate, larger piece of work that observes *all* message traffic — including
the new manpower message once it exists. Doing the manpower wiring first means the
dashboard is built against a complete set of message types.

---

## 2. How WhatsApp works today (current state)

**Provider:** Interakt (WhatsApp Business API)
**Single service:** `server/src/services/whatsapp.service.ts`
**Send endpoint:** `POST https://api.interakt.ai/v1/public/message/`
**Auth:** `Authorization: Basic ${INTERAKT_API_KEY}`

### Architecture

One private method, `sendTemplateMessage()`, does all the real work:
phone normalisation → payload assembly → value sanitisation → HTTP POST → logging.
Around it sit ~20 thin public wrappers, each pinning a template name and its
variable order (`sendWarrantyApprovedCustomer`, `sendLoginOTP`, etc.).

**Consequence:** adding a new message type = one new wrapper + one approved
Interakt template. No architectural change needed.

### Non-obvious behaviours already handled (do not re-learn these)

- **Phone normalisation** — `formatPhoneNumber()` splits `+91…` / `91…` / `0…` /
  bare 10-digit into Interakt's required `{countryCode, phoneNumber}` shape.
- **Interakt rejects tabs, newlines, and 3+ consecutive spaces** in template body
  variables. Sanitised centrally in `sendTemplateMessage()`. 12 historical failures
  came from exactly this before it was fixed.
- **Dates must be formatted manually.** `toLocaleDateString('en-IN')` emits
  non-breaking spaces (` `) on some Node/ICU builds, which WhatsApp rejects.
  The service uses a manual `DD-MMM-YYYY` formatter.
- **Every send is logged** to `message_logs`; the Interakt webhook later upgrades
  the row's status `sent → delivered → read`, or to `failed` with an error code.

### The send pattern to copy (warranty approval)

`server/src/controllers/admin.controller.ts` (~line 1358):

1. Commit the DB transaction.
2. **Respond to the admin immediately** (no UI lag).
3. Then, in a fire-and-forget async IIFE, send WhatsApp wrapped in
   `runWithRetry(fn, 3 attempts, 5000ms, label)`.
4. Catch and log all messaging errors — they must never block or fail the request.

This is the correct pattern for the manpower message too.

---

## 3. Research findings (verified against the live Interakt API)

These four findings drive the whole design.

### 3.1 Interakt has NO template-listing API

Probed on 2026-08-05:

| Endpoint | Result |
|---|---|
| `GET /v1/public/track/templates/` | `500 {"result":false,"message":"Error processing the request."}` |
| `GET /v1/public/templates/` | `404 Not Found` (HTML) |

**Implication:** the dashboard **cannot auto-discover** which templates exist or are
approved. The list of message types must be a **code-defined registry**.

### 3.2 Template names ARE validated at send time, with a precise error

Sending to a well-formed number with a non-existent template returns:

```
HTTP 400
{"result":false,"message":"Please correct the following error -
  No approved template found with name 'af_manpower_approved_probe_does_not_exist'
  and language 'en'. Please re-sync on Interakt dashboard and try again"}
```

A valid template returns `HTTP 201` with a queued message id.

**Implication:** an unapproved template fails **loudly and identifiably**. We can
pattern-match this error and surface it in the UI rather than let it hide in logs.

### 3.3 There is NO zero-cost way to verify a template

Interakt validates the **phone number before the template**. With an invalid phone,
both a good and a bad template name return the identical phone error:

```
BAD  template / bad phone : HTTP 400 "Phone Number & Country Code provided is invalid"
GOOD template / bad phone : HTTP 400 "Phone Number & Country Code provided is invalid"
```

**Implication:** template health cannot be *polled*. It can only be **observed**
from real send results. The dashboard reports the last known outcome per template.

### 3.4 Delivery is healthy; failures are concentrated and explainable

Failure rate: **221 / 28,921 = 0.76%**

| Count | Code | Meaning |
|---|---|---|
| 172 | `131026` | Message undeliverable (number not on WhatsApp) |
| 19 | — | `ECONNRESET` (transient network) |
| 12 | — | Variable contained tabs/newlines (since fixed centrally) |
| 13 | — | HTTP 500 / 503 / 504 (transient Interakt) |
| 1 | `131000` | "Something went wrong" |

Status distribution (all time): `read` 7,384 · `sent` 20,065 · `delivered` 1,250 · `failed` 221

---

## 4. Available monitoring data

`message_logs` — **28,921 rows, 1 May → 5 Aug 2026**, `channel='whatsapp'` only.

**Columns:** `id, recipient_phone, recipient_email, channel, template_name, status,
context, reference_id, error_message, interakt_message_id, error_code, campaign_id,
created_at, updated_at`

### 4.1 Per-template funnel (last 30 days) — the centrepiece

| Template | Total | Sent | Deliv | Read | Fail |
|---|---|---|---|---|---|
| `af_warranty_submitted_2` | 2,351 | 169 | 346 | 1,755 | 81 |
| `franchise_verify_action` | 2,351 | 156 | 217 | 1,954 | 24 |
| `af_warranty_approved_customer` | 2,034 | 241 | 420 | 1,312 | 61 |
| `franchise_verify_approved` | 1,532 | 92 | 123 | 1,317 | 0 |
| `fms_login_otp` | 1,042 | 90 | 123 | 819 | 10 |
| `af_admin_broadcast_img_2` | 332 | 332 | 0 | 0 | 0 |
| `franchise_verify_responded` | 136 | 6 | 9 | 121 | 0 |
| `af_vendor_warr_rejected` | 70 | 12 | 3 | 54 | 1 |
| `af_cust_warr_rejec_2` | 59 | 12 | 7 | 38 | 2 |
| `af_vendor_welcome` | 6 | 1 | 1 | 4 | 0 |
| `af_order_received_distributor` | 4 | 0 | 0 | 4 | 0 |
| `af_order_placed_franchise` | 4 | 0 | 0 | 4 | 0 |

15 distinct templates active in 30 days. Read rates ~75–83% where acks arrive.

### 4.2 Daily volume + failure trend (14d sample)

Range 174–534/day, ~300/day average. Clean series — supports a trend chart.

```
Aug 05   35  failed 0     Jul 29  230  failed 6
Aug 04  254  failed 9     Jul 28  312  failed 7
Aug 03  343  failed 7     Jul 27  353  failed 10
Aug 02  264  failed 2     Jul 26  181  failed 0
Aug 01  408  failed 4     Jul 25  534  failed 6
Jul 31  174  failed 7     Jul 24  236  failed 3
Jul 30  216  failed 2     Jul 23  299  failed 7
```

### 4.3 Anomalies worth surfacing

- **Broadcasts get no acks.** `af_admin_broadcast_img_2`: 332 sent, **0 delivered,
  0 read**. Marketing-category messages appear not to produce webhook status
  callbacks. Needs confirming with Interakt — otherwise it looks like breakage.
- **Stale/superseded templates.** `af_warranty_submitted`, `af_vendor_rejected`,
  `af_warranty_rejected_customer`, `af_admin_broadcast_img` last used ~May,
  replaced by `_2` versions. Dashboard should mark these "Stale".
- **Repeat-failing numbers** (60d, >2 failures): only **4** numbers.
  Worst: `***9533` with 15 failures. Small, actionable data-quality list.

### 4.4 Ack latency

7-day sample: n=1,848, avg ≈ 9,538s, max ≈ 527,527s. **Note:** these figures are
inflated/unreliable because `updated_at` also moves on non-status edits, and
"read" depends on when a human opens WhatsApp. Treat latency as **low-confidence**
— either compute it only for `sent → delivered`, or omit it from v1.

### 4.5 Query cost

| Query | Time |
|---|---|
| Per-template 30d aggregate | 59 ms |
| Daily series 30d | 60 ms |

Acceptable today at 29k rows.

**⚠️ There is NO index on `created_at`**, and every dashboard query filters on it.
Existing indexes: `PRIMARY(id)`, `idx_msg_logs_phone`, `idx_msg_logs_email`,
`idx_msg_logs_ref_id`, `idx_msg_logs_interakt_id`, `idx_msg_logs_campaign_id`.

**Action for v1:** add `INDEX idx_msg_logs_created_at (created_at)`. Growth is
~300/day ≈ 110k rows/year, so this will matter.

---

## 5. Proposed design — `AdminMessaging` module

New admin module (sits alongside `AdminManpower`, `AdminAnnouncements`, etc.).

### 5.1 Summary cards
Sent (30d) · Delivery rate · Read rate · Failure rate — each with trend vs. prior 30d.

### 5.2 Volume chart
Daily sends over 30d with failures overlaid.

### 5.3 Template health table (centrepiece)

One row per template:

| Column | Source |
|---|---|
| Template name | `message_logs.template_name` |
| Linked event | code registry (`context` → human label) |
| Volume (30d) | count |
| Funnel bar | sent → delivered → read → failed |
| Read % | derived |
| Last used | `MAX(created_at)` |
| Health badge | derived (below) |

**Health badge rules (observed, not polled — see §3.3):**

| Badge | Condition |
|---|---|
| `Healthy` | recent sends, failure rate below threshold |
| `Template not approved` | last error matches `No approved template found` |
| `No acks` | sends > 0 but delivered = 0 and read = 0 |
| `Elevated failures` | failure rate above threshold |
| `Stale` | no sends in N days |
| `Never sent` | in registry, absent from logs |

### 5.4 Failure panel
Grouped by `error_code` with plain-English explanations
(e.g. `131026` → "Recipient's number is not on WhatsApp"), plus the
repeat-offender number list from §4.3.

### 5.5 Live message log
Searchable/filterable recent messages: phone, template, status, error, timestamp.

### 5.6 Code registry

Because Interakt can't be queried (§3.1), each message type is declared in code:
key, label, group (Warranty / Manpower / Orders / Auth / Broadcast), template name,
recipient type, description. The UI renders from this registry, so a newly added
message type appears automatically — including the manpower message.

---

## 6. Open item: the send kill-switch (decide at build time)

Distinct from template control, and **this part IS within our control**:

Today the only switch is `process.env.ENABLE_WHATSAPP`, checked at **11 separate
call sites**:

```
admin.controller.ts:1358, 1413, 1547
auth.controller.ts:181, 296, 448, 667
notification.controller.ts:185
order.controller.ts:816
public.controller.ts:832
```

Problems: one global on/off; no per-message-type control; changing it requires SSH
+ `.env` edit + pm2 restart; and because the check sits at *call sites* rather than
inside the service, a new call site can silently forget it.

**Recommendation if built:** move the gate **inside** `sendTemplateMessage()` so it
governs every send centrally and cannot be bypassed. Store per-type toggles as one
JSON row (`whatsapp_notifications`) in the existing `system_settings` table
(`setting_key` PK, `setting_value` longtext, `updated_by`) — it already has a
controller (`settings.controller.ts`) and activity logging, so **no migration is
needed**. Cache in memory with a ~30s TTL to avoid a DB read per message.

**Precedence:** `ENABLE_WHATSAPP` (master kill-switch) → per-type toggle → send.

Defaults: all currently-live types **ON** (behaviour unchanged); any type whose
template is not yet approved **OFF**.

**Rationale for keeping it:** monitoring alone answers *"is it working?"* but leaves
you watching a problem you cannot stop. The toggle answers *"make it stop"* without
a deploy. It is a small addition to the same panel.

---

## 7. Prerequisites / notes for whoever builds this

1. **The manpower message must be wired first** (the reason this is deferred), so
   the registry and dashboard cover a complete set of message types.
2. **Add the `created_at` index** before or with v1 (§4.5).
3. **Confirm the broadcast-ack anomaly** with Interakt (§4.3) so "no acks" isn't
   reported as a false alarm.
4. **Template approval happens in the Interakt dashboard**, never in this codebase.
   Any new template must be created and Meta-approved there first; sends fail with
   the §3.2 error until it is.
5. **Treat ack latency as low-confidence** (§4.4) — restrict to `sent → delivered`
   or omit from v1.
6. `message_logs` has an `email` channel column but currently holds **WhatsApp rows
   only**. If email logging is added later, every dashboard query must filter
   `channel='whatsapp'` or split by channel.
