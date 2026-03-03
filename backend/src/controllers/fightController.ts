import { Request, Response } from "express";
import Fight from "../models/Fight";
import Fighter from "../models/Fighter";
import User from "../models/User";
import { sendFightMatchEmail } from "../utils/emailService";
import Event from "../models/Event";
import { updateFighterRanks } from "../services/rankingService";
import { asyncHandler, AppError } from "../utils/errorHandling";

export const getFightById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const fight = await Fight.findByPk(id, {
    include: [
      {
        model: Fighter,
        as: "redCorner",
        include: [{ model: User, attributes: ["country"] }],
      },
      {
        model: Fighter,
        as: "blueCorner",
        include: [{ model: User, attributes: ["country"] }],
      },
      {
        model: Event,
        attributes: ["title", "event_date", "location"],
      },
    ],
  });

  if (!fight) {
    throw new AppError("Fight not found", 404);
  }

  res.json(fight);
});

export const createFight = asyncHandler(async (req: Request, res: Response) => {
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
      ).catch(console.error);
    }

    if (blueFighter?.User?.email) {
      await sendFightMatchEmail(
        blueFighter.User.email,
        blueFighter.name,
        redFighter.name,
        eventName,
        eventDate,
        location
      ).catch(console.error);
    }
  }

  res.status(201).json(fight);
});

export const updateFight = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const fight = await Fight.findByPk(id);
  if (!fight) throw new AppError("Fight not found", 404);

  const wasCompleted = req.body.winner_id || req.body.status === "completed";

  await fight.update(req.body);

  if (wasCompleted) {
    updateFighterRanks().catch(console.error);
  }

  res.json(fight);
});

export const deleteFight = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const deleted = await Fight.destroy({ where: { id } });
  if (!deleted) throw new AppError("Fight not found", 404);
  res.json({ message: "Fight deleted" });
});

export const getFightsByEventId = asyncHandler(async (req: Request, res: Response) => {
  const targetId = req.params.eventId || req.params.id;

  const fights = await Fight.findAll({
    where: { event_id: targetId },
    include: [
      { model: Fighter, as: "redCorner" },
      { model: Fighter, as: "blueCorner" },
    ],
    // УДАЛИ ИЛИ ЗАКОММЕНТИРУЙ ЭТУ СТРОКУ:
    // order: [["order_index", "ASC"]], 
  });

  res.json(fights);
});