import { Request, Response } from "express";
import Fighter from "../models/Fighter";
import User from "../models/User";
import Donor from "../models/Donor";
import Sponsor from "../models/Sponsor";
import { Op } from "sequelize";
import Message from "../models/Message";
import EventApplication from "../models/EventApplication";
import Event from "../models/Event";
import { sendApplicationStatusEmail } from "../utils/emailService";
import { asyncHandler, AppError } from "../utils/errorHandling";

export const getPendingFighters = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Fighter.findAndCountAll({
    where: { status: "pending" },
    order: [["id", "ASC"]],
    limit,
    offset,
    attributes: [
      "id",
      "name",
      "country",
      "division",
      "weight",
      "gender",
      "wins",
      "losses",
      "draws",
    ],
  });

  res.status(200).json({
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});

export const getVerifiedFighters = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Fighter.findAndCountAll({
    where: { status: "verified" },
    order: [["name", "ASC"]],
    limit,
    offset,
    attributes: [
      "id",
      "name",
      "country",
      "division",
      "weight",
      "gender",
      "wins",
      "losses",
      "draws",
    ],
  });

  res.status(200).json({
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});

export const approveFighter = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const fighter = await Fighter.findOne({ where: { id, status: "pending" } });
  if (!fighter) {
    throw new AppError("Fighter not found or was not pending.", 404);
  }

  await fighter.update({ status: "verified" });

  if (fighter.user_id) {
    const user = await User.findByPk(fighter.user_id);
    if (user) {
      await user.update({ user_type: "FIGHTER" });
    }
  }

  res.status(200).json({ message: `Fighter ${id} approved.` });
});

export const getAllSponsors = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Sponsor.findAndCountAll({
    order: [["company_name", "ASC"]],
    limit,
    offset,
    attributes: ["id", "company_name", "email", "tier", "user_id"],
  });

  res.status(200).json({
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});

export const getAllDonors = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Donor.findAndCountAll({
    order: [["email", "ASC"]],
    limit,
    offset,
    attributes: ["id", "email", "wallet_address", "user_id"],
  });

  res.status(200).json({
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});

export const rejectFighter = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const fighter = await Fighter.findByPk(id);
  if (!fighter) {
    throw new AppError("Fighter not found.", 404);
  }

  const userId = fighter.user_id;

  await fighter.destroy();

  if (userId) {
    await Message.destroy({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const user = await User.findByPk(userId);
    if (user) await user.destroy();
  }

  res.status(200).json({ message: `Fighter ${id} deleted.` });
});

export const deleteSponsor = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const sponsor = await Sponsor.findByPk(id);
  if (!sponsor) {
    throw new AppError("Sponsor not found.", 404);
  }

  const userId = sponsor.user_id;

  await sponsor.destroy();

  if (userId) {
    await Message.destroy({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const user = await User.findByPk(userId);
    if (user) await user.destroy();
  }

  res.status(200).json({ message: "Sponsor deleted successfully." });
});

export const deleteDonor = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const donor = await Donor.findByPk(id);
  if (!donor) {
    throw new AppError("Donor not found.", 404);
  }

  const userId = donor.user_id;

  await donor.destroy();

  if (userId) {
    await Message.destroy({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const user = await User.findByPk(userId);
    if (user) await user.destroy();
  }

  res.status(200).json({ message: "Donor deleted successfully." });
});

export const getEventApplications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await EventApplication.findAndCountAll({
    where: { status: "pending" },
    limit,
    offset,
    include: [
      {
        model: Event,
        attributes: ["title", "event_date"],
      },
      {
        model: User,
        attributes: ["id", "email"],
        include: [
          {
            model: Fighter,
            attributes: ["name", "wins", "losses", "draws", "country"],
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  res.json({
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const app = await EventApplication.findByPk(id, {
    include: [
      {
        model: User,
        attributes: ["email"],
        include: [{ model: Fighter, attributes: ["name"] }],
      },
      { model: Event, attributes: ["title"] },
    ],
  });

  if (!app) throw new AppError("Application not found", 404);

  await app.update({ status });

  const userEmail = (app as any).User?.email;
  const fighterName = (app as any).User?.Fighter?.name || "Fighter";
  const eventTitle = (app as any).Event?.title || "the event";

  if (userEmail) {
    sendApplicationStatusEmail(userEmail, fighterName, eventTitle, status);
  }

  res.json({ message: `Application marked as ${status} and email sent.` });
});
