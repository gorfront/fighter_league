import { Request, Response } from "express";
import { Op, ValidationError } from "sequelize";
import Subscriber from "../models/Subscriber";
import Event from "../models/Event";
import { sendWelcomeEmail } from "../utils/emailService";

export const subscribeToNewsletter = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required." });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const existing = await Subscriber.findOne({ where: { email } });

    if (existing) {
      if (!existing.isActive) {
        await existing.update({ isActive: true });
        return res
          .status(200)
          .json({ message: "Welcome back! Subscription reactivated." });
      }
      return res.status(409).json({ message: "You are already subscribed." });
    }

    await Subscriber.create({ email });

    let nextEvent = await Event.findOne({
      where: {
        event_date: {
          [Op.gte]: new Date(),
        },
      },
      order: [["event_date", "ASC"]],
    });

    if (!nextEvent) {
      nextEvent = await Event.findOne({
        order: [["event_date", "DESC"]],
      });
    }

    sendWelcomeEmail(email, nextEvent ? nextEvent.toJSON() : null);

    res.status(201).json({ message: "Successfully subscribed!" });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      const messages = error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ message: `Validation Error: ${messages}` });
    }

    console.error("Newsletter subscription error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
