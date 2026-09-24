import { Router } from 'express';
import GrievanceController from '../controllers/grievance.controller.js';
import { signalAdminAttentionOnSuccess as signalAttention } from '../services/adminAttention.service.js';

const router = Router();

// Public routes for external assignees (using secure tokens)
router.get('/details/:token', GrievanceController.getAssignmentByToken);
router.post('/update/:token', signalAttention, GrievanceController.updateAssignmentByToken);

export default router;
