# Brand Store Audit — WhatsApp Flow Plan

**Status:** Specced. Form draft started in Interakt, **not published** — parked on two
open decisions (§5).
**Written:** 2026-08-06 · **Updated:** 2026-08-07
**Owner:** dev@autoformindia.com
**Preview:** https://claude.ai/code/artifact/cfafe370-e1ce-4eb2-84ea-0e890cc91db6
**Source:** `D:\New folder\Consolidated Master Sheet..xlsx` → sheet `Q3 Audit Call`

> **⚠ Published forms cannot be edited.** Interakt's own documentation states a
> published form is final — a change means rebuilding from scratch. Every decision
> in §5 must be settled *before* clicking Publish.

---

## 1. What this is

An admin-triggered audit sent to a franchise store's registered WhatsApp number.
The store owner fills it in **inside WhatsApp** (not a web link) and the answers
come back as structured data, saved against that store.

Questions were extracted from the master sheet's `Q3 Audit Call` tab:
- Columns filled **red** (`FFFF0000`) are excluded — confirmed against screenshots.
- Store identity columns are excluded — we already hold that data.
- Everything else became a question, with its exact dropdown options.

---

## 2. Why WhatsApp Flows and not a template

WhatsApp templates **cannot contain fillable fields**. A template can carry text
plus at most 3 quick-reply buttons. 13 questions cannot be one message.

The three options considered:

| Option | Verdict |
|---|---|
| Template + freeform reply | Works today, but replies are unstructured text someone must transcribe. Unworkable at 300+ stores. |
| Template + web form link | Practical, structured, no Meta form limits. Rejected — user wants the form inside WhatsApp. |
| **WhatsApp Flows** | **Chosen.** Real multi-screen form, structured response. Depends on plan support (§6). |

---

## 3. The 13 questions

Field types were derived from the sheet's `dataValidation` lists, not guessed.
Q6–Q8 store comma-separated values in existing data, confirming multi-select.
Q3/Q5/Q10 have no validation and real answers are prose ("40 Approx.", "200-250",
"2.5 lac Approx."), so they must stay **free text** — forcing numbers would break
how stores actually answer.

### Screen 1 — Brand Standards

**1. Is your glow sign board / signage installed and working?** *(single)*
`Installed and working` · `Not installed` · `Installed but not working`

**2. Where is your store present online?** *(multi)*
`Facebook` · `Instagram` · `Google` · `YouTube` · `WhatsApp Group` · `Offline agent` · `Offline` · `Any other` · `None`

### Screen 2 — Customer Service

**3. What is your average monthly footfall?** *(free text — e.g. "150+")*

**4. Do you have any customer complaint?** *(single)* `Yes` · `No`

### Screen 3 — Operations

**5. How many seat covers do you have in stock?** *(free text — e.g. "200-250")*

**6. Which sound and security products do you stock?** *(multi)*
`Amplifier` · `Android (Head Unit)` · `Damping (Sound Deadening)` · `DVR (Dashcam)` · `Fog Lamp` · `Horn` · `Speakers` · `Subwoofer` · `Any other` · `None`

**7. Which light and utility products do you stock?** *(multi)*
`Cable` · `Charger` · `LED` · `Tyre Inflator` · `Fog Light` · `Ventilated seat` · `Any other` · `None`

**8. Which care and fragrance products do you stock?** *(multi)*
`Microfiber` · `PPF` · `Vacuum Cleaner` · `Car Perfume` · `Any other` · `None`

**9. How often do you order from your distributor?** *(single)*
`No-Sometime` · `Yes-Regullar` · `As per customer REQ.` · `Distributor only`

> Options are the sheet's exact strings, including the `Yes-Regullar` spelling.
> **Decided 2026-08-07:** keep the approved wording so answers stay comparable
> with historical audit data.

### Screen 4 — Business

**10. What was your business with Autoform last month?** *(free text — e.g. "2.5 lac")*

### Screen 5 — Staff

**11. Is your staff Old & experienced (3–5 years)?** *(single)*
`New Staff` · `Old Staff` · `Self -Handled` · `Relatives`

> Sheet wording kept verbatim, including the space in `Self -Handled`. Note the
> question reads as yes/no but the options are not — that mismatch exists in the
> approved sheet and is retained deliberately for comparability.

**12. Do your staff need training?** *(single)* `Already trained` · `Training needed`

### Screen 6 — Feedback

**13. Anything you would like to share with us?** *(long text, optional)*

---

## 4. Auto-filled — never asked

Taken from the store's record, because asking again invites typos that break matching:

Date · Franchise name · Store contact no. · Contact person · City · State · Zone · ASM · Brands · Category

---

## 5. Open decisions

### ✅ Settled

- **Wording** — use the sheet's approved strings verbatim, including `Yes-Regullar`
  and `Self -Handled`. Rationale: the questions are already approved and answers
  must stay comparable with historical audit data.
- **Q13 is NOT the sheet's "Final remarks" column.** That column holds the
  *auditor's* notes ("Suggested restarting…", "As discussed with ASM…"). Q13
  collects the *store's* feedback — different author, different content, so it
  gets its own field.

### ⏳ Still open — blocking publish

**1. "Any other" appears in Q2, Q6, Q7, Q8.** Should selecting it open a short text
box capturing what the item actually is?

