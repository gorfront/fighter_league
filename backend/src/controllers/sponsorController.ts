import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import User from "../models/User";
import Sponsor from "../models/Sponsor";
import sequelize from "../config/sequelize";
import jwt from "jsonwebtoken";
import { asyncHandler, AppError } from "../utils/errorHandling";

interface SponsorRegistrationPayload {
  email: string;
  companyName: string;
  logoUrl: string;
  description: string;
  tier?: string;
  walletAddress?: string;
}

export const registerSponsor = asyncHandler(async (
  req: Request<{}, {}, SponsorRegistrationPayload>,
  res: Response
) => {
  const { email, companyName, logoUrl, description, tier, walletAddress } =
    req.body;

  if (!email || !companyName || !logoUrl) {
    throw new AppError("Missing required fields: user email, company name, and logo URL.", 400);
  }

  // if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
  //   throw new AppError("Invalid wallet address format.", 400);
  // }

  const sponsorTier = tier || "Partner";
  let transaction: Transaction | undefined;

  try {
    transaction = await sequelize.transaction();

    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      throw new AppError("User not found.", 404);
    }

    if (walletAddress) {
      const existingWallet = await User.findOne({
        where: { wallet_address: walletAddress },
        transaction,
      });

      if (existingWallet && existingWallet.id !== user.id) {
        await transaction.rollback();
        throw new AppError("Wallet address already in use by another user.", 409);
      }
    }

    const existingSponsor = await Sponsor.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingSponsor) {
      await transaction.rollback();
      throw new AppError("This user is already registered as a sponsor or the contact email is already used.", 409);
    }

    await user.update(
      { user_type: "SPONSOR", wallet_address: walletAddress || null },
      { transaction }
    );

    const sponsor = await Sponsor.create(
      {
        email: user.email,
        password: user.password,
        user_id: user.id,
        company_name: companyName,
        logo_url: logoUrl,
        description,
        tier: sponsorTier,
      },
      { transaction }
    );

    await transaction.commit();

    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: "SPONSOR",
        name: user.name,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Sponsor registration completed successfully.",
      sponsorId: sponsor.id,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: "SPONSOR",
        wallet_address: user.wallet_address,
      },
    });
  } catch (error: any) {
    if (transaction) await transaction.rollback();

    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new AppError("This user is already registered as a sponsor or the contact email is already used.", 409);
    }

    throw new AppError("An internal server error occurred during registration.", 500);
  }
});

export const getMySponsorProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required.", 401);
  }

  const sponsor = await Sponsor.findOne({ where: { user_id: userId } });

  if (!sponsor) {
    throw new AppError("Sponsor profile not found.", 404);
  }

  res.status(200).json(sponsor);
});

export const getAllSponsors = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause: any = {};

  if (search) {
    whereClause.company_name = { [Op.iLike]: `%${search}%` };
  }

  const sponsors = await Sponsor.findAll({
    where: whereClause,
    order: [["company_name", "ASC"]],
    attributes: [
      "id",
      "user_id",
      "company_name",
      "logo_url",
      "description",
      "tier",
    ],
  });

  res.status(200).json({ sponsors });
});

export const updateSponsorProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const sponsor = await Sponsor.findOne({ where: { user_id: userId } });

  if (!sponsor) {
    throw new AppError("Sponsor profile not found", 404);
  }

  await sponsor.update({
    company_name: req.body.company_name || sponsor.company_name,
    email: req.body.email || sponsor.email,
    description: req.body.description || sponsor.description,
    logo_url: req.body.logo_url || sponsor.logo_url,
  });

  res.status(200).json({ message: "Sponsor profile updated", sponsor });
});
