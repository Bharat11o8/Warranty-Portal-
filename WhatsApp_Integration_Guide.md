# WhatsApp Business API Integration Guide
## For AutoForm Warranty Portal

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Setup Process (Meta Side)](#setup-process-meta-side)
3. [Integration Plan (Our Code)](#integration-plan-our-code)
4. [Message Templates](#message-templates)
5. [Cost Summary](#cost-summary)

---

## Overview

### What We're Building
A hybrid notification system where:
- **WhatsApp** → OTPs, Vendor approvals, Critical alerts
- **Email** → Warranty documents, Detailed confirmations

### Estimated Timeline
| Phase | Duration |
|-------|----------|
| Meta Setup | 1-2 days |
| Template Approval | 24-48 hours |
| Code Integration | 2-3 days |
| Testing | 1 day |
| **Total** | **5-7 days** |

---

## Setup Process (Meta Side)

### Step 1: Create Meta Business Account
1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Enter business name: **AutoForm India** (or your company name)
4. Add business email and details

### Step 2: Create Meta App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Name it: **AutoForm Warranty Portal**
5. Link to your Business Account

### Step 3: Add WhatsApp Product
1. In your App Dashboard, click "Add Products"
2. Select "WhatsApp"
3. Click "Set Up"

### Step 4: Get Phone Number
**Option A: Meta Test Number (Free)**
- Use for development/testing
- Limited to 5 recipients

**Option B: Register Your Business Number**
- Need a dedicated number (not personal)
- Can use virtual number providers like:
  - Exotel
  - MyOperator
  - Or any Indian VoIP provider

### Step 5: Business Verification
Required documents:
- GST Certificate
- PAN Card
- Business Address Proof
- Company Registration (optional)

**Timeline:** 1-3 business days for approval

### Step 6: Generate Access Token
1. Go to App Dashboard → WhatsApp → API Setup
2. Copy the temporary access token (valid 24 hours)
3. For production: Create a System User and generate permanent token

---

## Integration Plan (Our Code)

### Files to Create/Modify

```
server/
├── src/
│   ├── services/
│   │   └── whatsapp.service.ts    [NEW]
│   ├── controllers/
│   │   ├── warranty.controller.ts  [MODIFY]
│   │   └── auth.controller.ts      [MODIFY]
│   └── routes/
│       └── whatsapp.routes.ts      [NEW - for webhooks]
└── .env                             [ADD CREDENTIALS]
```

### Environment Variables to Add
```env
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_VERIFY_TOKEN=any_random_string_for_webhook
```

### API Endpoint
```
POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
```

### Sample Service Code
```typescript
// whatsapp.service.ts
import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export const sendWhatsAppMessage = async (
  to: string,
  templateName: string,
  parameters: string[]
) => {
  const response = await axios.post(
    `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: `91${to.replace(/\D/g, '').slice(-10)}`, // Format Indian number
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: parameters.map(p => ({ type: 'text', text: p }))
        }]
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};
```

---

## Message Templates

Templates must be pre-approved by Meta before use.

### Template 1: OTP Verification
```
Name: autoform_otp
Category: AUTHENTICATION
Language: English

Body:
Your AutoForm verification code is {{1}}. 
Valid for 10 minutes. Do not share this code.
```

### Template 2: Warranty Confirmation (Customer)
```
Name: warranty_confirmed
Category: UTILITY
Language: English

Body:
Hi {{1}},
Your warranty for {{2}} ({{3}}) has been registered!
Serial No: {{4}}
Vehicle: {{5}}

Thank you for choosing AutoForm.
```

### Template 3: Vendor Approval Request
```
Name: vendor_approval_request
Category: UTILITY
Language: English

Body:
New warranty pending approval:
Customer: {{1}}
Product: {{2}}
Vehicle: {{3}}

Please verify in your dashboard.
```

### Template 4: Warranty Approved
```
Name: warranty_approved
Category: UTILITY
Language: English

Body:
Great news, {{1}}!
Your warranty {{2}} has been APPROVED.

You can download your warranty certificate from the AutoForm portal.
```

### Template 5: Warranty Rejected
```
Name: warranty_rejected
Category: UTILITY
Language: English

Body:
Hi {{1}},
Your warranty {{2}} requires attention.
Reason: {{3}}

Please contact support or resubmit.
```

---

## Where We'll Use WhatsApp in Portal

### Current Flow with Email:
```
Registration → Email OTP → Submit Warranty → Email to Vendor 
→ Vendor Approves → Email to Customer
```

### New Flow with WhatsApp:
```
Registration → WhatsApp OTP ✅
→ Submit Warranty → WhatsApp to Vendor ✅
→ Vendor Approves → WhatsApp to Customer ✅
→ Email warranty document (PDF) 📧
```

### Integration Points in Code:

| Action | Current | New |
|--------|---------|-----|
| OTP Verification | `email.service.ts` | `whatsapp.service.ts` |
| Vendor Notification | `email.service.ts` | `whatsapp.service.ts` |
| Customer Approval | `email.service.ts` | `whatsapp.service.ts` |
| Warranty PDF | `email.service.ts` | Keep email (for document) |

---

## Cost Summary

| Message Type | Cost (₹) | Monthly (1k registrations) |
|--------------|----------|---------------------------|
| OTP | 0.145 | ₹145 |
| Customer Confirmation | 0.145 | ₹145 |
| Vendor Alert | 0.145 | ₹145 |
| Approval/Rejection | 0.145 | ₹145 |
| **Total** | | **₹580/month** |

**Annual Cost:** ₹6,960/year

---

## Next Steps Checklist

- [ ] Create Meta Business Account
- [ ] Register business phone number
- [ ] Submit business verification documents
- [ ] Create WhatsApp templates (5 templates)
- [ ] Wait for template approval (24-48 hrs)
- [ ] Share credentials with developer
- [ ] Implement `whatsapp.service.ts`
- [ ] Test with sandbox
- [ ] Deploy to production

---

*Document prepared for AutoForm India*
*Last updated: January 2026*
