import cron from "node-cron";
import { Op } from "sequelize";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendStatusChangeNotification } from "../utils/emailService";

export const initCronJobs = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const dateOnly = now.toISOString().split("T")[0];
    const timeOnly = now.toTimeString().slice(0, 5);

    try {
      const eventsToStart = await Event.findAll({
        where: {
          status: "upcoming",
          [Op.or]: [
            { event_date: { [Op.lt]: dateOnly } },
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
