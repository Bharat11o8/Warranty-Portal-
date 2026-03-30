# WhatsApp Messaging Actual Costing

**Project:** Seal Guardian Warranty Portal  
**Rate Card (Actual):**
*   **Marketing:** ₹1.09
*   **Utility:** ₹0.145
*   **Authentication:** ₹0.145
*   **Service:** Unlimited Free Service Conversations

---

## 1. Authentication Messages (₹0.145)
*Used for secure verification and login.*

| Template Name | Use Case | Rate |
| :--- | :--- | :---: |
| `login_otp` | Customer/Franchise/Admin login verification | ₹0.145 |
| `warranty_auth_otp` | Mandatory customer OTP during warranty submission | ₹0.145 |

---

## 2. Utility Messages (₹0.145)
*Used for transactional updates and confirmations.*

| Template Name | Use Case | Rate |
| :--- | :--- | :---: |
| `warranty_confirmed` | Confirmation after successful submission | ₹0.145 |
| `warranty_approved` | Notification when warranty is activated | ₹0.145 |
| `warranty_rejected` | Notification of rejection with edit link | ₹0.145 |
| `installation_confirm` | Request sent to store to verify installation | ₹0.145 |
| `grievance_assigned` | Alert to support team about new ticket | ₹0.145 |
| `grievance_status_update` | Alert to customer about ticket progress | ₹0.145 |

---

## 3. Marketing Messages (₹1.09)
*Used for onboarding and value-added communication.*

| Template Name | Use Case | Rate |
| :--- | :--- | :---: |
| `welcome_registration` | First-time registration welcome & account info | ₹1.09 |

---

## 4. Service Conversations (FREE)
*Any replies or incoming conversations initiated by the user.*

*   **Free:** Unlimited conversations within the 24-hour service window.

---
*Reference: `server/src/services/whatsapp-templates.md`*
