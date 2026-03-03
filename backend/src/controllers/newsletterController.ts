import { Request, Response } from "express";
import { Op, ValidationError } from "sequelize";
import Subscriber from "../models/Subscriber";
import Event from "../models/Event";
import { sendWelcomeEmail } from "../utils/emailService";
import { asyncHandler, AppError } from "../utils/errorHandling";

export const subscribeToNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) throw new AppError("Email is required.", 400);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format.", 400);
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
      throw new AppError("You are already subscribed.", 409);
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
      throw new AppError(`Validation Error: ${messages}`, 400);
    }
    throw error;
  }
});
