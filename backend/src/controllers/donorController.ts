import { Request, Response } from "express";
import { Transaction } from "sequelize";
import User from "../models/User";
import Donor from "../models/Donor";
import sequelize from "../config/sequelize";

interface DonorRegistrationPayload {
  email: string;
  walletAddress?: string;
  logo_url?: string;
}

export const registerDonor = async (
  req: Request<{}, {}, DonorRegistrationPayload>,
  res: Response
) => {
  const { email, walletAddress, logo_url } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Missing required field: user email.",
    });
  }

  let transaction: Transaction | undefined;

  try {
    transaction = await sequelize.transaction();

    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    const existingDonor = await Donor.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingDonor) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "This user is already registered as a donor." });
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

    res.status(201).json({
      message: "Donor profile created successfully and user profile updated.",
      donorId: donor.id,
    });
  } catch (error: any) {
    if (transaction) await transaction.rollback();
    console.error("Donor registration failed:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "This user is already registered as a donor." });
    }

    res.status(500).json({
      message: "An internal server error occurred during registration.",
    });
  }
};
