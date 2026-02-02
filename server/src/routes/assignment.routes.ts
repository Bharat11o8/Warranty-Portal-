import { Router } from 'express';
import GrievanceController from '../controllers/grievance.controller.js';

const router = Router();

// Public routes for external assignees (using secure tokens)
router.get('/details/:token', GrievanceController.getAssignmentByToken);
router.post('/update/:token', GrievanceController.updateAssignmentByToken);

export default router;
