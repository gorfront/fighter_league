// import { Request, Response } from "express";
// import Event from "../models/Event";
// import Subscriber from "../models/Subscriber";
// import { sendEventNotification } from "../utils/emailService";
// import EventApplication from "../models/EventApplication";
// import jwt from "jsonwebtoken";
// import User from "../models/User";
// import Fighter from "../models/Fighter";

// export const getAllEvents = async (req: Request, res: Response) => {
//   const { status } = req.query;

//   try {
//     const where: any = {};

//     if (status) {
//       where.status = status;
//     }

//     const events = await Event.findAll({
//       where,
//       order: [["event_date", "DESC"]],
//       attributes: [
//         "id",
//         "title",
//         "event_date",
//         "location",
//         "division",
//         "status",
//       ],
//     });

//     res.status(200).json(events);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const createEvent = async (req: Request, res: Response) => {
//   try {
//     const newEvent = await Event.create(req.body);
//     const subscribers = await Subscriber.findAll({
//       where: { isActive: true },
//       attributes: ["email"],
//     });

//     const emailList = subscribers.map((s) => s.email);

//     if (emailList.length > 0) {
//       sendEventNotification(emailList, newEvent.toJSON(), "NEW");
//     }

//     res.status(201).json(newEvent);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const updateEvent = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   try {
//     const event = await Event.findByPk(id);
//     if (!event) return res.status(404).json({ message: "Event not found" });

//     await event.update(req.body);

//     const subscribers = await Subscriber.findAll({
//       where: { isActive: true },
//       attributes: ["email"],
//     });

//     const emailList = subscribers.map((s) => s.email);

//     if (emailList.length > 0) {
//       sendEventNotification(emailList, event.toJSON(), "UPDATE");
//     }

//     res.json(event);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const getEventById = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   try {
//     const event = await Event.findByPk(id);

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     let application_status = null;
//     const authHeader = req.headers.authorization;

//     if (authHeader && authHeader.startsWith("Bearer")) {
//       try {
//         const token = authHeader.split(" ")[1];
//         const decoded: any = jwt.verify(
//           token,
//           process.env.JWT_SECRET as string
//         );

//         const application = await EventApplication.findOne({
//           where: { event_id: id, user_id: decoded.id },
//         });

//         if (application) {
//           application_status = application.status;
//         }
//       } catch (error) {}
//     }

//     res.json({
//       ...event.toJSON(),
//       application_status,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const deleteEvent = async (req: Request, res: Response) => {
//   try {
//     const deleted = await Event.destroy({ where: { id: req.params.id } });
//     if (!deleted) return res.status(404).json({ message: "Event not found" });
//     res.json({ message: "Event deleted" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const joinEvent = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   // @ts-ignore - assuming req.user exists from auth middleware
//   const userId = req.user.id;

//   try {
//     const event = await Event.findByPk(id);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     const existing = await EventApplication.findOne({
//       where: { event_id: id, user_id: userId },
//     });

//     if (existing) {
//       return res
//         .status(400)
//         .json({ message: "You have already applied to this event." });
//     }

//     await EventApplication.create({
//       event_id: id,
//       user_id: userId,
//       status: "pending",
//     });

//     res.status(201).json({ message: "Application sent successfully!" });
//   } catch (error) {
//     console.error("Join Event Error:", error);
//     res.status(500).json({ message: "Server error joining event." });
//   }
// };

// export const getApprovedFightersForEvent = async (
//   req: Request,
//   res: Response
// ) => {
//   const { id } = req.params;

//   try {
//     const applications = await EventApplication.findAll({
//       where: {
//         event_id: id,
//         status: "approved",
//       },
//       include: [
//         {
//           model: User,
//           required: true,
//           include: [
//             {
//               model: Fighter,
//               required: true,
//             },
//           ],
//         },
//       ],
//     });

//     const fighters = applications.map((app: any) => app.User.Fighter);

//     res.json(fighters);
//   } catch (error) {
//     console.error("Error fetching event fighters:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

import { Request, Response } from "express";
import { Op } from "sequelize"; // Import Op for date comparisons
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendEventNotification } from "../utils/emailService";
import EventApplication from "../models/EventApplication";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Fighter from "../models/Fighter";

// Helper function to update statuses on the fly
const updateEventStatuses = async () => {
  const now = new Date();

  // 1. Upcoming -> Live (if start time passed)
  await Event.update(
    { status: "live" },
    {
      where: {
        status: "upcoming",
        event_date: { [Op.lte]: now },
      },
    }
  );

  // 2. Live -> Completed (optional: assuming events last ~6 hours)
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
};

export const getAllEvents = async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
    // 🔥 FIX: Check and update statuses BEFORE fetching
    await updateEventStatuses();

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const events = await Event.findAll({
      where,
      order: [["event_date", "DESC"]],
      attributes: [
        "id",
        "title",
        "event_date",
        "location",
        "division",
        "status",
      ],
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const newEvent = await Event.create(req.body);
    const subscribers = await Subscriber.findAll({
      where: { isActive: true },
      attributes: ["email"],
    });

    const emailList = subscribers.map((s) => s.email);

    if (emailList.length > 0) {
      // Don't await email to speed up response
      sendEventNotification(emailList, newEvent.toJSON(), "NEW").catch(
        console.error
      );
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.update(req.body);

    const subscribers = await Subscriber.findAll({
      where: { isActive: true },
      attributes: ["email"],
    });

    const emailList = subscribers.map((s) => s.email);

    if (emailList.length > 0) {
      sendEventNotification(emailList, event.toJSON(), "UPDATE").catch(
        console.error
      );
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 🔥 FIX: Update statuses here too, just in case
    await updateEventStatuses();

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let application_status = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        );

        const application = await EventApplication.findOne({
          where: { event_id: id, user_id: decoded.id },
        });

        if (application) {
          application_status = application.status;
        }
      } catch (error) {}
    }

    res.json({
      ...event.toJSON(),
      application_status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const deleted = await Event.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const joinEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  // @ts-ignore - assuming req.user exists from auth middleware
  const userId = req.user.id;

  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existing = await EventApplication.findOne({
      where: { event_id: id, user_id: userId },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already applied to this event." });
    }

    await EventApplication.create({
      event_id: id,
      user_id: userId,
      status: "pending",
    });

    res.status(201).json({ message: "Application sent successfully!" });
  } catch (error) {
    console.error("Join Event Error:", error);
    res.status(500).json({ message: "Server error joining event." });
  }
};

export const getApprovedFightersForEvent = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const applications = await EventApplication.findAll({
      where: {
        event_id: id,
        status: "approved",
      },
      include: [
        {
          model: User,
          required: true,
          include: [
            {
              model: Fighter,
              required: true,
            },
          ],
        },
      ],
    });

    const fighters = applications.map((app: any) => app.User.Fighter);

    res.json(fighters);
  } catch (error) {
    console.error("Error fetching event fighters:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
