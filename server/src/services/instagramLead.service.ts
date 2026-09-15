import { routeEnquiry } from './asmRouting.service.js';
import { parseLeadForm } from './instagramLeadParser.js';

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
 * reached us and the one an ASM can call back.
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
        // seeing, because it is also how a renamed City field would show up.
        console.log('[Instagram] unmapped form fields:', JSON.stringify(lead.unmapped));
    }

    if (!lead.city) {
        console.warn(
            `[Instagram] lead from ${senderPhone} has no city — cannot route. ` +
            `Fields seen: ${JSON.stringify(lead)}`
        );
    }

    await routeEnquiry({
        // No city means no route, but it is still recorded as unmatched rather
        // than dropped — an ad form that stopped asking for the city is exactly
        // the kind of thing that must not fail silently.
        area: lead.city || '',
        phone: senderPhone,
        name: lead.name,
        product: lead.product,
        car: lead.car,
        source: 'instagram',
        rawPayload: rawPayload ?? { text },
    });

    return true;
}
