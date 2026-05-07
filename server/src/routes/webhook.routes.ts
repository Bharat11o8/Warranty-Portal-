import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router = Router();

/**
 * POST /api/webhooks/interakt
 * Receives incoming WhatsApp messages and button replies from Interakt.
 * No session auth — secured by INTERAKT_WEBHOOK_SECRET header verification inside the controller.
 */
router.post('/interakt', WebhookController.handleInterakt);

export default router;
