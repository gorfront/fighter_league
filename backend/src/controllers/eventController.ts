import { Request, Response } from "express";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendStatusChangeNotification } from "../utils/emailService";
import EventApplication from "../models/EventApplication";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Fighter from "../models/Fighter";
import { ServerSocket } from "../socket";
import { asyncHandler, AppError } from "../utils/errorHandling";

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

export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
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
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const newEvent = await Event.create(req.body);

  if (ServerSocket.instance) {
    ServerSocket.instance.io.emit("events_updated", {
      eventId: newEvent.id,
      message: "New event created",
    });
  }

  res.status(201).json(newEvent);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const event = await Event.findByPk(id);
  if (!event) throw new AppError("Event not found", 404);

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
});

export const endEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await Event.findByPk(id);
  if (!event) throw new AppError("Event not found", 404);

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
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await Event.destroy({ where: { id: req.params.id as string } });
  if (!deleted) throw new AppError("Event not found", 404);

  if (ServerSocket.instance) {
    ServerSocket.instance.io.emit("events_updated", {
      eventId: req.params.id,
      message: "Event deleted",
    });
  }

  res.json({ message: "Event deleted" });
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const event = await Event.findByPk(id);
  if (!event) throw new AppError("Event not found", 404);

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
});

export const joinEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  // @ts-ignore
  const userId = req.user.id;

  const event = await Event.findByPk(id);
  if (!event) throw new AppError("Event not found", 404);

  const existing = await EventApplication.findOne({
    where: { event_id: id, user_id: userId },
  });

  if (existing) {
    throw new AppError("You have already applied to this event.", 400);
  }

  await EventApplication.create({
    event_id: id,
    user_id: userId,
    status: "pending",
  });

  res.status(201).json({ message: "Application sent successfully!" });
});

export const getApprovedFightersForEvent = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const id = req.params.id as string;
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
});

export const getEventFighters = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { division } = req.query;

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
});
