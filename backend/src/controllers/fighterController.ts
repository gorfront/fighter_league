import { Request, Response } from "express";
import Fighter from "../models/Fighter";
import User from "../models/User";
import Division from "../models/Division";
import { Op } from "sequelize";
import sequelize from "../config/sequelize";
import { updateFighterRanks } from "../services/rankingService";
import { asyncHandler, AppError } from "../utils/errorHandling";

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

export const registerFighter = asyncHandler(async (req: Request, res: Response) => {
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
    knockouts,
    image,
    bio,
    achievements,
    age,
    height,
    reach,
  } = req.body;

  const divisionId = divisionMap[division];

  if (!divisionId) {
    throw new AppError("Invalid division name.", 400);
  }

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findOne({ where: { email }, transaction });

    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found.", 404);
    }

    await user.update({
      user_type: "FIGHTER",
      wallet_address: walletAddress,
      country,
    }, { transaction });

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
      knockouts: knockouts || 0,

      age: age || null,
      height: height || null,
      reach: reach || null,

      image,
      bio,
      achievements: achievements || [],
      status: "pending",
      ranking: 9999,
    }, { transaction });

    await transaction.commit();

    updateFighterRanks().catch((err) =>
      console.error("Auto-ranking failed:", err)
    );

    res.status(201).json({
      message: "Fighter profile submitted successfully.",
      fighterId: fighter.id,
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
});

export const getAllFighters = asyncHandler(async (req: Request, res: Response) => {
  const {
    limit = "10",
    page = "1",
    sortBy,
    search,
    division,
    gender,
  } = req.query;

  const parsedLimit = parseInt(limit as string, 10);
  const parsedPage = parseInt(page as string, 10);
  const limitNum = isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : parsedLimit;
  const pageNum = isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
  const offset = (pageNum - 1) * limitNum;

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
    order: [[sortBy === "name" ? "name" : "ranking", "ASC"]],
    limit: limitNum,
    offset: offset,
  });

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
    ranking: f.ranking,
    bio: f.bio ?? undefined,
    achievements: f.achievements,
    sponsors: f.sponsors,
  }));

  res.status(200).json({
    fighters: list,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      itemsPerPage: limitNum,
    },
  });
});

export const getFighterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const fighter = await Fighter.findOne({
    where: { id },
    include: [
      {
        model: Division,
        attributes: ["name"],
      },
    ],
  });

  if (!fighter) throw new AppError("Fighter not found", 404);

  const result = {
    id: fighter.id.toString(),
    user_id: fighter.user_id,
    name: fighter.name,
    country: fighter.country,
    division: fighter.division,
    weight: fighter.weight,
    gender: fighter.gender,
    record: createRecordString(fighter.wins, fighter.losses, fighter.draws),
    wins: fighter.wins,
    losses: fighter.losses,
    draws: fighter.draws,
    ranking: fighter.ranking,
    image: fighter.image,
    bio: fighter.bio ?? undefined,
    achievements: fighter.achievements || [],
    sponsors: fighter.sponsors || [],
    status: fighter.status,
  };

  res.status(200).json(result);
});

export const getMyFighterProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) throw new AppError("Not authorized", 401);

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
    user_id: fighter.user_id,
    name: fighter.name,
    country: fighter.country,
    division: fighter.division,
    weight: fighter.weight,
    gender: fighter.gender,
    record: createRecordString(fighter.wins, fighter.losses, fighter.draws),
    wins: fighter.wins,
    losses: fighter.losses,
    draws: fighter.draws,
    ranking: fighter.ranking,
    image: fighter.image,
    bio: fighter.bio ?? undefined,
    achievements: fighter.achievements || [],
    sponsors: fighter.sponsors || [],
    status: fighter.status,
  };

  res.status(200).json(result);
});

export const updateFighterProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const fighter = await Fighter.findOne({ where: { user_id: userId } });

  if (!fighter) {
    throw new AppError("Fighter profile not found", 404);
  }

  const newDivision = req.body.division;
  const newDivisionId = req.body.division_id;

  const isSwitchingDivision =
    (newDivision && newDivision !== fighter.division) ||
    (newDivisionId && newDivisionId !== fighter.division_id);

  let achievements = fighter.achievements;
  if (req.body.achievements) {
    try {
      achievements = JSON.parse(req.body.achievements);
    } catch (e) {
      if (Array.isArray(req.body.achievements)) {
        achievements = req.body.achievements;
      }
    }
  }

  await fighter.update({
    name: req.body.name || fighter.name,
    country: req.body.country || fighter.country,
    division_id: req.body.division_id || fighter.division_id,
    division: req.body.division || fighter.division,
    weight: req.body.weight || fighter.weight,
    gender: req.body.gender || fighter.gender,
    bio: req.body.bio || fighter.bio,
    achievements: achievements,
    image: req.body.image || fighter.image,
  });

  if (isSwitchingDivision) {
    console.log(
      `🔄 Fighter ${fighter.name} switched division. Recalculating ranks...`
    );
    updateFighterRanks().catch((err) =>
      console.error("Rank update failed:", err)
    );
  }

  res.status(200).json({ message: "Profile updated successfully", fighter });
});

export const refreshAllRanks = asyncHandler(async (req: Request, res: Response) => {
  console.log("Admin initiated manual rank update...");

  await updateFighterRanks();

  res.status(200).json({
    message: "Success! All fighter ranks have been recalculated and updated.",
  });
});
