import { Request, Response } from "express";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendStatusChangeNotification } from "../utils/emailService";
import EventApplication from "../models/EventApplication";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Fighter from "../models/Fighter";
import { ServerSocket } from "../socket";

const getEventDateTime = (dateStr: string, timeStr: string) => {
  return new Date(`${dateStr}T${timeStr}:00`);
};

const updateEventStatuses = async () => {
  const now = new Date();
  const events = await Event.findAll({ where: { status: "upcoming" } });

  for (const event of events) {
    if (event.event_date && event.started_time) {
      const eventTime = getEventDateTime(event.event_date, event.started_time);

      if (eventTime <= now) {
        await event.update({ status: "live" });

        const subs = await Subscriber.findAll({
          where: { isActive: true },
          attributes: ["email"],
        });
        const emailList = subs.map((s) => s.email);
        if (emailList.length > 0) {
          sendStatusChangeNotification(emailList, event.toJSON()).catch(
            console.error
          );
        }

        if (ServerSocket.instance) {
          ServerSocket.instance.io.emit("events_updated", {
            eventId: event.id,
            status: "live",
            message: "Event is now live",
          });
        }
      }
    }
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  const { status } = req.query;
  try {
    await updateEventStatuses();

    const where: any = {};
    if (status) where.status = status;

    const events = await Event.findAll({
      where,
      order: [
        ["event_date", "DESC"],
        ["started_time", "DESC"],
      ],
      attributes: [
        "id",
        "title",
        "event_date",
        "started_time",
        "finished_time",
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

    if (ServerSocket.instance) {
      ServerSocket.instance.io.emit("events_updated", {
        eventId: newEvent.id,
        message: "New event created",
      });
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (req.body.event_date && req.body.started_time) {
      const eventDateTime = getEventDateTime(
        req.body.event_date,
        req.body.started_time
      );
      const now = new Date();

      if (eventDateTime > now) {
        req.body.status = "upcoming";
      } else {
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        if (eventDateTime > twelveHoursAgo) {
          req.body.status = "live";
        } else {
          req.body.status = "completed";
        }
      }
    }

    if (req.body.status === "completed" && event.status !== "completed") {
      req.body.finished_time = new Date();
    }

    await event.update(req.body);

    if (ServerSocket.instance) {
      ServerSocket.instance.io.emit("events_updated", {
        eventId: event.id,
        message: "Event details updated",
      });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const endEvent = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.update({
      status: "completed",
      finished_time: new Date(),
    });

    if (ServerSocket.instance) {
      ServerSocket.instance.io.emit("events_updated", {
        eventId: event.id,
        status: "completed",
        message: "Event has ended",
      });
    }

    const subs = await Subscriber.findAll({
      where: { isActive: true },
      attributes: ["email"],
    });
    const emailList = subs.map((s) => s.email);
    if (emailList.length > 0) {
      sendStatusChangeNotification(emailList, event.toJSON()).catch(
        console.error
      );
    }

    res.json({ message: "Event marked as completed", event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const deleted = await Event.destroy({ where: { id: req.params.id as string } });
    if (!deleted) return res.status(404).json({ message: "Event not found" });

    if (ServerSocket.instance) {
      ServerSocket.instance.io.emit("events_updated", {
        eventId: req.params.id,
        message: "Event deleted",
      });
    }

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await updateEventStatuses();
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

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
        if (application) application_status = application.status;
      } catch (error) { }
    }

    res.json({ ...event.toJSON(), application_status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const joinEvent = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  // @ts-ignore
  const userId = req.user.id;

  try {
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

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
  const id = req.params.id as string;
  try {
    const applications = await EventApplication.findAll({
      where: { event_id: id, status: "approved" },
      include: [
        {
          model: User,
          required: true,
          include: [{ model: Fighter, required: true }],
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

export const getEventFighters = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { division } = req.query;

  try {
    const whereClause: any = {
      status: "verified",
    };

    if (division && division !== "Open Weight" && division !== "") {
      whereClause.division = division;
    }

    const fighters = await Fighter.findAll({
      where: whereClause,
      order: [["wins", "DESC"]],
    });

    res.json(fighters);
  } catch (error) {
    console.error("Error fetching event fighters:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
