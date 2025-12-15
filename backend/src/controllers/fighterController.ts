import { Request, Response } from "express";
import Fighter from "../models/Fighter";
import User from "../models/User";
import Division from "../models/Division";
import { Op } from "sequelize";

const divisionMap: { [key: string]: number } = {
  Lightweight: 1,
  Welterweight: 2,
  "Light Heavyweight": 3,
  Heavyweight: 4,
  Flyweight: 5,
  Bantamweight: 6,
  "Open/Heavyweight": 7,
};

const createRecordString = (w: number, l: number, d: number): string =>
  `${w}-${l}-${d}`;

export const registerFighter = async (req: Request, res: Response) => {
  const {
    email,
    country,
    walletAddress,
    weight,
    gender,
    division,
    wins,
    losses,
    draws,
    image,
    bio,
    achievements,
  } = req.body;

  if (!email || !country || !weight || !gender || !division || !image) {
    return res
      .status(400)
      .json({ message: "Missing required fighter fields." });
  }

  const divisionId = divisionMap[division];

  if (!divisionId) {
    return res.status(400).json({ message: "Invalid division name." });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found." });

    await user.update({
      user_type: "FIGHTER",
      wallet_address: walletAddress,
      country,
    });

    const fighter = await Fighter.create({
      user_id: user.id,
      name: user.name,
      country,
      division_id: divisionId,
      division,
      weight,
      gender,
      wins: wins || 0,
      losses: losses || 0,
      draws: draws || 0,
      image,
      bio,
      achievements: achievements || [],
      status: "pending",
    });

    res.status(201).json({
      message: "Fighter profile submitted successfully.",
      fighterId: fighter.id,
    });
  } catch (err) {
    console.error("Sequelize registerFighter error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllFighters = async (req: Request, res: Response) => {
  // 1. Extract Pagination Params (Default: Page 1, Limit 10)
  const {
    limit = "10",
    page = "1",
    sortBy,
    search,
    division,
    gender,
  } = req.query;

  const limitNum = Number(limit);
  const pageNum = Number(page);
  const offset = (pageNum - 1) * limitNum;

  try {
    const whereClause: any = {
      status: "verified",
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { country: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (division && division !== "all") whereClause.division = division;
    if (gender && gender !== "all") whereClause.gender = gender;

    // 2. Use findAndCountAll for Pagination
    const { count, rows: fighters } = await Fighter.findAndCountAll({
      where: whereClause,
      include: [{ model: Division, attributes: ["name"] }],
      attributes: [
        "id",
        "user_id",
        "name",
        "country",
        "division",
        "weight",
        "gender",
        "wins",
        "losses",
        "draws",
        "image",
        "ranking",
        "bio",
        "achievements",
        "sponsors",
      ],
      order: [[sortBy === "ranking" ? "ranking" : "name", "ASC"]],
      limit: limitNum,
      offset: offset,
    });

    const createRecordString = (w: number, l: number, d: number) =>
      `${w}-${l}-${d}`;

    const list = fighters.map((f) => ({
      id: f.id.toString(),
      user_id: f.user_id,
      name: f.name,
      country: f.country,
      division: f.division,
      weight: f.weight,
      gender: f.gender,
      record: createRecordString(f.wins, f.losses, f.draws),
      wins: f.wins,
      losses: f.losses,
      draws: f.draws,
      image: f.image,
      bio: f.bio ?? undefined,
      achievements: f.achievements,
      sponsors: f.sponsors,
    }));

    // 3. Return Pagination Metadata
    res.status(200).json({
      fighters: list,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error("getAllFighters Sequelize error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getFighterById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const fighter = await Fighter.findOne({
      where: { id, status: "verified" },
      include: [
        {
          model: Division,
          attributes: ["name"],
        },
      ],
    });

    if (!fighter) return res.status(404).json({ message: "Fighter not found" });

    const result = {
      id: fighter.id.toString(),
      name: fighter.name,
      country: fighter.country,
      division: fighter.division,
      weight: fighter.weight,
      gender: fighter.gender,
      record: createRecordString(fighter.wins, fighter.losses, fighter.draws),
      wins: fighter.wins,
      losses: fighter.losses,
      draws: fighter.draws,
      image: fighter.image,
      bio: fighter.bio ?? undefined,
      achievements: fighter.achievements || [],
      sponsors: fighter.sponsors || [],
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("getFighterById Sequelize error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getMyFighterProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Not authorized" });

  try {
    const fighter = await Fighter.findOne({
      where: { user_id: userId },
      include: [
        {
          model: Division,
          attributes: ["name"],
        },
      ],
    });

    if (!fighter) {
      return res.status(200).json({
        status: "not_found",
        message: "Fighter profile not found",
      });
    }

    const result = {
      id: fighter.id.toString(),
      name: fighter.name,
      country: fighter.country,
      division: fighter.division,
      weight: fighter.weight,
      gender: fighter.gender,
      record: createRecordString(fighter.wins, fighter.losses, fighter.draws),
      wins: fighter.wins,
      losses: fighter.losses,
      draws: fighter.draws,
      image: fighter.image,
      bio: fighter.bio ?? undefined,
      achievements: fighter.achievements || [],
      sponsors: fighter.sponsors || [],
      status: fighter.status,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("getMyFighterProfile Sequelize error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateFighterProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const fighter = await Fighter.findOne({ where: { user_id: userId } });

    if (!fighter) {
      return res.status(404).json({ message: "Fighter profile not found" });
    }

    // 1. Achievements: Frontend sends a stringified JSON array, parse it back
    let achievements = fighter.achievements;
    if (req.body.achievements) {
      try {
        achievements = JSON.parse(req.body.achievements);
      } catch (e) {
        // If it's already an array (middleware magic) or fails, fallback
        if (Array.isArray(req.body.achievements)) {
          achievements = req.body.achievements;
        }
      }
    }

    // 2. Update
    await fighter.update({
      name: req.body.name || fighter.name,
      country: req.body.country || fighter.country,
      division_id: req.body.division_id || fighter.division_id,
      division: req.body.division || fighter.division,
      weight: req.body.weight || fighter.weight,
      gender: req.body.gender || fighter.gender,
      bio: req.body.bio || fighter.bio,
      achievements: achievements,
      // Frontend sends the filename string now, not a file object
      image: req.body.image || fighter.image,
    });

    res.status(200).json({ message: "Profile updated successfully", fighter });
  } catch (error) {
    console.error("Error updating fighter profile:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

const parseBodyInt = (val: any) => {
  if (!val || val === "undefined" || val === "null" || val === "")
    return undefined;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? undefined : parsed;
};

// Helper to safely parse floats (for weight)
const parseBodyFloat = (val: any) => {
  if (!val || val === "undefined" || val === "null" || val === "")
    return undefined;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? undefined : parsed;
};
