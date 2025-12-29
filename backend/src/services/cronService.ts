import cron from "node-cron";
import { Op } from "sequelize";
import Event from "../models/Event";

export const initCronJobs = () => {
  // Check every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      // Set to LIVE if start time has passed
      await Event.update(
        { status: "live" },
        {
          where: {
            status: "upcoming",
            event_date: { [Op.lte]: now },
          },
        }
      );

      // Optional: Set to COMPLETED if 6 hours passed
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      await Event.update(
        { status: "completed" },
        {
          where: {
            status: "live",
            event_date: { [Op.lte]: sixHoursAgo },
          },
        }
      );
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
};
