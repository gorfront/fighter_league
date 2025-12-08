import { Request, Response } from "express";
import Event from "../models/Event";

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
