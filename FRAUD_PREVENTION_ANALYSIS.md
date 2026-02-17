## 🚨 The "Ghost Installation" Loophole
You are right—we have reached the most difficult fraud scenario:
1.  **Dealer physical presence**: They are at the store.
2.  **Live Capture**: They use a "Dummy Car" in their shop to take live photos.
3.  **Original Bill**: They write the bill themselves, so the data matches perfectly.
4.  **Result**: They register a product for a 3rd-party shop while the actual car is 100km away.

In this scenario, **software checking only the Dealer's phone is useless** because the dealer is authorized and at the correct location.

---

## 🔍 The Solution: Dual-Location Verification (Dealer + Customer)

To stop a dealer from registering a car that isn't there, we must involve the **Customer's physical location** in the digital handshake.

### 1. The "Dual-GPS Sync"
**The Flow**:
1. Dealer initiates registration for a customer.
2. System sends a **Live Map Link** to the Customer's WhatsApp (instead of a plain OTP).
3. The customer must click the link to "Consent & Verify Installation Location."
4. **The Trap**: The system captures the **Customer's GPS** at the moment of clicking.
5. **The Logic**: 
   ```sql
   IF (DistanceBetween(Dealer_GPS, Customer_GPS) > 500 Meters) 
   THEN "Status: Fraud Flag - Distant Registration"
   ```
*   **Why it works**: A customer in Mumbai cannot "click to consent" while the dealer in Delhi is trying to register their warranty. The distance gap is impossible to fake.

### 2. The "Physical UID Scan" by Customer
**The Flow**: Instead of the dealer entering the 16-digit UID, the **Customer** must scan the QR code/UID on the product box using the link sent to their phone.
*   **The Logic**: The dealer has the bill, but the customer has the *physical product* 100km away.
*   **Effect**: The registration can only be completed when the **Physical Product** and the **Customer's Phone** are in the same location as the **Dealer's Bill**.

---

## 📈 Manual Interaction Refined (Admin Perspective)

Since you mentioned manual interaction is key, the system should act as a **Filter**:
1.  **The "Distant" Queue**: Every registration where the Dealer and Customer were not in the same 500m radius is moved to a "High Risk" audit.
2.  **Admin Video Call**: The Admin uses the portal's built-in "Video Call" feature to say: *"Dealer, please show me the customer and the car side-by-side right now."* (Since it's a proxy, they won't be able to).

---

## ❓ Final Question for the USER
If we implement a **"Click to Verify Location"** link for the customer during registration, would that solve the problem? This would prove whether the customer is actually standing inside the authorized store or 100km away.
