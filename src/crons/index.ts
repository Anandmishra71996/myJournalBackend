import cron, { ScheduledTask } from "node-cron";
import { logger } from "../utils/logger";
import { sendJournalingReminder } from "./sendJournalingReminder";

/**
 * Cron Jobs Scheduler
 *
 * Manages all scheduled cron jobs using node-cron.
 * All jobs share the same MongoDB connection pool from the main application.
 */

// Store all scheduled tasks for cleanup
const scheduledTasks: ScheduledTask[] = [];

/**
 * Initialize and start all cron jobs
 * Should be called after database connection is established
 */
export function initializeCronJobs(): void {
  logger.info("Initializing cron jobs...");

  // Schedule journaling reminder - runs daily at 9:00 AM
  // Cron format: minute hour day month dayOfWeek
  const journalingReminderTask = cron.schedule(
    "0 21 * * *",
    async () => {
      logger.info("Running scheduled journaling reminder cron job");
      await sendJournalingReminder();
    },
    {
      timezone: process.env.CRON_TIMEZONE || "America/New_York",
    }
  );

  scheduledTasks.push(journalingReminderTask);
  logger.info("✓ Journaling reminder scheduled for 9:00 PM daily");

  // Add more cron jobs here as needed
  // Example:
  // const weeklyInsightTask = cron.schedule('0 20 * * 0', async () => {
  //     logger.info('Running weekly insight generation cron job');
  //     await generateWeeklyInsights();
  // });
  // scheduledTasks.push(weeklyInsightTask);

  logger.info(`Successfully initialized ${scheduledTasks.length} cron job(s)`);
}

/**
 * Stop all running cron jobs
 * Useful for graceful shutdown
 */
export function stopCronJobs(): void {
  logger.info("Stopping all cron jobs...");
  scheduledTasks.forEach((task) => {
    task.stop();
  });
  logger.info("All cron jobs stopped");
}

/**
 * Get the status of all cron jobs
 */
export function getCronJobsStatus(): { total: number; running: number } {
  return {
    total: scheduledTasks.length,
    running: scheduledTasks.filter((task) => task.getStatus() === "scheduled")
      .length,
  };
}

// Export individual cron functions for testing or manual execution
export { sendJournalingReminder } from "./sendJournalingReminder";
