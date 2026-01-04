import cron from "node-cron";
import { Op } from "sequelize";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendStatusChangeNotification } from "../utils/emailService";

export const initCronJobs = () => {
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    // Use locale strings to respect the TZ environment variable
    // This ensures dateOnly and timeOnly match your actual timezone
    const dateOnly = now.toLocaleDateString("en-CA"); // Formats as YYYY-MM-DD
    const timeOnly = now.toTimeString().slice(0, 5); // Formats as HH:mm

    console.log(
      `[Cron Check] Server Time: ${dateOnly} ${timeOnly} | Status: searching...`
    );

    try {
      const eventsToStart = await Event.findAll({
        where: {
          status: "upcoming",
          [Op.or]: [
            // 1. Event date is strictly in the past (e.g., yesterday)
            { event_date: { [Op.lt]: dateOnly } },
            // 2. Event date is today AND start time has arrived or passed
            {
              [Op.and]: [
                { event_date: dateOnly },
                { started_time: { [Op.lte]: timeOnly } },
              ],
            },
          ],
        },
      });

      if (eventsToStart.length > 0) {
        console.log(`[Cron] Found ${eventsToStart.length} events to activate.`);

        const subs = await Subscriber.findAll({
          where: { isActive: true },
          attributes: ["email"],
        });
        const emailList = subs.map((s) => s.email);

        for (const event of eventsToStart) {
          console.log(`🔔 Transitioning event to LIVE: ${event.title}`);

          await event.update({ status: "live" });

          if (emailList.length > 0) {
            sendStatusChangeNotification(emailList, event.toJSON()).catch(
              (err) => console.error(`Email failed for ${event.title}:`, err)
            );
          }
        }
      }
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
};
