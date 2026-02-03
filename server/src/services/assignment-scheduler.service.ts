import db from '../config/database.js';
import { getISTTimestamp } from '../utils/dateUtils.js';
import { EmailService } from './email.service.js';

/**
 * Service to handle automated background tasks for grievance assignments
 */
export class AssignmentSchedulerService {
    private static checkInterval: NodeJS.Timeout | null = null;

    /**
     * Start the scheduler
     * Suggested to call this in index.ts or on server startup
     */
    static start() {
        if (this.checkInterval) return;

        console.log('🕒 Assignment Scheduler: Started');

        // Check every hour (3600000 ms)
        // For production, daily check might be better: 24 * 60 * 60 * 1000
        this.checkInterval = setInterval(() => {
            this.checkOverdueAssignments();
        }, 1 * 60 * 60 * 1000);

        // Initial check on startup
        this.checkOverdueAssignments();
    }

    /**
     * Stop the scheduler
     */
    static stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('🕒 Assignment Scheduler: Stopped');
        }
    }

    /**
     * Identify and notify overdue assignments
     */
    static async checkOverdueAssignments() {
        console.log('🕒 Assignment Scheduler: Checking for overdue tasks...');

        try {
            const istTimestamp = getISTTimestamp();
            const istDate = istTimestamp.split(' ')[0];
            const istHour = parseInt(istTimestamp.split(' ')[1].split(':')[0]);

            // Find the LATEST assignment for each grievance-assignee pair that is:
            // 1. Still pending
            // 2. (Past its expected resolution date) OR (Today is the date AND it's 5:00 PM or later)
            // 3. Haven't been followed up in the last 24 hours
            const [overdueRows]: any = await db.execute(`
                SELECT ga.*, g.ticket_id, g.category, g.subject, g.description,
                       p.name as customer_name,
                       vd.store_name as franchise_name
                FROM grievance_assignments ga
                JOIN (
                    SELECT grievance_id, assignee_email, MAX(id) as max_id
                    FROM grievance_assignments
                    GROUP BY grievance_id, assignee_email
                ) latest ON ga.id = latest.max_id
                JOIN grievances g ON ga.grievance_id = g.id
                LEFT JOIN profiles p ON g.customer_id = p.id
                LEFT JOIN vendor_details vd ON g.franchise_id = vd.id
                WHERE ga.status = 'pending' 
                AND (
                    ga.estimated_completion_date < ? 
                    OR (ga.estimated_completion_date = ? AND ? >= 17)
                )
                AND (ga.last_follow_up_at IS NULL OR ga.last_follow_up_at < ?)
            `, [istDate, istDate, istHour, this.getTimestampMinusHours(24)]);

            if (!overdueRows || overdueRows.length === 0) {
                console.log('🕒 Assignment Scheduler: No overdue tasks found.');
                return;
            }

            console.log(`🕒 Assignment Scheduler: Found ${overdueRows.length} overdue tasks. Sending follow-ups...`);

            for (const row of overdueRows) {
                await this.sendFollowUp(row);
            }

        } catch (error) {
            console.error('🕒 Assignment Scheduler Error:', error);
        }
    }

    /**
     * Send follow-up email and CREATE A NEW HISTORY RECORD
     */
    private static async sendFollowUp(assignment: any) {
        try {
            const followUpSent = await EmailService.sendGrievanceAssignmentEmail(
                assignment.assignee_email,
                assignment.assignee_name,
                {
                    ticket_id: assignment.ticket_id,
                    category: assignment.category,
                    subject: `FOLLOW-UP: ${assignment.subject}`,
                    description: assignment.description,
                    customer_name: assignment.customer_name || 'Customer',
                    franchise_name: assignment.franchise_name,
                    created_at: assignment.created_at,
                    estimated_completion_date: assignment.estimated_completion_date
                },
                `This is an automated follow-up reminder. Your assigned task for Ticket #${assignment.ticket_id} is past its expected resolution date. Please provide an update as soon as possible.`,
                assignment.update_token // We can reuse the token or generate a new one. 
                // Using the same token makes the link in the new email point to the SAME update page.
            );

            if (followUpSent) {
                // 1. Update the original record's last_follow_up_at and mark it as 'sent'
                await db.execute(
                    'UPDATE grievance_assignments SET last_follow_up_at = ?, status = "follow_up_sent" WHERE id = ?',
                    [getISTTimestamp(), assignment.id]
                );

                // 2. INSERT A NEW RECORD for the history (as requested by user)
                // This record will be the new "latest" one
                await db.execute(
                    `INSERT INTO grievance_assignments 
                     (grievance_id, assignee_name, assignee_email, remarks, assignment_type, email_sent_at, sent_by, sent_by_name, estimated_completion_date, update_token, status)
                     VALUES (?, ?, ?, ?, 'follow_up', ?, 0, 'System Scheduler', ?, ?, 'pending')`,
                    [
                        assignment.grievance_id,
                        assignment.assignee_name,
                        assignment.assignee_email,
                        `Automated follow-up sent: Past expected resolution date (${assignment.estimated_completion_date})`,
                        getISTTimestamp(),
                        assignment.estimated_completion_date,
                        assignment.update_token, // Keeping the same token for consistency in the update portal
                    ]
                );

                console.log(`🕒 Assignment Scheduler: Follow-up logged for Ticket #${assignment.ticket_id} to ${assignment.assignee_email}`);
            }
        } catch (error) {
            console.error(`🕒 Assignment Scheduler: Failed to send follow-up for Ticket #${assignment.ticket_id}`, error);
        }
    }

    private static getTimestampMinusHours(hours: number): string {
        const date = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const targetTime = new Date(date.getTime() + istOffset - (hours * 60 * 60 * 1000));

        const get = (d: Date) => {
            const y = d.getUTCFullYear();
            const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
            const da = String(d.getUTCDate()).padStart(2, '0');
            const h = String(d.getUTCHours()).padStart(2, '0');
            const m = String(d.getUTCMinutes()).padStart(2, '0');
            const s = String(d.getUTCSeconds()).padStart(2, '0');
            return `${y}-${mo}-${da} ${h}:${m}:${s}`;
        };

        return get(targetTime);
    }
}
