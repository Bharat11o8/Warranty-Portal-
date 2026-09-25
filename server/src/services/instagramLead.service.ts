import { routeEnquiry } from './asmRouting.service.js';
import { parseLeadForm } from './instagramLeadParser.js';
import { startStoreEnquiry } from './storeLocatorChat.js';
import { extractPincode } from './storeLocator.js';

/* Re-exported so callers and tests can reach the parser through either
   module; the reading itself has no database import. */
export { parseLeadForm } from './instagramLeadParser.js';
export type { ParsedLead } from './instagramLeadParser.js';

/**
 * Route an Instagram lead-form message, if that is what it is.
 *
 * Returns false when the message is not a lead form, so the caller can carry on
 * treating it as an ordinary enquiry.
 *
 * The phone comes from the WhatsApp sender, not the form: the form field is
 * typed and can be wrong, while the sender's number is the one that actually
 * reached us and the one a store can call back.
 *
 * Since late September 2026 the ad forms ask for a pincode, and a lead with
 * one goes through the store locator exactly like the Interakt workflow: the
 * customer has just messaged us, so the store list can go straight back to
 * them, and the store they pick is alerted. Stores, then the ASM, then
 * distributors, then support — one flow whichever door the customer came in by.
 *
 *   a pincode (or a city answer that is one)  -> the store locator
 *   a pincode question, but no pincode in it  -> the locator asks for one
 *   an older form asking only for the city    -> the ASM by city, as before
 */
export async function handleInstagramLead(
    text: string,
    senderPhone: string,
    rawPayload?: any
): Promise<boolean> {
    const lead = parseLeadForm(text);
    if (!lead) return false;

    if (Object.keys(lead.unmapped).length) {
        // Not an error — a new ad asking something we have no column for. Worth
        // seeing, because it is also how a renamed pincode field would show up.
        console.log('[Instagram] unmapped form fields:', JSON.stringify(lead.unmapped));
    }

    const payload = rawPayload ?? { text };
    const pincode = extractPincode(lead.pincode) ?? extractPincode(lead.city);

    // A pincode form, whether or not the answer holds one: the locator either
    // runs, or asks the customer for the pincode and keeps the lead meanwhile.
    if (pincode || lead.pincode !== null || !lead.city) {
        await startStoreEnquiry({
            pincode: pincode ?? lead.pincode ?? '',
            phone: senderPhone,
            name: lead.name,
            product: lead.product,
            car: lead.car,
            source: 'instagram',
            rawPayload: payload,
        });
        return true;
    }

    // An older form that asks only for the city: the ASM for that place.
    await routeEnquiry({
        area: lead.city,
        phone: senderPhone,
        name: lead.name,
        product: lead.product,
        car: lead.car,
        source: 'instagram',
        rawPayload: payload,
    });
    return true;
}
