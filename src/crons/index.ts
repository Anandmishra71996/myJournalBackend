/**
 * Cron Jobs Index
 * 
 * All cron jobs are independent and can be run separately.
 * Each cron job is self-contained with its own database connection.
 */

export { sendJournalingReminder } from './sendJournalingReminder';

/**
 * Cron Job Scheduling Guide:
 * 
 * Using crontab (Linux/Mac):
 *   - Edit crontab: crontab -e
 *   - Add entries:
 *     0 9 * * * cd /path/to/backend && npm run cron:send-journaling-reminder
 *     0 20 * * * cd /path/to/backend && npm run cron:send-other-reminder
 * 
 * Using Docker/Kubernetes:
 *   - Use a cronjob resource with the cron command
 * 
 * Using node-cron (for in-process scheduling):
 *   - See notification.scheduler.ts for reference implementation
 */
