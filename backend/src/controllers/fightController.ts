import { Request, Response } from "express";
import Fight from "../models/Fight";
import Fighter from "../models/Fighter";
import User from "../models/User";
import { sendFightMatchEmail } from "../utils/emailService";
import Event from "../models/Event";

export const createFight = async (req: Request, res: Response) => {
  try {
    const {
      event_id,
      red_corner_id,
      blue_corner_id,
      weight_class,
      is_title_fight,
      order_index,
    } = req.body;

    const fight = await Fight.create({
      event_id,
      red_corner_id,
      blue_corner_id,
      weight_class,
      is_title_fight,
      order_index,
    });

    const fightDetails = await Fight.findByPk(fight.id, {
      include: [
        {
          model: Fighter,
          as: "redCorner",
          include: [{ model: User, attributes: ["email"] }],
        },
        {
          model: Fighter,
          as: "blueCorner",
          include: [{ model: User, attributes: ["email"] }],
        },
        { model: Event, attributes: ["title", "event_date", "location"] },
      ],
    });

    if (fightDetails) {
      const eventName = (fightDetails as any).Event?.title;
      const eventDate = new Date(
        (fightDetails as any).Event?.event_date
      ).toDateString();
      const location = (fightDetails as any).Event?.location;

      const redFighter = (fightDetails as any).redCorner;
      const blueFighter = (fightDetails as any).blueCorner;

      if (redFighter?.User?.email) {
        await sendFightMatchEmail(
          redFighter.User.email,
          redFighter.name,
          blueFighter.name,
          eventName,
          eventDate,
          location
        );
      }

      if (blueFighter?.User?.email) {
        await sendFightMatchEmail(
          blueFighter.User.email,
          blueFighter.name,
          redFighter.name,
          eventName,
          eventDate,
          location
        );
      }
    }

    res.status(201).json(fight);
  } catch (error) {
    console.error("createFight error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateFight = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const fight = await Fight.findByPk(id);
    if (!fight) return res.status(404).json({ message: "Fight not found" });

    await fight.update(req.body);
    res.json(fight);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteFight = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await Fight.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "Fight not found" });
    res.json({ message: "Fight deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getFightsByEventId = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  try {
    const fights = await Fight.findAll({
      where: { event_id: eventId },
      include: [
        { model: Fighter, as: "redCorner" },
        { model: Fighter, as: "blueCorner" },
      ],
      order: [["order_index", "ASC"]],
    });
    res.json(fights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
