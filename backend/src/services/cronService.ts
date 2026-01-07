import cron from "node-cron";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendStatusChangeNotification } from "../utils/emailService";
import { updateFighterRanks } from "./rankingService";
import moment from "moment-timezone";

export const initCronJobs = () => {
  cron.schedule("* * * * *", async () => {
    const upcomingEvents = await Event.findAll({
      where: { status: "upcoming" },
    });

    if (upcomingEvents.length === 0) return;

    const eventsToStart = [];

    for (const event of upcomingEvents) {
      const tz = event.timezone || "UTC";

      const eventDateTimeString = `${event.event_date}T${event.started_time}`;

      const eventTime = moment.tz(eventDateTimeString, "YYYY-MM-DDTHH:mm", tz);

      const now = moment.tz(tz);

      if (now.isSameOrAfter(eventTime)) {
        eventsToStart.push(event);
      }
    }

    if (eventsToStart.length > 0) {
      console.log(`[Cron] activating ${eventsToStart.length} events...`);

      const subs = await Subscriber.findAll({
        where: { isActive: true },
        attributes: ["email"],
      });
      const emailList = subs.map((s) => s.email);

      for (const event of eventsToStart) {
        console.log(`🔔 Transitioning event to LIVE: ${event.title}`);

        await event.update({ status: "live" });

        if (emailList.length > 0) {
          sendStatusChangeNotification(emailList, event.toJSON()).catch((err) =>
            console.error(`Email failed for ${event.title}:`, err)
          );
        }
      }
    }
  });

  cron.schedule("0 0 * * *", async () => {
    await updateFighterRanks();
  });
};
