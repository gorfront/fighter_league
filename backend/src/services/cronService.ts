// import cron from "node-cron";
// import { Op } from "sequelize";
// import Event from "../models/Event";
// import Subscriber from "../models/Subscriber";
// import { sendStatusChangeNotification } from "../utils/emailService";
// import { updateFighterRanks } from "./rankingService";

// export const initCronJobs = () => {
//   cron.schedule("* * * * *", async () => {
//     const now = new Date();
//     const dateOnly = now.toISOString().split("T")[0];
//     const timeOnly = now.toISOString().split("T")[1].slice(0, 5);

//     console.log(`[Cron] Global UTC Time: ${dateOnly} ${timeOnly}`);

//     try {
//       const eventsToStart = await Event.findAll({
//         where: {
//           status: "upcoming",
//           [Op.or]: [
//             { event_date: { [Op.lt]: dateOnly } },
//             {
//               [Op.and]: [
//                 { event_date: dateOnly },
//                 { started_time: { [Op.lte]: timeOnly } },
//               ],
//             },
//           ],
//         },
//       });

//       if (eventsToStart.length > 0) {
//         console.log(`[Cron] Found ${eventsToStart.length} events to activate.`);

//         const subs = await Subscriber.findAll({
//           where: { isActive: true },
//           attributes: ["email"],
//         });
//         const emailList = subs.map((s) => s.email);

//         for (const event of eventsToStart) {
//           console.log(`🔔 Transitioning event to LIVE: ${event.title}`);

//           await event.update({ status: "live" });

//           if (emailList.length > 0) {
//             sendStatusChangeNotification(emailList, event.toJSON()).catch(
//               (err) => console.error(`Email failed for ${event.title}:`, err)
//             );
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Cron Job Error:", error);
//     }
//   });
//   cron.schedule("0 0 * * *", async () => {
//     await updateFighterRanks();
//   });
// };

import cron from "node-cron";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendStatusChangeNotification } from "../utils/emailService";
import { updateFighterRanks } from "./rankingService";
import moment from "moment-timezone";

export const initCronJobs = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    // 1. Fetch ALL upcoming events
    // We filter in JS because every event might have a different timezone
    const upcomingEvents = await Event.findAll({
      where: { status: "upcoming" },
    });

    if (upcomingEvents.length === 0) return;

    const eventsToStart = [];

    // 2. Check each event against ITS OWN timezone
    for (const event of upcomingEvents) {
      // If the event has no timezone saved, default to UTC
      const tz = event.timezone || "UTC";

      // Combine the stored date and time strings
      // Format assumption: event_date is "YYYY-MM-DD", started_time is "HH:mm"
      const eventDateTimeString = `${event.event_date}T${event.started_time}`;

      // Parse the event time in its specific timezone
      const eventTime = moment.tz(eventDateTimeString, "YYYY-MM-DDTHH:mm", tz);

      // Get "Now" in that same timezone
      const now = moment.tz(tz);

      // 3. Compare: Is "Now" past the "Event Start Time"?
      if (now.isSameOrAfter(eventTime)) {
        eventsToStart.push(event);
      }
    }

    // 4. Process the events that need to start
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

  // Daily ranking update
  cron.schedule("0 0 * * *", async () => {
    await updateFighterRanks();
  });
};
