import { logger } from "../utils/logger";
import { Journal } from "../models/journal.model";
import { User } from "../models/user.model";
import pushService from "../services/push.service";

/**
 * Cron Job: Send Journaling Reminders
 *
 * Sends push notifications to users who haven't written a journal entry today.
 * Uses the shared MongoDB connection pool from the main application.
 * Scheduled via node-cron in crons/index.ts
 */

// Journal icon as SVG data URI
const JOURNAL_ICON: string = `data:image/svg+xml;base64,${Buffer.from(
  `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">
  <rect x="12" y="8" width="40" height="48" rx="2" fill="#4F46E5" stroke="#312E81" stroke-width="2"/>
  <rect x="14" y="6" width="40" height="48" rx="2" fill="#6366F1" stroke="#4F46E5" stroke-width="2"/>
  <line x1="20" y1="18" x2="48" y2="18" stroke="#E0E7FF" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="26" x2="48" y2="26" stroke="#E0E7FF" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="34" x2="42" y2="34" stroke="#E0E7FF" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="42" x2="45" y2="42" stroke="#E0E7FF" stroke-width="2" stroke-linecap="round"/>
  <circle cx="54" cy="48" r="2" fill="#FCD34D"/>
</svg>
`
).toString("base64")}`;

export async function sendJournalingReminder(): Promise<void> {
  try {
    logger.info("Starting journaling reminder cron job");

    // Get today's date (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    logger.info(
      `Checking for users without journal entries between ${today.toISOString()} and ${tomorrow.toISOString()}`
    );

    // Find all users with push subscriptions enabled
    const usersWithPushEnabled = await User.find({
      pushNotificationsEnabled: true,
      deletedAt: null, // Exclude deleted users
    }).select("_id email");

    logger.info(
      `Found ${usersWithPushEnabled.length} users with push notifications enabled`
    );

    let remindersSent = 0;
    let remindersSkipped = 0;

    // For each user, check if they've written a journal entry today
    for (const user of usersWithPushEnabled) {
      try {
        const entryTodayCount = await Journal.countDocuments({
          userId: user._id,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        });

        // Only send reminder if user hasn't written an entry yet
        if (entryTodayCount === 0) {
          logger.debug(
            `No journal entry for user ${user._id}. Sending reminder.`
          );

          // Send push notification reminder
          try {
            await pushService.sendNotificationToUser(user._id.toString(), {
              title: "📔 Time to Journal!",
              body: "It's been a while! Share your thoughts and reflections for today.",
              icon: JOURNAL_ICON,
              data: {
                action: "open_journal",
                timestamp: new Date().toISOString(),
              },
            });

            remindersSent++;
            logger.info(`Journaling reminder sent to user ${user._id}`);
          } catch (notifError) {
            logger.warn(
              `Failed to send notification to user ${user._id}:`,
              notifError
            );
          }
        } else {
          remindersSkipped++;
          logger.debug(
            `User ${user._id} already has ${entryTodayCount} journal entry/entries today`
          );
        }
      } catch (userError) {
        logger.error(`Error processing user ${user._id}:`, userError);
      }
    }

    logger.info(
      `Journaling reminder cron job completed: ${remindersSent} reminders sent, ${remindersSkipped} skipped`
    );
  } catch (error) {
    logger.error("Error in sendJournalingReminder cron job:", error);
    // Don't throw - let the cron continue running
  }
}
