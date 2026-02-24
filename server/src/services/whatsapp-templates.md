# WhatsApp Business API — Message Templates

> All templates below are designed for submission to **Meta Business Manager** for pre-approval.
> Variables use the `{{1}}, {{2}}, ...` placeholder format as required by the WhatsApp Cloud API.
> Language: **English (en_US)** for all templates.

---

## Template Overview

| # | Template Name | Category | Channel Strategy | Service Method |
|---|---|---|---|---|
| 1 | `login_otp` | Authentication | WhatsApp Only | `sendLoginOTP()` |
| 2 | `warranty_auth_otp` | Authentication | WhatsApp Only | `sendWarrantyAuthOTP()` |
| 3 | `warranty_confirmed` | Utility | Email + WhatsApp | `sendWarrantyConfirmation()` |
| 4 | `warranty_approved` | Utility | Email + WhatsApp | `sendWarrantyApproval()` |
| 5 | `warranty_rejected` | Utility | Email + WhatsApp | `sendWarrantyRejection()` |
| 6 | `installation_confirm` | Utility | WhatsApp Only | `sendInstallationConfirmation()` |
| 7 | `grievance_assigned` | Utility | WhatsApp Only | `sendGrievanceAssignment()` |
| 8 | `grievance_status_update` | Utility | WhatsApp Only | `sendGrievanceUpdate()` |
| 9 | `welcome_registration` | Marketing | Email + WhatsApp | `sendPublicWelcome()` |

---

## Template Definitions

---

### 1. `login_otp`

**Category:** Authentication
**Variables:** 1

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | One-Time Password | `483920` |

**Body:**
```
Your Autoform India login OTP is {{1}}. It is valid for 10 minutes. Do not share this code with anyone. Autoform India will never ask for your OTP.
```

**Footer:**
```
This code expires in 10 minutes.
```

---

### 2. `warranty_auth_otp`

**Category:** Authentication
**Variables:** 3

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Registrant type (who is registering) | `Franchise (AutoShine Motors)` |
| `{{2}}` | Product type | `Seat Cover` |
| `{{3}}` | One-Time Password | `719205` |

**Body:**
```
{{1}} is requesting to register a {{2}} warranty on your behalf at Autoform India. Your verification code is {{3}}. If you did not authorize this, please ignore this message.
```

**Footer:**
```
This code expires in 10 minutes.
```

> **Note:** This template handles all 3 warranty registration scenarios:
> - *Customer via QR scan:* `{{1}}` = `"You"` → "You are requesting to register a Seat Cover warranty..."
> - *Franchise on behalf:* `{{1}}` = `"Franchise (Store Name)"` → "Franchise (AutoShine Motors) is requesting..."
> - *Admin on behalf:* `{{1}}` = `"Admin (Autoform India)"` → "Admin (Autoform India) is requesting..."

---

### 3. `warranty_confirmed`

**Category:** Utility
**Variables:** 4

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Customer name | `Rahul Sharma` |
| `{{2}}` | UID / Serial Number | `SC-2026-00451` |
| `{{3}}` | Product name | `Seat Cover` |
| `{{4}}` | Car details | `Hyundai Creta (MH-12-AB-1234)` |

**Body:**
```
Hello {{1}}, your warranty registration has been submitted successfully!

📋 *Warranty Details*
• Product: {{3}}
• UID: {{2}}
• Vehicle: {{4}}

Your registration is now under review. You will be notified once it is approved.

Keep your UID safe — you will need it for any future warranty claims.

— Team Autoform India
```

---

### 4. `warranty_approved`

**Category:** Utility
**Variables:** 4

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Customer name | `Rahul Sharma` |
| `{{2}}` | UID / Serial Number | `SC-2026-00451` |
| `{{3}}` | Product name | `Seat Cover` |
| `{{4}}` | Certificate / Dashboard link | `https://warranty.autoformindia.com/login` |

**Body:**
```
Hello {{1}}, great news! ✅

Your *{{3}}* warranty has been *approved* and is now active.

📋 *Warranty Details*
• Product: {{3}}
• UID: {{2}}
• Status: ACTIVE

View your warranty certificate and details on your dashboard: {{4}}

For any warranty claims, please keep your UID handy.

— Team Autoform India
```

