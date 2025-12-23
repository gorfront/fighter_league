import { Request, Response } from "express";
import Event from "../models/Event";
import Subscriber from "../models/Subscriber";
import { sendEventNotification } from "../utils/emailService";

export const getAllEvents = async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
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
  // ... validation logic ...

  try {
    const newEvent = await Event.create(req.body);

    // --- 🚀 NEW NOTIFICATION LOGIC ---
    // 1. Fetch all active subscribers
    const subscribers = await Subscriber.findAll({
      where: { isActive: true },
      attributes: ["email"], // Only need email
    });

    const emailList = subscribers.map((s) => s.email);

    // 2. Trigger Email (Don't await this if you want a fast response to the admin)
    // Passing "NEW" type
    if (emailList.length > 0) {
      sendEventNotification(emailList, newEvent.toJSON(), "NEW");
    }
    // ---------------------------------

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

    // Update
    await event.update(req.body);

    // --- 🚀 UPDATE NOTIFICATION LOGIC ---
    // Only send if important fields changed (Optional check)
    // For now, we send on every update action
    const subscribers = await Subscriber.findAll({
      where: { isActive: true },
      attributes: ["email"],
    });

    const emailList = subscribers.map((s) => s.email);

    if (emailList.length > 0) {
      sendEventNotification(emailList, event.toJSON(), "UPDATE");
    }
    // ------------------------------------

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
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
