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

export const getPendingFighters = async (req: Request, res: Response) => {
  try {
    const fighters = await Fighter.findAll({
      where: { status: "pending" },
      order: [["id", "ASC"]],
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

    res.status(200).json(fighters);
  } catch (error) {
    console.error("getPendingFighters Sequelize error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getVerifiedFighters = async (req: Request, res: Response) => {
  try {
    const fighters = await Fighter.findAll({
      where: { status: "verified" },
      order: [["name", "ASC"]],
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

    res.status(200).json(fighters);
  } catch (error) {
    console.error("getVerifiedFighters Sequelize error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const approveFighter = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const fighter = await Fighter.findOne({ where: { id, status: "pending" } });
    if (!fighter) {
      return res
        .status(404)
        .json({ message: "Fighter not found or was not pending." });
    }

    await fighter.update({ status: "verified" });

    if (fighter.user_id) {
      const user = await User.findByPk(fighter.user_id);
      if (user) {
        await user.update({ user_type: "FIGHTER" });
      }
    }

    res.status(200).json({ message: `Fighter ${id} approved.` });
  } catch (error) {
    console.error("approveFighter Sequelize error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllSponsors = async (req: Request, res: Response) => {
  try {
    const sponsors = await Sponsor.findAll({
      order: [["company_name", "ASC"]],
      attributes: ["id", "company_name", "email", "tier", "user_id"],
    });
    res.status(200).json(sponsors);
  } catch (error) {
    console.error("getAllSponsors error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllDonors = async (req: Request, res: Response) => {
  try {
    const donors = await Donor.findAll({
      order: [["email", "ASC"]],
      attributes: ["id", "email", "wallet_address", "user_id"],
    });
    res.status(200).json(donors);
  } catch (error) {
    console.error("getAllDonors error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const rejectFighter = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const fighter = await Fighter.findByPk(id);
    if (!fighter) {
      return res.status(404).json({ message: "Fighter not found." });
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
  } catch (error) {
    console.error("rejectFighter Sequelize error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteSponsor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const sponsor = await Sponsor.findByPk(id);
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found." });
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
  } catch (error) {
    console.error("deleteSponsor error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteDonor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
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
  } catch (error) {
    console.error("deleteDonor error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getEventApplications = async (req: Request, res: Response) => {
  try {
    const apps = await EventApplication.findAll({
      where: { status: "pending" },
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
    res.json(apps);
  } catch (error) {
    console.error("getEventApplications error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
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

    if (!app) return res.status(404).json({ message: "Application not found" });

    await app.update({ status });

    const userEmail = (app as any).User?.email;
    const fighterName = (app as any).User?.Fighter?.name || "Fighter";
    const eventTitle = (app as any).Event?.title || "the event";

    if (userEmail) {
      sendApplicationStatusEmail(userEmail, fighterName, eventTitle, status);
    }

    res.json({ message: `Application marked as ${status} and email sent.` });
  } catch (error) {
    console.error("updateApplicationStatus error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