---

### 5. `warranty_rejected`

**Category:** Utility
**Variables:** 4

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Customer name | `Rahul Sharma` |
| `{{2}}` | UID / Serial Number | `SC-2026-00451` |
| `{{3}}` | Rejection reason | `Uploaded images do not match the product installed` |
| `{{4}}` | Edit / resubmit link | `https://warranty.autoformindia.com/login` |

**Body:**
```
Hello {{1}}, we have an update on your warranty application.

Unfortunately, your warranty registration (UID: {{2}}) could not be approved at this time.

🔍 *Reason:* {{3}}

You can review and resubmit your application with corrected details here: {{4}}

If you believe this was an error, please reach out to our support team.

— Team Autoform India
```

---

### 6. `installation_confirm`

**Category:** Utility
**Variables:** 4

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Vendor / Franchise name | `AutoShine Motors` |
| `{{2}}` | Customer name | `Rahul Sharma` |
| `{{3}}` | Car details | `Hyundai Creta (MH-12-AB-1234)` |
| `{{4}}` | Confirmation action link | `https://warranty.autoformindia.com/api/public/verify-warranty?token=xxx` |

**Body:**
```
Hello {{1}}, a customer has registered a warranty for a product installed at your store.

👤 *Customer:* {{2}}
🚗 *Vehicle:* {{3}}

Please confirm or reject this installation using the link below:
{{4}}

Your prompt response helps us activate the customer's warranty quickly.

— Team Autoform India
```

---

### 7. `grievance_assigned`

**Category:** Utility
**Variables:** 3

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Assignee name | `Vikram Patel` |
| `{{2}}` | Ticket ID | `GRV-2026-0087` |
| `{{3}}` | Grievance category | `Product Issue` |

**Body:**
```
Hello {{1}}, you have been assigned a new grievance ticket.

🎫 *Ticket ID:* {{2}}
📂 *Category:* {{3}}

Please review the details and take appropriate action at the earliest. You can respond and update the status via the link sent to your email.

— Team Autoform India
```

---

### 8. `grievance_status_update`

**Category:** Utility
**Variables:** 3

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Customer / Franchise name | `Rahul Sharma` |
| `{{2}}` | Ticket ID | `GRV-2026-0087` |
| `{{3}}` | New status | `In Progress` |

**Body:**
```
Hello {{1}}, there is an update on your grievance.

🎫 *Ticket ID:* {{2}}
📌 *New Status:* {{3}}

You can view full details and track progress on your dashboard. If you have further concerns, please reply via the dashboard.

— Team Autoform India
```

---

### 9. `welcome_registration`

**Category:** Marketing
**Variables:** 2

| Variable | Description | Sample |
|---|---|---|
| `{{1}}` | Customer name | `Rahul Sharma` |
| `{{2}}` | Warranty ID / UID | `SC-2026-00451` |

**Body:**
```
Welcome to Autoform India, {{1}}! 🎉

Your warranty registration has been received and your account has been created.

📋 *Your Warranty ID:* {{2}}

*What happens next?*
1️⃣ Store Verification — The store will confirm your installation.
2️⃣ Admin Approval — Our team will review your registration.
3️⃣ Warranty Activated — You'll receive a confirmation once approved.

You can track your warranty status anytime by logging into your dashboard with OTP.

Thank you for choosing Autoform India!

— Team Autoform India
```

---

## Meta Submission Notes

### Category Guidelines
- **Authentication** templates: Used for OTPs only. Cannot contain marketing or promotional content. Meta typically auto-approves these.
- **Utility** templates: Transactional notifications triggered by a user action. Must be informational, not promotional.
- **Marketing** templates: Can contain promotional content. `welcome_registration` qualifies because it includes onboarding messaging.

### Variable Limits
- All variables are of type `text`
- Maximum recommended: 5 variables per template
- Variable text should not exceed 1024 characters each

### Template Approval Timeline
- Authentication: Typically approved within **minutes to hours**
- Utility: Typically approved within **24-48 hours**
- Marketing: May take **24-48 hours**, subject to stricter review

### Language
- All templates submitted in `en_US`
- Additional languages (Hindi `hi`, etc.) can be added later as translations of the same template name
