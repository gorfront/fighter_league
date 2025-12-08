import { Request, Response } from "express";
import Fighter from "../models/Fighter";
import User from "../models/User";

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

export const rejectFighter = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const fighter = await Fighter.findByPk(id);
    if (!fighter) {
      return res.status(404).json({ message: "Fighter not found." });
    }

    await fighter.destroy();

    if (fighter.user_id) {
      const user = await User.findByPk(fighter.user_id);
      if (user) await user.destroy();
    }

    res.status(200).json({ message: `Fighter ${id} deleted.` });
  } catch (error) {
    console.error("rejectFighter Sequelize error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
