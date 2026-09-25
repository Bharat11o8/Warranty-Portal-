import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';
import { IvrWebhookController } from '../controllers/ivrWebhook.controller.js';

const router = Router();

/**
 * POST /api/webhooks/interakt
 * Receives incoming WhatsApp messages and button replies from Interakt.
 * No session auth — secured by INTERAKT_WEBHOOK_SECRET header verification inside the controller.
 */
router.post('/interakt', WebhookController.handleInterakt);

/**
 * /api/webhooks/ivr?key=…
 * The IVR provider's HTTP hook. Capture only until the payload is known —
 * see IvrWebhookController.
 */
router.get('/ivr', IvrWebhookController.handle);
router.post('/ivr', IvrWebhookController.handle);

export default router;
