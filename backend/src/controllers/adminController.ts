import { Request, Response } from "express";
import Fighter from "../models/Fighter";
import User from "../models/User";
import Donor from "../models/Donor";
import Sponsor from "../models/Sponsor";
import { Op } from "sequelize";
import Message from "../models/Message";

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

    // 1. Delete Fighter Profile
    await fighter.destroy();

    // 2. If User exists, clean up Messages then User
    if (userId) {
      // 🛠️ FIX: Delete all messages associated with this user first
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
      // 🛠️ FIX: Delete messages first
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
      // 🛠️ FIX: Delete messages first
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
