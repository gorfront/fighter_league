import { Request, Response } from "express";
import { Transaction } from "sequelize";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Donor from "../models/Donor";
import sequelize from "../config/sequelize";
import { asyncHandler, AppError } from "../utils/errorHandling";

interface DonorRegistrationPayload {
  email: string;
  walletAddress?: string;
  logo_url?: string;
}

export const registerDonor = asyncHandler(async (
  req: Request<{}, {}, DonorRegistrationPayload>,
  res: Response
) => {
  const { email, walletAddress, logo_url } = req.body;

  if (!email) {
    throw new AppError("Missing required field: user email.", 400);
  }

  let transaction: Transaction | undefined;

  try {
    transaction = await sequelize.transaction();

    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found.", 404);
    }

    const existingDonor = await Donor.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingDonor) {
      await transaction.rollback();
      throw new AppError("This user is already registered as a donor.", 409);
    }

    await user.update(
      { user_type: "DONOR", wallet_address: walletAddress },
      { transaction }
    );

    const donor = await Donor.create(
      {
        email: user.email,
        password: user.password,
        user_id: user.id,
        logo_url,
        wallet_address: walletAddress,
      },
      { transaction }
    );

    await transaction.commit();

    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: "DONOR",
        name: user.name,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Donor profile created successfully.",
      donorId: donor.id,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: "DONOR",
        wallet_address: user.wallet_address,
      },
    });
  } catch (error: any) {
    if (transaction) await transaction.rollback();

    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new AppError("This user is already registered as a donor.", 409);
    }

    throw new AppError("An internal server error occurred during registration.", 500);
  }
});

export const getDonorProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);
  const donor = await Donor.findOne({ where: { user_id: userId } });
  if (!donor) throw new AppError("Donor profile not found", 404);
  res.json(donor);
});

export const updateDonorProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);
  const donor = await Donor.findOne({ where: { user_id: userId } });
  if (!donor) throw new AppError("Donor profile not found", 404);
  await donor.update({
    email: req.body.email || donor.email,
    wallet_address: req.body.wallet_address || donor.wallet_address,
    logo_url: req.body.logo_url || donor.logo_url,
  });
  res.json({ message: "Profile updated successfully", donor });
});
