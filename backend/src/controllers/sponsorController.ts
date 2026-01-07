import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import User from "../models/User";
import Sponsor from "../models/Sponsor";
import sequelize from "../config/sequelize";
import jwt from "jsonwebtoken";

interface SponsorRegistrationPayload {
  email: string;
  companyName: string;
  logoUrl: string;
  description: string;
  tier?: string;
  walletAddress?: string;
}

export const registerSponsor = async (
  req: Request<{}, {}, SponsorRegistrationPayload>,
  res: Response
) => {
  const { email, companyName, logoUrl, description, tier, walletAddress } =
    req.body;

  if (!email || !companyName || !logoUrl) {
    return res.status(400).json({
      message:
        "Missing required fields: user email, company name, and logo URL.",
    });
  }

  // if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
  //   return res.status(400).json({ message: "Invalid wallet address format." });
  // }

  const sponsorTier = tier || "Partner";
  let transaction: Transaction | undefined;

  try {
    transaction = await sequelize.transaction();

    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    if (walletAddress) {
      const existingWallet = await User.findOne({
        where: { wallet_address: walletAddress },
        transaction,
      });

      if (existingWallet && existingWallet.id !== user.id) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Wallet address already in use by another user.",
        });
      }
    }

    const existingSponsor = await Sponsor.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingSponsor) {
      await transaction.rollback();
      return res.status(409).json({
        message:
          "This user is already registered as a sponsor or the contact email is already used.",
      });
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
    console.error("Sponsor registration failed:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message:
          "This user is already registered as a sponsor or the contact email is already used.",
      });
    }

    res.status(500).json({
      message: "An internal server error occurred during registration.",
    });
  }
};

export const getMySponsorProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });

    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor profile not found." });
    }

    res.status(200).json(sponsor);
  } catch (error) {
    console.error("Error in getMySponsorProfile:", error);
    res.status(500).json({ message: "Server Error." });
  }
};

export const getAllSponsors = async (req: Request, res: Response) => {
  const { search } = req.query;

  try {
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
  } catch (error) {
    console.error("Error in getAllSponsors:", error);
    res.status(500).json({ message: "Server error retrieving sponsors." });
  }
};

export const updateSponsorProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });

    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor profile not found" });
    }

    await sponsor.update({
      company_name: req.body.company_name || sponsor.company_name,
      email: req.body.email || sponsor.email,
      description: req.body.description || sponsor.description,
      logo_url: req.body.logo_url || sponsor.logo_url,
    });

    res.status(200).json({ message: "Sponsor profile updated", sponsor });
  } catch (error) {
    console.error("Error updating sponsor:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};