- The sheet writes the option as **"Any Other (Capture Note)"**. The "(Capture Note)"
  wording suggests the original designer intended the note to be recorded — worth
  checking how the team captures it today before deciding.
- **Yes** → 4 conditional TextInput fields. More to build, but you learn what stores
  actually stock.
- **No** → simpler; you only learn that *something* else exists.

**2. Screen 3 (Operations) carries 5 questions**, three of them multi-select with up
to 10 options. It is the heaviest screen and the most likely abandonment point on a
phone.

- **Recommendation: split** into Q5–Q7 and Q8–Q9. Seven screens instead of six, each
  fitting a phone. A store abandoning mid-screen costs the entire response, and
  screens are cheap (limit is 100).
- This is purely a usability call — it does not affect comparability with the
  existing sheet.

---

## 6. Flows availability — RESOLVED ✅

**WhatsApp Forms is available and working** on the Advanced Plan (₹35,999/year).

Path: **Automation → Utilities → WhatsApp Forms**

Three AI-generated sample drafts already exist in the account (`AI_order feedba_1KZO`,
`AI_customizatio_M49x`, `AI_product inqu_OB40`), all Draft with 0 responses — not ours,
safe to ignore.

### Draft already started

| Field | Value |
|---|---|
| Name | `Brand Store Audit` (17/20 chars — the field caps at 20) |
| Category | `Survey` |
| Template | `Send a survey` |

Saved as draft, **not published**, pending §5.

### Platform limits (checked — all comfortable)

| Limit | Max | Our audit |
|---|---|---|
| Screens per flow | 100 | 6–7 ✓ |
| Components per screen | 50 | 5 ✓ |
| Options per radio/checkbox | 20 | 10 ✓ |
| Label length | 80 chars | longest is 47 ✓ |

### Sending it

Interakt's **Workflow** builder (Automation → Workflows) has a **"WA Form Message"**
action that sends a published form. Its `Select Form` dropdown only lists forms that
already exist, which is why the form must be built first.

Workflow triggers are all inbound ("User sends a WhatsApp message", "User replies to
a campaign"), so for an **admin-triggered** send the workflow is left without a
trigger and attached to a **campaign** instead — the builder explicitly supports this
("You may skip this step & instead attach workflow to campaigns").

Set **Action on Opening Form = "Navigate to first screen"** (the default), not
"Data Exchange". Navigate mode runs the whole form on the phone and posts once at the
end; Data Exchange calls our server on every screen, adding a failure point mid-form
for no benefit here.

---

## 6a. Sources

- [Interakt — Step By Step Guide To Build WhatsApp Forms](https://www.interakt.shop/resource-center/whatsapp-form/)
- [Sprinklr — WhatsApp Flows: Elements and Composition](https://www.sprinklr.com/help/articles/whatsapp-flows/elements-and-composition/663b193c4c36705e6b029cd5)
- [Heltar — Fixing Component Limit Errors in WhatsApp Flow Builder](https://www.heltar.com/blogs/fixing-component-limit-errors-in-whatsapp-flow-builder-2025-how-to-avoid-maxfooterperscreen-and-similar-validation-errors-cmbz8uwpy0005m7n49qganapp)

---

## 7. Build order

1. **Settle the two open decisions in §5.** Publishing is irreversible.
2. **Build the screens** in Automation → WhatsApp Forms → the `Brand Store Audit` draft.
3. **Preview on a phone**, then Publish → Meta review.
4. **Create the Workflow** (Automation → Workflows): no trigger, one "WA Form Message"
   action, select the published form, `Navigate to first screen`.
5. **Attach the workflow to a campaign** so an admin can send it to chosen stores.
6. **Wire the backend** (§7a) once the Form ID and template name exist.

> Interakt can export responses to CSV on its own (Automation → WhatsApp Forms →
> View All Forms → export icon → date range → emailed report). That is enough for a
> first pilot **without any backend work at all** — worth using for the 5–10 store
> pilot before committing to the build below.

---

## 7a. Backend plan

Independent of Meta approval, so it can start immediately:

1. **`store_audits` table** — one row per audit, typed columns per question, so the
   data is queryable ("which stores have pending complaints", "average footfall by
   zone", "who needs training"). This is the entire point of a form over a chat reply.
2. **Admin trigger** — select one or many stores → Send. Status list: Sent /
   Completed / Overdue.
3. **Webhook handler** — Flow responses arrive as structured JSON at the existing
   Interakt webhook (`webhook.controller.ts`); save against the store.
4. **Results view** — per-store history, filter by answer, export.

### Reuses what already exists
- Interakt integration and webhook endpoint
- `message_logs` and delivery-status tracking
- The per-type WhatsApp toggle registry (`notificationSettings.service.ts`) — the
  audit send should be gated the same way
- Admin module conventions (sidebar registration, permission mapping)

---

## 8. Feasibility notes

**Low risk:** the backend. It is a new table plus a webhook branch, not new
infrastructure.

**Out of our control:** Meta approval. A previous template was rejected for a
trailing variable. A 13-question Flow has more surface to be rejected on — budget
for two attempts.

**The real risk is completion rate, and it is not technical.** 13 questions on a
phone, with Screen 3 carrying five. If stores abandon halfway you get partial data.
WhatsApp Flows also expire when idle, so a store that pauses starts over.

**Recommendation:** build the backend now, then **pilot with 5–10 stores before
sending to 300** to learn the real completion rate and where people drop.
